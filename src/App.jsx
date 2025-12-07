import { useState, useRef, useEffect } from 'react'
import { Unity, useUnityContext } from 'react-unity-webgl'
import RobotHUD from './components/RobotHUD'
import { useSocket, usePlayerStatus, useAction } from './hooks/useSocket'
import { ITEM_TYPES } from './services/messageTypes'
import './App.css'

function App() {
  const { unityProvider, sendMessage, isLoaded } = useUnityContext({
    loaderUrl: '/Build/build.loader.js',
    dataUrl: '/Build/build.data',
    frameworkUrl: '/Build/build.framework.js',
    codeUrl: '/Build/build.wasm',
  })

  // Socket 连接
  const { isConnected: isSocketConnected, connectionState } = useSocket('ws://localhost:50001')
  const playerStatus = usePlayerStatus()
  const { placeItem, lastError, clearError } = useAction()

  const [robotState, setRobotState] = useState({
    battery: 85,
    waterCount: 10,
    foodCount: 10,
    temperature: 25,
    gasLevel: 0.3,
    visibility: 0.8,
    isFlashlightOn: false,
    isNightvisionOn: false,
    isPersonDetected: false,
    position: { x: 0, y: 0, z: 0 },
    distanceToNpc: 0,
    npcId: null,
    playerId: null,
  })

  const [isMoving, setIsMoving] = useState({
    forward: false,
    left: false,
    back: false,
    right: false,
  })

  const keysPressed = useRef({})

  // 同步 Socket 数据到 robotState
  useEffect(() => {
    if (playerStatus) {
      setRobotState((prev) => ({
        ...prev,
        waterCount: playerStatus.inventory.items.water || 0,
        foodCount: playerStatus.inventory.items.food || 0,
        position: playerStatus.position,
        distanceToNpc: playerStatus.distanceToNpc,
        npcId: playerStatus.npcId,
        playerId: playerStatus.playerId,
        // 根据距离判断是否检测到幸存者
        isPersonDetected: playerStatus.distanceToNpc < 15,
      }))
    }
  }, [playerStatus])

  // 显示错误提示
  useEffect(() => {
    if (lastError) {
      alert(`错误: ${lastError.message}\n详情: ${lastError.details || '无'}`)
      clearError()
    }
  }, [lastError, clearError])

  // 初始化键盘监听
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toUpperCase()
      keysPressed.current[key] = true

      if (isLoaded) {
        switch (key) {
          case 'W':
            setIsMoving(prev => ({ ...prev, forward: true }))
            sendMessage('Robot', 'Move', 'forward')
            break
          case 'A':
            setIsMoving(prev => ({ ...prev, left: true }))
            sendMessage('Robot', 'Move', 'left')
            break
          case 'S':
            setIsMoving(prev => ({ ...prev, back: true }))
            sendMessage('Robot', 'Move', 'back')
            break
          case 'D':
            setIsMoving(prev => ({ ...prev, right: true }))
            sendMessage('Robot', 'Move', 'right')
            break
          case '1':
            // 通过 Socket 发送放置指令
            if (isSocketConnected && robotState.waterCount > 0) {
              placeItem(ITEM_TYPES.WATER, 1)
            }
            // 同时通知 Unity（如果需要）
            if (isLoaded) {
              sendMessage('Robot', 'DropItem', 'water')
            }
            break
          case '2':
            // 通过 Socket 发送放置指令
            if (isSocketConnected && robotState.foodCount > 0) {
              placeItem(ITEM_TYPES.FOOD, 1)
            }
            // 同时通知 Unity（如果需要）
            if (isLoaded) {
              sendMessage('Robot', 'DropItem', 'food')
            }
            break
          case 'F':
            sendMessage('Robot', 'ToggleTool', 'flashlight')
            setRobotState(prev => ({
              ...prev,
              isFlashlightOn: !prev.isFlashlightOn,
            }))
            break
          case 'N':
            sendMessage('Robot', 'ToggleTool', 'nightvision')
            setRobotState(prev => ({
              ...prev,
              isNightvisionOn: !prev.isNightvisionOn,
            }))
            break
          default:
            break
        }
      }
    }

    const handleKeyUp = (e) => {
      const key = e.key.toUpperCase()
      keysPressed.current[key] = false

      if (isLoaded) {
        switch (key) {
          case 'W':
            setIsMoving(prev => ({ ...prev, forward: false }))
            break
          case 'A':
            setIsMoving(prev => ({ ...prev, left: false }))
            break
          case 'S':
            setIsMoving(prev => ({ ...prev, back: false }))
            break
          case 'D':
            setIsMoving(prev => ({ ...prev, right: false }))
            break
          default:
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isLoaded, isSocketConnected, robotState.waterCount, robotState.foodCount, sendMessage, placeItem])

  // 模拟数据更新
  useEffect(() => {
    const interval = setInterval(() => {
      setRobotState(prev => {
        // 电池缓慢下降
        let newBattery = prev.battery - Math.random() * 0.1
        if (newBattery < 0) newBattery = 0

        // 温度波动
        let newTemp = prev.temperature + (Math.random() - 0.5) * 0.5
        newTemp = Math.max(20, Math.min(35, newTemp))

        // 气体浓度波动
        let newGasLevel = prev.gasLevel + (Math.random() - 0.5) * 0.02
        newGasLevel = Math.max(0, Math.min(1, newGasLevel))

        // 能见度波动
        let newVisibility = prev.visibility + (Math.random() - 0.5) * 0.01
        newVisibility = Math.max(0.3, Math.min(1, newVisibility))

        // 模拟随机生命体征探测
        const isPersonDetected = Math.random() > 0.95

        return {
          ...prev,
          battery: newBattery,
          temperature: newTemp,
          gasLevel: newGasLevel,
          visibility: newVisibility,
          isPersonDetected: isPersonDetected || prev.isPersonDetected,
        }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Unified Action Handler for HUD
  const handleHUDAction = (type, action, value) => {
    if (!isLoaded) return;

    if (type === 'click') {
      if (action === 'drop') {
        if (value === 'water' && robotState.waterCount > 0) {
          if (isSocketConnected) placeItem(ITEM_TYPES.WATER, 1);
          sendMessage('Robot', 'DropItem', 'water');
        } else if (value === 'food' && robotState.foodCount > 0) {
          if (isSocketConnected) placeItem(ITEM_TYPES.FOOD, 1);
          sendMessage('Robot', 'DropItem', 'food');
        }
      } else if (action === 'toggle') {
        if (value === 'flashlight') {
          sendMessage('Robot', 'ToggleTool', 'flashlight');
          setRobotState(prev => ({ ...prev, isFlashlightOn: !prev.isFlashlightOn }));
        } else if (value === 'nightvision') {
          sendMessage('Robot', 'ToggleTool', 'nightvision');
          setRobotState(prev => ({ ...prev, isNightvisionOn: !prev.isNightvisionOn }));
        }
      }
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Layer 0: Unity Background */}
      <div className="absolute inset-0 w-full h-full z-0">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-50">
            <div className="text-center">
              <div className="text-2xl font-bold mb-4 text-orange-500 tracking-widest font-mono">
                SYSTEM INITIALIZING...
              </div>
              <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden mx-auto">
                <div className="h-full bg-orange-500 animate-pulse"></div>
              </div>
            </div>
          </div>
        )}
        <Unity unityProvider={unityProvider} className="w-full h-full" />
      </div>

      {/* Layer 1: HUD Overlay */}
      <RobotHUD 
        robotState={robotState}
        isSocketConnected={isSocketConnected}
        onAction={handleHUDAction}
        isMoving={isMoving}
      />
    </div>
  )
}

export default App
