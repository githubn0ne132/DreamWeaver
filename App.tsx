
import React, { useState } from 'react';
import { AppState, StoryParams, StoryStructure, GenerationProgress } from './types';
import { buildCharacterSignature, generateStory, generatePageImage } from './services/openaiService';
import StoryGeneratorForm from './components/StoryGeneratorForm';
import BookReader from './components/BookReader';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.INPUT);
  const [book, setBook] = useState<StoryStructure | null>(null);
  const [progress, setProgress] = useState<GenerationProgress>({ currentStep: '', completedImages: 0, totalImages: 0 });
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (params: StoryParams) => {
    setAppState(AppState.GENERATING_STORY);
    setError(null);
    setProgress({ currentStep: 'Création de la fiche personnage...', completedImages: 0, totalImages: 0 });

    try {
      // 0. Build a repeatable character signature to keep visuals consistent
      const characterSignature = await buildCharacterSignature(params.character, params.style, params.textModel);
      setProgress({ currentStep: 'Écriture de l\'histoire...', completedImages: 0, totalImages: 0 });

      // 1. Generate Story Text
      const storyData = await generateStory(
        params.character,
        params.story,
        params.style,
        params.pageCount,
        params.age,
        params.textModel,
        characterSignature
      );
      
      setBook(storyData);
      setAppState(AppState.GENERATING_IMAGES);
      
      const totalImages = storyData.pages.length;
      setProgress({ 
        currentStep: 'Création des illustrations...', 
        completedImages: 0, 
        totalImages 
      });

      // 2. Generate Images sequentially
      const pagesWithImages = [...storyData.pages];
      const visualSignature = characterSignature || params.character;

      for (let i = 0; i < totalImages; i++) {
        const page = pagesWithImages[i];

        // Construct detailed prompt ensuring character consistency
        const characterContext = params.character ? `Character Reference: ${params.character}.` : '';
        // Explicitly forbid human hands on animals and include other negative constraints
        const fullPrompt = `${characterContext} Consistent Character Sheet: ${visualSignature}. Keep the same accessories, colors, and proportions on every page. Action: ${page.imagePrompt}. Art Style: ${params.style}. Constraint: If character is an animal, they must have PAWS or HOOVES, NEVER human hands, fingers, or feet. Exclude: text, words, signature, watermark, frame, border, humans, human hands, extra limbs, unnatural poses. Keep natural animal anatomy.`;
        
        // Pass the selected model
        const imageUrl = await generatePageImage(fullPrompt, params.imageModel);
        
        pagesWithImages[i] = { ...page, imageUrl };
        
        setProgress(prev => ({
          ...prev,
          completedImages: i + 1
        }));
        
        // Update book state progressively
        setBook({ ...storyData, pages: pagesWithImages });
      }

      setAppState(AppState.READING);

    } catch (err: any) {
      console.error("Generation failed", err);
      setError(err.message || "Une erreur est survenue lors de la création de votre livre. Veuillez réessayer.");
      setAppState(AppState.ERROR);
    }
  };

  const handleReset = () => {
    setAppState(AppState.INPUT);
    setBook(null);
    setError(null);
  };

  return (
    <div className="min-h-screen font-sans text-ink bg-[#f3f4f6] flex flex-col">
      {/* Navigation / Header - Hidden on Print */}
      <header className="w-full bg-white/80 backdrop-blur border-b border-stone-200 sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white font-serif font-bold text-xl">D</div>
            <span className="font-serif font-bold text-xl tracking-tight">DreamWeaver</span>
          </div>
          <div className="text-xs font-medium text-stone-400 bg-stone-100 px-3 py-1 rounded-full">
            Propulsé par OpenAI
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-8 relative">
        
        {/* Background decorative blobs - Hidden on Print */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-highlight/10 rounded-full blur-3xl -z-10 pointer-events-none no-print"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10 pointer-events-none no-print"></div>

        {/* VIEW: Input Form */}
        {appState === AppState.INPUT && (
           <StoryGeneratorForm 
             onSubmit={handleGenerate} 
             isGenerating={false} 
           />
        )}

        {/* VIEW: Loading / Generating */}
        {(appState === AppState.GENERATING_STORY || appState === AppState.GENERATING_IMAGES) && (
          <div className="w-full max-w-md mx-auto text-center no-print">
             <div className="relative w-32 h-32 mx-auto mb-8">
               <div className="absolute inset-0 border-4 border-stone-200 rounded-full"></div>
               <div className="absolute inset-0 border-4 border-accent rounded-full border-t-transparent animate-spin"></div>
               <div className="absolute inset-0 flex items-center justify-center font-serif text-3xl animate-pulse">✨</div>
             </div>
             
             <h2 className="text-2xl font-bold font-serif mb-2">Création de votre chef-d'œuvre</h2>
             <p className="text-stone-500 mb-6">{progress.currentStep}</p>
             
             {appState === AppState.GENERATING_IMAGES && (
               <div className="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden">
                 <div 
                   className="bg-accent h-2.5 rounded-full transition-all duration-500" 
                   style={{ width: `${(progress.completedImages / progress.totalImages) * 100}%` }}
                 ></div>
               </div>
             )}
             {appState === AppState.GENERATING_IMAGES && (
                <p className="text-xs text-stone-400 mt-2">
                  Dessin de la page {progress.completedImages + 1} sur {progress.totalImages}
                </p>
             )}
          </div>
        )}

        {/* VIEW: Error */}
        {appState === AppState.ERROR && (
           <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-xl border border-red-100 no-print">
             <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
               </svg>
             </div>
             <h3 className="text-xl font-bold text-stone-800 mb-2">Oups !</h3>
             <p className="text-stone-600 mb-6">{error}</p>
             <button 
               onClick={handleReset}
               className="px-6 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-900 transition-colors"
             >
               Réessayer
             </button>
           </div>
        )}

        {/* VIEW: Reading */}
        {appState === AppState.READING && book && (
          <BookReader book={book} onReset={handleReset} />
        )}
      </main>
    </div>
  );
};

export default App;
