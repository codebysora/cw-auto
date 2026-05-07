import BlockedClient from "../models/BlockedClient";
import Job from "../models/Job";
import { getClientInfo } from "../service/clientScraper";

export async function getBlockedClientIds(): Promise<number[]> {
  const docs = await BlockedClient.find({}).select("clientId").lean();
  return docs.map((d: { clientId: number }) => d.clientId);
}

export interface BlockedClientView {
  clientId: number;
  clientName: string;
  createdAt: Date;
}

/** Resolve a client's display name. Tries scraper, then most-recent saved Job by clientId, then "". */
async function resolveClientName(clientId: number): Promise<string> {
  try {
    const info = await getClientInfo(clientId);
    if (info?.display_name && info.display_name.trim()) return info.display_name.trim();
  } catch (_e) {
    // ignore — fall back to saved jobs
  }
  try {
    const job = await Job.findOne({ clientId }).sort({ _id: -1 }).select("clientName").lean();
    if (job && (job as any).clientName) return String((job as any).clientName);
  } catch (_e) {}
  return "";
}

/** List blocked clients with display names. Backfills missing `clientName` lazily. */
export async function getAllBlockedClients(): Promise<BlockedClientView[]> {
  const docs = await BlockedClient.find({}).sort({ createdAt: -1 }).lean();

  const out: BlockedClientView[] = [];
  for (const d of docs) {
    let name = (d as any).clientName as string | undefined;
    if (!name) {
      name = await resolveClientName(d.clientId);
      if (name) {
        await BlockedClient.updateOne({ clientId: d.clientId }, { $set: { clientName: name } });
      }
    }
    out.push({ clientId: d.clientId, clientName: name || "", createdAt: d.createdAt });
  }
  return out;
}

export async function addBlockedClient(
  clientId: number
): Promise<{ success: boolean; message: string; data?: BlockedClientView }> {
  if (!clientId || isNaN(Number(clientId))) {
    return { success: false, message: "Invalid client ID" };
  }
  const id = Number(clientId);
  const existing = await BlockedClient.findOne({ clientId: id });
  if (existing) return { success: false, message: "Client already blocked" };

  const clientName = await resolveClientName(id);
  const created = await BlockedClient.create({ clientId: id, clientName });
  return {
    success: true,
    message: clientName ? `Blocked ${clientName}` : "Client blocked",
    data: {
      clientId: created.clientId,
      clientName: created.clientName || "",
      createdAt: created.createdAt,
    },
  };
}

export async function removeBlockedClient(
  clientId: number
): Promise<{ success: boolean; message: string }> {
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
