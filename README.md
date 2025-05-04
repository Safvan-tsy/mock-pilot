# Mock Pilot – AI Autofill Browser Extension 🚀

An AI-powered browser extension that intelligently fills out web forms with realistic sample data — perfect for developers, testers, and QA workflows.

## 🔍 Features

- Context-aware autofill using:
  - Input field names
  - Placeholder, label, title, aria-* attributes
  - Nearby text and section headers
- Uses OpenAI API to generate realistic sample input
- Secure: users connect with their own API key
- Lightweight and fast – works on most standard forms

> 🧪 Currently supports only **OpenAI** as a provider.  
> ✨ Want to add support for **Gemini**, **Claude**, or others?  
> 👉 [Contribute via PR](https://github.com/Safvan-tsy/mock-pilot)!

---

## ⚙️ Tech Stack

- React (TypeScript)
- TailwindCSS
- Vite (for bundling)

---

## 🛠️ Development Setup

1. Clone the repository  
   `https://github.com/Safvan-tsy/mock-pilot`
2. Install dependencies  
   `npm install`
3. Build in watch mode  
   `npm run watch`
4. Load the extension:
   - Open `chrome://extensions/`
   - Enable **Developer Mode**
   - Click **Load unpacked**
   - Select the `dist/` directory

---

## 🔐 Configuration

To use the extension:
1. Open the extension popup
2. Select Provider, Model and Enter your **API key**
3. Enable the extension toggle

The key is stored locally and never sent to any third-party server.


## 📦 Build for Production

To create a production build:
```bash
npm run build

