export interface MemoryEntry {
  id: string | number;
  name: string;
  place: string;
  object: string;
  memory: string;
  type: string;
  image?: string | null;
  audio?: string | null;
  date: string;
  verified?: boolean;
  createdAt?: any;
  userId?: string;
}

export interface AppSettings {
  showDate: boolean;
}

export const PALETTES = [
  ['#d8d3c8','#b8b4a8','#9a9690'],
  ['#cec9bc','#ada98e','#8e8a7e'],
  ['#d4cfc4','#b4b0a4','#97938a'],
  ['#c8c3b6','#a8a49a','#8c8880'],
  ['#ddd8ce','#bcb8ac','#9e9a92'],
  ['#c2bdb0','#a2a096','#86837a'],
  ['#d0cbbf','#b0aca0','#949088'],
  ['#cabfb2','#a8a396','#8d897e'],
];

export const OFFERING_TYPES = [
  'sketch',
  'photograph',
  'written note',
  'poem',
  'object scan',
  'whisper'
];
