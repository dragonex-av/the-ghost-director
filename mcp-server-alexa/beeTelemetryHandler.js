/**
 * ============================================================================
 * THE GHOST-DIRECTOR: BEE WEARABLE TELEMETRY INGESTION ENGINE
 * ============================================================================
 * Ingests continuous telemetry from the Bee Wearable device over Bluetooth LE
 * or cloud sync:
 * - Cognitive Focus Index (0 - 100)
 * - Heart Rate (BPM) & Heart Rate Variability (HRV)
 * - Ambient Acoustic Environment (dB)
 * - Human activity context (Relaxing, Deep Focus, Cooking, Exercising)
 * ============================================================================
 */

import { livingRoomStore } from './stateStore.js';

export function handleBeeTelemetry(req, res) {
  const payload = req.body || {};
  console.log('[BeeTelemetry] Ingested wearable telemetry:', JSON.stringify(payload));

  const normalizedTelemetry = {
    focusState: payload.focusState || payload.focus_state || 'Relaxing',
    focusIndex: Math.min(100, Math.max(0, Number(payload.focusIndex ?? payload.focus_score ?? 75))),
    heartRateBpm: Number(payload.heartRateBpm ?? payload.heart_rate ?? 72),
    ambientNoiseDb: Number(payload.ambientNoiseDb ?? payload.ambient_noise ?? 42),
    stressLevel: payload.stressLevel || payload.stress_level || 'Low',
    batteryLevel: payload.batteryLevel ?? 88,
    userLocation: payload.userLocation || 'Living Room Couch',
  };

  const updatedBee = livingRoomStore.updateBeeTelemetry(normalizedTelemetry);

  // If Fire TV has an active PiP and the wearable suddenly shifts to "Deep Focus",
  // auto-minimize the PiP into a discreet whisper mode to preserve flow state.
  const currentState = livingRoomStore.getState();
  if (currentState.fireTv.pipActive && normalizedTelemetry.focusIndex >= 90) {
    console.log('[BeeTelemetry] Deep Focus threshold breached (>=90%). Auto-modulating Fire TV PiP to discreet whisper.');
    livingRoomStore.updateFireTvState({
      pipActive: false,
      subtitleWhisper: `Discreet: ${currentState.fireTv.pipData?.pipHeadline || 'Front Door Alert'}`,
      currentAudioDucking: 0.9,
    });
  }

  return res.status(200).json({
    status: 'TELEMETRY_RECORDED',
    bee: updatedBee,
    timestamp: new Date().toISOString(),
  });
}
