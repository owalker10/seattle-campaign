import { UserOutlined } from '@ant-design/icons';

import { Button, Card, Collapse, Flex, Input, Space, Tooltip, Typography, theme } from 'antd';
import Title from 'antd/es/typography/Title';
import React from 'react';
import { InventoryItem, characterAtomFamily } from '../util/supabase';
import { useAtom } from 'jotai';
import { Adversity } from './adversity';
import { Stats } from './stats';
import { Inventory } from './inventory';
import { Reorder } from 'motion/react';
import { generateKeyBetween } from 'fractional-indexing';
const { Text } = Typography;

const { useToken } = theme;

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
