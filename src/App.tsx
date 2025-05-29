import './App.css';
import { Layout, ConfigProvider, theme, Spin, Flex } from 'antd';
const { Header, Content } = Layout;
import { Character } from './components/character';
import React from 'react';
import Title from 'antd/es/typography/Title';
import { useStateWithStorage } from './util/useStateWithStorage';
import * as motion from 'motion/react-client';
import { CHARACTERS } from './util/constants';
import { useSupabaseChannel } from './util/supabase';
import { SpaceNeedle } from './assets/needle';

// todo:
// - note taker with quill

function App() {
  const loading = useSupabaseChannel();
  // keyed by player (id)
  const [pinned, setPinned] = useStateWithStorage<boolean | null>('pinned-character', null);
  const sortedCharacters = React.useMemo(() => {
    const entries = Object.entries(CHARACTERS);
    entries.sort(([id1, n1], [id2, n2]) => {
      if (pinned == id1) return -Infinity;
      if (pinned == id2) return Infinity;
      return n1.localeCompare(n2);
    });
    return entries;
  }, [pinned]);

  return (
    <ConfigProvider
      theme={{
        // 1. Use dark algorithm
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#4a47a8',
          fontFamily: 'DM Sans',
        },

        // 2. Combine dark algorithm and compact algorithm
        // algorithm: [theme.darkAlgorithm, theme.compactAlgorithm],
      }}
    >
      <Layout
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #141414 0%, #2A2030 100%)',
        }}
      >
        <Header
          style={{
            background: 'none',
            height: 'auto',
            display: 'flex',
            alignItems: 'flex-end',
            padding: '16px 24px 16px',
          }}
        >
          <div style={{ width: 64, height: 64, marginRight: 24 }}>
            <SpaceNeedle />
          </div>
          <Title style={{ margin: 0 }}>Seattle Campaign</Title>
        </Header>
        <Content>
          {loading ? (
            <Flex align="center" justify="center" style={{ height: '100%' }}>
              <Spin size="large" />
            </Flex>
          ) : (
            <div className="card-grid">
              {sortedCharacters.map(([player, name]) => (
                <motion.div
                  layout
                  key={player}
                  transition={{
                    type: 'spring',
                    damping: 20,
                    stiffness: 150,
                  }}
                >
                  <Character
                    name={name}
                    pinned={player == pinned}
                    setPinned={setPinned}
                    id={player}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </Content>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
