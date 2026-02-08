export type AppwriteClient = unknown;

// Centralized Appwrite client init (server-side only).
export function getAppwriteClient(): AppwriteClient {
  throw new Error("Appwrite client not initialized. Implement in service layer.");
}
