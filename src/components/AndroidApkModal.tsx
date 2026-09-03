import React, { useState } from 'react';
import { 
  X, Download, Smartphone, ShieldCheck, Cpu, HardDrive, 
  ExternalLink, CheckCircle2, Copy, Sparkles, Layers, QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AndroidApkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstallPwa?: () => void;
  canInstallPwa?: boolean;
  onToast?: (message: string) => void;
}

export const AndroidApkModal: React.FC<AndroidApkModalProps> = ({
  isOpen,
  onClose,
  onInstallPwa,
  canInstallPwa,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<'install' | 'package' | 'twa'>('install');
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const handleCopyBuildCommands = () => {
    const text = `# Build Native Android APK with Capacitor or Bubblewrap (TWA)
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Real Drum" "com.realdrum.simulator.app" --web-dir dist
npm run build
npx cap add android
npx cap open android`;
    navigator.clipboard?.writeText(text);
    setCopiedCode(true);
    onToast?.('Android build commands copied to clipboard!');
    setTimeout(() => setCopiedCode(false), 3000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
        />

        {/* Dialog Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative w-full max-w-lg max-h-[90vh] bg-neutral-900 border border-neutral-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <span>Android App Hub</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                    v2.4.0 APK
                  </span>
                </h2>
                <p className="text-[11px] text-neutral-400">Install & run as a native Android app</p>
              </div>
            </div>

            <button
              id="close-android-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center px-4 pt-3 border-b border-neutral-800 bg-neutral-900 gap-2 text-xs font-bold">
            <button
              id="tab-install-guide"
              onClick={() => setActiveTab('install')}
              className={`pb-2.5 px-2 border-b-2 transition-all ${
                activeTab === 'install'
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              One-Tap Install
            </button>
            <button
              id="tab-package-specs"
              onClick={() => setActiveTab('package')}
              className={`pb-2.5 px-2 border-b-2 transition-all ${
                activeTab === 'package'
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Package Specs
            </button>
            <button
              id="tab-apk-build"
              onClick={() => setActiveTab('twa')}
              className={`pb-2.5 px-2 border-b-2 transition-all ${
                activeTab === 'twa'
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              APK Build Guide
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {activeTab === 'install' && (
              <div className="space-y-4">
                {/* Install Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-neutral-900 to-neutral-950 border border-emerald-500/30">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-white mb-1">
                        Direct Android WebAPK Installation
                      </h3>
                      <p className="text-xs text-neutral-300 leading-relaxed mb-3">
                        Install Digital Real Drum directly onto your Android device home screen and app launcher with full-screen immersive mode, zero browser navigation bars, and offline audio caching.
                      </p>

                      <button
                        id="modal-install-pwa-btn"
                        onClick={() => {
                          if (onInstallPwa) {
                            onInstallPwa();
                          } else {
                            onToast?.('On Android Chrome, tap the 3 dots ⋮ and choose "Install App" or "Add to Home screen"');
                          }
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 active:scale-98"
                      >
                        <Download className="w-4 h-4" />
                        <span>{canInstallPwa ? 'Install Real Drum on Android' : 'Install App (WebAPK)'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Step-by-step for Android Devices */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">
                    How to install on any Android phone:
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-neutral-800 text-amber-400 flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                        1
                      </span>
                      <div>
                        <p className="text-white font-semibold">Open in Android Chrome or Brave</p>
                        <p className="text-neutral-400 text-[11px] mt-0.5">
                          Load this URL directly on your Android phone or tablet.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-neutral-800 text-amber-400 flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                        2
                      </span>
                      <div>
                        <p className="text-white font-semibold">Tap &quot;Install App&quot; or Browser Menu ⋮</p>
                        <p className="text-neutral-400 text-[11px] mt-0.5">
                          Chrome will automatically generate an Android WebAPK with an app icon on your home screen.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-neutral-800 text-amber-400 flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                        3
                      </span>
                      <div>
                        <p className="text-white font-semibold">Launch with Zero Latency & Haptics</p>
                        <p className="text-neutral-400 text-[11px] mt-0.5">
                          Opens in standalone mode without browser toolbars, with hardware vibration haptics on drum hits.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'package' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 uppercase font-mono block">Package Name</span>
                    <span className="font-mono font-bold text-emerald-400 text-xs truncate block mt-0.5">
                      com.realdrum.simulator.app
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 uppercase font-mono block">Version</span>
                    <span className="font-mono font-bold text-white text-xs block mt-0.5">
                      2.4.0 (Build 20260903)
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 uppercase font-mono block">Target Android OS</span>
                    <span className="font-mono font-bold text-white text-xs block mt-0.5">
                      Android 15 (API Level 35)
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 uppercase font-mono block">Min SDK</span>
                    <span className="font-mono font-bold text-white text-xs block mt-0.5">
                      Android 8.0 (API Level 26)
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2">
                  <span className="text-[10px] text-neutral-500 uppercase font-mono block">Required Android Permissions</span>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-[10px] font-mono text-neutral-300">
                      android.permission.VIBRATE
                    </span>
                    <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-[10px] font-mono text-neutral-300">
                      android.permission.RECORD_AUDIO
                    </span>
                    <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-[10px] font-mono text-neutral-300">
                      android.permission.MODIFY_AUDIO_SETTINGS
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-1">
                  <span className="text-[10px] text-neutral-500 uppercase font-mono block">Audio Architecture</span>
                  <p className="text-neutral-300 text-[11px] leading-relaxed">
                    Custom WebAudio synthesizer pipeline with dynamic envelope filtering, noise generators, sub-harmonic kick synthesizers, and low-latency audio buffer scheduling.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'twa' && (
              <div className="space-y-3">
                <p className="text-xs text-neutral-300 leading-relaxed">
                  To produce a signed <strong>.APK</strong> or <strong>.AAB</strong> file for distribution on the Google Play Store, you can package this project using Capacitor or Bubblewrap TWA:
                </p>

                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-[11px] text-emerald-400 overflow-x-auto relative">
                  <button
                    onClick={handleCopyBuildCommands}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors flex items-center gap-1 text-[10px]"
                    title="Copy commands"
                  >
                    {copiedCode ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                  <pre className="pr-16 text-neutral-300 leading-5">
{`# 1. Install Capacitor CLI
npm install -D @capacitor/cli @capacitor/android

# 2. Initialize project
npx cap init "Real Drum" "com.realdrum.simulator.app"

# 3. Add Android platform & build
npm run build
npx cap add android
npx cap open android`}
                  </pre>
                </div>

                <p className="text-[11px] text-neutral-400">
                  Opening in Android Studio allows you to click <em>Build → Generate Signed Bundle / APK</em> to export the ready-to-run mobile app file.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3.5 border-t border-neutral-800 bg-neutral-950/90 flex items-center justify-between">
            <span className="text-[11px] text-neutral-500 font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Verified Android PWA Standard
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
