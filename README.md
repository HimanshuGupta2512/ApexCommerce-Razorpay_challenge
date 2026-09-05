# ApexCommerce ⚡️ Razorpay AI Buildathon

> **Track 1: AI Growth & Agentic Commerce**  
> Engineered for the Razorpay AI Buildathon to demonstrate secure agent-to-agent commerce and conversational checkout.

ApexCommerce is a next-generation conversational storefront that bridges the gap between natural language AI and deterministic, highly secure financial transactions. It demonstrates how AI can independently search inventory, dynamically render UI cards, and strictly stage financial operations without hallucinating prices.

## 🚀 Key Features

* **Conversational In-App Checkout:** Users can ask the AI for products (e.g. *"I want an awesome plastic car"*), and the AI orchestrates the database search, semantic matching, and checkout staging entirely in chat.
* **Gatekeeper Architecture (Zero Hallucination):** The LLM provides natural language understanding, but deterministic TypeScript code controls the money. A strict Gatekeeper intercepts the AI's `stageCheckout` function call, re-verifies inventory, and computes the tax/total outside the LLM.
* **Fail-Closed Security:** The Razorpay Webhook uses strict HMAC SHA-256 verification. Any prompt-injection attacks or spoofed API requests are rejected instantly.
* **Smart UI Orchestration:** The backend parses the AI's text response to intelligently filter and render matching product cards in the UI without hardcoding array indices.
* **Self-Healing Database:** Features a custom initialization script to bypass Vercel's read-only serverless environment, allowing SQLite to run effortlessly in the cloud for demo purposes.

## 🛠 Tech Stack

* **Framework:** Next.js 16 (App Router), React, TypeScript
* **Database & RAG:** Prisma ORM, SQLite (Serverless `/tmp` adaptation)
* **AI Engine:** Google Gemini SDK (`@google/genai`)
* **Payments:** Razorpay Node.js SDK & Checkout.js
* **Styling:** Tailwind CSS v4, Framer Motion, Glassmorphism UI

## ⚙️ Local Setup

1. **Clone & Install**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env.local` file with the following keys:
   ```env
   GEMINI_API_KEY=your_gemini_key
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
   ```

3. **Initialize Database**
   ```bash
   npx prisma generate
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## 🧠 Why This Matters (The Buildathon Context)
NPCI's UAP and global protocol races are making agent-to-agent commerce the open problem of the year. ApexCommerce tackles the hardest part of this problem: **trust**. By separating the LLM's conversational capabilities from the deterministic financial calculations, we prove that AI can handle the entire sales funnel without exposing the merchant to prompt-injection fraud, revenue leakage, or pricing hallucinations. Every money action is explainable, bounded, and gated.
