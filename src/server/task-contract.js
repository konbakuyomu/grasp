import { ROUTE_BLOCKED } from './error-codes.js';

function toText(value) {
  return String(value ?? '').trim();
}

function humanizeAction(action) {
  const value = toText(action);
  if (!value) return 'wait';
  if (value.startsWith('use_hint_matching:')) {
    return `use the hinted action ${value.slice('use_hint_matching:'.length)}`;
  }
  if (value.startsWith('continue_goal:')) {
    return `continue toward ${value.slice('continue_goal:'.length)}`;
  }
  return value;
}

export function formatVerificationCheck(check = {}) {
  const kind = toText(check.kind);
  const expected = toText(check.expected);
  const actual = toText(check.actual);
  const ok = check.ok === true;

  if (kind === 'url_contains') {
    return ok
      ? `URL contains ${expected}`
      : `URL does not contain ${expected}${actual ? ` (actual: ${actual})` : ''}`;
  }
  if (kind === 'page_role') {
    return ok
      ? `page role is ${expected}`
      : `page role is not ${expected}${actual ? ` (actual: ${actual})` : ''}`;
  }
  if (kind === 'selector_present') {
    return ok
      ? `selector present: ${expected}`
      : `selector missing: ${expected}`;
  }
  if (kind === 'hint_label_present') {
    return ok
      ? `hint available: ${actual || expected}`
      : `hint not available: ${expected}`;
  }

  return ok
    ? `${kind || 'check'} passed`
    : `${kind || 'check'} failed${expected ? ` (${expected})` : ''}`;
}

export function buildVerificationEnvelope({
  status = 'unknown',
  summary = null,
  checks = [],
  evidence = [],
  missingEvidence = [],
} = {}) {
  return {
    status,
    summary,
    evidence: [
      ...checks.filter((check) => check?.ok).map(formatVerificationCheck),
      ...evidence.filter(Boolean).map((item) => toText(item)).filter(Boolean),
    ],
    missing_evidence: [
      ...checks.filter((check) => check?.ok === false).map(formatVerificationCheck),
      ...missingEvidence.filter(Boolean).map((item) => toText(item)).filter(Boolean),
    ],
  };
}

export function buildResumeVerification({ handoffState, checkpointStillPresent = false, continuation = {} } = {}) {
  const checks = Array.isArray(continuation?.checks) ? continuation.checks : [];
  const taskContinuationOk = continuation?.task_continuation_ok;
  const continuationReady = continuation?.continuation_ready === true;

  if (checkpointStillPresent) {
    return buildVerificationEnvelope({
      status: 'blocked',
      summary: 'The checkpoint is still present, so the runtime cannot safely resume yet.',
      checks,
      missingEvidence: ['checkpoint still present'],
    });
  }

  if (handoffState === 'resumed_verified') {
    return buildVerificationEnvelope({
      status: 'verified',
      summary: 'Resume evidence passed and the task can continue in the same browser context.',
      checks,
    });
  }

  if (taskContinuationOk === false) {
    return buildVerificationEnvelope({
      status: 'failed',
      summary: 'Resume evidence failed. The task context does not match the expected continuation anchors.',
      checks,
    });
  }

  if (handoffState === 'resumed_unverified' || continuationReady === false) {
    return buildVerificationEnvelope({
      status: 'partial',
      summary: 'The page was reacquired, but there is not enough evidence yet to safely continue the task.',
      checks,
      missingEvidence: continuationReady === false ? ['continuation is not ready yet'] : [],
    });
  }

  return buildVerificationEnvelope({
    status: 'unknown',
    summary: 'Resume verification has not produced a stable conclusion yet.',
    checks,
  });
}

export function buildTaskContract({
  status,
  page,
  continuation = {},
  route = null,
  errorCode = null,
  verification = null,
} = {}) {
  const handoffState = continuation?.handoff_state ?? 'idle';
  const riskGate = page?.risk_gate === true;
  const pageRole = page?.page_role ?? null;
  const suggestedNextAction = continuation?.suggested_next_action ?? route?.next_step ?? null;

  let taskStatus = 'needs_attention';
  let reason = verification?.summary || 'The runtime needs more evidence before continuing safely.';
  let nextStep = suggestedNextAction || 'inspect';
  let canContinue = continuation?.can_continue === true;

  if (status === 'mixed') {
    taskStatus = 'mixed';
    reason = verification?.summary || 'The task produced mixed results and needs review before continuing.';
    nextStep = suggestedNextAction || 'inspect';
    canContinue = continuation?.can_continue === true;
  } else if (handoffState === 'handoff_required' || handoffState === 'handoff_in_progress') {
    taskStatus = 'blocked_for_handoff';
    reason = 'A human step is required before the task can continue.';
    nextStep = 'request_handoff';
    canContinue = false;
  } else if (handoffState === 'awaiting_reacquisition' || status === 'ready_to_resume') {
    taskStatus = 'ready_to_resume';
    reason = 'The human step is marked done. The runtime now needs to reacquire the page state.';
    nextStep = 'resume_after_handoff';
    canContinue = false;
  } else if (handoffState === 'resumed_verified' || status === 'resumed') {
    taskStatus = 'resumed';
    reason = 'The task context was reacquired and the runtime has enough evidence to continue.';
    nextStep = suggestedNextAction || 'continue_task';
    canContinue = continuation?.can_continue !== false;
  } else if ((errorCode === ROUTE_BLOCKED || riskGate || pageRole === 'checkpoint' || status === 'blocked_for_handoff') && status !== 'mixed') {
    taskStatus = 'blocked_for_handoff';
    reason = 'A checkpoint or gated page is blocking direct continuation.';
    nextStep = 'request_handoff';
    canContinue = false;
  } else if (status === 'warmup') {
    taskStatus = 'warmup';
    reason = 'The runtime needs stronger session trust before direct continuation.';
    nextStep = suggestedNextAction || 'preheat_session';
    canContinue = continuation?.can_continue === true;
  } else if (status === 'needs_attention' || status === 'failed' || verification?.status === 'failed') {
    taskStatus = 'needs_attention';
    reason = verification?.summary || 'The runtime does not have enough evidence to continue safely.';
    nextStep = suggestedNextAction || 'inspect';
    canContinue = false;
  } else if (status === 'ready') {
    taskStatus = 'ready';
    reason = 'The runtime has enough context to continue on the current route.';
    nextStep = suggestedNextAction;
    canContinue = continuation?.can_continue !== false;
  }

  return {
    status: taskStatus,
    reason,
    next_step: nextStep,
    next_step_human: humanizeAction(nextStep),
    can_continue: canContinue,
  };
}

export function buildDeliverySummary(result = {}) {
  const artifact = result?.artifact ?? null;
  const artifacts = result?.artifacts ?? null;

  if (artifact?.path) {
    return {
      status: 'delivered',
      summary: `Artifact ready: ${artifact.path}`,
      artifacts: [artifact],
    };
  }

  if (artifacts && typeof artifacts === 'object') {
    const list = Object.values(artifacts).filter(Boolean);
    if (list.length > 0) {
      return {
        status: 'delivered',
        summary: `${list.length} artifact(s) ready`,
        artifacts: list,
      };
    }
  }

  return null;
}

export function buildTaskLines(task = {}, verification = null, delivery = null) {
  const lines = [
    task?.status ? `Task status: ${task.status}` : null,
    task?.reason ? `Reason: ${task.reason}` : null,
    task?.next_step ? `Next step: ${task.next_step}` : null,
  ].filter(Boolean);

  if (verification?.status) {
    lines.push(`Verification: ${verification.status}`);
    if (verification.summary) lines.push(`Verification summary: ${verification.summary}`);
    if (Array.isArray(verification.evidence) && verification.evidence.length > 0) {
      lines.push(`Evidence: ${verification.evidence.join('; ')}`);
    }
    if (Array.isArray(verification.missing_evidence) && verification.missing_evidence.length > 0) {
      lines.push(`Missing evidence: ${verification.missing_evidence.join('; ')}`);
    }
  }

  if (delivery?.status) {
    lines.push(`Delivery: ${delivery.status}`);
    if (delivery.summary) lines.push(`Delivery summary: ${delivery.summary}`);
  }

  return lines;
}
