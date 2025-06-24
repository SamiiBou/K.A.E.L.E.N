'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GameIntroProps {
  onComplete: () => void;
}

export default function GameIntro({ onComplete }: GameIntroProps) {
  const [step, setStep] = useState<'loading' | 'video' | 'kaelen'>('loading');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [nextVideoReady, setNextVideoReady] = useState(false);
  const [minKaelenTimeElapsed, setMinKaelenTimeElapsed] = useState(false);
  const [showSkipButton, setShowSkipButton] = useState(false);
  const MIN_SPLASH_DURATION = 4; // seconds
  const preloadedVideoRef = useRef<HTMLVideoElement | null>(null);

  const videoUrl = "https://res.cloudinary.com/dqqyjfhic/video/upload/v1718032959/My_Movie_jsg83r.mp4";

  // URL of the video that will be displayed in the WelcomePage background.
  const nextVideoUrl = "https://res.cloudinary.com/dqqyjfhic/video/upload/last_one_h1v1b9.mp4";

  /**
   * Pre-loads the next video (used in the WelcomePage) so that
   * when we transition, the file is already cached and plays smoothly.
   */
  const preloadNextVideo = (): Promise<void> | void => {
    if (typeof window === 'undefined') return;

    // Avoid creating multiple preloaders if the function runs twice
    if (preloadedVideoRef.current) return;

    try {
      const vid = document.createElement('video');
      vid.id = 'next-video-preloader';
      vid.src = nextVideoUrl;
      vid.preload = 'auto';
      vid.muted = true; // required by some browsers to buffer
      vid.crossOrigin = 'anonymous';
      // Hidden element – we only need the network request
      vid.style.display = 'none';

      // Return a promise that resolves when the video can play through
      const p = new Promise<void>((resolve) => {
        const cleanup = () => {
          vid.removeEventListener('canplaythrough', cleanup);
          preloadedVideoRef.current = vid; // Keep reference so data stays in memory
          console.log('🎞️ [GameIntro] Next video fully buffered and retained');
          resolve();
        };
        vid.addEventListener('canplaythrough', cleanup);
      });

      document.body.appendChild(vid);
      // Explicitly start the request
      vid.load();

      console.log('🎞️ [GameIntro] Started pre-loading next video');

      return p;
    } catch (err) {
      console.warn('[GameIntro] Failed to preload next video:', err);
    }
  };

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisited');

    if (hasVisited) {
      // L'utilisateur a déjà vu l'intro : passer directement à la suite
      onComplete();
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (video.duration > 0 && video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const progress = Math.floor((bufferedEnd / video.duration) * 100);
        setLoadingProgress(Math.min(100, progress));
      }
    };

    const onCanPlayThrough = () => {
      setLoadingProgress(100);
      setTimeout(() => {
        setStep('video');
        videoRef.current?.play();
        // Show skip button after 3 seconds of video playback
        setTimeout(() => setShowSkipButton(true), 3000);
      }, 1000); // Give user a moment to see 100% then auto-start video
    };

    // If video is cached and ready, go straight to video
    if (video.readyState >= 4) { // HAVE_ENOUGH_DATA
      onCanPlayThrough();
      return;
    }
    
    video.addEventListener('progress', updateProgress);
    video.addEventListener('loadedmetadata', updateProgress);
    video.addEventListener('canplaythrough', onCanPlayThrough);

    // Explicitly call load() to trigger buffering
    video.load();

    return () => {
      video.removeEventListener('progress', updateProgress);
      video.removeEventListener('loadedmetadata', updateProgress);
      video.removeEventListener('canplaythrough', onCanPlayThrough);
    };
  }, [onComplete]);


  const handleVideoEnd = () => {
    // First visit path: play video fully, then show splash
    setStep('kaelen');
    setShowSkipButton(false);
    localStorage.setItem('hasVisited', 'true');

    // Ensure the next video is being preloaded as soon as we reach the splash
    const preloadPromise = preloadNextVideo();
    if (preloadPromise instanceof Promise) {
      preloadPromise.then(() => setNextVideoReady(true));
    } else {
      setNextVideoReady(true);
    }

    // We'll trigger navigation when both conditions (min time & preload) are met
  };

  const handleSkipVideo = () => {
    setShowSkipButton(false);
    handleVideoEnd();
  };

  // Track the minimal display duration of the K.A.E.L.E.N. splash (4 s)
  useEffect(() => {
    if (step === 'kaelen') {
      const timer = setTimeout(() => {
        setMinKaelenTimeElapsed(true);
      }, MIN_SPLASH_DURATION * 1000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Once both the splash has been visible enough time AND the next video is ready, continue.
  useEffect(() => {
    if (step === 'kaelen' && minKaelenTimeElapsed && nextVideoReady) {
      onComplete();
      
      // Optional: we can now safely remove the preloaded video to free memory
      if (preloadedVideoRef.current) {
        preloadedVideoRef.current.remove();
        preloadedVideoRef.current = null;
      }
    }
  }, [step, minKaelenTimeElapsed, nextVideoReady, onComplete]);

  return (
    <>
      <video
        ref={videoRef}
        src={videoUrl}
        onEnded={handleVideoEnd}
        preload="auto"
        playsInline
        muted={false}
        className="fixed top-0 left-0 w-full h-full object-cover z-40"
        style={{ opacity: step === 'video' ? 1 : 0, transition: 'opacity 1s ease-in-out' }}
      />
      
      {/* Skip Button */}
      <AnimatePresence>
        {showSkipButton && step === 'video' && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={handleSkipVideo}
            className="fixed top-6 right-6 z-50 px-4 py-2 bg-black/40 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-mono tracking-wide rounded-sm hover:bg-black/60 hover:border-white/30 hover:text-white transition-all duration-300 group"
          >
            <span className="flex items-center gap-2">
              SKIP
              <svg 
                className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-0.5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-colors duration-1000 ${step === 'video' ? 'bg-transparent' : 'bg-black'}`}
      >
        <AnimatePresence mode="wait">
          {step === 'loading' && (
            <motion.div
              key="loading"
              exit={{ opacity: 0 }}
              className="text-center text-white relative"
            >
              {/* Scanlines effect */}
              <div className="absolute inset-0 terminal-scan opacity-30"></div>
              
              {/* Main loading content */}
              <div className="relative z-10">
                {/* Enhanced loading spinner */}
                <div className="relative mb-8">
                  <div className="w-20 h-20 border-2 border-gray-600/30 rounded-full absolute"></div>
                  <div className="w-20 h-20 border-2 border-transparent border-t-blue-400 border-r-purple-400 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-20 h-20 border border-white/20 rounded-full animate-pulse"></div>
                  
                  {/* Inner progress ring */}
                  <div className="absolute inset-2 w-16 h-16 border border-white/10 rounded-full">
                    <div 
                      className="absolute inset-0 border-2 border-transparent border-t-green-400 rounded-full transition-transform duration-300"
                      style={{ 
                        transform: `rotate(${(loadingProgress * 3.6)}deg)`,
                        opacity: loadingProgress > 0 ? 1 : 0
                      }}
                    ></div>
                  </div>
                </div>
                
                {/* Loading text with progress */}
                <div className="space-y-3">
                  <p className="text-white text-xl font-mono tracking-wider terminal-text">
                    <span className="animate-pulse-subtle">BUFFERING SEQUENCE</span>
                    <span className="terminal-cursor ml-1"></span>
                  </p>
                  
                  {/* Progress bar */}
                  <div className="w-64 h-1 bg-white/10 rounded-full mx-auto overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${loadingProgress}%` }}
                    ></div>
                  </div>
                  
                  {/* Progress percentage */}
                  <p className="text-white/70 text-sm font-mono">
                    {loadingProgress}% COMPLETE
                  </p>
                  
                  {/* Sound enablement message */}
                  <motion.div 
                    className="mt-6 px-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.8 }}
                  >
                    <p className="text-amber-400/90 text-xs font-mono tracking-wide">
                      <span className="inline-block w-2 h-2 bg-amber-400 rounded-full mr-2 animate-pulse"></span>
                      PLEASE ENABLE SOUND FOR OPTIMAL EXPERIENCE
                    </p>
                  </motion.div>
                  
                  {/* Loading dots */}
                  <div className="flex justify-center space-x-1 mt-4">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
                
                {/* Subtle glow effect */}
                <div className="absolute inset-0 -z-10 blur-3xl opacity-20">
                  <div className="w-32 h-32 bg-blue-500 rounded-full mx-auto animate-pulse"></div>
                </div>
              </div>
            </motion.div>
          )}


          {step === 'kaelen' && (
            <motion.div
              key="kaelen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="text-center"
            >
              <motion.h1
                className="text-4xl md:text-6xl lg:text-7xl font-thin text-white tracking-[0.2em] md:tracking-[0.3em] lg:tracking-[0.4em] px-4"
                initial={{ letterSpacing: '0.1em', opacity: 0 }}
                animate={{ letterSpacing: '0.2em md:0.3em lg:0.4em', opacity: 1 }}
                transition={{ duration: 3, ease: 'easeOut' }}
              >
                K.A.E.L.E.N
              </motion.h1>
              <motion.p
                className="text-sm md:text-base lg:text-lg font-light text-white/80 tracking-widest mt-4 px-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 2, delay: 1.5, ease: 'easeOut' }}
              >
                SEASON ONE
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}