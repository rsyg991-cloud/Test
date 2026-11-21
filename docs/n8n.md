# Connecting Balbal's AI grading to n8n

Balbal can send every AI evaluation (Writing, Speaking and AI-Conversation feedback) to an **n8n webhook**. Inside n8n you connect any model you like — a free one (Gemini, Groq, OpenRouter free models, a local Ollama…) or a paid one — without changing Balbal's code.

## 1. Configure Balbal

In `.env`:

```bash
AI_PROVIDER="webhook"                                         # or leave empty: webhook is used automatically when the URL is set
N8N_EVAL_WEBHOOK_URL="https://your-n8n.example.com/webhook/bandup-evaluate"
N8N_WEBHOOK_SECRET="a-long-random-string"                      # optional but recommended
```

Provider order when `AI_PROVIDER` is empty: n8n webhook (if the URL is set) → Claude (if `ANTHROPIC_API_KEY` is set) → offline demo evaluator. `AI_MOCK=1` forces the demo evaluator.

## 2. Build the workflow in n8n

```
[Webhook] → [IF secret matches] → [AI Agent / Basic LLM Chain] → [Respond to Webhook]
```

1. **Webhook** node
   - HTTP Method: `POST`, Path: `bandup-evaluate`
   - Respond: **Using 'Respond to Webhook' node**
2. **IF** node (optional, recommended) — check `{{ $json.headers["x-bandup-secret"] }}` equals your secret. On the false branch, respond with status 401.
3. **AI node** (e.g. *Basic LLM Chain* with a *Google Gemini* / *Groq* / *OpenRouter* chat model)
   - System message: `{{ $json.body.instructions }}`
   - User message:
     ```
     {{ $json.body.input }}

     Reply ONLY with a JSON object that matches this JSON Schema (no markdown, no extra text):
     {{ JSON.stringify($json.body.responseSchema) }}
     ```
   - Tip: if the node offers *Require Specific Output Format* / a structured output parser, give it the same schema.
4. **Respond to Webhook** node
   - Respond With: **JSON**
   - Response Body: `{{ $json.output ?? $json.text }}` (whatever field your AI node outputs)

Balbal is forgiving about the reply shape: it accepts the evaluation object itself, an object with `output` / `text` / `response` / `json` / `data` containing it (as an object or a JSON string, even wrapped in ```json fences), or an array of items. It validates the result and clamps every band to 1–9.

The request times out after 55 seconds (Vercel functions on the free plan stop at 60 seconds), so keep the workflow fast.

## 3. Request Balbal sends

```json
{
  "kind": "writing",
  "instructions": "You are a senior, certified IELTS examiner …",
  "input": "Assess this IELTS Academic Writing Task 2 response. … <task>…</task> <response>…</response>",
  "criteria": ["Task Achievement / Response", "Coherence and Cohesion", "Lexical Resource", "Grammatical Range and Accuracy"],
  "meta": { "task": "task2", "minWords": 250, "words": 263 },
  "responseSchema": { "type": "object", "properties": { "overall_band": { "type": "number" }, "…": "…" } }
}
```

- `kind` is `writing`, `speaking` or `conversation`.
- `criteria` lists the four criteria in the order Balbal expects them back.
- `meta` holds handy numbers (word count, speaking time, words per minute, scenario id…).

## 4. Response Balbal expects

```json
{
  "overall_band": 6.5,
  "criteria": [
    { "name": "Task Achievement / Response", "band": 6.5, "comment": "…" },
    { "name": "Coherence and Cohesion", "band": 7, "comment": "…" },
    { "name": "Lexical Resource", "band": 6, "comment": "…" },
    { "name": "Grammatical Range and Accuracy", "band": 6.5, "comment": "…" }
  ],
  "summary": "Two sentences, encouraging but honest.",
  "strengths": ["…", "…"],
  "improvements": ["Most important next step", "…", "…"],
  "corrections": [{ "original": "exact words from the answer", "corrected": "…", "explanation": "…" }],
  "upgraded_version": "The learner's answer rewritten about one band higher."
}
```

## 5. Test it

Test the n8n workflow directly:

```bash
curl -X POST "$N8N_EVAL_WEBHOOK_URL" \
  -H "Content-Type: application/json" -H "X-BandUp-Secret: $N8N_WEBHOOK_SECRET" \
  -d '{"kind":"writing","instructions":"You are an IELTS examiner. Reply with JSON only.","input":"Assess: <response>I think study in group is better because friends help.</response>","criteria":["Task Achievement / Response","Coherence and Cohesion","Lexical Resource","Grammatical Range and Accuracy"],"meta":{},"responseSchema":{}}'
```

Then restart Balbal and submit any Writing task — the feedback card should no longer say "Demo estimate". If something is wrong, the learner sees a friendly error and the server log shows `[evaluate]` with the details.

## Free model notes

Smaller free models sometimes return invalid JSON or skip fields. If you see "unexpected format" errors: use a stronger model, enable the structured-output parser in n8n, or add a *Code* node before *Respond to Webhook* that fixes the JSON.
