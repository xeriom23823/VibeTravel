import React, { useState, useRef } from 'react';
import { Group, User } from '../types';
import { Button } from './Button';
import { Calendar, MapPin, Plus, Users, Search, ArrowRight, X, Camera, Image as ImageIcon } from 'lucide-react';

interface DashboardScreenProps {
  user: User;
  groups: Group[];
  onSelectGroup: (group: Group) => void;
  onCreateGroup: (group: Group) => void;
  onJoinGroup: (code: string) => void;
  onLogout: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ 
  user, 
  groups, 
  onSelectGroup,
  onCreateGroup,
  onJoinGroup,
  onLogout 
}) => {
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'ONGOING' | 'ENDED'>('ONGOING');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  
  // Create Form State
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDest, setNewGroupDest] = useState('');
  const [newGroupStart, setNewGroupStart] = useState('');
  const [newGroupEnd, setNewGroupEnd] = useState('');
  const [newGroupCover, setNewGroupCover] = useState('');
  
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Join Form State
  const [joinCode, setJoinCode] = useState('');

  const filteredGroups = groups.filter(g => g.status === activeTab);

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setNewGroupCover(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Use uploaded cover or fallback to random unsplash
    const finalCover = newGroupCover || `https://source.unsplash.com/random/800x600/?${encodeURIComponent(newGroupDest)}`;
    
    const newGroup: Group = {
      id: Date.now().toString(),
      name: newGroupName,
      destination: newGroupDest,
      startDate: newGroupStart,
      endDate: newGroupEnd,
      status: 'UPCOMING',
      coverImage: finalCover,
      joinCode: Math.random().toString(36).substring(2, 8).toUpperCase()
    };
    onCreateGroup(newGroup);
    setShowCreateModal(false);
    
    // Reset form
    setNewGroupName('');
    setNewGroupDest('');
    setNewGroupStart('');
    setNewGroupEnd('');
    setNewGroupCover('');
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(joinCode) {
        onJoinGroup(joinCode);
        setShowJoinModal(false);
        setJoinCode('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <img src={user.avatar} alt="Me" className="w-10 h-10 rounded-full border border-slate-200" />
          <div>
            <h2 className="font-bold text-slate-800 leading-tight">Hello, {user.name}</h2>
            <button onClick={onLogout} className="text-xs text-slate-500 hover:text-red-500">Sign out</button>
          </div>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setShowJoinModal(true)}
                className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200"
            >
                <Search size={20} />
            </button>
            <button 
                onClick={() => setShowCreateModal(true)}
                className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-md shadow-indigo-200"
            >
                <Plus size={20} />
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-4 gap-2 overflow-x-auto">
        {(['ONGOING', 'UPCOMING', 'ENDED'] as const).map(status => (
          <button
            key={status}
            onClick={() => setActiveTab(status)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              activeTab === status 
              ? 'bg-slate-900 text-white' 
              : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 px-4 pb-20 space-y-4">
        {filteredGroups.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <MapPin size={24} />
            </div>
            <p className="text-slate-500">No {activeTab.toLowerCase()} trips found.</p>
            {activeTab === 'UPCOMING' && <Button variant="ghost" onClick={() => setShowCreateModal(true)} className="mt-2">Create one?</Button>}
          </div>
        ) : (
          filteredGroups.map(group => (
            <div 
              key={group.id} 
              onClick={() => onSelectGroup(group)}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="h-32 bg-slate-200 relative overflow-hidden">
                <img src={group.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={group.name} />
                <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-lg">
                  {group.status}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg text-slate-800 mb-1">{group.name}</h3>
                <div className="flex items-center text-slate-500 text-sm gap-4">
                  <span className="flex items-center gap-1"><MapPin size={14} /> {group.destination}</span>
                  <span className="flex items-center gap-1"><Calendar size={14} /> {group.startDate.slice(5)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">New Trip</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-slate-100 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Cover Image Upload */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Cover Photo</label>
                <div 
                  onClick={() => coverInputRef.current?.click()}
                  className="w-full h-32 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 overflow-hidden relative"
                >
                  {newGroupCover ? (
                    <>
                      <img src={newGroupCover} className="w-full h-full object-cover" alt="Preview" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Camera className="text-white" />
                      </div>
                    </>
                  ) : (
                    <>
                       <ImageIcon className="text-slate-400 mb-1" />
                       <span className="text-xs text-slate-400">Tap to upload</span>
                    </>
                  )}
                  <input type="file" ref={coverInputRef} onChange={handleCoverUpload} accept="image/*" className="hidden" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Group Name</label>
                <input required value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500" placeholder="e.g. Summer Vacation" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Destination</label>
                <input required value={newGroupDest} onChange={e => setNewGroupDest(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500" placeholder="e.g. Kyoto" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start</label>
                  <input required type="date" value={newGroupStart} onChange={e => setNewGroupStart(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">End</label>
                  <input required type="date" value={newGroupEnd} onChange={e => setNewGroupEnd(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <Button type="submit" className="w-full mt-2">Create Group</Button>
            </form>
          </div>
        </div>
      )}

      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Join Group</h3>
              <button onClick={() => setShowJoinModal(false)} className="p-1 hover:bg-slate-100 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleJoinSubmit} className="space-y-4">
               <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Group Code</label>
                <input required value={joinCode} onChange={e => setJoinCode(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-center uppercase tracking-widest text-lg" placeholder="XYZ123" />
              </div>
              <Button type="submit" className="w-full mt-2">Join Adventure</Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};