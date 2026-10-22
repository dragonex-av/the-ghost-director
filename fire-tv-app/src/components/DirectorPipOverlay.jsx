import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  X,
  ShieldAlert,
  Package,
  UserCheck,
  Bell,
  Sparkles,
  Maximize,
  Radio,
} from 'lucide-react';

export function DirectorPipOverlay({
  pipData,
  ringState,
  onDismiss,
  onToggleMic,
  twoWayAudioActive,
}) {
  if (!pipData) return null;

  const isUrgent = pipData.urgency === 'HIGH' || pipData.urgency === 'CRITICAL';
  const isPackage = ringState?.lastEvent?.packageDetected;
  const headline = pipData.pipHeadline || ringState?.lastEvent?.label || 'Front Entryway Activity';
  const commentary = pipData.directorCommentary || 'The Ghost-Director is monitoring entryway.';
  const duckingPercent = Math.round((pipData.audioDuckingLevel ?? 0.35) * 100);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.85, x: 80, y: -40 }}
        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, x: 80, y: -40 }}
        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        className="fixed top-6 right-6 lg:top-8 lg:right-8 z-50 w-[380px] sm:w-[440px] md:w-[480px] rounded-2xl overflow-hidden backdrop-blur-xl bg-vega-surface/95 border-2 shadow-2xl transition-all"
        style={{
          borderColor: isUrgent ? '#EF4444' : '#FF9900',
          boxShadow: isUrgent
            ? '0 0 35px rgba(239, 68, 68, 0.4), 0 15px 35px rgba(0, 0, 0, 0.8)'
            : '0 0 35px rgba(255, 153, 0, 0.35), 0 15px 35px rgba(0, 0, 0, 0.8)',
        }}
      >
        {/* Top Header Bar */}
        <div className="bg-vega-bg/90 px-4 py-2.5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full animate-ping ${
                isUrgent ? 'bg-red-500' : 'bg-amazon-orange'
              }`}
            />
            <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amazon-orange" />
              Director Mode PiP
            </span>
            <span
              className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                isUrgent
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-amazon-orange/20 text-amazon-orange border border-amazon-orange/30'
              }`}
            >
              {pipData.urgency || 'MEDIUM'} PRIORITY
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Ducking Status */}
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-300 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
              <Volume2 className="w-3 h-3 text-alexa-cyan animate-pulse" />
              <span>Ducked to {duckingPercent}%</span>
            </div>

            <button
              onClick={onDismiss}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
              title="Dismiss PiP (Remote: Back)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Ring Camera Stream Viewport */}
        <div className="relative aspect-video w-full bg-black overflow-hidden group">
          <img
            src={ringState?.currentSnapshotUrl || ringState?.lastEvent?.snapshotUrl}
            alt="Ring Front Door Live Stream"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {/* CRT Scanline Overlay Effect */}
          <div className="absolute inset-0 camera-scanline pointer-events-none opacity-40" />

          {/* HUD Overlay Graphics */}
          <div className="absolute inset-0 p-3 flex flex-col justify-between pointer-events-none">
            {/* Top HUD Data */}
            <div className="flex items-center justify-between text-[11px] font-mono">
              <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-red-400 font-bold border border-red-500/30">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span>LIVE RING 1080P</span>
              </div>
              <div className="bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-slate-300 border border-white/10">
                {new Date().toLocaleTimeString()}
              </div>
            </div>

            {/* Target Recognition Bounding Box */}
            <div className="self-center my-auto w-36 h-28 border-2 border-dashed border-alexa-cyan/80 rounded-lg flex flex-col justify-between p-1 shadow-neon-cyan animate-pulse">
              <div className="flex justify-between items-center text-[9px] font-mono font-bold text-alexa-cyan bg-black/75 px-1 rounded">
                <span>{isPackage ? 'OBJECT: PARCEL' : 'PERSON_LOCK'}</span>
                <span>{Math.round((ringState?.lastEvent?.confidence ?? 0.94) * 100)}%</span>
              </div>
              <div className="flex justify-center">
                <div className="w-3 h-3 border-t-2 border-l-2 border-alexa-cyan" />
              </div>
            </div>

            {/* Bottom HUD Location Tag */}
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-slate-300 border border-white/10 flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-400" />
                Front Entryway (Ch. 01)
              </span>

              {twoWayAudioActive && (
                <span className="bg-emerald-500/90 text-black font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-lg animate-bounce">
                  <Mic className="w-3 h-3" />
                  2-WAY TALK ON
                </span>
              )}
            </div>
          </div>
        </div>

        {/* AI Director Script & Commentary Card */}
        <div className="p-4 bg-vega-surface border-t border-white/10">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amazon-orange/10 text-amazon-orange border border-amazon-orange/20 mt-0.5 shrink-0">
              {isPackage ? (
                <Package className="w-5 h-5 text-amazon-orange" />
              ) : isUrgent ? (
                <ShieldAlert className="w-5 h-5 text-red-400" />
              ) : (
                <Bell className="w-5 h-5 text-alexa-cyan" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white truncate">{headline}</h4>
                <span className="text-[10px] font-mono text-alexa-cyan">
                  AWS Bedrock AgentCore
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed font-sans line-clamp-3">
                "{commentary}"
              </p>
            </div>
          </div>

          {/* Interactive Fire TV Remote Action Buttons */}
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
            <button
              onClick={onToggleMic}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                twoWayAudioActive
                  ? 'bg-emerald-500 text-black shadow-lg'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
              }`}
            >
              {twoWayAudioActive ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              <span>{twoWayAudioActive ? 'Mute Intercom' : 'Talk via Ring'}</span>
              <span className="text-[10px] opacity-60 ml-0.5 font-mono">[Select]</span>
            </button>

            <button
              onClick={onDismiss}
              className="py-2 px-3 rounded-xl text-xs font-semibold bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1"
            >
              <span>Dismiss</span>
              <span className="text-[10px] font-mono opacity-60">[Back]</span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
