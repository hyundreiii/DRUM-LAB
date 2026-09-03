import React from 'react';
import { UserStats } from '../types';
import { ALL_ACHIEVEMENTS } from '../services/storage';
import { DEFAULT_DRUM_PADS } from '../data/drumKits';
import { Trophy, Flame, Target, Clock, Zap, Award, Keyboard, ShieldCheck, CheckCircle2, Menu, Disc } from 'lucide-react';

interface ProfileViewProps {
  userStats: UserStats;
  onToast?: (message: string) => void;
  onGoToDrums?: () => void;
  onOpenBurgerMenu?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ userStats, onToast, onGoToDrums, onOpenBurgerMenu }) => {
  const practiceMinutes = Math.round(userStats.totalPracticeTimeSeconds / 60);

  // Average accuracy across scored lessons
  const lessonScoresList = Object.values(userStats.lessonScores || {}) as Array<{
    accuracy: number;
    maxCombo: number;
    stars: number;
    highscore: number;
  }>;
  const avgAccuracy =
    lessonScoresList.length > 0
      ? Math.round(lessonScoresList.reduce((acc: number, cur) => acc + cur.accuracy, 0) / lessonScoresList.length)
      : 95;

  const currentLevel = userStats.level || 1;
  const currentXp = userStats.xp || 0;
  const nextLevelXp = currentLevel * 200;
  const levelProgressPct = Math.min(100, Math.round(((currentXp % 200) / 200) * 100));

  return (
    <div className="w-full flex-1 flex flex-col bg-neutral-950 select-none">
      {/* Top Header Bar */}
      <header className="px-4 py-2.5 bg-neutral-950/90 border-b border-neutral-800/80 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          {onOpenBurgerMenu && (
            <button
              id="profile-burger-menu-btn"
              onClick={onOpenBurgerMenu}
              className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-400 hover:text-white border border-neutral-700/80 shadow-md transition-all active:scale-95"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <div>
              <h1 className="text-sm font-black text-white leading-tight">DRUMMER PROFILE</h1>
              <p className="text-[10px] text-neutral-400 font-mono">Level {currentLevel} • {userStats.totalBeatsPlayed.toLocaleString()} Strikes</p>
            </div>
          </div>
        </div>

        {onGoToDrums && (
          <button
            id="profile-back-to-drums-btn"
            onClick={onGoToDrums}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <Disc className="w-4 h-4" />
            <span>Play Drum Kit</span>
          </button>
        )}
      </header>

      <div className="w-full max-w-4xl mx-auto px-4 py-6 select-none space-y-6 flex-1 overflow-y-auto">
      {/* Profile Header & Level Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 relative overflow-hidden shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-3xl font-black text-black shadow-lg">
              🥁
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white">Real Drummer</h1>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-extrabold uppercase font-mono">
                  Level {currentLevel}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                {userStats.totalBeatsPlayed.toLocaleString()} total strikes logged
              </p>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="sm:w-60 bg-neutral-950/80 p-3 rounded-2xl border border-neutral-800">
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-neutral-400 font-semibold">XP Progress</span>
              <span className="text-amber-400 font-bold">
                {currentXp} / {nextLevelXp} XP
              </span>
            </div>
            <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                style={{ width: `${levelProgressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* STATS MATRIX */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-mono uppercase">Practice Time</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">
            {practiceMinutes} <span className="text-xs font-normal text-neutral-500">mins</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-mono uppercase">Total Beats</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">
            {userStats.totalBeatsPlayed.toLocaleString()}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-mono uppercase">Best Combo</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-orange-400 font-mono mt-2">
            {userStats.bestCombo}x
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-mono uppercase">Avg Accuracy</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-2">
            {avgAccuracy}%
          </div>
        </div>
      </div>

      {/* ACHIEVEMENTS SHOWCASE */}
      <div className="p-5 rounded-3xl bg-neutral-900/80 border border-neutral-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Badges & Achievements</span>
          </h2>
          <span className="text-xs font-mono text-neutral-400">
            {userStats.unlockedAchievements.length} / {ALL_ACHIEVEMENTS.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {ALL_ACHIEVEMENTS.map((ach) => {
            const isUnlocked = userStats.unlockedAchievements.includes(ach.id);

            return (
              <div
                key={ach.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                  isUnlocked
                    ? 'bg-neutral-950/80 border-amber-500/40 shadow-[0_0_15px_rgba(251,191,36,0.1)]'
                    : 'bg-neutral-950/30 border-neutral-800/60 opacity-50'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                    isUnlocked ? 'bg-amber-400/20 border border-amber-400/30' : 'bg-neutral-800'
                  }`}
                >
                  {ach.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-white truncate">{ach.title}</h4>
                    {isUnlocked && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5 leading-tight">{ach.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* KEYBOARD SHORTCUTS REFERENCE */}
      <div className="p-5 rounded-3xl bg-neutral-900/80 border border-neutral-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-neutral-300" />
            <span>Desktop Keyboard Controls</span>
          </h2>
          <span className="text-xs text-neutral-400 font-mono">Zero-Latency Keys</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DEFAULT_DRUM_PADS.map((pad) => (
            <div
              key={pad.id}
              className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs"
            >
              <span className="text-neutral-300 truncate mr-2">{pad.name}</span>
              <kbd className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono font-bold text-amber-300 text-[11px] shadow-sm">
                {pad.keyLabel}
              </kbd>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
};
