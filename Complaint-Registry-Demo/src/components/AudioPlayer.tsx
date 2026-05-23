// ── Fix 2: Audio Player ────────────────────────────────────────────────────────
// The audio player does NOT own its own playing state.
// State is LIFTED to RegistryPage so polling re-renders never unmount it.
// This component is purely presentational — it receives callbacks from the parent.

interface AudioPlayerProps {
  recordingId: string;
  isPlaying: boolean;
  onPlay: (recordingId: string) => void;
  onPause: () => void;
}

export function AudioPlayer({ recordingId, isPlaying, onPlay, onPause }: AudioPlayerProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't open the detail panel
    if (isPlaying) {
      onPause();
    } else {
      onPlay(recordingId);
    }
  };

  return (
    <button
      onClick={handleClick}
      title={isPlaying ? 'Pause recording' : 'Play recording'}
      className={`
        w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0
        ${isPlaying
          ? 'bg-accent-orange/20 border border-accent-orange/40 hover:bg-accent-orange/30'
          : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
        }
      `}
    >
      {isPlaying ? (
        // Waveform bars animation while playing
        <div className="flex items-center gap-[2px] h-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="waveform-bar w-[3px] rounded-full bg-accent-orange"
              style={{
                height: `${[10, 14, 10, 12][i]}px`,
                animationDelay: `${[0, 0.15, 0.3, 0.15][i]}s`,
              }}
            />
          ))}
        </div>
      ) : (
        // Play triangle icon (pure CSS, no lucide import needed)
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="text-gray-400 ml-0.5">
          <path d="M2 1.5l9 4.5-9 4.5V1.5z" />
        </svg>
      )}
    </button>
  );
}
