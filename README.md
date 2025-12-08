# 救援机器人远程操控终端 🤖

基于 React + Vite + Tailwind CSS 开发的 Unity WebGL 游戏操控界面，通过 **JavaScript Bridge (jslib)** 实现 Unity 与 Web 的零延迟双向通信。

## ✨ 核心特性 (v3.0)

### 🔌 JSBridge 直接通信

- **零延迟**: Unity WebGL 与 JavaScript 直接内存通信
- **双向实时**: 即时接收游戏状态 + 发送操作指令
- **自动检测**: 智能识别运行环境，无需配置
- **稳定可靠**: 不依赖网络，无需代理服务器

### 📊 实时数据同步

- **游戏状态**: 玩家位置、背包物品实时更新
- **生命体征**: 100 米范围内 NPC 自动检测和警报
- **任务系统**: 50 米范围内到达目标点即判定完成
- **环境监测**: 手电筒、夜视仪状态实时同步

## 功能特性

### 1. Unity 集成

- 使用 `react-unity-webgl` 加载 Unity WebGL 实例
- 完整的消息传递系统 (sendMessage to Robot GameObject)
- 自适应 Canvas 容器

### 2. JSBridge 通信系统

- **架构**: Unity WebGL ↔ JavaScript 直接通信
- **方式**: 内存级消息传递（无网络开销）
- **格式**: JSON
- **消息类型**:
  - `player_status`: 玩家状态推送（0.5 秒间隔）
  - `action`: 操作指令（放置物品、任务控制）
  - `action_result`: 操作结果反馈
  - `error`: 错误响应
- **通信机制**:
  - Unity → JS: 通过 `SendMessageToJS` 发送事件
  - JS → Unity: 通过 `window.sendToUnity` 发送指令

### 3. 操控系统

#### 键盘控制

- **移动**: W/A/S/D (前左后右)
- **视角**: Q/E (左右转向)，R/F (抬头/低头)
- **投放**: 1=水 / 2=食物
- **工具**: M=手电筒

#### UI 按钮控制

- 方向按钮 (手机友好)
- 物资投放按钮 (显示剩余数量)
- 工具切换按钮 (状态指示)

### 4. 数据监测面板

- **环境监测**: 温度、空气质量、能见度 (实时模拟数据)
- **机器人状态**: 电池电量、携带物资、工具状态
- **生命体征探测**: 100 米范围内自动检测幸存者
- **任务追踪**: 实时显示与幸存者的距离

### 5. 游戏机制

- **探索**: 使用生命体征探测器寻找幸存者（100 米检测范围）
- **补给**: 给幸存者提供水和食物以解锁跟随
- **护送**: 带领幸存者到达目标点(0, 5, 0)
- **完成**: 幸存者进入 50 米范围内即判定任务成功

### 4. UI/UX 特色

- 工业风深色主题 (救援橙、荧光绿、警示红)
- 玻璃态毛玻璃效果 (glass morphism)
- 按钮反馈动画 (按压、阴影、动画)
- 实时数据变化增加沉浸感

## 项目结构

```
src/
├── main.jsx              # 入口文件
├── index.css             # 全局样式 + Tailwind
├── App.jsx               # 主应用组件 (Unity + 布局)
└── components/
    ├── ControlPanel.jsx  # 操控面板
    ├── DataMonitor.jsx   # 数据监测
    └── StatusBar.jsx     # 顶部状态栏
```

## 安装 & 运行

### 步骤 1: 安装依赖

```bash
npm install
```

### 步骤 2: 启动开发服务器

```bash
npm run dev
# 访问 http://localhost:5173
```

### 生产构建

```bash
npm run build
npm run preview
```

## Unity 集成说明

### JSBridge 通信架构

项目使用 Unity WebGL 的 JavaScript 桥接（jslib）实现通信，无需额外配置：

#### 1. Unity 端实现

在 `Assets/Plugins/WebGL/` 创建 `WebGLBridge.jslib`：

```javascript
mergeInto(LibraryManager.library, {
  SendMessageToJS: function (jsonPtr) {
    var json = UTF8ToString(jsonPtr);
    var data = JSON.parse(json);
    window.dispatchEvent(new CustomEvent("UnityMessage", { detail: data }));
  },

  RegisterUnityCallback: function (gameObjectNamePtr, methodNamePtr) {
    var gameObjectName = UTF8ToString(gameObjectNamePtr);
    var methodName = UTF8ToString(methodNamePtr);
    window.sendToUnity = function (message) {
      unityInstance.SendMessage(
        gameObjectName,
        methodName,
        JSON.stringify(message)
      );
    };
  },
});
```

#### 2. C# 脚本实现

创建 `PlayerStatusServer.cs` 用于状态推送和消息接收：

```csharp
using System;
using System.Runtime.InteropServices;
using System.Text;
using UnityEngine;

public class PlayerStatusServer : MonoBehaviour {
    [DllImport("__Internal")]
    private static extern void SendMessageToJS(string json);

    [DllImport("__Internal")]
    private static extern void RegisterUnityCallback(string gameObjectName, string methodName);

    void Awake() {
        // 注册接收JS消息的回调
        RegisterUnityCallback(gameObject.name, "OnMessageFromJS");
    }

    void Update() {
        // 定期推送玩家状态
        if (Time.time >= nextPush) {
            nextPush = Time.time + pushInterval;
            PushStatus();
        }
    }

    void PushStatus() {
        var status = new {
            topic = "player_status",
            body = new {
                position = new { x = player.position.x, y = player.position.y, z = player.position.z },
                distanceToNpc = Vector3.Distance(player.position, npc.position),
                inventory = new {
                    capacity = 10,
                    used = waterCount + foodCount,
                    items = new[] {
                        new { type = "water", count = waterCount },
                        new { type = "food", count = foodCount }
                    }
                },
                flashlightOn = flashlight.enabled,
                missionCompleted = Vector3.Distance(npc.position, missionTargetPosition) < 50f
            }
        };

        string json = JsonUtility.ToJson(status);
        SendMessageToJS(json);
    }

    // 接收来自JavaScript的消息
    public void OnMessageFromJS(string jsonMessage) {
        var msg = JsonUtility.FromJson<JSMessage>(jsonMessage);

        if (msg.topic == "action" && msg.body.action == "place_item") {
            PlaceItem(msg.body.itemType, msg.body.count);
        }
    }

    void PlaceItem(string itemType, int count) {
        // 实现物品放置逻辑
        if (itemType == "water" && waterCount > 0) {
            waterCount--;
            npcFollow.ReceiveWater();
        } else if (itemType == "food" && foodCount > 0) {
            foodCount--;
            npcFollow.ReceiveFood();
        }

        // 发送操作结果
        SendActionResult("place_item", "ok", itemType, count);
    }
}
```

### 消息数据结构

```csharp
[Serializable]
public class JSMessage {
    public string topic;
    public ActionBody body;
}

[Serializable]
public class ActionBody {
    public string action;
    public string itemType;
    public int count;
}
```

### 游戏参数配置

在 Unity Inspector 中配置关键参数：

- **生命体征检测范围**: 100 米
- **任务完成判定距离**: 50 米（到达目标点(0,5,0)）
- **状态推送间隔**: 0.5 秒

## 配置项

### Unity WebGL 构建文件

确保构建文件放置在 `public/Build/` 目录：

```
public/Build/
├── build.loader.js
├── build.data
├── build.framework.js
└── build.wasm
```

## 响应式设计

- 布局采用 flexbox，支持各种屏幕尺寸
- 侧边栏在小屏幕上可隐藏 (可扩展功能)
- 按钮大小符合费茨定律 (可触碰区域 ≥ 44x44px)

## 动画与过渡

- 按钮按压: `scale(0.95)`
- 状态变化: 色彩平滑过渡 (300ms)
- 警告闪烁: `animate-blink` (1s 周期)
- 加载动画: `animate-pulse-slow` (2s 周期)

## 技术栈

- **React 18**: UI 框架
- **Vite 5**: 构建工具
- **Tailwind CSS 3**: 样式框架
- **Lucide React**: 图标库
- **react-unity-webgl**: Unity 桥接库

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 许可证

MIT
