// Realistic mid-journey data: day 23 after quitting, one slip, several ridden cravings.
export function seed(now = new Date()) {
  const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const daysAgo = (n, h = 12, m = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    d.setHours(h, m, 0, 0);
    return d;
  };
  const quit = key(daysAgo(22));
  const days = {};
  for (let i = 1; i <= 22; i++) {
    const d = key(daysAgo(i));
    days[d] = { date: d, drank: false, drinks: 0, mood: 2 + Math.min(3, Math.floor((22 - i) / 6)), craving: Math.max(1, 8 - Math.floor((22 - i) / 3)), sleep: 2 + Math.min(3, Math.floor((22 - i) / 7)), halt: [], updatedAt: daysAgo(i).toISOString() };
  }
  const slip = key(daysAgo(9));
  days[slip] = { ...days[slip], drank: true, drinks: 4, craving: 9, mood: 2 };
  const urges = [20, 16, 13, 9, 6, 2].map((n, i) => ({
    id: `u${i}`,
    at: daysAgo(n, 18 + (i % 3), 15).toISOString(),
    before: 8 - Math.floor(i / 2),
    after: n === 9 ? null : 3 - Math.floor(i / 3),
    triggers: i % 2 ? ['stress', 'time'] : ['stress', 'bored'],
    durationSec: 600 + i * 60,
    outcome: n === 9 ? 'drank' : 'rode',
  }));
  return {
    version: 1,
    createdAt: daysAgo(23).toISOString(),
    profile: {
      name: 'Alex',
      region: 'US',
      currency: '$',
      motives: ['stress', 'sleep', 'anxiety'],
      reasons: ['Wake up clear-headed', 'Be present for my kids / family', 'I want my daughter to be proud of me'],
      futureLetter: 'If you are reading this, you are in a craving. It will pass. Remember how good Saturday morning felt.',
      baseline: { drinkingDaysPerWeek: 6, drinksPerDrinkingDay: 5, spendPerWeek: 90 },
      audit: { answers: [4, 2, 3, 2, 1, 1, 2, 1, 0, 2], score: 18, takenAt: daysAgo(23).toISOString() },
      safety: { dailyDrinking: true, withdrawalSymptoms: false, pastSeizureOrDTs: false, pastMedicalDetox: false, sedatives: false, medicalConditions: false, level: 'moderate', assessedAt: daysAgo(23).toISOString() },
      plan: { approach: 'stop', quitDate: quit, startedOn: key(daysAgo(23)), medicalGuidance: false },
    },
    days,
    urges,
    lapses: [{ id: 'l1', at: daysAgo(9, 21).toISOString(), date: slip, drinks: 4, situation: 'Friday after work, home alone', feeling: 'Stress, Lonely', thought: 'I deserve it after this week', nextTime: 'Call Sam and go to the gym straight from work' }],
    plans: [{ id: 'p1', ifText: 'Friday after work, home alone', thenText: 'Call Sam and go to the gym straight from work', createdAt: daysAgo(9).toISOString() }],
    contacts: [{ id: 'c1', name: 'Sam', phone: '+1 555 0100' }],
    thoughts: [],
    withdrawal: [],
    decisional: null,
    settings: { theme: 'system', pinHash: null, pinSalt: null, prepDone: [] },
  };
}
