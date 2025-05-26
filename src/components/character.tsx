import { UserOutlined } from '@ant-design/icons';
import {
  IconBarbell,
  IconBrain,
  IconHexagonLetterAFilled,
  IconRun,
  IconShieldHalfFilled,
  IconSlice,
  IconSparkles,
} from '@tabler/icons-react';
import {
  Button,
  Card,
  Collapse,
  Flex,
  Input,
  Select,
  Space,
  Tooltip,
  Typography,
  theme,
} from 'antd';
const { Text } = Typography;
import Title from 'antd/es/typography/Title';
import React from 'react';
import * as motion from 'motion/react-client';
import { DICE, STATS } from '../util/constants';
import { CharacterData, CharacterStat, DieType, characterAtomFamily } from '../util/supabase';
import { useAtom } from 'jotai';
import { useStateWithStorage } from '../util/useStateWithStorage';

const { useToken } = theme;

// displays current adversity tokens as row of icons, with plus and minus buttons
function Adversity({ value, onChange, disabled }) {
  return (
    <Flex align="center">
      <Button
        type="primary"
        style={{ width: 60 }}
        onClick={() => onChange(value - 1)}
        disabled={disabled}
      >
        -
      </Button>
      <Tooltip title={value}>
        <Flex justify="center" align="center" style={{ flexGrow: 1, flexWrap: 'wrap' }}>
          {value == 0 && <div /> /* Flex has display: none if there are no children */}
          {[...Array(value).keys()].map((i) => (
            <motion.li
              key={i}
              layout
              transition={{
                type: 'spring',
                damping: 20,
                stiffness: 300,
              }}
              style={{ display: 'flex' }}
            >
              <IconHexagonLetterAFilled />
            </motion.li>
          ))}
        </Flex>
      </Tooltip>
      <Button
        type="primary"
        style={{ width: 60 }}
        onClick={() => onChange(value + 1)}
        disabled={disabled}
      >
        +
      </Button>
    </Flex>
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
  const token = useToken();
  const handleChange = React.useCallback((die: DieType) => onChange(stat, die), [onChange, stat]);
  return (
    <Flex style={{ width: '100%' }} align="center">
      <Flex style={{ color: token.token.colorBorder, marginRight: 4 }}>{icons[stat]}</Flex>
      <Text>{stat.replace(/(?:^|\s|["'([{])+\S/g, (match) => match.toUpperCase())}</Text>
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

// Card component that displays editable information about each character. If not pinned, card is read-only.
export function Character({ name, pinned, setPinned, id }) {
  const [character, setCharacter] = useAtom(characterAtomFamily(id));
  const [adversity, setAdversity] = React.useMemo(() => {
    return [
      character.adversity,
      (adversity: number) => {
        setCharacter({ type: 'adversity', newValue: adversity });
      },
    ];
  }, [character, setCharacter]);
  const [status, setStatus] = React.useMemo(() => {
    return [
      character.status,
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setCharacter({ type: 'status', newValue: e.target.value });
      },
    ];
  }, [character, setCharacter]);
  const [stats, setStat] = React.useMemo(
    () => [
      character.stats,
      (stat: string, die: string) => {
        setCharacter({ type: 'stats', newValue: [stat, die] });
      },
    ],
    [character, setCharacter]
  );
  const { token } = useToken();
  return (
    <Card>
      <Flex justify="space-between">
        <Title level={3} style={{ marginTop: 0, marginBottom: 4 }}>
          {name}
        </Title>
        <Tooltip title={pinned ? 'Unclaim character' : 'Claim character'}>
          <Button
            icon={<UserOutlined />}
            type={pinned ? 'primary' : 'text'}
            onClick={() => setPinned((prev: string) => (prev == id ? null : id))}
          />
        </Tooltip>
      </Flex>
      <Input
        value={status}
        onChange={setStatus}
        variant="borderless"
        placeholder="Status"
        style={{ paddingLeft: 0, color: token.colorTextSecondary }}
        disabled={!pinned}
      />
      <Flex vertical>
        <Collapse
          bordered={false}
          items={[
            {
              key: '1',
              label: 'Stats',
              children: (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Stats stats={stats} setStat={setStat} disabled={!pinned} />
                </Space>
              ),
            },
          ]}
          style={{ margin: '16px 0' }}
        />
        <Text style={{ marginBottom: 4 }}>Adversity tokens</Text>
        <Adversity value={adversity} onChange={setAdversity} disabled={!pinned} />
      </Flex>
    </Card>
  );
}
