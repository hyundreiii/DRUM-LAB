import { Achievement, CustomLayoutMap, DrumRecording, UserStats } from '../types';

const STATS_STORAGE_KEY = 'digital_real_drum_stats_v1';
const RECORDINGS_STORAGE_KEY = 'digital_real_drum_recordings_v1';
const LAYOUT_STORAGE_KEY = 'digital_real_drum_custom_layout_v1';
const SETTINGS_STORAGE_KEY = 'digital_real_drum_settings_v1';

export const ALL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_beat',
    title: 'First Beat',
    description: 'Hit any drum pad and begin your drumming journey.',
    icon: '🥁',
  },
  {
    id: 'century_hit',
    title: 'Century Hit',
    description: 'Play 100 drum beats.',
    icon: '⚡',
    maxProgress: 100,
  },
  {
    id: 'beat_machine',
    title: 'Beat Machine',
    description: 'Play 1,000 drum beats like a tireless pro.',
    icon: '🔥',
    maxProgress: 1000,
  },
  {
    id: 'rockstar_initiate',
    title: 'Rockstar Initiate',
    description: 'Complete your first practice lesson.',
    icon: '🌟',
  },
  {
    id: 'rhythm_master',
    title: 'Rhythm Master',
    description: 'Score 90% or higher accuracy on any lesson.',
    icon: '🎯',
  },
  {
    id: 'combo_king',
    title: 'Combo King',
    description: 'Maintain a 30-hit combo streak without a miss.',
    icon: '👑',
    maxProgress: 30,
  },
  {
    id: 'studio_producer',
    title: 'Studio Producer',
    description: 'Record and save a drum performance.',
    icon: '🎙️',
  },
  {
    id: 'kit_explorer',
    title: 'Kit Explorer',
    description: 'Play with at least 4 different drum sound kits.',
    icon: '🎛️',
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Play drum beats at 160 BPM or faster.',
    icon: '🚀',
  },
];

const DEFAULT_STATS: UserStats = {
  totalPracticeTimeSeconds: 0,
  totalBeatsPlayed: 0,
  level: 1,
  xp: 0,
  completedLessons: [],
  lessonScores: {},
  bestCombo: 0,
  unlockedAchievements: [],
};

export interface AppSettings {
  masterVolume: number;
  drumVolume: number;
  metronomeVolume: number;
  vibrationEnabled: boolean;
  showKeyboardGuide: boolean;
  backgroundTheme: string;
  metronomeBpm: number;
  metronomeSignature: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  masterVolume: 1.0,
  drumVolume: 1.0,
  metronomeVolume: 0.8,
  vibrationEnabled: true,
  showKeyboardGuide: true,
  backgroundTheme: 'dark_stage',
  metronomeBpm: 100,
  metronomeSignature: '4/4',
};

export function loadUserStats(): UserStats {
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_STATS, ...JSON.parse(raw) };
    }
  } catch {
    // Return default
  }
  return DEFAULT_STATS;
}

export function saveUserStats(stats: UserStats): void {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Ignore quota issues
  }
}

export function addBeatsToStats(count: number = 1): { newStats: UserStats; newlyUnlocked: Achievement[] } {
  const stats = loadUserStats();
  stats.totalBeatsPlayed += count;

  // XP calculation: 2 XP per beat
  stats.xp += count * 2;
  stats.level = Math.floor(stats.xp / 200) + 1;

  const newlyUnlocked: Achievement[] = [];

  // Check achievements
  if (stats.totalBeatsPlayed >= 1 && !stats.unlockedAchievements.includes('first_beat')) {
    stats.unlockedAchievements.push('first_beat');
    const ach = ALL_ACHIEVEMENTS.find((a) => a.id === 'first_beat');
    if (ach) newlyUnlocked.push(ach);
  }

  if (stats.totalBeatsPlayed >= 100 && !stats.unlockedAchievements.includes('century_hit')) {
    stats.unlockedAchievements.push('century_hit');
    const ach = ALL_ACHIEVEMENTS.find((a) => a.id === 'century_hit');
    if (ach) newlyUnlocked.push(ach);
  }

  if (stats.totalBeatsPlayed >= 1000 && !stats.unlockedAchievements.includes('beat_machine')) {
    stats.unlockedAchievements.push('beat_machine');
    const ach = ALL_ACHIEVEMENTS.find((a) => a.id === 'beat_machine');
    if (ach) newlyUnlocked.push(ach);
  }

  saveUserStats(stats);
  return { newStats: stats, newlyUnlocked };
}

export function updateLessonStats(
  lessonId: string,
  accuracy: number,
  maxCombo: number,
  score: number,
  durationSeconds: number
): { newStats: UserStats; newlyUnlocked: Achievement[] } {
  const stats = loadUserStats();
  stats.totalPracticeTimeSeconds += durationSeconds;
  stats.totalBeatsPlayed += maxCombo;

  if (!stats.completedLessons.includes(lessonId)) {
    stats.completedLessons.push(lessonId);
  }

  if (maxCombo > stats.bestCombo) {
    stats.bestCombo = maxCombo;
  }

  // Calculate stars: >=90: 3 stars, >=75: 2 stars, >=50: 1 star
  const stars = accuracy >= 90 ? 3 : accuracy >= 75 ? 2 : accuracy >= 50 ? 1 : 0;

  const prev = stats.lessonScores[lessonId];
  if (!prev || score > prev.highscore) {
    stats.lessonScores[lessonId] = {
      accuracy,
      maxCombo,
      stars,
      highscore: score,
    };
  }

  // Add XP: 100 base + accuracy * 2
  stats.xp += Math.round(100 + accuracy * 2);
  stats.level = Math.floor(stats.xp / 200) + 1;

  const newlyUnlocked: Achievement[] = [];

  if (!stats.unlockedAchievements.includes('rockstar_initiate')) {
    stats.unlockedAchievements.push('rockstar_initiate');
    const ach = ALL_ACHIEVEMENTS.find((a) => a.id === 'rockstar_initiate');
    if (ach) newlyUnlocked.push(ach);
  }

  if (accuracy >= 90 && !stats.unlockedAchievements.includes('rhythm_master')) {
    stats.unlockedAchievements.push('rhythm_master');
    const ach = ALL_ACHIEVEMENTS.find((a) => a.id === 'rhythm_master');
    if (ach) newlyUnlocked.push(ach);
  }

  if (stats.bestCombo >= 30 && !stats.unlockedAchievements.includes('combo_king')) {
    stats.unlockedAchievements.push('combo_king');
    const ach = ALL_ACHIEVEMENTS.find((a) => a.id === 'combo_king');
    if (ach) newlyUnlocked.push(ach);
  }

  saveUserStats(stats);
  return { newStats: stats, newlyUnlocked };
}

// RECORDINGS
export function loadRecordings(): DrumRecording[] {
  try {
    const raw = localStorage.getItem(RECORDINGS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return [];
}

export function saveRecording(recording: DrumRecording): void {
  try {
    const list = loadRecordings();
    list.unshift(recording);
    localStorage.setItem(RECORDINGS_STORAGE_KEY, JSON.stringify(list));

    // Unlock achievement
    const stats = loadUserStats();
    if (!stats.unlockedAchievements.includes('studio_producer')) {
      stats.unlockedAchievements.push('studio_producer');
      saveUserStats(stats);
    }
  } catch {
    // Ignore
  }
}

export function renameRecording(id: string, newTitle: string): DrumRecording[] {
  const list = loadRecordings().map((r) => (r.id === id ? { ...r, title: newTitle } : r));
  try {
    localStorage.setItem(RECORDINGS_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore
  }
  return list;
}

export function deleteRecording(id: string): DrumRecording[] {
  const list = loadRecordings().filter((r) => r.id !== id);
  try {
    localStorage.setItem(RECORDINGS_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore
  }
  return list;
}

// CUSTOM LAYOUT
export function loadCustomLayout(): CustomLayoutMap {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return {};
}

export function saveCustomLayout(layout: CustomLayoutMap): void {
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // Ignore
  }
}

export function resetCustomLayout(): void {
  try {
    localStorage.removeItem(LAYOUT_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

// APP SETTINGS
export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // Ignore
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore
  }
}
