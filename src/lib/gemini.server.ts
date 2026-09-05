import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * Provider for the Google Gemini API using a user-supplied key.
 * Server-only: the API key never reaches the browser.
 */
export function createGeminiProvider(apiKey: string) {
  return createGoogleGenerativeAI({ apiKey });
}
