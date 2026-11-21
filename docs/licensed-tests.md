# Adding licensed IELTS tests (e.g. Cambridge IELTS)

Balbal's own lessons and its full mock test are **original material** written in the official IELTS format. Authentic past papers — such as the *Cambridge IELTS 1–19* books — are copyrighted by **Cambridge University Press & Assessment**. They can only be added to Balbal **after you have written permission (a licence)**. Until then, do not copy any of their passages, questions, audio or images into this project.

## 1. Getting permission

1. Contact the **Permissions / Rights & Licensing** team of Cambridge University Press & Assessment (via the permissions section of cambridge.org). Explain clearly:
   - which books and tests you want to use (e.g. *IELTS 18 Academic, Tests 1–4*), including audio;
   - that it is a **commercial online learning platform**, how learners access it (paid / free, login required), the expected number of users and the countries;
   - how the content is protected (login only, no downloading, answers checked on the server);
   - the licence period you need.
2. Expect a fee and conditions (attribution text, user limits, removal at the end of the licence). Keep the signed licence and its reference number.
3. If permission is refused or too expensive, alternatives are: licensing tests from another publisher; partnering with an official provider; or keeping Balbal's original tests and sending learners to the official free tests and books (see the in-app **Resources** page).

## 2. Preparing a test file

Each test is one JSON file that follows `FullTestSchema` (`lib/mock/schema.ts`). The built-in test `content/mock/original-test-1/` is a complete working example of every field and question type.

```jsonc
{
  "id": "cambridge-18-academic-test-1",
  "title": "Cambridge IELTS 18 Academic — Test 1",
  "module": "academic",
  "source": {
    "kind": "licensed",
    "publisher": "Cambridge University Press & Assessment",
    "book": "Cambridge IELTS 18 Academic",
    "testNumber": 1,
    "licenseRef": "YOUR-LICENCE-REFERENCE",
    "attribution": "© Cambridge University Press & Assessment. Used under licence."
  },
  "listening": [ { "part": 1, "context": "…", "audioUrl": "cambridge-18/test1/part1.mp3", "groups": [ … ] }, … 4 parts ],
  "reading":   [ { "passage": 1, "title": "…", "paragraphs": [{ "label": "A", "text": "…" }], "groups": [ … ] }, … 3 passages ],
  "writing":   { "task1": { "task": "task1", "prompt": "…", "image": { "src": "…", "alt": "…" }, "imageDescription": "…", "minWords": 150 },
                 "task2": { "task": "task2", "prompt": "…", "minWords": 250 } },
  "speaking":  { "part1": ["…"], "part2": { "topic": "…", "bullets": ["…"] }, "part3": ["…"] }
}
```

### Question groups

| `type` | Official question type | Answer format |
|---|---|---|
| `mcq` | Multiple choice (one answer) | option key, e.g. `"B"` (options on each question) |
| `mcq-multi` | Choose TWO / THREE | group `prompt` + `options`; every question in the group lists **all** correct keys, e.g. `["A","C"]` |
| `tfng` / `ynng` | True/False/Not Given · Yes/No/Not Given | `"TRUE"`, `"FALSE"`, `"NOT GIVEN"` / `"YES"`, `"NO"`, `"NOT GIVEN"` |
| `matching` | Headings, information, features, sentence endings, classification | option key from the group `options` (`allowReuse: true` for "NB you may use any letter more than once") |
| `completion` | Note / sentence / summary / table / flow-chart / form completion | the word(s), with alternatives: `["metre","meter"]`; prompt contains `___`; set `wordLimit` (`{ "words": 1, "number": true }` = ONE WORD AND/OR A NUMBER) |
| `completion-box` | Summary completion from a word list | option key; prompt contains `___` |
| `labelling` | Map / plan / diagram labelling | option key; group needs an `image` |
| `short-answer` | Short-answer questions | the words, with `wordLimit` |

Questions must be numbered 1–40 in each of Listening and Reading. `explanation` is optional (licensed answer keys usually don't include one).

## 3. Where to put the files

Never commit licensed material to a public repository.

- **Test JSON**: put the files in a private folder and set `MOCK_TESTS_DIR=/path/to/private/tests`. (By default Balbal also reads `content/mock/licensed/`, which is git-ignored.)
- **Audio and images**: upload them to private storage (e.g. a bucket behind your CDN) and set `MOCK_ASSETS_BASE_URL=https://assets.example.com/ielts`. Relative paths in the JSON (`cambridge-18/test1/part1.mp3`) are resolved against it.

## 4. Validate and publish

```bash
npm run validate:tests                      # checks the built-in test + every file in MOCK_TESTS_DIR
npm run validate:tests -- path/to/test.json # checks one file
```

The validator checks the schema, 40 + 40 numbered questions, answers that match the options, word limits on completion questions, images on disk (skipped when `MOCK_ASSETS_BASE_URL` is set), and that licensed tests carry `licenseRef` and `attribution`. Invalid files are skipped by the app (with a warning in the server log), so a broken file never reaches learners.

Once valid, the test appears automatically under **Practice → Full mock tests**, with its attribution shown on the test. Answers are never sent to the browser; grading happens on the server.
