import React from 'react';
import { AppSettings, resetCustomLayout } from '../services/storage';
import { audioEngine } from '../services/audioEngine';
import { X, Volume2, Smartphone, Keyboard, RotateCcw, Shield } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onToast?: (message: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onToast,
}) => {
  if (!isOpen) return null;

  const handleMasterVolume = (val: number) => {
    const updated = { ...settings, masterVolume: val };
    onUpdateSettings(updated);
    audioEngine.setMasterVolume(val);
  };

  const handleDrumVolume = (val: number) => {
    const updated = { ...settings, drumVolume: val };
    onUpdateSettings(updated);
    audioEngine.setDrumVolume(val);
  };

  const handleMetronomeVolume = (val: number) => {
    const updated = { ...settings, metronomeVolume: val };
    onUpdateSettings(updated);
    audioEngine.setMetronomeVolume(val);
  };

  const handleResetLayout = () => {
    resetCustomLayout();
    onToast?.('Drum layout reset to default.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl relative select-none">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-black text-white mb-1">Audio & Kit Settings</h3>
        <p className="text-xs text-neutral-400 mb-6">Customize volumes, haptics, and interface guides.</p>

        <div className="space-y-4">
          {/* Master Volume */}
          <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-white">Master Output</span>
              <span className="font-mono text-amber-400">{Math.round(settings.masterVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={settings.masterVolume}
              onChange={(e) => handleMasterVolume(parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Drum Kit Volume */}
          <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-white">Drum Sounds Volume</span>
              <span className="font-mono text-amber-400">{Math.round(settings.drumVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={settings.drumVolume}
              onChange={(e) => handleDrumVolume(parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Metronome Volume */}
          <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-white">Metronome Click Volume</span>
              <span className="font-mono text-amber-400">{Math.round(settings.metronomeVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={settings.metronomeVolume}
              onChange={(e) => handleMetronomeVolume(parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-2">
            {/* Keyboard Guide Toggle */}
            <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Keyboard className="w-4 h-4 text-neutral-400" />
                <div>
                  <div className="text-xs font-semibold text-white">Keyboard Labels</div>
                  <div className="text-[11px] text-neutral-500">Display desktop shortcut tags on pads</div>
                </div>
              </div>
              <button
                onClick={() =>
                  onUpdateSettings({ ...settings, showKeyboardGuide: !settings.showKeyboardGuide })
                }
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  settings.showKeyboardGuide ? 'bg-amber-500' : 'bg-neutral-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-black transition-transform absolute top-1 ${
                    settings.showKeyboardGuide ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Vibration Toggle */}
            <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-neutral-400" />
                <div>
                  <div className="text-xs font-semibold text-white">Haptic Vibration</div>
                  <div className="text-[11px] text-neutral-500">Strike vibration feedback on mobile</div>
                </div>
              </div>
              <button
                onClick={() =>
                  onUpdateSettings({ ...settings, vibrationEnabled: !settings.vibrationEnabled })
                }
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  settings.vibrationEnabled ? 'bg-amber-500' : 'bg-neutral-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-black transition-transform absolute top-1 ${
                    settings.vibrationEnabled ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Reset Layout */}
          <div className="pt-2">
            <button
              onClick={handleResetLayout}
              className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Custom Drum Layout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
