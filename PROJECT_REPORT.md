# Multimodal RAG Chatbot — Complete Technical Report

> READ-ONLY AUDIT. Every claim is backed by a specific line in `server.js` or `public/index.html`.

---

## QUICK REFERENCE

| Item | Actual Value (source line) |
|---|---|
| Project name | `multimodal_ragchatbot` (package.json:2) |
| Start command | `node server.js` (package.json:7) |
| Port | `3000` or `process.env.PORT` (server.js:8) |
| Embedding model | `gemini-embedding-2` (server.js:18) |
| Generation model — primary | `gemini-3.5-flash-lite` (server.js:80) |
| Generation model — fallback | `gemini-3.5-flash` (server.js:81) |
| Generation timeout | `8000 ms` (server.js:62) |
| Chunk size | `800 characters` (server.js:52) |
| Chunk overlap | **None** — sequential slicing only |
| Top-K retrieval | `5` chunks (server.js:260) |
| Storage type | **In-memory array** `ragChunks[]` (server.js:33) |
| Firestore | **NOT used in the active backend** |
| API key env var | `GEMINI_API_KEY` (server.js:9) |
| OCR library | Tesseract.js v5 (CDN, browser-side) |
| PDF parser | PDF.js v3.11.174 (CDN, browser-side) |
| DOCX parser | Mammoth.js (CDN, browser-side) |
| Speech recognition | Web Speech API (browser built-in) |
| Frontend framework | Vanilla HTML + CSS + JavaScript (no framework) |
| Backend framework | Express.js v5 |

---

## STEP 1 — PROJECT STRUCTURE

```
MultiModal_Rag-master/
├── server.js            ← Active backend (Node.js + Express)
├── package.json
├── .env                 ← GEMINI_API_KEY stored here
├── .gitignore
├── firebase.json        ← Legacy Firebase Hosting config (not active)
├── .firebaserc          ← Legacy Firebase alias (not active)
├── public/
│   └── index.html       ← Complete frontend (HTML + CSS + JS in one file, 1689 lines)
├── functions/
│   ├── index.js         ← Old Cloud Functions backend using Firestore (NOT running)
│   └── server.js        ← Old Cloud Functions variant (NOT running)
└── node_modules/
```

**The currently running backend is `server.js` at the root.**
The `functions/` directory contains old code that is NOT active.

---

## STEP 2 — COMPLETE TECHNOLOGY STACK

| Technology | Category | Where Used | Runs On |
|---|---|---|---|
| Node.js | Runtime | Executes server.js | Backend |
| Express v5 | Web framework | HTTP server, routing, middleware | Backend |
| dotenv v18 | Config | Loads .env into process.env | Backend |
| @google/generative-ai v0.24.1 | AI SDK | All Gemini calls | Backend |
| cors v2.8.5 | Middleware | Allows cross-origin browser requests | Backend |
| gemini-embedding-2 | Embedding model | Converts text chunks and queries to vectors | Backend (API) |
| gemini-3.5-flash-lite | Generative model | Writes the final RAG answer | Backend (API) |
| gemini-3.5-flash | Generative model | Fallback if primary fails | Backend (API) |
| Tesseract.js v5 | OCR | Reads text from images in the browser | Frontend (CDN) |
| PDF.js v3.11.174 | PDF parsing | Extracts text from PDF files in the browser | Frontend (CDN) |
| Mammoth.js | DOCX parsing | Extracts text from DOCX files in the browser | Frontend (CDN) |
| Web Speech API | Speech recognition | Mic to text conversion | Frontend (browser built-in) |
| Fetch API | HTTP client | Makes POST requests to backend | Frontend (browser built-in) |
| Vanilla HTML/CSS/JS | Frontend UI | Complete UI in one index.html file | Frontend |
| Inter (Google Fonts) | Typography | UI font | Frontend (CDN) |
| In-memory array ragChunks[] | Storage | Stores all indexed chunks + embeddings | Backend RAM |
| Cosine Similarity | Math / Retrieval | Ranks chunks by relevance to query | Backend |

**Firestore / Firebase:** Present in `functions/` directory but NOT used in the active `server.js`.

---

## STEP 3 — WHAT IS THIS PROJECT?

### Simple explanation

This is a chatbot you can "teach" by uploading files. Once you upload a document, an image, or speak into the microphone, the system understands what is inside. You can then ask questions in plain English and it finds answers from your own content — not from the internet, not made up.

### Why "Multimodal"?

Multimodal means it accepts multiple types of input:
- **Text** → PDF, DOCX, TXT files
- **Image** → photographs or screenshots (text extracted via OCR)
- **Audio** → spoken words via microphone (converted to text via speech recognition)

All three types are converted to text and enter the same pipeline.

### What is RAG?

**RAG = Retrieval-Augmented Generation**
1. **Retrieval** — Find the most relevant pieces of uploaded content
2. **Augmented** — Use those pieces to enhance the AI's knowledge
3. **Generation** — Let Gemini write the answer using the retrieved context

### Why RAG instead of sending the whole document?

- Documents can be thousands of words long
- Sending everything to Gemini every time is slow and expensive
- RAG breaks the document into small chunks, stores their "meaning" as vectors, and only sends the **top 5 most relevant chunks** to Gemini
- This is faster, cheaper, and more focused on the question

### Professional definition (for reports / viva)

> A Multimodal Retrieval-Augmented Generation system is an AI application that accepts heterogeneous input modalities — structured text (PDF/DOCX/TXT), unstructured visual content (images via OCR), and spoken audio (via speech-to-text) — converts all inputs to a unified text representation, encodes them as semantic embedding vectors, stores them in a retrieval index, and at query time performs cosine-similarity-based nearest-neighbour retrieval to surface contextually relevant chunks. These retrieved chunks are injected as grounding context into a prompt sent to Google Gemini, which synthesises a factually grounded natural language response.

---

## STEP 4 — COMPLETE ARCHITECTURE

```
USER (Browser)
     │
     │  [Selects file / Speaks / Selects image]
     ▼
FRONTEND (public/index.html — Vanilla JS)
     │
     │  .txt  → file.text()              [Browser File API]
     │  .pdf  → pdfjsLib.getDocument()   [PDF.js CDN]
     │  .docx → mammoth.extractRawText() [Mammoth.js CDN]
     │  image → Tesseract.recognize()    [Tesseract.js CDN]
     │  audio → SpeechRecognition        [Web Speech API]
     │
     │  All produce: plain text string
     │
     │  POST /ingestText
     │  Body: { text, sourceType, sourceName }
     ▼
BACKEND (server.js — Node.js + Express)
     │
     │  chunkText(text, 800)
     │  → array of ≤800-char slices, no overlap
     │
     │  embeddingModel.batchEmbedContents({ requests })
     │  → Gemini Embedding API (gemini-embedding-2)
     │  → returns array of float vectors
     │
     │  ragChunks.push({ id, text, embedding, sourceType, sourceName, createdAt })
     │
     │  Response: { ok: true, chunks: N }
     ▼
IN-MEMORY STORE (ragChunks[] in Node.js RAM)
     │
     │  [Server holds all chunks until restarted]
     │
          [User types question → presses Enter]
     │
FRONTEND: callChatRag(message)
     │  POST /chatRag  Body: { message }
     ▼
BACKEND: /chatRag handler
     │
     │  1. Greeting regex check → skip RAG if greeting ≤5 words
     │  2. embedContent(message) → queryEmbedding (float vector)
     │  3. cosineSimilarity(queryEmbedding, chunk.embedding) for all chunks
     │  4. Sort descending → topK = top 5 chunks
     │  5. Zero-chunk guard → return "No relevant content" if empty
     │  6. Build contextText from topK (with source + score labels)
     │  7. Build ragPrompt = instructions + question + contextText
     │  8. generateWithFallback(genAI, ragPrompt)
     │     → try gemini-3.5-flash-lite (8s timeout)
     │     → if fails: try gemini-3.5-flash (8s timeout)
     │  9. Extract text from candidates[0].content.parts[0].text
     │  10. Response: { answer, topChunks }
     ▼
FRONTEND
     │  addChatMessage(resp.answer, "bot")
     │  → DOM bubble created and appended to #chat
     ▼
USER sees the answer
```

---

## STEP 5 — TEXT / PDF / DOCX FLOW

### TXT
```
file.text()  [Browser built-in]
→ callIngestText(text, "doc", fileName)  POST /ingestText
```

### PDF
```
pdfjsLib.getDocument({ data: arrayBuffer }).promise
→ for each page: page.getTextContent() → items.map(i => i.str).join(" ")
→ callIngestText(fullText, "doc", fileName)
```
Library: **PDF.js v3.11.174** (CDN). Worker: `pdf.worker.min.js`.
Processing is 100% browser-side — the PDF binary is never sent to the backend.

### DOCX
```
window.mammoth.extractRawText({ arrayBuffer })
→ text = result.value
→ callIngestText(text, "doc", fileName)
```
Library: **Mammoth.js** (CDN). Also 100% browser-side.

### Backend ingestion (all three)
```
POST /ingestText → chunkText(text, 800) → ≤800-char chunks, NO overlap
→ batchEmbedContents → gemini-embedding-2 → float vectors
→ ragChunks.push({id, text, embedding, sourceType, sourceName, createdAt})
→ res.json({ ok: true, chunks: N })
```

Chunk details:
- Max size: **800 characters**
- Overlap: **0** (no sliding window)
- Max chunks: unlimited (RAM-bound)
- Embedding dimensions: `gemini-embedding-2` produces 3072-dimensional vectors per Google documentation (not stated in code)

---

## STEP 6 — IMAGE FLOW

```
User selects image → imageInput change fires → preview shown
→ ocrBtn.onclick
→ imgUrl = URL.createObjectURL(file)
→ result = await Tesseract.recognize(imgUrl, "eng")
→ text = result.data.text
→ if (!text.trim()) → show "No text detected" error (no backend call)
→ else: callIngestText(text, "image", file.name)  POST /ingestText
→ backend processes identically to a document chunk
```

**OCR = Optical Character Recognition** — reads printed text from images.

**Why Tesseract.js:**
- Runs in browser via WebAssembly — no server needed
- No API key required — completely free
- The image itself never leaves the user's browser

**IMPORTANT: This is an Image → Text → RAG pipeline.**
The image is NOT sent to Gemini. Gemini never sees the image directly.
Only OCR-extracted text enters the RAG index.

**Limitation:** Photos of scenes (dog, car, person) with no printed text produce empty OCR → cannot be indexed.

---

## STEP 7 — AUDIO FLOW

```
audioBtn.onclick (start):
→ audioTextBuffer = ""
→ recognition.start()       ← Web Speech API begins listening
→ recognition.lang = "en-US"
→ recognition.continuous = true
→ recognition.interimResults = true

recognition.onresult:
→ finalTranscript += event.results[i][0].transcript  (isFinal results only)
→ audioTextBuffer += finalTranscript
→ audioTextDiv.textContent = audioTextBuffer  ← live preview

audioBtn.onclick (stop):
→ recognition.stop()

sendAudioTextBtn.onclick:
→ callIngestText(audioTextBuffer, "audio", "mic")  POST /ingestText
→ backend processes identically to any other text
```

Key facts:
- **Audio is NEVER stored.** Only the text transcript enters the index.
- Speech API is browser built-in — no CDN, no API key
- Language: English (`en-US`) only
- Browser support: Chrome, Edge (uses `webkitSpeechRecognition` prefix)
- If unsupported: `audioBtn.disabled = true` and error message shown

**Chat composer mic** (separate instance, `micChatRecognition`):
- `continuous: false`, `interimResults: false`
- Single-shot: one utterance → transcript placed in chat input
- Does NOT automatically send to RAG or ingest

---

## STEP 8 — RAG WORKING (Step-by-Step with Code)

| Step | What Happens | Code Location |
|---|---|---|
| 1 | User types in `#chatInput`, presses Enter | `keydown` → `sendChat()` — index.html |
| 2 | Frontend sends: `fetch("/chatRag", { body: {message} })` | `callChatRag()` — index.html |
| 3 | Greeting check: regex on lowercased message, wordCount ≤ 5 | server.js lines 188–227 |
| 4 | `embedContent({ role:"user", parts:[{text:message}] })` | server.js lines 230–242 |
| 5 | `queryEmbedding = embRes.embedding.values` (float array) | server.js line 237 |
| 6 | `ragChunks.map(d => cosineSimilarity(queryEmbedding, d.embedding))` | server.js lines 245–257 |
| 7 | `scored.sort((a,b) => b.score - a.score); topK = scored.slice(0,5)` | server.js lines 259–260 |
| 8 | If `topK.length === 0` → return "No relevant content found" | server.js lines 262–264 |
| 9 | Format chunks: `[#N \| sourceType:sourceName \| score=X.XXX]\ntext` | server.js lines 266–281 |
| 10 | Build RAG prompt: system instructions + question + contextText | server.js lines 283–293 |
| 11 | `generateWithFallback(genAI, [{role:"user", parts:[{text:ragPrompt}]}])` | server.js lines 295–300 |
| 12 | Extract: `ragResp.response.candidates[0].content.parts[0].text` | server.js lines 309–317 |
| 13 | `res.json({ answer: finalText, topChunks: [...] })` | server.js lines 320–328 |
| 14 | `addChatMessage(resp.answer, "bot")` → chat bubble | index.html `sendChat()` |

---

## STEP 9 — EMBEDDINGS EXPLAINED

### What is an embedding?

An embedding converts text into a long list of numbers (a "vector"). Similar-meaning texts produce similar vectors.

Example:
- "The dog chased the cat" → `[0.023, -0.041, 0.118, ...]`
- "A canine pursued a feline" → `[0.021, -0.039, 0.116, ...]`

These two sentences share almost no words, but their vectors are very similar because `gemini-embedding-2` understands meaning, not just letters.

### Cosine Similarity (exact code from server.js lines 37–49)

```javascript
function cosineSimilarity(a, b) {
  const len = Math.min(a.length, b.length);
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];   // dot product
    na  += a[i] * a[i];   // magnitude of a squared
    nb  += b[i] * b[i];   // magnitude of b squared
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
```

- **Value range:** 0 (completely unrelated) to 1 (identical meaning)
- **Score ≥ 0.8** → highly relevant
- **Score < 0.3** → likely unrelated
- **Ranking:** All chunk scores computed, sorted descending, top 5 selected

---

## STEP 10 — GEMINI INTEGRATION

### SDK: `@google/generative-ai` v0.24.1

### API key: `GEMINI_API_KEY` from `.env`

### Initialisation (server.js lines 15–19)
```javascript
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
```

### Embedding calls
```javascript
// Ingestion (batch):
embeddingModel.batchEmbedContents({ requests })

// Query (single):
embeddingModel.embedContent({ content: { role:"user", parts:[{text:message}] } })
```

### Generation with fallback (server.js lines 62–97)
```javascript
const GENERATION_TIMEOUT_MS = 8000;

async function generateWithFallback(genAI, contents) {
  const primary  = "gemini-3.5-flash-lite";
  const fallback = "gemini-3.5-flash";

  try {
    return await withTimeout(tryModel(genAI, primary, contents), 8000);
  } catch (err) {
    console.warn(`Primary failed. Trying fallback...`);
  }

  try {
    return await withTimeout(tryModel(genAI, fallback, contents), 8000);
  } catch (err) {
    throw new Error("Gemini is currently overloaded. Please try again in a moment.");
  }
}
```

### Timeout mechanism
`Promise.race([geminiCall, setTimeout(reject, 8000)])` — if Gemini doesn't respond in 8 seconds, the timeout wins and the fallback is tried immediately.

### RAG prompt structure (server.js lines 283–293)
```
You are a helpful assistant that answers questions about the user's uploaded content
(documents, OCR text from images, and audio transcripts).

Use the "Context" below to ground your answer:
- Prefer information that clearly matches the user's question.
- If the answer is not clearly supported by the context, say you don't know.
- Write in a natural, conversational tone.
- Keep answers concise (1–3 sentences).

User question:
[user's question]

Context:
[#1 | doc:filename.pdf | score=0.923]
[chunk text...]

[#2 | image:photo.jpg | score=0.871]
[chunk text...]
```

---

## STEP 11 — FIREBASE / FIRESTORE STATUS

### Current active backend (`server.js`): NO Firestore

No `require("firebase-admin")`, no `admin.firestore()`, no collection calls.

Storage is: `const ragChunks = [];` — plain JavaScript array in RAM.

**All indexed data is lost when the server restarts.** This is the primary limitation.

### Legacy files (present but NOT running)

| File | Status |
|---|---|
| `functions/index.js` | Old Cloud Functions backend — used Firestore collection `rag_chunks` |
| `functions/server.js` | Another old variant — NOT running |
| `firebase.json` | Firebase Hosting config — legacy |
| `.firebaserc` | Firebase project alias — legacy |

### What the old Firestore code stored (historical, not current)
- Collection: `rag_chunks`
- Fields per document: `text`, `embedding`, `sourceType`, `sourceName`, `createdAt`

---

## STEP 12 — API ENDPOINTS

| Endpoint | Method | Request Body | Response | Frontend Caller |
|---|---|---|---|---|
| `POST /ingestText` | POST | `{ text: string, sourceType: "doc"\|"image"\|"audio", sourceName: string }` | `{ ok: true, chunks: number }` or `500 error string` | `callIngestText()` |
| `POST /chatRag` | POST | `{ message: string }` | `{ answer: string, topChunks: [{id, sourceType, sourceName, score}] }` or `500 error string` | `callChatRag()` |
| `GET /*` (catch-all) | GET | — | `index.html` | Browser navigation |

No separate endpoints for images or audio. Both go through `/ingestText` with different `sourceType` values.

---

## STEP 13 — FRONTEND WORKING

### File structure
- `index.html` — 1689 lines total
  - Lines 21–~960: CSS styles
  - Lines ~962–1167: HTML structure
  - Lines 1170–1686: JavaScript

### Three CDN libraries loaded at top of `<head>`
```html
<script src="tesseract.js@5">         <!-- OCR -->
<script src="pdf.min.js">             <!-- PDF parsing -->
<script src="mammoth.browser.min.js"> <!-- DOCX parsing -->
```

### UI layout
```
.app
├── .sidebar           ← logo, navigation, indexed file chips, system status
└── .main-col
    ├── .topbar        ← title, status pill, icon buttons
    └── .workspace
        ├── .knowledge-panel  ← 3 source cards: Documents, Images, Audio
        └── .chat-panel
            ├── .messages-area  ← chat bubbles
            └── .composer-wrap  ← textarea + send button
```

### Document upload UI flow
```
1. uploadTextBtn.disabled = true
2. uploadTextBtn.innerHTML = "<span>⏳</span> Indexing…"
3. docProgress.classList.add("visible")   ← animated progress bar
4. await callIngestText(text, "doc", fileName)
5a. SUCCESS: setStatus(docStatus, "✓ Indexed successfully", "success")
             addIndexedFile(fileName, "doc")   ← chip added to sidebar
5b. ERROR:   setStatus(docStatus, "✗ " + e.message, "error")
6. finally:  uploadTextBtn.disabled = false
             uploadTextBtn.innerHTML reset
             docProgress.classList.remove("visible")
```

### Chat send flow
```javascript
async function sendChat() {
  const msg = chatInput.value.trim();   // read input
  addChatMessage(msg, "user");          // render user bubble
  chatInput.value = "";                 // clear input
  sendChatBtn.disabled = true;          // prevent duplicate sends
  showTyping();                         // show animated "Thinking…" indicator
  try {
    const resp = await callChatRag(msg);  // POST /chatRag
    removeTyping();
    addChatMessage(resp.answer || "(no answer)", "bot");
  } catch (e) {
    removeTyping();
    addChatMessage("Error: " + e.message, "bot", true);  // error bubble
  } finally {
    sendChatBtn.disabled = false;       // always re-enable
  }
}
```

### Indexed files tracker (sidebar)
- `indexedFiles = []` — local JS array (not persisted)
- `addIndexedFile(name, type)` called on every successful ingestion
- `renderFileList()` updates sidebar DOM with file chips

---

## STEP 14 — BACKEND EXECUTION ORDER

```
1. require("dotenv").config()               ← GEMINI_API_KEY loaded from .env
2. express() app created
3. GoogleGenerativeAI(GEMINI_API_KEY)       ← Gemini client ready
4. getGenerativeModel("gemini-embedding-2") ← embedding model instance
5. ragChunks = [], nextId = 1               ← in-memory store initialised
6. app.use(cors())                          ← all origins allowed
7. app.use(express.json({ limit: "10mb" })) ← JSON body parsing, 10MB cap
8. app.use(express.static("./public"))      ← serves index.html + assets
9. app.post("/ingestText", ...)             ← route registered
10. app.post("/chatRag", ...)               ← route registered
11. app.use(catch-all → sendFile index.html)← SPA fallback
12. app.listen(3000)                        ← server starts
```

### /ingestText execution
```
validate text → validate API key → chunkText(text, 800)
→ batchEmbedContents → push to ragChunks[]
→ res.json({ ok: true, chunks: N })
```

### /chatRag execution
```
validate message → validate API key → greeting check
→ embedContent(message) → cosineSimilarity × all chunks → sort → top5
→ zero-chunk guard → build contextText → build ragPrompt
→ generateWithFallback → extract text
→ res.json({ answer, topChunks })
```

---

## STEP 15 — WHY EACH TECHNOLOGY

### Node.js
Why: JavaScript runtime, same language as frontend.  
Problem solved: Async I/O for Gemini API calls.  
Alternative: Python Flask/FastAPI.

### Express v5
Why: Minimal HTTP framework.  
Problem solved: Route handling, JSON parsing, static serving.  
Alternative: Fastify, Koa.

### Tesseract.js
Why: OCR runs entirely in the browser.  
Problem solved: Read text from images without server upload.  
Alternative: Google Cloud Vision API (requires API key + cost).  
Key advantage: Image stays on user's machine — never uploaded to backend.

### PDF.js
Why: Browser-side PDF parsing.  
Problem solved: Extract text from PDF without server-side library.  
Alternative: Server-side `pdf-parse`.

### Mammoth.js
Why: Browser-side DOCX parsing.  
Problem solved: Extract text from Word documents in the browser.  
Alternative: Server-side `docx` npm package.

### Web Speech API
Why: Built-in browser speech recognition.  
Problem solved: Speech-to-text with no external API or cost.  
Alternative: OpenAI Whisper, Google Cloud Speech (both need API key + server).

### Gemini
Why: Single API key covers both embedding and generation.  
Problem solved: Semantic embeddings + natural language answer generation.  
Alternative: OpenAI (GPT-4 + text-embedding-ada-002).

### RAG
Why: Gemini doesn't know your private documents — RAG injects that knowledge dynamically.  
Problem solved: Grounded, factual answers from user-specific content without fine-tuning.  
Alternative: Fine-tuning (expensive, static), context stuffing (token limits).

### Embeddings
Why: Semantic meaning comparison — "dog" and "canine" are similar even with no common letters.  
Problem solved: Keyword search would fail for paraphrased questions.

### In-memory array
Why: Zero configuration, no database setup.  
Problem solved: Fast development.  
Limitation: All data lost on server restart.

---

## STEP 16 — REALISTIC COMPLETE EXAMPLE

**User uploads a 4000-character PDF about AI.**

1. PDF.js reads it page by page in browser
2. `callIngestText(text, "doc", "ai_report.pdf")`
3. Backend: `chunkText` → 5 chunks of ≤800 chars
4. `batchEmbedContents` → 5 float vectors from `gemini-embedding-2`
5. `ragChunks` = 5 entries with text + embedding
6. "✓ Indexed successfully" shown in UI

**User asks: "What is machine learning?"**

1. `callChatRag("What is machine learning?")`
2. Backend: `embedContent("What is machine learning?")` → queryEmbedding
3. `cosineSimilarity(queryEmbedding, chunk[i].embedding)` for all 5 chunks
4. Scores: [0.91, 0.72, 0.68, 0.45, 0.33] → top 5 selected
5. Context:
   ```
   [#1 | doc:ai_report.pdf | score=0.910]
   Machine learning is a subset of artificial intelligence that...
   ```
6. RAG prompt built and sent to `gemini-3.5-flash-lite`
7. Gemini: "Machine learning is a branch of AI where systems learn patterns from data..."
8. `res.json({ answer: "...", topChunks: [{...}] })`
9. Chat bubble appears in UI with the answer

---

## STEP 17 — MULTIMODAL EXAMPLE (All 3 Modalities)

**PDF:** Climate change report → indexed as `sourceType: "doc"`

**Image:** Screenshot of CO₂ chart → Tesseract reads "CO₂ levels rose by 2.5ppm in 2023" → indexed as `sourceType: "image"`

**Audio:** User speaks "Global warming accelerated in the last decade" → Web Speech API transcribes → indexed as `sourceType: "audio"`

**All three are now in `ragChunks[]` as plain text with embeddings.**

**User asks: "How fast is CO₂ rising?"**

- Cosine similarity computed against ALL chunks from all three sources
- Image OCR chunk: score 0.94 (contains "CO₂ levels rose by 2.5ppm")
- Audio chunk: score 0.78 ("accelerated" is semantically related)
- PDF chunk: score 0.61
- All three in top-5 context block
- Gemini answers using data from all three source types simultaneously

**This is Multimodal RAG:** Three input modalities → unified text index → one retrieval pipeline → one coherent answer.

---

## STEP 18 — ACTUAL LIMITATIONS

| Limitation | Detail |
|---|---|
| Data lost on restart | `ragChunks[]` is RAM — server restart wipes everything |
| No persistent storage | Firestore was removed; current code has no database |
| OCR accuracy | Tesseract.js struggles with handwriting, low-res scans, complex layouts |
| Image understanding | System reads text FROM images, does NOT understand images visually |
| Speech accuracy | ~90% for clear English; fails on accents, background noise, technical terms |
| English only | `recognition.lang = "en-US"` hardcoded |
| No chunk overlap | Sequential 800-char slices; sentences at boundaries may lose context |
| Linear search | O(N×D) similarity — fine for small collections, slow for millions |
| No multimodal vision | Gemini never sees the image; only OCR text enters the pipeline |
| 10MB body limit | `express.json({ limit: "10mb" })` — very large documents may fail |
| No user isolation | All users share one `ragChunks[]` — no per-user filtering |
| No authentication | Any request to port 3000 can ingest or query |
| No rate limiting | Spam requests can exhaust Gemini API quota |
| Gemini dependency | If Gemini API is unreachable, entire system fails |

---

## STEP 19 — SECURITY

### Secure practices in current code
- API key in `.env`, not hardcoded in source
- Input validation on both endpoints (missing text/message check)
- 10MB body limit prevents oversized payload attacks

### Potential risks

| Risk | Detail |
|---|---|
| `.env` committed to Git | If pushed to GitHub, API key is exposed publicly |
| CORS open | `cors()` with no origin argument allows all websites |
| No authentication | Any browser reaching localhost:3000 can use the system |
| No rate limiting | No protection against API quota exhaustion |
| Shared memory store | One user's content mixed with all others |
| No HTTPS | Plain HTTP on port 3000 (acceptable for localhost only) |

---

## STEP 20 — VIVA PREPARATION

### A. 20 Basic Questions

**Q1: What is this project?**
A Multimodal RAG Chatbot — a web app that lets you upload documents, images, and audio, then ask questions about them and get AI-generated answers grounded in your content.

**Q2: What does RAG stand for?**
Retrieval-Augmented Generation. Retrieve relevant content → augment AI with it → generate an answer.

**Q3: What file types are supported?**
.txt, .pdf, .docx (text), images (any format for OCR), and audio via microphone.

**Q4: Which AI model powers the chatbot?**
Google Gemini: `gemini-embedding-2` for vectors, `gemini-3.5-flash-lite` (primary) and `gemini-3.5-flash` (fallback) for generation.

**Q5: What language is the backend?**
JavaScript (Node.js) with Express v5.

**Q6: What is the frontend built with?**
Vanilla HTML, CSS, and JavaScript — no React or Angular framework.

**Q7: Where is data stored?**
In a JavaScript array `ragChunks[]` in server RAM. Lost on restart.

**Q8: What is OCR?**
Optical Character Recognition — reads printed text from images. Tesseract.js runs this in the browser.

**Q9: Which library handles PDF text extraction?**
PDF.js v3.11.174, running in the browser.

**Q10: Which library handles DOCX extraction?**
Mammoth.js, running in the browser.

**Q11: How does speech recognition work?**
Browser's built-in Web Speech API converts mic audio to text in real time.

**Q12: What is an embedding?**
A long list of numbers representing the meaning of text. Similar meanings → similar numbers.

**Q13: What is cosine similarity?**
A formula measuring vector similarity, returning 0 (unrelated) to 1 (identical meaning).

**Q14: How many chunks are retrieved per question?**
Top 5, sorted by highest cosine similarity score.

**Q15: What is the chunk size?**
800 characters maximum, no overlap.

**Q16: What are the two API endpoints?**
`POST /ingestText` and `POST /chatRag`.

**Q17: What port does the server run on?**
Port 3000 (configurable via `process.env.PORT`).

**Q18: Is Firestore used?**
No. The active `server.js` uses an in-memory array. Firestore code exists only in the legacy `functions/` directory.

**Q19: What happens if Gemini is overloaded?**
Primary model tried for 8 seconds, then fallback model tried for 8 seconds. If both fail, a clear error is returned immediately.

**Q20: What makes it multimodal?**
Three input types — text (documents), visual (images via OCR), audio (speech) — all converted to text and entering the same RAG pipeline.

---

### B. 20 Technical Questions

**Q1: Explain the PDF upload data flow.**
PDF.js reads it page by page in the browser, extracting text items. Full text is POST'd to `/ingestText`. `chunkText()` splits into ≤800-char segments. `batchEmbedContents()` creates float vectors. Each chunk is pushed to `ragChunks[]`.

**Q2: How is cosine similarity computed?**
`dot(a,b) / (|a| * |b|)`. In code: `sum(a[i]*b[i])` for dot product, `sqrt(sum(a[i]²))` for magnitudes. Implemented at server.js lines 37–49.

**Q3: Structure of each item in ragChunks?**
`{ id: string, text: string, embedding: number[], sourceType: "doc"|"image"|"audio", sourceName: string, createdAt: number }`

**Q4: Query vs document embeddings?**
Documents: `batchEmbedContents` (bulk batch). Query: `embedContent` (single call). Both use `gemini-embedding-2`, same vector space, so similarity can be computed between them.

**Q5: RAG prompt structure?**
System instructions (helpful, grounded, concise) + "User question: [query]" + "Context: [top5 chunks with source and score]". See server.js lines 283–293.

**Q6: How does greeting detection work?**
Regex `/^(hi+|hello+|hey+|yo+|sup|good (morning|evening|afternoon|night))\b/` on lowercased message. If matches AND wordCount ≤ 5, RAG is skipped entirely and Gemini handles the greeting directly.

**Q7: What happens if ragChunks is empty when user asks?**
`topK.length === 0` → `res.json({ answer: "No relevant content found in the indexed document.", topChunks: [] })`. No Gemini call made.

**Q8: How does the 8-second timeout work?**
`Promise.race([tryModel(...), new Promise(reject after 8000ms)])`. If Gemini doesn't respond in 8s, the timeout Promise wins and the catch block runs immediately.

**Q9: How is CORS handled?**
`app.use(cors())` with no arguments — all origins allowed. Package: `cors` v2.8.5.

**Q10: Why `express.json({ limit: "10mb" })`?**
OCR text or large PDF extracts can produce multi-MB strings. Express's default limit would reject them.

**Q11: Chat mic vs knowledge panel mic?**
Chat mic: `continuous:false, interimResults:false` — single utterance → chat input. Knowledge panel mic: `continuous:true, interimResults:true` — continuous recording → transcript buffer for ingestion.

**Q12: What if Tesseract finds no text?**
`if (!text.trim())` → `setStatus(ocrStatus, "✗ No text detected", "error")`. Backend is NOT called.

**Q13: How are indexed files tracked in sidebar?**
Local `indexedFiles = []` array. `addIndexedFile(name, type)` on success → `renderFileList()` updates DOM.

**Q14: What is `FUNCTIONS_BASE`?**
Set to `""` (empty string) → all fetches use relative URLs. Legacy variable for switching between local and Firebase Functions.

**Q15: Auto-resize textarea?**
On `input` event: `height = "auto"` to recalculate, then `height = min(scrollHeight, 150) + "px"`.

**Q16: What does `nextId` do?**
Integer counter starting at 1, incremented for each chunk: `id: String(nextId++)`. Unique sequential ID within the server session.

**Q17: Are embedding and generation models the same?**
No. `gemini-embedding-2` = embedding only, no text generation. `gemini-3.5-flash-lite` = generative only, no embeddings.

**Q18: Difference between `batchEmbedContents` and `embedContent`?**
`batchEmbedContents`: multiple texts in one API call (ingestion). `embedContent`: single text (query time). Both return the same type of float vector.

**Q19: How does the SPA catch-all work?**
After all API routes, `app.use((req, res) => res.sendFile("index.html"))` returns the frontend for any unmatched GET — allows browser navigation without 404.

**Q20: Can multiple users use the same instance?**
Yes, but they share one `ragChunks[]`. No user isolation. One user's documents are visible to all other users' queries.

---

### C. 15 Difficult Examiner Questions

**Q1: Why is there no chunk overlap? What are the consequences?**
`chunkText` uses `start += maxChars` — no overlap. A sentence straddling the 800-char boundary is split between two chunks. If neither chunk individually makes the top-5, that sentence's context is lost.

**Q2: What is the time complexity of your retrieval?**
O(N × D) — N = number of chunks, D = embedding dimensions. Every query compares against every chunk. This is linear scan, fine for demo scale, but would need ANN indexing (FAISS, HNSW) for large collections.

**Q3: Why are all chunks in one flat array?**
Simplicity. Implication: queries about one document may retrieve chunks from a different, unrelated document if their embeddings coincidentally align.

**Q4: Is Firestore actually used?**
No. Active `server.js` uses only `ragChunks[]` in RAM. The Firestore code in `functions/index.js` is not running.

**Q5: What if you sent the whole document to Gemini instead of RAG?**
Context window limits would truncate very large documents. Cost scales with token count. Responses may include irrelevant information. RAG constrains Gemini to the 5 most relevant chunks.

**Q6: How would you make storage persistent?**
Options: write `ragChunks[]` to a JSON file on disk; use SQLite; use PostgreSQL + pgvector; use Pinecone, Weaviate, or Chroma (managed vector DBs); or restore the original Firestore implementation.

**Q7: Can this system describe what an image looks like?**
No. It can only answer questions about text extracted by OCR. A photo with no printed text cannot be indexed. True visual reasoning would require sending the image directly to a multimodal Gemini model (e.g., `gemini-pro-vision`), which this system does not do.

**Q8: API key security?**
In `.env` (not hardcoded) — good practice. If `.env` is committed to Git, the key is publicly exposed. No rotation or secrets manager is implemented.

**Q9: Why use `Promise.race` for timeout?**
A 503 response from Gemini can itself take 5–10 seconds to arrive. `Promise.race` enforces the 8-second limit regardless of how slowly Gemini returns the error response.

**Q10: How would you add multi-user support?**
Add a `userId` field to each chunk. Filter `ragChunks.filter(c => c.userId === currentUser)` in `/chatRag`. Add session authentication (JWT). Use a per-user Firestore collection or separate in-memory map keyed by userId.

**Q11: Why is file parsing done in the browser?**
PDF.js, Mammoth.js, Tesseract.js — all run in the browser. The binary file never leaves the user's machine. Only extracted text is sent to the backend, reducing bandwidth and improving privacy.

**Q12: What is BM25 and how does it differ from your approach?**
BM25 is a keyword-frequency ranking algorithm. It matches exact words. "Machine learning" and "ML" would not match. Cosine similarity on embeddings understands semantic meaning — paraphrased questions work correctly.

**Q13: If the greeting regex is too broad, what breaks?**
A query like "Hello, what does the document say about climate?" (word count > 5) would pass through to RAG correctly. But "Hello explain climate" (3 words after "hello", total 5) would be treated as a greeting and skip RAG — potentially giving a wrong response. The `wordCount <= 5` guard is critical.

**Q14: What is the maximum document size?**
Bounded by: browser RAM (large PDFs may crash PDF.js), the 10MB JSON body limit in Express, and Gemini batch embedding limits. No explicit character count limit is coded.

**Q15: Why does the greeting path call Gemini at all?**
To generate a natural, human-like greeting response explaining the bot's capabilities, rather than returning a hardcoded static string. The system falls back to the hardcoded string if Gemini fails.

---

### D–L. Strong Interview Answers

**D. "Why RAG?"**
Traditional chatbots either hallucinate (make up answers) or know nothing about private documents. RAG solves both problems dynamically: at upload time, documents are indexed; at query time, only the most relevant 5 chunks are given to Gemini as grounding context. This prevents hallucination, works with any document uploaded at runtime, and is cost-efficient — I send ≤5 chunks, not the entire document, to Gemini.

**E. "Why Gemini?"**
Gemini provides both a high-quality embedding model (`gemini-embedding-2`) and a state-of-the-art generative model (`gemini-3.5-flash-lite`) under one API key. This eliminates the need to maintain credentials for two separate AI providers. The official Node.js SDK is well-documented, and Gemini has a free tier appropriate for a demo-scale project.

**F. "Why Firestore?" (original design — now replaced)**
Firestore was originally chosen because it is a serverless, auto-scaling NoSQL document database from Google, pairs naturally with Firebase Cloud Functions, and stores arbitrary JSON. For the current deployment, it was replaced with an in-memory array to remove cloud infrastructure dependencies during development.

**G. "Why embeddings?"**
Keyword search fails when the question uses different words than the document. For example, "What is ML?" would not match a document that says "machine learning." Embeddings solve this by representing semantic meaning as mathematical vectors. Two semantically similar texts produce nearby vectors regardless of the exact words used — this is fundamental to making RAG work reliably.

**H. "Why Tesseract.js?"**
Tesseract.js runs the Tesseract OCR engine in the browser via WebAssembly. This means images are processed entirely on the client side — no server upload, no API key, no cost, and the raw image stays on the user's device. The only trade-off vs. cloud OCR (Google Vision, AWS Textract) is lower accuracy on handwriting and complex layouts.

**I. "Why Web Speech API?"**
It is built into modern browsers (Chrome, Edge) at zero cost with no external API key. It provides real-time speech-to-text with low latency. The alternative — OpenAI Whisper or Google Cloud Speech — requires a server-side integration and incurs per-minute API costs. For a demo, the browser's built-in API is the most pragmatic choice.

**J. "What makes it multimodal?"**
Multimodal means multiple input types. My system accepts: (1) text documents (PDF/DOCX/TXT) parsed by browser-side libraries; (2) images processed through Tesseract.js OCR; (3) speech captured by the Web Speech API. All three modalities are converted to text and stored in the same vector index. A question can retrieve context from all three modalities simultaneously in one answer.

**K. "How does your RAG pipeline work?"**
When a document is uploaded, the browser extracts the text and sends it to `/ingestText`. The backend splits it into 800-character chunks and converts each to a float vector using `gemini-embedding-2`. When the user asks a question, `/chatRag` embeds the question the same way, computes cosine similarity against every stored chunk, selects the top 5, and injects them as context into a structured prompt sent to `gemini-3.5-flash-lite`. Gemini's response is extracted and returned as JSON, and the frontend renders it as a chat bubble.

**L. "What happens internally when a user asks a question?"**
The frontend captures the text from `#chatInput`, calls `fetch POST /chatRag`, shows a "Thinking…" animation, and awaits the response. The backend checks if it is a greeting — if so, Gemini answers directly. Otherwise, it embeds the question, scores all stored chunks by cosine similarity, takes the top 5, formats them into a RAG prompt, and calls `generateWithFallback` which tries `gemini-3.5-flash-lite` with an 8-second timeout, then falls back to `gemini-3.5-flash`. The extracted answer is returned as `{ answer, topChunks }`. The frontend removes the typing indicator and renders the answer bubble.

---

## STEP 21 — SIMPLE EXPLANATIONS

### In 1 minute
My project is like giving a brain to your files. You upload a document, a photo, or speak into the microphone. The system reads what's inside. Then you ask it questions in plain English and it finds the answer from your own files — not from the internet, not made up.

### In 3 minutes
When you upload a file, the system doesn't just store it — it understands it. It breaks the text into small pieces called chunks, then converts each chunk into numbers that capture its meaning (called an embedding). These numbers are stored in memory.

When you ask a question, the system converts your question into numbers too, using the same method. It then finds which stored chunks have the most similar numbers — meaning the most similar meaning — and picks the top 5.

Those top 5 chunks are given to Gemini — Google's AI — along with your question. Gemini reads the context and writes a clear, natural answer.

The "multimodal" part means you're not limited to text: images work via Tesseract OCR (which reads printed text in photos), and speech works via the browser's built-in microphone. All three types enter the same system.

### Technically
The backend is Node.js + Express. On ingestion: text → `chunkText(800)` → `batchEmbedContents(gemini-embedding-2)` → `ragChunks[]`. At query time: `embedContent(question)` → cosine similarity against all chunks → top-5 → RAG prompt → `generateWithFallback(gemini-3.5-flash-lite, fallback: gemini-3.5-flash)` → `{ answer, topChunks }`. Frontend is vanilla HTML/JS. PDF.js, Mammoth.js, and Tesseract.js process files entirely browser-side.

---

## STEP 22 — FINAL SUMMARY

| Field | Value |
|---|---|
| Project Name | Multimodal RAG Chatbot |
| Goal | Answer questions about user-uploaded private content using AI |
| Features | TXT/PDF/DOCX upload, Image OCR, Microphone transcription, RAG chat |
| Frontend | Vanilla HTML + CSS + JavaScript (`public/index.html`, 1689 lines) |
| Backend | Node.js + Express v5 (`server.js`, 346 lines) |
| Database | In-memory array `ragChunks[]` (reset on server restart) |
| Generation Model | `gemini-3.5-flash-lite` (primary), `gemini-3.5-flash` (fallback) |
| Embedding Model | `gemini-embedding-2` |
| OCR | Tesseract.js v5 (browser-side, free) |
| Speech Recognition | Web Speech API (browser built-in) |
| PDF Parsing | PDF.js v3.11.174 (browser-side) |
| DOCX Parsing | Mammoth.js (browser-side) |
| RAG | Cosine similarity, top-5 chunks, structured prompt injection |
| Chunk Size | 800 characters, no overlap |
| Languages | JavaScript (Node.js backend + browser frontend) |
| Libraries | `@google/generative-ai`, `express`, `cors`, `dotenv` + 3 CDN libs |
| API Endpoints | `POST /ingestText`, `POST /chatRag` |
| Main Advantages | No DB setup, client-side parsing preserves privacy, multimodal, fast |
| Main Limitations | Data lost on restart, no user isolation, OCR text-only, English only |

---

> **FINAL PROJECT UNDERSTANDING**
>
> This is a working, self-contained AI chatbot that you can teach by uploading your own files. It combines three modern AI techniques: embeddings (understand meaning), RAG (retrieve relevant content), and Gemini (write the answer). It is multimodal because it accepts text, images, and voice — all converted to plain text and processed identically. All file parsing happens in the browser for privacy. The backend is a 346-line Node.js server. When working correctly, it responds in 1–3 seconds.
>
> The single most important fact to know: **every input type — document, image, audio — is ultimately converted to text, chunked, embedded, and stored in the same flat array. The RAG pipeline treats them all equally.**
