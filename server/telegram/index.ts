import config from "@Server/config";
import { Telegraf } from "telegraf";
import setup_commands from "./commands";
import setup_actions from "./actions";
import { delay } from "@Server/utils";

const bot = new Telegraf(config.BOT_TOKEN);

setup_commands(bot);
setup_actions(bot);

export const sendMessage = async (
  id: number,
  msg: string,
  reply_markup_opt?: any,
) => {
  try {
    let message = `<blockquote>${msg}</blockquote>`;

    await bot.telegram.sendMessage(id, message, {
      parse_mode: "HTML",
      // reply_markup: reply_markup_opt  // for inline keyboard
    });

    return { success: true, message: "Message sent successfully" };
  } catch (err: any) {
    if (err.code === 429) {
      const retryAfter = err.parameters?.retry_after || 5;
      await delay((retryAfter + 1) * 1000);
      console.log(`Rate limited — waiting ${retryAfter}s...`);

      return { success: false, message: "Failed to send message" };
    } else {
      console.error(err);
      
      return { success: false, message: "Failed to send message" };
    }
  }
};

export const launchBot = async () => {
  try {
    return await new Promise((resolve) => {
      bot.launch(() => {
        resolve("Bot started");
      });
    });
  } catch (error: any) {
    console.error("Error launching bot:", error.message);
    throw error;
  }
};
