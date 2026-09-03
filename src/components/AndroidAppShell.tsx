import React, { useState, useEffect } from 'react';
import { 
  Wifi, Battery, RotateCcw, Smartphone, Maximize2, Minimize2, 
  ArrowLeft, Circle, Square, SmartphoneCharging, Layers, Info, Download, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AndroidAppShellProps {
  children: React.ReactNode;
  onAndroidBack: () => void;
  onAndroidHome: () => void;
  onOpenAndroidInfo: () => void;
  onTriggerInstallPwa?: () => void;
  isRecording?: boolean;
  isMetronomePlaying?: boolean;
  onToast?: (message: string) => void;
}

export const AndroidAppShell: React.FC<AndroidAppShellProps> = ({
  children,
  onAndroidBack,
  onAndroidHome,
  onOpenAndroidInfo,
  onTriggerInstallPwa,
  isRecording,
  isMetronomePlaying,
  onToast,
}) => {
  // Device display mode: 'frame' (renders Android smartphone bezel) or 'fullscreen' (edge-to-edge)
  const [displayMode, setDisplayMode] = useState<'frame' | 'fullscreen'>('frame');
  // Orientation: 'portrait' (vertical phone) or 'landscape' (horizontal phone)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  // Navigation style: 'buttons' (3-button: Back, Home, Recents) or 'gesture' (modern swipe pill)
  const [navStyle, setNavStyle] = useState<'buttons' | 'gesture'>('buttons');
  // Recents Multitasking drawer preview
  const [showRecents, setShowRecents] = useState(false);

  // Real-time status bar clock
  const [currentTime, setCurrentTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const [showInstallBanner, setShowInstallBanner] = useState(true);

  // Detect mobile screen width on mount: if on actual phone (<768px), auto switch to fullscreen
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setDisplayMode('fullscreen');
    }
  }, []);

  const toggleOrientation = () => {
    const next = orientation === 'portrait' ? 'landscape' : 'portrait';
    setOrientation(next);
    onToast?.(`Rotated to Android ${next.toUpperCase()} mode`);
  };

  const toggleDisplayMode = () => {
    const next = displayMode === 'frame' ? 'fullscreen' : 'frame';
    setDisplayMode(next);
    onToast?.(next === 'fullscreen' ? 'Edge-to-Edge Fullscreen Mode' : 'Android Device Frame Mode');
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-neutral-950 flex flex-col items-center justify-center select-none font-sans">
      {/* Outer Floating Android Utility Bar (accessible on all screen sizes) */}
      {displayMode === 'frame' && (
        <div className="absolute top-2 z-40 flex flex-wrap items-center justify-center gap-1.5 px-3 py-1.5 rounded-2xl bg-neutral-900/95 border border-neutral-800 shadow-2xl backdrop-blur-md text-xs max-w-[95vw]">
          <div className="flex items-center gap-1.5 text-neutral-300 font-bold pr-2 border-r border-neutral-700">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-[11px]">Android 15</span>
          </div>

          <button
            id="shell-install-android-btn"
            onClick={onTriggerInstallPwa || onOpenAndroidInfo}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/30 transition-all active:scale-95 animate-pulse"
            title="Install Real Drum on Android Phone"
          >
            <Download className="w-3.5 h-3.5 text-black stroke-[3]" />
            <span>Install on Android</span>
          </button>

          <button
            id="shell-toggle-orientation"
            onClick={toggleOrientation}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-bold text-[11px] transition-all active:scale-95"
            title="Toggle between Landscape (best for wide drumming) and Portrait mode"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rotate {orientation === 'landscape' ? 'Portrait' : 'Landscape'}</span>
            <span className="sm:hidden">Rotate</span>
          </button>

          <button
            id="shell-open-apk-info"
            onClick={onOpenAndroidInfo}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-emerald-400 border border-emerald-500/30 font-bold text-[11px] transition-all"
            title="Android APK details, WebAPK & QR Code"
          >
            <Info className="w-3.5 h-3.5" />
            <span>APK / QR</span>
          </button>

          <button
            id="shell-toggle-fullscreen"
            onClick={toggleDisplayMode}
            className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
            title="Toggle Edge-to-Edge View"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Edge-to-Edge exit trigger (only visible when in fullscreen mode) */}
      {displayMode === 'fullscreen' && (
        <button
          id="shell-exit-fullscreen"
          onClick={toggleDisplayMode}
          className="fixed top-2 right-2 z-50 p-1.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 shadow-md backdrop-blur-sm transition-all hidden md:flex items-center gap-1 text-[10px]"
          title="Show Android Smartphone Bezel"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span>Phone Frame</span>
        </button>
      )}

      {/* ANDROID DEVICE FRAME CONTAINER */}
      <div
        className={`relative transition-all duration-300 flex flex-col ${
          displayMode === 'fullscreen'
            ? 'w-full h-full'
            : orientation === 'landscape'
            ? 'w-[95vw] max-w-[940px] h-[86vh] max-h-[520px] rounded-[42px] p-[10px] bg-neutral-900 shadow-[0_20px_60px_rgba(0,0,0,0.9)] border-[4px] border-neutral-700/80'
            : 'w-[92vw] max-w-[420px] h-[92vh] max-h-[820px] rounded-[46px] p-[10px] bg-neutral-900 shadow-[0_20px_60px_rgba(0,0,0,0.9)] border-[4px] border-neutral-700/80'
        }`}
      >
        {/* Device Bezel Hardware Buttons (visible in frame mode) */}
        {displayMode === 'frame' && (
          <>
            {orientation === 'landscape' ? (
              <>
                {/* Volume Rocker at Top */}
                <div className="absolute -top-[7px] left-32 w-20 h-[3px] bg-neutral-600 rounded-full" />
                {/* Power button at Right */}
                <div className="absolute top-20 -right-[7px] w-[3px] h-12 bg-neutral-600 rounded-full" />
              </>
            ) : (
              <>
                {/* Volume Rocker at Right */}
                <div className="absolute top-28 -right-[7px] w-[3px] h-20 bg-neutral-600 rounded-full" />
                {/* Power button at Right */}
                <div className="absolute top-52 -right-[7px] w-[3px] h-12 bg-neutral-600 rounded-full" />
              </>
            )}
          </>
        )}

        {/* SCREEN SURFACE */}
        <div
          className={`relative w-full h-full bg-black overflow-hidden flex flex-col shadow-inner ${
            displayMode === 'frame'
              ? orientation === 'landscape'
                ? 'rounded-[32px]'
                : 'rounded-[36px]'
              : ''
          }`}
        >
          {/* ANDROID STATUS BAR */}
          <div className="relative z-40 w-full h-7 bg-neutral-950/95 px-4 flex items-center justify-between text-neutral-300 text-[11px] font-medium tracking-tight select-none border-b border-neutral-900/60 shrink-0">
            {/* Left: Clock + Android Notification Icons */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-white font-mono tracking-wider">{currentTime || '12:00'}</span>
              
              {/* Real Drum Running Notification Badge */}
              <div className="flex items-center gap-1 pl-1 text-[10px] text-amber-400/90 font-mono">
                <span>🥁</span>
                <span className="hidden xs:inline">RealDrum</span>
              </div>

              {/* Recording Indicator */}
              {isRecording && (
                <div className="flex items-center gap-1 text-[10px] text-red-400 font-bold animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>REC</span>
                </div>
              )}

              {/* Metronome Indicator */}
              {isMetronomePlaying && (
                <span className="text-[10px] text-amber-400 animate-pulse">🎵</span>
              )}
            </div>

            {/* Center: Android Camera Cutout / Punch-Hole + Quick Install Pill */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1 flex items-center justify-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-black border border-neutral-800 shadow-inner flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-900 border border-neutral-700/60" />
              </div>

              {/* Status Bar Install Pill */}
              <button
                id="statusbar-install-pill-btn"
                onClick={onTriggerInstallPwa || onOpenAndroidInfo}
                className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[9px] shadow-sm animate-pulse active:scale-95 transition-all"
                title="Install Real Drum on Android"
              >
                <Download className="w-2.5 h-2.5 stroke-[2.5]" />
                <span>Install</span>
              </button>
            </div>

            {/* Right: Connectivity & Battery Icons + Install Trigger */}
            <div className="flex items-center gap-1.5">
              {/* Mobile Install Button in Status Bar */}
              <button
                id="statusbar-mobile-install-btn"
                onClick={onTriggerInstallPwa || onOpenAndroidInfo}
                className="sm:hidden flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-black font-extrabold text-[9px] shadow-sm"
              >
                <Download className="w-2.5 h-2.5" />
                <span>Install</span>
              </button>

              {/* Quick Mobile Orientation toggle in status bar */}
              <button
                onClick={toggleOrientation}
                className="hover:text-white transition-colors p-0.5 text-neutral-400"
                title="Rotate Screen"
              >
                <RotateCcw className="w-3 h-3" />
              </button>

              <span className="text-[10px] font-bold text-emerald-400 font-mono">5G</span>
              <Wifi className="w-3.5 h-3.5 text-neutral-300" />
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono font-semibold">96%</span>
                <Battery className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* TOP ANDROID INSTALL NOTIFICATION BANNER (HIGH PROMINENCE) */}
          {showInstallBanner && (
            <div className="relative z-30 w-full bg-gradient-to-r from-emerald-950 via-neutral-900 to-emerald-950 border-b border-emerald-500/50 px-3 py-1.5 flex items-center justify-between text-xs gap-2 shrink-0 shadow-md">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="p-1 rounded-lg bg-emerald-500 text-black font-black text-xs shrink-0 animate-bounce">
                  <Smartphone className="w-3.5 h-3.5" />
                </span>
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-extrabold text-white text-[11px] sm:text-xs">Install Android App</span>
                  <span className="hidden sm:inline text-[10px] text-emerald-400 font-mono">• WebAPK • Zero Latency</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  id="banner-install-app-btn"
                  onClick={onTriggerInstallPwa || onOpenAndroidInfo}
                  className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[11px] shadow-md shadow-emerald-500/30 flex items-center gap-1 active:scale-95 transition-all"
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Install Now</span>
                </button>

                <button
                  id="banner-scan-qr-btn"
                  onClick={onOpenAndroidInfo}
                  className="hidden xs:flex px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-emerald-300 hover:text-white font-bold text-[11px] items-center gap-1 border border-emerald-500/30 transition-colors"
                >
                  <span>QR Code</span>
                </button>

                <button
                  id="banner-dismiss-install-btn"
                  onClick={() => setShowInstallBanner(false)}
                  className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs transition-colors"
                  title="Dismiss banner"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* INNER APP VIEWPORT */}
          <div className="relative flex-1 w-full h-[calc(100%-54px)] overflow-hidden flex flex-col bg-neutral-950">
            {children}

            {/* ANDROID RECENTS / APP SWITCHER OVERLAY */}
            <AnimatePresence>
              {showRecents && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-neutral-950/95 backdrop-blur-md p-6 flex flex-col items-center justify-center"
                >
                  <div className="text-center mb-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                      Android Multitasking Overview
                    </h3>
                    <p className="text-xs text-neutral-400">1 Active Audio Process</p>
                  </div>

                  <div className="w-64 p-4 rounded-2xl bg-neutral-900 border border-neutral-700 shadow-2xl space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🥁</span>
                        <span className="text-xs font-bold text-white">Digital Real Drum</span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>

                    <div className="h-28 bg-neutral-950 rounded-xl border border-neutral-800 p-3 flex flex-col justify-between text-[11px] text-neutral-400 font-mono">
                      <div>
                        <p className="text-amber-400 font-bold">Package: com.realdrum</p>
                        <p>Audio Engine: Active</p>
                        <p>Low Latency: Ready</p>
                      </div>
                      <div className="flex justify-end">
                        <span className="px-2 py-0.5 rounded bg-neutral-800 text-white font-bold text-[10px]">
                          RUNNING
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowRecents(false)}
                      className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition-colors"
                    >
                      Resume Real Drum
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ANDROID SYSTEM NAVIGATION BAR */}
          <div className="relative z-40 w-full h-7 bg-black/95 px-8 flex items-center justify-center select-none border-t border-neutral-900/80 shrink-0">
            {navStyle === 'buttons' ? (
              /* 3-Button Navigation (Back, Home, Recents) */
              <div className="w-full max-w-sm flex items-center justify-around text-neutral-400">
                {/* Back Button */}
                <button
                  id="android-nav-back"
                  onClick={() => {
                    if (showRecents) {
                      setShowRecents(false);
                    } else {
                      onAndroidBack();
                    }
                  }}
                  className="p-1.5 hover:text-white active:scale-90 transition-all"
                  title="Android Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                {/* Home Button */}
                <button
                  id="android-nav-home"
                  onClick={() => {
                    setShowRecents(false);
                    onAndroidHome();
                  }}
                  className="p-1.5 hover:text-white active:scale-90 transition-all"
                  title="Android Home"
                >
                  <Circle className="w-3.5 h-3.5 fill-current" />
                </button>

                {/* Recents / App Switcher */}
                <button
                  id="android-nav-recents"
                  onClick={() => setShowRecents((prev) => !prev)}
                  className="p-1.5 hover:text-white active:scale-90 transition-all"
                  title="Android Recents"
                >
                  <Square className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              /* Gesture Navigation Pill */
              <button
                id="android-gesture-pill"
                onClick={() => {
                  if (showRecents) {
                    setShowRecents(false);
                  } else {
                    onAndroidHome();
                  }
                }}
                className="w-32 h-1 rounded-full bg-neutral-500 hover:bg-neutral-300 transition-colors active:scale-95"
                title="Android Gesture Pill (Tap for Home, Drag for Recents)"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
