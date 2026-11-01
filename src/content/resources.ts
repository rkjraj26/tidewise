import type { Profile, Region } from '../lib/types';

export interface Helpline {
  name: string;
  phone?: string;
  /** digits for tel: links */
  tel?: string;
  sms?: string;
  url?: string;
  hours: string;
  what: string;
}

export interface RegionResources {
  region: Region;
  label: string;
  currency: string;
  emergency: string;
  /** where to get same-day medical advice (withdrawal symptoms) */
  medical: Helpline;
  crisis: Helpline | null;
  lines: Helpline[];
}

/** Numbers verified October 2026. Review every release. */
export const RESOURCES: Record<Region, RegionResources> = {
  US: {
    region: 'US',
    label: 'United States',
    currency: '$',
    emergency: '911',
    medical: { name: 'your doctor or an urgent care clinic', hours: 'Today', what: 'For same-day medical advice about withdrawal. Call 911 for anything severe.' },
    crisis: { name: '988 Suicide & Crisis Lifeline', phone: '988', tel: '988', sms: '988', hours: '24/7', what: 'Call or text if you’re in emotional crisis or thinking about suicide.' },
    lines: [
      { name: 'SAMHSA National Helpline', phone: '1-800-662-4357', tel: '18006624357', hours: '24/7, free, confidential', what: 'Treatment referral and information, in English and Spanish.' },
      { name: 'FindTreatment.gov', url: 'https://findtreatment.gov', hours: 'Online', what: 'Search licensed treatment near you.' },
      { name: 'NIAAA Alcohol Treatment Navigator', url: 'https://alcoholtreatment.niaaa.nih.gov', hours: 'Online', what: 'How to find quality, evidence-based alcohol treatment.' },
    ],
  },
  UK: {
    region: 'UK',
    label: 'United Kingdom',
    currency: '£',
    emergency: '999',
    medical: { name: 'NHS 111', phone: '111', tel: '111', hours: '24/7', what: 'Urgent medical advice, including about withdrawal.' },
    crisis: { name: 'Samaritans', phone: '116 123', tel: '116123', hours: '24/7, free', what: 'Talk about anything, any time.' },
    lines: [
      { name: 'Drinkline (England)', phone: '0300 123 1110', tel: '03001231110', hours: 'Weekdays 9am–8pm, weekends 11am–4pm', what: 'Free, confidential advice about your drinking.' },
      { name: 'Drinkline Scotland', phone: '0800 7314 314', tel: '08007314314', hours: 'See website for hours', what: 'Alcohol advice for people in Scotland.' },
      { name: 'NHS 111', phone: '111', tel: '111', hours: '24/7', what: 'Urgent medical advice that isn’t an emergency.' },
    ],
  },
  IE: {
    region: 'IE',
    label: 'Ireland',
    currency: '€',
    emergency: '112',
    medical: { name: 'your GP or GP out-of-hours service', hours: 'Today', what: 'For same-day medical advice about withdrawal. Call 112 or 999 for anything severe.' },
    crisis: { name: 'Samaritans', phone: '116 123', tel: '116123', hours: '24/7, free', what: 'Talk about anything, any time.' },
    lines: [
      { name: 'HSE Drugs and Alcohol Helpline', phone: '1800 459 459', tel: '1800459459', hours: 'Mon–Fri 9:30am–5:30pm', what: 'Free, confidential support and referral.' },
    ],
  },
  CA: {
    region: 'CA',
    label: 'Canada',
    currency: '$',
    emergency: '911',
    medical: { name: '811 health advice line', phone: '811', tel: '811', hours: '24/7 in most provinces', what: 'Talk to a nurse about withdrawal symptoms.' },
    crisis: { name: '988 Suicide Crisis Helpline', phone: '988', tel: '988', sms: '988', hours: '24/7', what: 'Call or text if you’re in crisis or thinking about suicide.' },
    lines: [
      { name: 'Health Canada: Get help with substance use', url: 'https://www.canada.ca/en/health-canada/services/substance-use/get-help/get-help-problematic-substance-use.html', hours: 'Online', what: 'Provincial and territorial helplines and services.' },
      { name: 'BC Alcohol & Drug Information and Referral', phone: '1-800-663-1441', tel: '18006631441', hours: '24/7', what: 'For people in British Columbia.' },
      { name: 'Alberta Addiction Helpline', phone: '1-866-332-2322', tel: '18663322322', hours: '24/7', what: 'For people in Alberta.' },
    ],
  },
  AU: {
    region: 'AU',
    label: 'Australia',
    currency: '$',
    emergency: '000',
    medical: { name: 'healthdirect', phone: '1800 022 222', tel: '1800022222', hours: '24/7', what: 'Talk to a registered nurse about withdrawal symptoms.' },
    crisis: { name: 'Lifeline', phone: '13 11 14', tel: '131114', hours: '24/7', what: 'Crisis support and suicide prevention.' },
    lines: [
      { name: 'National Alcohol and Other Drug Hotline', phone: '1800 250 015', tel: '1800250015', hours: '24/7, free, confidential', what: 'Connects you to the alcohol and drug service in your state.' },
    ],
  },
  NZ: {
    region: 'NZ',
    label: 'New Zealand',
    currency: '$',
    emergency: '111',
    medical: { name: 'Healthline', phone: '0800 611 116', tel: '0800611116', hours: '24/7, free', what: 'Talk to a nurse about withdrawal symptoms.' },
    crisis: { name: 'Need to talk? 1737', phone: '1737', tel: '1737', sms: '1737', hours: '24/7, free', what: 'Call or text a trained counsellor.' },
    lines: [
      { name: 'Alcohol Drug Helpline', phone: '0800 787 797', tel: '0800787797', sms: '8681', hours: '24/7, free, confidential', what: 'Talk to trained addiction counsellors, or text 8681.' },
    ],
  },
  IN: {
    region: 'IN',
    label: 'India',
    currency: '₹',
    emergency: '112',
    medical: { name: 'your doctor or nearest hospital', hours: 'Today', what: 'For same-day medical advice about withdrawal. Call 112 for anything severe.' },
    crisis: { name: 'Tele-MANAS', phone: '14416', tel: '14416', hours: '24/7, free, many languages', what: 'National mental health helpline (also 1-800-891-4416).' },
    lines: [
      { name: 'National De-addiction Helpline', phone: '14446', tel: '14446', hours: '24/7, toll-free', what: 'Counselling and referral for alcohol and drug dependence (Ministry of Social Justice).' },
    ],
  },
  OTHER: {
    region: 'OTHER',
    label: 'Other country',
    currency: '$',
    emergency: '112',
    medical: { name: 'a local doctor or hospital', hours: 'Today', what: 'For same-day medical advice about withdrawal.' },
    crisis: { name: 'Find A Helpline', url: 'https://findahelpline.com', hours: 'Online', what: 'Free, verified crisis lines in over 130 countries.' },
    lines: [
      { name: 'Find A Helpline', url: 'https://findahelpline.com', hours: 'Online', what: 'Free, verified helplines in over 130 countries.' },
    ],
  },
};

/** Region resources with the user's own emergency number applied, if they set one. */
export function resourcesFor(profile: Pick<Profile, 'region' | 'emergencyNumber'>): RegionResources {
  const base = RESOURCES[profile.region];
  const own = profile.emergencyNumber?.replace(/[^\d+]/g, '');
  return own ? { ...base, emergency: own } : base;
}

export const REGIONS: Region[] = ['US', 'UK', 'IE', 'CA', 'AU', 'NZ', 'IN', 'OTHER'];

export const MUTUAL_HELP: { name: string; url: string; what: string }[] = [
  { name: 'SMART Recovery', url: 'https://smartrecovery.org', what: 'Science-based, self-empowering meetings (online and in person).' },
  { name: 'Alcoholics Anonymous', url: 'https://www.aa.org', what: '12-step fellowship with meetings worldwide, around the clock online.' },
  { name: 'Recovery Dharma', url: 'https://recoverydharma.org', what: 'Peer support using meditation and Buddhist principles.' },
  { name: 'LifeRing Secular Recovery', url: 'https://lifering.org', what: 'Secular, abstinence-based peer support.' },
  { name: 'Women for Sobriety', url: 'https://womenforsobriety.org', what: 'Peer support for women.' },
  { name: 'Al-Anon', url: 'https://al-anon.org', what: 'Support for families and friends of people who drink.' },
];
