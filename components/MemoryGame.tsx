import React, { useState, useEffect } from 'react';
import { createMemoryChallenge } from '../services/geminiService';
import { MemoryChallenge, Photo } from '../types';
import { Button } from './Button';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

interface MemoryGameProps {
  photo: Photo;
  onBack: () => void;
}

export const MemoryGame: React.FC<MemoryGameProps> = ({ photo, onBack }) => {
  const [challenge, setChallenge] = useState<MemoryChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    let mounted = true;
    const initGame = async () => {
      try {
        let base64 = '';
        
        if (photo.url.startsWith('data:')) {
            base64 = photo.url.split(',')[1];
        } else {
            // It's a remote URL, we must fetch it
            try {
                const response = await fetch(photo.url);
                const blob = await response.blob();
                base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                         const res = reader.result as string;
                         resolve(res.split(',')[1]);
                    };
                    reader.readAsDataURL(blob);
                });
            } catch (err) {
                console.warn("Failed to fetch remote image for game, using fallback mock if possible or fail", err);
                // Fallback for CORS issues in demo:
                // We will try to rely on the server to handle it, or just fail gracefully.
            }
        }

        if (!base64) {
            console.error("No base64 data available");
            setLoading(false);
            return;
        }

        const data = await createMemoryChallenge(base64);
        if (mounted && data) {
            setChallenge(data);
        }
      } catch (e) {
          console.error(e);
      } finally {
         if (mounted) setLoading(false);
      }
    };

    initGame();
    return () => { mounted = false; };
  }, [photo]);

  const handleGuess = (option: string) => {
    setSelectedOption(option);
    setShowResult(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <div className="animate-spin text-indigo-600 mb-4">
           <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        </div>
        <p className="text-slate-500 font-medium">AI is generating a challenge...</p>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="text-center p-8">
        <p className="mb-4 text-slate-500">Could not generate a challenge for this image.</p>
        <p className="text-xs text-slate-400 mb-4">Note: If this is a remote demo image, CORS might block AI processing.</p>
        <Button onClick={onBack} variant="secondary">Back</Button>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-full">
            <ArrowLeft />
        </button>
        <h2 className="text-xl font-bold ml-2">Spot the Difference</h2>
      </div>

      <div className="space-y-6">
        <div className="relative rounded-xl overflow-hidden shadow-lg aspect-[4/3] bg-slate-200">
           {/* Show Modified Image */}
           <img 
            src={`data:image/jpeg;base64,${challenge.alteredImage}`} 
            className="w-full h-full object-cover" 
            alt="Challenge"
           />
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg mb-4 text-center">What did the AI change?</h3>
          
          <div className="space-y-3">
            {challenge.options.map((option, idx) => {
              let btnClass = "w-full p-4 rounded-xl text-left border transition-all ";
              if (showResult) {
                if (option === challenge.correctAnswer) btnClass += "bg-green-50 border-green-500 text-green-700";
                else if (option === selectedOption) btnClass += "bg-red-50 border-red-500 text-red-700";
                else btnClass += "bg-slate-50 border-slate-200 opacity-50";
              } else {
                btnClass += "bg-white border-slate-200 hover:bg-indigo-50 hover:border-indigo-300";
              }

              return (
                <button 
                  key={idx} 
                  disabled={showResult}
                  onClick={() => handleGuess(option)}
                  className={btnClass}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {showResult && option === challenge.correctAnswer && <CheckCircle className="text-green-600" size={20} />}
                    {showResult && option === selectedOption && option !== challenge.correctAnswer && <XCircle className="text-red-600" size={20} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {showResult && (
           <div className="text-center animate-fade-in">
             <Button onClick={onBack} variant="primary">Finish Game</Button>
           </div>
        )}
      </div>
    </div>
  );
};