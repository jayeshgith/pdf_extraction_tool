# DocuVerse AI — Document Extraction & Chat Client (Frontend)

Welcome to the frontend interface of **DocuVerse AI**. 

As a developer who spent the last few years mastering React, Next.js, and client-side experiences, I wanted to build a premium, high-fidelity user experience for our AI document extraction tool. 

AI is only as good as the interface the user interacts with. If an OCR is slow or the LLM data is buried in raw JSON, the user gets frustrated. I designed this frontend client to make AI data extraction feel **instant, interactive, and beautifully accessible**.

---

## 🎨 My UI/UX Design Process & Thinking

When building this frontend, I focused heavily on solving standard AI user experience challenges:

### 1. The "Loading State" Challenge (Real-Time Visual Feedback)
OCR and AI processing takes a few seconds. In many tools, users are left staring at a static loading spinner, wondering if the app has crashed. 
* **My Solution**: I designed a **step-by-step progress visualizer**. When a user uploads a document, the UI transitions to a processing state, allowing them to see the document status change in real time. 

### 2. Blended Document Preview & Edit Pane (The "Source of Truth")
AI models are smart, but they make mistakes. In a professional workflow, a human must be able to verify and correct the extracted data.
* **My Solution**: On the **Extraction Details Page**, I built a dual-pane layout:
  * **Left Side**: A dynamic document preview window showing the uploaded file.
  * **Right Side**: An interactive form displaying the extracted fields (with their confidence scores). 
This allows users to instantly compare the extracted data against the physical document and **manually correct any field** in place, saving the changes back to MongoDB.

### 3. Contextual RAG Chat Interface
A chat interface can feel dull if it's just a blank text box.
* **My Solution**: I designed a dedicated conversational UI supporting:
  * Quick-prompt pills (e.g., *"Summarize this resume,"* or *"What is the invoice total?"*) to guide the user.
  * Clean, markdown-rendered bot bubbles that clearly display the answers retrieved from the local LLM.

---

## 🛠️ The Tech Stack

* **Build Tool**: **Vite** (for blazing-fast development server and bundle optimization).
* **Core Library**: **React.js** (functional components and hooks).
* **Routing**: **React Router DOM** (managing protected pages for logged-in users and public auth flows).
* **Global State**: **React Context API** (handling user sessions and auth tokens via `AuthContext`).
* **Styling**: Tailored, modern CSS layouts focusing on premium aesthetics, clean spacing, and mobile responsiveness.

---

## 📂 Component & Page Architecture

I kept the code highly modular and organized so that it is easy to maintain and scale:
* `src/pages/UploadPage.jsx`: The upload zone, supporting file drop zones and type validation.
* `src/pages/ExtractionPage.jsx`: The split-pane workspace for reviewing, validating, and editing extracted fields.
* `src/pages/DocumentListPage.jsx`: A management dashboard where users can search, filter, and view their history.
* `src/pages/ChatPage.jsx`: The conversational playground to chat with documents locally.
* `src/layouts/Layout.jsx`: A consistent navigation and sidebar wrapper.

---

## 🚀 Quick Setup (How to run locally)

### Prerequisites
Make sure you have **Node.js (v18+)** and **npm** installed.

### 1. Navigate to the Frontend directory
```bash
git clone https://github.com/jayeshgith/pdf_extraction_tool.git
cd pdf_extraction_tool
```

### 2. Install Packages
```bash
npm install
```

### 3. Start the Development Server
```bash
npm run dev
```
* Open your browser and navigate to `http://localhost:5173` to explore the application!
