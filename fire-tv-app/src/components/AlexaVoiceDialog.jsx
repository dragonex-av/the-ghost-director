import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Sparkles, Send, Volume2 } from 'lucide-react';

export function AlexaVoiceDialog({
  isOpen,
  onClose,
  onSubmitQuery,
  voiceState,
}) {
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const quickPills = [
    'Who is at the front door?',
    'What did the courier deliver?',
    'Is the stranger still outside?',
    'Dismiss the picture-in-picture.',
  ];

  const handleSend = (text) => {
    const q = text || inputText;
    if (!q.trim()) return;
    onSubmitQuery(q);
    setInputText('');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center p-6 lg:p-12 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-vega-surface/95 border-2 border-alexa-cyan/60 rounded-3xl p-6 shadow-neon-cyan overflow-hidden"
        >
          {/* Alexa Glowing Cyan Light Bar (Signature Alexa Ring) */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-alexa-cyan to-transparent animate-pulse" />

          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-alexa-cyan/20 text-alexa-cyan border border-alexa-cyan/40 flex items-center justify-center animate-pulse">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  Alexa+ Ghost-Director Voice Assistant
                </h3>
                <span className="text-[10px] font-mono text-alexa-cyan">
                  Powered by Amazon Bedrock AgentCore
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Conversation Body */}
          <div className="py-4 space-y-3">
            {voiceState?.query && (
              <div className="flex items-start gap-2.5">
                <span className="text-xs font-bold text-slate-400 uppercase mt-0.5">You:</span>
                <p className="text-sm font-medium text-white bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                  "{voiceState.query}"
                </p>
              </div>
            )}

            {voiceState?.loading ? (
              <div className="flex items-center gap-3 text-xs text-alexa-cyan font-mono animate-pulse py-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Bedrock AgentCore evaluating living room multimodal context...</span>
              </div>
            ) : voiceState?.response ? (
              <div className="flex items-start gap-2.5">
                <span className="text-xs font-bold text-alexa-cyan uppercase mt-0.5 flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5" />
                  Alexa:
                </span>
                <p className="text-sm font-semibold text-slate-100 bg-alexa-cyan/10 px-3.5 py-2.5 rounded-xl border border-alexa-cyan/30 shadow-inner">
                  {voiceState.response}
                </p>
              </div>
            ) : null}
          </div>

          {/* Quick Query Pills */}
          <div className="flex flex-wrap gap-1.5 py-2">
            {quickPills.map((pill, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(pill)}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition-colors"
              >
                {pill}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="pt-2 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask Alexa a question about your front door or Fire TV..."
              className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-alexa-cyan transition-colors"
              autoFocus
            />
            <button
              onClick={() => handleSend()}
              className="px-4 py-2.5 rounded-xl bg-alexa-cyan text-black text-xs font-bold hover:bg-cyan-300 transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
