/**
 * WHO Alcohol Use Disorders Identification Test (AUDIT).
 * Babor TF et al., WHO 2001. Public-domain screening instrument.
 * Shown as information — never as a diagnosis.
 */

export interface AuditOption {
  label: string;
  score: number;
}

export interface AuditQuestion {
  id: number;
  text: string;
  options: AuditOption[];
}

const FREQ = (labels: string[]): AuditOption[] => labels.map((label, i) => ({ label, score: i }));
const OFTEN = FREQ(['Never', 'Less than monthly', 'Monthly', 'Weekly', 'Daily or almost daily']);
const INJURY: AuditOption[] = [
  { label: 'No', score: 0 },
  { label: 'Yes, but not in the last year', score: 2 },
  { label: 'Yes, during the last year', score: 4 },
];

export const AUDIT_QUESTIONS: AuditQuestion[] = [
  {
    id: 1,
    text: 'How often do you have a drink containing alcohol?',
    options: FREQ(['Never', 'Monthly or less', '2–4 times a month', '2–3 times a week', '4 or more times a week']),
  },
  {
    id: 2,
    text: 'How many standard drinks do you have on a typical day when you are drinking?',
    options: FREQ(['1 or 2', '3 or 4', '5 or 6', '7, 8 or 9', '10 or more']),
  },
  { id: 3, text: 'How often do you have six or more drinks on one occasion?', options: OFTEN },
  {
    id: 4,
    text: 'How often during the last year have you found that you were not able to stop drinking once you had started?',
    options: OFTEN,
  },
  {
    id: 5,
    text: 'How often during the last year have you failed to do what was normally expected of you because of drinking?',
    options: OFTEN,
  },
  {
    id: 6,
    text: 'How often during the last year have you needed a first drink in the morning to get yourself going after a heavy drinking session?',
    options: OFTEN,
  },
  { id: 7, text: 'How often during the last year have you had a feeling of guilt or remorse after drinking?', options: OFTEN },
  {
    id: 8,
    text: 'How often during the last year have you been unable to remember what happened the night before because of your drinking?',
    options: OFTEN,
  },
  { id: 9, text: 'Have you or someone else been injured because of your drinking?', options: INJURY },
  {
    id: 10,
    text: 'Has a relative, friend, doctor or other health worker been concerned about your drinking or suggested you cut down?',
    options: INJURY,
  },
];

export function scoreAudit(answers: number[]): number {
  if (answers.length !== AUDIT_QUESTIONS.length) throw new Error('AUDIT needs 10 answers');
  return answers.reduce((sum, a, i) => {
    const allowed = AUDIT_QUESTIONS[i].options.map((o) => o.score);
    if (!allowed.includes(a)) throw new Error(`Invalid score ${a} for AUDIT item ${i + 1}`);
    return sum + a;
  }, 0);
}

export type AuditZone = 1 | 2 | 3 | 4;

export interface AuditInterpretation {
  zone: AuditZone;
  title: string;
  message: string;
}

export function interpretAudit(score: number): AuditInterpretation {
  if (score >= 20)
    return {
      zone: 4,
      title: 'Possible dependence',
      message:
        'Scores in this range often mean alcohol dependence. That’s not a judgement — it means stopping deserves a proper plan, and it’s worth talking to a doctor before you stop. You are in the right place to start that plan.',
    };
  if (score >= 16)
    return {
      zone: 3,
      title: 'Higher risk',
      message:
        'Drinking is likely already affecting your health or life. Stopping now can make a big difference, and a doctor or counsellor can make it easier.',
    };
  if (score >= 8)
    return {
      zone: 2,
      title: 'Increasing risk',
      message:
        'Your drinking is raising your risk of harm. This is a great moment to change — it is far easier to stop before alcohol takes more of a hold.',
    };
  return {
    zone: 1,
    title: 'Lower risk',
    message:
      'Your score is in the lower-risk range. If you want to stop anyway, that is a healthy choice and Tidewise will help.',
  };
}
