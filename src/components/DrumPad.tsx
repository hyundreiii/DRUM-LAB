import React, { useState, useCallback } from 'react';
import { DrumPadDefinition } from '../types';
import { ExtendedKitConfig } from '../data/drumKits';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Move, GripVertical, ZoomIn, ZoomOut, RotateCcw, Crosshair,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight
} from 'lucide-react';

interface DrumPadProps {
  pad: DrumPadDefinition;
  onHit: (padId: DrumPadDefinition['id'], velocity?: number) => void;
  showKeyGuide?: boolean;
  isHighlighted?: boolean;
  isCustomizing?: boolean;
  scale?: number;
  kitConfig?: ExtendedKitConfig;
  onSelectForEdit?: () => void;
  onQuickScale?: (delta: number) => void;
  isDragging?: boolean;
  isSelected?: boolean;
  onStartDrag?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onNudge?: (dx: number, dy: number) => void;
  onResetPadPos?: () => void;
  posX?: number;
  posY?: number;
}

export const DrumPad: React.FC<DrumPadProps> = ({
  pad,
  onHit,
  showKeyGuide = true,
  isHighlighted = false,
  isCustomizing = false,
  scale = 1.0,
  kitConfig,
  onSelectForEdit,
  onQuickScale,
  isDragging = false,
  isSelected = false,
  onStartDrag,
  onNudge,
  onResetPadPos,
  posX,
  posY,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const triggerHit = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isCustomizing) {
        onSelectForEdit?.();
        onStartDrag?.(e);
        // Play muted audition sound
        onHit(pad.id, 0.7);
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Distance from center for dynamic velocity
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const dist = Math.sqrt(Math.pow(clickX - centerX, 2) + Math.pow(clickY - centerY, 2));
      const maxRadius = rect.width / 2;
      const normalizedDist = Math.min(1, dist / maxRadius);
      const velocity = 1.2 - normalizedDist * 0.4;

      setIsPressed(true);
      setTimeout(() => setIsPressed(false), 90);

      // Ripple animation
      const rippleId = Date.now() + Math.random();
      setRipples((prev) => [...prev.slice(-2), { id: rippleId, x: clickX, y: clickY }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== rippleId));
      }, 500);

      onHit(pad.id, velocity);
    },
    [isCustomizing, onHit, onSelectForEdit, onStartDrag, pad.id]
  );

  const baseSize = pad.defaultSize * scale;

  // Lug counts for realistic drums
  const lugDegrees = pad.id === 'kick' 
    ? [0, 36, 72, 108, 144, 180, 216, 252, 288, 324]
    : pad.id === 'snare' || pad.id === 'tom_floor'
    ? [0, 45, 90, 135, 180, 225, 270, 315]
    : [0, 60, 120, 180, 240, 300];

  return (
    <div
      id={`pad-container-${pad.id}`}
      className={`relative select-none flex items-center justify-center transition-transform duration-75 ${
        isCustomizing ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      } ${isDragging ? 'z-50 scale-105' : ''}`}
      style={{
        width: `${baseSize}px`,
        height: `${baseSize}px`,
        touchAction: 'none',
      }}
      onPointerDown={triggerHit}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Practice mode pulse guide halo */}
      {isHighlighted && (
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.95, 0.35, 0.95],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-[-14px] rounded-full border-4 border-amber-400 bg-amber-400/25 pointer-events-none z-30 shadow-[0_0_30px_rgba(251,191,36,0.85)]"
        />
      )}

      {/* Editing Mode Selection Outline & Indicator */}
      {isCustomizing && (
        <div className="absolute inset-[-8px] rounded-full border-2 border-dashed border-amber-400 animate-pulse pointer-events-none z-30 shadow-[0_0_15px_rgba(251,191,36,0.6)]" />
      )}

      {/* =========================================================================
          CYMBAL RENDERING (B20 Bronze, Hammered Marks, Specular Sheen, Tilt Wobble)
          ========================================================================= */}
      {pad.type === 'cymbal' ? (
        <motion.div
          id={`drum-cymbal-${pad.id}`}
          animate={
            isPressed
              ? {
                  rotateX: pad.id === 'ride' ? [0, -12, 10, -5, 0] : [0, 16, -10, 6, 0],
                  rotateY: [0, -10, 8, -3, 0],
                  scale: [1, 0.96, 1.03, 1],
                  filter: ['brightness(1)', 'brightness(1.35)', 'brightness(1)'],
                }
              : { rotateX: 0, rotateY: 0, scale: 1, filter: 'brightness(1)' }
          }
          transition={{ duration: 0.42, ease: 'easeOut' }}
          className={`w-full h-full rounded-full cymbal-surface cymbal-grooves cymbal-hammered cymbal-sheen relative flex items-center justify-center transition-all ${
            isPressed ? 'shadow-[0_0_35px_rgba(234,179,8,0.7)]' : 'shadow-2xl'
          }`}
          style={{ perspective: 600 }}
        >
          {/* Subtle concentric sound ring grooves */}
          <div className="absolute inset-3 rounded-full border border-amber-950/25 pointer-events-none" />
          <div className="absolute inset-6 rounded-full border border-amber-950/20 pointer-events-none" />
          <div className="absolute inset-9 rounded-full border border-amber-950/25 pointer-events-none" />

          {/* Cymbal Edge Bevel Ring */}
          <div className="absolute inset-0.5 rounded-full border-2 border-amber-200/40 pointer-events-none" />

          {/* Raised Bell (Center Cup) */}
          <div className="w-[30%] h-[30%] rounded-full bg-gradient-to-br from-amber-100 via-amber-300 to-amber-700 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_4px_8px_rgba(0,0,0,0.5)] border border-amber-800/60 flex items-center justify-center relative">
            {/* Center Felt Washer & Chrome Wingnut */}
            <div className="w-4 h-4 rounded-full bg-neutral-900 border border-neutral-600 shadow-md flex items-center justify-center">
              {/* Chrome Wingnut bar */}
              <div className="w-3.5 h-1 bg-gradient-to-r from-neutral-400 via-white to-neutral-400 rounded-full shadow-xs" />
            </div>
          </div>

          {/* Real Cymbal Badge / Label & Keyboard shortcut */}
          <div className="absolute bottom-2.5 inset-x-0 flex flex-col items-center pointer-events-none">
            <span className="text-[10px] font-black tracking-wider text-amber-950 uppercase font-mono drop-shadow-xs">
              {pad.shortName}
            </span>
            {showKeyGuide && (
              <span className="mt-0.5 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs text-[10px] font-mono font-extrabold text-amber-300 border border-amber-500/50 shadow-md">
                {pad.keyLabel}
              </span>
            )}
          </div>
        </motion.div>
      ) : pad.type === 'drum' ? (
        /* =========================================================================
           DRUM RENDERING (Shell Peek, Chrome Hoop, Tension Lugs, Coated Head)
           ========================================================================= */
        <motion.div
          id={`drum-head-${pad.id}`}
          animate={
            isPressed
              ? {
                  scale: [1, 0.94, 1.02, 1],
                  filter: ['brightness(1)', 'brightness(1.25)', 'brightness(1)'],
                }
              : { scale: 1, filter: 'brightness(1)' }
          }
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className={`w-full h-full rounded-full relative flex items-center justify-center ${
            pad.id === 'kick' ? 'bass-wooden-hoop' : 'chrome-diecast-rim'
          }`}
          style={{
            background: kitConfig?.shellColor || 'radial-gradient(circle, #b45309 0%, #78350f 70%, #451a03 100%)',
          }}
        >
          {/* Chrome Tension Casings / Lugs around the hoop perimeter */}
          {lugDegrees.map((deg) => (
            <div
              key={deg}
              className="absolute w-2 h-4 bg-gradient-to-b from-neutral-100 via-neutral-300 to-neutral-600 rounded-xs shadow-md border border-neutral-700 pointer-events-none"
              style={{
                top: '50%',
                left: '50%',
                transform: `rotate(${deg}deg) translate(0, -${baseSize / 2 + 1}px) translate(-50%, 0)`,
              }}
            >
              {/* Chrome square bolt head */}
              <div className="w-1.5 h-1.5 mx-auto mt-0.5 bg-neutral-100 rounded-xs border border-neutral-400" />
            </div>
          ))}

          {/* INNER DRUMHEAD MEMBRANE */}
          <div
            className={`w-[88%] h-[88%] rounded-full relative flex items-center justify-center overflow-hidden ${
              pad.id === 'kick'
                ? 'drumhead-kick'
                : pad.id === 'snare'
                ? 'drumhead-snare'
                : 'drumhead-tom'
            }`}
          >
            {/* Kick Drum Special Resonant Graphics */}
            {pad.id === 'kick' ? (
              <div className="w-full h-full flex flex-col items-center justify-center relative select-none">
                {/* Vintage Brand Badge */}
                <div className="text-center pointer-events-none z-10 opacity-90 mt-2">
                  <div className="text-xs font-black tracking-widest text-neutral-300 uppercase font-mono drop-shadow-md">
                    REAL DRUM
                  </div>
                  <div className="text-[9px] font-bold tracking-widest text-amber-500 uppercase font-mono">
                    {kitConfig?.shellLabel || 'STUDIO MASTER'}
                  </div>
                </div>

                {/* Kick Beater Contact Pad */}
                <div className="w-14 h-14 rounded-full border border-neutral-700/80 bg-neutral-900/80 flex items-center justify-center mt-3 shadow-inner">
                  <div className="w-5 h-5 rounded-full bg-neutral-950 border border-neutral-700 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-amber-500/60" />
                  </div>
                </div>

                {/* 4-Inch Port Hole Ring */}
                <div className="absolute right-3 bottom-3 w-8 h-8 rounded-full bg-black border-2 border-neutral-600 shadow-[inset_0_4px_8px_rgba(0,0,0,1)] flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-neutral-950/90" />
                </div>
              </div>
            ) : (
              /* Snare & Toms Batter Head */
              <div className="w-full h-full flex flex-col items-center justify-center relative">
                {/* Pinstripe outer boundary ring for Toms */}
                {pad.id !== 'snare' && (
                  <div className="absolute inset-2.5 rounded-full border border-neutral-500/30 pointer-events-none" />
                )}

                {/* Sweet-spot center ring */}
                <div className="w-6 h-6 rounded-full border border-neutral-400/40 bg-white/20 flex items-center justify-center shadow-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-400/80" />
                </div>

                {/* Drumhead Stamp Branding */}
                <div className="text-center pointer-events-none mt-1">
                  <span className="text-[8px] font-black tracking-wider text-neutral-500 uppercase font-mono">
                    {pad.shortName}
                  </span>
                  {pad.id === 'snare' && (
                    <div className="text-[7px] font-semibold text-neutral-400 font-mono tracking-tighter">
                      COATED BATTER
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Key shortcut badge */}
            {showKeyGuide && (
              <div className="absolute bottom-2.5 pointer-events-none">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-black shadow-md ${
                    pad.id === 'kick'
                      ? 'bg-neutral-900/90 text-amber-400 border border-neutral-600'
                      : 'bg-black/75 text-white border border-white/30'
                  }`}
                >
                  {pad.keyLabel}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        /* =========================================================================
           PERCUSSION (Steel Cowbell / Wood Tambourine)
           ========================================================================= */
        <motion.div
          id={`drum-percussion-${pad.id}`}
          animate={isPressed ? { scale: [1, 0.92, 1.05, 1], y: [0, 4, 0] } : { scale: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className={`w-full h-full rounded-2xl relative flex flex-col items-center justify-center shadow-2xl border-2 ${
            pad.id === 'cowbell'
              ? 'bg-gradient-to-b from-neutral-700 via-neutral-800 to-neutral-950 border-neutral-500'
              : 'bg-gradient-to-b from-amber-700 via-amber-900 to-neutral-950 border-amber-600'
          }`}
        >
          {/* Metal mounting bracket on Cowbell */}
          {pad.id === 'cowbell' && (
            <div className="absolute -top-1.5 w-4 h-2 bg-neutral-400 rounded-t border border-neutral-600 shadow-xs" />
          )}

          {/* Tambourine chrome jingles around rim */}
          {pad.id === 'tambourine' && (
            <>
              <div className="absolute -left-1 w-2.5 h-4 bg-gradient-to-r from-neutral-200 to-neutral-400 rounded-full border border-neutral-600 shadow-xs" />
              <div className="absolute -right-1 w-2.5 h-4 bg-gradient-to-r from-neutral-200 to-neutral-400 rounded-full border border-neutral-600 shadow-xs" />
            </>
          )}

          <span className="text-xl select-none">{pad.id === 'cowbell' ? '🔔' : '🪇'}</span>
          <span className="text-[9px] font-bold text-neutral-200 tracking-wider uppercase mt-0.5 font-mono">
            {pad.shortName}
          </span>
          {showKeyGuide && (
            <span className="mt-1 px-1.5 py-0.2 rounded bg-black/70 text-[9px] font-mono text-emerald-400 border border-emerald-500/40">
              {pad.keyLabel}
            </span>
          )}
        </motion.div>
      )}

      {/* Ripple hit wave feedback */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            initial={{ scale: 0.2, opacity: 0.95 }}
            animate={{ scale: 2.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="absolute rounded-full border-2 border-white/90 pointer-events-none z-30 shadow-[0_0_15px_white]"
            style={{
              left: `${ripple.x}px`,
              top: `${ripple.y}px`,
              width: '40px',
              height: '40px',
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </AnimatePresence>

      {/* In customize mode: add dashed positioning border and subtle center crosshair */}
      {isCustomizing && (
        <>
          <div
            className={`absolute -inset-1.5 rounded-full border-2 border-dashed pointer-events-none transition-colors ${
              isDragging
                ? 'border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                : isSelected
                ? 'border-amber-400'
                : 'border-amber-500/40'
            }`}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-35">
            <Crosshair className="w-5 h-5 text-amber-300" />
          </div>
        </>
      )}

      {/* =========================================================================
          VISUAL DRAG HANDLE ICON & PRECISION CONTROLS ON EACH DRUM COMPONENT
          ========================================================================= */}
      {isCustomizing && (
        <div
          id={`drag-handle-${pad.id}`}
          className={`absolute ${
            (posY ?? pad.defaultY) < 16 ? '-bottom-8' : '-top-8'
          } left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-2xl backdrop-blur-md select-none transition-all ${
            isDragging
              ? 'bg-amber-400 text-black border-2 border-white shadow-[0_0_20px_rgba(251,191,36,0.9)] scale-110 cursor-grabbing'
              : isSelected
              ? 'bg-neutral-950/95 text-amber-300 border-2 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.6)] cursor-grab hover:scale-105'
              : 'bg-neutral-900/95 text-neutral-200 border-2 border-amber-500/80 hover:border-amber-300 hover:text-white hover:scale-105 cursor-grab'
          }`}
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelectForEdit?.();
            onStartDrag?.(e);
          }}
          title={`Drag handle: Hold and move to reposition ${pad.name}`}
        >
          {/* Visual Drag Handle Icon with Grip */}
          <div className="flex items-center gap-1">
            <GripVertical className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <Move className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-mono font-black text-[10px] tracking-wider uppercase whitespace-nowrap">
              {pad.shortName}
            </span>
          </div>

          {/* If Selected: Precision Nudge, Scale, and Reset controls */}
          {isSelected && (
            <div
              className="flex items-center gap-1 ml-1 pl-1.5 border-l border-neutral-700/90"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {/* Precision Micro-Nudge Arrows (1% shifts) */}
              {onNudge && (
                <div className="flex items-center gap-0.5 mr-1 pr-1 border-r border-neutral-800">
                  <button
                    type="button"
                    onClick={() => onNudge(-1, 0)}
                    className="w-4 h-4 rounded bg-neutral-800 hover:bg-amber-500 hover:text-black text-neutral-300 flex items-center justify-center font-bold text-[9px] transition-colors"
                    title="Nudge Left (1%)"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => onNudge(1, 0)}
                    className="w-4 h-4 rounded bg-neutral-800 hover:bg-amber-500 hover:text-black text-neutral-300 flex items-center justify-center font-bold text-[9px] transition-colors"
                    title="Nudge Right (1%)"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    onClick={() => onNudge(0, -1)}
                    className="w-4 h-4 rounded bg-neutral-800 hover:bg-amber-500 hover:text-black text-neutral-300 flex items-center justify-center font-bold text-[9px] transition-colors"
                    title="Nudge Up (1%)"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => onNudge(0, 1)}
                    className="w-4 h-4 rounded bg-neutral-800 hover:bg-amber-500 hover:text-black text-neutral-300 flex items-center justify-center font-bold text-[9px] transition-colors"
                    title="Nudge Down (1%)"
                  >
                    ↓
                  </button>
                </div>
              )}

              {/* Quick Scale Buttons */}
              {onQuickScale && (
                <>
                  <button
                    type="button"
                    onClick={() => onQuickScale(-0.05)}
                    className="w-4 h-4 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white flex items-center justify-center transition-colors text-[9px] font-bold"
                    title="Decrease Size"
                  >
                    <ZoomOut className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuickScale(0.05)}
                    className="w-4 h-4 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white flex items-center justify-center transition-colors text-[9px] font-bold"
                    title="Increase Size"
                  >
                    <ZoomIn className="w-2.5 h-2.5" />
                  </button>
                </>
              )}

              {/* Reset to Default Position */}
              {onResetPadPos && (
                <button
                  type="button"
                  onClick={onResetPadPos}
                  className="w-4 h-4 rounded bg-neutral-800 hover:bg-red-950 text-neutral-300 hover:text-red-400 flex items-center justify-center transition-colors ml-0.5"
                  title="Reset to default position"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

