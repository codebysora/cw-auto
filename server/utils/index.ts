import config from "@Server/config";
import { connect, PageWithCursor } from "puppeteer-real-browser";

export const delay = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const isEmpty = (value: any): boolean => {
  if (value == null) return true; // null or undefined

  if (typeof value === "string" || Array.isArray(value)) {
    return value.length === 0;
  }

  if (value instanceof Map || value instanceof Set) {
    return value.size === 0;
  }

  if (typeof value === "object") {
    return Object.keys(value).length === 0;
  }

  return false;
};

export function getRndId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}

export const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
};

export const openBrowser = async () => {
  try {
    // Add proxy support: read from config.PROXY (string) and config.PROXY_AUTH (object { username, password })
    const proxy = (config as any).PROXY as string | undefined;
    const proxyAuth = (config as any).PROXY_AUTH as | { username: string; password: string } | undefined;

    const launchArgs = [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
      "--start-maximized",
      "--disable-web-security",
    ];

    if (proxy) {
      launchArgs.push(`--proxy-server=${proxy}`);
      console.log("Using proxy:", proxy);
    }

    const { browser, page } = await connect({
      headless: false,
      args: launchArgs,
      customConfig: {},
      turnstile: true,
      connectOption: {
        protocolTimeout: 100000,
      },
      disableXvfb: false,
      ignoreAllFlags: false,
    });

    // If proxy requires authentication, provide credentials to the page
    if (proxy && proxyAuth && page && (page as any).authenticate) {
      try {
        await (page as any).authenticate({
          username: proxyAuth.username,
          password: proxyAuth.password,
        });
        console.log("Proxy authentication applied");
      } catch (authErr) {
        console.error("Error applying proxy auth:", (authErr as Error).message);
      }
    }

    return { browser, page };
  } catch (err) {
    console.error("Error in useRealBrowser:", (err as Error).message);
    throw err;
  }
};

export const login = async (mailInfo: any, page: PageWithCursor) => {
  try {
    await page.goto("https://crowdworks.jp/login", {
      waitUntil: "domcontentloaded",
    });

    await page.type('input[name="username"]', mailInfo.email, { delay: 150 });

    await page.type('input[name="password"]', mailInfo.password, { delay: 150 });

    await page.click('button[type="submit"]');
    console.log("🔓 Submitted login form");
  } catch (err) {
    console.error("Error in login:", (err as Error).message);
    throw err;
  }
};

export const generateBidMessage = async (jobDetails: any): Promise<string> => {
  // Simple bid message generation - you can enhance this with AI later
  const messages = [
    `こんにちは！\n\n${jobDetails.title}の案件について拝見いたしました。\n\n私の経験とスキルを活かして、高品質な成果物をお届けできると確信しております。\n\n詳細についてお話しさせていただければ幸いです。\n\nよろしくお願いいたします。`,

    `お疲れ様です！\n\n${jobDetails.title}のご依頼を拝見いたしました。\n\nこの案件に最適なスキルと経験を持っており、お客様のご期待に応えられると思います。\n\nご質問等ございましたら、お気軽にお声がけください。\n\nよろしくお願いいたします。`,

    `初めまして！\n\n${jobDetails.title}の案件について興味深く拝見いたしました。\n\n私の専門知識と実績を活かして、お客様のプロジェクトを成功に導きたいと思います。\n\n詳細についてご相談させていただければと思います。\n\nよろしくお願いいたします。`
  ];

  // Return a random message for variety
  return messages[Math.floor(Math.random() * messages.length)];
};

export const categoryIds = {
  "system-development": [
    2, 83, 8, 12, 13, 282, 173, 1, 284, 78, 342, 343, 344, 345,
    346, 347, 348, 349, 355, 25, 51, 177, 104, 179, 178, 9, 10
  ],
  "ai-machine-learning": [364, 365, 283, 366],
  "app-smartphone": [3, 4, 82, 6, 174, 175, 81],
  "hp-web-design": [14, 15, 20, 17, 16, 285, 286, 7, 87, 77, 112, 304],
  "ec-building": [84, 137, 315, 316, 317],
};

/** CrowdWorks subcategory id → English label (for Telegram job alerts). */
export const categorySubLabels: Record<number, string> = {
  2: "Site Construction and Web Development",
  83: "Business systems and software",
  8: "Server/Network Construction",
  12: "Database design and construction",
  13: "Excel VBA/Macro Development",
  282: "Scraping/Data Collection",
  173: "Web Programming",
  1: "Project management and requirements definition",
  284: "Programming instructor/mentor",
  78: "Others (system development)",
  342: "AWS construction and WAF implementation",
  343: "Stock, FX, and virtual currency tool development",
  344: "Customer management/CRM system development",
  345: "Salesforce/SFA system development",
  346: "Ordering system development",
  347: "Reservation system development",
  348: "Attendance management system development",
  349: "Responsive website creation",
  355: "Metaverse Development",
  25: "System management, updates, and maintenance",
  51: "Testing, Verification, and Debugging",
  177: "Website updates and maintenance",
  104: "Data Cleansing",
  179: "Security measures",
  178: "Quality assessment",
  9: "Windows Application Development",
  10: "Mac Application Development",
  364: "Machine Learning and Deep Learning",
  365: "ChatGPT Development",
  283: "AI/Chatbot Development",
  366: "AI annotation",
  3: "iPhone/iPad app development",
  4: "Android App Development",
  82: "Smartphone app development and website construction",
  6: "Social Game Development",
  174: "Android Game Development",
  175: "iPhone/iPad game development",
  81: "Mobile app development",
  14: "Homepage creation",
  15: "Web Design",
  20: "WordPress production and installation",
  17: "Landing page (LP) production",
  16: "HTML and CSS coding",
  285: "Website corrections, updates, and feature additions",
  286: "Icon, button and header production",
  7: "CMS implementation",
  87: "Mobile site/smartphone site production",
  77: "UI/UX Design",
  112: "Interaction Design",
  304: "Owned media production",
  84: "EC site production",
  137: "E-commerce website design",
  315: "EC site operation tool development",
  316: "Product description creation",
  317: "E-commerce consulting",
};

/** Parent topic key → short label for job posts (matches categoryIds groups). */
export const categoryTopicLabels: Record<string, string> = {
  "system-development": "System development",
  "ai-machine-learning": "AI / Machine learning",
  "app-smartphone": "App / smartphone",
  "hp-web-design": "HP / web design",
  "ec-building": "EC building",
};

export const getCategoryTopicKeySync = (categoryId: number): string | undefined => {
  const n = Number(categoryId);
  for (const [key, ids] of Object.entries(categoryIds)) {
    if (ids.includes(n)) return key;
  }
  return undefined;
};

/** Human-readable category block: subcategory name, topic group, and numeric id. */
export const formatJobCategoryForMessage = (categoryId: number): string => {
  const id = Number(categoryId);
  const sub = Number.isFinite(id) && id > 0 ? categorySubLabels[id] : undefined;
  const topicKey = getCategoryTopicKeySync(id);
  const topic = topicKey ? categoryTopicLabels[topicKey] : undefined;

  const labelPart = sub ? `${sub} <code>(${id})</code>` : `<code>${id}</code>`;
  const lines = [`<b>Job Category: </b> ${labelPart}`];
  if (topic) {
    lines.push(`<b>Topic: </b> ${topic}`);
  }
  return lines.join("\n");
};

export const getCategoryNameById = async (categoryId: number) => {
  return getCategoryTopicKeySync(Number(categoryId));
};