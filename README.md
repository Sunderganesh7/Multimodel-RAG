
# Multimodal RAG Chatbot

> A modern AI-powered knowledge assistant that understands documents, images, and voice input using Retrieval-Augmented Generation (RAG).

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Backend-orange.svg)](https://firebase.google.com/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-AI-blue.svg)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Overview

**Multimodal RAG Chatbot** is an AI-powered conversational knowledge assistant designed to interact with multiple types of user-provided content.

Instead of relying only on general AI knowledge, the system processes uploaded content, extracts meaningful information, stores it for retrieval, and uses the retrieved context to generate more relevant responses.

The application supports:

- Text documents
- PDF documents
- DOCX documents
- Images with OCR-based text extraction
- Microphone input converted into text
- Context-aware AI conversations
- Retrieval-Augmented Generation (RAG)

---

## Key Features

### Document Processing

Upload and process:

- `.txt`
- `.pdf`
- `.docx`

The application extracts text from uploaded documents, divides the content into smaller chunks, generates embeddings, and stores the processed information for retrieval.

### Image OCR

Images can be uploaded and processed using **Tesseract.js**.

The OCR pipeline extracts readable text from images and makes that information available to the chatbot for contextual questioning.

### Voice Input

The application supports microphone-based input using the **Web Speech API**.

Users can speak naturally instead of manually typing their questions.

### Retrieval-Augmented Generation

The chatbot follows a RAG-based workflow:

```text
User Upload
     ↓
Content Extraction
     ↓
Text Processing & Chunking
     ↓
Embedding Generation
     ↓
Knowledge Storage
     ↓
User Query
     ↓
Relevant Context Retrieval
     ↓
Gemini
     ↓
Context-Aware Response
```

This approach helps the assistant generate responses based on the user's uploaded knowledge.

### Conversational AI

Users can ask questions about their uploaded documents, images, and extracted content through a conversational interface.

### Modern User Interface

The application provides a clean and modern interface featuring:

- Dark-themed workspace
- Glassmorphism-inspired components
- Responsive layout
- Knowledge Base panel
- AI chat interface
- Document and image upload areas
- Real-time interaction

---

## Supported Input Types

| Input | Processing |
|---|---|
| TXT | Text extraction |
| PDF | PDF text extraction |
| DOCX | DOCX text extraction |
| Image | OCR using Tesseract.js |
| Voice | Speech-to-text using Web Speech API |

---

## Technology Stack

### Frontend

- HTML5
- CSS3
- JavaScript
- Tesseract.js
- PDF.js
- Mammoth.js
- Web Speech API

### Backend

- Node.js
- Express.js
- Firebase Functions
- Firestore

### Artificial Intelligence

- Google Gemini
- Gemini Embeddings
- Retrieval-Augmented Generation (RAG)

### Infrastructure

- Firebase
- Firebase Hosting
- Firebase Functions
- Firestore

---

## System Architecture

```text
                         ┌─────────────────────┐
                         │        User         │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    Web Interface    │
                         │   HTML / CSS / JS   │
                         └──────────┬──────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  ▼                  ▼
          ┌────────────┐     ┌────────────┐     ┌────────────┐
          │ Documents  │     │   Images   │     │   Voice    │
          │ TXT/PDF/   │     │   OCR      │     │ Speech API │
          │ DOCX       │     │ Tesseract  │     │            │
          └──────┬─────┘     └──────┬─────┘     └──────┬─────┘
                 │                  │                  │
                 └──────────────────┼──────────────────┘
                                    ▼
                         ┌─────────────────────┐
                         │ Content Processing  │
                         │ Chunking / Parsing  │
                         └──────────┬──────────┘
                                    ▼
                         ┌─────────────────────┐
                         │ Gemini Embeddings   │
                         └──────────┬──────────┘
                                    ▼
                         ┌─────────────────────┐
                         │     Firestore       │
                         │ Knowledge Storage   │
                         └──────────┬──────────┘
                                    │
                              Retrieval
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Google Gemini     │
                         │   Response Engine   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    AI Response      │
                         └─────────────────────┘
```

---

## Project Structure

```text
Multimodel-RAG/
│
├── public/
│   ├── index.html
│   └── 404.html
│
├── functions/
│   ├── index.js
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
│
├── .github/
│   └── workflows/
│
├── server.js
├── package.json
├── package-lock.json
├── firebase.json
├── .firebaserc
├── .gitignore
├── .env.example
├── README.md
└── PROJECT_REPORT.md
```

---

## Getting Started

### Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/)
- npm
- Firebase CLI
- A Google Gemini API key

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Sunderganesh7/Multimodel-RAG.git
cd Multimodel-RAG
```

### 2. Install dependencies

```bash
npm install
```

For Firebase Functions:

```bash
cd functions
npm install
cd ..
```

### 3. Configure environment variables

Create a `.env` file locally.

```env
GEMINI_API_KEY=your_api_key_here
```

> Never commit `.env` or expose API keys in frontend code.

---

## Running Locally

Start the application with:

```bash
npm start
```

The application will be available at:

```text
http://localhost:3000
```

For Firebase Emulator-based development:

```bash
firebase emulators:start
```

---

## Deployment

### Render

The application can be deployed as a Node.js Web Service on Render.

Use:

```text
Build Command:
npm install

Start Command:
npm start
```

Add the following environment variable in the Render dashboard:

```text
GEMINI_API_KEY=your_api_key
```

The API key should be stored only as a server-side environment variable.

### Firebase

Firebase deployment can also be performed using:

```bash
firebase deploy --only "functions,hosting"
```

---

## Security

API credentials are intentionally kept outside the source code.

Environment variables are used for sensitive configuration:

```javascript
process.env.GEMINI_API_KEY
```

The repository excludes local environment files using `.gitignore`.

Never place secret API keys inside:

- `public/`
- frontend JavaScript
- `README.md`
- source code
- GitHub repositories
- `.env.example`

---

## How RAG Works

The application's Retrieval-Augmented Generation workflow can be summarized as:

### 1. Upload

The user uploads a document, image, or other supported input.

### 2. Extraction

The application extracts useful information from the uploaded content.

### 3. Chunking

Extracted text is divided into smaller chunks for efficient processing.

### 4. Embeddings

Text chunks are converted into vector representations using Gemini embeddings.

### 5. Storage

Processed information is stored in the knowledge base.

### 6. Query

The user asks a question about the uploaded content.

### 7. Retrieval

Relevant information is retrieved from the knowledge base.

### 8. Generation

The retrieved context is provided to Gemini to generate the final response.

---

## Example Use Cases

The chatbot can be used for:

- Studying from lecture notes
- Question answering over PDFs
- Research document exploration
- Extracting text from images
- Document-based AI assistance
- Knowledge-base querying
- Voice-driven information retrieval

---

## Future Improvements

Potential future enhancements include:

- Multi-user authentication
- Advanced vector search
- Conversation history
- Source citations
- Better document management
- Streaming AI responses
- Additional multimodal formats
- Improved retrieval and ranking
- Cloud-based persistent storage
- Role-based access control

---

## Screenshots

Add screenshots of your application here.

```text
docs/
├── dashboard.png
├── document-upload.png
└── ai-chat.png
```

Example:

<img width="1915" height="868" alt="image" src="https://github.com/user-attachments/assets/50e2ec20-2809-4dfa-8008-3cc5939caa5e" />


---

## Technologies & Libraries

This project makes use of the following technologies:

- Google Gemini
- Firebase
- Firestore
- Node.js
- JavaScript
- Tesseract.js
- PDF.js
- Mammoth.js
- Web Speech API

---

## Credits

Built using:

- Google Gemini for AI capabilities
- Firebase and Firestore for backend infrastructure and storage
- Tesseract.js for OCR
- PDF.js for PDF processing
- Mammoth.js for DOCX processing
- Web Speech API for voice input

---

## License

This project is available under the MIT License.

See the `LICENSE` file for more information.

---

## Repository

GitHub:

https://github.com/Sunderganesh7/Multimodel-RAG

---

## Author

Developed as a multimodal AI and Retrieval-Augmented Generation project.
```

### One thing I would change from your old README

Your old README says:

```text
AI: Gemini 2.0 Flash + text-embedding-004
```

but your actual terminal output showed the application trying `gemini-3.5-flash-lite`. Pasted text

So the new README deliberately says **Google Gemini** rather than advertising a potentially outdated model name.

Also, your current application is successfully starting with:

```text
npm start
→ node server.js
→ port 3000
```

which is why the Render deployment section above uses `npm install` and `npm start`. Pasted text

This version will look much more professional on GitHub and in a placement/project portfolio.
