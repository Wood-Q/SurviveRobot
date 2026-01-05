import React, { useState, useEffect, useRef } from 'react';

/**
 * RobotAIDiagnosis Component
 * 
 * 接收机器人状态，通过 AI 分析提供战术建议。
 * 包含打字机效果、呼吸灯状态指示和智能频率控制。
 * 
 * @param {Object} props
 * @param {Object} props.robotState - 机器人的实时状态数据
 */
const RobotAIDiagnosis = ({ robotState }) => {
  const [advice, setAdvice] = useState('');
  const [displayedAdvice, setDisplayedAdvice] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState(false);

  // 用于频率控制和状态比对
  const lastSentTimeRef = useRef(0);
  const lastStateRef = useRef(null);
  // 用于打字机效果的定时器
  const typeWriterRef = useRef(null);

  // 打字机效果实现
  useEffect(() => {
    if (!advice) return;
    
    let currentIndex = 0;
    setDisplayedAdvice('');
    
    if (typeWriterRef.current) clearInterval(typeWriterRef.current);

    typeWriterRef.current = setInterval(() => {
      if (currentIndex < advice.length) {
        setDisplayedAdvice(prev => prev + advice.charAt(currentIndex));
        currentIndex++;
      } else {
        clearInterval(typeWriterRef.current);
      }
    }, 50); // 打字速度: 50ms/字

    return () => clearInterval(typeWriterRef.current);
  }, [advice]);

  // 智能触发逻辑
  useEffect(() => {
    const checkAndSend = async () => {
      if (isThinking) return;

      const now = Date.now();
      const prevState = lastStateRef.current;
      
      // 0. 首次加载 (立即触发)
      const isFirstLoad = !prevState;

      // 1. 关键状态变化检测 (立即触发)
      const isCriticalChange = prevState && (
        prevState.isPersonDetected !== robotState.isPersonDetected || // 发现/丢失幸存者
        (prevState.gasLevel < 0.8 && robotState.gasLevel >= 0.8) ||   // 气体浓度达到危险阈值
        (prevState.battery > 20 && robotState.battery <= 20)          // 电量低
      );

      // 2. 时间间隔检测 (15秒)
      const isTimeDue = now - lastSentTimeRef.current > 15000;
      
      // 3. 数据实质变化检测 (防止重复发送完全相同的数据)
      // 简单的浅比较，实际项目中可能需要更深度的比较或只比较关键字段
      const hasStateChanged = prevState && JSON.stringify(prevState) !== JSON.stringify(robotState);

      console.log('[AI Check]', { isFirstLoad, isCriticalChange, isTimeDue, hasStateChanged });

      // 触发条件：首次加载 OR 关键变化 OR (时间到了 AND 数据有变)
      if (isFirstLoad || isCriticalChange || (isTimeDue && hasStateChanged)) {
        console.log('[AI Trigger] Sending request...');
        await fetchAdvice();
      }
    };

    checkAndSend();
  }, [robotState]); // 依赖 robotState，每次更新都会检查

  const fetchAdvice = async () => {
    setIsThinking(true);
    setError(false);
    lastSentTimeRef.current = Date.now();
    lastStateRef.current = { ...robotState }; // 保存快照

    try {
      // 构造 Prompt
      const systemPrompt = "你是一个搜救机器人指挥中心。我会为你提供机器人实时的 JSON 传感器数据。请你基于数据，以极简、专业、冷静的军事风格给操作员提供一条核心建议。字数严格控制在 20 字以内。如果一切正常，请保持沉默或提示'系统状态良好'。";

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: JSON.stringify(robotState) }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Request failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      // 兼容常见的 API 返回格式 (如 OpenAI 或自定义)
      const aiText = data.content || 
                     (data.choices && data.choices[0]?.message?.content) || 
                     data.message || 
                     "系统状态良好";
      
      setAdvice(aiText.trim());
    } catch (err) {
      console.error("AI Diagnosis Error Details:", err);
      setError(true);
      setAdvice('通信干扰中...');
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="bg-gray-900/90 border border-cyan-500/40 rounded-lg p-3 max-w-sm shadow-[0_0_15px_rgba(6,182,212,0.15)] backdrop-blur-md transition-all duration-300 hover:border-cyan-400/60">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 border-b border-cyan-500/20 pb-1">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3 bg-cyan-500"></div>
          <h3 className="text-cyan-400 text-[10px] font-bold tracking-widest uppercase font-mono">
            AI COMMAND LINK
          </h3>
        </div>
        
        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <span className={`text-[9px] font-mono tracking-tighter ${isThinking ? 'text-yellow-400' : error ? 'text-red-400' : 'text-cyan-600'}`}>
            {isThinking ? 'PROCESSING' : error ? 'OFFLINE' : 'ONLINE'}
          </span>
          <div className={`w-1.5 h-1.5 rounded-full ${
            isThinking ? 'bg-yellow-400 animate-pulse shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 
            error ? 'bg-red-500' : 
            'bg-cyan-500 shadow-[0_0_5px_rgba(6,182,212,0.8)]'
          }`}></div>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="min-h-[2.5rem] flex items-start bg-black/40 rounded p-2 border border-white/5">
        <p className={`text-xs font-mono leading-relaxed ${error ? 'text-red-400' : 'text-cyan-100'}`}>
          <span className="mr-1.5 text-cyan-600 select-none">{'>'}</span>
          {displayedAdvice}
          <span className="inline-block w-1.5 h-3 bg-cyan-500/80 ml-0.5 align-middle animate-pulse"></span>
        </p>
      </div>
    </div>
  );
};

export default RobotAIDiagnosis;
