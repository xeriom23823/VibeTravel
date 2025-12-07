import { User, Group, ItineraryItem } from './types';

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alice', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Alice' },
  { id: 'u2', name: 'Bob', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Bob' },
  { id: 'u3', name: 'Charlie', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Charlie' },
  { id: 'me', name: 'Felix', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Felix' },
];

export const CURRENT_USER_ID = 'me';

export const LOCATIONS = [
  "Central Station",
  "Blue Lagoon",
  "Mountain View Point",
  "Old Town Market",
  "Sunset Beach"
];

export const MOCK_GROUPS: Group[] = [
  {
    id: 'g1',
    name: 'Tokyo Adventure 2024',
    destination: 'Tokyo, Japan',
    startDate: '2024-04-01',
    endDate: '2024-04-10',
    status: 'ONGOING',
    coverImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=500&auto=format&fit=crop&q=60',
    joinCode: 'TOKYO24',
    description: 'A 10-day journey through the neon streets and historic temples of Tokyo.',
    stats: {
      'u1': { openGroup: 5, viewItinerary: 12, editItinerary: 3, photos: 2, votes: 1 },
      'u2': { openGroup: 2, viewItinerary: 1, editItinerary: 0, photos: 15, votes: 2 },
      'u3': { openGroup: 8, viewItinerary: 20, editItinerary: 1, photos: 0, votes: 0 },
      'me': { openGroup: 10, viewItinerary: 5, editItinerary: 8, photos: 5, votes: 3 }
    }
  },
  {
    id: 'g2',
    name: 'Weekend in Paris',
    destination: 'Paris, France',
    startDate: '2024-05-15',
    endDate: '2024-05-18',
    status: 'UPCOMING',
    coverImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500&auto=format&fit=crop&q=60',
    joinCode: 'PARIS24',
    stats: {}
  },
  {
    id: 'g3',
    name: 'Iceland Roadtrip',
    destination: 'Reykjavik, Iceland',
    startDate: '2023-11-01',
    endDate: '2023-11-10',
    status: 'ENDED',
    coverImage: 'https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=500&auto=format&fit=crop&q=60',
    joinCode: 'ICE23',
    stats: {
      'u1': { openGroup: 20, viewItinerary: 40, editItinerary: 10, photos: 50, votes: 5 },
      'u2': { openGroup: 5, viewItinerary: 5, editItinerary: 0, photos: 5, votes: 1 },
      'me': { openGroup: 15, viewItinerary: 20, editItinerary: 5, photos: 10, votes: 5 }
    }
  }
];

export const MOCK_ITINERARY_ITEMS: ItineraryItem[] = [
  {
    id: 'i1',
    groupId: 'g1',
    type: 'FLIGHT',
    title: 'Flight to Narita (JL 001)',
    location: 'SFO International Terminal',
    startTime: '2024-04-01T10:00',
    endTime: '2024-04-02T14:00',
    notes: 'Meet at Gate A5 by 9:00 AM. Don\'t forget passports!'
  },
  {
    id: 'i2',
    groupId: 'g1',
    type: 'LODGING',
    title: 'Check-in: Shibuya Stream Excel',
    location: 'Shibuya, Tokyo',
    startTime: '2024-04-02T16:00',
    notes: 'Booking ID: #88223. We have 3 twin rooms.'
  },
  {
    id: 'i3',
    groupId: 'g1',
    type: 'FOOD',
    title: 'Welcome Dinner @ Gonpachi',
    location: 'Nishi-Azabu',
    startTime: '2024-04-02T19:00',
    endTime: '2024-04-02T21:00',
    notes: 'The "Kill Bill" restaurant. Reservation under Alice.'
  },
  {
    id: 'i4',
    groupId: 'g1',
    type: 'ATTRACTION',
    title: 'TeamLab Planets',
    location: 'Toyosu',
    startTime: '2024-04-03T10:00',
    endTime: '2024-04-03T12:00',
    notes: 'Wear shorts that can roll up, there is water.'
  }
];