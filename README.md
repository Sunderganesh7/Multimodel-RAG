# 📘 Multimodal RAG Chatbot  
*A simple, modern chatbot that can understand text, images & audio — built with Firebase, Firestore, Gemini & OCR.*

## 🌟 Overview  
This project is a **Multimodal RAG (Retrieval-Augmented Generation) Chatbot** that lets you:

- Upload **text files**, **PDFs**, and **DOCX documents**  
- Upload **images** (text extracted with OCR)  
- Speak using your **microphone** (audio → text)  
- Chat with your uploaded content using **Gemini 2.0**  
- Enjoy a clean, modern, minimal UI  

## ✨ Features

### 🔡 Text Ingestion  
- Supports `.txt`, `.pdf`, `.docx`  
- Extracts text client-side  
- Splits into chunks + embeds using Gemini  
- Stores everything in Firestore for retrieval

### 🖼️ Image OCR  
- Extracts text using **Tesseract.js**  

### 🎙️ Audio → Text  
- Uses **Web Speech API**  

### 💬 RAG Chat Interface  
- Queries your uploaded content using Gemini  
- Friendly conversational tone  
- Minimal hallucinations through context grounding  

### 🎨 Modern UI  
- Glassmorphism cards  
- Gradient background  
- Clean layout  

## 🛠️ Tech Stack
- **Frontend:** HTML, CSS, JS, Tesseract.js, PDF.js, Mammoth.js  
- **Backend:** Firebase Functions (Node 20), Firestore  
- **AI:** Gemini 2.0 Flash + text-embedding-004  
- **Infra:** Firebase Hosting + Emulators  

## 🚀 Getting Started (Local)

### 1. Clone the repo  
```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

### 2. Install Firebase CLI  
```bash
npm install -g firebase-tools
```

### 3. Install function dependencies  
```bash
cd functions
npm install
```

### 4. Add .env inside `functions`
```
GEMINI_API_KEY=your_key_here
```

### 5. Start emulators  
```bash
firebase emulators:start
```

## 🌐 Deploy
```bash
firebase deploy --only "functions,hosting"
```

## 📂 Structure
```
/public
/functions
firebase.json
```

## 🤝 Credits
Firebase, Gemini, Tesseract.js, PDF.js, Mammoth.js

