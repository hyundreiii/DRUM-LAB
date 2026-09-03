import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DrumPadId, Lesson, HitRating } from '../types';
import { DEFAULT_DRUM_PADS } from '../data/drumKits';
import { audioEngine } from '../services/audioEngine';
import { updateLessonStats } from '../services/storage';
import confetti from 'canvas-confetti';
import { Play, Pause, RotateCcw, ArrowLeft, Award, Flame, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PracticePlayerProps {
  lesson: Lesson;
  onExit: () => void;
  onSelectNextLesson?: () => void;
  onHighlightPad: (padId: DrumPadId | null) => void;
  onToast?: (message: string) => void;
}

export const PracticePlayer: React.FC<PracticePlayerProps> = ({
  lesson,
  onExit,
  onSelectNextLesson,
  onHighlightPad,
  onToast,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [bpm, setBpm] = useState(lesson.bpm);

  // Scoring states
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [perfectCount, setPerfectCount] = useState(0);
  const [greatCount, setGreatCount] = useState(0);
  const [goodCount, setGoodCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [recentRating, setRecentRating] = useState<{ rating: HitRating; text: string; id: number } | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Lesson duration calculation
  const totalDurationMs = Math.max(
    ...lesson.notes.map((n) => n.timeMs),
    ((60 / bpm) * 1000 * 4 * lesson.totalBars)
  ) + 1200;

  // Refs
  const notesProcessedRef = useRef<Set<number>>(new Set());
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeOffsetRef = useRef<number>(0);

  // Recalculate notes with BPM adjustment
  const bpmScale = lesson.bpm / bpm;
  const scaledNotes = lesson.notes.map((n, idx) => ({
    ...n,
    scaledTimeMs: n.timeMs * bpmScale * (1 / speedMultiplier),
    idx,
  }));

  // Countdown starter
  const startPractice = () => {
    audioEngine.init();
    setCountdown(3);
    const countInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(countInterval);
          setIsPlaying(true);
          startTimeRef.current = performance.now();
          notesProcessedRef.current.clear();
          return null;
        }
        return prev - 1;
      });
    }, 800);
  };

  // Stop / Reset
  const resetPractice = () => {
    setIsPlaying(false);
    setCountdown(null);
    setCurrentTimeMs(0);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setPerfectCount(0);
    setGreatCount(0);
    setGoodCount(0);
    setMissCount(0);
    setRecentRating(null);
    setIsCompleted(false);
    notesProcessedRef.current.clear();
    pausedTimeOffsetRef.current = 0;
    onHighlightPad(null);
  };

  // Main playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const updateLoop = () => {
      const now = performance.now();
      const elapsed = (now - startTimeRef.current) + pausedTimeOffsetRef.current;
      setCurrentTimeMs(elapsed);

      // Check upcoming note to highlight pad (window: 250ms before note)
      const upcomingNote = scaledNotes.find(
        (n) => n.scaledTimeMs >= elapsed && n.scaledTimeMs - elapsed <= 280
      );
      if (upcomingNote) {
        onHighlightPad(upcomingNote.padId);
      } else {
        onHighlightPad(null);
      }

      // Check for missed notes
      scaledNotes.forEach((n) => {
        if (!notesProcessedRef.current.has(n.idx)) {
          // If note has passed by more than 180ms without hit
          if (elapsed - n.scaledTimeMs > 200) {
            notesProcessedRef.current.add(n.idx);
            setMissCount((prev) => prev + 1);
            setCombo(0);
            setRecentRating({ rating: 'miss', text: 'MISS', id: Date.now() });
          }
        }
      });

      // Check for lesson completion
      if (elapsed >= totalDurationMs) {
        setIsPlaying(false);
        setIsCompleted(true);
        onHighlightPad(null);
        return;
      }

      animationFrameRef.current = requestAnimationFrame(updateLoop);
    };

    animationFrameRef.current = requestAnimationFrame(updateLoop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, scaledNotes, totalDurationMs, onHighlightPad]);

  // Handle drum hit registered during practice
  const handleUserHit = useCallback(
    (padId: DrumPadId, timestamp: number) => {
      if (!isPlaying) return;

      const elapsed = (timestamp - startTimeRef.current) + pausedTimeOffsetRef.current;

      // Find closest unhit note of this padId within acceptable timing window (+- 220ms)
      let closestNote: (typeof scaledNotes)[0] | null = null;
      let minDiff = 99999;

      for (const n of scaledNotes) {
        if (!notesProcessedRef.current.has(n.idx) && n.padId === padId) {
          const diff = Math.abs(elapsed - n.scaledTimeMs);
          if (diff < minDiff && diff <= 220) {
            minDiff = diff;
            closestNote = n;
          }
        }
      }

      if (closestNote) {
        notesProcessedRef.current.add(closestNote.idx);

        let rating: HitRating = 'good';
        let pts = 40;
        let ratingText = 'GOOD!';

        if (minDiff <= 65) {
          rating = 'perfect';
          pts = 100;
          ratingText = 'PERFECT!';
          setPerfectCount((prev) => prev + 1);
        } else if (minDiff <= 130) {
          rating = 'great';
          pts = 70;
          ratingText = 'GREAT!';
          setGreatCount((prev) => prev + 1);
        } else {
          setGoodCount((prev) => prev + 1);
        }

        setCombo((prev) => {
          const next = prev + 1;
          setMaxCombo((m) => Math.max(m, next));
          return next;
        });

        setScore((prev) => prev + pts + combo * 5);
        setRecentRating({ rating, text: ratingText, id: Date.now() });
      }
    },
    [isPlaying, scaledNotes, combo]
  );

  // Attach global hit event hook
  useEffect(() => {
    const handleCustomHit = (e: CustomEvent<{ padId: DrumPadId; timestamp: number }>) => {
      handleUserHit(e.detail.padId, e.detail.timestamp);
    };

    window.addEventListener('drum_hit' as any, handleCustomHit);
    return () => window.removeEventListener('drum_hit' as any, handleCustomHit);
  }, [handleUserHit]);

  // When lesson completes: calculate grade & update stats
  useEffect(() => {
    if (isCompleted) {
      const totalNotes = scaledNotes.length;
      const totalHits = perfectCount + greatCount + goodCount;
      const accuracy = totalNotes > 0 ? Math.round((totalHits / totalNotes) * 100) : 100;

      // Launch celebration confetti on good score!
      if (accuracy >= 70) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      const { newlyUnlocked } = updateLessonStats(
        lesson.id,
        accuracy,
        maxCombo,
        score,
        Math.round(totalDurationMs / 1000)
      );

      if (newlyUnlocked.length > 0) {
        newlyUnlocked.forEach((ach) => onToast?.(`🏆 Unlocked: ${ach.title}!`));
      }
    }
  }, [isCompleted]);

  // Accuracy calculation
  const totalProcessed = perfectCount + greatCount + goodCount + missCount;
  const currentAccuracy =
    totalProcessed > 0
      ? Math.round(((perfectCount * 1.0 + greatCount * 0.8 + goodCount * 0.5) / totalProcessed) * 100)
      : 100;

  return (
    <div className="w-full flex flex-col bg-neutral-900/95 border-b border-neutral-800 backdrop-blur-lg">
      {/* PRACTICE TOP BAR */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
            title="Exit Practice"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{lesson.title}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800">
                {lesson.difficulty}
              </span>
            </h2>
            <p className="text-[11px] text-neutral-400 font-mono">
              {bpm} BPM • {lesson.category}
            </p>
          </div>
        </div>

        {/* Live Score & Combo Counter */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[11px] text-neutral-400 font-mono">ACCURACY</div>
            <div className="text-sm font-black text-amber-400 font-mono">{currentAccuracy}%</div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-800/60">
            <Flame className="w-4 h-4 text-orange-400 fill-orange-400 animate-pulse" />
            <span className="text-xs font-black text-amber-300 font-mono">{combo}x</span>
          </div>

          <div className="text-right hidden sm:block">
            <div className="text-[11px] text-neutral-400 font-mono">SCORE</div>
            <div className="text-sm font-bold text-white font-mono">{score}</div>
          </div>
        </div>
      </div>

      {/* RHYTHM NOTE HIGHWAY / STEP TRACK */}
      <div className="relative w-full h-24 bg-neutral-950 overflow-hidden border-b border-neutral-800/80 flex items-center">
        {/* Hit Target Line (Strike zone at 15% width) */}
        <div className="absolute left-[15%] top-0 bottom-0 w-1 bg-amber-400 z-20 shadow-[0_0_12px_rgba(251,191,36,0.9)]">
          <div className="absolute -top-1 -left-2 px-1 rounded bg-amber-400 text-black text-[9px] font-extrabold tracking-wider">
            HIT
          </div>
        </div>

        {/* Lane grid dividers */}
        <div className="absolute inset-0 flex flex-col justify-between opacity-15 pointer-events-none">
          <div className="w-full h-px bg-neutral-600" />
          <div className="w-full h-px bg-neutral-600" />
          <div className="w-full h-px bg-neutral-600" />
        </div>

        {/* Moving Notes */}
        <div className="relative w-full h-full">
          {scaledNotes.map((n) => {
            // Note position: strike zone is at 15% (0.15). Notes scroll from right to left!
            const timeDiff = n.scaledTimeMs - currentTimeMs; // ms until strike line
            // Display window: 2000ms ahead
            const speedPxPerMs = 0.35;
            const strikeX = window.innerWidth * 0.15;
            const noteX = strikeX + timeDiff * speedPxPerMs;

            // Only render notes within view (-100px to +window.innerWidth)
            if (noteX < -50 || noteX > window.innerWidth + 50) return null;

            const padDef = DEFAULT_DRUM_PADS.find((p) => p.id === n.padId);
            const isPassed = timeDiff < -80;

            return (
              <div
                key={n.idx}
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full flex items-center justify-center font-bold shadow-md transition-opacity duration-150 ${
                  isPassed ? 'opacity-20' : 'opacity-100'
                }`}
                style={{
                  left: `${noteX}px`,
                  width: '38px',
                  height: '38px',
                  backgroundColor: padDef?.colorAccent || '#eab308',
                  border: '2px solid rgba(255,255,255,0.8)',
                  boxShadow: `0 0 10px ${padDef?.colorAccent || '#eab308'}88`,
                }}
              >
                <span className="text-[10px] text-black font-extrabold uppercase font-mono">
                  {padDef?.keyLabel || padDef?.shortName.substring(0, 3)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Real-time hit rating popup */}
        <AnimatePresence>
          {recentRating && (
            <motion.div
              key={recentRating.id}
              initial={{ scale: 0.5, opacity: 0, y: 10 }}
              animate={{ scale: 1.2, opacity: 1, y: -5 }}
              exit={{ scale: 1.4, opacity: 0 }}
              transition={{ duration: 0.35 }}
              className={`absolute left-[15%] top-2 z-30 px-2.5 py-0.5 rounded-full font-black text-xs tracking-wider shadow-lg ${
                recentRating.rating === 'perfect'
                  ? 'bg-emerald-500 text-black'
                  : recentRating.rating === 'great'
                  ? 'bg-cyan-500 text-black'
                  : recentRating.rating === 'good'
                  ? 'bg-amber-400 text-black'
                  : 'bg-red-600 text-white'
              }`}
            >
              {recentRating.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ready / Countdown Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex items-center justify-center">
            <motion.div
              key={countdown}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1.4, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              className="text-4xl font-black text-amber-400 font-mono tracking-widest"
            >
              {countdown}
            </motion.div>
          </div>
        )}
      </div>

      {/* PRACTICE CONTROLS FOOTER */}
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-950 text-xs">
        {/* Speed Multiplier & BPM */}
        <div className="flex items-center gap-2">
          <span className="text-neutral-400 font-mono">Tempo:</span>
          {[0.5, 0.75, 1.0].map((spd) => (
            <button
              key={spd}
              onClick={() => setSpeedMultiplier(spd)}
              className={`px-2 py-1 rounded text-[11px] font-bold ${
                speedMultiplier === spd
                  ? 'bg-amber-500 text-black'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              {spd}x
            </button>
          ))}

          <div className="flex items-center gap-1 ml-2 bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
            <button
              onClick={() => setBpm((b) => Math.max(40, b - 5))}
              className="px-1 text-neutral-400 hover:text-white font-bold"
            >
              -
            </button>
            <span className="font-mono text-white px-1">{bpm}</span>
            <button
              onClick={() => setBpm((b) => Math.min(200, b + 5))}
              className="px-1 text-neutral-400 hover:text-white font-bold"
            >
              +
            </button>
          </div>
        </div>

        {/* Start / Pause / Restart */}
        <div className="flex items-center gap-2">
          {!isPlaying ? (
            <button
              id="practice-start-btn"
              onClick={startPractice}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{currentTimeMs > 0 ? 'Resume' : 'Start Practice'}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsPlaying(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold transition-colors"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={resetPractice}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
            title="Restart Practice"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* LESSON COMPLETED MODAL */}
      {isCompleted && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl text-center flex flex-col items-center"
          >
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-3xl mb-3 shadow-[0_0_20px_rgba(251,191,36,0.4)]">
              {currentAccuracy >= 90 ? '🏆' : currentAccuracy >= 75 ? '🌟' : '🥁'}
            </div>

            <h3 className="text-xl font-black text-white">Lesson Completed!</h3>
            <p className="text-xs text-neutral-400 mt-0.5">{lesson.title}</p>

            {/* Grade Badge */}
            <div className="my-4">
              <span
                className={`text-5xl font-black font-mono drop-shadow-md ${
                  currentAccuracy >= 95
                    ? 'text-yellow-400'
                    : currentAccuracy >= 85
                    ? 'text-emerald-400'
                    : currentAccuracy >= 70
                    ? 'text-cyan-400'
                    : 'text-orange-400'
                }`}
              >
                {currentAccuracy >= 95
                  ? 'S'
                  : currentAccuracy >= 85
                  ? 'A'
                  : currentAccuracy >= 70
                  ? 'B'
                  : currentAccuracy >= 50
                  ? 'C'
                  : 'D'}
              </span>
            </div>

            {/* Performance Stats Grid */}
            <div className="w-full grid grid-cols-3 gap-2 my-3 text-center">
              <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                <div className="text-[10px] text-neutral-400 uppercase font-mono">Accuracy</div>
                <div className="text-base font-bold text-amber-400 mt-0.5 font-mono">{currentAccuracy}%</div>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                <div className="text-[10px] text-neutral-400 uppercase font-mono">Max Combo</div>
                <div className="text-base font-bold text-orange-400 mt-0.5 font-mono">{maxCombo}x</div>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                <div className="text-[10px] text-neutral-400 uppercase font-mono">Score</div>
                <div className="text-base font-bold text-white mt-0.5 font-mono">{score}</div>
              </div>
            </div>

            {/* Hit breakdown */}
            <div className="w-full flex items-center justify-around text-xs text-neutral-400 py-2 border-t border-neutral-800/80 my-2">
              <span className="text-emerald-400 font-mono">Perfect: {perfectCount}</span>
              <span className="text-cyan-400 font-mono">Great: {greatCount}</span>
              <span className="text-amber-400 font-mono">Good: {goodCount}</span>
              <span className="text-red-400 font-mono">Miss: {missCount}</span>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex gap-2 mt-4">
              <button
                onClick={resetPractice}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Practice Again</span>
              </button>
              {onSelectNextLesson ? (
                <button
                  onClick={() => {
                    resetPractice();
                    onSelectNextLesson();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg"
                >
                  <span>Next Lesson</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={onExit}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-colors"
                >
                  Done
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
