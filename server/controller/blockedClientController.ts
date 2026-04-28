import BlockedClient from "../models/BlockedClient";

export async function getBlockedClientIds(): Promise<number[]> {
  const docs = await BlockedClient.find({}).select("clientId").lean();
  return docs.map((d) => d.clientId);
}

export async function getAllBlockedClients(): Promise<{ clientId: number; createdAt: Date }[]> {
  const docs = await BlockedClient.find({}).sort({ createdAt: -1 }).lean();
  return docs.map((d) => ({ clientId: d.clientId, createdAt: d.createdAt }));
}

export async function addBlockedClient(clientId: number): Promise<{ success: boolean; message: string }> {
  if (!clientId || isNaN(Number(clientId))) {
    return { success: false, message: "Invalid client ID" };
  }
  const id = Number(clientId);
  const existing = await BlockedClient.findOne({ clientId: id });
  if (existing) return { success: false, message: "Client already blocked" };
  await BlockedClient.create({ clientId: id });
  return { success: true, message: "Client blocked" };
}

export async function removeBlockedClient(clientId: number): Promise<{ success: boolean; message: string }> {
  const result = await BlockedClient.deleteOne({ clientId: Number(clientId) });
  if (result.deletedCount === 0) return { success: false, message: "Client not found in block list" };
  return { success: true, message: "Client unblocked" };
}

/** Extract client ID from Crowdworks employer URL (e.g. .../employers/6798718 -> 6798718) */
export function parseClientIdFromUrl(urlOrId: string): number | null {
  const trimmed = String(urlOrId).trim();
  const match = trimmed.match(/(?:employers\/)?(\d+)$/);
  if (match) return parseInt(match[1], 10);
  const num = parseInt(trimmed, 10);
  return isNaN(num) ? null : num;
}
