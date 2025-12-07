import React, { useState } from 'react';
import { User, Group } from './types';
import { MOCK_GROUPS, MOCK_USERS } from './constants';
import { AuthScreen } from './components/AuthScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { TripScreen } from './components/TripScreen';

enum Screen {
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD',
  TRIP = 'TRIP'
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.AUTH);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groups, setGroups] = useState<Group[]>(MOCK_GROUPS);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentScreen(Screen.DASHBOARD);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentScreen(Screen.AUTH);
    setSelectedGroup(null);
  };

  const handleSelectGroup = (group: Group) => {
    setSelectedGroup(group);
    setCurrentScreen(Screen.TRIP);
  };

  const handleCreateGroup = (newGroup: Group) => {
    setGroups(prev => [newGroup, ...prev]);
  };

  const handleUpdateGroup = (updatedGroup: Group) => {
    setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
    setSelectedGroup(updatedGroup);
  };

  const handleJoinGroup = (code: string) => {
    // In a real app, this would check against an API.
    // For now, we simulate finding a group by code or alert failure
    const found = groups.find(g => g.joinCode === code);
    if (found) {
      alert(`Joined ${found.name} successfully!`);
    } else {
      alert("Group code not found.");
    }
  };

  // Rendering
  if (currentScreen === Screen.AUTH || !currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  if (currentScreen === Screen.TRIP && selectedGroup) {
    return (
      <div className="max-w-md mx-auto shadow-2xl overflow-hidden border-x border-slate-200 min-h-screen bg-white">
        <TripScreen 
          user={currentUser} 
          group={selectedGroup} 
          onUpdateGroup={handleUpdateGroup}
          onBack={() => setCurrentScreen(Screen.DASHBOARD)}
          mockUsers={MOCK_USERS}
        />
      </div>
    );
  }

  // Dashboard View
  return (
     <div className="max-w-md mx-auto shadow-2xl overflow-hidden border-x border-slate-200 min-h-screen bg-slate-50">
        <DashboardScreen 
          user={currentUser} 
          groups={groups} 
          onSelectGroup={handleSelectGroup} 
          onCreateGroup={handleCreateGroup}
          onJoinGroup={handleJoinGroup}
          onLogout={handleLogout}
        />
     </div>
  );
};

export default App;