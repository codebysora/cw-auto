import config from "@Server/config";
import { Telegraf } from "telegraf";
import { getScrapingStatus, startScraping, stopScraping } from "@Server/controller/scrapeController";
import { saveUserTelegramId } from "@Server/controller/authController";

const commands: {
  command: string;
  description: string;
}[] = [
    { command: "start", description: "Start the bot" },
    { command: "start_scraping", description: "Start automatic scraping process !!!" },
    { command: "stop_scraping", description: "Stop automatic scraping process !!!" },
    { command: "request_access", description: "Request access to receive job notifications" },
  ];

const setup_commands = async (bot: Telegraf) => {
  await bot.telegram.setMyCommands(commands);

  const adminCheck = async (ctx: any) => {
    const userId = ctx.update.message.from.id;
    if (config.ADMIN_ID !== userId.toString()) {
      await ctx.reply(`🚫 This command is for admin only.`);
      return false;
    }
    return true;
  }

  bot.start(async (ctx) => {
    try {
      console.log(ctx.chat.id, 'chatid')
      await ctx.reply(
        `👋 Welcome to the *CrowedWorks Job Bidder Bot* \n 
        please select one of the following options.\n\n 
        If you need assistance, please contact @wyvern280: 🐉`);
    } catch (error) {
      console.error("Error in /start:", error);
      await ctx.reply("An error occurred. Please try again later.");
    }
  });

  bot.command("start_scraping", async (ctx) => {
    let isAdmin = await adminCheck(ctx);
    if (!isAdmin) return;

    try {
      const scrapingStatus = getScrapingStatus();
      if (scrapingStatus) return await ctx.reply("Scraping is currently running.");
      const result = startScraping();
      await ctx.reply(result.message);
    } catch (error) {
      console.error("Error on start scraping:", error);
      await ctx.reply("An error occurred. Please try again later.");
    }
  });

  // setTimeout(() => {
  //   startScraping();  
  // }, 10000);

  bot.command("stop_scraping", async (ctx) => {
    let isAdmin = await adminCheck(ctx);
    if (!isAdmin) return;

    try {
      const result = stopScraping();
      await ctx.reply(result.message);
    } catch (error) {
      console.error("Error on stop scraping:", error);
      await ctx.reply("An error occurred. Please try again later.");
    }
  });

  bot.command("request_access", async (ctx) => {
    try {
      const userId = ctx.update.message.from.id;

      const result = await saveUserTelegramId(userId);
      await ctx.reply(result.message);
    } catch (error) {
      console.error("Error in /request_access:", error);
      await ctx.reply("❌ An error occurred while processing your request. Please try again later.");
    }
  });


};

export default setup_commands;
