import UserModel from "@Server/models/User";
import BlockedClient from "@Server/models/BlockedClient";
import AnalyticsModel from "@Server/models/Analytics";

function isApprovedStatus(status: unknown): boolean {
  if (typeof status === "number") return status === 1;
  if (typeof status === "boolean") return status === true;
  if (typeof status === "string") {
    const n = status.trim().toLowerCase();
    return n === "1" || n === "allowed" || n === "active" || n === "approved" || n === "true";
  }
  return false;
}

function isBlockedStatus(status: unknown): boolean {
  if (typeof status === "number") return status === 2 || status === -1;
  if (typeof status === "string") {
    const n = status.trim().toLowerCase();
    return n === "2" || n === "blocked" || n === "denied" || n === "rejected";
  }
  return false;
}

function isPendingStatus(status: unknown): boolean {
  if (typeof status === "number") return status === 0;
  if (typeof status === "string") {
    const n = status.trim().toLowerCase();
    return n === "0" || n === "pending" || n === "";
  }
  return !isApprovedStatus(status) && !isBlockedStatus(status);
}

export async function getAdminOverview() {
  const users = await UserModel.find({}).lean();
  let pending = 0;
  let allowed = 0;
  let blocked = 0;
  let admins = 0;

  for (const u of users) {
    if (u.role === "admin" || u.role === "superadmin") admins += 1;
    if (isBlockedStatus(u.status)) blocked += 1;
    else if (isApprovedStatus(u.status)) allowed += 1;
    else if (isPendingStatus(u.status)) pending += 1;
    else pending += 1;
  }

  const blockedClientsCount = await BlockedClient.countDocuments();
  const analyticsRows = await AnalyticsModel.find({}).lean();

  let totalBidCount = 0;
  let totalMessageCount = 0;
  let totalContactCount = 0;
  let totalJobsPosted = 0;
  const byDate = new Map<string, { date: string; bidCount: number; messageCount: number; contactCount: number }>();

  for (const row of analyticsRows) {
    totalBidCount += row.bidCount ?? 0;
    totalMessageCount += row.messageCount ?? 0;
    totalContactCount += row.contactCount ?? 0;
    totalJobsPosted += row.jobsPosted ?? 0;
    const d = String(row.date || "").slice(0, 10);
    if (!d) continue;
    const cur = byDate.get(d) || { date: d, bidCount: 0, messageCount: 0, contactCount: 0 };
    cur.bidCount += row.bidCount ?? 0;
    cur.messageCount += row.messageCount ?? 0;
    cur.contactCount += row.contactCount ?? 0;
    byDate.set(d, cur);
  }

  const chartSeries = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));

  const recentPending = users
    .filter((u) => isPendingStatus(u.status))
    .sort((a, b) => {
      const ta = new Date((a as any).createdAt || 0).getTime();
      const tb = new Date((b as any).createdAt || 0).getTime();
      return tb - ta;
    })
    .slice(0, 8)
    .map((u) => ({
      id: u.id,
      fullName: u.fullName,
      telegramId: u.telegramId,
      telegramUsername: u.telegramUsername,
      createdAt: (u as any).createdAt,
    }));

  return {
    users: {
      total: users.length,
      pending,
      allowed,
      blocked,
      admins,
    },
    blockedClientsCount,
    analytics: {
      totalBidCount,
      totalMessageCount,
      totalContactCount,
      totalJobsPosted,
      chartSeries,
    },
  };
}
