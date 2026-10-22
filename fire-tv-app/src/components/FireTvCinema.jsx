import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Tv,
  Film,
  Sparkles,
  Info,
  Sliders,
  Radio,
  Layers,
} from 'lucide-react';
import { FIRE_TV_CONTENT_PRESETS } from '../assets/mediaPresets.js';

export function FireTvCinema({
  fireTvState,
  onTogglePlay,
  audioDuckingLevel,
  subtitleWhisper,
}) {
  const [selectedMovieIndex, setSelectedMovieIndex] = useState(0);
  const [timecode, setTimecode] = useState(2652); // in seconds (44:12)
  const [showSafeGuides, setShowSafeGuides] = useState(false);

  const movie = FIRE_TV_CONTENT_PRESETS[selectedMovieIndex];
  const isPlaying = fireTvState?.isPlaying !== false;
  const duckingMultiplier = audioDuckingLevel ?? fireTvState?.currentAudioDucking ?? 1.0;
  const effectiveVolume = Math.round((fireTvState?.baseVolume ?? 75) * duckingMultiplier);

  // Timecode progress simulation
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTimecode((prev) => (prev >= 3760 ? 1200 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full aspect-[16/9] min-h-[520px] max-h-[820px] bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col justify-between group select-none">
      {/* Background Cinematic Movie Backdrop */}
      <div className="absolute inset-0 z-0">
        <img
          src={movie.backdropUrl}
          alt={movie.title}
          className={`w-full h-full object-cover transition-all duration-1000 ${
            isPlaying ? 'scale-105 opacity-90' : 'scale-100 opacity-60 filter brightness-75'
          }`}
        />
        {/* Cinematic Vignette & Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80 pointer-events-none" />
      </div>

      {/* TV Safe Area Guidelines (Overscan Visualization for Vega OS & Fire OS) */}
      {showSafeGuides && (
        <div className="absolute inset-8 lg:inset-12 border-2 border-dashed border-amazon-orange/40 pointer-events-none z-30 flex flex-col justify-between p-2">
          <div className="text-[10px] font-mono text-amazon-orange bg-black/60 px-2 py-0.5 rounded w-max">
            VEGA OS 10-FOOT TV SAFE AREA (48PX OVERSCAN PROTECTION)
          </div>
          <div className="text-[10px] font-mono text-amazon-orange bg-black/60 px-2 py-0.5 rounded self-end">
            1080P / 4K UHD BOUNDS
          </div>
        </div>
      )}

      {/* Top TV Header: Prime Video & Audio Specs */}
      <div className="relative z-10 p-6 lg:p-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-amazon-prime text-black font-black text-xs rounded-md uppercase tracking-wider shadow-neon-prime">
            Prime Video
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <span className="px-2 py-0.5 bg-white/10 rounded border border-white/10 font-mono">
              4K UHD
            </span>
            <span className="px-2 py-0.5 bg-white/10 rounded border border-white/10 font-mono">
              HDR10+
            </span>
            <span className="px-2 py-0.5 bg-white/10 rounded border border-white/10 font-mono">
              DOLBY ATMOS
            </span>
            <span className="px-2 py-0.5 bg-amazon-orange/20 text-amazon-orange rounded border border-amazon-orange/30 font-mono font-bold">
              X-RAY
            </span>
          </div>
        </div>

        {/* Content Switcher Pills & Safe Guide Toggle */}
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-2 py-1.5 rounded-xl border border-white/10">
          <button
            onClick={() => setShowSafeGuides(!showSafeGuides)}
            className={`px-2.5 py-1 text-xs rounded-lg font-mono transition-all ${
              showSafeGuides ? 'bg-amazon-orange text-black font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle TV Safe Area Guides"
          >
            Safe Area
          </button>

          <div className="w-[1px] h-4 bg-white/20" />

          {FIRE_TV_CONTENT_PRESETS.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setSelectedMovieIndex(idx)}
              className={`px-2.5 py-1 text-xs rounded-lg transition-all font-medium ${
                selectedMovieIndex === idx
                  ? 'bg-white/20 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p.id === 'fallout' ? 'Fallout' : p.id === 'rings-of-power' ? 'Rings of Power' : 'Cyberpunk'}
            </button>
          ))}
        </div>
      </div>

      {/* Center Cinematic Subtitle Whisper (Shown during Deep Focus Wearable State) */}
      {subtitleWhisper && (
        <div className="relative z-20 self-center max-w-xl mx-auto px-6 py-3 rounded-2xl bg-black/85 backdrop-blur-xl border border-alexa-cyan/40 shadow-neon-cyan text-center animate-fade-in">
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-alexa-cyan uppercase font-bold tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            Ghost-Director Ambient Whisper
          </div>
          <p className="text-sm sm:text-base font-semibold text-white tracking-wide">
            {subtitleWhisper}
          </p>
        </div>
      )}

      {/* Bottom TV Playback Control Deck & Audio Ducking Visualizer */}
      <div className="relative z-10 p-6 lg:p-10 space-y-4">
        {/* Title & Metadata */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-amazon-orange tracking-widest uppercase">
              {movie.genre}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-mono">Scene: {movie.sceneIntensity}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
            {movie.title}
          </h2>
          <p className="text-sm text-slate-300 max-w-xl line-clamp-2 mt-1 drop-shadow">
            {movie.tagline}
          </p>
        </div>

        {/* Video Scrubber Timeline */}
        <div className="space-y-1.5">
          <div className="relative w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-amazon-orange to-alexa-cyan rounded-full transition-all duration-300 shadow-neon-orange"
              style={{ width: `${(timecode / 3760) * 100}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs font-mono text-slate-400">
            <span>{formatTime(timecode)}</span>
            <span className="text-slate-600">60 FPS • 3840x2160</span>
            <span>01:02:40</span>
          </div>
        </div>

        {/* Media Controls Bar with Dynamic Audio Ducking Spectrum */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center gap-3">
            {/* Play / Pause Button */}
            <button
              onClick={onTogglePlay}
              className="w-12 h-12 rounded-2xl bg-white text-black hover:bg-amazon-orange transition-all flex items-center justify-center font-bold shadow-lg"
              title="Toggle Play / Pause (Remote: Play button)"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                {isPlaying ? 'Now Playing' : 'Playback Paused'}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Press [Play/Pause] or [Space] on remote
              </div>
            </div>
          </div>

          {/* Real-time Dynamic Audio Ducking Spectrum Visualizer */}
          <div className="flex items-center gap-4 bg-vega-surface/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2">
              <Volume2
                className={`w-4 h-4 ${
                  duckingMultiplier < 0.9 ? 'text-amazon-orange animate-pulse' : 'text-slate-300'
                }`}
              />
              <div className="flex flex-col">
                <span className="text-[10px] font-mono uppercase text-slate-400">
                  Living Room Audio
                </span>
                <span className="text-xs font-mono font-bold text-white">
                  {effectiveVolume}% {duckingMultiplier < 0.9 && `(Ducked ${(1 - duckingMultiplier) * 100}%)`}
                </span>
              </div>
            </div>

            {/* Simulated Audio Spectrum Bars that Compress when Ducked */}
            <div className="flex items-end gap-1 h-6 w-24">
              {[60, 90, 45, 100, 75, 85, 30, 95, 65, 80].map((baseHeight, i) => {
                // When audio is ducked, bar height is dynamically scaled down
                const currentHeight = isPlaying ? Math.max(15, baseHeight * duckingMultiplier) : 10;
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-full transition-all duration-200 ${
                      duckingMultiplier < 0.9
                        ? 'bg-amazon-orange shadow-neon-orange'
                        : 'bg-alexa-cyan shadow-neon-cyan'
                    }`}
                    style={{ height: `${currentHeight}%` }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
