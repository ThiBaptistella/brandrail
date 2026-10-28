import React, { useRef, useState, useEffect } from "react";
import classNames from "classnames";
import "./VideoPlayer.css";
import { ReactComponent as PlayIcon } from "../../assets/iconset/play.svg";
import { ReactComponent as PauseIcon } from "../../assets/iconset/pause.svg";
import { ReactComponent as FullscreenIcon } from "../../assets/iconset/expand.svg";
import { ReactComponent as ForwardIcon } from "../../assets/iconset/forward.svg";
import { ReactComponent as BackwardIcon } from "../../assets/iconset/backward.svg";
import { ReactComponent as RestoreIcon } from "../../assets/iconset/restore.svg";
import { ReactComponent as VolumeIcon } from "../../assets/iconset/volume.svg";
import { ColorMode } from "../../types/global";

export interface VideoPlayerProps {
  /** The video source URL or local file path. */
  src: string;

  /** Optional additional class names for styling. */
  className?: string;

  /** Defines the color mode of the video player. */
  colorMode?: ColorMode;

  /** Applies theme variations to the video player. */
  theme?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  className,
  colorMode = ColorMode.LIGHT,
  theme = "themeA",
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLInputElement>(null);
  const volumeRef = useRef<HTMLInputElement>(null);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [currentTime, setCurrentTime] = useState("00:00");
  const [totalDuration, setTotalDuration] = useState("00:00");

  // Format time to MM:SS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Update time and progress
    const handleTimeUpdate = () => {
      setProgress((video.currentTime / video.duration) * 100);
      setCurrentTime(formatTime(video.currentTime));
    };

    // Set total video duration
    const handleLoadedMetadata = () => {
      setTotalDuration(formatTime(video.duration));
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video || video.duration === 0) return;
    const newTime = (parseFloat(e.target.value) / 100) * video.duration;
    video.currentTime = newTime;
    setProgress(parseFloat(e.target.value));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
  };

  const handleFullScreen = () => {
    if (!document.fullscreenElement) {
      if (videoRef.current?.requestFullscreen) {
        videoRef.current.requestFullscreen();
        setIsFullScreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  useEffect(() => {
    const onFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", onFullScreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullScreenChange);
  }, []);

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime += 2;
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime -= 2;
    }
  };

  return (
    <div
      className={classNames(
        "video-player-container",
        className,
        colorMode,
        theme
      )}
      data-theme={theme}
      data-color-mode={colorMode}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <video
        ref={videoRef}
        src={src}
        className="video-element"
        controls={false}
        role="video"
        data-testid="video-element"
      />

      {/* Video Controls */}
      <div className={`video-controls ${isHovered ? "show" : "hide"}`}>
        <div className="progress-bar-container">
          <input
            ref={progressRef}
            type="range"
            className="progress-bar"
            min="0"
            max="100"
            value={progress}
            onChange={handleProgressChange}
            data-testid="progress-bar"
          />
        </div>
        <div className="control-btn-container">
          <button className="control-btn volume">
            <VolumeIcon />
            <input
              ref={volumeRef}
              type="range"
              className="volume-bar"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              data-testid="volume-bar"
            />
          </button>
          <div className="control-btn-container-play">
            {/* Show current video time */}
            <span data-testid="current-time">{currentTime}</span>
            <div className="control-btn-container-play-icons">
              <button
                onClick={skipBackward}
                className="control-btn"
                data-testid="backward-button"
              >
                <BackwardIcon />
              </button>
              <button
                onClick={togglePlay}
                className="control-btn"
                data-testid="play-button"
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>
              <button
                onClick={skipForward}
                className="control-btn"
                data-testid="forward-button"
              >
                <ForwardIcon />
              </button>
            </div>
            {/* Show total video duration */}
            <span data-testid="total-time">{totalDuration}</span>
          </div>
          <button
            onClick={handleFullScreen}
            className="control-btn screen"
            data-testid="fullscreen-button"
          >
            {isFullScreen ? <RestoreIcon /> : <FullscreenIcon />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
