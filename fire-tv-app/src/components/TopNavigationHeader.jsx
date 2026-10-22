import React from 'react';
import {
  Tv,
  Radio,
  Sparkles,
  Watch,
  Bell,
  Cpu,
  Mic,
  Maximize2,
  Sliders,
  Layers,
  Activity,
} from 'lucide-react';

export function TopNavigationHeader({
  state,
  connectionStatus,
  transportType,
  viewMode,
  setViewMode,
  onOpenRemote,
  onOpenVoiceMic,
}) {
  const isMcpConnected = connectionStatus === 'CONNECTED';
  const bedrockLatency = state?.bedrock?.lastDecision?.latencyMs || state?.bedrock?.averageLatencyMs || 185;

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="w-full bg-vega-surface/90 backdrop-blur-md border-b border-white/10 px-4 lg:px-8 py-3 flex items-center justify-between sticky top-0 z-40 transition-all">
      {/* Brand & Project Identity */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amazon-orange to-alexa-cyan p-0.5 shadow-neon-orange">
          <div className="w-full h-full bg-vega-bg rounded-[10px] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amazon-orange animate-pulse" />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black tracking-wider text-white uppercase flex items-center gap-1.5">
              The Ghost<span className="text-amazon-orange">-</span>Director
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amazon-orange/15 text-amazon-orange border border-amazon-orange/30">
              AMAZON HACKATHON
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
            <span>Fire TV 4K</span>
            <span className="text-slate-600">•</span>
            <span>Ring Vision</span>
            <span className="text-slate-600">•</span>
            <span>Alexa+ MCP</span>
            <span className="text-slate-600">•</span>
            <span>Bee Wearable</span>
          </p>
        </div>
      </div>

      {/* Real-time Hardware & Cloud Pipeline Status Badges */}
      <div className="hidden xl:flex items-center gap-2 text-xs">
        {/* MCP Streamable HTTP Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
          <Radio className={`w-3.5 h-3.5 ${isMcpConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
          <span className="text-slate-300 font-medium">Alexa+ MCP:</span>
          <span className={`font-mono text-[11px] ${isMcpConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isMcpConnected ? `${transportType}` : 'CONNECTING'}
          </span>
        </div>

        {/* AWS Bedrock AgentCore Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
          <Cpu className="w-3.5 h-3.5 text-alexa-cyan" />
          <span className="text-slate-300 font-medium">Bedrock AgentCore:</span>
          <span className="font-mono text-[11px] text-alexa-cyan">{bedrockLatency}ms</span>
        </div>

        {/* Bee Wearable BLE Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
          <Watch className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-slate-300 font-medium">Bee Wearable:</span>
          <span className="font-mono text-[11px] text-purple-300">
            {state?.bee?.focusState || 'Relaxing'} ({state?.bee?.focusIndex || 78}%)
          </span>
        </div>

        {/* Ring Doorbell Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
          <Bell className="w-3.5 h-3.5 text-amazon-orange" />
          <span className="text-slate-300 font-medium">Ring Doorbell:</span>
          <span className="font-mono text-[11px] text-amazon-orange">
            {state?.ring?.lastEvent?.packageDetected ? '📦 Package' : 'Active'}
          </span>
        </div>
      </div>

      {/* View Mode Switcher & Remote Control Button */}
      <div className="flex items-center gap-2">
        <div className="bg-vega-bg border border-white/10 p-1 rounded-xl flex items-center gap-1">
          <button
            onClick={() => setViewMode('cinema')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === 'cinema'
                ? 'bg-amazon-orange text-black shadow-neon-orange'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cinema TV</span>
          </button>

          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === 'split'
                ? 'bg-amazon-orange text-black shadow-neon-orange'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Judge Deck</span>
          </button>

          <button
            onClick={() => setViewMode('control')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === 'control'
                ? 'bg-amazon-orange text-black shadow-neon-orange'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Simulation</span>
          </button>
        </div>

        {/* Alexa Voice Trigger Button */}
        <button
          onClick={onOpenVoiceMic}
          className="p-2 rounded-xl bg-alexa-cyan/15 text-alexa-cyan border border-alexa-cyan/30 hover:bg-alexa-cyan hover:text-black transition-all flex items-center gap-1.5 text-xs font-semibold shadow-neon-cyan"
          title="Speak to Alexa Voice Remote"
        >
          <Mic className="w-4 h-4 animate-bounce" />
          <span className="hidden md:inline font-mono">Alexa</span>
        </button>

        {/* Remote Control Modal Trigger */}
        <button
          onClick={onOpenRemote}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all text-xs font-semibold flex items-center gap-1.5"
          title="Open Fire TV Remote Simulator"
        >
          <Tv className="w-4 h-4" />
          <span className="hidden md:inline">Remote</span>
        </button>

        {/* Fullscreen TV Mode */}
        <button
          onClick={toggleFullScreen}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          title="Toggle Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
