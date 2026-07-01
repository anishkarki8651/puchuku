import { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import './CustomPlayer.css';

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const Icons = {
  Play: () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
  ),
  Pause: () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
  ),
  VolumeFull: () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
  ),
  VolumeLow: () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" /></svg>
  ),
  Mute: () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
  ),
  Fullscreen: () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg>
  ),
  ExitFullscreen: () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" /></svg>
  ),
  Rewind: () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" /></svg>
  ),
  Forward: () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" /></svg>
  ),
  PiP: () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 11h-8v6h8v-6zm4 10V3H1v18h22zm-2-1.98H3V4.97h18v14.05z" /></svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.14,12.94c0.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4,2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41L9.25,5.35C8.66,5.59 8.12,5.92 7.63,6.29L5.24,5.33c-.22-.08-.47 0-.59.22L2.74,8.87c-.12.21-.08.47.12.61l2.03,1.58C4.84,11.36 4.8,11.69 4.8,12s.02.64.07.94l-2.03,1.58c-.18.14-.23.41-.12.61l1.92,3.32c.12.22.37.29.59.22l2.39-.96c.5.38,1.03.7,1.62.94l.36,2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24,1.13-.56,1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61L19.14,12.94zM12,15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6 3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" /></svg>
  ),
  Keyboard: () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z" /></svg>
  ),
  Subtitles: () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 12h4v2H4v-2zm10 6H4v-2h10v2zm6 0h-4v-2h4v2zm0-4H10v-2h10v2z" /></svg>
  ),
  Back: () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>
  ),
  Loop: () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" /></svg>
  ),
  Boost: () => (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z" /></svg>
  ),
};

// ─── Helper ───────────────────────────────────────────────────────────────────
const fmt = (s) => {
  if (!s || isNaN(s)) return '0:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`;
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ messages }) {
  return (
    <div className="cp-toast-stack" aria-live="polite" role="status">
      {messages.map((msg) => (
        <div key={msg.id} className="cp-toast">{msg.text}</div>
      ))}
    </div>
  );
}

// ─── CustomPlayer ─────────────────────────────────────────────────────────────
function CustomPlayer({
  src,
  title = '',
  poster = '',
  chapters = [],
  subtitles = [],
  onEnded,
  onTimeUpdate,
  onPause,
  onPlay,
  onError,
  onBack,
  onReady,
  autoPlay = false,
  loop = false,
  startTime = 0,
}) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const playerRef = useRef(null);
  const progressRef = useRef(null);
  const hideTimeout = useRef(null);
  const toastIdRef = useRef(0);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverX, setHoverX] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsPanel, setSettingsPanel] = useState('main');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(loop);
  const [pipActive, setPipActive] = useState(false);
  const [qualities, setQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const [activeSubtitle, setActiveSubtitle] = useState('off');
  const [toasts, setToasts] = useState([]);
  const [subtitlesReady, setSubtitlesReady] = useState(false);
  const onReadyFiredRef = useRef(false);
  const [volOpen, setVolOpen] = useState(false);
  const lastTapRef = useRef({ time: 0, zone: null });
  const tapTimeoutRef = useRef(null);
  const controlsShownRef = useRef(true);

  // Volume boost (Web Audio API gain stage, up to 2x, limited to avoid clipping)
  const audioCtxRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const gainNodeRef = useRef(null);
  const compressorNodeRef = useRef(null);
  const [boostEnabled, setBoostEnabled] = useState(false);
  const [boostLevel, setBoostLevel] = useState(1.5); // 1.0 (100%) – 2.0 (200%)
  const [boostSupported, setBoostSupported] = useState(true);

  // Touch gestures: swipe-to-seek, swipe for volume/brightness, hold for 2x speed.
  // Mirrors the conventions of YouTube/Netflix mobile apps.
  const touchGestureRef = useRef({ active: false, mode: null });
  const longPressTimerRef = useRef(null);
  const prevRateRef = useRef(1);
  const [gestureHud, setGestureHud] = useState(null); // { type: 'seek'|'volume'|'brightness', ... } | null
  const [brightness, setBrightness] = useState(1); // CSS filter multiplier, 0.5–1.5
  const [speedBoostActive, setSpeedBoostActive] = useState(false);

  const toast = useCallback((text) => {
    const id = ++toastIdRef.current;
    setToasts((p) => [...p, { id, text }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 1600);
  }, []);

  const showControlsNow = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => {
      setControlsVisible(false);
    }, 3000);
  }, []);

   // HLS init
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    setLoading(true);
    setError(null);
    setCurrentQuality(-1); // always start each new source in Auto

    const cleanup = () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };

    const isHls = src.includes('.m3u8') || src.includes('m3u8');

    if (isHls && Hls.isSupported()) {
      cleanup();
      const hls = new Hls({
        enableWorker: true,
        backBufferLength: 30,        // lower buffer pressure on small VPS
        maxBufferLength: 30,
        startLevel: -1,
        // HLS.js has no real bandwidth data on startup, so with startLevel: -1
        // it falls back to a conservative internal guess (~500kbps by default)
        // and picks the lowest rendition until it measures a few real segments.
        // Assume a reasonable broadband connection instead so "Auto" starts
        // near the top and steps down only if actual throughput is worse.
        abrEwmaDefaultEstimate: 5000000, // ~5 Mbps initial assumption
        fragLoadingMaxRetry: 4,
        fragLoadingRetryDelay: 1000,
        fragLoadingMaxRetryTimeout: 8000,
        manifestLoadingMaxRetry: 3,
        levelLoadingMaxRetry: 3,
      });
      hlsRef.current = hls;

      let netRetries = 0;

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const levels = data.levels.map((l, i) => ({
          id: i, label: l.height ? `${l.height}p` : `Level ${i}`, bitrate: l.bitrate,
        }));
        setQualities([{ id: -1, label: 'Auto' }, ...levels]);

        // Auto mode should still open on ~720p rather than whatever the ABR
        // cold-start guess lands on. Pick the highest rung that's <= 720p
        // (or the lowest rung available if every rendition is above 720p),
        // force just the first fragment to that level, then immediately hand
        // control back to the adaptive engine so playback keeps auto-adjusting
        // from there. The Settings UI still shows "Auto" throughout — this
        // never becomes a manual pin.
        let startIdx = -1;
        let bestHeight = -1;
        data.levels.forEach((l, i) => {
          if (l.height && l.height <= 720 && l.height > bestHeight) {
            bestHeight = l.height;
            startIdx = i;
          }
        });
        if (startIdx === -1) {
          // Every rung is above 720p — fall back to the lowest available
          startIdx = data.levels.reduce(
            (lowest, l, i, arr) => (l.height < arr[lowest].height ? i : lowest), 0
          );
        }
        hls.currentLevel = startIdx; // forces this pick for the next fragment only
        hls.once(Hls.Events.LEVEL_SWITCHED, () => {
          hls.loadLevel = -1; // release the pin, ABR takes over from here
        });

        setTimeout(() => {
          if (startTime > 0 && videoRef.current) videoRef.current.currentTime = startTime;
        }, 100);
        if (autoPlay) video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) return;
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            if (netRetries++ < 3) {
              setTimeout(() => hls.startLoad(), 1000 * netRetries); // backoff, no storm
            } else {
              setError('Stream failed to load (network / SSL).');
              onError?.(data);
              cleanup();
            }
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError();
            break;
          default:
            setError('Stream failed to load.');
            onError?.(data);
            cleanup();
        }
      });
    } else if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      setLoading(false);
      if (startTime > 0) video.currentTime = startTime;
      if (autoPlay) video.play().catch(() => {});
    } else if (!isHls) {
      // Direct mp4 video file
      video.src = src;
      setLoading(false);
      if (startTime > 0) video.currentTime = startTime;
      if (autoPlay) video.play().catch(() => {});
    } else {
      setError('HLS is not supported in this browser.');
    }

    return cleanup;
  }, [src]);

  // Add this block to watch for asynchronous startTime updates
  useEffect(() => {
    if (startTime > 0 && videoRef.current) {
      videoRef.current.currentTime = startTime;
    }
  }, [startTime]);

  useEffect(() => {
    // If the startTime changes (from Watch.jsx fetching the data), 
    // and it's different from the video's current position, seek the video.
    if (videoRef.current && startTime > 0) {
      const diff = Math.abs(videoRef.current.currentTime - startTime);
      // Only seek if the difference is more than 2 seconds to avoid loops
      if (diff > 2) {
        videoRef.current.currentTime = startTime;
      }
    }
  }, [startTime]);

  // Video events
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const handlers = {
      play: () => { setPlaying(true); onPlay?.(); },
      pause: () => {
        setPlaying(false);
        setControlsVisible(true);
        clearTimeout(hideTimeout.current);
        onPause?.();
      },
      timeupdate: () => { setCurrentTime(v.currentTime); onTimeUpdate?.({ currentTime: v.currentTime, duration: v.duration }); },
      durationchange: () => setDuration(v.duration || 0),
      progress: () => { if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1)); },
      ended: () => { setPlaying(false); onEnded?.(); },
      waiting: () => setBuffering(true),
      canplay: () => { setBuffering(false); setLoading(false); setSubtitlesReady(true); },
      ratechange: () => setPlaybackRate(v.playbackRate),
      enterpictureinpicture: () => setPipActive(true),
      leavepictureinpicture: () => setPipActive(false),
      volumechange: () => { setVolume(v.volume); setMuted(v.muted); },
    };

    Object.entries(handlers).forEach(([e, fn]) => v.addEventListener(e, fn));
    return () => Object.entries(handlers).forEach(([e, fn]) => v.removeEventListener(e, fn));
  }, [onEnded, onTimeUpdate, onPause, onPlay]);

  useEffect(() => {
    const fn = () => {
      const isFs = !!document.fullscreenElement;
      setFullscreen(isFs);
      // If user exits fullscreen via browser gesture (swipe, back button), unlock orientation
      if (!isFs) {
        try { screen.orientation.unlock(); } catch (_) { }
      }
    };
    document.addEventListener('fullscreenchange', fn);
    return () => document.removeEventListener('fullscreenchange', fn);
  }, []);

  useEffect(() => { if (videoRef.current) videoRef.current.loop = isLooping; }, [isLooping]);

  useEffect(() => () => clearTimeout(tapTimeoutRef.current), []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    Array.from(v.textTracks).forEach((t) => { t.mode = t.label === activeSubtitle ? 'showing' : 'hidden'; });
  }, [activeSubtitle]);

  const [subtitlesEnabledOnce, setSubtitlesEnabledOnce] = useState(false);

  // Default to English subtitles if available (Once per source)
  useEffect(() => {
    if (!subtitlesEnabledOnce && subtitles && subtitles.length > 0) {
      const en = subtitles.find(s =>
        s.label?.toLowerCase().includes('english') ||
        s.lang === 'en' ||
        s.lang?.startsWith('en')
      );
      if (en) {
        setActiveSubtitle(en.label);
      }
      setSubtitlesEnabledOnce(true);
      setSubtitlesReady(true);
    } else if (!subtitlesEnabledOnce && subtitles && subtitles.length === 0) {
      // No subtitles at all — mark ready immediately so onReady isn't blocked
      setSubtitlesEnabledOnce(true);
      setSubtitlesReady(true);
    }
  }, [subtitles, subtitlesEnabledOnce]);

  useEffect(() => {
    setActiveSubtitle('off');
    setSubtitlesReady(false);
    setSubtitlesEnabledOnce(false);
    onReadyFiredRef.current = false;
  }, [src]);

  // Fire onReady once video can play AND subtitles have been set
  useEffect(() => {
    if (!loading && subtitlesReady && !onReadyFiredRef.current) {
      onReadyFiredRef.current = true;
      onReady?.();
    }
  }, [loading, subtitlesReady, onReady]);

  // Keyboard
  useEffect(() => {
    const fn = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      const v = videoRef.current;
      if (!v) return;
      switch (e.code) {
        case 'Space': case 'KeyK': e.preventDefault(); togglePlay(); break;
        case 'ArrowRight': e.preventDefault(); skip(e.shiftKey ? 30 : 10); break;
        case 'ArrowLeft': e.preventDefault(); skip(e.shiftKey ? -30 : -10); break;
        case 'ArrowUp': e.preventDefault(); changeVolume(Math.min(1, v.volume + 0.1)); break;
        case 'ArrowDown': e.preventDefault(); changeVolume(Math.max(0, v.volume - 0.1)); break;
        case 'KeyM': toggleMute(); break;
        case 'KeyF': toggleFullscreen(); break;
        case 'KeyP': togglePiP(); break;
        case 'KeyL': setIsLooping((p) => { toast(p ? 'Loop off' : 'Loop on'); return !p; }); break;
        case 'Comma': { const r = Math.max(0.25, v.playbackRate - 0.25); v.playbackRate = r; toast(`${r}×`); break; }
        case 'Period': { const r = Math.min(3, v.playbackRate + 0.25); v.playbackRate = r; toast(`${r}×`); break; }
        case 'Home': v.currentTime = 0; break;
        case 'End': v.currentTime = v.duration; break;
        default:
          if (e.key >= '0' && e.key <= '9') v.currentTime = (parseInt(e.key) / 10) * v.duration;
          if (e.key === '?' || (e.code === 'Slash' && e.shiftKey)) { e.preventDefault(); setShowShortcuts(p => !p); }
      }
      showControlsNow();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (v) v.muted = !v.muted;
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await playerRef.current?.requestFullscreen();
      // Lock to landscape after entering fullscreen
      // Works on Android browsers & installed PWAs; silently ignored on iOS
      try {
        await screen.orientation.lock('landscape');
      } catch (_) { }
    } else {
      try {
        screen.orientation.unlock();
      } catch (_) { }
      document.exitFullscreen();
    }
  }, []);

  const togglePiP = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await v.requestPictureInPicture();
    } catch { }
  }, []);

  const skip = useCallback((sec) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.currentTime + sec, v.duration));
    toast(`${sec > 0 ? '+' : ''}${sec}s`);
  }, [toast]);

  // Touch devices only — used to decide tap-to-reveal vs tap-to-play,
  // and whether the volume icon should open a slider instead of toggling mute.
  const isCoarsePointer = useCallback(() => {
    return typeof window !== 'undefined' &&
      window.matchMedia?.('(hover: none) and (pointer: coarse)').matches;
  }, []);

  // Single tap on the video: reveals controls if hidden, otherwise toggles play.
  // Double tap on the left/right third: skips ±10s. Double tap in the middle: fullscreen.
  // This mirrors the tap conventions of YouTube/Netflix mobile players and stops a
  // "just checking the controls" tap from accidentally pausing playback.
  const handleVideoTap = useCallback((e) => {
    const touch = e.changedTouches?.[0];
    const container = playerRef.current;
    if (!touch || !container) return;
    e.preventDefault(); // stop the browser from also firing a synthetic click

    const rect = container.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const zone = x < rect.width * 0.33 ? 'left' : x > rect.width * 0.67 ? 'right' : 'middle';
    const now = Date.now();
    const isDoubleTap = now - lastTapRef.current.time < 300 && lastTapRef.current.zone === zone;
    lastTapRef.current = { time: now, zone };

    if (isDoubleTap) {
      clearTimeout(tapTimeoutRef.current);
      if (zone === 'left') skip(-10);
      else if (zone === 'right') skip(10);
      else toggleFullscreen();
      return;
    }

    clearTimeout(tapTimeoutRef.current);
    tapTimeoutRef.current = setTimeout(() => {
      if (!controlsShownRef.current) showControlsNow();
      else togglePlay();
    }, 260);
  }, [skip, toggleFullscreen, togglePlay, showControlsNow]);

  const handleVolButtonClick = useCallback((e) => {
    e.stopPropagation();
    if (isCoarsePointer()) {
      if (volOpen) { toggleMute(); } else { setVolOpen(true); showControlsNow(); }
    } else {
      toggleMute();
    }
  }, [isCoarsePointer, volOpen, toggleMute, showControlsNow]);

  const changeVolume = useCallback((val) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    v.muted = val === 0;
  }, []);

  // ── Swipe / hold gestures on the video surface ─────────────────────────
  // Horizontal drag  -> scrub-seek with a live time preview (committed on release)
  // Vertical drag    -> right half = volume, left half = brightness
  // Press and hold   -> temporary 2x speed boost (like YouTube/TikTok)
  const SWIPE_DEADZONE = 12;
  const LONG_PRESS_MS = 450;

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleVideoTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    const rect = playerRef.current?.getBoundingClientRect();
    if (!touch || !rect) return;

    touchGestureRef.current = {
      active: true,
      mode: null,
      startX: touch.clientX,
      startY: touch.clientY,
      seekStartTime: videoRef.current?.currentTime ?? 0,
      startVolume: volume,
      startBrightness: brightness,
      zone: touch.clientX - rect.left < rect.width / 2 ? 'left' : 'right',
      rectWidth: rect.width,
      rectHeight: rect.height,
    };

    clearLongPress();
    longPressTimerRef.current = setTimeout(() => {
      const g = touchGestureRef.current;
      if (!g.active || g.mode) return; // already turned into a swipe, not a hold
      g.mode = 'speed';
      const v = videoRef.current;
      if (v) {
        prevRateRef.current = v.playbackRate;
        v.playbackRate = 2;
      }
      setSpeedBoostActive(true);
    }, LONG_PRESS_MS);
  }, [volume, brightness, clearLongPress]);

  const handleVideoTouchMove = useCallback((e) => {
    const g = touchGestureRef.current;
    if (!g.active) return;
    const touch = e.touches[0];
    if (!touch) return;
    const dx = touch.clientX - g.startX;
    const dy = touch.clientY - g.startY;

    if (!g.mode) {
      if (Math.abs(dx) < SWIPE_DEADZONE && Math.abs(dy) < SWIPE_DEADZONE) return;
      clearLongPress(); // real movement means this isn't a hold
      g.mode = Math.abs(dx) > Math.abs(dy) ? 'seek' : 'vertical';
    }
    if (g.mode === 'speed') return;

    if (g.mode === 'seek') {
      if (!duration) return;
      const t = Math.max(0, Math.min(duration, g.seekStartTime + (dx / g.rectWidth) * duration));
      g.previewTime = t;
      setGestureHud({ type: 'seek', time: t, delta: t - g.seekStartTime });
    } else {
      const delta = -dy / g.rectHeight; // dragging up increases the value
      if (g.zone === 'right') {
        const v = Math.max(0, Math.min(1, g.startVolume + delta));
        changeVolume(v);
        setGestureHud({ type: 'volume', value: v });
      } else {
        const b = Math.max(0.5, Math.min(1.5, g.startBrightness + delta));
        setBrightness(b);
        setGestureHud({ type: 'brightness', value: b - 0.5 });
      }
    }
  }, [duration, changeVolume, clearLongPress]);

  const handleVideoTouchEnd = useCallback((e) => {
    const g = touchGestureRef.current;
    clearLongPress();
    if (!g.active) return;
    g.active = false;

    if (g.mode === 'speed') {
      const v = videoRef.current;
      if (v) v.playbackRate = prevRateRef.current || 1;
      setSpeedBoostActive(false);
      return;
    }
    if (g.mode === 'seek') {
      if (videoRef.current && g.previewTime != null) videoRef.current.currentTime = g.previewTime;
      setGestureHud(null);
      showControlsNow();
      return;
    }
    if (g.mode === 'vertical') {
      setGestureHud(null);
      return;
    }
    // No swipe or hold occurred — this was a plain tap, fall back to tap handling.
    handleVideoTap(e);
  }, [handleVideoTap, showControlsNow, clearLongPress]);

  useEffect(() => () => clearLongPress(), [clearLongPress]);

  // ── Volume Boost (Web Audio API) ──────────────────────────────────────────
  // Native <video>.volume caps at 1.0. To push louder than "normal" without
  // clipping/distorting the audio, we route the element through a WebAudio
  // GainNode (for the extra gain) followed by a DynamicsCompressorNode
  // (which gently limits peaks) before hitting the speakers.
  const initAudioGraph = useCallback(() => {
    if (audioCtxRef.current) return audioCtxRef.current;
    const v = videoRef.current;
    if (!v) return null;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) throw new Error('Web Audio API unsupported');
      const ctx = new Ctx();
      const source = ctx.createMediaElementSource(v);
      const gain = ctx.createGain();
      gain.gain.value = boostEnabled ? boostLevel : 1;

      // Soft limiter so boosted audio doesn't clip/"break" at louder levels
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -6;
      compressor.knee.value = 12;
      compressor.ratio.value = 8;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;

      source.connect(gain);
      gain.connect(compressor);
      compressor.connect(ctx.destination);

      audioCtxRef.current = ctx;
      sourceNodeRef.current = source;
      gainNodeRef.current = gain;
      compressorNodeRef.current = compressor;
    } catch (e) {
      console.warn('Volume boost unavailable:', e);
      setBoostSupported(false);
      return null;
    }
    return audioCtxRef.current;
  }, [boostEnabled, boostLevel]);

  // Keep the gain node in sync with the boost toggle/level
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(
        boostEnabled ? boostLevel : 1,
        audioCtxRef.current?.currentTime ?? 0,
        0.05
      );
    }
  }, [boostEnabled, boostLevel]);

  // Browsers suspend AudioContext until a user gesture — resume on play
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const resume = () => { audioCtxRef.current?.resume().catch(() => {}); };
    v.addEventListener('play', resume);
    return () => v.removeEventListener('play', resume);
  }, []);

  // Tear down the audio graph when the component unmounts
  useEffect(() => () => {
    try { audioCtxRef.current?.close(); } catch (_) { }
    audioCtxRef.current = null;
  }, []);

  const toggleBoost = useCallback(() => {
    setBoostEnabled((prev) => {
      const next = !prev;
      if (next) {
        const ctx = initAudioGraph();
        ctx?.resume().catch(() => {});
      }
      toast(next ? `Volume boost ${Math.round(boostLevel * 100)}%` : 'Volume boost off');
      return next;
    });
  }, [initAudioGraph, boostLevel, toast]);

  const changeBoostLevel = useCallback((val) => {
    setBoostLevel(val);
    if (!boostEnabled) return; // level only takes effect while boost is on
  }, [boostEnabled]);

  const setSpeed = useCallback((rate) => {
    const v = videoRef.current;
    if (v) v.playbackRate = rate;
    toast(`${rate === 1 ? 'Normal' : rate + '×'}`);
    setSettingsPanel('main');
  }, [toast]);

  const applyQuality = useCallback((id) => {
    if (hlsRef.current) hlsRef.current.currentLevel = id;
    setCurrentQuality(id);
    toast(id === -1 ? 'Auto quality' : qualities.find(q => q.id === id)?.label ?? '');
    setSettingsPanel('main');
  }, [qualities, toast]);

  // Progress bar — normalise mouse + touch into a single {clientX} shape
  const clientXFrom = (e) =>
    e.touches ? e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX : e.clientX;

  const seekTo = useCallback((e) => {
    const v = videoRef.current;
    const el = progressRef.current;
    if (!v || !el || !v.duration) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientXFrom(e) - rect.left) / rect.width));
    v.currentTime = pct * v.duration;
  }, []);

  const onProgressMouseMove = useCallback((e) => {
    const el = progressRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = clientXFrom(e);
    const pct = Math.max(0, Math.min(1, (cx - rect.left) / rect.width));
    setHoverTime(pct * duration);
    setHoverX(cx - rect.left);
    if (isDragging) seekTo(e);
  }, [isDragging, duration, seekTo]);

  useEffect(() => {
    if (!isDragging) return;
    const up = () => setIsDragging(false);
    const move = (e) => { seekTo(e); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, [isDragging, seekTo]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;
  const currentChapter = chapters.reduce((acc, ch) => (currentTime >= ch.start ? ch : acc), null);
  const VolumeIcon = muted || volume === 0 ? Icons.Mute : volume < 0.5 ? Icons.VolumeLow : Icons.VolumeFull;

  const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
  const controlsShown = controlsVisible || !playing;
  controlsShownRef.current = controlsShown;

  return (
    <div
      ref={playerRef}
      className={[
        'cp',
        fullscreen ? 'cp--fs' : '',
        !playing ? 'cp--paused' : '',
        !controlsShown ? 'cp--hide-cursor' : '',
      ].filter(Boolean).join(' ')}
      onMouseMove={showControlsNow}
      onMouseLeave={() => { if (playing) { clearTimeout(hideTimeout.current); setControlsVisible(false); } }}
      onClick={() => { if (showSettings) setShowSettings(false); if (volOpen) setVolOpen(false); }}
    >
      {/* VIDEO */}
      <video
        ref={videoRef}
        className="cp__video"
        poster={poster}
        onClick={(e) => { e.stopPropagation(); togglePlay(); }}
        onDoubleClick={toggleFullscreen}
        onTouchStart={handleVideoTouchStart}
        onTouchMove={handleVideoTouchMove}
        onTouchEnd={handleVideoTouchEnd}
        style={brightness !== 1 ? { filter: `brightness(${brightness})` } : undefined}
        playsInline
        crossOrigin="anonymous"
        aria-label={title || 'Video player'}
      >
        {subtitles.map((s) => (
          <track key={s.label} kind="subtitles" src={s.src} srcLang={s.lang} label={s.label} />
        ))}
      </video>

      {/* CENTER PLAY BUTTON (Ultra Premium) */}
      {!playing && !loading && !error && (
        <div
          className="cp__center-play"
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          role="button"
          tabIndex={0}
          aria-label="Play"
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePlay(); } }}
        >
          <Icons.Play />
        </div>
      )}

      {/* SPINNER */}
      {(loading || buffering) && !error && (
        <div className="cp__spinner-wrap">
          <div className="cp__spinner" />
        </div>
      )}

      {/* GESTURE HUD — swipe seek / volume / brightness */}
      {gestureHud && (
        <div className={`cp__gesture-hud cp__gesture-hud--${gestureHud.type}`}>
          {gestureHud.type === 'seek' && (
            <>
              <span className="cp__gesture-hud-time">{fmt(gestureHud.time)}</span>
              <span className="cp__gesture-hud-delta">
                {gestureHud.delta >= 0 ? '+' : '−'}{fmt(Math.abs(gestureHud.delta))}
              </span>
            </>
          )}
          {gestureHud.type === 'volume' && (
            <>
              {gestureHud.value === 0
                ? <Icons.Mute />
                : gestureHud.value < 0.5 ? <Icons.VolumeLow /> : <Icons.VolumeFull />}
              <div className="cp__gesture-hud-bar">
                <div className="cp__gesture-hud-bar-fill" style={{ height: `${gestureHud.value * 100}%` }} />
              </div>
              <span className="cp__gesture-hud-pct">{Math.round(gestureHud.value * 100)}%</span>
            </>
          )}
          {gestureHud.type === 'brightness' && (
            <>
              <span className="cp__gesture-hud-icon" aria-hidden="true">☀</span>
              <div className="cp__gesture-hud-bar">
                <div className="cp__gesture-hud-bar-fill" style={{ height: `${gestureHud.value * 100}%` }} />
              </div>
              <span className="cp__gesture-hud-pct">{Math.round(gestureHud.value * 100)}%</span>
            </>
          )}
        </div>
      )}

      {/* HOLD-TO-SPEED BADGE */}
      {speedBoostActive && (
        <div className="cp__speed-badge">
          <Icons.Boost />
          <span>2×</span>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="cp__error">
          <div className="cp__error-icon">⚠</div>
          <p className="cp__error-msg">{error}</p>
          <button className="cp__error-retry" onClick={() => { setError(null); setLoading(true); }}>
            Retry
          </button>
        </div>
      )}

      {/* TOP BAR */}
      <div className={`cp__top${controlsShown ? ' cp__top--visible' : ''}`}>
        {onBack && (
          <button className="cp__icon-btn" onClick={onBack} title="Back" aria-label="Back">
            <Icons.Back />
          </button>
        )}
        <div className="cp__title-area">
          {title && <span className="cp__title">{title}</span>}
          {currentChapter && <span className="cp__chapter-label">· {currentChapter.title}</span>}
        </div>
        <button
          className="cp__icon-btn cp__btn-shortcuts"
          onClick={(e) => { e.stopPropagation(); setShowShortcuts(p => !p); }}
          title="Keyboard shortcuts (?)"
          aria-label="Keyboard shortcuts"
        >
          <Icons.Keyboard />
        </button>
      </div>

      {/* BOTTOM */}
      <div className={`cp__bottom${controlsShown ? ' cp__bottom--visible' : ''}`}>

        {/* PROGRESS */}
        <div
          className={`cp__progress${isDragging ? ' cp__progress--dragging' : ''}`}
          ref={progressRef}
          onMouseDown={(e) => { setIsDragging(true); seekTo(e); }}
          onMouseMove={onProgressMouseMove}
          onMouseLeave={() => setHoverTime(null)}
          onTouchStart={(e) => { e.stopPropagation(); setIsDragging(true); seekTo(e); }}
          onTouchMove={(e) => { e.stopPropagation(); onProgressMouseMove(e); }}
          onTouchEnd={() => { setIsDragging(false); setHoverTime(null); }}
          onClick={(e) => e.stopPropagation()}
          role="slider"
          tabIndex={0}
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration) || 0}
          aria-valuenow={Math.round(currentTime)}
          aria-valuetext={`${fmt(currentTime)} of ${fmt(duration)}`}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') { e.preventDefault(); skip(5); }
            else if (e.key === 'ArrowLeft') { e.preventDefault(); skip(-5); }
          }}
        >
          {chapters.map((ch) => (
            <div
              key={ch.start}
              className="cp__chapter-tick"
              style={{ left: `${(ch.start / duration) * 100}%` }}
              title={ch.title}
            />
          ))}
          <div className="cp__progress-rail">
            <div className="cp__progress-buf" style={{ width: `${bufferedPct}%` }} />
            <div className="cp__progress-fill" style={{ width: `${progress}%` }} />
            <div className="cp__progress-thumb" style={{ left: `${progress}%` }} />
          </div>

          {hoverTime !== null && (
            <div className="cp__progress-tip" style={{ left: `${Math.max(28, Math.min(hoverX, (progressRef.current?.clientWidth ?? 200) - 28))}px` }}>
              {fmt(hoverTime)}
              {(() => {
                const ch = chapters.find((c, i) =>
                  hoverTime >= c.start && (!chapters[i + 1] || hoverTime < chapters[i + 1].start)
                );
                return ch ? <div className="cp__progress-tip-ch">{ch.title}</div> : null;
              })()}
            </div>
          )}
        </div>

        {/* CONTROLS ROW */}
        <div className="cp__bar" onClick={(e) => e.stopPropagation()}>
          <div className="cp__bar-left">
            <button className="cp__icon-btn cp__btn-play" onClick={togglePlay} title="Play/Pause (K)" aria-label={playing ? 'Pause' : 'Play'}>
              {playing ? <Icons.Pause /> : <Icons.Play />}
            </button>

            <button className="cp__icon-btn cp__btn-skip" onClick={() => skip(-10)} title="Rewind 10s (←)" aria-label="Rewind 10 seconds">
              <Icons.Rewind />
             
            </button>

            <button className="cp__icon-btn cp__btn-skip" onClick={() => skip(10)} title="Forward 10s (→)" aria-label="Forward 10 seconds">
              <Icons.Forward />
             
            </button>

            <div className={`cp__vol-wrap${volOpen ? ' cp__vol-wrap--open' : ''}`}>
              <button className="cp__icon-btn" onClick={handleVolButtonClick} title="Mute (M)" aria-label={muted ? 'Unmute' : 'Mute'}>
                <VolumeIcon />
                {boostEnabled && <span className="cp__boost-badge">{Math.round(boostLevel * 100)}%</span>}
              </button>
              <div className="cp__vol-slider-wrap">
                <input
                  type="range"
                  className="cp__vol-slider"
                  min="0" max="1" step="0.02"
                  value={muted ? 0 : volume}
                  onChange={(e) => changeVolume(parseFloat(e.target.value))}
                  aria-label="Volume"
                />
              </div>
            </div>

            <div className="cp__time">
              <span className="cp__time-cur">{fmt(currentTime)}</span>
              <span className="cp__time-sep"> / </span>
              <span className="cp__time-dur">{fmt(duration)}</span>
            </div>
          </div>

          <div className="cp__bar-right">
            {/* <button
              className={`cp__icon-btn${isLooping ? ' cp__icon-btn--on' : ''}`}
              onClick={() => { setIsLooping(p => !p); toast(isLooping ? 'Loop off' : 'Loop on'); }}
              title="Loop (L)"
            >
              <Icons.Loop />
            </button> */}

            {document.pictureInPictureEnabled && (
              <button
                className={`cp__icon-btn cp__btn-pip${pipActive ? ' cp__icon-btn--on' : ''}`}
                onClick={togglePiP}
                title="Picture in Picture (P)"
                aria-label="Picture in picture"
              >
                <Icons.PiP />
              </button>
            )}

            {subtitles.length > 0 && (
              <button
                className={`cp__icon-btn${activeSubtitle !== 'off' ? ' cp__icon-btn--on' : ''}`}
                onClick={(e) => { e.stopPropagation(); setShowSettings(p => !p); setSettingsPanel('subtitles'); }}
                title="Subtitles"
                aria-label="Subtitles"
              >
                <Icons.Subtitles />
              </button>
            )}

            <button
              className={`cp__icon-btn${showSettings ? ' cp__icon-btn--on' : ''}`}
              onClick={(e) => { e.stopPropagation(); setShowSettings(p => !p); setSettingsPanel('main'); }}
              title="Settings"
              aria-label="Settings"
            >
              <Icons.Settings />
            </button>

            <button className="cp__icon-btn" onClick={toggleFullscreen} title="Fullscreen (F)" aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
              {fullscreen ? <Icons.ExitFullscreen /> : <Icons.Fullscreen />}
            </button>
          </div>
        </div>
      </div>

      {/* SETTINGS PANEL */}
      {showSettings && (
        <div className="cp__settings" onClick={(e) => e.stopPropagation()}>
          {settingsPanel === 'main' && (
            <>
              <div className="cp__settings-title">Settings</div>
              <button className="cp__settings-row" onClick={() => setSettingsPanel('speed')}>
                <span>Playback speed</span>
                <span className="cp__settings-val">
                  {playbackRate === 1 ? 'Normal' : `${playbackRate}×`}
                  <Icons.ChevronRight />
                </span>
              </button>
              {boostSupported && (
                <button className={`cp__settings-row${boostEnabled ? ' cp__settings-row--active' : ''}`} onClick={() => setSettingsPanel('boost')}>
                  <span>Volume boost</span>
                  <span className="cp__settings-val">
                    {boostEnabled ? `${Math.round(boostLevel * 100)}%` : 'Off'}
                    <Icons.ChevronRight />
                  </span>
                </button>
              )}
              {qualities.length > 0 && (
                <button className="cp__settings-row" onClick={() => setSettingsPanel('quality')}>
                  <span>Quality</span>
                  <span className="cp__settings-val">
                    {currentQuality === -1 ? 'Auto' : qualities.find(q => q.id === currentQuality)?.label}
                    <Icons.ChevronRight />
                  </span>
                </button>
              )}
              {subtitles.length > 0 && (
                <button className="cp__settings-row" onClick={() => setSettingsPanel('subtitles')}>
                  <span>Subtitles / CC</span>
                  <span className="cp__settings-val">
                    {activeSubtitle === 'off' ? 'Off' : activeSubtitle}
                    <Icons.ChevronRight />
                  </span>
                </button>
              )}
            </>
          )}

          {settingsPanel === 'speed' && (
            <>
              <button className="cp__settings-back" onClick={() => setSettingsPanel('main')}>
                <Icons.Back /> Playback speed
              </button>
              <div className="cp__settings-options">
                {speeds.map((s) => (
                  <button
                    key={s}
                    className={`cp__settings-row${playbackRate === s ? ' cp__settings-row--active' : ''}`}
                    onClick={() => setSpeed(s)}
                  >
                    <span>{s === 1 ? 'Normal' : `${s}×`}</span>
                    {playbackRate === s && <Icons.Check />}
                  </button>
                ))}
              </div>
            </>
          )}

          {settingsPanel === 'boost' && (
            <>
              <button className="cp__settings-back" onClick={() => setSettingsPanel('main')}>
                <Icons.Back /> Volume boost
              </button>
              <div className="cp__boost-panel">
                <div className="cp__boost-toggle-row">
                  <span>Boost audio</span>
                  <button
                    className={`cp__toggle${boostEnabled ? ' cp__toggle--on' : ''}`}
                    role="switch"
                    aria-checked={boostEnabled}
                    aria-label="Toggle volume boost"
                    onClick={toggleBoost}
                  >
                    <span className="cp__toggle-thumb" />
                  </button>
                </div>
                <div className={`cp__boost-slider-row${boostEnabled ? '' : ' cp__boost-slider-row--disabled'}`}>
                  <input
                    type="range"
                    className="cp__boost-slider"
                    min="1" max="2" step="0.05"
                    value={boostLevel}
                    disabled={!boostEnabled}
                    onChange={(e) => changeBoostLevel(parseFloat(e.target.value))}
                    style={{ '--boost': `${((boostLevel - 1) / 1) * 100}%` }}
                    aria-label="Boost amount"
                  />
                  <span className="cp__boost-value">{Math.round(boostLevel * 100)}%</span>
                </div>
                <p className="cp__boost-note">
                  Amplifies audio up to 2× using dynamic range limiting to help
                  prevent distortion at higher levels. Quality can still vary
                  depending on the source.
                </p>
              </div>
            </>
          )}

          {settingsPanel === 'quality' && (
            <>
              <button className="cp__settings-back" onClick={() => setSettingsPanel('main')}>
                <Icons.Back /> Quality
              </button>
              <div className="cp__settings-options">
                {qualities.map((q) => (
                  <button
                    key={q.id}
                    className={`cp__settings-row${currentQuality === q.id ? ' cp__settings-row--active' : ''}`}
                    onClick={() => applyQuality(q.id)}
                  >
                    <span>
                      {q.label}
                      {q.bitrate ? <span className="cp__settings-sub">{Math.round(q.bitrate / 1000)}k</span> : null}
                    </span>
                    {currentQuality === q.id && <Icons.Check />}
                  </button>
                ))}
              </div>
            </>
          )}

          {settingsPanel === 'subtitles' && (
            <>
              <button className="cp__settings-back" onClick={() => setSettingsPanel('main')}>
                <Icons.Back /> Subtitles / CC
              </button>
              <div className="cp__settings-options">
                {['off', ...subtitles.map(s => s.label)].map((s) => (
                  <button
                    key={s}
                    className={`cp__settings-row${activeSubtitle === s ? ' cp__settings-row--active' : ''}`}
                    onClick={() => { setActiveSubtitle(s); setSettingsPanel('main'); }}
                  >
                    <span>{s === 'off' ? 'Off' : s}</span>
                    {activeSubtitle === s && <Icons.Check />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* KEYBOARD SHORTCUTS */}
      {showShortcuts && (
        <div className="cp__shortcuts-overlay" onClick={() => setShowShortcuts(false)}>
          <div className="cp__shortcuts-panel" onClick={(e) => e.stopPropagation()}>
            <div className="cp__shortcuts-header">
              <span>Keyboard shortcuts</span>
              <button className="cp__shortcuts-close" onClick={() => setShowShortcuts(false)}>✕</button>
            </div>
            <div className="cp__shortcuts-list">
              {[
                ['K / Space', 'Play / Pause'],
                ['← / →', 'Seek ±10 seconds'],
                ['⇧← / ⇧→', 'Seek ±30 seconds'],
                ['↑ / ↓', 'Volume ±10%'],
                ['M', 'Toggle mute'],
                ['F', 'Toggle fullscreen'],
                ['P', 'Picture-in-picture'],
                ['L', 'Toggle loop'],
                [', / .', 'Speed ±0.25×'],
                ['0 – 9', 'Jump to 0%–90%'],
                ['Home / End', 'Jump to start / end'],
                ['?', 'Show shortcuts'],
              ].map(([k, d]) => (
                <div key={k} className="cp__shortcut-row">
                  <kbd className="cp__shortcut-key">{k}</kbd>
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      <Toast messages={toasts} />
    </div>
  );
}

export default CustomPlayer;