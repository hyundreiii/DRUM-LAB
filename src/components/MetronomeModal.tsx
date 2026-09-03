import React, { useState, useEffect, useRef, useCallback } from 'react';
import { audioEngine } from '../services/audioEngine';
import { Play, Pause, Volume2, X, Plus, Minus, Disc } from 'lucide-react';

interface MetronomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  timeSignature: string;
  onTimeSignatureChange: (sig: string) => void;
  vibrateEnabled: boolean;
  onToggleVibrate: () => void;
}

export const MetronomeModal: React.FC<MetronomeModalProps> = ({
  isOpen,
  onClose,
  bpm,
  onBpmChange,
  isPlaying,
  onTogglePlay,
  timeSignature,
  onTimeSignatureChange,
  vibrateEnabled,
  onToggleVibrate,
}) => {
  const [currentBeat, setCurrentBeat] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const tapTimesRef = useRef<number[]>([]);

  // Parse time signature (e.g. "4/4" -> 4 beats)
  const beatsPerBar = parseInt(timeSignature.split('/')[0], 10) || 4;

  // Metronome scheduler loop
  useEffect(() => {
    if (!isPlaying) {
      setCurrentBeat(0);
      return;
    }

    const intervalMs = (60 / bpm) * 1000;
    const interval = setInterval(() => {
      setCurrentBeat((prev) => {
        const nextBeat = (prev + 1) % beatsPerBar;
        const isDownbeat = nextBeat === 0;

        audioEngine.playMetronomeClick(isDownbeat);

        if (vibrateEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate(isDownbeat ? 35 : 15);
          } catch {}
        }

        return nextBeat;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, bpm, beatsPerBar, vibrateEnabled]);

  // Tap Tempo Handler
  const handleTapTempo = useCallback(() => {
    const now = performance.now();
    const taps = tapTimesRef.current;
    // Discard taps older than 2.5 seconds
    const recentTaps = [...taps.filter((t) => now - t < 2500), now];
    tapTimesRef.current = recentTaps;

    if (recentTaps.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < recentTaps.length; i++) {
        intervals.push(recentTaps[i] - recentTaps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 40 && calculatedBpm <= 240) {
        onBpmChange(calculatedBpm);
      }
    }
  }, [onBpmChange]);

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    audioEngine.setMetronomeVolume(newVol);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl relative select-none">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-black text-white flex items-center justify-center gap-2">
            <span>Metronome</span>
            <span className="text-amber-400">⏱️</span>
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">High-precision rhythm keeper</p>
        </div>

        {/* Visual Beat Indicator Dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {Array.from({ length: beatsPerBar }).map((_, idx) => {
            const isActive = isPlaying && currentBeat === idx;
            const isDownbeat = idx === 0;

            return (
              <div
                key={idx}
                className={`transition-all duration-75 rounded-full flex items-center justify-center ${
                  isDownbeat ? 'w-5 h-5' : 'w-4 h-4'
                } ${
                  isActive
                    ? isDownbeat
                      ? 'bg-amber-400 scale-125 shadow-[0_0_15px_rgba(251,191,36,0.9)]'
                      : 'bg-emerald-400 scale-110 shadow-[0_0_10px_rgba(52,211,153,0.8)]'
                    : 'bg-neutral-800 border border-neutral-700'
                }`}
              />
            );
          })}
        </div>

        {/* Large BPM Display & Stepper */}
        <div className="flex items-center justify-center gap-4 my-4">
          <button
            onClick={() => onBpmChange(Math.max(40, bpm - 1))}
            className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center text-lg font-bold"
          >
            <Minus className="w-4 h-4" />
          </button>

          <div className="text-center">
            <div className="text-4xl font-black font-mono text-white tracking-tight">{bpm}</div>
            <div className="text-[10px] text-amber-400 font-mono tracking-widest uppercase font-bold">
              BPM
            </div>
          </div>

          <button
            onClick={() => onBpmChange(Math.min(240, bpm + 1))}
            className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center text-lg font-bold"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* BPM Range Slider */}
        <div className="px-2 mb-6">
          <input
            type="range"
            min="40"
            max="240"
            value={bpm}
            onChange={(e) => onBpmChange(parseInt(e.target.value, 10))}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-neutral-500 font-mono mt-1">
            <span>40 (Largo)</span>
            <span>120 (Moderato)</span>
            <span>240 (Presto)</span>
          </div>
        </div>

        {/* Time Signature Tabs & Tap Tempo */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Time signature */}
          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-400 font-mono uppercase mb-1">Time Sig</span>
            <div className="grid grid-cols-2 gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
              {['4/4', '3/4', '2/4', '6/8'].map((sig) => (
                <button
                  key={sig}
                  onClick={() => onTimeSignatureChange(sig)}
                  className={`py-1 text-xs font-bold rounded-lg transition-colors ${
                    timeSignature === sig
                      ? 'bg-amber-500 text-black'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {sig}
                </button>
              ))}
            </div>
          </div>

          {/* Tap Tempo Button */}
          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-400 font-mono uppercase mb-1">Tap Tempo</span>
            <button
              onClick={handleTapTempo}
              className="flex-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-xs font-bold text-neutral-200 border border-neutral-700 flex flex-col items-center justify-center py-2 transition-all shadow-inner"
            >
              <span>TAP BEAT</span>
              <span className="text-[9px] text-neutral-400 font-mono">Tap repeatedly</span>
            </button>
          </div>
        </div>

        {/* Volume & Vibration settings */}
        <div className="flex items-center justify-between py-2 border-t border-neutral-800/80 mb-6 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-neutral-500" />
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-20 accent-amber-500"
            />
          </div>

          <button
            onClick={onToggleVibrate}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
              vibrateEnabled
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-neutral-800 text-neutral-500 border-neutral-700'
            }`}
          >
            Vibrate: {vibrateEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Big Start / Stop Button */}
        <button
          onClick={onTogglePlay}
          className={`w-full py-3 rounded-2xl font-black text-sm tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 ${
            isPlaying
              ? 'bg-rose-600 hover:bg-rose-500 text-white'
              : 'bg-amber-500 hover:bg-amber-400 text-black'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>STOP METRONOME</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>START METRONOME</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
