import './App.css'
import { Layout, Space, ConfigProvider, theme } from 'antd'
const { Header, Content } = Layout
import { Character } from './components/Character'
import React from "react";
import Title from 'antd/es/typography/Title';
import { useStateWithStorage } from './util/useStateWithStorage';
import * as motion from "motion/react-client"

// todo:
// - set up hosting
// - favicon & other metadata
// - connect to db
// - change pinned to "me" such that other cards are read-only (claim)
// - note taker with quill
// - change adversity input to tokens


function App() {
  const [pinned, setPinned] = useStateWithStorage<boolean | null>('pinned-character', null)
  const names = React.useMemo(() => {
    const names = ["John Doe", "Jane Smith"]
    return names.sort((n1, n2) => { 
      if (pinned == n1) return -Infinity
      if (pinned == n2) return Infinity
      return n1.localeCompare(n2)
    })
  }, [pinned])

  return (
    <ConfigProvider
    theme={{
      // 1. Use dark algorithm
      algorithm: theme.darkAlgorithm,
      token: {
        colorPrimary: '#4a47a8'
      }

      // 2. Combine dark algorithm and compact algorithm
      // algorithm: [theme.darkAlgorithm, theme.compactAlgorithm],
    }}
  >
    <Layout style={{height: '100vh', background: '#1d1d1d'}}>
      <Header style={{background: 'none', height: 'auto'}}>
        <Title>Seattle Campaign</Title>
      </Header>
      <Content>
        <Space size={[8, 16]} wrap style={{margin: 16}} align='start' styles={{ item: { flex: '1 0 400px', minWidth: 400, maxWidth: 550, margin: "0 auto" } }}>
            {names.map(name => 
              <motion.div layout key={name} transition={{
                type: "spring",
                damping: 20,
                stiffness: 150,
              }}>
                <Character name={name} pinned={name == pinned} setPinned={setPinned} id={name}/>
              </motion.div>
            )}
          </Space>
        </Content>
    </Layout>
    </ConfigProvider>
  )
}

export default App
