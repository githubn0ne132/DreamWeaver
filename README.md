<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1eCaqcu4bG-Y0t448O-vf33DbHOyVtzAL

## Run Locally

**Prerequisites:**

- Node.js 18+
- An [OpenAI API key](https://platform.openai.com/)

**Setup & Start**

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure your environment (create `.env.local` at the project root):
   ```bash
   VITE_OPENAI_API_KEY=sk-...
   # Optional: point to a proxy or Azure endpoint
   # VITE_OPENAI_BASE_URL=https://api.openai.com/v1
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
4. Open the URL printed in the terminal (defaults to `http://localhost:3000`).

**Production build**

```bash
npm run build
```
