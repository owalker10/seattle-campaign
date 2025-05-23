import { PushpinOutlined } from "@ant-design/icons";
import { IconBarbell, IconBrain, IconRun, IconShieldHalfFilled, IconSlice, IconSparkles } from "@tabler/icons-react";
import { Button, Card, Collapse, Flex, Input, InputNumber, Select, Space, Tooltip, Typography, theme } from "antd";
const { Text } = Typography;
import Title from "antd/es/typography/Title";
import React from "react";
import * as motion from "motion/react-client"


const { useToken } = theme;

function Adversity({ value, onChange }) {
    return <Flex align="center">
        <Button type='primary' style={{width:60}} onClick={() => onChange((prev: number) => prev - 1)}>-</Button>
        <Input value={value} onChange={onChange} size='large' variant='borderless' style={{flexGrow:1, textAlign: 'center'}} styles={{input: { textAlign: 'center', fontSize: 24 }}}/>
        <Button type='primary' style={{width:60}} onClick={() => onChange((prev: number) => prev + 1)}>+</Button>
    </Flex>
}

function Stat({ stat, onChange, die }: { stat: string, die: string, onChange: (stat: string, die: string) => void}){ 
    const token = useToken()
    const handleChange = React.useCallback((die: string) => onChange(stat, die), [onChange, stat])
    return <Flex style={{width: "100%"}} align="center">
        <Flex style={{color: token.token.colorBorder, marginRight: 4 }}>{icons[stat]}</Flex>
        <Text>{stat.replace(/(?:^|\s|["'([{])+\S/g, match => match.toUpperCase())}</Text>
        <Select
            defaultValue=""
            value={die}
            size='large'
            variant="borderless"
            style={{ width: '50%', marginLeft: 'auto' }}
            onChange={handleChange}
            options={[
                { value: 'd4', label: 'd4' },
                { value: 'd6', label: 'd6' },
                { value: 'd8', label: 'd8' },
                { value: 'd10', label: 'd10' },
                { value: 'd12', label: 'd12' },
                { value: 'd20', label: 'd20' },
            ]}
        />
    </Flex>
}

const stats = ['brains', 'brawn', 'charm', 'fight', 'flight', 'grit']
const icons = {
    brains: <IconBrain/>,
    brawn: <IconBarbell/>,
    charm: <IconSparkles/>,
    fight: <IconSlice/>,
    flight: <IconRun/>,
    grit: <IconShieldHalfFilled/>
}

export function Stats() {
    const [dice, setDice] = React.useState({})
    const orderedStats = React.useMemo(() => {
        const getNumber = (stat: string) => {
            const die: string = dice[stat]
            if (!die) return 0
            return Number.parseInt(die.slice(1))
        }
        const ordered = [...stats]
        ordered.sort((s1, s2) => {
            const n1 = getNumber(s1)
            const n2 = getNumber(s2)
            if (n1 == 0 && n2 == 0) {
                return s1.localeCompare(s2)
            }
            return n2 - n1
        })
        return ordered
    }, [dice, setDice])

    const onChange = React.useCallback((stat: string, die: string) => setDice(prev => ({ ...prev, [stat]: die})), [setDice])
    return orderedStats.map(stat => 
        <motion.li layout key={stat} transition={{
            type: "spring",
            damping: 20,
            stiffness: 300,
        }}>
            <Stat stat={stat} onChange={onChange} die={dice[stat]} key={stat}/>
        </motion.li>
    )
}

export function Character({ name, pinned, setPinned, id }){
    const [adversity, setAdversity] = React.useState(2)
    const { token } = useToken()
    return <Card>
            <Flex justify="space-between">
                <Title level={3} style={{marginTop: 0, marginBottom: 4}}>{name}</Title>
                <Tooltip title={pinned ? "Unpin character" : "Pin character"}>
                    <Button icon={<PushpinOutlined />} type={pinned ? 'primary' : 'text'} onClick={() => setPinned(prev => prev == id ? undefined : id)}/>
                </Tooltip>
            </Flex>
            <Input variant='borderless' placeholder='Status' style={{ paddingLeft: 0, color: token.colorTextSecondary }}/>
            <Flex vertical>
                <Collapse
                    bordered={false}
                    items={[{ key: '1', label: 'Stats', children: <Space direction='vertical' style={{width: '100%'}}>
                       <Stats/>
                    </Space>}]}
                    style={{margin: "16px 0"}}
                />
                <Text style={{marginBottom: 4}}>Adversity tokens</Text>
                <Adversity value={adversity} onChange={setAdversity}/>
            </Flex>
        </Card>
}