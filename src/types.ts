export interface Job {
  id: number;
  public_id: string;
  title: string;
  description: string;
  role: string;
  experience: string;
  hard_skills: string;
  soft_skills: string;
  certifications: string;
  created_at: string;
  candidate_count?: number;
  top_match_score?: number;
}

export interface Candidate {
  id: number;
  job_id: number;
  name: string;
  email: string;
  profile_url: string;
  twitter_url: string;
  profile_text: string;
  skills: string;
  experience: string;
  match_score: number;
  match_reasoning: string;
  behavioral_summary: string;
  created_at: string;
  submission_status?: string;
}

export interface InterviewReport {
  id: number;
  candidate_id: number;
  job_id: number;
  notes: string;
  strengths: string;
  weaknesses: string;
  recommendation: string;
  created_at: string;
}

export interface SearchQueries {
  linkedin_boolean: string;
  naukri_keywords: string;
  indeed_boolean: string;
  dice_boolean: string;
  careerbuilder_boolean: string;
  monster_boolean: string;
  xray_linkedin: string;
  xray_naukri: string;
  xray_indeed: string;
  xray_dice: string;
  xray_careerbuilder: string;
  xray_monster: string;
  found?: boolean;
}

export interface AppConfig {
  github: boolean;
  google: boolean;
}

export interface MarketIntel {
  salary: { india: string; us: string; global_note: string };
  demand: string;
  training: Array<{ name: string; provider: string; type: string; location: string; url: string }>;
}

export interface CandidateSubmission {
  id: number;
  candidate_id: number;
  job_id: number;
  user_id: string;
  client_name: string;
  status: 'sourced' | 'screened' | 'submitted' | 'interview' | 'offered' | 'joined' | 'rejected';
  submitted_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  role: 'recruiter' | 'candidate';
  full_name: string;
  created_at: string;
}

export type SubmissionStatus = CandidateSubmission['status'];

export const SUBMISSION_STATUSES: SubmissionStatus[] = [
  'sourced', 'screened', 'submitted', 'interview', 'offered', 'joined', 'rejected',
];

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  sourced: 'Sourced',
  screened: 'Screened',
  submitted: 'Submitted',
  interview: 'Interview',
  offered: 'Offered',
  joined: 'Joined',
  rejected: 'Rejected',
};

export const SUBMISSION_STATUS_COLORS: Record<SubmissionStatus, string> = {
  sourced: 'badge',
  screened: 'badge badge-blue',
  submitted: 'badge badge-purple',
  interview: 'badge badge-yellow',
  offered: 'badge badge-green',
  joined: 'badge badge-green',
  rejected: 'badge badge-red',
};
