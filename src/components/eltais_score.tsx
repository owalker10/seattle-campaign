import { useAtom } from 'jotai';
import { eltaisScoreAtom } from '../util/supabase';
import { Button, Flex, InputNumber, Modal, Tooltip, Typography } from 'antd';
import React from 'react';
import { IconList } from '@tabler/icons-react';

const { Text, Title } = Typography;

export function EltaisScore() {
  const [score, setScore] = useAtom(eltaisScoreAtom);
  const onChange = React.useCallback(
    (newScore: number | null) => {
      if (newScore) {
        setScore({ score: newScore, remote: false });
      }
    },
    [score, setScore]
  );

  return (
    <Flex style={{ margin: '0px 16px' }} align="center" gap={8}>
      <Text>Eltais points</Text>
      <InputNumber defaultValue={135} max={200} min={0} value={score} onChange={onChange} />
      <Menu />
    </Flex>
  );
}

function Menu() {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <>
      <Tooltip title="View menu">
        <Button
          icon={<IconList style={{ strokeWidth: 1, height: 20, marginTop: 2 }} />}
          onClick={() => setModalOpen(true)}
        />
      </Tooltip>
      <Modal
        title={
          <Title level={2} style={{ marginTop: 8 }}>
            Eltais Point Menu
          </Title>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        okButtonProps={{ style: { display: 'none' } }}
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <Flex vertical gap={8}>
          <Flex vertical>
            <Text>All items cost Eltais Points.</Text>
            <Text>
              <i>
                Note: Eltais will cease to be accessible while fewer than 15 points are available.
                If points are reduced to fewer than zero, calamity.
              </i>
            </Text>
          </Flex>
          <MenuSection
            title="A: Permanent Boons (40 pts)"
            items={[
              'A1 - Eltais Vitamins: all heroes receive one vitamin gummy of their choice which improves a stat up to D20 (or less, if desired).',
              'A2 - Magical Item: party can create one magical object of Legendary strength (e.g., an autonomous vehicle capable of speech, flight, and invisibility, or a wand of annihilation)',
              'A3 - Timeline Alteration: select one “event” in Seattle and adjust the outcome by nudging Seattle onto a distinct but largely similar timeline. Results may be minimal or utterly reality-altering. Laws of universe still apply (i.e., cannot retroactively make an impossible event take place). CAUTION: may induce proximal insanity.',
            ]}
          />
          <MenuSection
            title="B: World Alterations (30 pts)"
            items={[
              'B1 - Dimension Doors: party receives 10 interdimensional doorways that they can place wherever on the Greater Seattle map. All DDs are interconnected and enable instant traversal.',
              'B2 - Flight Enchantment: magically imbue one vehicle with the ability to hover up to 1000ft in the air and otherwise function regularly (i.e., an enchanted van could still drive 70mph, steer normally in the sky in addition to on the ground)',
              "B3 - Thaw Seattle Freeze: all heroes gain a positive subconscious reputation in the city. Strangers' (human and otherwise) default reactions to heroes are improved and become much more likely to offer assistance and kindness. Existing relationships and non-residents are unaffected.",
              'B4 - Weather Control: heroes can request specific weather conditions for either the entire city or specific neighborhoods as desired. Weather must have happened at least once in Seattle before but is not dependent on time of year. Effects take 15-30 mins to manifest, depending on request.',
            ]}
          />
          <MenuSection
            title="C: Instant Boons (30 pts)"
            items={[
              'C1 - Magic Surge: for 1 hour, all heroes roll with advantage on their magic die.',
              'C2 - Seattle Strength: for 24 hours, 1 selected hero can add an additional D20 to any roll related to physical performance.',
              'C3 - Lacrimosa Layup: for 1 hour, Lady Lacrimosa manifests in the city at the location of one of the heroes, with her full magical capabilities, ready to offer aid.',
              'C4 - Flora/Fauna Friendship: for 1 hour, all non-human living creatures of Seattle become allies & heed requests (but do not lose free will)',
              "C5 - Eltais Phase: for 2 hours, heroes' connections to Eltais are strengthened. Become able to phase between dimensions at will, including partially. Grants new abilities, such as becoming invisible, seeing through walls, passing through objects, and more. Heroes can temporarily pass on this effect through touch.",
            ]}
          />
          <MenuSection
            title="D: Amenities (5 pts)"
            items={[
              'D1 - Barracks: already spent. Includes beds, showers, and storage for personal items.',
              'D2 - Food and drink: unlimited nourishment, on demand.',
              'D3 - Infirmary: magical zone where ailments heal at about 50x the natural rate.',
              'D4 - Internet: Google fiber wi-fi',
              'D5 - Alcohol: unlimited drinkies',
              'D6 - Crab rangoons: unlimited crab rangoons (lady lacrimosa would love to have one as well if thats okay)',
            ]}
          />
        </Flex>
      </Modal>
    </>
  );
}

function MenuSection({ title, items }: { title: string; items: string[] }) {
  return (
    <Flex vertical>
      <Title level={3}>{title}</Title>
      <Flex vertical gap={8}>
        {items.map((item) => (
          <Text>{item}</Text>
        ))}
      </Flex>
    </Flex>
  );
}
