import React from 'react';
import { Bell, Mic, MicOff, Radio, Shield, Clock } from 'lucide-react';

export function RingCameraCard({ ringState, onToggleMic }) {
  if (!ringState) return null;

  const lastEvent = ringState.lastEvent;
  const twoWayActive = ringState.twoWayTalkActive;

  return (
    <div className="bg-vega-surface border border-white/10 rounded-2xl p-5 space-y-4 shadow-tv-card relative overflow-hidden">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amazon-orange/15 text-amazon-orange border border-amazon-orange/30">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Ring Video Doorbell Pro 2
            </h4>
            <div className="text-[10px] font-mono text-slate-400">
              Front Porch • {ringState.batteryLevel || 'Hardwired (100%)'}
            </div>
          </div>
        </div>

        <button
          onClick={onToggleMic}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            twoWayActive
              ? 'bg-emerald-500 text-black shadow-lg animate-pulse'
              : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
          }`}
        >
          {twoWayActive ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          <span>{twoWayActive ? 'Mic Active' : '2-Way Talk'}</span>
        </button>
      </div>

      {/* Snapshot Preview */}
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10 group">
        <img
          src={ringState.currentSnapshotUrl || lastEvent?.snapshotUrl}
          alt="Ring Entryway"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

        {/* Status badges */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-mono">
          <span className="bg-black/75 backdrop-blur-md px-2 py-0.5 rounded text-amazon-orange font-bold border border-amazon-orange/30 flex items-center gap-1">
            <Radio className="w-3 h-3 animate-pulse" />
            {lastEvent?.label || 'Front Entry Clear'}
          </span>
          <span className="bg-black/75 backdrop-blur-md px-2 py-0.5 rounded text-slate-300 border border-white/10">
            {lastEvent?.packageDetected ? '📦 Package Detected' : 'Motion Clear'}
          </span>
        </div>
      </div>

      {/* Recent Event History */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-mono uppercase text-slate-500">Recent Doorbell Events</span>
        <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
          {ringState.eventHistory && ringState.eventHistory.length > 0 ? (
            ringState.eventHistory.slice(0, 3).map((evt, idx) => (
              <div
                key={evt.id || idx}
                className="text-[11px] font-mono bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5 flex items-center justify-between"
              >
                <span className="text-slate-300 truncate max-w-[200px]">{evt.label}</span>
                <span className="text-slate-500 text-[10px]">
                  {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          ) : (
            <div className="text-[11px] text-slate-500 font-mono italic">No previous events</div>
          )}
        </div>
      </div>
    </div>
  );
}
