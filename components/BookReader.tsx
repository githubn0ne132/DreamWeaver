
import React, { useState, useEffect } from 'react';
import { jsPDF } from "jspdf";
import { StoryStructure } from '../types';

interface Props {
  book: StoryStructure;
  onReset: () => void;
}

const BookReader: React.FC<Props> = ({ book, onReset }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Reset page if book changes
  useEffect(() => {
    setCurrentPage(0);
  }, [book]);

  if (!book || !book.pages || !Array.isArray(book.pages) || book.pages.length === 0) {
    return (
        <div className="flex flex-col items-center w-full max-w-6xl mx-auto p-8 text-center no-print">
            <h1 className="text-3xl font-serif text-ink mb-4">Le Livre est vide</h1>
            <p className="text-stone-500 mb-4">Il semble que les pages se soient envolées.</p>
            <button 
              onClick={onReset}
              className="px-6 py-2 bg-accent text-white rounded-full shadow-lg hover:bg-accent/90"
            >
              Réessayer
            </button>
        </div>
    );
  }

  const totalPages = book.pages.length;
  const safePageIndex = Math.min(Math.max(0, currentPage), totalPages - 1);
  const pageData = book.pages[safePageIndex];

  if (!pageData) {
      return (
        <div className="flex justify-center p-8 no-print">
             <button onClick={onReset} className="text-accent underline">Réinitialiser</button>
        </div>
      );
  }

  const handleNext = () => {
    if (safePageIndex < totalPages - 1) {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(p => p + 1);
        setIsFlipping(false);
      }, 300);
    }
  };

  const handlePrev = () => {
    if (safePageIndex > 0) {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(p => p - 1);
        setIsFlipping(false);
      }, 300);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    setIsDownloading(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxLineWidth = pageWidth - (margin * 2);

      // === Title Page ===
      doc.setFont("times", "bold");
      doc.setFontSize(24);
      const titleLines = doc.splitTextToSize(book.title, maxLineWidth);
      doc.text(titleLines, pageWidth / 2, pageHeight / 3, { align: "center" });
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text("Une histoire personnalisée créée par DreamWeaver AI", pageWidth / 2, (pageHeight / 3) + 20, { align: "center" });
      
      // === Story Pages ===
      book.pages.forEach((page, i) => {
        doc.addPage();
        doc.setTextColor(0);
        
        // Image
        let imageY = 25; // Start Y for image
        const maxImageHeight = 110;
        
        if (page.imageUrl) {
          try {
             // Determine format (defaulting to JPEG if unsure, as base64 usually has mime)
             let format = 'JPEG';
             if (page.imageUrl.includes('image/png')) format = 'PNG';
             
             const imgProps = doc.getImageProperties(page.imageUrl);
             const imgRatio = imgProps.height / imgProps.width;
             
             // Calculate dims to fit
             let imgWidth = 120;
             let imgHeight = imgWidth * imgRatio;
             
             if (imgHeight > maxImageHeight) {
                imgHeight = maxImageHeight;
                imgWidth = imgHeight / imgRatio;
             }

             const x = (pageWidth - imgWidth) / 2;
             doc.addImage(page.imageUrl, format, x, imageY, imgWidth, imgHeight);
             
             // Move text cursor down
             imageY += imgHeight + 15; 
          } catch (e) {
             console.error("Error adding image to PDF", e);
             imageY += 50;
          }
        } else {
          imageY += 50;
        }

        // Text
        doc.setFont("times", "normal");
        doc.setFontSize(14);
        doc.setTextColor(40);
        
        const textLines = doc.splitTextToSize(page.text, maxLineWidth);
        doc.text(textLines, pageWidth / 2, imageY, { align: "center" });
        
        // Page Footer
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`- ${i + 1} -`, pageWidth / 2, pageHeight - 10, { align: "center" });
      });

      // Save
      doc.save(`${book.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
    } catch (error) {
      console.error("PDF Generation failed", error);
      alert("Impossible de générer le PDF. Veuillez essayer l'option Imprimer.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto">
      {/* === PRINT LAYOUT (Hidden on screen) === */}
      <div className="print-visible w-full max-w-3xl mx-auto">
         <div className="text-center mb-12 page-break pb-12 border-b">
            <h1 className="text-4xl font-serif font-bold mb-4">{book.title}</h1>
            <p className="text-stone-500 italic">Une histoire générée par DreamWeaver AI</p>
         </div>
         
         {book.pages.map((page, idx) => (
           <div key={idx} className="flex flex-col items-center mb-8 page-break">
              <div className="w-full aspect-square mb-6 border border-gray-200 overflow-hidden rounded-lg bg-stone-50 flex items-center justify-center">
                {page.imageUrl && (
                  <img src={page.imageUrl} className="max-w-full max-h-full object-contain" alt={`Page ${idx + 1}`} />
                )}
              </div>
              <div className="text-xl font-serif leading-relaxed text-center max-w-2xl px-8">
                {page.text?.split('\n').map((paragraph, pIdx) => (
                  paragraph.trim() && (
                    <p key={pIdx} className="mb-4 last:mb-0">
                      {paragraph}
                    </p>
                  )
                ))}
              </div>
              <div className="mt-4 text-sm text-stone-400 font-serif italic">- {idx + 1} -</div>
           </div>
         ))}
      </div>

      {/* === SCREEN INTERFACE (Hidden on print) === */}
      <div className="no-print w-full flex flex-col items-center">
        {/* Header / Title */}
        <div className="mb-6 text-center relative w-full">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-ink mb-2 drop-shadow-sm">
            {book.title || "Histoire Sans Titre"}
          </h1>
          <div className="flex justify-center flex-wrap gap-4 items-center mt-4">
            <button 
              onClick={onReset}
              className="text-sm text-stone-500 hover:text-accent underline decoration-dotted"
            >
              Créer une nouvelle histoire
            </button>
            <div className="h-4 w-px bg-stone-300 mx-2"></div>
            
            <button 
              onClick={handlePrint}
              className="text-sm font-medium text-stone-600 hover:text-accent flex items-center gap-1 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Imprimer
            </button>
            
            <button 
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="text-sm font-medium text-stone-600 hover:text-accent flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              {isDownloading ? (
                 <span className="animate-spin h-4 w-4 border-2 border-accent border-t-transparent rounded-full"></span>
              ) : (
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              )}
              {isDownloading ? 'Sauvegarde...' : 'Télécharger PDF'}
            </button>
          </div>
        </div>

        {/* Book Container */}
        <div className="relative w-full perspective-1000">
          <div 
            className={`
              relative flex flex-col md:flex-row w-full bg-paper rounded-2xl overflow-hidden 
              book-shadow border border-[#e3dacb] min-h-[600px] md:h-[600px]
              transition-all duration-300 transform
              ${isFlipping ? 'opacity-50 scale-95 rotate-y-2' : 'opacity-100 scale-100'}
            `}
          >
             {/* Binding spine visual */}
             <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-8 -ml-4 bg-gradient-to-r from-[#00000010] via-[#00000005] to-[#00000010] z-10"></div>

             {/* Left Page (Text) */}
             <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center items-center page-texture border-b md:border-b-0 md:border-r border-[#e3dacb]">
                <div className="max-w-md mx-auto">
                  <span className="block text-center text-accent font-serif italic mb-8 opacity-60">
                    Page {safePageIndex + 1}
                  </span>
                  <div className="font-serif text-ink text-center">
                    {pageData.text?.split('\n').map((paragraph, idx) => (
                      paragraph.trim() ? (
                        <p key={idx} className="text-xl md:text-2xl leading-relaxed mb-4 last:mb-0">
                          {paragraph}
                        </p>
                      ) : <br key={idx} />
                    ))}
                  </div>
                </div>
             </div>

             {/* Right Page (Image) */}
             <div className="w-full md:w-1/2 bg-stone-100 relative flex items-center justify-center overflow-hidden bg-[#fdfbf7] p-4 md:p-8">
                {pageData.imageUrl ? (
                  <img 
                    src={pageData.imageUrl} 
                    alt={`Illustration pour page ${safePageIndex + 1}`}
                    className="w-full h-full object-contain drop-shadow-md rounded-sm"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-stone-400 p-8 text-center">
                     <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                     </svg>
                     <p>Illustration manquante</p>
                  </div>
                )}
             </div>
          </div>

          {/* Controls */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-4 md:-mx-16 pointer-events-none">
            <button
              onClick={handlePrev}
              disabled={safePageIndex === 0}
              className={`
                pointer-events-auto w-12 h-12 rounded-full bg-white/90 backdrop-blur shadow-lg flex items-center justify-center text-ink transition-all hover:scale-110
                ${safePageIndex === 0 ? 'opacity-0 cursor-default' : 'opacity-100 hover:bg-accent hover:text-white'}
              `}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            
            <button
              onClick={handleNext}
              disabled={safePageIndex === totalPages - 1}
              className={`
                pointer-events-auto w-12 h-12 rounded-full bg-white/90 backdrop-blur shadow-lg flex items-center justify-center text-ink transition-all hover:scale-110
                ${safePageIndex === totalPages - 1 ? 'opacity-0 cursor-default' : 'opacity-100 hover:bg-accent hover:text-white'}
              `}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
        
        <div className="mt-8 flex gap-2 justify-center">
            {book.pages.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-2 rounded-full transition-all duration-300 ${idx === safePageIndex ? 'w-8 bg-accent' : 'w-2 bg-stone-300'}`}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

export default BookReader;
