import React from 'react';
import {
  Mic,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Home,
  Menu,
  Volume2,
  Volume1,
  X,
  Tv,
} from 'lucide-react';

export function FireTvRemoteModal({
  isOpen,
  onClose,
  onDpad,
  onSelect,
  onBack,
  onPlayPause,
  onMic,
  isPlaying,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-vega-surface border-2 border-white/20 rounded-[44px] p-6 w-[280px] sm:w-[300px] shadow-2xl flex flex-col items-center space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Remote Header / Brand */}
        <div className="text-center pt-2">
          <div className="text-xs font-black tracking-widest text-slate-400 uppercase flex items-center justify-center gap-1">
            <Tv className="w-3.5 h-3.5 text-amazon-orange" />
            Fire TV Remote
          </div>
          <div className="text-[10px] font-mono text-slate-500">Vega OS 10-Foot Controller</div>
        </div>

        {/* Alexa Cyan Voice Mic Button */}
        <button
          onClick={onMic}
          className="w-16 h-16 rounded-full bg-alexa-cyan text-black hover:bg-cyan-300 transition-all flex items-center justify-center shadow-neon-cyan active:scale-95 group"
          title="Hold to Speak to Alexa+ MCP"
        >
          <Mic className="w-7 h-7 group-hover:scale-110 transition-transform" />
        </button>

        {/* Directional Pad (D-Pad Circle) */}
        <div className="relative w-48 h-48 rounded-full bg-black/60 border-2 border-white/15 p-2 flex items-center justify-center shadow-inner">
          {/* Up */}
          <button
            onClick={() => onDpad('UP')}
            className="absolute top-2 w-12 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-t-full transition-colors"
          >
            <ArrowUp className="w-5 h-5" />
          </button>

          {/* Down */}
          <button
            onClick={() => onDpad('DOWN')}
            className="absolute bottom-2 w-12 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-b-full transition-colors"
          >
            <ArrowDown className="w-5 h-5" />
          </button>

          {/* Left */}
          <button
            onClick={() => onDpad('LEFT')}
            className="absolute left-2 h-12 w-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-l-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Right */}
          <button
            onClick={() => onDpad('RIGHT')}
            className="absolute right-2 h-12 w-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-r-full transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Center Select Button */}
          <button
            onClick={onSelect}
            className="w-20 h-20 rounded-full bg-vega-surfaceHover hover:bg-amazon-orange hover:text-black text-white font-black text-xs transition-all flex items-center justify-center border border-white/10 shadow-lg active:scale-95"
          >
            SELECT
          </button>
        </div>

        {/* Control Button Rows */}
        <div className="w-full grid grid-cols-3 gap-3 pt-2">
          {/* Back */}
          <button
            onClick={onBack}
            className="h-12 rounded-2xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center border border-white/5 active:scale-95 transition-all"
            title="Back (Dismiss PiP)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Home */}
          <button
            onClick={onClose}
            className="h-12 rounded-2xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center border border-white/5 active:scale-95 transition-all"
            title="Home"
          >
            <Home className="w-4 h-4" />
          </button>

          {/* Menu */}
          <button
            className="h-12 rounded-2xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center border border-white/5 active:scale-95 transition-all"
            title="Options Menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Play / Pause */}
          <button
            onClick={onPlayPause}
            className="h-12 rounded-2xl bg-amazon-orange/20 text-amazon-orange hover:bg-amazon-orange hover:text-black flex items-center justify-center border border-amazon-orange/40 active:scale-95 transition-all"
            title="Play / Pause"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          {/* Volume Down */}
          <button
            className="h-12 rounded-2xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center border border-white/5 active:scale-95 transition-all"
            title="Volume Down"
          >
            <Volume1 className="w-4 h-4" />
          </button>

          {/* Volume Up */}
          <button
            className="h-12 rounded-2xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center border border-white/5 active:scale-95 transition-all"
            title="Volume Up"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {/* Keyboard shortcut legend */}
        <div className="text-[10px] text-slate-500 font-mono text-center">
          Keyboard: Arrows, Enter, Esc, P (Pause), M (Mic)
        </div>
      </div>
    </div>
  );
}
