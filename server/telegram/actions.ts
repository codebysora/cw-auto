import { Telegraf } from "telegraf";
import { delay } from "@Server/utils";
import { singleAutoBid } from "@Server/service/bidder";

const setup_actions = async (bot: Telegraf) => {

    bot.action(/auto_bid:(.+)/, async (ctx) => {
        const jobId = Number(ctx.match[1]);
        const telegramId = ctx.from?.id;

        if (!telegramId) return ctx.answerCbQuery("Missing Telegram ID.", { show_alert: false });
        if (!jobId || Number.isNaN(jobId)) return ctx.answerCbQuery("Invalid job.", { show_alert: false });

        // Answer the callback query immediately to prevent timeout
        await ctx.answerCbQuery("⏳ Processing bid...", { show_alert: false });

        const botId = ctx.from.id;


        try {
            const result = await singleAutoBid(telegramId, jobId);
            // Send a follow-up message with the result instead of using answerCbQuery
            await ctx.telegram.sendMessage(botId, result.message);
        } catch (err: any) {
            await ctx.telegram.sendMessage(botId, `❌ Error while preparing/submitting bid: ${err?.message || err}`);
        }
    });
};

export default setup_actions;