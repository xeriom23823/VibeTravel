import React from 'react';
import { Photo, User, ItineraryItem } from '../types';
import { MapPin, UserPlus, Users, Link as LinkIcon } from 'lucide-react';
import { CURRENT_USER_ID } from '../constants';

interface PhotoFeedProps {
  photos: Photo[];
  users: User[];
  itineraryItems?: ItineraryItem[];
  onEditTags: (photo: Photo) => void;
}

export const PhotoFeed: React.FC<PhotoFeedProps> = ({ photos, users, itineraryItems = [], onEditTags }) => {
  const getUser = (id: string) => users.find(u => u.id === id) || { name: 'Unknown', avatar: '' };

  const getItineraryTitle = (itemId?: string) => {
    if (!itemId) return null;
    return itineraryItems.find(i => i.id === itemId)?.title;
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400">
        <p>No photos yet. Be the first to share!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {photos.slice().reverse().map((photo) => {
        const user = getUser(photo.userId);
        const isOwner = photo.userId === CURRENT_USER_ID;
        const linkedItemTitle = getItineraryTitle(photo.itineraryItemId);
        
        // Resolve tagged users
        const taggedUsers = (photo.taggedUserIds || [])
          .map(id => users.find(u => u.id === id))
          .filter(Boolean) as User[];

        return (
          <div key={photo.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative group">
            {/* Header */}
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                  <div className="flex flex-col">
                    {photo.location && (
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin size={10} /> {photo.location}
                        </p>
                    )}
                    {linkedItemTitle && (
                        <p className="text-xs text-indigo-600 flex items-center gap-1 font-medium mt-0.5">
                            <LinkIcon size={10} /> {linkedItemTitle}
                        </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Tag Button */}
              {isOwner && (
                <button 
                  onClick={() => onEditTags(photo)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                >
                  <UserPlus size={18} />
                </button>
              )}
            </div>
            
            {/* Image */}
            <div className="relative aspect-[4/3] bg-slate-100">
              <img src={photo.url} alt="Trip" className="w-full h-full object-cover" />
              
              {/* Tag Overlay Indicator if people are tagged */}
              {taggedUsers.length > 0 && (
                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1.5 max-w-[90%]">
                  <Users size={12} className="text-white" />
                  <p className="text-xs text-white truncate">
                    With {taggedUsers.map(u => u.name).join(', ')}
                  </p>
                </div>
              )}
            </div>

            {/* Caption */}
            {photo.caption && (
              <div className="p-3">
                <p className="text-slate-700">{photo.caption}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};