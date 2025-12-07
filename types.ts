export enum AppMode {
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  ARCHIVE = 'ARCHIVE'
}

export type TripStatus = 'UPCOMING' | 'ONGOING' | 'ENDED';

export interface UserStats {
  openGroup: number;
  viewItinerary: number;
  editItinerary: number;
  photos: number;
  votes: number;
}

export interface Group {
  id: string;
  name: string;
  destination: string;
  startDate: string; // ISO Date
  endDate: string;   // ISO Date
  status: TripStatus;
  coverImage: string;
  joinCode: string;
  description?: string;
  stats?: Record<string, UserStats>; // key is userId
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  email?: string;
}

export type ItineraryType = 'FLIGHT' | 'LODGING' | 'ATTRACTION' | 'FOOD' | 'TRANSPORT' | 'OTHER';

export interface ItineraryItem {
  id: string;
  groupId: string;
  type: ItineraryType;
  title: string;
  location?: string;
  startTime: string; // ISO DateTime
  endTime?: string; // ISO DateTime
  notes?: string;
}

export interface Photo {
  id: string;
  url: string; // Base64 or URL
  userId: string;
  caption?: string;
  location?: string;
  timestamp: number;
  taggedUserIds?: string[];
  itineraryItemId?: string; // Linked to an itinerary unit
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // array of user IDs
  imageUrl?: string;
}

export interface Poll {
  id: string;
  question: string;
  creatorId: string;
  options: PollOption[];
  isActive: boolean;
  timestamp: number;
}

export interface Announcement {
  id: string;
  text: string;
  creatorId: string;
  targetUserIds?: string[];
  timestamp: number;
  isImportant: boolean;
}

export interface Notification {
  id: string;
  type: 'ANNOUNCEMENT' | 'POLL' | 'PHOTO' | 'TAG';
  message: string;
  timestamp: number;
  isRead: boolean;
  relatedId?: string;
}

export interface Award {
  title: string;
  winnerName: string;
  reason: string;
  icon: string;
}

// For the AI Memory Game
export interface MemoryChallenge {
  originalImage: string;
  alteredImage: string;
  diffDescription: string;
  options: string[];
  correctAnswer: string;
}