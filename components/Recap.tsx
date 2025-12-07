import React, { useState } from 'react';
import { Award, User, Photo, Poll, ItineraryItem, Group } from '../types';
import { generateAwards, generateRecapVideo } from '../services/geminiService';
import { Button } from './Button';
import { Trophy, Map, Video, AlertCircle, Clock } from 'lucide-react';

interface RecapProps {
  users: User[];
  photos: Photo[];
  polls: Poll[];
  itineraryItems: ItineraryItem[];
  group: Group;
  onStartMemoryGame: () => void;
}

export const Recap: React.FC<RecapProps> = ({ users, photos, polls, itineraryItems, group, onStartMemoryGame }) => {
  const [awards, setAwards] = useState<Award[]>([]);
  const [awardsLoading, setAwardsLoading] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const handleGenerateAwards = async () => {
    setAwardsLoading(true);
    try {
      const results = await generateAwards(users, photos, polls, group.stats);
      setAwards(results);
    } catch (e) {
      console.error(e);
    } finally {
      setAwardsLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    setVideoError(null);
    setVideoLoading(true);
    try {
      // Check for API key in a real scenario
      if (window.aistudio && window.aistudio.openSelectKey) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          if (!hasKey) {
             await window.aistudio.openSelectKey();
          }
      }

      // Use the first photo as a starter frame if available
      const seedImage = photos.length > 0 ? photos[0].url.split(',')[1] : undefined;
      const { videoUri } = await generateRecapVideo("A nostalgic video montage of a group travel adventure with friends, scenic views, and laughter.", seedImage);
      
      if (videoUri) setVideoUri(videoUri);
    } catch (e: any) {
      if (e.message && e.message.includes('API_KEY_MISSING')) {
         setVideoError("Please select a paid API key to generate video.");
      } else {
         setVideoError("Video generation failed. Please try again later.");
      }
    } finally {
      setVideoLoading(false);
    }
  };

  // Sort items by time for the route map
  const sortedRoute = [...itineraryItems].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-8 pb-20">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-6 text-white text-center shadow-lg">
        <h2 className="text-3xl font-bold mb-2">Trip Completed!</h2>
        <p className="opacity-90">What a journey! Here is your summary.</p>
      </div>

      {/* Route Visualization */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
          <Map className="text-indigo-600" /> Route Map
        </h3>
        {sortedRoute.length === 0 ? (
          <p className="text-slate-500 text-center italic">No itinerary items recorded.</p>
        ) : (
          <div className="relative pl-8 border-l-2 border-indigo-100 space-y-8">
            {sortedRoute.map((item, idx) => (
              <div key={item.id} className="relative">
                <span className="absolute -left-[37px] w-4 h-4 rounded-full bg-indigo-500 ring-4 ring-indigo-50" />
                <p className="font-semibold text-slate-800 leading-tight">
                  {item.location || item.title}
                </p>
                <div className="flex flex-col text-xs text-slate-500 mt-1">
                  <span>{new Date(item.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  {item.location && item.title !== item.location && (
                    <span className="opacity-75">{item.title}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Awards Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
          <Trophy className="text-yellow-500" /> Fun Awards
        </h3>
        
        {awards.length === 0 ? (
          <div className="text-center py-6">
             <Button onClick={handleGenerateAwards} isLoading={awardsLoading} variant="secondary" className="mx-auto">
               Reveal Awards
             </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {awards.map((award, idx) => (
              <div key={idx} className="flex items-center gap-4 bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                <div className="text-3xl">{award.icon}</div>
                <div>
                  <h4 className="font-bold text-yellow-900">{award.title}</h4>
                  <p className="text-sm text-yellow-800">Winner: <b>{award.winnerName}</b></p>
                  <p className="text-xs text-yellow-700 italic">"{award.reason}"</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Veo Video Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
          <Video className="text-pink-500" /> Trip Movie (Veo)
        </h3>
        
        {videoError && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {videoError}
          </div>
        )}

        {!videoUri ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
             <p className="text-slate-500 mb-4 text-sm max-w-xs mx-auto">
               Generate a cinematic 1080p recap video using Gemini Veo. (Requires Paid Key)
             </p>
             <Button onClick={handleGenerateVideo} isLoading={videoLoading} variant="primary" className="mx-auto">
               {videoLoading ? 'Creating Magic (may take a min)...' : 'Generate Movie'}
             </Button>
          </div>
        ) : (
          <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
            <video 
              src={videoUri} 
              controls 
              className="w-full h-full object-cover" 
              autoPlay 
              loop 
            />
          </div>
        )}
      </div>

       {/* Memory Game CTA */}
       <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">Memory Challenge!</h3>
            <p className="text-indigo-200 mb-4 text-sm">Can you spot what changed in the group photos?</p>
            <Button onClick={onStartMemoryGame} variant="secondary" className="w-full">
              Play Game
            </Button>
          </div>
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-700 rounded-full opacity-50 blur-xl"></div>
       </div>

    </div>
  );
};