import axios from 'axios'
import * as cheerio from 'cheerio';
import Job from '@Server/models/Job';

let scrapStatus = true;

const searchUrls = [
  "https://crowdworks.jp/public/jobs/search?category_id=226&order=new",
  "https://crowdworks.jp/public/jobs/search?category_id=311&order=new",
  "https://crowdworks.jp/public/jobs/search?category_id=242&order=new",
  "https://crowdworks.jp/public/jobs/search?category_id=230&order=new",
  "https://crowdworks.jp/public/jobs/search?category_id=235&order=new",
];

const categories = [
  [2, 83, 8, 12, 13, 282, 173, 1, 284, 78, 342, 343, 344, 345, 346, 347, 348, 349, 355, 25, 51, 177, 104, 179, 178, 9, 10],
  [364, 365, 283, 366],
  [3, 4, 82, 6, 174, 175, 81],
  [14, 15, 20, 17, 16, 285, 286, 7, 87, 77, 112, 304],
  [84, 137, 315, 316, 317]
];

let latestJobIds: number[] = [];

// Job.find({ id: 12653009 }).then((jobs) => {
//   console.log(jobs, 'jobs');
// });

let indicatedJobId: number = process.env.LATEST_JOB_ID ? Number(process.env.LATEST_JOB_ID) : 0;

(async () => {
  // For each category group in categories array, get the latest document's job id and push to latestJobIds with its index
  for (let i = 0; i < categories.length; i++) {
    const finalDoc = await Job.findOne({ categoryId: { $in: categories[i] } }).sort({ _id: -1 });
    latestJobIds[i] = finalDoc && finalDoc.id ? Number(finalDoc.id) : indicatedJobId;
  }
  console.log(latestJobIds, 'latestJobIds');
})();

export const scrapeJobs = async () => {
  console.log('scrapeJobs');
  if (!scrapStatus) return [] as any[];

  const aggregatedNewJobs: any[] = [];

  for (let i = 0; i < searchUrls.length; i++) {
    const response = await axios.get(searchUrls[i]);
    const $ = cheerio.load(response.data);
    const vueContainer = $('#vue-container');
    const dataAttr = vueContainer.attr('data');

    if (!dataAttr) {
      throw new Error('vue-container data attribute not found');
    }

    const decodedData = dataAttr.replace(/&quot;/g, '"');
    const jsonData = JSON.parse(decodedData);

    const jobs: any[] = jsonData?.searchResult?.job_offers || [];

    let latestTempId = jobs[0].job_offer.id;
    console.log(latestTempId, 'latestTempId');

    for (const j of jobs) {
      const job: any = j.job_offer || {};

      if (Number(job.id) == latestJobIds[i]) {
        break;
      }

      const payment = j.payment?.fixed_price_payment || j.payment?.hourly_payment || {};
      let jobType: string = 'fixed';
      let lowBudget: number = 0;
      let highBudget: number = 0;

      if (j.payment?.fixed_price_payment) {
        jobType = 'fixed';
        lowBudget = Number(payment.min_budget ?? 0);
        highBudget = Number(payment.max_budget ?? 0);
      } else if (j.payment?.hourly_payment) {
        jobType = 'hourly';
        lowBudget = Number(payment.min_hourly_wage ?? 0);
        highBudget = Number(payment.max_hourly_wage ?? 0);
      }

      aggregatedNewJobs.push({
        id: Number(job.id),
        categoryId: Number(job.category_id ?? 0),
        title: job.title || '',
        desc: job.description_digest || '',
        jobType,
        lowBudget,
        highBudget,
        suggestions: Number(j.entry?.project_entry?.num_contracts ?? 0),
        deadline: job.expired_on || '',
        postedDate: job.last_released_at || '',
        clientId: Number(j.client?.user_id ?? 0),
        clientName: j.client?.username || '',
        clientAvatar: j.client?.user_picture_url || '',
      });
    }

    latestJobIds[i] = latestTempId;
  }

  console.log('-> New Job Length : ', aggregatedNewJobs.length);

  return aggregatedNewJobs.reverse();
}
