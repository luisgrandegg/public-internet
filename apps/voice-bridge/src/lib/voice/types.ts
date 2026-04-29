export type VoiceSessionStatus =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'agent_speaking'
  | 'awaiting_confirmation'
  | 'submitting'
  | 'done'
  | 'error'

export type VoiceTranscriptEntry = {
  role: 'user' | 'agent'
  text: string
  at: string
}

export type ProposedChange = {
  file: string
  rationale: string
  diff?: string
  description: string
}

export type VoiceSpec = {
  prNumber: number
  createdAt: string
  summary: string
  changes: ProposedChange[]
  transcript: VoiceTranscriptEntry[]
}
