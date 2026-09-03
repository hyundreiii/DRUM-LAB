import { DrumPadId, Lesson, LessonNote } from '../types';

// Helper to generate repetitive drum patterns
function generatePattern(
  bpm: number,
  totalBars: number,
  patternGenerator: (barIndex: number, barStartMs: number, beatMs: number) => LessonNote[]
): LessonNote[] {
  const beatMs = (60 / bpm) * 1000;
  const barMs = beatMs * 4;
  const notes: LessonNote[] = [];

  for (let bar = 0; bar < totalBars; bar++) {
    const barStart = bar * barMs;
    notes.push(...patternGenerator(bar, barStart, beatMs));
  }

  // Sort notes chronologically
  return notes.sort((a, b) => a.timeMs - b.timeMs);
}

// 1. Basic Rock Beat (80 BPM)
// Hi-hat: 1, &, 2, &, 3, &, 4, &
// Kick: 1, 3
// Snare: 2, 4
const rockBeatNotes = generatePattern(80, 8, (_bar, barStart, beatMs) => {
  const notes: LessonNote[] = [];
  const eighthMs = beatMs / 2;

  // 8 Hi-hat notes
  for (let i = 0; i < 8; i++) {
    notes.push({ timeMs: barStart + i * eighthMs, padId: 'hihat_closed' });
  }

  // Kick on beat 1 & 3
  notes.push({ timeMs: barStart + 0 * beatMs, padId: 'kick' });
  notes.push({ timeMs: barStart + 2 * beatMs, padId: 'kick' });

  // Snare on beat 2 & 4
  notes.push({ timeMs: barStart + 1 * beatMs, padId: 'snare' });
  notes.push({ timeMs: barStart + 3 * beatMs, padId: 'snare' });

  return notes;
});

// 2. Simple Pop Beat (100 BPM)
// Kick on 1, 2, 3, 4 (Four-on-the-floor)
// Snare on 2, 4
// Hi-hat on 8ths
const popBeatNotes = generatePattern(100, 8, (_bar, barStart, beatMs) => {
  const notes: LessonNote[] = [];
  const eighthMs = beatMs / 2;

  for (let i = 0; i < 8; i++) {
    notes.push({ timeMs: barStart + i * eighthMs, padId: 'hihat_closed' });
  }

  // 4 on the floor
  for (let i = 0; i < 4; i++) {
    notes.push({ timeMs: barStart + i * beatMs, padId: 'kick' });
  }

  // Snare on 2 and 4
  notes.push({ timeMs: barStart + 1 * beatMs, padId: 'snare' });
  notes.push({ timeMs: barStart + 3 * beatMs, padId: 'snare' });

  return notes;
});

// 3. Hi-Hat Steady Rhythm Practice (90 BPM)
const hihatPracticeNotes = generatePattern(90, 8, (_bar, barStart, beatMs) => {
  const notes: LessonNote[] = [];
  const eighthMs = beatMs / 2;
  for (let i = 0; i < 8; i++) {
    // Open hat on the & of 4
    if (i === 7) {
      notes.push({ timeMs: barStart + i * eighthMs, padId: 'hihat_open' });
    } else {
      notes.push({ timeMs: barStart + i * eighthMs, padId: 'hihat_closed' });
    }
  }
  return notes;
});

// 4. Snare Timing Practice (85 BPM)
const snareTimingNotes = generatePattern(85, 8, (_bar, barStart, beatMs) => {
  const notes: LessonNote[] = [];
  notes.push({ timeMs: barStart + 1 * beatMs, padId: 'snare' });
  notes.push({ timeMs: barStart + 3 * beatMs, padId: 'snare' });
  return notes;
});

// 5. Bass Drum Coordination (92 BPM)
// Kick on 1, & of 2, 3
const bassCoordinationNotes = generatePattern(92, 8, (_bar, barStart, beatMs) => {
  const notes: LessonNote[] = [];
  const eighthMs = beatMs / 2;

  // Hi-hats
  for (let i = 0; i < 8; i++) {
    notes.push({ timeMs: barStart + i * eighthMs, padId: 'hihat_closed' });
  }

  // Snare on 2 and 4
  notes.push({ timeMs: barStart + 1 * beatMs, padId: 'snare' });
  notes.push({ timeMs: barStart + 3 * beatMs, padId: 'snare' });

  // Syncopated kick: 1, 2-and, 3
  notes.push({ timeMs: barStart + 0 * beatMs, padId: 'kick' });
  notes.push({ timeMs: barStart + 1 * beatMs + eighthMs, padId: 'kick' });
  notes.push({ timeMs: barStart + 2 * beatMs, padId: 'kick' });

  return notes;
});

// 6. Rock Drum Fill In (88 BPM)
const drumFillNotes = generatePattern(88, 8, (bar, barStart, beatMs) => {
  const notes: LessonNote[] = [];
  const eighthMs = beatMs / 2;

  // Every 4th bar is a fill!
  if ((bar + 1) % 4 === 0) {
    // Fill across toms: Beat 1 Snare, Beat 2 Tom 1, Beat 3 Tom 2, Beat 4 Floor Tom
    notes.push({ timeMs: barStart + 0 * beatMs, padId: 'snare' });
    notes.push({ timeMs: barStart + 0 * beatMs + eighthMs, padId: 'snare' });
    notes.push({ timeMs: barStart + 1 * beatMs, padId: 'tom_high' });
    notes.push({ timeMs: barStart + 1 * beatMs + eighthMs, padId: 'tom_high' });
    notes.push({ timeMs: barStart + 2 * beatMs, padId: 'tom_mid' });
    notes.push({ timeMs: barStart + 2 * beatMs + eighthMs, padId: 'tom_mid' });
    notes.push({ timeMs: barStart + 3 * beatMs, padId: 'tom_floor' });
    notes.push({ timeMs: barStart + 3 * beatMs + eighthMs, padId: 'tom_floor' });
  } else {
    // Regular beat
    if (bar % 4 === 0) {
      notes.push({ timeMs: barStart, padId: 'crash' });
    }
    for (let i = 0; i < 8; i++) {
      notes.push({ timeMs: barStart + i * eighthMs, padId: 'hihat_closed' });
    }
    notes.push({ timeMs: barStart + 0 * beatMs, padId: 'kick' });
    notes.push({ timeMs: barStart + 2 * beatMs, padId: 'kick' });
    notes.push({ timeMs: barStart + 1 * beatMs, padId: 'snare' });
    notes.push({ timeMs: barStart + 3 * beatMs, padId: 'snare' });
  }

  return notes;
});

// 7. Funk Syncopated Groove (96 BPM)
const funkGrooveNotes = generatePattern(96, 8, (_bar, barStart, beatMs) => {
  const notes: LessonNote[] = [];
  const eighthMs = beatMs / 2;
  const sixteenthMs = beatMs / 4;

  for (let i = 0; i < 8; i++) {
    notes.push({ timeMs: barStart + i * eighthMs, padId: 'hihat_closed' });
  }

  // Snare on 2 and 4, plus ghost on 4-e
  notes.push({ timeMs: barStart + 1 * beatMs, padId: 'snare' });
  notes.push({ timeMs: barStart + 3 * beatMs, padId: 'snare' });
  notes.push({ timeMs: barStart + 3 * beatMs + sixteenthMs, padId: 'snare' });

  // Funky kick: 1, 1-a, 3-and
  notes.push({ timeMs: barStart + 0 * beatMs, padId: 'kick' });
  notes.push({ timeMs: barStart + 0 * beatMs + sixteenthMs * 3, padId: 'kick' });
  notes.push({ timeMs: barStart + 2 * beatMs + eighthMs, padId: 'kick' });

  return notes;
});

// 8. Heavy Metal Blast Beat (130 BPM)
const metalBeatNotes = generatePattern(130, 8, (_bar, barStart, beatMs) => {
  const notes: LessonNote[] = [];
  const eighthMs = beatMs / 2;

  for (let i = 0; i < 8; i++) {
    notes.push({ timeMs: barStart + i * eighthMs, padId: 'ride' });
    notes.push({ timeMs: barStart + i * eighthMs, padId: 'kick' });
  }

  // Snare on beats 2 & 4
  notes.push({ timeMs: barStart + 1 * beatMs, padId: 'snare' });
  notes.push({ timeMs: barStart + 3 * beatMs, padId: 'snare' });

  return notes;
});

export const ALL_LESSONS: Lesson[] = [
  {
    id: 'lesson_rock_1',
    title: 'Basic Rock Beat',
    difficulty: 'beginner',
    bpm: 80,
    durationMinutes: 2,
    description: 'The iconic backbone of rock and pop drumming. Master the kick on 1 & 3, snare on 2 & 4, and steady 8th-note hi-hats.',
    category: 'Essential Grooves',
    totalBars: 8,
    notes: rockBeatNotes,
  },
  {
    id: 'lesson_pop_1',
    title: 'Simple Pop Beat',
    difficulty: 'beginner',
    bpm: 100,
    durationMinutes: 2,
    description: 'Four-on-the-floor kick drum groove heard across modern pop, dance, and chart hits. Keep your kick steady like a clock.',
    category: 'Essential Grooves',
    totalBars: 8,
    notes: popBeatNotes,
  },
  {
    id: 'lesson_hihat_1',
    title: 'Hi-Hat Rhythm Practice',
    difficulty: 'beginner',
    bpm: 90,
    durationMinutes: 1,
    description: 'Train your leading hand for flawless 8th note timing with an open hi-hat release on the end of each phrase.',
    category: 'Hand Coordination',
    totalBars: 8,
    notes: hihatPracticeNotes,
  },
  {
    id: 'lesson_snare_1',
    title: 'Snare Backbeat Timing',
    difficulty: 'beginner',
    bpm: 85,
    durationMinutes: 1,
    description: 'Focus purely on landing the fundamental backbeats on beats 2 and 4 with metronomic accuracy and solid power.',
    category: 'Timing & Precision',
    totalBars: 8,
    notes: snareTimingNotes,
  },
  {
    id: 'lesson_bass_coord',
    title: 'Bass Drum Coordination',
    difficulty: 'intermediate',
    bpm: 92,
    durationMinutes: 2,
    description: 'Develop limb independence by playing syncopated off-beat kick patterns between the steady hi-hat and backbeat snare.',
    category: 'Limb Independence',
    totalBars: 8,
    notes: bassCoordinationNotes,
  },
  {
    id: 'lesson_rock_fill',
    title: 'Rock Drum Fill-In',
    difficulty: 'intermediate',
    bpm: 88,
    durationMinutes: 3,
    description: 'Play a tight 3-bar groove then execute an explosive descending tom fill (Snare -> High Tom -> Mid Tom -> Floor Tom -> Crash).',
    category: 'Fills & Transitions',
    totalBars: 8,
    notes: drumFillNotes,
  },
  {
    id: 'lesson_funk_sync',
    title: 'Funk Syncopated Groove',
    difficulty: 'intermediate',
    bpm: 96,
    durationMinutes: 2,
    description: 'Funky 16th-note syncopation with snappy snare ghost accents and quick kick skips for an irresistible pocket.',
    category: 'Pocket & Groove',
    totalBars: 8,
    notes: funkGrooveNotes,
  },
  {
    id: 'lesson_metal_drive',
    title: 'Fast Double Kick Drive',
    difficulty: 'advanced',
    bpm: 130,
    durationMinutes: 2,
    description: 'High-octane driving double kick speed with ride cymbal attacks and cutting backbeat snare hits for heavy rock & metal.',
    category: 'Speed & Endurance',
    totalBars: 8,
    notes: metalBeatNotes,
  },
];
