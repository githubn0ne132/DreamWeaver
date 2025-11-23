
import React, { useState } from 'react';
import { StoryParams } from '../types';
import { generateStoryIdea } from '../services/openaiService';

interface Props {
  onSubmit: (params: StoryParams) => void;
  isGenerating: boolean;
}

const StoryGeneratorForm: React.FC<Props> = ({ onSubmit, isGenerating }) => {
  const [character, setCharacter] = useState('');
  const [theme, setTheme] = useState('');
  const [story, setStory] = useState('');
  const [style, setStyle] = useState('Beatrix Potter (Aquarelle)');
  // Default OpenAI image model
  const [imageModel] = useState('gpt-image-1');
  const [pageCount, setPageCount] = useState(5);
  const [age, setAge] = useState(5);
  const [isGeneratingIdea, setIsGeneratingIdea] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (character && story && style) {
      onSubmit({ character, story, style, imageModel, pageCount, age });
    }
  };

  const handleGenerateIdea = async () => {
    setIsGeneratingIdea(true);
    try {
      const idea = await generateStoryIdea(character, theme, age);
      if (idea) {
        setStory(idea);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingIdea(false);
    }
  };

  const predefinedCharacters = [
    "Gigi la Girafe",
    "Gégé l'Éléphant",
    "Léo le Lionceau",
    "Mimi la Souris",
    "Pipo le Pingouin",
    "Touffu le Chien",
    "Choco le Chat",
    "Pompon le Lapin"
  ];

  const inspirations = [
    "Beatrix Potter (Aquarelle)",
    "Dr. Seuss (Dessin au trait)",
    "Eric Carle (Collage)",
    "Studio Ghibli (Anime)",
    "Pixar (Animation 3D)",
    "Quentin Blake (Style Roald Dahl)",
    "Maurice Sendak (Vintage)",
    "Tim Burton (Gothique)",
    "Mary Blair (Disney Rétro)",
    "Hergé (Tintin / Ligne Claire)",
    "Lego",
    "Minecraft (Voxel)",
    "Shel Silverstein (Croquis N&B)",
    "Antoine de Saint-Exupéry (Aquarelle)",
    "Adventure Time (Cartoon)",
    "Pâte à modeler (Aardman)",
    "Van Gogh (Impressionnisme)",
    "Paper Mario (Découpage papier)",
    "Bande Dessinée Classique",
    "Cyberpunk Néon"
  ];

  return (
    <div className="w-full max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-stone-100">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-ink font-serif mb-2">Créer une Histoire Magique</h2>
        <p className="text-stone-500">Décrivez votre héros et son aventure, et l'IA écrira le livre.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
             <label className="block text-sm font-semibold text-stone-700 mb-2">
               Qui est le personnage principal ?
             </label>
             <input
               type="text"
               value={character}
               onChange={(e) => setCharacter(e.target.value)}
               placeholder="ex: Un petit grille-pain courageux..."
               className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all bg-stone-50"
               required
               disabled={isGenerating}
             />
             <div className="flex flex-wrap gap-2 mt-3">
                {predefinedCharacters.map((char) => (
                  <button
                    key={char}
                    type="button"
                    onClick={() => setCharacter(char)}
                    disabled={isGenerating}
                    className="text-xs font-medium bg-white border border-stone-200 text-stone-600 py-1.5 px-3 rounded-full hover:border-accent hover:text-accent transition-colors shadow-sm"
                  >
                    {char}
                  </button>
                ))}
             </div>
        </div>

        <div>
             <label className="block text-sm font-semibold text-stone-700 mb-2">
               Thème (Optionnel)
             </label>
             <input
               type="text"
               value={theme}
               onChange={(e) => setTheme(e.target.value)}
               placeholder="ex: L'espace, La plage, Noël, Les pirates..."
               className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all bg-stone-50"
               disabled={isGenerating}
             />
             <p className="text-xs text-stone-400 mt-1">Sert à orienter la suggestion d'histoire ci-dessous.</p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
             <label className="block text-sm font-semibold text-stone-700">
               De quoi parle l'histoire ?
             </label>
             <button
               type="button"
               onClick={handleGenerateIdea}
               disabled={isGeneratingIdea || isGenerating}
               className="text-xs font-medium text-accent hover:text-accent/80 flex items-center gap-1 bg-accent/5 px-2 py-1 rounded-lg transition-colors"
             >
               {isGeneratingIdea ? (
                 <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
               ) : (
                 <span>🎲</span>
               )}
               {isGeneratingIdea ? 'Réflexion...' : 'Suggérer une idée'}
             </button>
          </div>
          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="ex: Tartine voyage sur la lune pour trouver le fromage parfait..."
            className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all bg-stone-50 h-32 resize-none"
            required
            disabled={isGenerating}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">
                Longueur: <span className="text-accent font-bold">{pageCount} Pages</span>
              </label>
              <div className="flex items-center gap-4 bg-stone-50 p-3 rounded-xl border border-stone-200">
                 <span className="text-xs text-stone-500 font-bold">Court (3)</span>
                 <input 
                   type="range" 
                   min="3" 
                   max="10" 
                   step="1"
                   value={pageCount}
                   onChange={(e) => setPageCount(parseInt(e.target.value))}
                   className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-accent hover:accent-accent/80"
                   disabled={isGenerating}
                 />
                 <span className="text-xs text-stone-500 font-bold">Long (10)</span>
              </div>
           </div>

           <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">
                Âge de l'enfant: <span className="text-accent font-bold">{age} Ans</span>
              </label>
              <div className="flex items-center gap-4 bg-stone-50 p-3 rounded-xl border border-stone-200">
                 <span className="text-xs text-stone-500 font-bold">1</span>
                 <input 
                   type="range" 
                   min="1" 
                   max="10" 
                   step="1"
                   value={age}
                   onChange={(e) => setAge(parseInt(e.target.value))}
                   className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-accent hover:accent-accent/80"
                   disabled={isGenerating}
                 />
                 <span className="text-xs text-stone-500 font-bold">10</span>
              </div>
           </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-2">
            Style Visuel Inspiré par...
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {inspirations.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStyle(s)}
                disabled={isGenerating}
                className={`text-sm px-3 py-2 rounded-lg border transition-all text-left truncate ${
                  style === s
                    ? 'bg-accent text-white border-accent shadow-md'
                    : 'bg-white border-stone-200 text-stone-600 hover:border-accent/50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isGenerating}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] ${
            isGenerating
              ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-accent to-pink-500 text-white hover:shadow-accent/40'
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Magie en cours...
            </span>
          ) : (
            'Générer le Livre ✨'
          )}
        </button>
      </form>
    </div>
  );
};

export default StoryGeneratorForm;
