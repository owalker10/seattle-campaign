import { useAtom } from 'jotai';
import { eltaisScoreAtom } from '../util/supabase';
import { Flex, InputNumber, Typography } from 'antd';
import React from 'react';

const { Text } = Typography;

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
    </Flex>
  );
}
