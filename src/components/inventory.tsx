import * as React from 'react';
import { InventoryItem } from '../util/supabase';
import { Button, Flex, Input, Modal, theme, Tooltip } from 'antd';
import { rowHover, gripIcon } from './character.css';
import { MenuOutlined } from '@ant-design/icons';
import { IconBackpack, IconCheck, IconEdit, IconPlus, IconTrash, IconX } from '@tabler/icons-react';
import { generateKeyBetween } from 'fractional-indexing';
import { v4 as uuidv4 } from 'uuid';
import { CHARACTERS } from '../util/constants';
import { Reorder } from 'motion/react';

const { useToken } = theme;

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

export function Inventory({
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
