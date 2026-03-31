import { textResponse } from './responses.js';

export function buildGatewayResponse({
  status,
  page,
  result = {},
  continuation = {},
  evidence = {},
  runtime = {},
  route = null,
  error_code = null,
  message,
}) {
  const lines = [
    `Status: ${status}`,
    `Page: ${page?.title ?? 'unknown'}`,
    `URL: ${page?.url ?? 'unknown'}`,
    runtime?.instance?.display ? `Instance: ${runtime.instance.display}` : null,
    runtime?.instance?.warning ? `Instance warning: ${runtime.instance.warning}` : null,
    route?.selected_mode ? `Route: ${route.selected_mode}` : null,
    result.summary ? `Summary: ${result.summary}` : null,
    continuation.suggested_next_action ? `Next: ${continuation.suggested_next_action}` : null,
  ].filter(Boolean);

  return textResponse(message ?? lines, {
    status,
    page,
    result,
    continuation,
    evidence,
    runtime,
    ...(error_code ? { error_code } : {}),
    ...(route ? { route } : {}),
  });
}
