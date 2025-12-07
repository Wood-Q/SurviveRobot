import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  Clock, 
  Timer, 
  Battery, 
  Zap, 
  Droplet, 
  Utensils, 
  Flashlight, 
  Eye, 
  Thermometer, 
  Wind, 
  EyeOff,
  Activity,
  Signal,
  Crosshair
} from 'lucide-react';

const HUDPanel = ({ children, className = '' }) => (
  <div className={`bg-black/60 backdrop-blur-md border border-white/10 rounded-lg p-4 text-white shadow-lg pointer-events-auto ${className}`}>
    {children}
  </div>
);

const RobotHUD = ({ robotState, isSocketConnected, onAction, isMoving }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [missionTime, setMissionTime] = useState(0);

  // Update time and mission timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setMissionTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Helper for button interactions
  const handleMouseDown = (action, value) => {
    if (onAction) onAction('down', action, value);
  };

  const handleMouseUp = (action, value) => {
    if (onAction) onAction('up', action, value);
  };

  const handleClick = (action, value) => {
    if (onAction) onAction('click', action, value);
  };

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6 select-none overflow-hidden font-sans">
      
      {/* --- TOP ROW --- */}
      <div className="flex justify-between items-start w-full">
        
        {/* Top Left: System Status */}
        <HUDPanel className="flex flex-col gap-2 min-w-[200px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-1">
            <span className="text-xs text-gray-400 uppercase tracking-wider">System Status</span>
            <div className={`w-2 h-2 rounded-full ${isSocketConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          </div>
          
          <div className="flex items-center gap-3">
            <Signal size={18} className={isSocketConnected ? 'text-green-400' : 'text-red-400'} />
            <span className="font-mono text-lg font-bold tracking-widest">{isSocketConnected ? 'ONLINE' : 'OFFLINE'}</span>
          </div>

          <div className="flex justify-between items-center text-sm font-mono text-gray-300 mt-1">
            <div className="flex items-center gap-1.5">
              <Clock size={14} />
              <span>{formatTime(currentTime)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Timer size={14} />
              <span>{formatDuration(missionTime)}</span>
            </div>
          </div>
        </HUDPanel>

        {/* Top Center: Environment Monitor */}
        <HUDPanel className="flex gap-6 px-6 py-3">
          {/* Temperature */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1 text-gray-400 text-xs uppercase">
              <Thermometer size={14} /> Temp
            </div>
            <span className={`font-mono text-xl font-bold ${robotState.temperature > 30 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              {robotState.temperature.toFixed(1)}°C
            </span>
          </div>

          <div className="w-px bg-white/10"></div>

          {/* Air Quality */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1 text-gray-400 text-xs uppercase">
              <Wind size={14} /> CO Level
            </div>
            <span className={`font-mono text-xl font-bold ${robotState.gasLevel > 0.6 ? 'text-yellow-500' : 'text-green-400'}`}>
              {(robotState.gasLevel * 100).toFixed(0)}%
            </span>
          </div>

          <div className="w-px bg-white/10"></div>

          {/* Visibility */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1 text-gray-400 text-xs uppercase">
              <Eye size={14} /> Vis
            </div>
            <span className={`font-mono text-xl font-bold ${robotState.visibility < 0.5 ? 'text-yellow-500' : 'text-blue-400'}`}>
              {(robotState.visibility * 100).toFixed(0)}%
            </span>
          </div>
        </HUDPanel>

        {/* Top Right: Reserved for Mini-map (Empty for now to not obscure) */}
        <div className="w-[200px]"></div> 
      </div>

      {/* --- CENTER --- */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60">
        <Crosshair size={48} className="text-white/80" strokeWidth={1} />
        {/* Optional: Artificial Horizon or Pitch/Roll indicators could go here */}
      </div>

      {/* --- BOTTOM ROW --- */}
      <div className="flex justify-between items-end w-full">
        
        {/* Bottom Left: Mobility Status */}
        <HUDPanel className="flex flex-col gap-4 min-w-[250px]">
          {/* Battery */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1 uppercase">
              <span>Battery</span>
              <span>{robotState.battery}%</span>
            </div>
            <div className="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${robotState.battery < 20 ? 'bg-red-500' : 'bg-green-500'}`} 
                style={{ width: `${robotState.battery}%` }}
              ></div>
            </div>
          </div>

          {/* Speed / Coordinates */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white/5 rounded p-2 text-center">
                <div className="text-[10px] text-gray-500 uppercase">Speed</div>
                <div className="font-mono text-lg font-bold text-blue-400">0.0 m/s</div>
             </div>
             <div className="bg-white/5 rounded p-2 text-center">
                <div className="text-[10px] text-gray-500 uppercase">Altitude</div>
                <div className="font-mono text-lg font-bold text-blue-400">{robotState.position.y.toFixed(1)} m</div>
             </div>
          </div>

          {/* WASD Hints */}
          <div className="grid grid-cols-3 gap-1 w-fit mx-auto mt-2">
             <div></div>
             <div className={`w-8 h-8 border border-white/20 rounded flex items-center justify-center text-xs font-bold transition-colors ${isMoving.forward ? 'bg-blue-500 text-white border-blue-500' : 'text-gray-500'}`}>W</div>
             <div></div>
             <div className={`w-8 h-8 border border-white/20 rounded flex items-center justify-center text-xs font-bold transition-colors ${isMoving.left ? 'bg-blue-500 text-white border-blue-500' : 'text-gray-500'}`}>A</div>
             <div className={`w-8 h-8 border border-white/20 rounded flex items-center justify-center text-xs font-bold transition-colors ${isMoving.back ? 'bg-blue-500 text-white border-blue-500' : 'text-gray-500'}`}>S</div>
             <div className={`w-8 h-8 border border-white/20 rounded flex items-center justify-center text-xs font-bold transition-colors ${isMoving.right ? 'bg-blue-500 text-white border-blue-500' : 'text-gray-500'}`}>D</div>
          </div>
        </HUDPanel>

        {/* Bottom Right: Interaction */}
        <div className="flex gap-4 items-end">
          
          {/* Tools */}
          <HUDPanel className="flex flex-col gap-3">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1 border-b border-white/10 pb-1">Tools</div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleClick('toggle', 'flashlight')}
                className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-1 w-16 ${robotState.isFlashlightOn ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
              >
                <Flashlight size={20} />
                <span className="text-[10px] font-bold">LIGHT</span>
              </button>
              <button 
                onClick={() => handleClick('toggle', 'nightvision')}
                className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-1 w-16 ${robotState.isNightvisionOn ? 'bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
              >
                {robotState.isNightvisionOn ? <Eye size={20} /> : <EyeOff size={20} />}
                <span className="text-[10px] font-bold">NVG</span>
              </button>
            </div>
          </HUDPanel>

          {/* Supplies */}
          <HUDPanel className="flex flex-col gap-3">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1 border-b border-white/10 pb-1">Deploy</div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleClick('drop', 'water')}
                className="group relative p-4 rounded-lg bg-blue-500/20 border border-blue-500/50 hover:bg-blue-500/30 transition-all active:scale-95"
              >
                <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full border border-black/50">
                  {robotState.waterCount}
                </div>
                <Droplet size={24} className="text-blue-400 group-hover:text-blue-300 mb-1" />
                <div className="text-[10px] font-bold text-blue-300">WATER</div>
              </button>

              <button 
                onClick={() => handleClick('drop', 'food')}
                className="group relative p-4 rounded-lg bg-orange-500/20 border border-orange-500/50 hover:bg-orange-500/30 transition-all active:scale-95"
              >
                <div className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full border border-black/50">
                  {robotState.foodCount}
                </div>
                <Utensils size={24} className="text-orange-400 group-hover:text-orange-300 mb-1" />
                <div className="text-[10px] font-bold text-orange-300">FOOD</div>
              </button>
            </div>
          </HUDPanel>

        </div>
      </div>
    </div>
  );
};

export default RobotHUD;
