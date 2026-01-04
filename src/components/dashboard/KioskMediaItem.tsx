import React, { useEffect, useRef, useMemo } from 'react';

interface KioskMediaItemProps {
    url: string;
    isPlaying: boolean;
    volume?: number;
    title?: string;
    isVisible?: boolean; // New prop to control loading
}

declare global {
    interface Window {
        onYouTubeIframeAPIReady: () => void;
        YT: any;
    }
}

export const KioskMediaItem: React.FC<KioskMediaItemProps> = ({
    url,
    isPlaying,
    volume = 50,
    title = 'Media Item',
    isVisible = true
}) => {
    const playerRef = useRef<any>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerId = useMemo(() => `yt-kiosk-player-${Math.random().toString(36).substr(2, 9)}`, []);

    const mediaType = useMemo(() => {
        if (!url) return 'none';
        
        const youtubeMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
        const playlistMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
        
        if (youtubeMatch || playlistMatch) {
            return 'youtube';
        }
        
        if (url.match(/\.(mp4|webm|ogg)$/i)) {
            return 'video';
        }
        
        return 'iframe';
    }, [url]);

    const videoData = useMemo(() => {
        if (mediaType !== 'youtube') return null;
        const videoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
        const playlistMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
        return {
            videoId: videoMatch ? videoMatch[1] : null,
            listId: playlistMatch ? playlistMatch[1] : null
        };
    }, [url, mediaType]);

    // YouTube Init
    useEffect(() => {
        if (mediaType !== 'youtube' || !videoData) return;

        if (!window.YT && !document.querySelector('script[src*="youtube.com/iframe_api"]')) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            tag.async = true;
            document.head.appendChild(tag);
        }

        const initPlayer = () => {
            if (playerRef.current) return;

            const playerVars: any = {
                autoplay: isPlaying ? 1 : 0,
                controls: 0,
                disablekb: 1,
                fs: 0,
                rel: 0,
                mute: 0,
                enablejsapi: 1,
                origin: window.location.origin,
                loop: 1
            };

            if (videoData.listId) {
                playerVars.listType = 'playlist';
                playerVars.list = videoData.listId;
            } else if (videoData.videoId) {
                playerVars.playlist = videoData.videoId;
            }

            playerRef.current = new window.YT.Player(containerId, {
                height: '100%',
                width: '100%',
                videoId: videoData.listId ? undefined : videoData.videoId,
                playerVars,
                events: {
                    onReady: (event: any) => {
                        event.target.setVolume(isPlaying ? volume : 0);
                        if (isPlaying) event.target.playVideo();
                    },
                    onStateChange: (event: any) => {
                        if (event.data === window.YT.PlayerState.ENDED) {
                            event.target.playVideo();
                        }
                    }
                }
            });
        };

        if (window.YT && window.YT.Player) {
            initPlayer();
        } else {
            const prevReady = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                if (prevReady) prevReady();
                initPlayer();
            };
        }

        return () => {
            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
            }
        };
    }, [mediaType, videoData, containerId]);

    // YouTube Fading
    useEffect(() => {
        if (mediaType !== 'youtube' || !playerRef.current || !playerRef.current.setVolume) return;
        
        let fadeInterval: any;
        const targetVolume = isPlaying ? volume : 0;
        
        if (isPlaying) {
            playerRef.current.playVideo();
        }

        const fade = () => {
            const player = playerRef.current;
            if (!player || !player.getVolume || !player.setVolume) return;

            const nowVol = player.getVolume();
            const step = 5;
            
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

        // If stopping (switching out), pause immediately to stop sound
        // while the volume fades out (volume fade will still happen but video is paused)
        if (!isPlaying) {
            playerRef.current.pauseVideo();
        }

        fadeInterval = setInterval(fade, 100);
        return () => clearInterval(fadeInterval);
    }, [isPlaying, volume, mediaType]);

    // Direct Video Fading
    useEffect(() => {
        if (mediaType !== 'video' || !videoRef.current) return;
        
        const video = videoRef.current;
        let fadeInterval: any;
        const targetVolume = isPlaying ? (volume / 100) : 0;
        
        if (isPlaying) {
            video.play().catch(() => {});
        }

        const fade = () => {
            const step = 0.05;
            const nowVol = video.volume;
            
            if (Math.abs(nowVol - targetVolume) <= step) {
                video.volume = targetVolume;
                clearInterval(fadeInterval);
                if (targetVolume === 0) {
                    video.pause();
                }
            } else {
                video.volume = nowVol < targetVolume ? Math.min(nowVol + step, 1) : Math.max(nowVol - step, 0);
            }
        };

        // Aggressive pause if not active
        if (!isPlaying) {
            video.pause();
        }

        fadeInterval = setInterval(fade, 100);
        return () => clearInterval(fadeInterval);
    }, [isPlaying, volume, mediaType]);

    if (mediaType === 'youtube') {
        return (
            <div className="w-full h-full bg-black">
                <div id={containerId} className="w-full h-full pointer-events-none"></div>
            </div>
        );
    }

    if (mediaType === 'video') {
        return (
            <video
                ref={videoRef}
                src={url}
                className="w-full h-full object-cover"
                loop
                muted={false}
                playsInline
            />
        );
    }

    // For generic iframes, we ONLY load the src if the item is visible.
    // This prevents background audio. PRELOADING is sacrificed for external sites
    // to guarantee silence.
    return (
        <iframe
            src={isVisible ? url : 'about:blank'}
            className="w-full h-full border-none"
            title={title}
            sandbox="allow-scripts allow-same-origin allow-forms"
        />
    );
};
