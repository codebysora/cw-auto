import { ScrapedJobType } from "@Server/types/job";
import { sendMessage } from "@Server/telegram";
import UserModel from "@Server/models/User";
import { delay, formatJobCategoryForMessage } from "@Server/utils";
import { getClientInfo } from "./clientScraper";

export const getJobMessage = async (job: ScrapedJobType): Promise<string> => {
    const clientInfo = await getClientInfo(job.clientId);

    // Build message sections with priority
    const sections = [];
    let totalLength = 0;
    const maxLength = 2000;

    // 1. Job Title (always include)
    const title = `<b>${job.title}</b>\n\n`;
    sections.push(title);
    totalLength += title.length;
    // Build jobDetails for createBidText
    const priceString = job.lowBudget && job.highBudget ? `${job.lowBudget}~${job.highBudget}円` : String(job.lowBudget || job.highBudget || "???円");

    // 2. Essential Job Info
    const essentialInfo = [
        `<b>Job Posted Date: </b> ${job.postedDate}`,
        `<b>Job Type: </b> ${job.jobType}`,
        `<b>Budget: </b> ${priceString}`,
        `<b>Deadline: </b> ${job.deadline}`,
        `<b>Job LINK:</b> <a href="https://crowdworks.jp/public/jobs/${job.id}">Click here</a>`,
        `<b>Client LINK:</b> <a href="https://crowdworks.jp/public/employers/${job.clientId}">Click here</a>`,
   
        formatJobCategoryForMessage(job.categoryId),
        job.suggestions ? `<b>Suggestions: </b> ${job.suggestions}` : null,
    ].filter(Boolean).join('\n') + '\n\n';

    sections.push(essentialInfo);
    totalLength += essentialInfo.length;

    // 3. Client Info (prioritized by importance)
    if (clientInfo) {
        const clientSections = [];

        // Client name and verification status
        let clientHeader = `<b>Client:</b> ${job.clientName}`;
        if (clientInfo.is_certified) clientHeader += ' ✅ ';
        if (clientInfo.identity_verified) clientHeader += ' 🆔 ';
        if (clientInfo.is_official_account) clientHeader += ' 📢 ';
        if (clientInfo.is_employer_rule_check_succeeded) clientHeader += ' ⚠️ ';
        clientSections.push(clientHeader);

        // Performance metrics (if available)
        if (clientInfo.average_rating && clientInfo.total_ratings) {
            const rating = `⭐ ${clientInfo.average_rating.toFixed(1)} (${clientInfo.total_ratings}件)`;
            clientSections.push(rating);
        }

        // Project completion rate
        if (clientInfo.project_completion_rate !== undefined) {
            const completionRate = `📊 Completion Rate: ${clientInfo.project_completion_rate}%`;
            clientSections.push(completionRate);
        }

        // Job achievement count
        if (clientInfo.job_offer_achievement_count) {
            const achievements = `🎯 Offers: ${clientInfo.job_offer_achievement_count}件`;
            clientSections.push(achievements);
        }

        // Location (if available)
        if (clientInfo.location) {
            clientSections.push(`📍 Location: ${clientInfo.location}`);
        }

        const clientInfoText = clientSections.join('\n') + '\n\n';

        // Check if we can fit client info
        if (totalLength + clientInfoText.length < maxLength - 500) { // Reserve 500 chars for description
            sections.push(clientInfoText);
            totalLength += clientInfoText.length;
        }
    } else {
        // Fallback if client info is not available
        const fallbackClient = `<b>Client:</b> ${job.clientName}\n\n`;
        sections.push(fallbackClient);
        totalLength += fallbackClient.length;
    }

    // 4. Job Description (truncated if necessary)
    const remainingLength = maxLength - totalLength - 50; // Reserve 50 chars for buffer
    let description = job.desc;

    if (description.length > remainingLength) {
        description = description.substring(0, remainingLength - 3) + '...';
    }

    const descriptionText = `<b>Job Details:</b>\n<pre>${description}</pre>\n\n`;
    sections.push(descriptionText);
    totalLength += descriptionText.length;

    return sections.join('');
}

export const getBidInlineKeyboard = (job: ScrapedJobType) => ({
    inline_keyboard: [
        [
            { text: 'Auto Bid', callback_data: `auto_bid:${job.id.toString()}` },
            { text: 'Manual Bid', callback_data: `manual_bid:${job.id.toString()}` },
            { text: 'Job Link', url: `https://crowdworks.jp/public/jobs/${job.id}` },
            { text: 'Client Link', url: `https://crowdworks.jp/public/employers/${job.clientId}` },
        ]
    ]
});

export function getCurrentTimeHHMM() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

export function getCurrentDayName(): string {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const now = new Date();
    return daysOfWeek[now.getDay()];
}

export function getCurrentDateYYYYMMDD(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}


