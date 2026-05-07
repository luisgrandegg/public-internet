/**
 * Tool schemas exposed to the ElevenLabs Conversational AI agent.
 *
 * The agent is configured (in the ElevenLabs dashboard) to call back into this
 * app over HTTPS for each tool. The Route Handlers under
 * `src/app/api/voice/tools/*` implement them.
 *
 * Keep this file as the single source of truth for tool names + payload shape
 * so the dashboard config and the server handlers cannot drift.
 */

export const AGENT_TOOLS = {
  read_file: {
    description:
      'Read the contents of a file from the monorepo. Use this to ground a change in the actual code rather than guessing. Path is relative to the monorepo root.',
    input: {
      path: 'string — relative path from monorepo root, e.g. apps/touristical-renting/src/app/page.tsx',
    },
  },
  list_changed_files: {
    description:
      'List the files changed in the current PR. Use this when the user refers to "the change" without naming a file.',
    input: {
      prNumber: 'number — the PR number from the URL',
    },
  },
  propose_change: {
    description:
      'Record a proposed change. Call this once per file the user wants to modify. The agent should ask for confirmation before calling this.',
    input: {
      prNumber: 'number',
      file: 'string — path relative to monorepo root',
      description:
        'string — what to change, in the user\'s own words plus any clarification the agent extracted',
      rationale:
        'string — short justification (e.g. "removes urgency copy per Constitution principle 5")',
    },
  },
  submit_spec: {
    description:
      'Finalise the session. Writes all proposed changes to a spec file and ends the conversation. Only call this after the user has confirmed.',
    input: {
      prNumber: 'number',
      summary: 'string — one-sentence summary of the whole session',
    },
  },
} as const

export type AgentToolName = keyof typeof AGENT_TOOLS
