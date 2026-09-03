import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DrumKitId, DrumPadId, CustomLayoutMap } from '../types';
import { AVAILABLE_KITS, DEFAULT_DRUM_PADS, LAYOUT_PRESETS, ExtendedKitConfig, LayoutPreset } from '../data/drumKits';
import { DrumPad } from './DrumPad';
import { audioEngine } from '../services/audioEngine';
import { addBeatsToStats, loadCustomLayout, saveCustomLayout, resetCustomLayout, saveRecording } from '../services/storage';
import { 
  Volume2, Music, Settings as SettingsIcon, Square, Sparkles, Sliders, 
  RotateCcw, Maximize2, Minimize2, Move, Grid, Check, Disc, 
  ChevronDown, ZoomIn, ZoomOut, Zap, Eye, Menu, Download, Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DrumKitViewProps {
  currentKit: DrumKitId;
  onSelectKit: (kit: DrumKitId) => void;
  onOpenBurgerMenu?: () => void;
  onOpenPractice: () => void;
  onOpenSettings: () => void;
  onOpenMetronome: () => void;
  onOpenAndroidHub?: () => void;
  onTriggerInstallPwa?: () => void;
  isMetronomePlaying: boolean;
  metronomeBpm: number;
  highlightedPadId?: DrumPadId | null;
  onHitRegistered?: (padId: DrumPadId, timestamp: number) => void;
  showKeyboardGuide?: boolean;
  onToast?: (message: string) => void;
  isEditingLayout?: boolean;
  onToggleLayoutEdit?: () => void;
}

export const DrumKitView: React.FC<DrumKitViewProps> = ({
  currentKit,
  onSelectKit,
  onOpenBurgerMenu,
  onOpenPractice,
  onOpenSettings,
  onOpenMetronome,
  onOpenAndroidHub,
  onTriggerInstallPwa,
  isMetronomePlaying,
  metronomeBpm,
  highlightedPadId = null,
  onHitRegistered,
  showKeyboardGuide = true,
  onToast,
  isEditingLayout: isEditingLayoutProp,
  onToggleLayoutEdit,
}) => {
  const [customLayout, setCustomLayout] = useState<CustomLayoutMap>({});
  const [isEditingLayoutInternal, setIsEditingLayoutInternal] = useState(false);
  const isEditingLayout = isEditingLayoutProp !== undefined ? isEditingLayoutProp : isEditingLayoutInternal;
  const toggleLayoutEdit = () => {
    if (onToggleLayoutEdit) {
      onToggleLayoutEdit();
    } else {
      const next = !isEditingLayoutInternal;
      setIsEditingLayoutInternal(next);
      if (next) {
        onToast?.('Layout Editor open: Drag any drum or select a preset below!');
      } else {
        setSelectedPadForEdit(null);
        onToast?.('Drum layout saved!');
      }
    }
  };
  const closeLayoutEdit = () => {
    if (onToggleLayoutEdit && isEditingLayout) {
      onToggleLayoutEdit();
    } else {
      setIsEditingLayoutInternal(false);
    }
    setSelectedPadForEdit(null);
    onToast?.('Drum layout saved!');
  };
  const [selectedPadForEdit, setSelectedPadForEdit] = useState<DrumPadId | null>(null);
  const [draggingPadId, setDraggingPadId] = useState<DrumPadId | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('standard');

  // Mechanical Foot Pedal Animation States
  const [isKickBeaterActive, setIsKickBeaterActive] = useState(false);
  const [isHiHatPedalActive, setIsHiHatPedalActive] = useState(false);

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const recordStartTimeRef = useRef<number>(0);
  const recordedHitsRef = useRef<Array<{ padId: DrumPadId; timeMs: number; velocity: number }>>([]);
  const recordTimerRef = useRef<number | null>(null);

  // Stage lighting pulse effect
  const [stagePulseColor, setStagePulseColor] = useState<string | null>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const stageCanvasRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Drag tracking offset
  const dragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  // Load custom layout on mount
  useEffect(() => {
    setCustomLayout(loadCustomLayout());
  }, []);

  // Handle Recording Timer
  useEffect(() => {
    if (isRecording) {
      recordStartTimeRef.current = Date.now();
      recordedHitsRef.current = [];
      setRecordDuration(0);
      recordTimerRef.current = window.setInterval(() => {
        setRecordDuration(Math.floor((Date.now() - recordStartTimeRef.current) / 1000));
      }, 1000);
    } else {
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
    }
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, [isRecording]);

  const handleStartRecording = () => {
    audioEngine.init();
    setIsRecording(true);
    onToast?.('Recording started! Play your groove.');
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    const durationMs = Date.now() - recordStartTimeRef.current;
    const hits = recordedHitsRef.current;

    if (hits.length === 0) {
      onToast?.('Recording cancelled (no drum hits detected).');
      return;
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const newRecording = {
      id: `rec_${Date.now()}`,
      title: `Beat Jam - ${formattedDate}`,
      createdAt: Date.now(),
      durationMs,
      kitId: currentKit,
      hitCount: hits.length,
      hits,
    };

    saveRecording(newRecording);
    onToast?.(`Recording saved! (${hits.length} beats recorded)`);
  };

  // Drum Pad Hit Handler
  const handlePadHit = useCallback(
    (padId: DrumPadId, velocity: number = 1.0) => {
      audioEngine.playDrum(padId, velocity);

      // Animate physical pedals
      if (padId === 'kick') {
        setIsKickBeaterActive(true);
        setTimeout(() => setIsKickBeaterActive(false), 140);
      } else if (padId === 'hihat_closed' || padId === 'hihat_open') {
        setIsHiHatPedalActive(true);
        setTimeout(() => setIsHiHatPedalActive(false), 140);
      }

      // Record hit if active
      const now = performance.now();
      if (isRecording) {
        const timeOffset = Date.now() - recordStartTimeRef.current;
        recordedHitsRef.current.push({ padId, timeMs: timeOffset, velocity });
      }

      // Track user stats & achievements
      const { newlyUnlocked } = addBeatsToStats(1);
      if (newlyUnlocked.length > 0) {
        newlyUnlocked.forEach((ach) => {
          onToast?.(`🏆 Achievement Unlocked: ${ach.title}!`);
        });
      }

      // External callback (for practice mode timing detection)
      onHitRegistered?.(padId, now);

      // Stage ambient light pulse
      const pad = DEFAULT_DRUM_PADS.find((p) => p.id === padId);
      if (pad) {
        setStagePulseColor(pad.colorAccent);
        setTimeout(() => setStagePulseColor(null), 120);
      }
    },
    [isRecording, onHitRegistered, onToast]
  );

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();
      const matchedPad = DEFAULT_DRUM_PADS.find((p) => p.defaultKey === key);
      if (matchedPad && !e.repeat) {
        e.preventDefault();
        handlePadHit(matchedPad.id, 1.0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePadHit]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      stageContainerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Custom layout update helper
  const updatePadPos = (padId: DrumPadId, deltaX: number, deltaY: number) => {
    setCustomLayout((prev) => {
      const existing = prev[padId] || {
        x: DEFAULT_DRUM_PADS.find((p) => p.id === padId)?.defaultX ?? 50,
        y: DEFAULT_DRUM_PADS.find((p) => p.id === padId)?.defaultY ?? 50,
        scale: 1.0,
        volume: 1.0,
        pitch: 0,
      };
      const updated = {
        ...prev,
        [padId]: {
          ...existing,
          x: Math.max(6, Math.min(94, Math.round((existing.x + deltaX) * 10) / 10)),
          y: Math.max(6, Math.min(94, Math.round((existing.y + deltaY) * 10) / 10)),
        },
      };
      saveCustomLayout(updated);
      return updated;
    });
  };

  const updatePadScale = (padId: DrumPadId, newScale: number) => {
    const clampedScale = Math.max(0.65, Math.min(1.4, Math.round(newScale * 100) / 100));
    setCustomLayout((prev) => {
      const existing = prev[padId] || {
        x: DEFAULT_DRUM_PADS.find((p) => p.id === padId)?.defaultX ?? 50,
        y: DEFAULT_DRUM_PADS.find((p) => p.id === padId)?.defaultY ?? 50,
        scale: 1.0,
        volume: 1.0,
        pitch: 0,
      };
      const updated = {
        ...prev,
        [padId]: {
          ...existing,
          scale: clampedScale,
        },
      };
      saveCustomLayout(updated);
      return updated;
    });
  };

  // Apply Layout Preset
  const handleApplyPreset = (preset: LayoutPreset) => {
    setSelectedPresetId(preset.id);
    setCustomLayout(preset.layout);
    saveCustomLayout(preset.layout);
    onToast?.(`Layout preset applied: ${preset.name}`);
  };

  const handleResetLayout = () => {
    resetCustomLayout();
    setCustomLayout({});
    setSelectedPresetId('standard');
    setSelectedPadForEdit(null);
    onToast?.('Drum layout reset to default.');
  };

  const resetSinglePadPos = (padId: DrumPadId) => {
    const pad = DEFAULT_DRUM_PADS.find((p) => p.id === padId);
    if (!pad) return;
    setCustomLayout((prev) => {
      const updated = {
        ...prev,
        [padId]: {
          x: pad.defaultX,
          y: pad.defaultY,
          scale: 1.0,
          volume: 1.0,
          pitch: 0,
        },
      };
      saveCustomLayout(updated);
      return updated;
    });
    onToast?.(`Reset ${pad.name} position to default`);
  };

  // Direct Drag and Drop Handlers
  const startDraggingPad = useCallback((padId: DrumPadId, clientX: number, clientY: number) => {
    if (!isEditingLayout) return;

    setSelectedPadForEdit(padId);
    setDraggingPadId(padId);

    const stage = stageCanvasRef.current;
    if (!stage) return;
    const stageRect = stage.getBoundingClientRect();
    const pad = DEFAULT_DRUM_PADS.find((p) => p.id === padId);
    const existing = customLayout[padId];
    const currentX = existing?.x ?? pad?.defaultX ?? 50;
    const currentY = existing?.y ?? pad?.defaultY ?? 50;

    const pointerXPercent = ((clientX - stageRect.left) / stageRect.width) * 100;
    const pointerYPercent = ((clientY - stageRect.top) / stageRect.height) * 100;

    dragOffsetRef.current = {
      dx: currentX - pointerXPercent,
      dy: currentY - pointerYPercent,
    };
  }, [isEditingLayout, customLayout]);

  // Window-level smooth pointer tracking for precision dragging
  useEffect(() => {
    if (!draggingPadId) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      const stage = stageCanvasRef.current;
      if (!stage) return;
      const stageRect = stage.getBoundingClientRect();

      const pointerXPercent = ((e.clientX - stageRect.left) / stageRect.width) * 100;
      const pointerYPercent = ((e.clientY - stageRect.top) / stageRect.height) * 100;

      let targetX = pointerXPercent + dragOffsetRef.current.dx;
      let targetY = pointerYPercent + dragOffsetRef.current.dy;

      // Optional snapping to center lines if within threshold
      if (showGrid) {
        if (Math.abs(targetX - 50) < 1.8) targetX = 50;
        if (Math.abs(targetY - 50) < 1.8) targetY = 50;
      }

      targetX = Math.max(6, Math.min(94, Math.round(targetX * 10) / 10));
      targetY = Math.max(6, Math.min(94, Math.round(targetY * 10) / 10));

      setCustomLayout((prev) => {
        const existing = prev[draggingPadId] || {
          x: DEFAULT_DRUM_PADS.find((p) => p.id === draggingPadId)?.defaultX ?? 50,
          y: DEFAULT_DRUM_PADS.find((p) => p.id === draggingPadId)?.defaultY ?? 50,
          scale: 1.0,
          volume: 1.0,
          pitch: 0,
        };
        return {
          ...prev,
          [draggingPadId]: {
            ...existing,
            x: targetX,
            y: targetY,
          },
        };
      });
    };

    const handleWindowPointerUp = () => {
      setDraggingPadId(null);
      setCustomLayout((current) => {
        saveCustomLayout(current);
        return current;
      });
    };

    window.addEventListener('pointermove', handleWindowPointerMove, { passive: true });
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    };
  }, [draggingPadId, showGrid]);

  const activeKitObj: ExtendedKitConfig =
    (AVAILABLE_KITS.find((k) => k.id === currentKit) as ExtendedKitConfig) || AVAILABLE_KITS[0];

  const activeSelectedPadObj = selectedPadForEdit
    ? DEFAULT_DRUM_PADS.find((p) => p.id === selectedPadForEdit)
    : null;

  return (
    <div
      ref={stageContainerRef}
      className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-neutral-950 select-none"
    >
      {/* Dynamic Stage Backdrop Spotlights */}
      <div
        className="absolute inset-0 transition-opacity duration-200 pointer-events-none"
        style={{
          background: stagePulseColor
            ? `radial-gradient(circle at 50% 35%, ${stagePulseColor}44 0%, transparent 68%)`
            : 'radial-gradient(circle at 50% 25%, rgba(255,255,255,0.06) 0%, transparent 65%)',
        }}
      />

      {/* Realistic Stage Floor & Drum Mat Rug */}
      <div className="absolute inset-0 stage-carpet opacity-95 pointer-events-none" />

      {/* Visual Overhead Stage Light Beam cones */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25">
        <div className="absolute top-0 left-1/4 w-48 h-full bg-gradient-to-b from-amber-100/15 via-transparent to-transparent -rotate-12 blur-xl" />
        <div className="absolute top-0 right-1/4 w-48 h-full bg-gradient-to-b from-cyan-100/15 via-transparent to-transparent rotate-12 blur-xl" />
      </div>

      {/* TOP CONTROLS BAR */}
      <header className="relative z-30 flex items-center justify-between px-3 py-2 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/80 shadow-lg select-none">
        {/* Left: Burger Menu Button + Real Drum Brand + Kit Selector */}
        <div className="flex items-center gap-2">
          {/* Burger Menu Button */}
          {onOpenBurgerMenu && (
            <button
              id="drumkit-burger-menu-btn"
              onClick={onOpenBurgerMenu}
              className="flex items-center justify-center p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-400 hover:text-white border border-neutral-700/80 shadow-md transition-all active:scale-95"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Real Drum Brand Logo Badge */}
          <div className="hidden xs:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-900/90 border border-neutral-800 text-xs font-black tracking-wider uppercase font-mono text-white shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
            <span>REAL DRUM</span>
          </div>

          {/* Kit Selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700/80 text-xs shadow-inner">
            <span className="w-2.5 h-2.5 rounded-full border border-white/20 shadow-sm shrink-0" style={{ backgroundColor: activeKitObj.accentColor }} />
            <select
              id="sound-kit-select"
              value={currentKit}
              onChange={(e) => {
                const kitId = e.target.value as DrumKitId;
                onSelectKit(kitId);
                audioEngine.setKit(kitId);
                onToast?.(`Kit loaded: ${AVAILABLE_KITS.find((k) => k.id === kitId)?.name}`);
              }}
              className="bg-transparent text-neutral-100 font-bold focus:outline-none cursor-pointer max-w-[100px] sm:max-w-none text-xs"
            >
              {AVAILABLE_KITS.map((kit) => (
                <option key={kit.id} value={kit.id} className="bg-neutral-900 text-white">
                  {kit.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Recording Status or Action + Metronome */}
        <div className="flex items-center gap-2">
          {/* Quick Metronome Indicator */}
          <button
            id="metronome-quick-btn"
            onClick={onOpenMetronome}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isMetronomePlaying
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 animate-pulse'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>{metronomeBpm} BPM</span>
          </button>

          {isRecording ? (
            <button
              id="stop-rec-btn"
              onClick={handleStopRecording}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg animate-pulse"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>REC {Math.floor(recordDuration / 60)}:{String(recordDuration % 60).padStart(2, '0')}</span>
            </button>
          ) : (
            <button
              id="start-rec-btn"
              onClick={handleStartRecording}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-red-400 border border-neutral-700/80 text-xs font-medium transition-colors"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm" />
              <span>Record</span>
            </button>
          )}
        </div>

        {/* Right Action Icons: Layout Toggle & Tools */}
        <div className="flex items-center gap-1.5">
          {/* Direct Install on Android button */}
          <button
            id="header-install-android-btn"
            onClick={onTriggerInstallPwa || onOpenAndroidHub}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-md shadow-emerald-500/30 transition-all active:scale-95 animate-pulse shrink-0 cursor-pointer"
            title="Install Real Drum on Android Phone"
          >
            <Download className="w-3.5 h-3.5 text-black stroke-[3]" />
            <span className="inline font-bold">Install App</span>
          </button>

          {/* Custom layout mode toggle */}
          <button
            id="edit-layout-btn"
            onClick={toggleLayoutEdit}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-sm ${
              isEditingLayout
                ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:text-white hover:border-neutral-700'
            }`}
            title="Reposition and customize drum kit layout"
          >
            <Move className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isEditingLayout ? 'Done Moving' : 'Reposition'}</span>
          </button>

          {/* Fullscreen toggle */}
          <button
            id="fullscreen-btn"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Settings modal trigger */}
          <button
            id="settings-btn"
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
            title="Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* =========================================================================
          CUSTOMIZE LAYOUT TOOLBAR (Interactive Presets, Drag Controls, Alignment)
          ========================================================================= */}
      <AnimatePresence>
        {isEditingLayout && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-30 px-3.5 py-2.5 bg-neutral-950/95 border-b border-amber-600/50 backdrop-blur-xl flex flex-col gap-2 text-xs shadow-2xl"
          >
            {/* Top row: Presets & Grid Toggle */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-amber-400 font-bold flex items-center gap-1 mr-1">
                  <Sliders className="w-3.5 h-3.5" /> Presets:
                </span>
                {LAYOUT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className={`px-2.5 py-1 rounded-md font-semibold text-xs border transition-all ${
                      selectedPresetId === preset.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                    }`}
                    title={preset.description}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              {/* Grid Toggle & Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs border transition-colors ${
                    showGrid
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                  }`}
                  title="Toggle Stage Guide Lines"
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Guides</span>
                </button>

                <button
                  onClick={handleResetLayout}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 font-medium transition-colors"
                >
                  <RotateCcw className="w-3 h-3 text-red-400" />
                  <span>Reset</span>
                </button>

                <button
                  onClick={closeLayoutEdit}
                  className="flex items-center gap-1 px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold shadow-md transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Layout</span>
                </button>
              </div>
            </div>

            {/* Bottom row: Selected Pad Specific Fine-Tuning */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-neutral-800/80">
              <div className="flex items-center gap-2">
                <span className="text-neutral-400">
                  {activeSelectedPadObj ? (
                    <span className="text-amber-200 font-bold">
                      Selected: {activeSelectedPadObj.name}
                    </span>
                  ) : (
                    <span className="text-neutral-400 italic">
                      Tip: Click and drag any drum pad on stage to position it.
                    </span>
                  )}
                </span>
              </div>

              {selectedPadForEdit && activeSelectedPadObj && (
                <div className="flex items-center gap-3 bg-neutral-900 px-2.5 py-1 rounded-lg border border-neutral-700">
                  {/* Scale adjustment */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-400 font-mono text-[11px]">Size:</span>
                    <input
                      type="range"
                      min="0.65"
                      max="1.4"
                      step="0.05"
                      value={customLayout[selectedPadForEdit]?.scale ?? 1.0}
                      onChange={(e) => updatePadScale(selectedPadForEdit, parseFloat(e.target.value))}
                      className="w-20 accent-amber-500"
                    />
                    <span className="font-mono text-neutral-300 text-[11px]">
                      {Math.round((customLayout[selectedPadForEdit]?.scale ?? 1.0) * 100)}%
                    </span>
                  </div>

                  {/* Nudge Arrows */}
                  <div className="flex items-center gap-0.5 border-l border-neutral-700 pl-2">
                    <button
                      onClick={() => updatePadPos(selectedPadForEdit, -2, 0)}
                      className="w-5 h-5 rounded bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center font-bold"
                      title="Move Left"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => updatePadPos(selectedPadForEdit, 2, 0)}
                      className="w-5 h-5 rounded bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center font-bold"
                      title="Move Right"
                    >
                      →
                    </button>
                    <button
                      onClick={() => updatePadPos(selectedPadForEdit, 0, -2)}
                      className="w-5 h-5 rounded bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center font-bold"
                      title="Move Up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => updatePadPos(selectedPadForEdit, 0, 2)}
                      className="w-5 h-5 rounded bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center font-bold"
                      title="Move Down"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          DRUM STAGE CANVAS (Acoustic Rug, Chrome Stands, Hardware Tripods)
          ========================================================================= */}
      <main className="relative flex-1 w-full max-w-5xl mx-auto flex items-center justify-center p-2 overflow-hidden">
        {/* Stage Hardware: Realistic 3D Chrome Boom Arms & Stands under the instruments */}
        <div className="absolute inset-x-8 top-16 bottom-20 pointer-events-none opacity-30 flex flex-col justify-around">
          {/* Upper Cymbals Chrome Boom Rack */}
          <div className="relative w-full flex items-center justify-between px-10">
            {/* Crash 1 Tripod & Boom Stand */}
            <div className="w-1.5 h-36 bg-gradient-to-r from-neutral-500 via-neutral-100 to-neutral-600 rounded-full shadow-lg" />
            {/* Splash center boom */}
            <div className="w-1.5 h-28 bg-gradient-to-r from-neutral-500 via-neutral-200 to-neutral-600 rounded-full shadow-lg" />
            {/* Ride Tripod & Boom Stand */}
            <div className="w-1.5 h-36 bg-gradient-to-r from-neutral-500 via-neutral-100 to-neutral-600 rounded-full shadow-lg" />
          </div>

          {/* Lower Racks & Tom Mount Arms */}
          <div className="relative w-full flex items-center justify-around px-16">
            <div className="w-2 h-20 bg-gradient-to-r from-neutral-600 via-neutral-300 to-neutral-700 rounded-full shadow-md rotate-12" />
            <div className="w-2 h-20 bg-gradient-to-r from-neutral-600 via-neutral-300 to-neutral-700 rounded-full shadow-md -rotate-12" />
          </div>

          {/* Snare Basket Chrome Tripod Base */}
          <div className="absolute left-[30%] bottom-8 w-24 h-1 bg-gradient-to-r from-transparent via-neutral-300 to-transparent shadow-sm" />
          {/* Floor Tom 3-Leg Chrome Pegs */}
          <div className="absolute right-[18%] bottom-10 w-24 h-1 bg-gradient-to-r from-transparent via-neutral-300 to-transparent shadow-sm" />
        </div>

        {/* DRUM PADS INTERACTIVE STAGE */}
        <div
          ref={stageCanvasRef}
          className="relative w-full h-full max-h-[660px] aspect-[4/3] sm:aspect-[16/10] overflow-hidden"
        >
          {/* Grid Guide Overlay (when toggled on) */}
          {showGrid && (
            <div className="absolute inset-0 pointer-events-none z-0">
              <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-25" />
              {/* Center Crosshairs */}
              <div className="absolute left-1/2 inset-y-0 w-px bg-cyan-400/40" />
              <div className="absolute top-1/2 inset-x-0 h-px bg-cyan-400/40" />
            </div>
          )}

          {/* Dynamic Laser Alignment Crosshairs when Dragging Any Drum Component */}
          {draggingPadId && (
            <>
              {/* Horizontal guide line across full stage */}
              <div
                className="absolute inset-x-0 h-px bg-amber-400/80 pointer-events-none z-30 border-t border-dashed border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                style={{
                  top: `${customLayout[draggingPadId]?.y ?? DEFAULT_DRUM_PADS.find((p) => p.id === draggingPadId)?.defaultY ?? 50}%`,
                }}
              >
                <div className="absolute right-2 -top-5 text-[9px] font-mono font-bold text-amber-300 bg-neutral-950/95 px-2 py-0.5 rounded border border-amber-400 shadow-lg">
                  Y: {Math.round(customLayout[draggingPadId]?.y ?? DEFAULT_DRUM_PADS.find((p) => p.id === draggingPadId)?.defaultY ?? 50)}%
                </div>
              </div>

              {/* Vertical guide line across full stage */}
              <div
                className="absolute inset-y-0 w-px bg-amber-400/80 pointer-events-none z-30 border-l border-dashed border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                style={{
                  left: `${customLayout[draggingPadId]?.x ?? DEFAULT_DRUM_PADS.find((p) => p.id === draggingPadId)?.defaultX ?? 50}%`,
                }}
              >
                <div className="absolute bottom-2 -left-6 text-[9px] font-mono font-bold text-amber-300 bg-neutral-950/95 px-2 py-0.5 rounded border border-amber-400 shadow-lg">
                  X: {Math.round(customLayout[draggingPadId]?.x ?? DEFAULT_DRUM_PADS.find((p) => p.id === draggingPadId)?.defaultX ?? 50)}%
                </div>
              </div>
            </>
          )}

          {/* Render All 12 Drum Components */}
          {DEFAULT_DRUM_PADS.map((pad) => {
            const custom = customLayout[pad.id];
            const posX = custom?.x ?? pad.defaultX;
            const posY = custom?.y ?? pad.defaultY;
            const scale = custom?.scale ?? 1.0;
            const isHighlighted = highlightedPadId === pad.id;
            const isSelected = selectedPadForEdit === pad.id;
            const isDraggingThis = draggingPadId === pad.id;

            return (
              <div
                key={pad.id}
                className={`absolute transition-all ${
                  isDraggingThis ? 'duration-0 z-50' : 'duration-100 ease-out'
                }`}
                style={{
                  left: `${posX}%`,
                  top: `${posY}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: isDraggingThis
                    ? 60
                    : isSelected
                    ? 50
                    : pad.type === 'cymbal'
                    ? 20
                    : pad.id === 'kick'
                    ? 8
                    : 16,
                }}
              >
                <DrumPad
                  pad={pad}
                  onHit={handlePadHit}
                  showKeyGuide={showKeyboardGuide}
                  isHighlighted={isHighlighted}
                  isCustomizing={isEditingLayout}
                  scale={scale}
                  kitConfig={activeKitObj}
                  isSelected={isSelected}
                  isDragging={isDraggingThis}
                  posX={posX}
                  posY={posY}
                  onSelectForEdit={() => setSelectedPadForEdit(pad.id)}
                  onStartDrag={(e) => startDraggingPad(pad.id, e.clientX, e.clientY)}
                  onNudge={(dx, dy) => updatePadPos(pad.id, dx, dy)}
                  onResetPadPos={() => resetSinglePadPos(pad.id)}
                  onQuickScale={(delta) => updatePadScale(pad.id, scale + delta)}
                />

                {/* Coordinate Position Pill tooltip during drag */}
                {isDraggingThis && (
                  <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-neutral-950/95 text-amber-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border-2 border-amber-400 shadow-2xl pointer-events-none whitespace-nowrap z-50 flex items-center gap-1.5 animate-pulse">
                    <span>X: {Math.round(posX)}%</span>
                    <span>•</span>
                    <span>Y: {Math.round(posY)}%</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* =========================================================================
          BOTTOM REALISTIC FOOT PEDAL CONSOLE & ACTIONS
          ========================================================================= */}
      <footer className="relative z-30 flex items-center justify-between px-4 py-2.5 bg-neutral-950/90 backdrop-blur-md border-t border-neutral-800/80 shadow-2xl">
        {/* Left: Practice Mode Shortcut */}
        <div className="flex items-center gap-2">
          <button
            id="quick-practice-btn"
            onClick={onOpenPractice}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/80 text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Practice Mode</span>
          </button>
        </div>

        {/* Center: Interactive Mechanical Foot Pedals (DW Kick Pedal & Hi-Hat Stomp) */}
        <div className="flex items-center gap-3">
          {/* Hi-Hat Foot Stomp Pedal */}
          <button
            id="hihat-foot-pedal-btn"
            onPointerDown={(e) => {
              e.preventDefault();
              handlePadHit('hihat_closed', 1.0);
            }}
            className={`group relative px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-all shadow-md active:scale-95 ${
              isHiHatPedalActive
                ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                : 'bg-gradient-to-b from-neutral-800 to-neutral-900 border-neutral-700 text-neutral-300 hover:border-neutral-500'
            }`}
            title="Tap Hi-Hat Foot Pedal"
          >
            {/* Miniature Hi-Hat Pedal Plate */}
            <div className="w-3 h-5 bg-neutral-700 rounded-sm border border-neutral-500 flex flex-col justify-around px-0.5 shadow-inner">
              <div className="w-full h-0.5 bg-neutral-400" />
              <div className="w-full h-0.5 bg-neutral-400" />
              <div className="w-full h-0.5 bg-neutral-400" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black tracking-wider uppercase font-mono leading-tight">
                HAT PEDAL
              </span>
              <span className="text-[9px] text-neutral-400 font-mono">[S]</span>
            </div>
          </button>

          {/* Bass Drum Mechanical Kick Pedal with Animated Spring Beater */}
          <button
            id="quick-kick-pedal-btn"
            onPointerDown={(e) => {
              e.preventDefault();
              handlePadHit('kick', 1.25);
            }}
            className={`group relative px-4 py-1.5 rounded-xl border flex items-center gap-2.5 transition-all shadow-lg active:scale-95 ${
              isKickBeaterActive
                ? 'bg-gradient-to-r from-amber-600/30 to-red-600/30 border-amber-400 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                : 'bg-gradient-to-b from-neutral-800 via-neutral-850 to-neutral-900 border-neutral-700 text-neutral-200 hover:border-amber-500/70'
            }`}
            title="Bass Drum Kick Pedal (Press Spacebar or Tap)"
          >
            {/* Animated Mechanical Beater Shaft */}
            <div className="relative w-4 h-6 flex items-center justify-center">
              {/* Dual Chain Hub */}
              <div className="absolute bottom-0 w-2.5 h-1.5 bg-neutral-500 rounded-xs" />
              {/* Chrome Beater Shaft */}
              <motion.div
                animate={isKickBeaterActive ? { rotate: -35, y: -2 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.08, ease: 'easeOut' }}
                className="w-1 h-5 bg-gradient-to-t from-neutral-400 via-white to-neutral-300 rounded-full origin-bottom flex flex-col items-center"
              >
                {/* Felt Beater Head */}
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-100 border border-neutral-500 shadow-xs" />
              </motion.div>
            </div>

            <div className="flex flex-col text-left">
              <span className="text-[11px] font-black tracking-wider text-amber-300 uppercase font-mono leading-tight">
                BASS KICK PEDAL
              </span>
              <span className="text-[9px] text-neutral-400 font-mono">[SPACEBAR]</span>
            </div>
          </button>
        </div>

        {/* Right: Kit Name & Wood Wrap Badge */}
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeKitObj.accentColor }} />
            <span>{activeKitObj.shellLabel}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
