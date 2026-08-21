export type GalliEvent = {
  id: string;
  character: string;
  dialogue: string;
  category: 'conversation' | 'traffic' | 'chai' | 'nostalgia' | 'environment' | 'rare';
  weight: number;
  cooldownSeconds: number;
  // future fields
  video?: string;
  audio?: string;
  duration?: number;
}

const events: GalliEvent[] = [
  { id: 'chicha', character: 'CHICHA', dialogue: 'Do chai, do Osmania. Garam hai miya!', category: 'chai', weight: 8, cooldownSeconds: 25 },
  { id: 'saleem', character: 'SALEEM', dialogue: 'Chicha... kal ka hisaab aaj bhi kal pe daal do.', category: 'conversation', weight: 6, cooldownSeconds: 20 },
  { id: 'rafi_auto', character: 'RAFI — AUTO DRIVER', dialogue: 'Mehdipatnam? Meter pe? Hau... sapne mein!', category: 'traffic', weight: 7, cooldownSeconds: 18 },
  { id: 'baba', character: 'BABA', dialogue: 'Pehle Hyderabad mein itna traffic nai tha re.', category: 'nostalgia', weight: 5, cooldownSeconds: 40 },
  { id: 'street', character: 'STREET', dialogue: 'RTC bus passed. For ten seconds nobody could hear anybody.', category: 'environment', weight: 6, cooldownSeconds: 30 },
  { id: 'paan', character: 'PAAN DABBA', dialogue: 'A regular customer arrived, said nothing, and got his usual.', category: 'conversation', weight: 5, cooldownSeconds: 25 },
  { id: 'college', character: 'COLLEGE GUYS', dialogue: 'Bhai bas paanch minute baithte...', category: 'conversation', weight: 6, cooldownSeconds: 20 },
  { id: 'vendor', character: 'SWEETS VENDOR', dialogue: 'Mirchi bajji, garam mirchi!', category: 'environment', weight: 4, cooldownSeconds: 30 },
  { id: 'rickshaw', character: 'RICKSHAW', dialogue: 'Kisi ko lift chahiye? Chalo bhai.', category: 'traffic', weight: 6, cooldownSeconds: 18 },
  { id: 'nostalgia2', character: 'OLD FRIEND', dialogue: 'Yaad hai? Hum log yahin pe padha karte the.', category: 'nostalgia', weight: 4, cooldownSeconds: 60 },
  { id: 'rain1', character: 'WEATHER', dialogue: 'Barish aayi — thandi hawa chal rahi.', category: 'environment', weight: 3, cooldownSeconds: 120 },
  { id: 'power_cut', character: 'POWER CUT', dialogue: 'The entire galli suddenly goes dark for a few seconds.', category: 'rare', weight: 1, cooldownSeconds: 180 }
]

export default events
