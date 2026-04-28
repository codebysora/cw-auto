export type JobPaymentType = 'hourly' | 'fixed' | '';

interface JobType {
  id: number;
  title: string;
  categoryId: number;
  desc: string;
  jobType: string;
  lowBudget: number;
  highBudget: number;
  suggestions: number;
  deadline: string;
  postedDate: string;
  clientId: number;
  clientName: string;
  clientAvatar: string;
  bidders: number[];
}

export default JobType;

export interface ScrapedJobType {
  id: number;
  categoryId: number;
  title: string;
  desc: string;
  jobType: string;
  lowBudget: number;
  highBudget: number;
  suggestions: number;
  deadline: string;
  postedDate: string;
  clientId: number;
  clientName: string;
  clientAvatar: string;
}


export interface JobType2 {
  id: string;
  name: string;
  type: JobPaymentType;
}

export interface JobItem {
  title: string;
  desc: string;
  jobtype: JobType2;
  price: number;
  priceString: string;
  postDate: string;
  userName: string;
  userId: string;
  jobId: string;
  categoryId: string;
  skills: string[];
  apply: boolean;
  appliedMessage?: string
}

export interface JobDetails {
  id: string;
  title: string;
  desc: string;
  skills: string;
  category: string;
  jobType: JobPaymentType;
  price: number;
  priceString: string;
  userName: string;
}