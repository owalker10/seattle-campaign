import { RealtimePostgresChangesPayload, createClient } from '@supabase/supabase-js';
import React from 'react';
import { Database } from '../../database.types';
import { atomFamily } from 'jotai/utils';
import { atom, useAtom } from 'jotai';
import { CHARACTERS, DICE, STATS } from './constants';
import debounce from 'lodash/debounce';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const session_id = uuidv4();

type Tables = Database['public']['Tables'];

export type CharacterStat = (typeof STATS)[number];
export type DieType = (typeof DICE)[number];

export type CharacterData = {
  id: string;
  adversity: number;
  stats: Partial<Record<CharacterStat, DieType>>;
  status: string;
};

const createCharacter = (id: string) => ({
  id,
  adversity: 2,
  stats: {},
  status: '',
});

type ReducerValues = {
  adversity: number;
  stats: [string, string];
  status: string;
};

type Action = {
  [K in keyof ReducerValues]: {
    type: K;
    newValue: ReducerValues[K];
    remote?: true;
  };
}[keyof ReducerValues];

const debouncedUpsertStatus = Object.fromEntries(
  Object.keys(CHARACTERS).map((id) => [
    id,
    debounce((status: string) => {
      supabase
        .from('status')
        .upsert({ player: id, status, session_id }, { onConflict: 'player' })
        .then(() => {
          isDebouncingStatus[id] = false;
        });
    }, 500),
  ])
);
const isDebouncingStatus = Object.fromEntries(Object.keys(CHARACTERS).map((id) => [id, false]));

const baseAtomFamily = atomFamily((id: string) => atom(createCharacter(id)));

// todo: add middleware in the setter to write POSTs (this should make everything optimistic for free?)
export const characterAtomFamily = atomFamily(
  (id: string) =>
    atom(
      (get) => get(baseAtomFamily(id)),
      async (get, set, action: Action) => {
        const prev = get(baseAtomFamily(id));
        const newData = { ...prev };
        switch (action.type) {
          case 'adversity':
            newData.adversity = action.newValue;
            set(baseAtomFamily(id), newData);
            if (!action.remote) {
              await supabase
                .from('adversity')
                .upsert(
                  { player: id, adversity: action.newValue, session_id },
                  { onConflict: 'player' }
                );
            }
            break;
          case 'status':
            newData.status = action.newValue;
            set(baseAtomFamily(id), newData);
            if (!action.remote) {
              debouncedUpsertStatus[id](action.newValue);
              isDebouncingStatus[id] = true;
            }
            break;
          case 'stats':
            const [stat, die] = action.newValue;
            newData.stats = { ...newData.stats, [stat]: die };
            set(baseAtomFamily(id), newData);
            if (!action.remote) {
              await supabase
                .from('stats')
                .upsert({ player: id, stat, die, session_id }, { onConflict: 'player, stat' });
            }
            break;
        }
      }
    )

  //   atomWithReducer<CharacterData, Action>(
  //     createCharacter(id),
  //     (prev: CharacterData, action: Action) => {
  //       const newData = { ...prev };
  //       switch (action.type) {
  //         case 'adversity':
  //           if (!action.remote) {
  //             supabase
  //               .from('adversity')
  //               .upsert({ player: id, adversity: action.newValue }, { onConflict: 'player' });
  //           }
  //           newData.adversity = action.newValue;
  //           break;
  //         case 'status':
  //           if (!action.remote) {
  //             debouncedUpsertStatus[id](action.newValue);
  //             isDebouncingStatus[id] = true;
  //           }
  //           newData.status = action.newValue;
  //         case 'stats':
  //           const [stat, die] = action.newValue;
  //           if (!action.remote) {
  //             supabase
  //               .from('stats')
  //               .upsert({ player: id, stat, die }, { onConflict: 'player, stat' })
  //               .then(console.log);
  //           }
  //           newData.stats = { ...newData.stats, [stat]: die };
  //       }
  //       return newData;
  //     }
);

const characterAtoms = Object.fromEntries(
  Object.keys(CHARACTERS).map((id) => [id, characterAtomFamily(id)])
);

async function initData(
  characterData: Record<string, [CharacterData, (action: Action) => void]>,
  onFinish: () => void
) {
  await Promise.all(
    Object.entries(characterData).map(async ([id, [, setAtom]]) => {
      // adversity
      const { data: adversityData } = await supabase
        .from('adversity')
        .select('player, adversity')
        .eq('player', id);
      if (adversityData && adversityData.length >= 1) {
        setAtom({ type: 'adversity', newValue: adversityData[0].adversity, remote: true });
      }
      // status
      const { data: statusData } = await supabase
        .from('status')
        .select('player, status')
        .eq('player', id);
      if (statusData && statusData.length >= 1) {
        setAtom({ type: 'status', newValue: statusData[0].status, remote: true });
      }
      // stats
      STATS.forEach(async (stat) => {
        const { data: statData } = await supabase
          .from('stats')
          .select('player, stat, die')
          .eq('player', id)
          .eq('stat', stat);
        if (statData && statData.length >= 1) {
          setAtom({ type: 'stats', newValue: [statData[0].stat, statData[0].die], remote: true });
        }
      });
    })
  );
  onFinish();
}

export function useSupabaseChannel() {
  // hooks in a loop are safe because the length of characters is constant
  const characterData: Record<string, [CharacterData, (action: Action) => void]> =
    Object.fromEntries(Object.entries(characterAtoms).map(([id, atom]) => [id, useAtom(atom)]));

  const [loading, setLoading] = React.useState(true);
  const init = React.useRef(false);

  React.useEffect(() => {
    if (!init.current) {
      init.current = true;
      initData(characterData, () => setLoading(false));
    }
  }, [loading, setLoading]);

  const onPayload = (
    payload: RealtimePostgresChangesPayload<{
      [key: string]: any;
    }>
  ) => {
    if ((payload.new as any).session_id == session_id) {
      return;
    }
    switch (payload.table) {
      case 'adversity': {
        const row = payload.new as Tables['adversity']['Row'];
        if (!(row.player in characterData)) return;
        const [, setAtom] = characterData[row.player];
        setAtom({ type: 'adversity', newValue: row.adversity, remote: true });
        break;
      }
      case 'status': {
        const row = payload.new as Tables['status']['Row'];
        if (!(row.player in characterData)) return;
        if (!isDebouncingStatus[row.player]) {
          const [, setAtom] = characterData[row.player];
          setAtom({ type: 'status', newValue: row.status, remote: true });
        }
        break;
      }
      case 'stats': {
        const row = payload.new as Tables['stats']['Row'];
        if (!(row.player in characterData)) return;
        const [, setAtom] = characterData[row.player];
        setAtom({ type: 'stats', newValue: [row.stat, row.die], remote: true });
        break;
      }
    }
  };

  React.useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
        },
        onPayload
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return loading;
}
