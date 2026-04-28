import axios from "axios";
import CwProfileModel from "@Server/models/CwProfile";
import Job from "@Server/models/Job";
import { createBidText } from "@Server/controller/openAiController";
import AutoBidSchedule from "@Server/models/AutoBidSchedule";
import { ScrapedJobType } from "@Server/types/job";
import { SingleBid } from "@Server/models/BidHistory";
import * as bidHistoryController from "@Server/controller/bidHistoryController";

export interface PlaceBidParams {
    jobType?: 'hourly' | 'fixed_price';
    hours_limit: number,
    defaultHourlyPrice?: number;
    jobId: number;
    budget: number;
    cookie: string;
    authToken: string;
    bidText: string;
}

export interface PlaceBidResult {
    success: boolean;
    message?: string;
}

export async function placeBid(params: PlaceBidParams): Promise<PlaceBidResult> {
    let {
        jobId,
        jobType = 'hourly',
        authToken,
        cookie,
        budget,
        defaultHourlyPrice,
        hours_limit,
        bidText
    } = params;

    if (budget == 0) jobType = 'hourly';

    try {
        const data: any = {
            "authenticity_token": authToken,
            "proposal[conditions_attributes][0][payment_type]": jobType,
            "proposal[conditions_attributes][0][milestones_attributes][0][index]": "0",
            "proposal[conditions_attributes][0][milestones_attributes][0][amount_without_sales_tax]": budget,
            "proposal[conditions_attributes][0][hourly_wage_without_sales_tax]": budget ? budget : defaultHourlyPrice,
            "proposal[conditions_attributes][0][hours_limit]": hours_limit,
            "proposal[conditions_attributes][0][message_attributes][body]": bidText,
            "proposal[job_offer_id]": jobId
        };

        const headers = {
            'Cookie': cookie,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': '*/*',
            'Host': 'crowdworks.jp'
        };

        const placeBidResponse = await axios.post(
            `https://crowdworks.jp/proposals`,
            data,
            {
                headers: headers,
                timeout: 300000 // 300 seconds timeout
            }
        );
        if (placeBidResponse.status >= 200 && placeBidResponse.status < 300) {
            return { success: true, message: `Bid submitted successfully. Status: ${placeBidResponse.status}` };
        }
        return { success: false, message: `Non-success status: ${placeBidResponse.status}` };
    } catch (error: any) {
        return { success: false, message: error?.message || "Bid submission failed" };
    }
}


export interface AutoBidResult {
    success: boolean;
    message: string;
    bidData?: any;
}

const BID_REPORT_API_URL = process.env.BID_REPORT_API_URL || "";

interface BidReportPayload {
    platform: "crowdworks";
    account_id: string;
    account_url: string;
    job_id: string;
    job_url: string;
    bid_content: string;
    budget: string;
    bid_time: string;
}

async function sendBidReport(payload: BidReportPayload): Promise<void> {
    if (!BID_REPORT_API_URL) {
        console.warn("BID_REPORT_API_URL is not set. Skipping bid report.");
        return;
    }

    try {
        console.log("[BidReport] Sending report payload:", payload);
        const response = await axios.post(BID_REPORT_API_URL, payload, {
            timeout: 30000,
            headers: {
                "Content-Type": "application/json",
            },
        });
        console.log("[BidReport] Report sent successfully:", {
            status: response.status,
            statusText: response.statusText,
            data: response.data,
        });
    } catch (error: any) {
        console.error("[BidReport] Failed to send bid report:", {
            message: error?.message || "Unknown error",
            status: error?.response?.status,
            statusText: error?.response?.statusText,
            data: error?.response?.data,
        });
    }
}

export async function singleAutoBid(telegramId: number, jobId: number): Promise<AutoBidResult> {

    // return { success: true, message: "Bid submitted successfully." };

    if (!telegramId) return { success: false, message: "❌ Missing Telegram ID." };
    if (!jobId) return { success: false, message: "❌ Missing Job ID." };

    const job = await Job.findOne({ id: jobId }).lean();

    if (!job) return { success: false, message: "❌ Job not found." };
    if (job.bidders.includes(telegramId)) return { success: false, message: "❌ You have already bid for this job." };

    const profile = await CwProfileModel.findOne({ telegramId, authStatus: true }).lean();
    if (!profile || !profile.auth_token || !profile.cookie) {
        return { success: false, message: "❌ CW not configured. Please register valid CW credentials in the dashboard." };
    }

    const autoBidSchedule = await AutoBidSchedule.findOne({ telegramId }).lean();

    // Generate bid text via external bid API
    let bidText: string;
    try {
        const result = await createBidText(telegramId, job);

        if (result.status == 200) {
            bidText = result.text;
        } else {
            return { success: false, message: `❌ Failed to generate bid text: ${result.status || 'Unknown error'}` };
        }

        if (!bidText || !bidText.trim()) {
            return { success: false, message: "❌ Failed to generate bid text." };
        }
    } catch (error: any) {
        console.error(`Failed to generate bid text for telegramId ${telegramId}, jobId ${jobId}:`, error.message);
        return { success: false, message: `❌ Failed to generate bid text: ${error.message || 'Unknown error'}` };
    }

    const jobType = (job.jobType === "hourly") ? "hourly" : 'fixed_price';
    let budget = 0;
    // If both low and high budget exist and are not 0
    if (job.lowBudget && job.highBudget) {
        budget = autoBidSchedule?.clientBudgetPreference === "low" ? job.lowBudget : job.highBudget;
    } else if (job.highBudget && job.highBudget !== 0) {
        budget = job.highBudget;
    }
    const bidData = {
        jobId: job.id,
        jobType,
        authToken: profile.auth_token as string,
        cookie: profile.cookie as string,
        defaultHourlyPrice: autoBidSchedule?.preferredHourlyBudget,
        hours_limit: (autoBidSchedule?.hoursLimit ?? 35),
        budget,
        bidText,
    };

    const submit = await placeBid(bidData as PlaceBidParams);
    const suggestedBudget = (budget) ? budget : (bidData?.defaultHourlyPrice ?? 0);

    await sendBidReport({
        platform: "crowdworks",
        account_id: (profile.accountId || "").trim(),
        account_url: (profile.accountLink || "").trim(),
        job_id: String(job.id),
        job_url: `https://crowdworks.jp/public/jobs/${job.id}`,
        bid_content: bidText,
        budget: String(suggestedBudget),
        bid_time: new Date().toISOString(),
    });

    if (submit.success) {
        // Only save bid history and bidders if bid was successfully submitted
        Job.updateOne({ id: job.id }, { $addToSet: { bidders: telegramId } }).then();
        let biddedData = {
            jobId: job.id,
            bidText,
            jobType: job.jobType,
            budget: suggestedBudget,
        };

        bidHistoryController.addBidToDay(telegramId, new Date(), biddedData as SingleBid);

        return { success: true, bidData, message: `✅ Bid submitted for job ${job.id}` };
    }
    return { success: false, message: `❌ Failed to submit bid: ${submit.message || 'Unknown error'}` };
}


