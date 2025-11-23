# DreamWeaver

Create illustrated children's books in minutes with OpenAI. DreamWeaver helps you describe a main character, pick a visual style, and generate a fully illustrated story with consistent characters across every page.

## Features
- **Guided story briefing**: Provide a hero, age range, and custom plot or ask the app to suggest an idea based on a theme.
- **Model controls**: Choose the text model (gpt-4o, gpt-4o-mini, gpt-3.5-turbo) and image model (GPT-Image-1 or DALL·E 3) per book.
- **Visual style library**: Pick from curated art inspirations (Beatrix Potter watercolors, Studio Ghibli, Lego, Minecraft voxel, and more).
- **Consistent illustrations**: Builds a reusable character signature before writing to keep outfits, colors, and proportions stable on every page.
- **Smart prompts for animals**: Enforces animal-safe anatomy (paws/hooves) and removes unwanted artifacts like borders, text, or watermarks.
- **Progressive generation**: Shows real-time steps (character sheet → story → sequential illustrations) with page-by-page progress.
- **Interactive reading**: Flip through a book with animated page turns, see paired text and images, and track position with page dots.
- **Export options**: Print-friendly layout, PDF download with images and text, and quick reset to create a new book.

## Prerequisites
- Node.js 18+
- An [OpenAI API key](https://platform.openai.com/)

## Run locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure your environment by creating a `.env.local` file at the project root:
   ```bash
   VITE_OPENAI_API_KEY=sk-...
   # Optional: point to a proxy or Azure endpoint
   # VITE_OPENAI_BASE_URL=https://api.openai.com/v1
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
4. Open the printed URL (defaults to http://localhost:3000) and create your first book.

## How to create a book
1. Describe your main character and optionally pick one of the preset character chips.
2. Enter a plot or click **🎲 Suggérer une idée** after setting a theme and age.
3. Adjust the **Longueur** slider (3–10 pages) and **Âge** slider (1–10 years).
4. Choose your **Modèle Texte**, **Modèle Image**, and **Style Visuel** inspiration.
5. Click **Générer le Livre ✨** and watch the status update from character sheet to story to illustrations.
6. Read the finished book, print it, download a PDF, or reset to start over.

## Production build
```bash
npm run build
```
