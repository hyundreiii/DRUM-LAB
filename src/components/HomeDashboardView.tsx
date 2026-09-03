import React from 'react';
import { DrumKitId, Lesson, UserStats } from '../types';
import { AVAILABLE_KITS } from '../data/drumKits';
import { ALL_LESSONS } from '../data/lessonsData';
import { Play, Sparkles, Trophy, Disc, Flame, ChevronRight, Zap, Target, Menu } from 'lucide-react';

interface HomeDashboardViewProps {
  onPlayDrums: (kitId?: DrumKitId) => void;
  onSelectLesson: (lesson: Lesson) => void;
  onOpenRecordings: () => void;
  userStats: UserStats;
  onOpenBurgerMenu?: () => void;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  onPlayDrums,
  onSelectLesson,
  onOpenRecordings,
  userStats,
  onOpenBurgerMenu,
}) => {
  // Recommend a lesson based on progress
  const nextLesson =
    ALL_LESSONS.find((l) => !userStats.completedLessons.includes(l.id)) || ALL_LESSONS[0];

  return (
    <div className="w-full flex-1 flex flex-col bg-neutral-950 select-none">
      {/* Top Header Bar */}
      <header className="px-4 py-2.5 bg-neutral-950/90 border-b border-neutral-800/80 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          {onOpenBurgerMenu && (
            <button
              id="home-burger-menu-btn"
              onClick={onOpenBurgerMenu}
              className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-400 hover:text-white border border-neutral-700/80 shadow-md transition-all active:scale-95"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
            <span className="text-sm font-black text-white tracking-wide font-mono">REAL DRUM STUDIO</span>
          </div>
        </div>

        <button
          id="home-back-to-drums-btn"
          onClick={() => onPlayDrums()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition-all active:scale-95"
        >
          <Disc className="w-4 h-4" />
          <span>Play Drum Kit</span>
        </button>
      </header>

      <div className="w-full max-w-5xl mx-auto px-4 py-6 flex-1 overflow-y-auto space-y-6">
      {/* HERO SECTION */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-neutral-900 via-neutral-900 to-black border border-neutral-800 shadow-2xl overflow-hidden">
        {/* Subtle glowing ambient lights */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>FEEL THE BEAT. PLAY LIKE A REAL DRUMMER.</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Digital Real Drum
          </h1>
          <p className="text-sm text-neutral-300 mt-2 leading-relaxed">
            Professional-grade virtual drum simulator with multi-touch zero latency, realistic acoustic & synth kits, and guided practice lessons.
          </p>

          <div className="flex items-center gap-3 mt-6 flex-wrap">
            <button
              id="hero-play-now-btn"
              onClick={() => onPlayDrums()}
              className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-black text-sm tracking-wide transition-all shadow-[0_0_25px_rgba(251,191,36,0.35)] flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>PLAY NOW</span>
            </button>

            <button
              onClick={() => onSelectLesson(nextLesson)}
              className="px-5 py-3.5 rounded-2xl bg-neutral-800/90 hover:bg-neutral-750 text-white font-bold text-sm transition-all border border-neutral-700 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Continue Practice</span>
            </button>
          </div>
        </div>
      </div>

      {/* QUICK STATUS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
            ⚡
          </div>
          <div>
            <div className="text-[10px] text-neutral-400 font-mono uppercase">Level</div>
            <div className="text-lg font-black text-white font-mono">{userStats.level}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-black">
            🔥
          </div>
          <div>
            <div className="text-[10px] text-neutral-400 font-mono uppercase">Best Combo</div>
            <div className="text-lg font-black text-white font-mono">{userStats.bestCombo}x</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black">
            🥁
          </div>
          <div>
            <div className="text-[10px] text-neutral-400 font-mono uppercase">Total Strikes</div>
            <div className="text-lg font-black text-white font-mono">{userStats.totalBeatsPlayed}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
            🎯
          </div>
          <div>
            <div className="text-[10px] text-neutral-400 font-mono uppercase">Lessons Done</div>
            <div className="text-lg font-black text-white font-mono">
              {userStats.completedLessons.length} / {ALL_LESSONS.length}
            </div>
          </div>
        </div>
      </div>

      {/* TWO COLUMN ROW: CONTINUE PRACTICE + DAILY CHALLENGE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Continue Practice Section */}
        <div className="p-5 rounded-3xl bg-neutral-900/70 border border-neutral-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                Up Next In Practice
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
                {nextLesson.difficulty}
              </span>
            </div>

            <h3 className="text-lg font-black text-white">{nextLesson.title}</h3>
            <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
              {nextLesson.description}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between">
            <div className="text-xs text-neutral-400 font-mono">
              {nextLesson.bpm} BPM • {nextLesson.durationMinutes} min
            </div>
            <button
              onClick={() => onSelectLesson(nextLesson)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Resume Lesson</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Daily Drum Challenge Card */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-950/30 via-neutral-900 to-neutral-900 border border-amber-800/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                <span>Today's Challenge</span>
              </span>
              <span className="text-xs font-mono text-amber-300 font-bold">+150 XP</span>
            </div>

            <h3 className="text-lg font-black text-white">Century Strike Groove</h3>
            <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
              Play 100 consecutive beats on any drum kit with metronome precision to sharpen your muscle memory.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-amber-900/40 flex items-center justify-between">
            <div className="text-xs text-neutral-400 font-mono">
              Progress: {Math.min(100, userStats.totalBeatsPlayed)} / 100
            </div>
            <button
              onClick={() => onPlayDrums()}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Accept Challenge</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* FEATURED DRUM KITS CAROUSEL/GRID */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Disc className="w-4 h-4 text-amber-400" />
            <span>Featured Sound Kits</span>
          </h2>
          <span className="text-xs text-neutral-400 font-mono">6 Kits Available</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {AVAILABLE_KITS.map((kit) => (
            <div
              key={kit.id}
              onClick={() => onPlayDrums(kit.id)}
              className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-600 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: kit.accentColor }}
                  />
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">
                    {kit.genre.split('&')[0]}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                  {kit.name}
                </h3>
                <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2 leading-tight">
                  {kit.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-neutral-800/60 flex items-center justify-between text-xs text-amber-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                <span>Play Kit</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
};
