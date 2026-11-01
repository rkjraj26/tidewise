/** Shared content: triggers, reasons, thinking traps, scripts, prompts, prep checklist, timeline. */

export const TRIGGERS: { id: string; label: string }[] = [
  { id: 'stress', label: 'Stress' },
  { id: 'anxious', label: 'Anxious' },
  { id: 'low', label: 'Low / sad' },
  { id: 'angry', label: 'Angry' },
  { id: 'lonely', label: 'Lonely' },
  { id: 'bored', label: 'Bored' },
  { id: 'tired', label: 'Tired' },
  { id: 'hungry', label: 'Hungry' },
  { id: 'celebrate', label: 'Celebrating' },
  { id: 'people', label: 'People drinking around me' },
  { id: 'place', label: 'A place (bar, shop, home)' },
  { id: 'time', label: 'Time of day / habit' },
  { id: 'conflict', label: 'Argument or conflict' },
  { id: 'pain', label: 'Physical pain' },
  { id: 'body', label: 'Shaky / unwell' },
];

export const TRIGGER_LABELS: Record<string, string> = Object.fromEntries(TRIGGERS.map((t) => [t.id, t.label]));

export const HALT = [
  { id: 'hungry', label: 'Hungry', fix: 'Eat something now — low blood sugar feels a lot like a craving.' },
  { id: 'angry', label: 'Angry', fix: 'Move your body, write it out, or step away for 10 minutes before you respond.' },
  { id: 'lonely', label: 'Lonely', fix: 'Message or call one person. Connection is medicine.' },
  { id: 'tired', label: 'Tired', fix: 'Rest. An early night protects tomorrow more than anything else.' },
];

export const REASON_SUGGESTIONS = [
  'Wake up clear-headed',
  'Better sleep',
  'Be present for my kids / family',
  'Protect my liver and heart',
  'Save money',
  'Stop the anxiety and shame',
  'Be someone people can rely on',
  'Feel proud of myself',
  'Lose weight / feel fitter',
  'Keep my job / do better at work',
  'Repair my relationship',
  'Stop hiding how much I drink',
  'Think clearly and remember things',
  'Live longer',
];

export interface ThinkingTrap {
  id: string;
  name: string;
  description: string;
}

export const THINKING_TRAPS: ThinkingTrap[] = [
  { id: 'permission', name: 'Permission-giving', description: 'Finding a reason that makes drinking OK “just this once”.' },
  { id: 'allornothing', name: 'All-or-nothing', description: 'Seeing things as total success or total failure.' },
  { id: 'minimising', name: 'Minimising', description: 'Shrinking the harm: “it’s not that bad”.' },
  { id: 'fortune', name: 'Fortune-telling', description: 'Predicting the worst: “I’ll never cope / it’ll never stop”.' },
  { id: 'emotional', name: 'Emotional reasoning', description: 'Treating a feeling as a fact: “I feel I need it, so I do”.' },
  { id: 'romancing', name: 'Romancing the drink', description: 'Remembering the first glass, forgetting the morning after.' },
];

export interface ThoughtCard {
  thought: string;
  trap: string;
  reframe: string;
}

export const THOUGHT_CARDS: ThoughtCard[] = [
  { thought: 'I deserve a drink.', trap: 'permission', reframe: 'I deserve to feel good tomorrow too. What would be a real reward right now?' },
  { thought: 'Just one won’t hurt.', trap: 'permission', reframe: 'When I’ve really wanted a drink, how often has it stopped at one? One is usually the start, not the end.' },
  { thought: 'I’ve had a terrible day — I need it.', trap: 'emotional', reframe: 'Hard days are when alcohol backfires most. I need relief — I can pick a kind that doesn’t cost me tomorrow.' },
  { thought: 'I can’t sleep without it.', trap: 'fortune', reframe: 'Alcohol is part of why my sleep is broken. It will be rough for a bit, then better than before.' },
  { thought: 'I’ll stop properly on Monday.', trap: 'permission', reframe: 'Monday never feels easier. Riding out this one urge is starting.' },
  { thought: 'I’ve slipped, so today’s ruined anyway.', trap: 'allornothing', reframe: 'A slip is one moment, not the whole day. Stopping now still counts — every drink not drunk matters.' },
  { thought: 'Nobody will know.', trap: 'permission', reframe: 'I will know. This is about me and the life I want, not about anyone watching.' },
  { thought: 'I’m not as bad as other people.', trap: 'minimising', reframe: 'Comparing doesn’t change what alcohol is doing to me. I get to decide what I want for my life.' },
  { thought: 'It’s a special occasion.', trap: 'permission', reframe: 'There’s always another occasion. I can celebrate fully — and remember it.' },
  { thought: 'Life will be boring without it.', trap: 'fortune', reframe: 'The first weeks can feel flat while my brain recalibrates. That lifts — and I get my evenings and mornings back.' },
  { thought: 'This craving will never stop.', trap: 'fortune', reframe: 'Cravings peak and pass, usually within 15–30 minutes. I’ve ridden them before.' },
  { thought: 'I’ve proven I can stop, so I can control it now.', trap: 'minimising', reframe: 'Stopping showed my strength. Control was always the hard part. Why risk what I’ve built?' },
  { thought: 'A cold beer on a hot day would be perfect.', trap: 'romancing', reframe: 'Play the tape forward: the first sip, then the second drink, the evening, the morning after. Is it still perfect?' },
];

export const REFUSAL_SCRIPTS: { situation: string; lines: string[] }[] = [
  { situation: 'Quick and easy', lines: ['No thanks, I’m not drinking.', 'I’m good with this, thanks.', 'Just a soda water with lime, please.'] },
  { situation: 'If they ask why', lines: ['I feel so much better without it.', 'I’m taking a break — best decision I’ve made.', 'I’m driving tonight.', 'I’ve got an early start.'] },
  { situation: 'If they push', lines: ['I said no thanks — please don’t ask again.', 'It matters to me. I’d really appreciate your support.', '(Broken record) No thanks. … No thanks. … No thanks.'] },
  { situation: 'To change the subject', lines: ['No thanks — hey, how did that thing go last week?', 'I’m good. Did you see …?'] },
];

export const REFUSAL_TIPS = [
  'Say no quickly and clearly — hesitation invites persuasion.',
  'Make eye contact and keep your voice relaxed.',
  'Get your own drink first so your hands are full.',
  'You don’t owe anyone a reason.',
  'If someone keeps pushing, leaving is always an option.',
];

export const SURF_PROMPTS = [
  'Notice where you feel the urge in your body. Your throat? Chest? Hands? Just notice it.',
  'Breathe into that spot. You don’t have to fight the urge or obey it.',
  'Urges rise like waves. They build, peak, and fall.',
  'Rate it in your head right now. Is it the same as a minute ago? Higher? Lower?',
  'Picture yourself on a surfboard, riding the wave instead of being pulled under.',
  'This is your brain expecting a drink. When no drink comes, the habit loses power.',
  'You are not your urge. You can notice it and still choose.',
  'If thoughts like “just one” show up, label them: “that’s the craving talking”.',
  'Keep breathing. The wave is passing, even if it doesn’t feel like it yet.',
  'Each wave you ride out tends to make the next one easier.',
];

export const TAPE_FORWARD = [
  { label: 'The first drink', prompt: 'Relief — for a few minutes. What happens next?' },
  { label: 'Two hours later', prompt: 'How many drinks? Where are you? What have you said or done?' },
  { label: 'Tonight', prompt: 'How do you fall asleep? Do you remember the evening?' },
  { label: 'Tomorrow morning', prompt: 'How does your body feel? Your mood? Who do you have to face?' },
  { label: 'Next week', prompt: 'Did it stay at one night? What did it cost you?' },
  { label: 'Now picture riding it out', prompt: 'Tomorrow morning, clear-headed. How does that feel?' },
];

export const DISTRACTIONS = [
  'Drink a big glass of cold water or a fizzy drink',
  'Eat something — a snack, toast, fruit',
  'Go for a 10-minute walk',
  'Take a hot or cold shower',
  'Call or text someone',
  'Put on a playlist and tidy one room',
  'Play a game on your phone (not near a shop or bar)',
  'Do 20 squats or push-ups',
  'Watch one episode of something funny',
  'Make tea and sit outside',
];

export const PREP_CHECKLIST: { id: string; label: string; detail: string }[] = [
  { id: 'clear', label: 'Clear alcohol out of your home', detail: 'Pour it away or give it away. Distance is your friend in a craving.' },
  { id: 'tell', label: 'Tell one person you trust', detail: 'Add them in Support so they’re one tap away.' },
  { id: 'doctor', label: 'Talk to a doctor (essential if you drink daily)', detail: 'Use the doctor-prep sheet. Ask about safe withdrawal, thiamine (vitamin B1) and craving medication.' },
  { id: 'stock', label: 'Stock alcohol-free drinks and easy food', detail: 'Something cold and fizzy, snacks, ready meals for the first few days.' },
  { id: 'plan', label: 'Write if-then plans for your riskiest times', detail: 'Evenings, weekends, after work, after arguments.' },
  { id: 'days', label: 'Plan the first three days', detail: 'Keep them calm, low-stress, and full. Avoid pubs, parties and being alone with time to kill.' },
];

/** Hedged, general, evidence-informed. Not a promise. */
export const HEALTH_TIMELINE: { day: number; title: string; text: string }[] = [
  { day: 1, title: 'Your body starts rebalancing', text: 'After heavy drinking, alcohol can take many hours — sometimes into the next day — to clear. If you’re dependent, withdrawal can begin 6–24 hours after your last drink, sometimes while alcohol is still in your blood. Keep the red flags in mind.' },
  { day: 3, title: 'Often the peak', text: 'For most people, withdrawal peaks between day 1 and day 3, then eases. Severe withdrawal (DTs) can still start up to day 4–5 — keep watching for red flags. Hydrate, eat, rest.' },
  { day: 7, title: 'Sleep starts to recover', text: 'Acute withdrawal has usually settled. Sleep may still be patchy, but deep and dream sleep begin returning.' },
  { day: 14, title: 'Clearer head, calmer gut', text: 'Many people notice better sleep, more energy and less acid reflux. Your stomach lining is healing.' },
  { day: 30, title: 'Measurable health gains', text: 'In research on a month off alcohol, people saw lower blood pressure, better insulin sensitivity, and weight loss. Liver fat can start falling within weeks.' },
  { day: 60, title: 'Mood and anxiety improving', text: 'Many people report steadier mood, less anxiety, better skin, and sharper thinking.' },
  { day: 90, title: 'Brain recovery underway', text: 'Brain scans show some recovery in brain volume and function over the first months of not drinking. Cravings are usually less frequent and less intense.' },
  { day: 180, title: 'New normal', text: 'Liver tests often return to normal if there is no permanent damage. Your alcohol-free routines are becoming automatic.' },
  { day: 365, title: 'A year of lower risk', text: 'Your risk of relapse is much lower than at the start, and longer-term risks — such as several cancers, heart disease and stroke — keep falling with time.' },
];
