import type { MotiveId } from '../lib/types';

export interface Tool {
  title: string;
  how: string;
  link?: string; // in-app route
}

export interface Motive {
  id: MotiveId;
  label: string;
  /** How it feels from the inside — in the drinker's own voice. */
  voice: string;
  /** What alcohol actually does for this job, honestly and without lecturing. */
  truth: string;
  tools: Tool[];
}

export const MOTIVES: Motive[] = [
  {
    id: 'stress',
    label: 'Unwind after stress',
    voice: '“It’s the fastest off-switch I know.”',
    truth:
      'Alcohol really does take the edge off — for an hour or so. As it wears off, your nervous system rebounds and stress hormones rise, so tomorrow starts tenser than today. Over months, regular drinking raises your baseline stress and crowds out other ways of coping.',
    tools: [
      { title: 'Build a new off-switch ritual', how: 'At the time you’d usually pour a drink: change clothes, shower, or step outside for 5 minutes. A ritual tells your brain the workday is over — it doesn’t need to be alcohol.' },
      { title: 'Physiological sigh', how: 'Two short inhales through the nose, then one long slow exhale through the mouth. Repeat 3–5 times. One of the quickest ways to lower your body’s stress response.', link: '#/tools/breathe' },
      { title: 'Move for 10 minutes', how: 'A brisk walk or a few flights of stairs burns off stress chemicals and reliably takes the peak off a craving.' },
      { title: 'Swap what’s in the glass', how: 'Something cold, fizzy or bitter in a glass you like: soda water with lime, ginger beer, tonic with a dash of bitters. Your hands and taste buds want the ritual. (If alcohol-free beer or wine makes you want the real thing, skip it. Kombucha and “alcohol-free” beers can contain up to 0.5% alcohol — avoid them if you take disulfiram.)' },
      { title: 'Empty the day onto paper', how: 'Write three lines: what stressed me, one thing I’ll do about it tomorrow, what I’m letting go of tonight.' },
    ],
  },
  {
    id: 'anxiety',
    label: 'Calm anxiety or nerves',
    voice: '“It quiets the noise in my head.”',
    truth:
      'Alcohol boosts your brain’s calming chemistry (GABA) — fast. Your brain fights back by turning its own brakes down, so when alcohol leaves, anxiety returns stronger. That’s “hangxiety”. Many people find their everyday anxiety drops noticeably after a few weeks without alcohol.',
    tools: [
      { title: 'Breathe with a longer exhale', how: 'In for 4, out for 6–8. A long exhale switches on the body’s calming system within a minute or two.', link: '#/tools/breathe' },
      { title: '5-4-3-2-1 grounding', how: 'Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. It pulls your attention out of the spiral and into the room.', link: '#/tools/ground' },
      { title: 'Name it to tame it', how: 'Say it plainly: “This is anxiety. It’s uncomfortable, not dangerous. It will pass.” Labelling a feeling lowers its intensity.' },
      { title: 'Cold water reset', how: 'Splash cold water on your face or hold something cold for 30 seconds. It triggers a reflex that slows your heart rate.' },
      { title: 'Treat the anxiety itself', how: 'Anxiety is very treatable with CBT and, if needed, non-addictive medication. Treating it takes away one of drinking’s biggest jobs.', link: '#/support/doctor' },
    ],
  },
  {
    id: 'sleep',
    label: 'Get to sleep',
    voice: '“I can’t switch off at night without it.”',
    truth:
      'Alcohol knocks you out but breaks up the second half of the night: it suppresses dream (REM) sleep and wakes you early as it wears off, so you wake tired — which makes the next evening harder. Sleep is often rough for the first few weeks after stopping (for some people, a few months), then usually becomes better than it was while drinking.',
    tools: [
      { title: 'Anchor your wake-up time', how: 'Get up at the same time every day, even after a bad night. It’s the single strongest lever for resetting sleep.' },
      { title: 'A 30-minute wind-down', how: 'Dim the lights, put screens away, warm shower, something to read. Your new nightcap is a routine.' },
      { title: 'The 20-minute rule', how: 'If you can’t sleep after about 20 minutes, get up and do something dull in low light, then return when sleepy. Lying there fighting it trains your brain that bed = awake.' },
      { title: 'Cut caffeine after midday', how: 'Many people drink more coffee when they stop drinking alcohol — and then can’t sleep.' },
      { title: 'Ask about CBT for insomnia', how: 'If poor sleep lasts more than a few weeks, CBT-I is the first-choice treatment and works well. Ask your doctor; don’t start sleeping pills without medical advice.' },
    ],
  },
  {
    id: 'numb',
    label: 'Numb painful feelings',
    voice: '“It’s the only time I don’t have to feel it.”',
    truth:
      'Numbing works for a few hours, but pain that’s pushed down doesn’t heal — it waits. Alcohol also lowers mood and can make flashbacks, nightmares and shame worse. Wanting relief makes complete sense. You deserve relief that lasts.',
    tools: [
      { title: 'Let the feeling be a wave', how: 'Feelings, like cravings, rise, peak and pass. Notice where you feel it in your body, breathe into that spot, and stay with it for a few minutes. You can handle more than you think.' },
      { title: 'Soothe your senses', how: 'Warm blanket, a hot drink, a familiar song, a pet, a scent you love. Comfort your body like you would a friend’s.' },
      { title: 'Write it, then close the notebook', how: 'Ten minutes of honest writing about what hurts, then close it and do something gentle. Expressive writing is linked with better mood over time.' },
      { title: 'Reach one safe person', how: 'You don’t have to explain everything. “Rough night — can you talk?” is enough.', link: '#/support' },
      { title: 'Treat the root', how: 'Trauma-focused therapies (such as trauma-focused CBT or EMDR) are effective. A doctor or helpline can point you to them.', link: '#/support' },
    ],
  },
  {
    id: 'low',
    label: 'Lift a low mood',
    voice: '“It gives me a lift when everything feels grey.”',
    truth:
      'Alcohol is a depressant. The lift lasts minutes to an hour; the dip lasts into the next day. Heavy drinking can cause depression by itself, and many people’s mood improves within a few weeks of stopping. If low mood persists, it is very treatable.',
    tools: [
      { title: 'One small good thing', how: 'Pick one thing you used to enjoy and do it for just 10 minutes — even if you don’t feel like it. Action comes before motivation (behavioural activation).' },
      { title: 'Morning daylight', how: 'Get outside within an hour of waking, even for 10 minutes. It helps mood, energy and sleep.' },
      { title: 'Message one person', how: 'Low mood shrinks your world. One message widens it again.', link: '#/support' },
      { title: 'Watch your mood rise', how: 'Log your mood in daily check-ins. Seeing the trend climb is proof that stopping is working.', link: '#/checkin' },
      { title: 'If it’s dark, call now', how: 'If you feel hopeless or have thoughts of ending your life, call a crisis line or emergency services now. You matter.', link: '#/support' },
    ],
  },
  {
    id: 'social',
    label: 'Feel confident with people',
    voice: '“I’m funnier and less awkward after a couple.”',
    truth:
      'Alcohol lowers inhibition, but it also lowers your judgement of how you’re coming across. Real social confidence is a skill — and every alcohol-free event you get through builds it for real, in a way no drink can.',
    tools: [
      { title: 'Always have a drink in hand', how: 'Order an alcohol-free drink first, before anyone offers. A full glass stops most questions.' },
      { title: 'Arrive early, leave early', how: 'The first hour is the friendliest; the last hours are the drunkest. Plan your exit time and your ride before you go.' },
      { title: 'Be curious, not clever', how: 'Ask people about themselves. Curiosity takes the spotlight off you and people love it.' },
      { title: 'Practise your “no”', how: 'Have one short line ready. Rehearse it out loud.', link: '#/tools/refuse' },
      { title: 'Choose activity-based plans', how: 'Coffee, walks, gigs, cinema, sport, classes — events built around doing something, not drinking.' },
    ],
  },
  {
    id: 'fitin',
    label: 'Fit in — everyone drinks',
    voice: '“If I don’t drink, I’ll be the odd one out.”',
    truth:
      'People notice what’s in your glass far less than you fear — they’re busy worrying about themselves. Being the one who doesn’t drink is becoming normal, and the people worth keeping won’t mind.',
    tools: [
      { title: 'Decide before you arrive', how: 'Make the decision at home, not at the bar. Then there’s nothing to debate.' },
      { title: 'Recruit one ally', how: 'Tell one person at the event you’re not drinking. Allies make the evening easier.' },
      { title: 'You don’t owe an explanation', how: '“No thanks” is a complete sentence. Use a script if you want one.', link: '#/tools/refuse' },
      { title: 'Find alcohol-free company', how: 'Alcohol-free socials, mutual-help groups and sports clubs are full of people who’ve made the same choice.' },
    ],
  },
  {
    id: 'boredom',
    label: 'Beat boredom',
    voice: '“Evenings are empty without it.”',
    truth:
      'Drinking fills empty hours and makes dull things bearable — while draining the energy you’d need to find better things. Early on, life can feel flat while your reward system recalibrates. That flatness lifts, usually within weeks.',
    tools: [
      { title: 'Make a boredom menu', how: 'Write 10 things you can start in under 2 minutes: a show, a walk, a puzzle, a call, cooking, a game, an instrument. Pick from it when the evening sags.' },
      { title: 'Plan your weekends', how: 'Unplanned evenings and weekends are high-risk. Put one thing in the diary for each.' },
      { title: 'Learn something with your hands', how: 'Cooking, drawing, fixing, gardening, music — absorbing activities give the same “switch-off” alcohol used to.' },
      { title: 'Spend the money you’re saving', how: 'Your Progress tab shows what you’ve saved. Fund a new hobby with it.', link: '#/progress' },
    ],
  },
  {
    id: 'lonely',
    label: 'Ease loneliness',
    voice: '“A drink feels like company.”',
    truth:
      'Alcohol feels like a companion in the moment but pulls you further from people — and makes loneliness heavier the next day. Connection is one of the strongest predictors of staying stopped.',
    tools: [
      { title: 'One message a day', how: 'Text one person every day — an old friend, a sibling, a neighbour. Small contact adds up.' },
      { title: 'Join a group', how: 'Mutual-help meetings run online around the clock (AA, SMART Recovery, Recovery Dharma, and others). You can listen without speaking.', link: '#/support' },
      { title: 'Call a helpline just to talk', how: 'Helplines are for this too. You don’t need to be in crisis.', link: '#/support' },
      { title: 'Show up somewhere regularly', how: 'A class, a club, volunteering, the same café. Familiar faces turn into connections.' },
    ],
  },
  {
    id: 'reward',
    label: 'Reward or celebrate',
    voice: '“I’ve earned it.”',
    truth:
      '“I deserve a drink” is one of the most common triggers there is. You do deserve a reward — one that doesn’t cost you tomorrow morning.',
    tools: [
      { title: 'A real reward menu', how: 'List treats that don’t cost tomorrow: a meal out, a film, a new book, a massage, something from your savings.' },
      { title: 'A special alcohol-free drink', how: 'Make celebration drinks special: good glass, ice, garnish. Mark the moment without the cost.' },
      { title: 'Celebrate your milestones', how: 'Every milestone in Progress is a real achievement. Tell someone.', link: '#/progress' },
      { title: 'Delay and decide', how: 'Wait 20 minutes before deciding anything. The “I deserve it” thought usually loses its pull.', link: '#/sos' },
    ],
  },
  {
    id: 'habit',
    label: 'Habit or routine',
    voice: '“It’s just what happens at 6 pm.”',
    truth:
      'Repeated drinking wires cues — a time, a place, the walk home, the fridge door — to an automatic urge. Habits fade when the cue happens and no drink follows. Every craving you ride out is a rep that weakens the wiring.',
    tools: [
      { title: 'Change the cue', how: 'Take a different route home, sit in a different chair, rearrange the evening. Disrupt the script.' },
      { title: 'Clear the house', how: 'Remove alcohol from home. A craving you can’t act on in 30 seconds is far easier to ride out.' },
      { title: 'Write if-then plans', how: '“If it’s 6 pm and I’m home, then I’ll make a cold drink and go for a walk.” Pre-deciding works.', link: '#/tools/plans' },
      { title: 'Expect the clock urge', how: 'Habit urges arrive on schedule. Know it’s coming and have the SOS tool ready.', link: '#/sos' },
    ],
  },
  {
    id: 'withdrawal',
    label: 'Stop the shakes or sickness',
    voice: '“I need a drink just to feel normal.”',
    truth:
      'If you drink to stop shakes, sweats, nausea or anxiety, your body has become physically dependent. This is a medical issue, not a willpower one — and it’s very treatable. Stopping suddenly can be dangerous; a doctor can help you withdraw safely and much more comfortably.',
    tools: [
      { title: 'Get medical advice before stopping', how: 'Use the doctor-prep sheet to make the conversation easy. Many people can withdraw at home with a doctor’s plan.', link: '#/support/doctor' },
      { title: 'Call a helpline', how: 'They can tell you where to get safe, supported withdrawal near you.', link: '#/support' },
      { title: 'Know the red flags', how: 'Seizures, hallucinations or confusion during withdrawal are emergencies.', link: '#/withdrawal' },
      { title: 'Ask about craving medication', how: 'Medicines like naltrexone or acamprosate can cut cravings and the risk of returning to drinking. Naltrexone can even be started while you are still drinking.', link: '#/learn/meds' },
    ],
  },
  {
    id: 'pain',
    label: 'Ease physical pain',
    voice: '“It takes the edge off the pain.”',
    truth:
      'Alcohol dulls pain briefly but worsens inflammation and sleep — both of which make pain worse. It is also dangerous with many painkillers, especially opioids and some sleep or anxiety medicines.',
    tools: [
      { title: 'Ask for a pain plan', how: 'A doctor or pharmacist can review what you take and suggest safer options.', link: '#/support/doctor' },
      { title: 'Heat, cold and gentle movement', how: 'Warm packs, ice, stretching and short walks help many kinds of pain.' },
      { title: 'Pace yourself', how: 'Break tasks into smaller chunks with rests to avoid flare-ups.' },
      { title: 'Never mix', how: 'Don’t combine alcohol with opioids, benzodiazepines, sleeping pills or gabapentinoids — the combination can stop your breathing.' },
      { title: 'Check everyday painkillers too', how: 'If you drink heavily or have liver problems, check with a pharmacist before taking paracetamol (acetaminophen) regularly, and avoid ibuprofen-type painkillers unless advised — they can irritate the stomach.' },
    ],
  },
];

export const MOTIVE_BY_ID: Record<MotiveId, Motive> = Object.fromEntries(MOTIVES.map((m) => [m.id, m])) as Record<MotiveId, Motive>;
