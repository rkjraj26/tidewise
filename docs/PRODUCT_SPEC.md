# Tidewise — Product & Clinical Specification (v1.0)

> **One job:** help a person who drinks stop drinking alcohol — safely, privately, and for good.
> **Tagline:** *Cravings are waves. Learn to ride them.*

---

## 1. The problem, from the drinker's side

Most quit apps are built from the outside looking in: a streak counter, a badge, a reset
button. That design misses why people drink, why they relapse, and why they never ask for
help. These are the insights the app is built on.

| # | What it feels like from inside | What the evidence says | What Tidewise does about it |
|---|---|---|---|
| 1 | *"Drinking is the only thing that switches my brain off after work / lets me sleep / gets me through a party."* | Drinking is **functional**: it reliably relieves stress, anxiety, insomnia, boredom, loneliness, social fear, and later withdrawal itself (*negative reinforcement*). Remove the tool without replacing the job and relapse is likely. (CBT functional analysis; Community Reinforcement Approach.) | **"What does drinking do for you?"** profile drives everything. Each of 13 *drinking jobs* has an honest explanation of what alcohol really does for it long-term, plus **replacement tools matched to that job**. |
| 2 | *"I'm not an 'alcoholic'. I just drink too much sometimes."* | Labels and stigma are among the top reasons people avoid treatment. | No labels anywhere. No account, no feed, no sign-up. Neutral app name and icon. All data stays on the device. |
| 3 | *"Part of me wants to stop, part of me really doesn't."* | Ambivalence is normal and is the starting point of **Motivational Interviewing**. | Reasons-to-stop in the person's own words, a **decisional balance** exercise, and no lecturing. |
| 4 | *"I slipped on day 40, the counter went to zero, so I thought: what's the point — and drank for a week."* | The **abstinence-violation effect** (Marlatt) turns lapses into relapses. | Tidewise **never erases progress**: total alcohol-free days, longest run, money saved and waves ridden all survive a slip. A **compassionate lapse flow** turns a slip into a learning plan (chain analysis → new if-then plan). |
| 5 | *"When the craving hits it feels like it'll never stop until I drink."* | Cravings rise, peak and fall, typically within ~15–30 minutes. Every urge ridden without drinking weakens the cue → drink link (extinction). **Urge surfing** (Mindfulness-Based Relapse Prevention) is evidence-based. | One-tap **SOS: Ride the wave** — a guided timer with paced breathing, the person's own reasons, *play the tape forward*, matched distractions, and one-tap contact. It records urge before/after, then **shows the person proof from their own data** that waves pass. |
| 6 | *"I get the shakes in the morning. I'm scared to stop."* | Alcohol withdrawal can be **dangerous** (seizures, delirium tremens). People with physical dependence should not stop abruptly without medical advice. | A **withdrawal-safety screen** before any quit date. High-risk users are steered to medically supported withdrawal. A **withdrawal monitor** for the first days triages symptoms (self-care / call a doctor today / emergency now). |
| 7 | *"I didn't know there were pills for this."* | Only **~2.5%** of people with alcohol use disorder in the US received medication in 2024 (SAMHSA NSDUH), despite effective options (naltrexone, acamprosate, disulfiram, others). | A plain-language **medications lesson** plus a **doctor-visit prep sheet** (drinking pattern, AUDIT score, safety flags, questions to ask) that can be shared or printed. Raising the topic with a doctor is the hard part, so the app writes the note for you. |
| 8 | *"It's always 9 pm on a Friday when it gets bad, and nobody's around."* | Risk clusters in predictable times, places and moods (HALT: Hungry, Angry, Lonely, Tired). | Offline 24/7 tools. **Personal risk insights** (top triggers, riskiest hour and weekday). **If-then plans** (implementation intentions) for those exact moments. |
| 9 | *"I can't stop cold."* | For non-dependent drinkers, gradual reduction toward zero is a legitimate harm-reduction path. For dependent drinkers, tapering should be medically guided. | Three paths: **Stop on a set day**, **Stop with medical support**, **Step down to zero** (a day-by-day limit that reaches zero on the quit date, with safety gating). |

## 2. Clinical safety model

Tidewise is a self-help and preparation tool, **not** a medical device and **not** a
replacement for care. Safety rules are hard-coded and unit-tested (`src/lib/safety.ts`).

### 2.1 Withdrawal-risk screen (before setting a quit date)
Inputs: daily or near-daily drinking (or ≥6 drinking days/week) · withdrawal symptoms · morning
drinking (AUDIT item 6) · past withdrawal seizure or DTs · past medically managed withdrawal ·
sedatives (benzodiazepines, sleeping pills, opioids) · serious medical condition · pregnancy
(asked separately) · grams of alcohol per drinking day and per day on average (regional standard
drink) · AUDIT score. Thresholds follow NICE CG115/CG100. *Relief* = withdrawal symptoms or
morning drinking.

| Level | Rule (any of) | App behaviour |
|---|---|---|
| **High** | past seizure/DTs · relief **and** (daily **or** ≥120 g on drinking days) · daily **and** ≥120 g · daily **and** AUDIT ≥ 20 · past detox **and** (daily or relief) · sedatives **and** (daily or relief) · medical condition **and** (daily or relief) · pregnant **and** (daily or relief). Adds an inpatient note at ≥240 g/day. | "Please don't stop suddenly on your own." Path defaults to *medical support*. "Stop on a set day" and "Step down" both require an explicit "a doctor is supporting me" confirmation (onboarding and Settings). Medical-advice line and doctor prep shown first. |
| **Moderate** | daily drinking · withdrawal symptoms · morning drinking · past detox · sedatives · medical condition · pregnancy · ≥120 g on drinking days · ≥60 g/day average · AUDIT ≥ 20 | "Talk to a doctor before you stop", with the region's same-day medical line. Step-down minimum 21 days. Withdrawal monitor prompted in the first week and throughout a step-down. |
| **Low** | none of the above | "Stopping is generally safe for you, but know the warning signs." |

Red flags are always shown to everyone. A missing screen is treated as moderate.

### 2.2 Withdrawal monitor triage
* **Emergency now** (any): seizure or can't be woken · hallucinations · confusion ·
  unsteadiness, double vision or abnormal eye movements (Wernicke's) · chest pain or trouble breathing ·
  fever with sweating or shaking · vomiting blood or black stools · severe stomach pain · head injury ·
  can't keep fluids down. → emergency number, *don't stay alone*.
* **Suicidal thoughts** → crisis line (shown *alongside* any medical emergency card), plus means-safety advice.
* **Call for medical advice today** (region-specific line, e.g. NHS 111, 811, healthdirect, Healthline):
  any symptom in a high-risk person · ≥3 symptoms · vomiting · racing heart · tremor with sweating ·
  more symptoms than a check in the last 24 h.
* **Self-care**: otherwise 1–2 mild symptoms → hydrate, eat, rest, have someone nearby, re-check;
  escalate if past seizures/DTs or symptoms worsen.
* The monitor re-opens for 7 days after any recent heavy pattern (3+ drinking days in a row or a
  ≥120 g day), and the slip flow warns about withdrawal and lowered tolerance.

### 2.2b Step-down plan
A shrinking **weekly budget** (baseline weekly total × fraction of plan remaining), a daily cap no
higher than the usual amount per drinking day, and never more drinking days per week than before
— so a weekend binge drinker is never pushed into daily drinking. Minimum length 7 days (low
risk) or 21 days (moderate/high, with doctor confirmation for high). "Hold this step" goes back to
the level of 4 days earlier and moves the zero day back 4 days.

### 2.3 Screening instrument
WHO **AUDIT** (10 items, public-domain), standard zones: 0–7 lower risk · 8–15 increasing
risk · 16–19 higher risk · 20+ possible dependence. Shown as information, never as a diagnosis.

### 2.4 Content standards
* Plain language (reading age ~12), non-judgmental, person-first ("person who drinks").
* Health timeline claims are hedged ("for many people", "can") and general.
* Every screen with clinical content links to help. Emergency numbers are per region.
* Helplines verified October 2026: SAMHSA 1-800-662-4357 (US, 24/7), 988 (US/CA),
  Drinkline 0300 123 1110 (England), Samaritans 116 123 (UK/IE), Tele-MANAS 14416 (India, 24/7),
  National Alcohol and Other Drug Hotline 1800 250 015 (AU, 24/7), Alcohol Drug Helpline
  0800 787 797 / text 8681 (NZ, 24/7).

## 3. Feature set (v1.0)

1. **Onboarding (≈4 min)**: welcome and privacy promise → what drinking does for you →
   usual drinking and spend (standard-drink helper) → AUDIT → withdrawal safety screen → path and
   quit date → reasons → optional support person.
2. **Home**: Day N, total alcohol-free days, money saved, drinks not drunk, next milestone,
   step-down limit for today, prep checklist (before quit date), withdrawal monitor card
   (first 7 days, moderate or high risk), tool of the day for *your* drinking job, personal insight.
3. **SOS: Ride the wave**: urge rating and triggers → breathing wave timer (5–20 min) with
   urge-surfing prompts → tabs: *My reasons · Play it forward · Do this instead · Reach out* →
   re-rate → logged. "I drank" routes to the lapse flow.
4. **Daily check-in**: drank? (standard-drink count) · mood · peak craving · sleep · HALT · note.
5. **Slip flow**: compassion first → safety → what happened (situation, feeling, thought) →
   what to do next time → saves an if-then plan → progress shown as kept.
6. **Progress**: current and longest run, total AF days, money, drinks avoided, 8-week calendar,
   30-day craving chart, waves-ridden stats, body-and-mind timeline, milestones.
7. **Toolkit**: tools for your drinking jobs · thinking traps and reframes (plus your own thought
   records) · if-then plans · saying-no scripts · breathing · 5-4-3-2-1 grounding · HALT check ·
   decisional balance.
8. **Learn**: 10 short evidence-based lessons.
9. **Support**: regional helplines and emergency number · my people (one-tap call or pre-written
   text) · doctor-visit prep (copy, share, or print) · mutual-help options.
10. **Withdrawal monitor**: symptom check with triage.
11. **Settings**: edit profile and region, theme (light, dark, system), PIN lock, export and import
    backup, delete everything.

## 4. Privacy & architecture
* Progressive Web App (installable on iOS and Android, works offline) — React 19 + TypeScript + Vite.
* **Zero network calls.** No analytics, no account. Data lives in `localStorage` on the device.
  Export and import a JSON backup. Falls back to in-memory storage if the browser blocks storage,
  and tells the user.
* PIN lock (salted SHA-256): a privacy screen against casual access, described honestly as such.
* Ready to wrap with Capacitor for App Store and Play Store (adds local notifications and
  biometric lock — roadmap).

## 5. Why it can win
| Competitor pattern | Gap | Tidewise |
|---|---|---|
| Streak counters (sobriety clocks) | Reset to zero → shame spiral; no help in the moment | Progress never erased; SOS is the centre of the app |
| Neuroscience programs (subscription) | Generic curriculum; paywall before help | Personalised by *why you drink*; safety and SOS free forever |
| Moderation-first apps | Not built for people who want to stop | Built for quitting; step-down only as a road to zero |
| Community apps | Exposure and stigma for private people | Fully private; contact *your* people when you choose |
| Almost all | Ignore withdrawal danger and medication | Safety screen, withdrawal triage, doctor-prep sheet |

**Monetisation (proposal):** core (SOS, safety, tracking, toolkit) free forever. Premium:
guided audio, deeper programs, encrypted cloud backup, clinician-share portal. B2B: licensed
to employers, insurers, and clinics as a between-sessions tool.

## 6. Roadmap (post-v1)
Validated self-rated withdrawal scale (SAWS) in the monitor · Native wrappers (Capacitor) with scheduled reminders before personal high-risk times · biometric
lock · encrypted sync · audio-guided urge surfing · wearable heart-rate stress prompts ·
clinician dashboard (with consent) · localisation (Hindi, Spanish, French first) · peer-validated
content review by an addiction-medicine board · formal usability study and clinical evaluation.
