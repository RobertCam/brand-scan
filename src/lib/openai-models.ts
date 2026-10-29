import type { ReasoningEffort } from 'openai/resources/shared';

/** Quality-first brand report. Flagship tier. */
export const ANALYSIS_MODEL = 'gpt-5.6-sol';

/** Interactive chat and supporting web search. Balanced tier. */
export const CHAT_MODEL = 'gpt-5.6-terra';

/** Yes/no routing and chart-config extraction. High-volume tier. */
export const ROUTER_MODEL = 'gpt-5.6-luna';

/**
 * GPT-4o did not reason. GPT-5.6 defaults to medium, which changes latency
 * and rejects temperature. The installed SDK types predate `none`.
 */
export const reasoningEffortNone = 'none' as ReasoningEffort;
