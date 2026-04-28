import axios from 'axios';

interface EmployerUser {
  id: number;
  display_name: string;
  is_certified_employer: boolean;
  profile_image_src?: string;
  last_accessed_at?: string;
  employer_follow_relationship_id?: number | null;
  is_official_account?: boolean;
  identity_verified?: boolean;
  is_employer_rule_check_succeeded?: boolean;
  feedback?: {
    average_score: number;
    total_count: number;
  };
  job_offer_achievement_count?: number;
  project_finished_data?: {
    rate: number;
    total_acceptance_count: number;
    total_finished_count: number;
  };
  created_at?: string;
  prefecture_name?: string;
}

interface CompanyProfile {
  description?: string;
  url?: string | null;
}

interface RatingItemScore {
  label_text: string;
  score: number;
}

interface UserRating {
  user_id: number;
  img_src: string;
  average_score: number;
  comment: string;
  job_offer_id: number;
  job_offer_title: string;
  private: boolean;
  nofollow: boolean;
  rated_at: string;
  rating_item_scores: RatingItemScore[];
}

interface TotalRating {
  average_score: number;
  evaluation_count: number;
  rating_item_scores: RatingItemScore[];
}

interface Feedback {
  total_rating?: TotalRating;
  user_ratings?: UserRating[];
}

interface JobOffer {
  job_offer_id: number;
  job_offer_title: string;
  private: boolean;
  nofollow: boolean;
  job_offer_category_id?: number;
  job_offer_category_name?: string;
  job_offer_category_group_icon_class_name?: string;
  payment_type?: string;
  condition_text?: string;
  is_active: boolean;
  contracted: boolean;
  period?: string;
}

interface EmployerProfileSummary {
  user_id: number;
  company_profile?: CompanyProfile;
  job_categories?: any[];
  feedback?: Feedback;
  job_offers?: JobOffer[];
  consultation_threads?: any[];
  consultation_comments?: any[];
}

interface PublicEmployerPageJson {
  employer_user: EmployerUser;
  logged_in_user: any;
}

interface EmployerProfileJson {
  toggle_follow_button_is_available?: boolean;
  employer_user: EmployerUser;
}

interface VueContainerData {
  public_employer_page_json: PublicEmployerPageJson;
  employer_profile_json: EmployerProfileJson;
  employer_profile_summary_json: EmployerProfileSummary;
  is_mobile: boolean;
}

export interface ExtractedClientInfo {
  // Basic Info
  client_id: number;
  display_name: string;
  profile_image?: string;
  last_accessed?: string;

  // Verification & Status
  is_certified: boolean;
  identity_verified?: boolean;
  is_official_account?: boolean;
  is_employer_rule_check_succeeded?: boolean;

  // Location & Company
  location?: string;
  company_description?: string;
  company_url?: string | null;

  // Dates
  created_at?: string;

  // Performance Metrics
  job_offer_achievement_count?: number;
  project_completion_rate?: number;
  total_acceptance_count?: number;
  total_finished_count?: number;

  // Ratings & Feedback
  average_rating?: number;
  total_ratings?: number;
  rating_breakdown?: RatingItemScore[];
  recent_ratings?: UserRating[];

  // Job Offers
  all_job_offers?: JobOffer[];
  active_job_offers?: JobOffer[];
  inactive_job_offers?: JobOffer[];
  contracted_job_offers?: JobOffer[];

  // Categories
  job_categories?: any[];

  // Other
  consultation_threads?: any[];
  consultation_comments?: any[];
  is_mobile?: boolean;
  logged_in_user?: any;
  employer_follow_relationship_id?: number | null;
  toggle_follow_button_is_available?: boolean;
}

async function fetchClientInfo(employerId: number): Promise<string> {
  const url = `https://crowdworks.jp/public/employers/${employerId}`;

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching HTML:', error);
    throw error;
  }
}

function extractClientInfo(htmlContent: string): ExtractedClientInfo {
  // Find the vue-container div and extract the data attribute
  const dataMatch = htmlContent.match(/<div id="vue-container"\s+data="([^"]+)"/);

  if (!dataMatch) {
    throw new Error('Could not find vue-container data attribute');
  }

  // Decode HTML entities and parse JSON
  const encodedData = dataMatch[1];
  const decodedData = encodedData
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#x5C;/g, '\\')
    .replace(/&#x60;/g, '`')
    .replace(/&#x3D;/g, '=');

  const jsonData: VueContainerData = JSON.parse(decodedData);

  // Extract all possible fields
  const employer = jsonData.public_employer_page_json.employer_user;
  const profile = jsonData.employer_profile_json.employer_user;
  const profileSummary = jsonData.employer_profile_summary_json;
  const feedback = profileSummary.feedback;

  const clientInfo: ExtractedClientInfo = {
    // Basic Info
    client_id: employer.id,
    display_name: employer.display_name,
    profile_image: profile.profile_image_src,
    last_accessed: profile.last_accessed_at,

    // Verification & Status
    is_certified: employer.is_certified_employer || false,
    identity_verified: profile.identity_verified,
    is_official_account: profile.is_official_account,
    is_employer_rule_check_succeeded: profile.is_employer_rule_check_succeeded,

    // Location & Company
    location: profile.prefecture_name,
    company_description: profileSummary.company_profile?.description,
    company_url: profileSummary.company_profile?.url,

    // Dates
    created_at: profile.created_at,

    // Performance Metrics
    job_offer_achievement_count: profile.job_offer_achievement_count,
    project_completion_rate: profile.project_finished_data?.rate,
    total_acceptance_count: profile.project_finished_data?.total_acceptance_count,
    total_finished_count: profile.project_finished_data?.total_finished_count,

    // Ratings & Feedback
    average_rating: feedback?.total_rating?.average_score,
    total_ratings: feedback?.total_rating?.evaluation_count,
    rating_breakdown: feedback?.total_rating?.rating_item_scores,
    recent_ratings: feedback?.user_ratings,

    // Job Offers
    all_job_offers: profileSummary.job_offers,
    active_job_offers: profileSummary.job_offers?.filter(job => job.is_active),
    inactive_job_offers: profileSummary.job_offers?.filter(job => !job.is_active),
    contracted_job_offers: profileSummary.job_offers?.filter(job => job.contracted),

    // Categories
    job_categories: profileSummary.job_categories,

    // Other
    consultation_threads: profileSummary.consultation_threads,
    consultation_comments: profileSummary.consultation_comments,
    is_mobile: jsonData.is_mobile,
    logged_in_user: jsonData.public_employer_page_json.logged_in_user,
    employer_follow_relationship_id: profile.employer_follow_relationship_id,
    toggle_follow_button_is_available: jsonData.employer_profile_json.toggle_follow_button_is_available,
  };

  return clientInfo;
}

export const getClientInfo = async (clientId: number): Promise<ExtractedClientInfo | null> => {
  try {
    const htmlContent = await fetchClientInfo(clientId);

    const clientInfo = extractClientInfo(htmlContent);

    return clientInfo;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}
