import React, { useState } from 'react';
import {
  Sparkles,
  Package,
  AlertTriangle,
  Bell,
  UserCheck,
  PawPrint,
  Watch,
  Heart,
  Volume2,
  Cpu,
  RotateCcw,
  Send,
  Zap,
  Sliders,
  PlayCircle,
  ShieldCheck,
} from 'lucide-react';
import { RING_PRESETS, BEE_PRESETS } from '../assets/mediaPresets.js';

export function JudgeSimulationDock({
  onTriggerRing,
  onUpdateBee,
  onResetDemo,
  onAskAlexaVoice,
  state,
}) {
  const [customVoiceQuery, setCustomVoiceQuery] = useState('');
  const [activeBeeId, setActiveBeeId] = useState('relaxing');
  const [heartRate, setHeartRate] = useState(68);
  const [ambientNoise, setAmbientNoise] = useState(40);
  const [focusIndex, setFocusIndex] = useState(72);

  const handleBeePreset = (preset) => {
    setActiveBeeId(preset.id);
    setHeartRate(preset.heartRateBpm);
    setAmbientNoise(preset.ambientNoiseDb);
    setFocusIndex(preset.focusIndex);

    onUpdateBee({
      focusState: preset.focusState,
      focusIndex: preset.focusIndex,
      heartRateBpm: preset.heartRateBpm,
      ambientNoiseDb: preset.ambientNoiseDb,
      stressLevel: preset.stressLevel,
    });
  };

  const handleManualBeeSlider = (field, val) => {
    let newFocus = focusIndex;
    let newHr = heartRate;
    let newNoise = ambientNoise;

    if (field === 'focus') {
      newFocus = val;
      setFocusIndex(val);
    } else if (field === 'hr') {
      newHr = val;
      setHeartRate(val);
    } else if (field === 'noise') {
      newNoise = val;
      setAmbientNoise(val);
    }

    onUpdateBee({
      focusState: newFocus >= 90 ? 'Deep Focus' : newFocus <= 50 ? 'Active / Cooking' : 'Relaxing',
      focusIndex: newFocus,
      heartRateBpm: newHr,
      ambientNoiseDb: newNoise,
    });
  };

  const handleVoiceSubmit = (e) => {
    e.preventDefault();
    if (!customVoiceQuery.trim()) return;
    onAskAlexaVoice(customVoiceQuery);
    setCustomVoiceQuery('');
  };

  const lastDecision = state?.bedrock?.lastDecision;

  return (
    <div className="w-full space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between bg-vega-surface/60 border border-white/10 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amazon-orange/15 text-amazon-orange border border-amazon-orange/30 shadow-neon-orange">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
              Judge Interactive Simulation Dock
              <span className="text-xs font-mono font-normal text-slate-400">
                (Real-Time Test Console)
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Trigger Ring front-door events and Bee wearable biometrics to watch Fire TV & AWS Bedrock react in real-time.
            </p>
          </div>
        </div>

        <button
          onClick={onResetDemo}
          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 font-semibold flex items-center gap-1.5 transition-colors"
          title="Reset Living Room to Baseline"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo</span>
        </button>
      </div>

      {/* Grid: 1. Ring Event Injector & 2. Bee Wearable Controller */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ================================================================== */}
        {/* PANEL 1: RING EVENT INJECTOR (FRONT DOOR)                         */}
        {/* ================================================================== */}
        <div className="bg-vega-surface border border-white/10 rounded-2xl p-5 space-y-4 shadow-tv-card">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amazon-orange" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                1. Inject Ring Doorbell Event
              </h4>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Webhooks @ /webhooks/ring
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {RING_PRESETS.map((preset) => {
              const Icon =
                preset.iconName === 'Package'
                  ? Package
                  : preset.iconName === 'AlertTriangle'
                  ? AlertTriangle
                  : preset.iconName === 'Bell'
                  ? Bell
                  : preset.iconName === 'UserCheck'
                  ? UserCheck
                  : PawPrint;

              return (
                <button
                  key={preset.id}
                  onClick={() => onTriggerRing(preset)}
                  className="text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amazon-orange/50 transition-all group flex flex-col justify-between space-y-2 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="p-2 rounded-lg bg-black/40 text-amazon-orange border border-white/5 group-hover:scale-110 transition-transform">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                      TRIGGER
                    </span>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-amazon-orange transition-colors">
                      {preset.title}
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {preset.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================================================================== */}
        {/* PANEL 2: BEE WEARABLE INTELLIGENCE CONTROLLER                     */}
        {/* ================================================================== */}
        <div className="bg-vega-surface border border-white/10 rounded-2xl p-5 space-y-4 shadow-tv-card">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Watch className="w-4 h-4 text-purple-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                2. Bee Wearable Context State
              </h4>
            </div>
            <span className="text-[11px] font-mono text-purple-300">
              BLE Telemetry @ /telemetry/bee
            </span>
          </div>

          {/* Quick Presets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {BEE_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleBeePreset(p)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  activeBeeId === p.id
                    ? 'bg-purple-500/20 border-purple-500 text-white shadow-neon-orange'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="text-xs font-bold truncate">{p.title}</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                  Focus: {p.focusIndex}%
                </div>
              </button>
            ))}
          </div>

          {/* Biometric Sliders */}
          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                  Cognitive Focus Index:
                </span>
                <span className="font-mono font-bold text-purple-300">{focusIndex}/100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={focusIndex}
                onChange={(e) => handleManualBeeSlider('focus', Number(e.target.value))}
                className="w-full accent-purple-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                <span>Distracted</span>
                <span>Relaxed (Movie)</span>
                <span className="text-purple-400 font-bold">Deep Focus (Whisper)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-red-400" /> Heart Rate:
                  </span>
                  <span className="font-mono text-red-300">{heartRate} BPM</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={heartRate}
                  onChange={(e) => handleManualBeeSlider('hr', Number(e.target.value))}
                  className="w-full accent-red-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                  <span className="flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> Ambient Noise:
                  </span>
                  <span className="font-mono text-cyan-300">{ambientNoise} dB</span>
                </div>
                <input
                  type="range"
                  min="25"
                  max="90"
                  value={ambientNoise}
                  onChange={(e) => handleManualBeeSlider('noise', Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* PANEL 3: AWS BEDROCK AGENTCORE DECISION INSPECTOR                    */}
      {/* ==================================================================== */}
      <div className="bg-vega-surface border border-white/10 rounded-2xl p-5 space-y-4 shadow-tv-card">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-alexa-cyan" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              3. AWS Bedrock AgentCore Reasoning Inspector (AWS Mini-Challenge)
            </h4>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Model: {lastDecision?.modelId || 'anthropic.claude-3-5-sonnet'}</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">
              Latency: {lastDecision?.latencyMs || 185}ms
            </span>
          </div>
        </div>

        {lastDecision ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/40 border border-white/5 rounded-xl p-3 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-500">
                Determined Intervention Action
              </span>
              <div className="text-base font-black text-amazon-orange tracking-wide">
                {lastDecision.action}
              </div>
              <div className="text-[11px] text-slate-400">
                Priority: {lastDecision.urgency} | Ducking: {Math.round(lastDecision.audioDuckingLevel * 100)}%
              </div>
            </div>

            <div className="bg-black/40 border border-white/5 rounded-xl p-3 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-500">
                Generated Director Script
              </span>
              <p className="text-xs text-slate-200 italic line-clamp-3">
                "{lastDecision.directorCommentary}"
              </p>
            </div>

            <div className="bg-black/40 border border-white/5 rounded-xl p-3 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-500">
                Multimodal Context Reasoning
              </span>
              <p className="text-[11px] text-slate-300 font-mono line-clamp-3">
                {lastDecision.reasoning}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-500 font-mono">
            Awaiting first smart home event trigger. Click any Ring trigger above to observe Bedrock AgentCore.
          </div>
        )}

        {/* Alexa Voice Query Simulator Box */}
        <form onSubmit={handleVoiceSubmit} className="pt-2 flex items-center gap-2">
          <input
            type="text"
            value={customVoiceQuery}
            onChange={(e) => setCustomVoiceQuery(e.target.value)}
            placeholder='Type or ask Alexa: "Alexa, who is at the front door?" or "What arrived?"'
            className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-alexa-cyan transition-colors"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-alexa-cyan text-black text-xs font-bold hover:bg-alexa-cyan/80 transition-colors flex items-center gap-1.5 shadow-neon-cyan"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ask Alexa</span>
          </button>
        </form>
      </div>
    </div>
  );
}
