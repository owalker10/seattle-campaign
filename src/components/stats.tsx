import { Flex, Popover, Select, theme, Typography } from 'antd';
import * as React from 'react';
import { CharacterStat, DieType, CharacterData } from '../util/supabase';
import { DICE, STAT_DESCRIPTIONS, STATS } from '../util/constants';
import { InfoCircleOutlined } from '@ant-design/icons';
import {
  IconBarbell,
  IconBrain,
  IconRun,
  IconShieldHalfFilled,
  IconSlice,
  IconSparkles,
} from '@tabler/icons-react';
import { motion } from 'motion/react';
const { Text } = Typography;

const { useToken } = theme;

function Description({
  statDescription,
}: {
  statDescription: { description: string; example: string; magic: string };
}) {
  const { token } = useToken();
  const { description, example, magic } = statDescription;
  return (
    <>
      {description}
      <br />
      <span>
        <span style={{ color: token.colorTextSecondary }}>Example:&nbsp;</span>
        {example}
      </span>
      <br />
      <span>
        <span style={{ color: token.colorTextSecondary }}>Types of magic:&nbsp;</span>
        {magic}
      </span>
    </>
  );
}

// a single row of stat => die
function Stat({
  stat,
  onChange,
  die,
  disabled,
}: {
  stat: CharacterStat;
  die: DieType | undefined;
  onChange: (stat: CharacterStat, die: DieType) => void;
  disabled: boolean;
}) {
  const { token } = useToken();
  const handleChange = React.useCallback((die: DieType) => onChange(stat, die), [onChange, stat]);
  return (
    <Flex style={{ width: '100%' }} align="center">
      <Flex style={{ color: token.colorBorder, marginRight: 4 }}>{icons[stat]}</Flex>
      <Popover content={<Description statDescription={STAT_DESCRIPTIONS[stat]} />}>
        <Text>{stat.replace(/(?:^|\s|["'([{])+\S/g, (match) => match.toUpperCase())}</Text>
        <InfoCircleOutlined
          style={{ fontSize: 12, marginLeft: 4, color: token.colorTextQuaternary }}
        />
      </Popover>
      <Select
        defaultValue={undefined}
        value={die}
        size="large"
        variant="borderless"
        style={{ width: '50%', marginLeft: 'auto' }}
        onChange={handleChange}
        options={DICE.map((die) => ({ value: die, label: die }))}
        disabled={disabled}
      />
    </Flex>
  );
}

const icons = {
  brains: <IconBrain />,
  brawn: <IconBarbell />,
  charm: <IconSparkles />,
  fight: <IconSlice />,
  flight: <IconRun />,
  grit: <IconShieldHalfFilled />,
};

// a section containing the 6 stats and their editable die assignments
export function Stats({
  stats,
  setStat,
  disabled,
}: {
  stats: CharacterData['stats'];
  setStat: (stat: CharacterStat, die: DieType) => void;
  disabled: boolean;
}) {
  // order the stats from largest to smallest die
  const orderedStats = React.useMemo(() => {
    const getNumber = (stat: string) => {
      const die: DieType = stats[stat];
      if (!die) return 0;
      return Number.parseInt(die.slice(1));
    };
    const ordered = [...STATS];
    ordered.sort((s1, s2) => {
      const n1 = getNumber(s1);
      const n2 = getNumber(s2);
      if (n1 == 0 && n2 == 0) {
        return s1.localeCompare(s2);
      }
      return n2 - n1;
    });
    return ordered;
  }, [stats]);

  const onChange = React.useCallback(
    (stat: CharacterStat, die: DieType) => setStat(stat, die),
    [setStat]
  );
  return orderedStats.map((stat) => (
    <motion.li
      layout
      key={stat}
      transition={{
        type: 'spring',
        damping: 20,
        stiffness: 300,
      }}
    >
      <Stat stat={stat} onChange={onChange} die={stats[stat]} key={stat} disabled={disabled} />
    </motion.li>
  ));
}
