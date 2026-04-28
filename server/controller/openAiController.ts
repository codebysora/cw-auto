import { ScrapedJobType } from "@Server/types/job";
import axios from "axios";
import BidTemplate from "@Server/models/BidTemplate";
import Prompt from "@Server/models/Prompt";

const PROJECT_LINKS_API_URL =
  process.env.PROJECT_LINKS_API_URL ||
  "http://135.181.224.37:3000/api/project-links";

const categoryIds = {
  "system-development": [
    2, 83, 8, 12, 13, 282, 173, 1, 284, 78, 342, 343, 344, 345, 346, 347, 348,
    349, 355, 25, 51, 177, 104, 179, 178, 9, 10,
  ],
  "ai-machine-learning": [364, 365, 283, 366],
  "app-smartphone": [3, 4, 82, 6, 174, 175, 81],
  "hp-web-design": [14, 15, 20, 17, 16, 285, 286, 7, 87, 77, 112, 304],
  "ec-building": [84, 137, 315, 316, 317],
};

const getCategoryNameById = async (
  categoryId: number,
): Promise<string | undefined> => {
  for (const [key, ids] of Object.entries(categoryIds)) {
    if (Array.isArray(ids) && ids.includes(Number(categoryId))) {
      return key;
    }
  }
  return undefined;
};

const categoryLabelMap: Record<string, string> = {
  "system-development": "System development",
  "ai-machine-learning": "AI / Machine learning",
  "app-smartphone": "App / Smartphone",
  "hp-web-design": "HP / Web design",
  "ec-building": "EC site",
};

const normalizePromptForApi = (text: string): string => {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u0000/g, "")
    .trim();
};

const fetchBidTextFromApi = async (
  job: ScrapedJobType,
  promptText: string,
): Promise<string> => {
  const normalizedPrompt = normalizePromptForApi(promptText);
  const categoryKey = await getCategoryNameById(Number(job.categoryId));
  const category =
    (categoryKey && categoryLabelMap[categoryKey]) ||
    categoryKey ||
    "General web development";
  const description = String(job.desc || job.title || "").trim();

  const payload = {
    jobID: String(job.id),
    jobLink: `https://crowdworks.jp/public/jobs/${job.id}`,
    count: "5",
    category,
    description,
    prompt: normalizedPrompt,
  };

  try {
    console.log("[bid-api] request", {
      url: PROJECT_LINKS_API_URL,
      payload,
    });

    const response = await axios.post(PROJECT_LINKS_API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const bidsText = String(response?.data?.bids || "").trim();
    console.log("[bid-api] response", bidsText);

    return bidsText;
  } catch (error: any) {
    console.error("Failed to fetch bid text:", {
      message: error?.message || String(error),
      status: error?.response?.status,
      data: error?.response?.data,
    });
    return "";
  }
};

const extractUrlsFromText = (text: string): string[] => {
  if (!text) return [];
  const matches = text.match(/https?:\/\/[^\s<>"'`）)\]]+/gi) || [];
  return matches
    .map((url) =>
      String(url || "")
        .trim()
        .replace(/[.,;!?]+$/g, ""),
    )
    .filter(Boolean);
};

const mergeUniqueLinks = (...linkGroups: string[][]): string[] => {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const links of linkGroups) {
    for (const raw of links) {
      const link = String(raw || "").trim();
      if (!link) continue;
      const key = link.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(link);
    }
  }

  return merged;
};

export const createBidText = async (
  telegramId: any,
  job: ScrapedJobType,
): Promise<{ status: number; text: string }> => {
  try {
    // Determine the category name (key) given job.categoryId (number)
    const categoryName: string | undefined = await getCategoryNameById(
      Number(job.categoryId),
    );

    let bidTemplate = await BidTemplate.findOne({
      telegramId,
      role: job.categoryId.toString(),
      isActive: true,
    });
    let bid_prompt = await Prompt.findOne({
      telegramId,
      category: categoryName,
    });

    if (!bidTemplate)
      bidTemplate = await BidTemplate.findOne({
        telegramId,
        role: "general-bid-template",
        isActive: true,
      });
    if (!bid_prompt)
      bid_prompt = await Prompt.findOne({ telegramId, category: "default" });

    const apiPrompt = [
      `Prompt: ${bid_prompt?.prompt || ""}`,
      `Bid Template: ${bidTemplate?.template || ""}`,
    ].join("\n");

    try {
      const apiBidText = await fetchBidTextFromApi(job, apiPrompt);
      if (apiBidText) {
        return { status: 200, text: apiBidText };
      }
      return { status: 500, text: "" };
    } catch (error: any) {
      console.log(error?.response?.data, "error");
      return { status: 500, text: "" };
    }
  } catch (error: any) {
    console.error(
      "Error in createBidText for telegramId:",
      telegramId,
      "error:",
      error?.message || "Unknown error",
    );
    // Re-throw the error so it can be caught by the caller
    return { status: 500, text: "" };
  }
};

export default createBidText;
