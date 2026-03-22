import { z } from 'zod';

import { buildGatewayResponse } from './gateway-response.js';
import { enterWithStrategy } from './tools.strategy.js';

function toGatewayPage(outcome, state) {
  return {
    title: outcome.title ?? 'unknown',
    url: outcome.url,
    page_role: outcome.pageState?.currentRole ?? state.pageState?.currentRole ?? 'unknown',
    grasp_confidence: outcome.pageState?.graspConfidence ?? state.pageState?.graspConfidence ?? 'unknown',
    risk_gate: outcome.pageState?.riskGateDetected ?? state.pageState?.riskGateDetected ?? false,
  };
}

export function registerGatewayTools(server, state, deps = {}) {
  const enter = deps.enterWithStrategy ?? enterWithStrategy;

  server.registerTool(
    'entry',
    {
      description: 'Enter a URL through the gateway using preflight strategy metadata.',
      inputSchema: {
        url: z.string().url().describe('Target URL to enter'),
      },
    },
    async ({ url }) => {
      const outcome = await enter({ url, state });

      return buildGatewayResponse({
        status: outcome.pageState?.riskGateDetected ? 'gated' : 'direct',
        page: toGatewayPage(outcome, state),
        continuation: {
          can_continue: !outcome.pageState?.riskGateDetected,
          suggested_next_action: outcome.pageState?.riskGateDetected ? 'request_handoff' : 'inspect',
          handoff_state: state.handoff?.state ?? 'idle',
        },
        evidence: { strategy: outcome.preflight ?? null },
      });
    }
  );
}
