export type DrumKitId = 'acoustic' | 'rock' | 'pop' | 'jazz' | 'electronic' | 'metal';

export type DrumPadId =
  | 'kick'
  | 'snare'
  | 'hihat_closed'
  | 'hihat_open'
  | 'crash'
  | 'crash2'
  | 'ride'
  | 'tom_high'
  | 'tom_mid'
  | 'tom_floor'
  | 'cowbell'
  | 'tambourine';

export type PadType = 'drum' | 'cymbal' | 'percussion';

export interface DrumPadDefinition {
  id: DrumPadId;
  name: string;
  shortName: string;
  type: PadType;
  defaultKey: string;
  keyLabel: string;
  defaultX: number; // percentage 0-100
  defaultY: number; // percentage 0-100
  defaultSize: number; // px at standard scale
  colorAccent: string;
}

export interface KitConfig {
  id: DrumKitId;
  name: string;
  description: string;
  genre: string;
  accentColor: string;
  themeBackground: string;
}

export type HitRating = 'perfect' | 'great' | 'good' | 'miss';

export interface LessonNote {
  timeMs: number;
  padId: DrumPadId;
  durationMs?: number;
}

export type LessonDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Lesson {
  id: string;
  title: string;
  difficulty: LessonDifficulty;
  bpm: number;
  durationMinutes: number;
  description: string;
  category: string;
  notes: LessonNote[];
  totalBars: number;
}

export interface RecordedHit {
  padId: DrumPadId;
  timeMs: number;
  velocity: number;
}

export interface DrumRecording {
  id: string;
  title: string;
  createdAt: number;
  durationMs: number;
  kitId: DrumKitId;
  hitCount: number;
  hits: RecordedHit[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: number;
  progress?: number;
  maxProgress?: number;
}

export interface UserStats {
  totalPracticeTimeSeconds: number;
  totalBeatsPlayed: number;
  level: number;
  xp: number;
  completedLessons: string[];
  lessonScores: Record<string, { accuracy: number; maxCombo: number; stars: number; highscore: number }>;
  bestCombo: number;
  unlockedAchievements: string[];
}

export interface CustomPadLayout {
  x: number;
  y: number;
  scale: number;
  volume: number; // 0 to 1.5
  pitch: number; // semitones -12 to +12
}

export type CustomLayoutMap = Partial<Record<DrumPadId, CustomPadLayout>>;

export type AppTab = 'home' | 'play' | 'practice' | 'recordings' | 'profile';

export type BackgroundTheme = 'dark_stage' | 'studio_wood' | 'cyber_neon' | 'arena_spotlight' | 'minimal_slate';
