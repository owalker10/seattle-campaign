import { IconHexagonLetterAFilled } from '@tabler/icons-react';
import { Button, Flex, Tooltip } from 'antd';
import { motion } from 'motion/react';
import * as React from 'react';

/** displays current adversity tokens as row of icons, with plus and minus buttons */
export function Adversity({ value, onChange, disabled }) {
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
