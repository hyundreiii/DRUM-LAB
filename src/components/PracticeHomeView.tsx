import React, { useState } from 'react';
import { ALL_LESSONS } from '../data/lessonsData';
import { Lesson, LessonDifficulty, UserStats } from '../types';
import { 
  Play, Star, Clock, Activity, Award, CheckCircle2, ChevronRight,
  Menu, ArrowLeft, Disc
} from 'lucide-react';

interface PracticeHomeViewProps {
  onSelectLesson: (lesson: Lesson) => void;
  userStats: UserStats;
  onGoToDrums?: () => void;
  onOpenBurgerMenu?: () => void;
}

export const PracticeHomeView: React.FC<PracticeHomeViewProps> = ({ 
  onSelectLesson, 
  userStats,
  onGoToDrums,
  onOpenBurgerMenu,
}) => {
  const [filterDifficulty, setFilterDifficulty] = useState<LessonDifficulty | 'all'>('all');

  const filteredLessons = ALL_LESSONS.filter((l) => {
    if (filterDifficulty === 'all') return true;
    return l.difficulty === filterDifficulty;
  });

  return (
    <div className="w-full flex-1 flex flex-col bg-neutral-950 select-none">
      {/* Top Header with Burger & Back to Drums */}
      <header className="px-4 py-2.5 bg-neutral-950/90 border-b border-neutral-800/80 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          {onOpenBurgerMenu && (
            <button
              id="practice-burger-menu-btn"
              onClick={onOpenBurgerMenu}
              className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-400 hover:text-white border border-neutral-700/80 shadow-md transition-all active:scale-95"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xl">🥁</span>
            <div>
              <h1 className="text-sm font-black text-white leading-tight">DRUM LESSONS</h1>
              <p className="text-[10px] text-neutral-400 font-mono">Interactive Rhythm Coach</p>
            </div>
          </div>
        </div>

        {onGoToDrums && (
          <button
            id="practice-back-to-drums-btn"
            onClick={onGoToDrums}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <Disc className="w-4 h-4" />
            <span>Play Drum Kit</span>
          </button>
        )}
      </header>

      <div className="w-full max-w-5xl mx-auto px-4 py-6 flex-1 overflow-y-auto">
        {/* Difficulty Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-white">Choose a Groove</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Practice beats and fills at your own tempo with live accuracy grading.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-neutral-900 p-1 rounded-xl border border-neutral-800 self-start sm:self-auto">
            {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((diff) => (
              <button
                key={diff}
                onClick={() => setFilterDifficulty(diff)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                  filterDifficulty === diff
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

      {/* LESSONS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredLessons.map((lesson) => {
          const scoreData = userStats.lessonScores[lesson.id];
          const isCompleted = userStats.completedLessons.includes(lesson.id);

          return (
            <div
              key={lesson.id}
              className="rounded-2xl bg-neutral-900/70 border border-neutral-800/80 p-5 hover:border-neutral-700 transition-all flex flex-col justify-between group shadow-lg"
            >
              <div>
                {/* Header info */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      lesson.difficulty === 'beginner'
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                        : lesson.difficulty === 'intermediate'
                        ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60'
                        : 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                    }`}
                  >
                    {lesson.difficulty}
                  </span>

                  {/* Stars / Completion Status */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3].map((starIdx) => (
                      <Star
                        key={starIdx}
                        className={`w-3.5 h-3.5 ${
                          scoreData && scoreData.stars >= starIdx
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-neutral-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Lesson Title */}
                <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-2">
                  <span>{lesson.title}</span>
                  {isCompleted && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 inline shrink-0" />
                  )}
                </h3>

                <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                  {lesson.description}
                </p>
              </div>

              {/* Lesson Specs */}
              <div className="mt-4 pt-3 border-t border-neutral-800/70 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono">
                  <div className="flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-amber-500" />
                    <span>{lesson.bpm} BPM</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{lesson.durationMinutes} min</span>
                  </div>
                </div>

                {scoreData && (
                  <span className="text-xs font-bold text-amber-400 font-mono">
                    {scoreData.accuracy}% Acc
                  </span>
                )}
              </div>

              {/* Start Button */}
              <button
                onClick={() => onSelectLesson(lesson)}
                className="mt-4 w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-amber-500 text-neutral-200 hover:text-black font-bold text-xs transition-all flex items-center justify-center gap-2 group-hover:shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>START PRACTICE</span>
              </button>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
};
