
import React, { useEffect, useRef, useMemo } from 'react';

interface BackgroundMusicProps {
  url?: string | null;
  mode?: 'loop' | 'once';
  volume?: number;
  isPlaying: boolean;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

export const BackgroundMusic: React.FC<BackgroundMusicProps> = ({ 
  url, 
  mode = 'loop', 
  volume = 50, 
  isPlaying 
}) => {
  const playerRef = useRef<any>(null);
  const containerId = "yt-bg-player";

  const videoData = useMemo(() => {
    if (!url) return null;
    const videoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const playlistMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    return {
        videoId: videoMatch ? videoMatch[1] : null,
        listId: playlistMatch ? playlistMatch[1] : null
    };
  }, [url]);

  useEffect(() => {
    if (!videoData) return;

    // Load YouTube API
    // Load YouTube IFrame API if not already loaded (with caching)
    if (!window.YT && !document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }

    const initPlayer = () => {
        if (playerRef.current) {
            playerRef.current.destroy();
        }

        const isLoop = mode === 'loop';
        const playerVars: any = {
            autoplay: isPlaying ? 1 : 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            mute: 0,
            enablejsapi: 1,
            origin: window.location.origin
        };

        if (videoData.listId) {
            playerVars.listType = 'playlist';
            playerVars.list = videoData.listId;
            if (isLoop) playerVars.loop = 1;
        } else if (videoData.videoId) {
            if (isLoop) {
                playerVars.loop = 1;
                playerVars.playlist = videoData.videoId;
            }
        }

        playerRef.current = new window.YT.Player(containerId, {
            height: '0',
            width: '0',
            videoId: videoData.listId ? undefined : videoData.videoId,
            playerVars,
            events: {
                onReady: (event: any) => {
                    event.target.setVolume(volume);
                    if (isPlaying) event.target.playVideo();
                },
                onStateChange: (event: any) => {
                    // Force loop if ended and in loop mode
                    if (event.data === window.YT.PlayerState.ENDED && mode === 'loop') {
                        event.target.playVideo();
                    }
                }
            }
        });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
        if (playerRef.current) {
            playerRef.current.destroy();
        }
    };
  }, [videoData, mode]); // Only re-init when data/mode changes

  useEffect(() => {
    if (!playerRef.current || !playerRef.current.setVolume) return;
    
    let fadeInterval: any;
    const targetVolume = isPlaying ? volume : 0;
    let currentVolume = isPlaying ? 0 : volume; // Start from 0 if playing, or current if stopping

    // If starting, play immediately, we'll fade the volume
    if (isPlaying) {
        playerRef.current.playVideo();
    }

    const fade = () => {
        const step = 5; // Volume step
        const player = playerRef.current;
        if (!player || !player.getVolume || !player.setVolume) return;

        const nowVol = player.getVolume();
        if (Math.abs(nowVol - targetVolume) <= step) {
            player.setVolume(targetVolume);
            clearInterval(fadeInterval);
            if (targetVolume === 0) {
                player.pauseVideo();
            }
        } else {
            const nextVol = nowVol < targetVolume ? nowVol + step : nowVol - step;
            player.setVolume(nextVol);
        }
    };

    fadeInterval = setInterval(fade, 100); // Fade over ~1-2 seconds

    return () => clearInterval(fadeInterval);
  }, [isPlaying, volume]);

  if (!videoData) return null;

  return (
    <div className="fixed -left-[1000px] -top-[1000px] pointer-events-none opacity-0">
        <div id={containerId}></div>
    </div>
  );
};
