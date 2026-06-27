// Custom Modern Media Player Component
// Features: Custom controls, streaming progress, quality selection, keyboard shortcuts

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaExpand, 
  FaCompress, FaCog, FaDownload, FaWifi, FaTimes,
  FaStepForward, FaStepBackward, FaSync
} from 'react-icons/fa';
import './TorrentPlayer.css';

const TorrentPlayer = ({ 
  streamUrl, 
  title, 
  torrentData,
  onClose, 
  onError 
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressRef = useRef(null);
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isBuffering, setIsBuffering] = useState(true);
  const [error, setError] = useState(null);
  
  // Download progress
  const [downloadProgress, setDownloadProgress] = useState(torrentData?.progress || 0);
  const [peers, setPeers] = useState(torrentData?.seeds || 0);
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  
  // Controls auto-hide timer
  const controlsTimer = useRef(null);

  // Format time helper
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Format file size
  const formatSize = (bytes) => {
    if (!bytes) return '0 MB';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  // Format download speed
  const formatSpeed = (bytesPerSec) => {
    if (!bytesPerSec) return '0 KB/s';
    const mb = bytesPerSec / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB/s`;
    const kb = bytesPerSec / 1024;
    return `${kb.toFixed(0)} KB/s`;
  };

  // Handle play/pause
  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [isPlaying]);

  // Handle volume
  const handleVolume = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume || 1;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  // Handle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Handle seeking
  const handleSeek = (e) => {
    if (!progressRef.current || !videoRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Handle playback rate
  const handlePlaybackRate = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSettings(false);
  };

  // Skip forward/backward
  const skip = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'm':
          toggleMute();
          break;
        case 'ArrowLeft':
          skip(-10);
          break;
        case 'ArrowRight':
          skip(10);
          break;
        case 'ArrowUp':
          setVolume(v => Math.min(1, v + 0.1));
          break;
        case 'ArrowDown':
          setVolume(v => Math.max(0, v - 0.1));
          break;
        case 'Escape':
          if (showSettings) {
            setShowSettings(false);
          } else {
            onClose();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleFullscreen, toggleMute, onClose, showSettings, currentTime, duration, volume]);

  // Auto-hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(controlsTimer.current);
      controlsTimer.current = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
      clearTimeout(controlsTimer.current);
    };
  }, [isPlaying]);

  // Video event handlers
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsBuffering(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleProgress = () => {
    if (videoRef.current && videoRef.current.buffered.length > 0) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      setBuffered((bufferedEnd / duration) * 100);
    }
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleWaiting = () => setIsBuffering(true);
  const handleCanPlay = () => setIsBuffering(false);
  const handleError = () => {
    setError('Failed to load video. Please try another source.');
    onError && onError('Video load failed');
  };

  // Update download progress from torrent
  useEffect(() => {
    if (torrentData?.onProgress) {
      const interval = setInterval(() => {
        const status = torrentData.onProgress();
        if (status) {
          setDownloadProgress(status.progress * 100);
          setPeers(status.seeds);
          setDownloadSpeed(status.downloadSpeed);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [torrentData]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (torrentData?.destroy) {
        torrentData.destroy();
      }
    };
  }, [torrentData]);

  if (error) {
    return (
      <div className="torrent-player-error">
        <div className="error-content">
          <FaWifi size={48} />
          <h3>Playback Error</h3>
          <p>{error}</p>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="torrent-player"
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={streamUrl}
        className="torrent-video"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onProgress={handleProgress}
        onPlay={handlePlay}
        onPause={handlePause}
        onWaiting={handleWaiting}
        onCanPlay={handleCanPlay}
        onError={handleError}
        onClick={togglePlay}
        playsInline
      />

      {/* Buffering Indicator */}
      <AnimatePresence>
        {isBuffering && (
          <motion.div 
            className="buffering-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="buffering-spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
            </div>
            <span>Buffering...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play/Pause Overlay */}
      <div className="play-overlay" onClick={togglePlay}>
        <AnimatePresence>
          {!isPlaying && !isBuffering && (
            <motion.div 
              className="play-button-large"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
            >
              <FaPlay />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            className="player-controls"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Top Bar */}
            <div className="controls-top">
              <button className="control-btn close-btn" onClick={onClose}>
                <FaTimes />
              </button>
              <div className="video-title-bar">
                <h3>{title}</h3>
              </div>
              <div className="torrent-stats">
                <span className="peers-count">
                  <FaWifi /> {peers} peers
                </span>
                <span className="download-speed">
                  {formatSpeed(downloadSpeed)}
                </span>
              </div>
            </div>

            {/* Center Controls */}
            <div className="controls-center">
              <button className="control-btn skip-btn" onClick={() => skip(-10)}>
                <FaStepBackward />
                <span className="skip-label">10</span>
              </button>
              <button className="control-btn play-pause-btn" onClick={togglePlay}>
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>
              <button className="control-btn skip-btn" onClick={() => skip(10)}>
                <FaStepForward />
                <span className="skip-label">10</span>
              </button>
            </div>

            {/* Bottom Bar */}
            <div className="controls-bottom">
              {/* Progress Bar */}
              <div 
                className="progress-container" 
                ref={progressRef}
                onClick={handleSeek}
              >
                {/* Buffering progress */}
                <div 
                  className="progress-buffered"
                  style={{ width: `${buffered}%` }}
                />
                {/* Download progress (torrent) */}
                <div 
                  className="progress-download"
                  style={{ width: `${downloadProgress}%` }}
                />
                {/* Playback progress */}
                <div 
                  className="progress-played"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
                <div 
                  className="progress-handle"
                  style={{ left: `${(currentTime / duration) * 100}%` }}
                />
              </div>

              {/* Time & Controls */}
              <div className="controls-row">
                <div className="time-display">
                  <span>{formatTime(currentTime)}</span>
                  <span className="time-separator">/</span>
                  <span>{formatTime(duration)}</span>
                </div>

                <div className="controls-buttons">
                  {/* Volume */}
                  <div className="volume-control">
                    <button className="control-btn" onClick={toggleMute}>
                      {isMuted || volume === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolume}
                      className="volume-slider"
                    />
                  </div>

                  {/* Settings */}
                  <div className="settings-control">
                    <button 
                      className="control-btn" 
                      onClick={() => setShowSettings(!showSettings)}
                    >
                      <FaCog />
                    </button>
                    
                    <AnimatePresence>
                      {showSettings && (
                        <motion.div 
                          className="settings-menu"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                        >
                          <div className="settings-section">
                            <h4>Playback Speed</h4>
                            <div className="speed-options">
                              {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                                <button
                                  key={rate}
                                  className={`speed-option ${playbackRate === rate ? 'active' : ''}`}
                                  onClick={() => handlePlaybackRate(rate)}
                                >
                                  {rate}x
                                </button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Fullscreen */}
                  <button className="control-btn" onClick={toggleFullscreen}>
                    {isFullscreen ? <FaCompress /> : <FaExpand />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TorrentPlayer;
