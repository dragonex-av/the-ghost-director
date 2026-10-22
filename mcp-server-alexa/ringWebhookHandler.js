/**
 * ============================================================================
 * THE GHOST-DIRECTOR: RING VIDEO DOORBELL WEBHOOK INGESTION ENGINE
 * ============================================================================
 * Handles incoming webhooks from the Ring Smart Home Platform / Ring Developer API
 * Normalizes event types (dings, motion, Amazon Prime courier package vision,
 * facial recognition) and triggers immediate Bedrock AgentCore evaluation.
 * ============================================================================
 */

import { livingRoomStore } from './stateStore.js';
import { generateDirectorScript } from './awsBedrockClient.js';

export async function handleRingWebhook(req, res) {
  const payload = req.body || {};
  console.log('[RingWebhook] Ingested incoming event:', JSON.stringify(payload).slice(0, 180));

  // Normalize Ring webhook payload across API versions
  const eventType = payload.eventType || payload.event_type || payload.kind || 'MOTION';
  const label = payload.label || payload.description || inferLabel(eventType, payload);
  const packageDetected = Boolean(
    payload.packageDetected ?? payload.package_detected ?? payload.metadata?.package_present
  );
  const personName = payload.personName || payload.person_name || payload.metadata?.matched_face || null;
  const confidence = payload.confidence ?? payload.metadata?.ai_confidence ?? 0.94;
  const snapshotUrl = payload.snapshotUrl || payload.snapshot_url || getPresetSnapshot(eventType);

  const normalizedEvent = {
    eventType,
    label,
    packageDetected,
    personName,
    confidence,
    snapshotUrl,
    description: payload.description || `Ring event: ${label}`,
    rawPayload: payload,
  };

  // 1. Update Living Room State Store
  const updatedEvent = livingRoomStore.updateRingEvent(normalizedEvent);

  // 2. Fetch current multimodal environment
  const currentState = livingRoomStore.getState();

  // 3. Trigger Bedrock AgentCore autonomous decision
  const decision = await generateDirectorScript({
    ringEvent: updatedEvent,
    beeContext: currentState.bee,
    fireTvState: currentState.fireTv,
  });

  // 4. Record and execute on Fire TV
  livingRoomStore.recordBedrockDecision(decision);

  return res.status(200).json({
    status: 'INGESTED_AND_DISPATCHED',
    eventId: updatedEvent.id,
    decisionSummary: {
      action: decision.action,
      urgency: decision.urgency,
      audioDucking: decision.audioDuckingLevel,
      directorCommentary: decision.directorCommentary,
      latencyMs: decision.latencyMs,
    },
    timestamp: new Date().toISOString(),
  });
}

function inferLabel(eventType, payload) {
  const type = String(eventType).toUpperCase();
  if (type.includes('DELIVERY') || payload.package_detected) return 'Amazon Prime Delivery Driver';
  if (type.includes('DOORBELL') || type.includes('DING')) return 'Front Doorbell Pressed';
  if (type.includes('STRANGER') || type.includes('SUSPICIOUS')) return 'Unrecognized Person Lingering';
  if (type.includes('FAMILY')) return 'Family Member Approaching';
  return 'Front Porch Motion';
}

function getPresetSnapshot(eventType) {
  const type = String(eventType).toUpperCase();
  if (type.includes('DELIVERY') || type.includes('PACKAGE')) {
    return 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80'; // delivery box
  }
  if (type.includes('STRANGER') || type.includes('SUSPICIOUS')) {
    return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80'; // stranger
  }
  if (type.includes('FAMILY')) {
    return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80'; // smiling family member
  }
  return 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80'; // porch view
}
