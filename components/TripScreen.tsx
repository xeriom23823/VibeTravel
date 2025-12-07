import React, { useState, useRef, useEffect } from 'react';
import { AppMode, Photo, Poll, Announcement, User, Group, Notification, ItineraryItem, ItineraryType, UserStats } from '../types';
import { CURRENT_USER_ID, LOCATIONS, MOCK_ITINERARY_ITEMS } from '../constants';
import { PhotoFeed } from './PhotoFeed';
import { Recap } from './Recap';
import { MemoryGame } from './MemoryGame';
import { Button } from './Button';
import { Camera, Download, Archive, ArrowLeft, ArrowRight, CheckSquare, Bell, Calendar, MapPin, Info, Image as ImageIcon, Vote, X, Check, Pencil, Plane, Hotel, Utensils, Ticket, Bus, MoreHorizontal, Plus, Clock, Map as MapIcon, Link, Trash2, Car, Train, Search, Wand2, Loader2, Users, Copy, UserPlus } from 'lucide-react';
import { findPlaceFromQuery } from '../services/geminiService';

interface TripScreenProps {
  user: User;
  group: Group;
  onUpdateGroup: (group: Group) => void;
  onBack: () => void;
  mockUsers: User[]; 
}

const ITINERARY_ICONS: Record<ItineraryType, React.ReactNode> = {
    FLIGHT: <Plane size={18} />,
    LODGING: <Hotel size={18} />,
    FOOD: <Utensils size={18} />,
    ATTRACTION: <Ticket size={18} />,
    TRANSPORT: <Car size={18} />, // Default icon for transport
    OTHER: <MoreHorizontal size={18} />
};

export const TripScreen: React.FC<TripScreenProps> = ({ user, group, onUpdateGroup, onBack, mockUsers }) => {
  // --- STATE ---
  const [mode, setMode] = useState<AppMode>(group.status === 'ENDED' ? AppMode.ENDED : AppMode.ACTIVE);
  const [activeTab, setActiveTab] = useState<'ITINERARY' | 'MEDIA' | 'VOTE' | 'INFO'>('MEDIA');
  
  // Data State
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([]);
  
  // UI State
  const [showNotifications, setShowNotifications] = useState(false);
  const [playingGamePhoto, setPlayingGamePhoto] = useState<Photo | null>(null);
  const [selectedItineraryItem, setSelectedItineraryItem] = useState<ItineraryItem | null>(null);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<Photo | null>(null);
  
  // Tagging State
  const [taggingPhoto, setTaggingPhoto] = useState<Photo | null>(null);

  // Editing Group State
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDest, setEditDest] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editCover, setEditCover] = useState('');

  // Editing Itinerary Item State
  const [itemType, setItemType] = useState<ItineraryType>('OTHER');
  const [itemTitle, setItemTitle] = useState('');
  const [itemLoc, setItemLoc] = useState('');
  const [itemStart, setItemStart] = useState('');
  const [itemEnd, setItemEnd] = useState('');
  const [itemNotes, setItemNotes] = useState('');
  const [itemId, setItemId] = useState<string | null>(null);
  
  // Location Search State
  const [isLocLoading, setIsLocLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editCoverInputRef = useRef<HTMLInputElement>(null);
  const itemPhotoInputRef = useRef<HTMLInputElement>(null);
  
  const allUsers = [user, ...mockUsers];
  
  // Track open group once per mount
  const hasTrackedOpen = useRef(false);

  // --- STATS TRACKER HELPER ---
  const trackAction = (action: keyof UserStats) => {
    // We create a deep copy to modify
    const currentStats = group.stats || {};
    const myStats = currentStats[user.id] || { openGroup: 0, viewItinerary: 0, editItinerary: 0, photos: 0, votes: 0 };
    
    const updatedStats = {
      ...currentStats,
      [user.id]: {
        ...myStats,
        [action]: myStats[action] + 1
      }
    };

    onUpdateGroup({ ...group, stats: updatedStats });
  };

  // --- EFFECTS ---
  useEffect(() => {
    // Initial Data Setup
    setAnnouncements([{ 
      id: 'a1', 
      text: `Welcome to ${group.name}! Join code: ${group.joinCode}`, 
      creatorId: 'system', 
      timestamp: Date.now(), 
      isImportant: true 
    }]);

    // Mock Notifications
    setNotifications([
      { id: 'n1', type: 'ANNOUNCEMENT', message: 'New announcement from System', timestamp: Date.now(), isRead: false },
      { id: 'n2', type: 'POLL', message: 'Alice created a new poll', timestamp: Date.now() - 100000, isRead: true }
    ]);

    // Load Mock Itinerary filtered by group
    const groupItems = MOCK_ITINERARY_ITEMS.filter(i => i.groupId === group.id);
    setItineraryItems(groupItems.sort((a, b) => a.startTime.localeCompare(b.startTime)));

  }, [group.id]); 
  
  // Track "Open Group" action only once on mount
  useEffect(() => {
    if (!hasTrackedOpen.current) {
      trackAction('openGroup');
      hasTrackedOpen.current = true;
    }
  }, []);

  // --- ACTIONS ---

  const handleEditGroupOpen = () => {
    setEditName(group.name);
    setEditDesc(group.description || '');
    setEditDest(group.destination);
    setEditStart(group.startDate);
    setEditEnd(group.endDate);
    setEditCover(group.coverImage);
    setIsEditingGroup(true);
  };

  const handleEditGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateGroup({
      ...group,
      name: editName,
      description: editDesc,
      destination: editDest,
      startDate: editStart,
      endDate: editEnd,
      coverImage: editCover
    });
    setIsEditingGroup(false);
  };

  const handleEditCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setEditCover(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGlobalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processPhotoUpload(e.target.files[0], null);
    }
  };

  const handleItemPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && selectedItineraryItem) {
        processPhotoUpload(e.target.files[0], selectedItineraryItem.id);
    }
  };

  const processPhotoUpload = (file: File, itineraryItemId: string | null) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        const newPhoto: Photo = {
          id: Date.now().toString(),
          url: ev.target.result as string,
          userId: user.id,
          timestamp: Date.now(),
          location: itineraryItemId ? undefined : group.destination, // If linked to item, we might imply location
          caption: itineraryItemId ? 'Added to itinerary' : 'Shared a moment!',
          taggedUserIds: [],
          itineraryItemId: itineraryItemId || undefined
        };
        setPhotos(prev => [...prev, newPhoto]);
        addNotification('PHOTO', `${user.name} added a new photo`);
        
        // Track Statistic
        trackAction('photos');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateTags = (photoId: string, taggedIds: string[]) => {
    setPhotos(prev => prev.map(p => 
      p.id === photoId ? { ...p, taggedUserIds: taggedIds } : p
    ));
    setTaggingPhoto(null);
  };

  const handleCreatePoll = () => {
    const newPoll: Poll = {
      id: Date.now().toString(),
      question: "What's the plan for tomorrow?",
      creatorId: user.id,
      isActive: true,
      timestamp: Date.now(),
      options: [
        { id: 'o1', text: 'Museum Tour', votes: [] },
        { id: 'o2', text: 'Beach Day', votes: [] }
      ]
    };
    setPolls(prev => [newPoll, ...prev]);
    addNotification('POLL', 'A new poll has been created!');
  };

  const handleVote = (pollId: string, optionId: string) => {
    setPolls(prev => prev.map(p => {
      if (p.id !== pollId) return p;
      return {
        ...p,
        options: p.options.map(o => {
          if (o.id === optionId) {
             const hasVoted = o.votes.includes(user.id);
             if (!hasVoted) {
                 // Track statistic only on new vote
                 trackAction('votes');
             }
             return { ...o, votes: hasVoted ? o.votes.filter(id => id !== user.id) : [...o.votes, user.id] };
          }
          return o;
        })
      };
    }));
  };

  const addNotification = (type: Notification['type'], message: string) => {
    setNotifications(prev => [{
      id: Date.now().toString(),
      type,
      message,
      timestamp: Date.now(),
      isRead: false
    }, ...prev]);
  };

  const markNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // Itinerary CRUD
  const handleOpenItemEdit = (item?: ItineraryItem, prefill?: { startTime: string, endTime: string, type: ItineraryType }) => {
    setIsLocLoading(false);
    if (item) {
        setItemId(item.id);
        setItemType(item.type);
        setItemTitle(item.title);
        setItemLoc(item.location || '');
        setItemStart(item.startTime);
        setItemEnd(item.endTime || '');
        setItemNotes(item.notes || '');
    } else {
        setItemId(null);
        setItemType(prefill?.type || 'OTHER');
        setItemTitle('');
        setItemLoc('');
        setItemStart(prefill?.startTime || `${group.startDate}T09:00`);
        setItemEnd(prefill?.endTime || '');
        setItemNotes('');
    }
    setIsEditingItem(true);
  };

  const handleAiLocationSearch = async () => {
    if (!itemLoc) return;
    setIsLocLoading(true);
    const result = await findPlaceFromQuery(itemLoc);
    if (result) {
        setItemLoc(result);
    }
    setIsLocLoading(false);
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm("Are you sure you want to delete this activity?")) {
        setItineraryItems(prev => prev.filter(i => i.id !== id));
        setIsEditingItem(false);
        if (selectedItineraryItem?.id === id) setSelectedItineraryItem(null);
    }
  };

  const handleSaveItineraryItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (itemId) {
        // Update
        setItineraryItems(prev => prev.map(i => i.id === itemId ? {
            ...i,
            type: itemType,
            title: itemTitle,
            location: itemLoc,
            startTime: itemStart,
            endTime: itemEnd,
            notes: itemNotes
        } : i).sort((a,b) => a.startTime.localeCompare(b.startTime)));
        // Also update selected if it's open
        if (selectedItineraryItem?.id === itemId) {
            setSelectedItineraryItem({
                ...selectedItineraryItem,
                type: itemType,
                title: itemTitle,
                location: itemLoc,
                startTime: itemStart,
                endTime: itemEnd,
                notes: itemNotes
            });
        }
    } else {
        // Create
        const newItem: ItineraryItem = {
            id: Date.now().toString(),
            groupId: group.id,
            type: itemType,
            title: itemTitle,
            location: itemLoc,
            startTime: itemStart,
            endTime: itemEnd,
            notes: itemNotes
        };
        setItineraryItems(prev => [...prev, newItem].sort((a,b) => a.startTime.localeCompare(b.startTime)));
    }
    
    // Track Statistic
    trackAction('editItinerary');
    
    setIsEditingItem(false);
  };

  const handleViewItineraryItem = (item: ItineraryItem) => {
      setSelectedItineraryItem(item);
      // Track Statistic
      trackAction('viewItinerary');
  };

  // Helper to calculate duration string
  const getDurationString = (start: string, end?: string) => {
    if (!end) return '';
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // --- RENDER HELPERS ---

  const renderHeader = () => (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
            <ArrowLeft size={20} />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-800 leading-tight truncate max-w-[150px]">
              {group.name}
            </h1>
            <button onClick={handleEditGroupOpen} className="text-slate-400 hover:text-indigo-600 p-0.5 rounded-full hover:bg-slate-100 transition-colors">
              <Pencil size={12} />
            </button>
          </div>
          <p className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">
             {group.status}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) markNotificationsRead();
            }}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-3 border-b border-slate-100 bg-slate-50">
                  <h3 className="text-xs font-bold text-slate-500 uppercase">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-center text-sm text-slate-400">No new updates.</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`p-3 border-b border-slate-50 text-sm ${!n.isRead ? 'bg-indigo-50/50' : ''}`}>
                        <p className="text-slate-800">{n.message}</p>
                        <p className="text-xs text-slate-400 mt-1">{new Date(n.timestamp).toLocaleTimeString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {mode === AppMode.ACTIVE && group.status !== 'ENDED' && (
          <button onClick={() => setMode(AppMode.ENDED)} className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-full border border-red-100 hover:bg-red-100 transition-colors">
            End
          </button>
        )}
      </div>
    </header>
  );

  const renderActiveView = () => (
    <>
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-white sticky top-[60px] z-30">
        <button 
          onClick={() => setActiveTab('ITINERARY')}
          className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-colors border-b-2 ${activeTab === 'ITINERARY' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <Calendar size={18} />
          PLAN
        </button>
        <button 
          onClick={() => setActiveTab('MEDIA')}
          className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-colors border-b-2 ${activeTab === 'MEDIA' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <ImageIcon size={18} />
          MEDIA
        </button>
        <button 
          onClick={() => setActiveTab('VOTE')}
          className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-colors border-b-2 ${activeTab === 'VOTE' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <Vote size={18} />
          VOTE
        </button>
        <button 
          onClick={() => setActiveTab('INFO')}
          className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-colors border-b-2 ${activeTab === 'INFO' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <Info size={18} />
          INFO
        </button>
      </div>

      <div className="px-4 py-4 min-h-[calc(100vh-120px)] bg-slate-50">
        
        {/* --- ITINERARY TAB --- */}
        {activeTab === 'ITINERARY' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
            {/* Header Card */}
            <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-100 bg-white mb-6">
              <div className="h-32 bg-slate-200 relative">
                <img src={group.coverImage} className="w-full h-full object-cover" alt="Cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="text-center text-white">
                         <h2 className="text-2xl font-bold">{group.name}</h2>
                         <p className="text-sm opacity-90">{new Date(group.startDate).toLocaleDateString()} - {new Date(group.endDate).toLocaleDateString()}</p>
                    </div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-slate-600 text-sm">
                      <MapIcon size={16} /> {group.destination}
                  </div>
                  {group.description && <p className="text-slate-500 text-sm mt-2">{group.description}</p>}
              </div>
            </div>

            {/* Timeline */}
            <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200"></div>
                
                {itineraryItems.length === 0 && (
                    <div className="ml-10 py-4 text-slate-400">
                        <p>No itinerary items yet.</p>
                    </div>
                )}

                {itineraryItems.map((item, idx) => {
                    const nextItem = itineraryItems[idx + 1];
                    const isTransport = item.type === 'TRANSPORT';
                    const durationStr = isTransport ? getDurationString(item.startTime, item.endTime) : '';

                    // Detect Gap for adding transport
                    const showGapButton = !isTransport && nextItem && nextItem.type !== 'TRANSPORT';

                    if (isTransport) {
                        return (
                            <div key={item.id} className="relative mb-6 ml-0 flex items-center group cursor-pointer" onClick={() => handleOpenItemEdit(item)}>
                                {/* The Pill on the line */}
                                <div className="absolute left-4 -translate-x-1/2 w-3 h-3 bg-slate-400 rounded-full border-2 border-slate-50 z-10 group-hover:scale-125 transition-transform" />
                                
                                <div className="ml-10 flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors">
                                    <Car size={14} />
                                    <span>{item.title}</span>
                                    {durationStr && <span className="text-slate-400 border-l border-slate-300 pl-2 ml-1">{durationStr}</span>}
                                </div>
                            </div>
                        )
                    }

                    return (
                        <React.Fragment key={item.id}>
                            <div className="relative mb-6 ml-10">
                                {/* Dot / Icon */}
                                <div 
                                    className={`absolute -left-[37px] top-0 w-8 h-8 rounded-full border-4 border-slate-50 flex items-center justify-center text-white shadow-sm z-10 ${
                                        item.type === 'FLIGHT' ? 'bg-blue-500' :
                                        item.type === 'LODGING' ? 'bg-purple-500' :
                                        item.type === 'FOOD' ? 'bg-orange-500' :
                                        item.type === 'ATTRACTION' ? 'bg-green-500' : 'bg-slate-500'
                                    }`}
                                >
                                    {ITINERARY_ICONS[item.type]}
                                </div>

                                {/* Card */}
                                <div 
                                    onClick={() => handleViewItineraryItem(item)}
                                    className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all active:scale-[0.99]"
                                >
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-slate-800">{item.title}</h4>
                                    </div>
                                    <div className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-3">
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} /> {new Date(item.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', month: 'short', day: 'numeric'})}
                                        </span>
                                        {item.endTime && (
                                            <span>- {new Date(item.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        )}
                                    </div>
                                    {item.location && (
                                        <a 
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-xs text-slate-400 mt-1 flex items-center gap-1 truncate hover:text-indigo-600 hover:underline"
                                        >
                                            <MapPin size={12} /> {item.location}
                                        </a>
                                    )}
                                </div>
                            </div>
                            
                            {/* Connector Button if gap detected */}
                            {showGapButton && (
                                <div className="relative h-6 mb-6 flex items-center">
                                    <button 
                                        onClick={() => handleOpenItemEdit(undefined, { 
                                            startTime: item.endTime || item.startTime, 
                                            endTime: nextItem.startTime,
                                            type: 'TRANSPORT'
                                        })}
                                        className="absolute left-4 -translate-x-1/2 w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-600 flex items-center justify-center transition-all z-20 shadow-sm"
                                        title="Add Travel Time"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Add Button */}
            <Button onClick={() => handleOpenItemEdit()} variant="secondary" className="w-full border-dashed text-slate-500">
                <Plus size={18} /> Add Itinerary Item
            </Button>
          </div>
        )}

        {/* --- MEDIA TAB --- */}
        {activeTab === 'MEDIA' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             <PhotoFeed 
              photos={photos} 
              users={allUsers}
              itineraryItems={itineraryItems}
              onEditTags={(photo) => setTaggingPhoto(photo)}
             />
             
             {/* FAB */}
             <div className="fixed bottom-6 right-6 z-40">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-indigo-600 text-white p-4 rounded-full shadow-xl hover:scale-105 transition-transform flex items-center justify-center ring-4 ring-indigo-600/20"
                >
                  <Camera size={28} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleGlobalUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
          </div>
        )}

        {/* --- VOTE TAB --- */}
        {activeTab === 'VOTE' && (
          <div className="space-y-4 pb-20 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {polls.length === 0 && (
              <div className="text-center py-10 text-slate-400">
                <Vote className="mx-auto mb-2 opacity-50" size={48} />
                <p>No active polls.</p>
              </div>
            )}
            {polls.map(poll => (
              <div key={poll.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-lg mb-4 text-slate-800">{poll.question}</h3>
                <div className="space-y-3">
                  {poll.options.map(opt => {
                    const isSelected = opt.votes.includes(user.id);
                    const totalVotes = poll.options.reduce((acc, curr) => acc + curr.votes.length, 0);
                    const percent = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                    
                    return (
                      <button 
                        key={opt.id}
                        onClick={() => handleVote(poll.id, opt.id)}
                        className={`w-full relative overflow-hidden rounded-xl border p-3 text-left transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                      >
                         <div className="flex justify-between items-center relative z-10 mb-1">
                            <span className={`font-medium ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{opt.text}</span>
                            {isSelected && <Check size={16} className="text-indigo-600" />}
                         </div>
                         <div className="relative z-10 flex justify-between text-xs text-slate-500">
                            <span>{opt.votes.length} votes</span>
                            <span>{percent}%</span>
                         </div>
                         {/* Progress Bar Background */}
                         <div 
                           className="absolute bottom-0 left-0 h-1 bg-indigo-200 transition-all duration-500" 
                           style={{ width: `${percent}%` }}
                         />
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            <Button onClick={handleCreatePoll} variant="secondary" className="w-full mt-4 border-dashed">
              + Create New Poll
            </Button>
          </div>
        )}

        {/* --- INFO TAB --- */}
        {activeTab === 'INFO' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
             {/* Group Details Card */}
             <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="h-40 relative">
                   <img src={group.coverImage} className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-black/30 flex items-end p-4">
                      <h2 className="text-2xl font-bold text-white leading-none">{group.name}</h2>
                   </div>
                </div>
                <div className="p-4 space-y-4">
                   <div className="flex items-center gap-3 text-slate-700">
                      <MapPin size={20} className="text-indigo-600 shrink-0" />
                      <span className="font-medium">{group.destination}</span>
                   </div>
                   <div className="flex items-center gap-3 text-slate-700">
                      <Calendar size={20} className="text-indigo-600 shrink-0" />
                      <span className="font-medium">{new Date(group.startDate).toLocaleDateString()} - {new Date(group.endDate).toLocaleDateString()}</span>
                   </div>
                   {group.description && (
                       <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm leading-relaxed">
                          {group.description}
                       </p>
                   )}
                   
                   {/* Join Code */}
                   <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex justify-between items-center">
                      <div>
                         <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Join Code</p>
                         <p className="text-2xl font-mono font-bold text-indigo-700 tracking-widest leading-none">{group.joinCode}</p>
                      </div>
                      <button onClick={() => { navigator.clipboard.writeText(group.joinCode); }} className="p-2 hover:bg-indigo-100 rounded-lg text-indigo-600 transition-colors" title="Copy Code">
                         <Copy size={20} />
                      </button>
                   </div>
                </div>
             </div>

             {/* Members List */}
             <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800">
                   <Users size={20} className="text-indigo-600" /> Members ({allUsers.length})
                </h3>
                <div className="space-y-3">
                   {allUsers.map(u => (
                      <div key={u.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors">
                         <img src={u.avatar} className="w-12 h-12 rounded-full border border-slate-200 object-cover bg-slate-100" />
                         <div>
                            <p className="font-bold text-slate-800 leading-tight">{u.name}</p>
                            <p className="text-xs text-slate-500">{u.email || 'Group Member'}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        )}
      </div>

      {/* --- EDIT GROUP MODAL --- */}
      {isEditingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Edit Trip Details</h3>
              <button onClick={() => setIsEditingGroup(false)} className="p-1 hover:bg-slate-100 rounded-full"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleEditGroupSubmit} className="space-y-4 overflow-y-auto flex-1 px-1">
              {/* Cover Image Edit */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Cover Photo</label>
                <div 
                  onClick={() => editCoverInputRef.current?.click()}
                  className="w-full h-32 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:opacity-80 overflow-hidden relative"
                >
                  <img src={editCover} className="w-full h-full object-cover" alt="Current Cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Camera className="text-white drop-shadow-md" size={32} />
                  </div>
                  <input type="file" ref={editCoverInputRef} onChange={handleEditCoverUpload} accept="image/*" className="hidden" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Group Name</label>
                <input required value={editName} onChange={e => setEditName(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Destination</label>
                <input required value={editDest} onChange={e => setEditDest(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
                <textarea rows={4} value={editDesc} onChange={e => setEditDesc(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500" placeholder="Trip summary..." />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start</label>
                  <input required type="date" value={editStart} onChange={e => setEditStart(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">End</label>
                  <input required type="date" value={editEnd} onChange={e => setEditEnd(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <Button type="submit" className="w-full mt-2">Save Changes</Button>
            </form>
          </div>
        </div>
      )}

      {/* --- ITINERARY ITEM EDIT MODAL --- */}
      {isEditingItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl h-[70vh] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{itemId ? 'Edit Activity' : 'New Activity'}</h3>
                <button onClick={() => setIsEditingItem(false)} className="p-1 hover:bg-slate-100 rounded-full"><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveItineraryItem} className="space-y-4 overflow-y-auto flex-1 px-1">
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                        {Object.keys(ITINERARY_ICONS).map(type => (
                            <button
                                type="button" 
                                key={type}
                                onClick={() => setItemType(type as ItineraryType)}
                                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-colors ${itemType === type ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            >
                                {ITINERARY_ICONS[type as ItineraryType]}
                                <span className="text-[10px] mt-1 font-bold">{type}</span>
                            </button>
                        ))}
                    </div>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Title</label>
                    <input required value={itemTitle} onChange={e => setItemTitle(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500" placeholder={itemType === 'TRANSPORT' ? "e.g. Bus to Hotel" : "e.g. Flight to Tokyo"} />
                 </div>
                 {itemType !== 'TRANSPORT' && (
                     <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location</label>
                        <div className="flex gap-2 mt-1">
                            <div className="relative flex-1">
                                <input 
                                    value={itemLoc} 
                                    onChange={e => setItemLoc(e.target.value)} 
                                    className="w-full p-3 pl-10 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500" 
                                    placeholder="Search specific place..." 
                                />
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            </div>
                            <Button 
                                type="button" 
                                variant="secondary" 
                                onClick={handleAiLocationSearch} 
                                disabled={isLocLoading || !itemLoc}
                                className="px-3"
                                title="Search with Google Maps"
                            >
                                {isLocLoading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                            </Button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 pl-1">
                           Type a place name and click search to find address via Google Maps.
                        </p>
                     </div>
                 )}
                 <div className="grid grid-cols-1 gap-3">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start Time</label>
                        <input required type="datetime-local" value={itemStart} onChange={e => setItemStart(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">End Time</label>
                        <input type="datetime-local" value={itemEnd} onChange={e => setItemEnd(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500" />
                    </div>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notes</label>
                    <textarea rows={3} value={itemNotes} onChange={e => setItemNotes(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500" placeholder="Reservation numbers, packing tips..." />
                 </div>
                 <div className="flex gap-3 mt-4">
                     {itemId && (
                        <Button type="button" variant="ghost" onClick={() => handleDeleteItem(itemId)} className="text-red-500 hover:bg-red-50">
                            <Trash2 size={20} />
                        </Button>
                     )}
                     <Button type="submit" className="flex-1">Save Activity</Button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* --- ITINERARY ITEM DETAIL VIEW --- */}
      {selectedItineraryItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl h-[85vh] flex flex-col relative">
                {/* Header Image/Color */}
                <div className={`h-32 ${
                     selectedItineraryItem.type === 'FLIGHT' ? 'bg-blue-500' :
                     selectedItineraryItem.type === 'LODGING' ? 'bg-purple-500' :
                     selectedItineraryItem.type === 'FOOD' ? 'bg-orange-500' :
                     selectedItineraryItem.type === 'ATTRACTION' ? 'bg-green-500' : 
                     selectedItineraryItem.type === 'TRANSPORT' ? 'bg-slate-600' : 'bg-slate-500'
                } relative`}>
                    <button onClick={() => setSelectedItineraryItem(null)} className="absolute top-4 right-4 p-2 bg-black/20 text-white rounded-full hover:bg-black/40"><X size={20} /></button>
                    <div className="absolute -bottom-8 left-6 w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md">
                         <div className="text-slate-800 scale-150">
                            {ITINERARY_ICONS[selectedItineraryItem.type]}
                         </div>
                    </div>
                </div>

                <div className="pt-10 px-6 pb-4 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 leading-tight">{selectedItineraryItem.title}</h2>
                        <p className="text-sm text-slate-500 font-medium mt-1">
                            {selectedItineraryItem.type}
                        </p>
                    </div>
                    <button onClick={() => handleOpenItemEdit(selectedItineraryItem)} className="text-indigo-600 text-sm font-bold px-3 py-1 bg-indigo-50 rounded-full hover:bg-indigo-100">
                        Edit
                    </button>
                </div>

                <div className="px-6 space-y-4 overflow-y-auto flex-1">
                    <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-2 text-slate-700">
                            <Clock size={16} className="text-slate-400" />
                            <div>
                                <p className="font-bold">Start</p>
                                <p>{new Date(selectedItineraryItem.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                            </div>
                        </div>
                        {selectedItineraryItem.endTime && (
                            <div className="flex items-center gap-2 text-slate-700">
                                <ArrowRight size={16} className="text-slate-300" />
                                <div>
                                    <p className="font-bold">End</p>
                                    <p>{new Date(selectedItineraryItem.endTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {selectedItineraryItem.location && (
                        <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedItineraryItem.location)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-2 text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 hover:bg-indigo-50 hover:border-indigo-200 transition-colors group"
                        >
                            <MapPin size={16} className="text-indigo-500 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="group-hover:text-indigo-700 underline decoration-dotted decoration-indigo-300 underline-offset-4">{selectedItineraryItem.location}</span>
                        </a>
                    )}

                    {selectedItineraryItem.notes && (
                        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-sm text-yellow-900">
                            <h4 className="font-bold mb-1 flex items-center gap-2"><Info size={14}/> Notes</h4>
                            <p className="whitespace-pre-wrap opacity-90">{selectedItineraryItem.notes}</p>
                        </div>
                    )}

                    <div className="pt-4 border-t border-slate-100 pb-8">
                        <h3 className="font-bold text-slate-800 mb-3 flex justify-between items-center">
                            <span>Photos ({photos.filter(p => p.itineraryItemId === selectedItineraryItem.id).length})</span>
                            <button onClick={() => itemPhotoInputRef.current?.click()} className="text-indigo-600 text-xs flex items-center gap-1 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors">
                                <Plus size={14} /> Add Photo
                            </button>
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                             {photos.filter(p => p.itineraryItemId === selectedItineraryItem.id).map(p => (
                                 <button 
                                    key={p.id} 
                                    onClick={() => setViewingPhoto(p)}
                                    className="relative group w-full aspect-square rounded-lg overflow-hidden border border-slate-100"
                                 >
                                    <img src={p.url} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                 </button>
                             ))}
                             {photos.filter(p => p.itineraryItemId === selectedItineraryItem.id).length === 0 && (
                                 <div className="col-span-3 text-center py-4 text-slate-400 text-sm italic">
                                     No photos linked to this activity yet.
                                 </div>
                             )}
                        </div>
                        <input type="file" ref={itemPhotoInputRef} onChange={handleItemPhotoUpload} accept="image/*" className="hidden" />
                    </div>
                </div>
           </div>
        </div>
      )}

      {/* --- LIGHTBOX MODAL --- */}
      {viewingPhoto && (
        <div className="fixed inset-0 z-[70] bg-black/95 flex flex-col justify-center items-center p-4 animate-in fade-in duration-200" onClick={() => setViewingPhoto(null)}>
            <button onClick={() => setViewingPhoto(null)} className="absolute top-6 left-6 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 backdrop-blur-md">
                <X size={24} />
            </button>

            <div className="relative max-w-full max-h-[85vh]" onClick={e => e.stopPropagation()}>
                <img src={viewingPhoto.url} className="max-w-full max-h-[85vh] rounded-lg shadow-2xl" />
                
                {/* The Red Circle Tag Button */}
                <button 
                    onClick={() => setTaggingPhoto(viewingPhoto)}
                    className="absolute -top-4 -right-4 bg-red-500 text-white p-3 rounded-full shadow-xl hover:bg-red-600 hover:scale-110 transition-all ring-4 ring-black/10"
                    title="Tag People"
                >
                    <UserPlus size={24} />
                </button>

                {(viewingPhoto.taggedUserIds?.length || 0) > 0 && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
                        <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 text-white text-sm shadow-lg">
                            <Users size={14} />
                            <span className="font-medium">
                                {viewingPhoto.taggedUserIds!.map(id => allUsers.find(u => u.id === id)?.name).join(', ')}
                            </span>
                        </div>
                    </div>
                )}
            </div>
            
            {viewingPhoto.caption && (
                <p className="mt-4 text-white/80 text-center max-w-md">{viewingPhoto.caption}</p>
            )}
        </div>
      )}

      {/* --- TAGGING MODAL --- */}
      {taggingPhoto && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg">Tag People</h3>
              <button onClick={() => setTaggingPhoto(null)} className="p-1 rounded-full hover:bg-slate-100"><X size={20} /></button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto p-2">
              <div className="grid gap-2">
                {allUsers.map(u => {
                   const isTagged = (taggingPhoto.taggedUserIds || []).includes(u.id);
                   return (
                     <button
                        key={u.id}
                        onClick={() => {
                          const currentTags = taggingPhoto.taggedUserIds || [];
                          const newTags = isTagged 
                            ? currentTags.filter(id => id !== u.id)
                            : [...currentTags, u.id];
                          
                          // Optimistic update for local modal state if needed, 
                          // but here we update actual state via handler
                          setTaggingPhoto({ ...taggingPhoto, taggedUserIds: newTags }); 
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-colors border ${isTagged ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-transparent hover:bg-slate-50'}`}
                     >
                       <img src={u.avatar} className="w-10 h-10 rounded-full" />
                       <span className="font-medium text-slate-800 flex-1 text-left">{u.name}</span>
                       {isTagged && <Check size={20} className="text-indigo-600" />}
                     </button>
                   );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <Button onClick={() => handleUpdateTags(taggingPhoto.id, taggingPhoto.taggedUserIds || [])} className="w-full">
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (playingGamePhoto) {
    return (
        <div className="min-h-screen bg-slate-50 p-4">
             <MemoryGame 
                photo={playingGamePhoto} 
                onBack={() => setPlayingGamePhoto(null)} 
            />
        </div>
    );
  }

  if (mode === AppMode.ENDED) {
      return (
        <div className="min-h-screen bg-slate-50">
            {renderHeader()}
            <div className="p-4">
                <Recap 
                    users={allUsers} 
                    photos={photos} 
                    polls={polls} 
                    itineraryItems={itineraryItems}
                    group={group}
                    onStartMemoryGame={() => {
                        if (photos.length > 0) {
                             // Simple logic: pick the first one or random
                             setPlayingGamePhoto(photos[0]);
                        } else {
                             alert("No photos available for game!");
                        }
                    }}
                />
            </div>
        </div>
      );
  }

  return (
      <div className="min-h-screen bg-slate-50">
          {renderHeader()}
          {renderActiveView()}
      </div>
  );
};