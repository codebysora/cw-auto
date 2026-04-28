import axios from "axios";
import * as cheerio from "cheerio";
import Job from "@Server/models/Job";
import { scrapeJobs } from "@Server/service/Scraper";
import { delay } from "@Server/utils";
import { sendMessage } from "@Server/telegram";
import { getBidInlineKeyboard, getCurrentDayName, getCurrentDateYYYYMMDD, getCurrentTimeHHMM, getJobMessage } from "../service/function";
import { isEmpty } from "@Server/utils";
import userModel from "@Server/models/User";
import AutoBidSchedule from "@Server/models/AutoBidSchedule";
import { ScrapedJobType } from "@Server/types/job";
import { singleAutoBid } from "@Server/service/bidder";
import * as bidHistoryController from "@Server/controller/bidHistoryController";
import { SingleBid } from "@Server/models/BidHistory";
import * as blockedClientController from "@Server/controller/blockedClientController";

const GROUP_ID = process.env.GROUP_ID || 0;
let scrapingInterval: NodeJS.Timeout | null = null;
let scrapingActive = false;

const latestJobId = process.env.LATEST_JOB_ID || 0;

export const removeAllJobs = async () => {
  try {
    await Job.deleteMany({});
    return { success: true, message: "All jobs removed" };
  } catch (error) {
    return { success: false, message: "Error removing jobs", error };
  }
};

const getAvailableTgIds = async (job: ScrapedJobType) => {
  const currentTime = getCurrentTimeHHMM();
  const currentDayName = getCurrentDayName();
  const currentDateYYYYMMDD = getCurrentDateYYYYMMDD();
  const { categoryId, lowBudget, highBudget, jobType } = job;
  let addedQuery = {};
  if (!lowBudget && !highBudget) addedQuery = {};
  else if (jobType === 'fixed') {
    addedQuery = {
      fixedBudgetMin: { $lte: highBudget },
      fixedBudgetMax: { $gte: highBudget },
    }
  } else if (jobType === 'hourly') {
    addedQuery = {
      hourlyBudgetMin: { $lte: highBudget },
      hourlyBudgetMax: { $gte: highBudget },
    }
  }

  const availableTgIds = await AutoBidSchedule.find({
    isActive: true,
    timeRangeStart: { $lte: currentTime },
    timeRangeEnd: { $gte: currentTime },
    daysOfWeek: { $in: [currentDayName] },
    endDate: { $gte: currentDateYYYYMMDD },
    preferredRoles: { $in: [categoryId.toString()] },
    ...addedQuery,
  }).select('telegramId');

  return availableTgIds.map(schedule => schedule.telegramId);
};

// Rate limiting: Track last bid time per telegramId (1 bid per minute)
const lastBidTime = new Map<number, number>();
const ONE_MINUTE_MS = 60 * 1000; // 1 minute
const bidQueue: Array<{ telegramId: number; job: ScrapedJobType }> = [];
let isProcessingQueue = false;

// Global queue processor that ensures rate limiting across all jobs
const processBidQueue = async () => {
  // Check and set processing flag atomically
  if (isProcessingQueue || bidQueue.length === 0) return;
  isProcessingQueue = true;

  while (bidQueue.length > 0) {
    const { telegramId, job } = bidQueue.shift()!;
    const now = Date.now();
    const lastBid = lastBidTime.get(telegramId) || 0;
    const timeSinceLastBid = now - lastBid;

    if (timeSinceLastBid < ONE_MINUTE_MS) {
      // Need to wait before bidding - ensures 1 minute between bids for this telegramId
      const delayMs = ONE_MINUTE_MS - timeSinceLastBid;
      // console.log(`⏳ Waiting ${Math.round(delayMs / 1000)}s before bidding for telegramId ${telegramId}, jobId ${job.id}`);
      await delay(delayMs);
    }

    // Update last bid time to current time (after waiting if needed, before starting the bid)
    const bidStartTime = Date.now();
    lastBidTime.set(telegramId, bidStartTime);
    // console.log(`🚀 Starting bid for telegramId ${telegramId}, jobId ${job.id}`);

    // Process bid and await completion before moving to next
    try {
      const result = await singleAutoBid(telegramId, job.id);
      if (result.success) {
        console.log(`✅ Bid successful for telegramId ${telegramId}, jobId ${job.id} - ${job.jobType}`);
      } else {
        console.log(`❌ Bid failed for telegramId ${telegramId}, jobId ${job.id}: ${result.message}`);
      }
    } catch (err: any) {
      console.error(`Error bidding for telegramId ${telegramId}, jobId ${job.id}:`, err);
    }
  }

  isProcessingQueue = false;
};

export const bidProcessor = (telegramIds: number[], job: ScrapedJobType) => {
  // Add all bids to the global queue (non-blocking)
  for (const telegramId of telegramIds) {
    bidQueue.push({ telegramId, job });
  }

  // Start processing the queue if not already processing (non-blocking)
  processBidQueue().catch(err => {
    console.error('Error processing bid queue:', err);
    isProcessingQueue = false;
  });
}

let jobBunddle: any = [];

/** Post to Telegram only: fixed jobs with min budget >= 50000, all hourly, and all no-budget jobs */
function shouldPostJobToTelegram(job: ScrapedJobType): boolean {
  const noBudget = job.lowBudget === 0 && job.highBudget === 0;
  if (noBudget) return true;
  if (job.jobType === "hourly") return true;
  if (job.jobType === "fixed") return (job.lowBudget ?? 0) >= 200000;
  return false;
}

export const startScraping = (intervalMs: number = 5000) => {
  if (scrapingActive) return { started: false, message: "Scraping already running" };

  scrapingActive = true;

  const runOnce = async () => {
    try {
      const blockedIds = new Set(await blockedClientController.getBlockedClientIds());
      const newJobss = await scrapeJobs();
      const newJobs = newJobss.slice(0, newJobss.length);
      if (Array.isArray(newJobs) && newJobs.length > 0) {
        for (let i = 0; i < newJobs.length; i++) {
          let job = newJobs[i];

          if (blockedIds.has(Number(job.clientId))) {
            console.log(`Skipping job ${job.id} - client ${job.clientId} is blocked`);
            continue;
          }
          
          const existing = await Job.findOne({ id: job.id });
          if (existing) continue;

          const jobDetail = await getJobDetail(job.id);
          job.desc = jobDetail || '';

          new Job(job).save().then();

          if (shouldPostJobToTelegram(job)) {
            // await postJobToTelegramGroup(job);
            const availableTgIds = await getAvailableTgIds(job);
            console.log(availableTgIds, job.id, 'availableTgIds', i + 1, '/', newJobs.length);
            if (availableTgIds.length > 0) {
              bidProcessor(availableTgIds, job); // Non-blocking - adds to queue
            }
          } else {
            console.log(`Skipping Telegram post for job ${job.id} - fixed with budget < 50000`);
          }
        }
      }
    } catch (err) {
      console.error("scrapeController error:", err);
    }
  };

  runOnce();
  scrapingInterval = setInterval(runOnce, intervalMs);

  return { started: true, message: "Scraping started" };
};

export const stopScraping = () => {
  if (scrapingInterval) {
    clearInterval(scrapingInterval);
    scrapingInterval = null;
  }
  const wasActive = scrapingActive;
  scrapingActive = false;
  return { stopped: wasActive, message: "Scraping stopped" };
};


export const getScrapingStatus = () => {
  return scrapingActive;
};

export const getJobDetail = async (jobId: number | string): Promise<string | null> => {
  const url = `https://crowdworks.jp/public/jobs/${jobId}`;
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const td = $('td.confirm_outside_link').first();
    if (!td.length) {
      return null;
    }

    // Use .html() to get line breaks as <br/>, then convert <br> to \n, and strip other HTML tags.
    let contentHtml = td.html() || "";
    // Replace various <br> tags with line breaks
    contentHtml = contentHtml.replace(/<br\s*\/?>/gi, '\n');

    // remove line with more than 1 consecutive newlines
    contentHtml = contentHtml.replace(/\n{3,}/g, '\n').replace(/^\n+|\n+$/g, '');

    const contentText = contentHtml.replace(/<[^>]+>/g, '').trim();

    return contentText;
  } catch (err) {
    console.error('Failed to get job detail:', err);
    return null;
  }
};

export const postJobToTelegramGroup = async (job: ScrapedJobType) => {
  const message = await getJobMessage(job);
  const replyMarkup = getBidInlineKeyboard(job);
  await sendMessage(Number(GROUP_ID), message, replyMarkup);
};