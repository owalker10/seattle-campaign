import { InfoCircleOutlined, MenuOutlined, UserOutlined } from '@ant-design/icons';
import {
  IconBackpack,
  IconBarbell,
  IconBrain,
  IconCheck,
  IconEdit,
  IconHexagonLetterAFilled,
  IconPlus,
  IconRun,
  IconShieldHalfFilled,
  IconSlice,
  IconSparkles,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { v4 as uuidv4 } from 'uuid';
import { rowHover, gripIcon } from './character.css';

import {
  Button,
  Card,
  Collapse,
  Flex,
  Input,
  Modal,
  Popover,
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
import { CHARACTERS, DICE, STAT_DESCRIPTIONS, STATS } from '../util/constants';
import {
  CharacterData,
  CharacterStat,
  DieType,
  InventoryItem,
  characterAtomFamily,
} from '../util/supabase';
import { useAtom } from 'jotai';
import { Reorder } from 'motion/react';
import { generateKeyBetween } from 'fractional-indexing';

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
function Stats({
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

function InventoryRow({
  item,
  editing,
  setEditing,
  onChange,
  onDelete,
  disabled,
}: {
  item: InventoryItem;
  editing: boolean;
  setEditing: (id: string | undefined) => void;
  onChange: (newItem: InventoryItem) => void;
  onDelete: (id: string) => void;
  disabled: boolean;
}) {
  const { id, description, name } = item;
  const { token } = useToken();
  const [editingName, setEditingName] = React.useState(name);
  const [editingDescription, setEditingDescription] = React.useState(description);
  const handleSetEditing = React.useCallback(() => {
    setEditingName(name);
    setEditingDescription(description);
    setEditing(id);
  }, [setEditing, setEditingName, setEditingDescription, name, description]);
  const onCancel = React.useCallback(() => {
    setEditing(undefined);
    if (!name && !description && !editingName && !editingDescription) {
      onDelete(id);
    }
  }, [setEditing, name, description, editingName, editingDescription, onDelete]);
  const handleNameChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditingName(e.target.value);
    },
    [setEditingName]
  );
  const handleDescriptionChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditingDescription(e.target.value);
    },
    [setEditingDescription]
  );
  const handleSave = React.useCallback(() => {
    onChange({
      ...item,
      name: editingName,
      description: editingDescription,
    });
    setEditing(undefined);
  }, [onChange, editingName, editingDescription]);
  const handleDelete = React.useCallback(() => {
    onDelete(id);
  }, [onDelete]);
  return (
    <Flex
      align="center"
      gap={12}
      style={{
        borderTop: `1px solid ${token.colorBorder}`,
        borderBottom: `1px solid ${token.colorBorder}`,
        marginBottom: -1,
        padding: '8px 0',
      }}
      className={rowHover}
    >
      {!disabled && (
        <MenuOutlined
          style={{ color: token.colorTextQuaternary, cursor: 'pointer' }}
          className={gripIcon}
        />
      )}
      <Flex vertical style={{ flexGrow: 1, marginLeft: disabled ? 12 : 0 }}>
        {editing ? (
          <>
            <Input
              variant="underlined"
              value={editingName}
              onChange={handleNameChange}
              placeholder="Name"
            />
            <Input
              variant="underlined"
              value={editingDescription}
              onChange={handleDescriptionChange}
              placeholder="Description"
            />
          </>
        ) : (
          <>
            <div style={{ fontSize: 18 }}>{name}</div>
            <div style={{ color: token.colorTextSecondary }}>{description}</div>
          </>
        )}
      </Flex>
      {!disabled && (
        <Flex gap={4}>
          {editing ? (
            <>
              <Tooltip title="Cancel">
                <Button
                  onClick={onCancel}
                  icon={<IconX style={{ strokeWidth: 1 }} />}
                  type="text"
                  key="cancel"
                />
              </Tooltip>
              <Tooltip title="Save">
                <Button
                  onClick={handleSave}
                  icon={<IconCheck style={{ strokeWidth: 1 }} />}
                  type="text"
                  key="save"
                />
              </Tooltip>
            </>
          ) : (
            <>
              <Tooltip title="Edit">
                <Button
                  onClick={handleSetEditing}
                  icon={<IconEdit style={{ strokeWidth: 1 }} />}
                  type="text"
                  key="edit"
                />
              </Tooltip>
              <Tooltip title="Delete">
                <Button
                  onClick={handleDelete}
                  icon={<IconTrash style={{ strokeWidth: 1 }} />}
                  type="text"
                  key="delete"
                />
              </Tooltip>
            </>
          )}
        </Flex>
      )}
    </Flex>
  );
}

function Inventory({
  player,
  disabled,
  inventory,
  onChange,
  onDelete,
}: {
  player: string;
  disabled: boolean;
  inventory: InventoryItem[];
  onChange: (newItem: InventoryItem | string) => void;
  onDelete: (itemId: string) => void;
}) {
  const sortedInventory = React.useMemo(
    () => [...inventory].sort((i1, i2) => (i1.order < i2.order ? -1 : 1)),
    [inventory]
  );
  const [inventoryOpen, setInventoryOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<string | undefined>(undefined);
  const onReorder = React.useCallback(
    (newItems: InventoryItem[]) => {
      const movedItem = newItems.find((item, newIndex) => {
        const oldIndex = sortedInventory.findIndex((i) => i.id === item.id);
        return oldIndex !== newIndex;
      });
      if (!movedItem) return;
      const movedIndex = newItems.findIndex((item) => movedItem.id == item.id);
      const prev = newItems[movedIndex - 1]?.order ?? null;
      const after = newItems[movedIndex + 1]?.order ?? null;
      const newOrder = generateKeyBetween(prev, after);
      onChange({
        ...movedItem,
        order: newOrder,
      });
    },
    [sortedInventory, onChange]
  );
  const onAdd = React.useCallback(() => {
    const id = uuidv4();
    onChange(id);
    setEditingItem(id);
  }, [onChange, setEditingItem]);
  return (
    <>
      <Button
        icon={<IconBackpack style={{ strokeWidth: 1, height: 20, marginTop: 2 }} />}
        style={{ marginBottom: 16 }}
        onClick={() => setInventoryOpen(true)}
      >
        {`Inventory (${inventory.length})`}
      </Button>
      <Modal
        title={`${CHARACTERS[player]}'s Inventory`}
        open={inventoryOpen}
        onCancel={() => setInventoryOpen(false)}
        okButtonProps={{ style: { display: 'none' } }}
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <Flex vertical gap={8}>
          <Reorder.Group
            axis="y"
            values={inventory}
            onReorder={onReorder}
            as="div"
            style={{ padding: '8px 0' }}
          >
            {sortedInventory.map((item) => (
              <Reorder.Item key={item.id} value={item} as="div" drag={!disabled} layout="position">
                <InventoryRow
                  item={item}
                  onChange={onChange}
                  onDelete={onDelete}
                  editing={item.id == editingItem}
                  setEditing={setEditingItem}
                  disabled={disabled}
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
          {!disabled && (
            <Button onClick={onAdd} icon={<IconPlus style={{ height: 20, marginTop: 2 }} />}>
              Add item
            </Button>
          )}
        </Flex>
      </Modal>
    </>
  );
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
  const [inventory, upsertInventory, deleteInventory] = React.useMemo(
    () => [
      character.inventory,
      (newItemOrId: InventoryItem | string) => {
        setCharacter({ type: 'inventory-item', newValue: newItemOrId });
      },
      (itemId: string) => setCharacter({ type: 'delete-inventory', newValue: itemId }),
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
        <Inventory
          player={id}
          disabled={!pinned}
          inventory={inventory}
          onChange={upsertInventory}
          onDelete={deleteInventory}
        />
        <Text style={{ marginBottom: 4 }}>Adversity tokens</Text>
        <Adversity value={adversity} onChange={setAdversity} disabled={!pinned} />
      </Flex>
    </Card>
  );
}
