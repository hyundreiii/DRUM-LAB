import React, { useState, useEffect, useRef } from 'react';
import { DrumRecording } from '../types';
import { loadRecordings, renameRecording, deleteRecording } from '../services/storage';
import { audioEngine } from '../services/audioEngine';
import { Play, Pause, Trash2, Edit2, Download, Disc, Clock, Calendar, Check, X, Menu } from 'lucide-react';

interface RecordingsViewProps {
  onToast?: (message: string) => void;
  onGoToDrums: () => void;
  onOpenBurgerMenu?: () => void;
}

export const RecordingsView: React.FC<RecordingsViewProps> = ({ onToast, onGoToDrums, onOpenBurgerMenu }) => {
  const [recordings, setRecordings] = useState<DrumRecording[]>([]);
  const [activePlaybackId, setActivePlaybackId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0); // 0 to 100
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

  const playbackTimeoutRef = useRef<number[]>([]);
  const progressIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    setRecordings(loadRecordings());
  }, []);

  const stopCurrentPlayback = () => {
    playbackTimeoutRef.current.forEach((t) => clearTimeout(t));
    playbackTimeoutRef.current = [];
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setActivePlaybackId(null);
    setPlaybackProgress(0);
  };

  // Playback recorded drum hits through audioEngine
  const handlePlayRecording = (rec: DrumRecording) => {
    if (activePlaybackId === rec.id) {
      stopCurrentPlayback();
      return;
    }

    stopCurrentPlayback();
    audioEngine.init();
    audioEngine.setKit(rec.kitId);
    setActivePlaybackId(rec.id);
    setPlaybackProgress(0);

    const startTime = performance.now();
    const duration = rec.durationMs || 1000;

    // Schedule each drum hit
    rec.hits.forEach((hit) => {
      const timeoutId = window.setTimeout(() => {
        audioEngine.playDrum(hit.padId, hit.velocity);
      }, hit.timeMs);
      playbackTimeoutRef.current.push(timeoutId);
    });

    // Progress bar tracker
    progressIntervalRef.current = window.setInterval(() => {
      const elapsed = performance.now() - startTime;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setPlaybackProgress(pct);

      if (elapsed >= duration) {
        stopCurrentPlayback();
      }
    }, 50);
  };

  const handleDelete = (id: string, title: string) => {
    if (activePlaybackId === id) stopCurrentPlayback();
    const updated = deleteRecording(id);
    setRecordings(updated);
    onToast?.(`Deleted recording "${title}"`);
  };

  const handleStartRename = (rec: DrumRecording) => {
    setRenamingId(rec.id);
    setRenameText(rec.title);
  };

  const handleSaveRename = (id: string) => {
    if (renameText.trim()) {
      const updated = renameRecording(id, renameText.trim());
      setRecordings(updated);
      onToast?.('Recording renamed.');
    }
    setRenamingId(null);
  };

  // Export recording as a JSON or trigger audio export
  const handleExportRecording = (rec: DrumRecording) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(rec, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${rec.title.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onToast?.('Recording exported as file!');
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-neutral-950 select-none">
      {/* Top Header Bar */}
      <header className="px-4 py-2.5 bg-neutral-950/90 border-b border-neutral-800/80 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          {onOpenBurgerMenu && (
            <button
              id="recordings-burger-menu-btn"
              onClick={onOpenBurgerMenu}
              className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-400 hover:text-white border border-neutral-700/80 shadow-md transition-all active:scale-95"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xl">🎙️</span>
            <div>
              <h1 className="text-sm font-black text-white leading-tight">MY RECORDINGS</h1>
              <p className="text-[10px] text-neutral-400 font-mono">{recordings.length} Tracks Captured</p>
            </div>
          </div>
        </div>

        <button
          id="recordings-back-to-drums-btn"
          onClick={onGoToDrums}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition-all active:scale-95"
        >
          <Disc className="w-4 h-4" />
          <span>Play Drum Kit</span>
        </button>
      </header>

      <div className="w-full max-w-4xl mx-auto px-4 py-6 flex-1 overflow-y-auto">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-white">Groove Library</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Listen back, manage, and export your captured drum beats.
            </p>
          </div>
        </div>

      {/* RECORDINGS LIST */}
      {recordings.length === 0 ? (
        <div className="p-12 rounded-3xl bg-neutral-900/60 border border-neutral-800 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-neutral-800/80 flex items-center justify-center text-2xl mb-4">
            🥁
          </div>
          <h3 className="text-base font-bold text-white">No recordings yet</h3>
          <p className="text-xs text-neutral-400 max-w-sm mt-1 mb-6 leading-relaxed">
            Head over to the drum kit and tap the Record button to save your first beat session!
          </p>
          <button
            onClick={onGoToDrums}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
          >
            Play Drums Now
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {recordings.map((rec) => {
            const isPlaying = activePlaybackId === rec.id;
            const durationSec = Math.round(rec.durationMs / 1000);
            const dateStr = new Date(rec.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={rec.id}
                className={`p-4 rounded-2xl bg-neutral-900 border transition-all ${
                  isPlaying ? 'border-amber-500/80 shadow-[0_0_20px_rgba(251,191,36,0.2)]' : 'border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Play / Stop Button */}
                  <button
                    onClick={() => handlePlayRecording(rec)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
                      isPlaying
                        ? 'bg-amber-500 text-black shadow-lg animate-pulse'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                    }`}
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                  </button>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    {renamingId === rec.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={renameText}
                          onChange={(e) => setRenameText(e.target.value)}
                          className="px-2 py-1 rounded bg-neutral-950 border border-neutral-700 text-sm font-bold text-white focus:outline-none focus:border-amber-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveRename(rec.id)}
                          className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setRenamingId(null)}
                          className="p-1 rounded bg-neutral-800 text-neutral-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white truncate">{rec.title}</h3>
                        <button
                          onClick={() => handleStartRename(rec)}
                          className="p-1 text-neutral-500 hover:text-neutral-300"
                          title="Rename"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-neutral-400 font-mono mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-neutral-500" />
                        {dateStr}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        {Math.floor(durationSec / 60)}:{String(durationSec % 60).padStart(2, '0')}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-neutral-800 text-[10px] text-amber-400 font-bold uppercase">
                        {rec.kitId} Kit
                      </span>
                      <span>{rec.hitCount} beats</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleExportRecording(rec)}
                      className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                      title="Download Recording File"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(rec.id, rec.title)}
                      className="p-2 rounded-xl text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                      title="Delete Recording"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Playback progress bar */}
                {isPlaying && (
                  <div className="mt-3 pt-2 border-t border-neutral-800">
                    <div className="w-full h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 transition-all duration-75"
                        style={{ width: `${playbackProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
};
