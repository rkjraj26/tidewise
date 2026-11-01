export type Region = 'US' | 'UK' | 'IE' | 'CA' | 'AU' | 'NZ' | 'IN' | 'OTHER';

export type MotiveId =
  | 'stress'
  | 'anxiety'
  | 'sleep'
  | 'numb'
  | 'low'
  | 'social'
  | 'fitin'
  | 'boredom'
  | 'lonely'
  | 'reward'
  | 'habit'
  | 'withdrawal'
  | 'pain';

export type Approach = 'stop' | 'medical' | 'stepdown';

export type RiskLevel = 'low' | 'moderate' | 'high';

export interface Baseline {
  /** 0–7 */
  drinkingDaysPerWeek: number;
  /** standard drinks on a typical drinking day */
  drinksPerDrinkingDay: number;
  /** money spent on alcohol per week, in local currency */
  spendPerWeek: number;
}

export interface SafetyAnswers {
  dailyDrinking: boolean;
  withdrawalSymptoms: boolean;
  pastSeizureOrDTs: boolean;
  pastMedicalDetox: boolean;
  sedatives: boolean;
  medicalConditions: boolean;
  /** asked separately — pregnancy changes the plan */
  pregnant?: boolean;
}

export interface SafetyResult {
  level: RiskLevel;
  reasons: string[];
  gramsPerDrinkingDay: number;
  gramsPerDayAverage: number;
}

export interface AuditRecord {
  answers: number[];
  score: number;
  takenAt: string;
}

export interface Plan {
  approach: Approach;
  /** YYYY-MM-DD — first alcohol-free day (or day the step-down reaches zero) */
  quitDate: string;
  /** YYYY-MM-DD — day the plan was created (start of step-down) */
  startedOn: string;
  /** user confirmed they are under medical guidance */
  medicalGuidance: boolean;
  /** step-down only: days the plan was paused ("hold this step") */
  holdDays?: number;
}

export interface Profile {
  name: string;
  region: Region;
  currency: string;
  motives: MotiveId[];
  reasons: string[];
  futureLetter: string;
  baseline: Baseline;
  audit: AuditRecord | null;
  safety: (SafetyAnswers & { level: RiskLevel; assessedAt: string }) | null;
  plan: Plan;
  /** user-entered local emergency number (overrides the region default) */
  emergencyNumber?: string;
}

export interface DayLog {
  date: string;
  drank: boolean;
  drinks: number;
  mood?: number; // 1–5
  craving?: number; // 0–10
  sleep?: number; // 1–5
  halt?: string[];
  note?: string;
  updatedAt: string;
}

export type UrgeOutcome = 'rode' | 'drank';

export interface UrgeLog {
  id: string;
  at: string; // ISO timestamp
  before: number;
  after: number | null;
  triggers: string[];
  durationSec: number;
  outcome: UrgeOutcome;
}

export interface LapseLog {
  id: string;
  at: string;
  date: string;
  drinks: number;
  situation: string;
  feeling: string;
  thought: string;
  nextTime: string;
}

export interface IfThenPlan {
  id: string;
  ifText: string;
  thenText: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
}

export interface ThoughtRecord {
  id: string;
  at: string;
  thought: string;
  trapId: string;
  balanced: string;
}

export type WithdrawalLevel = 'ok' | 'selfcare' | 'urgent' | 'emergency' | 'crisis';

export interface WithdrawalCheck {
  id: string;
  at: string;
  symptoms: string[];
  redFlags: string[];
  level: WithdrawalLevel;
}

export interface DecisionalBalance {
  drinkingGood: string;
  drinkingBad: string;
  stoppingGood: string;
  stoppingHard: string;
  updatedAt: string;
}

export interface Settings {
  theme: 'system' | 'light' | 'dark';
  pinHash: string | null;
  pinSalt: string | null;
  prepDone: string[];
}

export interface AppData {
  version: 1;
  createdAt: string;
  profile: Profile | null;
  days: Record<string, DayLog>;
  urges: UrgeLog[];
  lapses: LapseLog[];
  plans: IfThenPlan[];
  contacts: Contact[];
  thoughts: ThoughtRecord[];
  withdrawal: WithdrawalCheck[];
  decisional: DecisionalBalance | null;
  settings: Settings;
}
