import React from 'react';
import { Watch, Heart, Volume2, Battery, Zap, MapPin } from 'lucide-react';

export function BeeWearableCard({ beeState }) {
  if (!beeState) return null;

  const focusScore = beeState.focusIndex ?? 78;
  const hr = beeState.heartRateBpm ?? 68;
  const noise = beeState.ambientNoiseDb ?? 40;
  const isDeepFocus = focusScore >= 90;

  return (
    <div className="bg-vega-surface border border-white/10 rounded-2xl p-5 space-y-4 shadow-tv-card relative overflow-hidden">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Watch className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Bee Wearable Intelligence
            </h4>
            <div className="text-[10px] font-mono text-slate-400">
              {beeState.deviceModel || 'Bee Alpha 1'} • BLE Connected
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1 text-emerald-400">
            <Battery className="w-3.5 h-3.5" />
            <span>{beeState.batteryLevel || 88}%</span>
          </div>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Metric 1: Focus Score */}
        <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col items-center text-center justify-between">
          <div className="flex items-center gap-1 text-[10px] font-mono uppercase text-slate-400">
            <Zap className="w-3 h-3 text-purple-400" /> Focus
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-300 font-mono my-1">
            {focusScore}%
          </div>
          <span
            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
              isDeepFocus
                ? 'bg-purple-500/30 text-purple-300 border border-purple-400'
                : 'bg-white/10 text-slate-400'
            }`}
          >
            {beeState.focusState || 'Relaxing'}
          </span>
        </div>

        {/* Metric 2: Heart Rate */}
        <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col items-center text-center justify-between">
          <div className="flex items-center gap-1 text-[10px] font-mono uppercase text-slate-400">
            <Heart className="w-3 h-3 text-rose-500 animate-pulse" /> Heart Rate
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono my-1">
            {hr}
          </div>
          <span className="text-[9px] font-mono text-slate-400">BPM (Resting)</span>
        </div>

        {/* Metric 3: Ambient Noise */}
        <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col items-center text-center justify-between">
          <div className="flex items-center gap-1 text-[10px] font-mono uppercase text-slate-400">
            <Volume2 className="w-3 h-3 text-cyan-400" /> Acoustic
          </div>
          <div className="text-xl sm:text-2xl font-black text-cyan-300 font-mono my-1">
            {noise}
          </div>
          <span className="text-[9px] font-mono text-slate-400">dB (Quiet Room)</span>
        </div>
      </div>

      {/* User Location Tag */}
      <div className="flex items-center justify-between text-[11px] font-mono bg-white/5 px-3 py-2 rounded-xl text-slate-300">
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-amazon-orange" />
          <span>Location: {beeState.userLocation || 'Living Room Couch'}</span>
        </span>
        <span className="text-slate-500">
          Sync: {new Date(beeState.lastTelemetryTimestamp || Date.now()).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
