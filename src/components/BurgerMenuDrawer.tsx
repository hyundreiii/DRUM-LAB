import React from 'react';
import { AppTab, DrumKitId, UserStats } from '../types';
import { AVAILABLE_KITS } from '../data/drumKits';
import { 
  X, Disc, Sparkles, Mic, User, Music, Move, 
  Settings as SettingsIcon, ChevronRight, Award, Flame, Volume2,
  Smartphone, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BurgerMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: AppTab;
  onSelectTab?: (tab: AppTab) => void;
  onTabChange?: (tab: AppTab) => void;
  currentKit: DrumKitId;
  onSelectKit: (kit: DrumKitId) => void;
  onOpenMetronome: () => void;
  onOpenSettings: () => void;
  onTriggerLayoutEdit?: () => void;
  onOpenLayoutEditor?: () => void;
  onOpenAndroidHub?: () => void;
  onTriggerInstallPwa?: () => void;
  canInstallPwa?: boolean;
  userStats: UserStats;
  metronomeBpm: number;
  isMetronomePlaying: boolean;
}

export const BurgerMenuDrawer: React.FC<BurgerMenuDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  onTabChange,
  currentKit,
  onSelectKit,
  onOpenMetronome,
  onOpenSettings,
  onTriggerLayoutEdit,
  onOpenLayoutEditor,
  onOpenAndroidHub,
  onTriggerInstallPwa,
  canInstallPwa,
  userStats,
  metronomeBpm,
  isMetronomePlaying,
}) => {
  const handleSelectTab = (tab: AppTab) => {
    if (onSelectTab) onSelectTab(tab);
    else if (onTabChange) onTabChange(tab);
  };
  const triggerLayoutEdit = () => {
    if (onTriggerLayoutEdit) onTriggerLayoutEdit();
    else if (onOpenLayoutEditor) onOpenLayoutEditor();
  };
  const currentLevel = userStats.level || 1;
  const currentXp = userStats.xp || 0;
  const nextLevelXp = currentLevel * 200;
  const levelProgressPct = Math.min(100, Math.round(((currentXp % 200) / 200) * 100));

  const navItems: {
    id: AppTab;
    label: string;
    description: string;
    icon: React.ReactNode;
    badge?: string;
  }[] = [
    {
      id: 'play',
      label: 'Drum Kit',
      description: 'Realistic acoustic & electronic kit',
      icon: <Disc className="w-5 h-5 text-amber-400" />,
      badge: 'LIVE',
    },
    {
      id: 'practice',
      label: 'Lessons & Practice',
      description: 'Interactive rhythm highway coach',
      icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
      badge: '6 Lessons',
    },
    {
      id: 'recordings',
      label: 'My Recordings',
      description: 'Listen & replay captured grooves',
      icon: <Mic className="w-5 h-5 text-red-400" />,
    },
    {
      id: 'profile',
      label: 'Drummer Stats',
      description: 'XP, level, combos & trophies',
      icon: <User className="w-5 h-5 text-cyan-400" />,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm cursor-pointer"
          />

          {/* Drawer Menu Panel */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="relative w-80 max-w-[85vw] h-full bg-neutral-950 border-r border-neutral-800/90 shadow-2xl flex flex-col justify-between z-10 overflow-hidden"
          >
            {/* Top Brand Header */}
            <div className="p-4 border-b border-neutral-800/80 bg-neutral-900/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-black font-black text-xl shadow-lg shadow-amber-500/20">
                    🥁
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white tracking-wider flex items-center gap-1.5 font-mono">
                      REAL DRUM
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </h2>
                    <p className="text-[10px] text-neutral-400 font-medium">Digital Drum Simulator</p>
                  </div>
                </div>

                <button
                  id="close-burger-menu-btn"
                  onClick={onClose}
                  className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
                  title="Close Menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mini Drummer Level Card */}
              <div className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-neutral-300 font-bold flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    Level {currentLevel} Drummer
                  </span>
                  <span className="text-amber-400 font-mono font-bold">{currentXp} XP</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-300"
                    style={{ width: `${levelProgressPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-neutral-500 mt-1 font-mono">
                  <span>{userStats.totalBeatsPlayed.toLocaleString()} beats played</span>
                  <span>Next: {nextLevelXp} XP</span>
                </div>
              </div>
            </div>

            {/* Middle Nav Items & Quick Sound Kit Selector */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* High-visibility Install on Android CTA Card */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950 via-neutral-900 to-emerald-950 border border-emerald-500/50 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="p-1 rounded-lg bg-emerald-500 text-black">
                      <Smartphone className="w-3.5 h-3.5 stroke-[2.5]" />
                    </span>
                    <span className="text-xs font-black text-white">Android Application</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold border border-emerald-500/30">
                    PWA / APK
                  </span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-tight mb-2.5">
                  Install directly on your phone with zero latency and full-screen immersive mode.
                </p>
                <button
                  id="drawer-top-install-btn"
                  onClick={() => {
                    onClose();
                    if (onTriggerInstallPwa) {
                      onTriggerInstallPwa();
                    } else if (onOpenAndroidHub) {
                      onOpenAndroidHub();
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/30 transition-all active:scale-95 animate-pulse"
                >
                  <Download className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Install Real Drum on Android</span>
                </button>
              </div>

              {/* Main Views Navigation */}
              <div className="space-y-1">
                <div className="px-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider font-mono mb-1">
                  Navigation
                </div>

                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`burger-nav-${item.id}`}
                      onClick={() => {
                        handleSelectTab(item.id);
                        onClose();
                      }}
                      className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all group ${
                        isActive
                          ? 'bg-amber-500/15 border border-amber-500/50 text-white shadow-sm'
                          : 'hover:bg-neutral-900 border border-transparent text-neutral-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-1.5 rounded-lg ${
                            isActive ? 'bg-amber-500 text-black' : 'bg-neutral-900 group-hover:bg-neutral-800'
                          }`}
                        >
                          {item.icon}
                        </div>
                        <div>
                          <div className="text-xs font-bold flex items-center gap-1.5">
                            <span>{item.label}</span>
                            {item.badge && (
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-black uppercase ${
                                  isActive
                                    ? 'bg-amber-400 text-black'
                                    : 'bg-neutral-800 text-amber-300 border border-neutral-700'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-neutral-400 leading-tight">{item.description}</p>
                        </div>
                      </div>

                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          isActive ? 'text-amber-400 translate-x-0.5' : 'text-neutral-600 group-hover:text-neutral-400'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Quick Sound Kits Selector */}
              <div className="pt-2 border-t border-neutral-800/80">
                <div className="px-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider font-mono mb-2 flex items-center justify-between">
                  <span>Sound Kits</span>
                  <span className="text-amber-400/80 font-mono text-[9px]">{AVAILABLE_KITS.length} Kits</span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {AVAILABLE_KITS.map((kit) => {
                    const isCurrent = currentKit === kit.id;
                    return (
                      <button
                        key={kit.id}
                        id={`burger-kit-${kit.id}`}
                        onClick={() => {
                          onSelectKit(kit.id);
                        }}
                        className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between ${
                          isCurrent
                            ? 'bg-neutral-900 border-amber-400 text-white shadow-sm'
                            : 'bg-neutral-950 hover:bg-neutral-900/60 border-neutral-800/80 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
                            style={{ backgroundColor: kit.accentColor }}
                          />
                          <span className="text-[11px] font-bold truncate leading-tight">{kit.name}</span>
                        </div>
                        <span className="text-[9px] text-neutral-500 font-mono">{kit.genre}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Drum Tools & Utilities */}
              <div className="pt-2 border-t border-neutral-800/80 space-y-1">
                <div className="px-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider font-mono mb-1">
                  Tools & Layout
                </div>

                {/* Metronome Shortcut */}
                <button
                  id="burger-tool-metronome"
                  onClick={() => {
                    onClose();
                    onOpenMetronome();
                  }}
                  className="w-full p-2 rounded-xl hover:bg-neutral-900 text-neutral-300 hover:text-white flex items-center justify-between transition-colors border border-transparent hover:border-neutral-800 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Music className={`w-4 h-4 ${isMetronomePlaying ? 'text-amber-400 animate-pulse' : 'text-neutral-400'}`} />
                    <span className="font-semibold">Metronome & Click</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 font-bold bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                    {metronomeBpm} BPM
                  </span>
                </button>

                {/* Customize Layout Trigger */}
                <button
                  id="burger-tool-reposition"
                  onClick={() => {
                    handleSelectTab('play');
                    onClose();
                    triggerLayoutEdit();
                  }}
                  className="w-full p-2 rounded-xl hover:bg-neutral-900 text-neutral-300 hover:text-white flex items-center justify-between transition-colors border border-transparent hover:border-neutral-800 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Move className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold">Reposition Drum Layout</span>
                  </div>
                  <span className="text-[9px] font-mono text-neutral-400 bg-neutral-900 px-1.5 py-0.5 rounded">
                    Drag & Drop
                  </span>
                </button>

                {/* Settings Trigger */}
                <button
                  id="burger-tool-settings"
                  onClick={() => {
                    onClose();
                    onOpenSettings();
                  }}
                  className="w-full p-2 rounded-xl hover:bg-neutral-900 text-neutral-300 hover:text-white flex items-center justify-between transition-colors border border-transparent hover:border-neutral-800 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <SettingsIcon className="w-4 h-4 text-neutral-400" />
                    <span className="font-semibold">Audio & Visual Settings</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
                </button>
              </div>

              {/* Android Mobile App Controls */}
              <div className="pt-2 border-t border-neutral-800/80 space-y-1.5">
                <div className="px-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider font-mono flex items-center justify-between">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Smartphone className="w-3.5 h-3.5" />
                    Android Application
                  </span>
                  <span className="text-[9px] font-mono text-neutral-500">v2.4.0</span>
                </div>

                {/* Install Android WebAPK */}
                <button
                  id="burger-install-android-app"
                  onClick={() => {
                    onClose();
                    if (onTriggerInstallPwa) {
                      onTriggerInstallPwa();
                    } else if (onOpenAndroidHub) {
                      onOpenAndroidHub();
                    }
                  }}
                  className="w-full p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 text-emerald-300 hover:text-white flex items-center justify-between transition-all text-xs font-bold shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Install Real Drum on Android</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 font-mono">
                    WebAPK
                  </span>
                </button>

                {/* Android App Hub / Specs */}
                <button
                  id="burger-open-android-hub"
                  onClick={() => {
                    onClose();
                    onOpenAndroidHub?.();
                  }}
                  className="w-full p-2 rounded-xl hover:bg-neutral-900 text-neutral-300 hover:text-white flex items-center justify-between transition-colors border border-transparent hover:border-neutral-800 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-4 h-4 text-neutral-400" />
                    <span className="font-semibold">Android Specs & APK Guide</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
                </button>
              </div>
            </div>

            {/* Bottom Footer Info */}
            <div className="p-3 border-t border-neutral-800/80 bg-neutral-900/40 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Android Engine Ready
              </span>
              <span>APK v2.4</span>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};
