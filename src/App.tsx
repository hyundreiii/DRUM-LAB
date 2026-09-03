import React, { useState, useEffect, useCallback } from 'react';
import { AppTab, DrumKitId, DrumPadId, Lesson, UserStats } from './types';
import { DrumKitView } from './components/DrumKitView';
import { PracticeHomeView } from './components/PracticeHomeView';
import { PracticePlayer } from './components/PracticePlayer';
import { RecordingsView } from './components/RecordingsView';
import { ProfileView } from './components/ProfileView';
import { HomeDashboardView } from './components/HomeDashboardView';
import { MetronomeModal } from './components/MetronomeModal';
import { SettingsModal } from './components/SettingsModal';
import { BurgerMenuDrawer } from './components/BurgerMenuDrawer';
import { AndroidAppShell } from './components/AndroidAppShell';
import { AndroidApkModal } from './components/AndroidApkModal';
import { audioEngine } from './services/audioEngine';
import { loadSettings, saveSettings, loadUserStats, AppSettings } from './services/storage';
import { ALL_LESSONS } from './data/lessonsData';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  // Default directly to the drum kit interface for real drum simulator experience
  const [activeTab, setActiveTab] = useState<AppTab>('play');
  const [currentKit, setCurrentKit] = useState<DrumKitId>('acoustic');
  const [userStats, setUserStats] = useState<UserStats>(loadUserStats());
  const [settings, setSettings] = useState<AppSettings>(loadSettings());

  // Burger Menu drawer state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingLayout, setIsEditingLayout] = useState(false);

  // Practice Mode state
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [highlightedPadId, setHighlightedPadId] = useState<DrumPadId | null>(null);

  // Metronome state
  const [isMetronomeModalOpen, setIsMetronomeModalOpen] = useState(false);
  const [isMetronomePlaying, setIsMetronomePlaying] = useState(false);
  const [metronomeBpm, setMetronomeBpm] = useState(settings.metronomeBpm || 100);
  const [metronomeSignature, setMetronomeSignature] = useState(settings.metronomeSignature || '4/4');

  // Settings modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Android APK Hub & PWA install state
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [canInstallPwa, setCanInstallPwa] = useState(false);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Listen for beforeinstallprompt event for Android PWA installation
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
      setCanInstallPwa(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleTriggerInstallPwa = () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.then((choice: { outcome: string }) => {
        if (choice.outcome === 'accepted') {
          showToast('Digital Real Drum installed on Android!');
        }
        setDeferredInstallPrompt(null);
        setCanInstallPwa(false);
      });
    } else {
      setIsApkModalOpen(true);
    }
  };

  // Android System Back Button Action
  const handleAndroidBack = () => {
    if (isApkModalOpen) {
      setIsApkModalOpen(false);
      return;
    }
    if (isSettingsOpen) {
      setIsSettingsOpen(false);
      return;
    }
    if (isMetronomeModalOpen) {
      setIsMetronomeModalOpen(false);
      return;
    }
    if (isMenuOpen) {
      setIsMenuOpen(false);
      return;
    }
    if (isEditingLayout) {
      setIsEditingLayout(false);
      showToast('Custom drum layout saved');
      return;
    }
    if (activeLesson) {
      setActiveLesson(null);
      setHighlightedPadId(null);
      return;
    }
    if (activeTab !== 'play') {
      setActiveTab('play');
      return;
    }
    showToast('Digital Real Drum: Touch drum pads to play');
  };

  // Android System Home Button Action
  const handleAndroidHome = () => {
    setIsApkModalOpen(false);
    setIsSettingsOpen(false);
    setIsMetronomeModalOpen(false);
    setIsMenuOpen(false);
    setIsEditingLayout(false);
    setActiveLesson(null);
    setHighlightedPadId(null);
    setActiveTab('play');
  };

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3200);
  }, []);

  // Update user stats in state when needed
  const refreshUserStats = useCallback(() => {
    setUserStats(loadUserStats());
  }, []);

  // Sync settings changes
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Metronome triggers
  const handleToggleMetronome = () => {
    setIsMetronomePlaying((prev) => !prev);
  };

  const handleBpmChange = (newBpm: number) => {
    setMetronomeBpm(newBpm);
    const updated = { ...settings, metronomeBpm: newBpm };
    setSettings(updated);
    saveSettings(updated);
  };

  const handleTimeSignatureChange = (newSig: string) => {
    setMetronomeSignature(newSig);
    const updated = { ...settings, metronomeSignature: newSig };
    setSettings(updated);
    saveSettings(updated);
  };

  // Drum hit registered on the drum kit
  const handleHitRegistered = (padId: DrumPadId, timestamp: number) => {
    // Notify practice player if active
    if (activeLesson) {
      window.dispatchEvent(
        new CustomEvent('drum_hit', {
          detail: { padId, timestamp },
        })
      );
    }
    refreshUserStats();
  };

  // Handle starting a lesson from any view
  const handleStartLesson = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setActiveTab('play'); // Switch to the drum kit view with practice player mounted!
    setIsMenuOpen(false);
  };

  const handleNextLesson = () => {
    if (!activeLesson) return;
    const currentIndex = ALL_LESSONS.findIndex((l) => l.id === activeLesson.id);
    const nextLesson = ALL_LESSONS[(currentIndex + 1) % ALL_LESSONS.length];
    setActiveLesson(nextLesson);
  };

  return (
    <AndroidAppShell
      onAndroidBack={handleAndroidBack}
      onAndroidHome={handleAndroidHome}
      onOpenAndroidInfo={() => setIsApkModalOpen(true)}
      onTriggerInstallPwa={handleTriggerInstallPwa}
      isMetronomePlaying={isMetronomePlaying}
      onToast={showToast}
    >
      <div className="relative w-full h-full overflow-hidden bg-neutral-950 text-neutral-100 flex flex-col font-sans">
        {/* Toast Notification Banner */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-3 inset-x-0 mx-auto max-w-sm z-50 px-4 py-2.5 rounded-2xl bg-neutral-900/95 border border-amber-500/50 text-white text-xs font-bold shadow-2xl backdrop-blur-md flex items-center justify-center text-center gap-2"
            >
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BURGER MENU NAVIGATION DRAWER */}
        <BurgerMenuDrawer
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          activeTab={activeTab}
          onTabChange={(tab) => {
            if (tab !== 'play') {
              setActiveLesson(null);
              setHighlightedPadId(null);
            }
            setActiveTab(tab);
            setIsMenuOpen(false);
            refreshUserStats();
          }}
          currentKit={currentKit}
          onSelectKit={(kitId) => {
            setCurrentKit(kitId);
            audioEngine.setKit(kitId);
            showToast(`Sound Kit loaded: ${kitId.toUpperCase()}`);
          }}
          onOpenLayoutEditor={() => {
            setActiveTab('play');
            setIsEditingLayout(true);
            setIsMenuOpen(false);
            showToast('Layout Editor active: Drag drums to reposition');
          }}
          onOpenMetronome={() => {
            setIsMetronomeModalOpen(true);
            setIsMenuOpen(false);
          }}
          onOpenSettings={() => {
            setIsSettingsOpen(true);
            setIsMenuOpen(false);
          }}
          onOpenAndroidHub={() => {
            setIsApkModalOpen(true);
            setIsMenuOpen(false);
          }}
          onTriggerInstallPwa={handleTriggerInstallPwa}
          canInstallPwa={canInstallPwa}
          userStats={userStats}
          metronomeBpm={metronomeBpm}
          isMetronomePlaying={isMetronomePlaying}
        />

      {/* MAIN VIEWPORT */}
      <div className="flex-1 w-full overflow-hidden flex flex-col">
        {/* Practice Highway Strip (if in active lesson on play view) */}
        {activeLesson && activeTab === 'play' && (
          <PracticePlayer
            lesson={activeLesson}
            onExit={() => {
              setActiveLesson(null);
              setHighlightedPadId(null);
            }}
            onSelectNextLesson={handleNextLesson}
            onHighlightPad={setHighlightedPadId}
            onToast={showToast}
          />
        )}

        {/* Tab Views */}
        {activeTab === 'home' && (
          <HomeDashboardView
            onPlayDrums={(kitId) => {
              if (kitId) {
                setCurrentKit(kitId);
                audioEngine.setKit(kitId);
              }
              setActiveLesson(null);
              setActiveTab('play');
            }}
            onSelectLesson={handleStartLesson}
            onOpenRecordings={() => setActiveTab('recordings')}
            userStats={userStats}
            onOpenBurgerMenu={() => setIsMenuOpen(true)}
          />
        )}

        {activeTab === 'play' && (
          <div className="flex-1 w-full flex flex-col overflow-hidden">
            <DrumKitView
              currentKit={currentKit}
              onSelectKit={setCurrentKit}
              onOpenBurgerMenu={() => setIsMenuOpen(true)}
              onOpenPractice={() => {
                setActiveTab('practice');
              }}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenMetronome={() => setIsMetronomeModalOpen(true)}
              onOpenAndroidHub={() => setIsApkModalOpen(true)}
              onTriggerInstallPwa={handleTriggerInstallPwa}
              isMetronomePlaying={isMetronomePlaying}
              metronomeBpm={metronomeBpm}
              highlightedPadId={highlightedPadId}
              onHitRegistered={handleHitRegistered}
              showKeyboardGuide={settings.showKeyboardGuide}
              onToast={showToast}
              isEditingLayout={isEditingLayout}
              onToggleLayoutEdit={() => setIsEditingLayout((prev) => !prev)}
            />
          </div>
        )}

        {activeTab === 'practice' && (
          <PracticeHomeView
            onSelectLesson={handleStartLesson}
            userStats={userStats}
            onOpenBurgerMenu={() => setIsMenuOpen(true)}
            onGoToDrums={() => {
              setActiveLesson(null);
              setActiveTab('play');
            }}
          />
        )}

        {activeTab === 'recordings' && (
          <RecordingsView
            onToast={showToast}
            onOpenBurgerMenu={() => setIsMenuOpen(true)}
            onGoToDrums={() => {
              setActiveLesson(null);
              setActiveTab('play');
            }}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView 
            userStats={userStats} 
            onToast={showToast} 
            onOpenBurgerMenu={() => setIsMenuOpen(true)}
            onGoToDrums={() => {
              setActiveLesson(null);
              setActiveTab('play');
            }}
          />
        )}
      </div>

      {/* METRONOME MODAL */}
      <MetronomeModal
        isOpen={isMetronomeModalOpen}
        onClose={() => setIsMetronomeModalOpen(false)}
        bpm={metronomeBpm}
        onBpmChange={handleBpmChange}
        isPlaying={isMetronomePlaying}
        onTogglePlay={handleToggleMetronome}
        timeSignature={metronomeSignature}
        onTimeSignatureChange={handleTimeSignatureChange}
        vibrateEnabled={settings.vibrationEnabled}
        onToggleVibrate={() =>
          handleUpdateSettings({ ...settings, vibrationEnabled: !settings.vibrationEnabled })
        }
      />

      {/* SETTINGS MODAL */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onToast={showToast}
      />

      {/* ANDROID APPLICATION & APK MODAL */}
      <AndroidApkModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
        onInstallPwa={handleTriggerInstallPwa}
        canInstallPwa={canInstallPwa}
        onToast={showToast}
      />
    </div>
  </AndroidAppShell>
  );
}
