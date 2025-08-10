import { RealtimePostgresChangesPayload, createClient } from '@supabase/supabase-js';
import React from 'react';
import { Database } from '../../database.types';
import { atomFamily } from 'jotai/utils';
import { atom, useAtom, useSetAtom } from 'jotai';
import { CHARACTERS, DICE, STATS } from './constants';
import debounce from 'lodash/debounce';
import { v4 as uuidv4 } from 'uuid';
import { generateKeyBetween } from 'fractional-indexing';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const session_id = uuidv4();

type Tables = Database['public']['Tables'];

export type CharacterStat = (typeof STATS)[number];
export type DieType = (typeof DICE)[number];

export type InventoryItem = {
  id: string;
  name: string;
  description: string;
  order: string;
};

export type CharacterData = {
  id: string;
  adversity: number;
  stats: Partial<Record<CharacterStat, DieType>>;
  status: string;
  inventory: InventoryItem[];
  aimg: number;
};

// default character object
const createCharacter = (id: string): CharacterData => ({
  id,
  adversity: 2,
  stats: {},
  status: '',
  inventory: [],
  aimg: 0,
});

type ReducerValues = {
  adversity: number;
  stats: [string, string];
  status: string;
  inventory: InventoryItem[];
  ['inventory-item']: InventoryItem | string;
  ['delete-inventory']: string;
  aimg: number;
};

type Action = {
  [K in keyof ReducerValues]: {
    type: K;
    newValue: ReducerValues[K];
    remote?: true;
  };
}[keyof ReducerValues];

// debounce the supabase write for status so we aren't making one request per character typed
// we know on load that we need one fn per character
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

const baseEltaisScoreAtom = atom<number>(135);
export const eltaisScoreAtom = atom(
  (get) => get(baseEltaisScoreAtom),
  async (_, set, payload: { score: number; remote: boolean }) => {
    set(baseEltaisScoreAtom, payload.score);
    if (!payload.remote) {
      await supabase
        .from('eltais_score')
        .upsert({ id: 1, score: payload.score, session_id }, { onConflict: 'id' });
    }
  }
);

export const characterAtomFamily = atomFamily((id: string) =>
  atom(
    (get) => get(baseAtomFamily(id)),
    async (get, set, action: Action) => {
      const prev = get(baseAtomFamily(id));
      const newData = { ...prev };
      // The setter is a reducer
      switch (action.type) {
        case 'adversity':
          const adversity = action.newValue;
          if (adversity < 0) return;
          newData.adversity = adversity;
          set(baseAtomFamily(id), newData);
          if (!action.remote) {
            await supabase
              .from('adversity')
              .upsert({ player: id, adversity, session_id }, { onConflict: 'player' });
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
        case 'inventory':
          const items = action.newValue;
          newData.inventory = items;
          set(baseAtomFamily(id), newData);
          break;
        case 'inventory-item':
          const lastItem = newData.inventory.at(-1);
          const order = generateKeyBetween(lastItem?.order ?? null, null);
          const newItem: InventoryItem =
            typeof action.newValue === 'string'
              ? {
                  id: action.newValue,
                  name: '',
                  description: '',
                  order,
                }
              : action.newValue;
          newData.inventory = newData.inventory.filter((item) => item.id !== newItem.id);
          newData.inventory.push(newItem);
          set(baseAtomFamily(id), newData);
          if (!action.remote) {
            await supabase.from('inventory').upsert(
              {
                player: id,
                name: newItem.name,
                description: newItem.description,
                session_id,
                order: newItem.order,
                id: newItem.id,
              },
              { onConflict: 'id' }
            );
          }
          break;
        case 'delete-inventory':
          newData.inventory = newData.inventory.filter((item) => item.id !== action.newValue);
          set(baseAtomFamily(id), newData);
          if (!action.remote) {
            await supabase.from('inventory').delete().eq('id', action.newValue);
          }
          break;
        case 'aimg':
          newData.aimg = action.newValue;
          set(baseAtomFamily(id), newData);
          if (!action.remote) {
            await supabase
              .from('aimg')
              .upsert({ value: action.newValue, session_id, player: id }, { onConflict: 'player' });
          }
          break;
      }
    }
  )
);

const characterAtoms = Object.fromEntries(
  Object.keys(CHARACTERS).map((id) => [id, characterAtomFamily(id)])
);

// on client load we have to fetch the existing data for each character
async function initData(
  characterData: Record<string, [CharacterData, (action: Action) => void]>,
  setEltaisScore: (payload: { score: number; remote: boolean }) => void,
  onFinish: () => void
) {
  // this is a global constant, we expect the row id to be `1`
  const getEltaisScore = async () => {
    const { data } = await supabase.from('eltais_score').select('score, id').eq('id', 1);
    if (data && data.length == 1) {
      setEltaisScore({ score: data[0].score, remote: true });
    } else if (data && data.length > 1) {
      console.error('More than one row in eltais_score table');
    }
  };

  await Promise.all([
    ...Object.entries(characterData).map(async ([id, [, setAtom]]) => {
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
        if (statData && statData.length > 0) {
          setAtom({ type: 'stats', newValue: [statData[0].stat, statData[0].die], remote: true });
        }
      });
      // inventory
      const { data: inventoryData } = await supabase
        .from('inventory')
        .select('player, name, description, id, order')
        .eq('player', id);
      if (inventoryData && inventoryData.length > 0) {
        setAtom({
          type: 'inventory',
          newValue: (inventoryData as Tables['inventory']['Row'][]).map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            order: item.order,
          })),
          remote: true,
        });
      }
      // aimg
      const { data: aimgData } = await supabase
        .from('aimg')
        .select('player, value')
        .eq('player', id);
      if (aimgData && aimgData.length >= 1) {
        setAtom({ type: 'aimg', newValue: aimgData[0].value, remote: true });
      }
    }),
    getEltaisScore(),
  ]);
  onFinish();
}

export function useSupabaseChannel() {
  // hooks in a loop are safe because CHARACTERS is a constant
  const characterData: Record<string, [CharacterData, (action: Action) => void]> =
    Object.fromEntries(Object.entries(characterAtoms).map(([id, atom]) => [id, useAtom(atom)]));
  const dataRef = React.useRef(characterData);
  const setEltaisScore = useSetAtom(eltaisScoreAtom);

  // keep ref in sync with the latest data
  React.useEffect(() => {
    dataRef.current = characterData;
  }, [characterData]);

  const [loading, setLoading] = React.useState(true);
  const init = React.useRef(false);

  // initialize data once per app mount
  React.useEffect(() => {
    if (!init.current) {
      init.current = true;
      initData(characterData, setEltaisScore, () => setLoading(false));
    }
  }, [loading, setLoading]);

  // any time any table is updated by another client, update our local state
  const onPayload = (
    payload: RealtimePostgresChangesPayload<{
      [key: string]: any;
    }>
  ) => {
    const data = dataRef.current;
    // we don't need to handle updates that we made since they're already in our local state
    if ((payload.new as any).session_id == session_id) {
      return;
    }
    switch (payload.table) {
      case 'adversity': {
        const row = payload.new as Tables['adversity']['Row'];
        if (!(row.player in data)) return;
        const [, setAtom] = data[row.player];
        setAtom({ type: 'adversity', newValue: row.adversity, remote: true });
        break;
      }
      case 'status': {
        const row = payload.new as Tables['status']['Row'];
        if (!(row.player in data)) return;
        if (!isDebouncingStatus[row.player]) {
          const [, setAtom] = data[row.player];
          setAtom({ type: 'status', newValue: row.status, remote: true });
        }
        break;
      }
      case 'stats': {
        const row = payload.new as Tables['stats']['Row'];
        if (!(row.player in characterData)) return;
        const [, setAtom] = data[row.player];
        setAtom({ type: 'stats', newValue: [row.stat, row.die], remote: true });
        break;
      }
      case 'inventory': {
        if (payload.eventType == 'DELETE') {
          Object.keys(CHARACTERS).some((player: string) => {
            const inventory = data[player][0].inventory;
            if (inventory.find((item) => item.id == payload.old.id)) {
              const [, setAtom] = data[player];
              setAtom({ type: 'delete-inventory', newValue: payload.old.id });
              return true;
            }
            return false;
          });
          break;
        }
        const row = payload.new as Tables['inventory']['Row'];
        if (!(row.player in data)) return;
        const [, setAtom] = data[row.player];
        setAtom({
          type: 'inventory-item',
          newValue: {
            name: row.name,
            description: row.description,
            order: row.order,
            id: row.id,
          },
          remote: true,
        });
        break;
      }
      case 'aimg': {
        const row = payload.new as Tables['aimg']['Row'];
        if (!(row.player in data)) return;
        const [, setAtom] = data[row.player];
        setAtom({ type: 'aimg', newValue: row.value, remote: true });
        break;
      }
      case 'eltais_score': {
        const { score } = payload.new as Tables['eltais_score']['Row'];
        setEltaisScore({ score, remote: true });
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
