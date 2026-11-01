export interface Lesson {
  id: string;
  title: string;
  minutes: number;
  summary: string;
  sections: { heading?: string; text: string }[];
  takeaway: string;
  sources: string[];
}

export const LESSONS: Lesson[] = [
  {
    id: 'why-hard',
    title: 'Why stopping is hard — and not a character flaw',
    minutes: 2,
    summary: 'What alcohol does to your brain’s reward and stress systems.',
    sections: [
      { text: 'Alcohol gives your brain a fast hit of reward (dopamine) and calm (GABA). Repeat that often enough and your brain adapts: it makes less of its own calm, and turns up its stress systems to balance the alcohol out.' },
      { heading: 'From “feeling good” to “not feeling bad”', text: 'Over time many people drink less for pleasure and more to stop feeling bad — stressed, anxious, flat, unable to sleep, or shaky. Scientists call this negative reinforcement. It’s why willpower alone often isn’t enough: you’re fighting your own biology.' },
      { heading: 'The good news', text: 'The brain is plastic. Once alcohol stops, the stress and reward systems gradually rebalance. The first weeks are the hardest; it gets easier with time.' },
    ],
    takeaway: 'Alcohol use disorder is a health condition that changes the brain. It’s treatable — and you are not weak for finding this hard.',
    sources: ['NIAAA: Neuroscience of alcohol use disorder', 'Koob & Volkow, Lancet Psychiatry 2016'],
  },
  {
    id: 'waves',
    title: 'Cravings are waves',
    minutes: 2,
    summary: 'Why urges always pass, and how riding them rewires the habit.',
    sections: [
      { text: 'A craving is your brain predicting a drink because of a cue: a time, place, feeling, person or smell. It feels urgent, as if it will keep growing until you give in. It won’t. Cravings rise, peak and fall — usually within 15 to 30 minutes.' },
      { heading: 'Urge surfing', text: 'Instead of fighting the urge or obeying it, you notice it with curiosity — where it sits in your body, how strong it is, how it changes — and breathe while it passes. This skill comes from Mindfulness-Based Relapse Prevention, which has reduced heavy drinking in clinical trials.' },
      { heading: 'Why each wave matters', text: 'Every time a cue fires and no drink follows, the link between cue and drink weakens. Riding out cravings is literally how the habit unlearns itself. Tidewise logs your urge before and after so you can see this for yourself.' },
    ],
    takeaway: 'You don’t have to win against a craving. You only have to outlast it.',
    sources: ['Bowen et al., JAMA Psychiatry 2014', 'Marlatt & Gordon, Relapse Prevention'],
  },
  {
    id: 'withdrawal',
    title: 'Withdrawal: what to expect, and when it’s dangerous',
    minutes: 3,
    summary: 'Timeline, normal symptoms, and the red flags that mean emergency.',
    sections: [
      { text: 'If you’ve been drinking heavily or daily, your body has adapted to alcohol being there. When it stops, your nervous system goes into overdrive. Symptoms usually start 6–24 hours after the last drink, peak around days 1–3, and settle within about a week.' },
      { heading: 'Common symptoms', text: 'Shaky hands, sweating, nausea, anxiety, fast heartbeat, headache, poor sleep and irritability.' },
      { heading: 'Red flags — call emergency services', text: 'A seizure or passing out; seeing, hearing or feeling things that aren’t there; confusion about where you are; being very unsteady or having double vision; chest pain; fever with heavy sweating and shaking; vomiting blood or black stools; being unable to keep fluids down. Severe withdrawal (delirium tremens) can be life-threatening and usually appears 2–4 days after stopping.' },
      { heading: 'The safer way', text: 'If you drink daily, drink in the morning, or have had bad withdrawal before, talk to a doctor before stopping. Medically supported withdrawal is safer and far more comfortable — at home with daily check-ins for some people, in a hospital or detox unit for others (for example after past seizures or DTs, or at very high daily amounts).' },
      { heading: 'Protect your brain', text: 'If you drink heavily, ask a pharmacist or doctor about thiamine (vitamin B1) before you stop. It helps prevent Wernicke’s encephalopathy — sudden confusion, unsteadiness and eye problems that can cause lasting brain damage. Those signs are an emergency.' },
    ],
    takeaway: 'Stopping is the goal; stopping safely is the plan. If in doubt, get medical advice first.',
    sources: ['NICE CG115 / CG100', 'ASAM Clinical Practice Guideline on Alcohol Withdrawal Management (2020)'],
  },
  {
    id: 'meds',
    title: 'Medicines that help — and why almost no one is offered them',
    minutes: 3,
    summary: 'Naltrexone, acamprosate and more: how to ask.',
    sections: [
      { text: 'Effective medications for alcohol use disorder have existed for decades, yet in the US only about 2–3% of people with the condition receive one. Many doctors don’t bring them up. You can.' },
      { heading: 'Naltrexone', text: 'Reduces cravings and the “reward” of drinking, lowering the risk of returning to heavy drinking. It can be started while you are still drinking. Usually a daily tablet (a monthly injection exists in some countries). You need to be off all opioids for 7–10 days first; while you take it, opioid painkillers won’t work — tell any doctor or carry a card. After stopping it, your opioid tolerance is lower.' },
      { heading: 'Acamprosate', text: 'Helps people stay stopped after they have quit, by calming the brain’s overactive state. Taken three times a day; your kidneys need to be working well.' },
      { heading: 'Disulfiram', text: 'Causes a severe, sometimes dangerous reaction (flushing, vomiting, racing heart, low blood pressure) if you have any alcohol — including some mouthwashes, sauces, hand sanitisers and “alcohol-free” beers — for up to 2 weeks after your last tablet. Only start it with a doctor, never while drunk, and at least a day after your last drink. Not suitable with some heart conditions. Works best with someone supporting you.' },
      { heading: 'Others', text: 'Doctors may also consider medicines such as topiramate, gabapentin, baclofen or nalmefene, depending on your health and country.' },
      { heading: 'How to ask', text: '“I’m trying to stop drinking. Could a medication like naltrexone or acamprosate help me?” The doctor-prep sheet in Support writes this for you.' },
    ],
    takeaway: 'Medication plus support works better than willpower alone. Asking is a strength, not a failure.',
    sources: ['SAMHSA NSDUH 2024', 'Jonas et al., JAMA 2014 (meta-analysis)', 'APA Practice Guideline for AUD (2018)'],
  },
  {
    id: 'slips',
    title: 'Slips happen. Keep them small.',
    minutes: 2,
    summary: 'Why one drink turns into a week — and how to stop that happening.',
    sections: [
      { text: 'Returning to drinking is common — about as common as symptoms returning in other long-term health conditions like asthma or high blood pressure. Most people who stop for good had slips along the way.' },
      { heading: 'The “what the hell” effect', text: 'After a slip, the thought “I’ve blown it anyway” often turns one drink into a binge. Psychologists call this the abstinence violation effect. Shame fuels it.' },
      { heading: 'What works instead', text: 'Stop as soon as you can. Be kind to yourself. Get curious: what happened just before? What were you feeling and thinking? What will you do differently next time? Then turn the answer into a plan.' },
      { heading: 'Your progress is not erased', text: 'Tidewise keeps every alcohol-free day you’ve earned. A slip is one day. It does not undo the others.' },
    ],
    takeaway: 'A slip is information, not a verdict. The faster you get curious, the smaller it stays.',
    sources: ['Marlatt & Donovan, Relapse Prevention (2005)', 'NIDA: Treatment and recovery'],
  },
  {
    id: 'sleep',
    title: 'Sleeping without alcohol',
    minutes: 2,
    summary: 'Why sleep gets worse before it gets better.',
    sections: [
      { text: 'Alcohol helps you fall asleep but disrupts the second half of the night and suppresses REM (dream) sleep. When you stop, your brain catches up on REM — so dreams can be vivid, including drinking dreams. That’s normal and a sign of healing.' },
      { heading: 'What helps', text: 'Keep a fixed wake-up time, get daylight in the morning, cut caffeine after midday, wind down for 30 minutes, and get up if you can’t sleep after about 20 minutes.' },
      { heading: 'When to get help', text: 'If sleep is still poor after a few weeks, ask about CBT for insomnia (CBT-I). Avoid sleeping pills unless a doctor who knows about your drinking prescribes them.' },
    ],
    takeaway: 'Rough sleep in the first weeks is temporary. Better sleep is one of the biggest rewards of stopping.',
    sources: ['Colrain et al., Handbook of Clinical Neurology 2014', 'AASM guideline on CBT-I'],
  },
  {
    id: 'mood',
    title: 'Mood, anxiety and the first months',
    minutes: 2,
    summary: 'The flat patch, and why it lifts.',
    sections: [
      { text: 'Many people feel flat, irritable or anxious in the first weeks. Your brain’s reward system is recalibrating after being driven by alcohol. For many, mood and anxiety improve clearly within a month.' },
      { heading: 'Lingering symptoms', text: 'Some people notice ups and downs in sleep, mood, energy and concentration for a few months. These usually ease with time, routine, exercise and support.' },
      { heading: 'When it’s more than that', text: 'If low mood or anxiety continues beyond a few weeks, it may be a separate condition that deserves treatment. Treating it lowers relapse risk. If you ever have thoughts of suicide, call a crisis line or emergency services immediately.' },
    ],
    takeaway: 'Feeling flat early on is part of healing, not a sign that life without alcohol is worse.',
    sources: ['NIAAA: Alcohol and mental health', 'Brown & Schuckit, J Stud Alcohol 1988'],
  },
  {
    id: 'help',
    title: 'Kinds of help — from apps to rehab',
    minutes: 3,
    summary: 'Therapy, medication, groups and treatment programs.',
    sections: [
      { heading: 'Talking therapies', text: 'CBT (changing thoughts and habits), motivational interviewing (resolving mixed feelings), the Community Reinforcement Approach (building a life that’s more rewarding than drinking) and contingency management (rewards for staying stopped) all have strong evidence.' },
      { heading: 'Mutual-help groups', text: 'Free peer groups such as AA, SMART Recovery, Recovery Dharma and LifeRing meet in person and online. A Cochrane review found AA-style programs helped more people stay abstinent than some other treatments.' },
      { heading: 'Treatment programs', text: 'From weekly outpatient sessions to intensive day programs and residential rehab. A doctor or helpline can help you find the right level.' },
      { heading: 'Mix and match', text: 'Most people do best combining several: medication + therapy + a group + an app like this one.' },
    ],
    takeaway: 'There is no single right way to stop. More support usually means better odds.',
    sources: ['Kelly et al., Cochrane Review 2020', 'NIAAA Alcohol Treatment Navigator'],
  },
  {
    id: 'people',
    title: 'Telling people you’ve stopped',
    minutes: 2,
    summary: 'What to say, who to tell, and how to handle pressure.',
    sections: [
      { text: 'You don’t owe anyone the full story. Start with the one or two people most likely to support you. Tell them what would help: checking in, not offering you drinks, doing alcohol-free things together.' },
      { heading: 'Pressure', text: 'Some people push because your choice makes them think about their own drinking. Keep it short, repeat yourself, and leave if you need to.' },
      { heading: 'Repair', text: 'If drinking has hurt people close to you, you don’t have to fix everything now. Steady, alcohol-free days rebuild trust over time.' },
    ],
    takeaway: 'Choose your allies, tell them how to help, and keep your boundary simple.',
    sources: ['Community Reinforcement and Family Training (CRAFT) literature'],
  },
  {
    id: 'body',
    title: 'What heals when you stop',
    minutes: 2,
    summary: 'Liver, heart, brain, sleep, weight — what the evidence shows.',
    sections: [
      { heading: 'Liver', text: 'Fatty liver — the earliest stage of alcohol-related liver disease — can reverse within weeks to months of stopping. Even more advanced damage can stabilise.' },
      { heading: 'Heart and blood pressure', text: 'Blood pressure often falls within weeks in people who drank heavily. Heart rhythm problems linked to drinking become less likely.' },
      { heading: 'Brain', text: 'Studies show the brain begins to recover volume and function within weeks to months of abstinence, especially memory and attention.' },
      { heading: 'Weight, skin, gut', text: 'Fewer empty calories, less bloating and reflux, better hydrated skin.' },
      { heading: 'Long-term', text: 'Alcohol causes at least seven types of cancer. Your risk begins to fall after stopping and keeps falling over the years.' },
    ],
    takeaway: 'The body is remarkably good at healing once alcohol is out of the way. It’s never too late.',
    sources: ['Mehta et al., BMJ Open 2018', 'Roerecke et al., Lancet Public Health 2017', 'WHO/IARC on alcohol and cancer'],
  },
];

export const LESSON_BY_ID: Record<string, Lesson> = Object.fromEntries(LESSONS.map((l) => [l.id, l]));
