import React, { useState } from 'react';
import { useMcpStream } from './hooks/useMcpStream.js';
import { useTvDpadNavigation } from './hooks/useTvDpadNavigation.js';
import { TopNavigationHeader } from './components/TopNavigationHeader.jsx';
import { FireTvCinema } from './components/FireTvCinema.jsx';
import { DirectorPipOverlay } from './components/DirectorPipOverlay.jsx';
import { JudgeSimulationDock } from './components/JudgeSimulationDock.jsx';
import { BeeWearableCard } from './components/BeeWearableCard.jsx';
import { RingCameraCard } from './components/RingCameraCard.jsx';
import { FireTvRemoteModal } from './components/FireTvRemoteModal.jsx';
import { AlexaVoiceDialog } from './components/AlexaVoiceDialog.jsx';

export default function App() {
  const [viewMode, setViewMode] = useState('split'); // 'cinema' | 'split' | 'control'
  const [isRemoteOpen, setIsRemoteOpen] = useState(false);
  const [isVoiceDialogOpen, setIsVoiceDialogOpen] = useState(false);

  const {
    state,
    connectionStatus,
    transportType,
    voiceAssistantState,
    triggerRingPreset,
    updateBeeContext,
    dismissPip,
    togglePlayPause,
    toggleTwoWayTalk,
    askAlexaVoice,
    closeAlexaVoice,
    resetLivingRoom,
  } = useMcpStream();

  // Setup 10-Foot Fire OS / Vega OS Keyboard Remote Control
  useTvDpadNavigation({
    onSelect: () => {
      if (state?.fireTv?.pipActive) {
        toggleTwoWayTalk();
      }
    },
    onBack: () => {
      if (state?.fireTv?.pipActive) {
        dismissPip();
      } else if (isVoiceDialogOpen) {
        setIsVoiceDialogOpen(false);
      } else if (isRemoteOpen) {
        setIsRemoteOpen(false);
      }
    },
    onPlayPause: () => {
      togglePlayPause();
    },
    onMic: () => {
      setIsVoiceDialogOpen(true);
    },
  });

  const handleOpenVoice = () => {
    setIsVoiceDialogOpen(true);
  };

  const handleVoiceQuery = (query) => {
    askAlexaVoice(query);
  };

  return (
    <div className="min-h-screen bg-vega-bg text-slate-100 flex flex-col font-sans antialiased selection:bg-amazon-orange selection:text-black">
      {/* 1. Universal Top Navigation & Hardware Telemetry Header */}
      <TopNavigationHeader
        state={state}
        connectionStatus={connectionStatus}
        transportType={transportType}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenRemote={() => setIsRemoteOpen(true)}
        onOpenVoiceMic={handleOpenVoice}
      />

      {/* 2. Main Content Canvas */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* VIEW MODE A: FULL CINEMA TV VIEW (100% LIVING ROOM IMMERSION) */}
        {viewMode === 'cinema' && (
          <div className="w-full relative">
            <FireTvCinema
              fireTvState={state?.fireTv}
              onTogglePlay={togglePlayPause}
              audioDuckingLevel={state?.fireTv?.currentAudioDucking}
              subtitleWhisper={state?.fireTv?.subtitleWhisper}
            />
          </div>
        )}

        {/* VIEW MODE B: SPLIT JUDGE DECK (RECOMMENDED FOR HACKATHON EVALUATION) */}
        {viewMode === 'split' && (
          <div className="space-y-8">
            {/* Upper: Fire TV Living Room Cinema Screen */}
            <div className="w-full relative">
              <FireTvCinema
                fireTvState={state?.fireTv}
                onTogglePlay={togglePlayPause}
                audioDuckingLevel={state?.fireTv?.currentAudioDucking}
                subtitleWhisper={state?.fireTv?.subtitleWhisper}
              />
            </div>

            {/* Lower: Telemetry & Interactive Judge Simulation Dock */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Telemetry Card: Bee Wearable */}
              <div className="lg:col-span-1">
                <BeeWearableCard beeState={state?.bee} />
              </div>

              {/* Telemetry Card: Ring Video Doorbell */}
              <div className="lg:col-span-1">
                <RingCameraCard
                  ringState={state?.ring}
                  onToggleMic={toggleTwoWayTalk}
                />
              </div>

              {/* Quick Bedrock Stats Card */}
              <div className="lg:col-span-1 bg-vega-surface border border-white/10 rounded-2xl p-5 shadow-tv-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      AWS Bedrock AgentCore Brain
                    </h4>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      LIVE INFERENCE
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono">
                    Model: anthropic.claude-3-5-sonnet-20241022-v2:0 / Amazon Nova Pro
                  </p>
                  <div className="mt-2 text-[11px] text-slate-400">
                    Total Invocations: <span className="text-white font-bold">{state?.bedrock?.totalInvocations || 0}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Living Room State:</span>
                  <span className="font-bold text-amazon-orange font-mono">
                    {state?.fireTv?.pipActive ? 'DIRECTOR PIP ACTIVE' : 'UNINTERRUPTED CINEMA'}
                  </span>
                </div>
              </div>
            </div>

            {/* Full Interactive Simulation Dock for Judges */}
            <JudgeSimulationDock
              state={state}
              onTriggerRing={triggerRingPreset}
              onUpdateBee={updateBeeContext}
              onResetDemo={resetLivingRoom}
              onAskAlexaVoice={handleVoiceQuery}
            />
          </div>
        )}

        {/* VIEW MODE C: DEDICATED CONTROL CONSOLE */}
        {viewMode === 'control' && (
          <div className="space-y-6">
            <JudgeSimulationDock
              state={state}
              onTriggerRing={triggerRingPreset}
              onUpdateBee={updateBeeContext}
              onResetDemo={resetLivingRoom}
              onAskAlexaVoice={handleVoiceQuery}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BeeWearableCard beeState={state?.bee} />
              <RingCameraCard
                ringState={state?.ring}
                onToggleMic={toggleTwoWayTalk}
              />
            </div>
          </div>
        )}
      </main>

      {/* 3. The Ghost-Director Picture-in-Picture (PiP) Overlay */}
      {state?.fireTv?.pipActive && (
        <DirectorPipOverlay
          pipData={state?.fireTv?.pipData}
          ringState={state?.ring}
          onDismiss={dismissPip}
          onToggleMic={toggleTwoWayTalk}
          twoWayAudioActive={state?.ring?.twoWayTalkActive}
        />
      )}

      {/* 4. Fire TV Alexa Voice Remote On-Screen Simulator Modal */}
      <FireTvRemoteModal
        isOpen={isRemoteOpen}
        onClose={() => setIsRemoteOpen(false)}
        onDpad={(dir) => console.log('D-Pad:', dir)}
        onSelect={() => {
          if (state?.fireTv?.pipActive) toggleTwoWayTalk();
        }}
        onBack={() => {
          if (state?.fireTv?.pipActive) dismissPip();
          else setIsRemoteOpen(false);
        }}
        onPlayPause={togglePlayPause}
        onMic={handleOpenVoice}
        isPlaying={state?.fireTv?.isPlaying !== false}
      />

      {/* 5. Alexa Voice Assistant Dialog / Mic Input */}
      <AlexaVoiceDialog
        isOpen={isVoiceDialogOpen}
        onClose={() => {
          setIsVoiceDialogOpen(false);
          closeAlexaVoice();
        }}
        onSubmitQuery={handleVoiceQuery}
        voiceState={voiceAssistantState}
      />
    </div>
  );
}
