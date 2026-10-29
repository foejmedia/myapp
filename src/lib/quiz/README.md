# Quran Quiz

`/quiz` (hub) and `/quiz/play?kind=…` (session).

## Content source

All questions are generated from the **Quran.com API v4**, the same source the Read Quran pages use:

| Content | Endpoint / field | Attribution shown |
| --- | --- | --- |
| Arabic text | `verses/by_chapter` → `text_qpc_hafs` (rendered with the site's Uthmanic Hafs font) | Quran.com — Uthmani Hafs text (King Fahd Complex) |
| Translations | `translations=20` (EN), `234` (UR), `122` (HI) | Saheeh International · Fatah Muhammad Jalandhari · Maulana Azizul Haque al-Umari |
| Word meanings | `words=true&language=en|ur|hi` | Quran.com word-by-word |
| Surah metadata | `chapters` (names, meanings, ayah counts), `juz_number` | Quran.com |
| Audio | `verses.quran.com/Alafasy/mp3/SSSAAA.mp3` | Mishary Rashid Alafasy |

`/api/quiz/content` fetches and **validates** each surah (`toSurah` in `content.ts`): ayah count must match the
chapter metadata, ayahs must be in sequence, and every ayah needs text, words and the requested translation —
otherwise the request fails rather than serving partial text. Responses are cached for a week.

## How answers stay verified

`engine.ts` never composes Quranic text. The correct option is taken straight from the data (the real missing
word, the real next ayah, the ayah's own translation, the chapter's ayah count), and wrong options are other real
ayahs / words / translations / surahs. A question is skipped when it could be ambiguous — e.g. an ayah whose
wording also appears in a surah offered as an option, a refrain with more than one possible "next ayah", or two
options that differ only in vowel marks. Makki/Madani questions are deliberately left out because classifications
differ for some surahs.

## Demo mode

If the API is unreachable, the session screen offers a clearly labelled **demo mode** that uses
`demo-content.json` — a snapshot of 13 surahs produced by the same loader and checks:

```bash
npx tsx scripts/build-quiz-demo.ts
```

## Progress

Stored in `localStorage` (`quran-quiz-v1`, see `progress.ts`): totals per category and level, recent sessions,
the daily challenge result per day, and a revision list of missed questions that leave after two correct answers
in a row. The personalised level moves up after 30+ answers at ≥ 80% and back after 20+ answers under 50%.

## Tests

```bash
npm test
```

Covers question generation (answer keys checked against the source data, no ambiguous options, no repeats,
seeded reproducibility), answer validation, content checks and progress tracking.
