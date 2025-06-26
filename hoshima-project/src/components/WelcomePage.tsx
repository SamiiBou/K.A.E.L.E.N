'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { authenticateWithWorldWallet } from '@/utils/worldWalletAuth';
import TerminalChat from '@/components/TerminalChat';
import { motion } from 'framer-motion';

interface WelcomePageProps {
  onComplete: () => void;
  onAuthSuccess: (user: any, token: string) => void;
  onAuthError: (error: string) => void;
}

export default function WelcomePage({ onComplete, onAuthSuccess, onAuthError }: WelcomePageProps) {
  const [videoEnded, setVideoEnded] = useState(false);
  const [displayedText, setDisplayedText] = useState<string[]>(['', '', '', '']);
  const [isTextComplete, setIsTextComplete] = useState(false);
  const [showSubmitPulse, setShowSubmitPulse] = useState(false);
  const [backgroundBlurred, setBackgroundBlurred] = useState(true);
  const [showInteractionBreak, setShowInteractionBreak] = useState(false);
  const [showTransmissionInterface, setShowTransmissionInterface] = useState(false);
  const [messageFragments, setMessageFragments] = useState(0);
  const [hideFirstThreeLines, setHideFirstThreeLines] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [oscillator, setOscillator] = useState<OscillatorNode | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showWalletCard, setShowWalletCard] = useState(false);
  const [isSubTerminalOpen, setIsSubTerminalOpen] = useState(false);
  const [isFirstTimeWelcome, setIsFirstTimeWelcome] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pianoOscRef = useRef<OscillatorNode | null>(null);
  const pianoCtxRef = useRef<AudioContext | null>(null);
  const SPLASH_DURATION_MS = 4000;

  const debugLog = (...args: any[]) => console.log('[WelcomePage]', ...args);

  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenWelcomeAnimation');
    debugLog('hasSeenWelcomeAnimation in localStorage:', hasSeen);
    setIsFirstTimeWelcome(!hasSeen);
  }, []);

  const startAmbientAudio = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.frequency.setValueAtTime(50, ctx.currentTime); // Low-freq hum
      osc.type = 'sine';
      // Very low volume to avoid any perceptible vibration
      gainNode.gain.setValueAtTime(0.01, ctx.currentTime);
      
      debugLog('Ambient oscillator created (but not started anymore)');
      osc.connect(gainNode);
      
      gainNode.connect(ctx.destination);
      osc.start();
      debugLog('Ambient oscillator started');
      
      setAudioContext(ctx);
      setOscillator(osc);
    } catch (error) {
      console.warn('Audio context initialization failed:', error);
    }
  }, []);

  const typeText = (lineIndex: number, text: string, speed: number = 50) => {
    return new Promise<void>((resolve) => {
      let charIndex = 0;
      
      const typeChar = () => {
        if (charIndex < text.length) {
          setDisplayedText(prev => {
            const newText = [...prev];
            newText[lineIndex] = text.substring(0, charIndex + 1);
            return newText;
          });
          charIndex++;
          
          // Compilation sound - crackling of dust on a forgotten artifact
          if (Math.random() > 0.8) { // Rarer, more subtle
            try {
              const ctx = new AudioContext();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              const filterNode = ctx.createBiquadFilter();
              
              // More subtle, organic frequencies
              osc.frequency.setValueAtTime(600 + Math.random() * 200, ctx.currentTime);
              osc.type = 'triangle';
              
              // High-pass filter for a more "dusty" sound
              filterNode.type = 'highpass';
              filterNode.frequency.setValueAtTime(1000, ctx.currentTime);
              filterNode.Q.setValueAtTime(0.5, ctx.currentTime);
              
              gain.gain.setValueAtTime(0.003, ctx.currentTime); // Even weaker
              gain.gain.exponentialRampToValueAtTime(0.0005, ctx.currentTime + 0.08);
              
              osc.connect(filterNode);
              filterNode.connect(gain);
              gain.connect(ctx.destination);
              osc.start();
              debugLog('Compile noise oscillator scheduled to stop');
              osc.stop(ctx.currentTime + 0.08);
            } catch (e) {}
          }
          
          setTimeout(typeChar, speed);
        } else {
          resolve();
        }
      };
      
      typeChar();
    });
  };

  const startTextAnimation = useCallback(async () => {
    console.log('Starting text animation - Soul Terminal...');
    
    const lines = [
      'K.A.E.L.E.N. has indexed every story ever told.',
      'Every joy, every sorrow, every war, every kiss.',
      'All but one.',
      'SUBMIT YOURS.'
    ];
    // Line 1 - slow appearance with compilation effect
    await new Promise(resolve => setTimeout(resolve, 1500));
    await typeText(0, lines[0], 85);
    
    // 2-second pause - no intensification of the humming
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Line 2
    await typeText(1, lines[1], 75);
    
    // Pause + distant and dissonant piano note
    await new Promise(resolve => setTimeout(resolve, 2000));
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      // Dissonant piano note, like a corrupted memory
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc.frequency.linearRampToValueAtTime(415, ctx.currentTime + 2); // Slightly detuned
      osc.type = 'sine';
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
      
      debugLog('Piano dissonant oscillator connected');
      osc.connect(gain);
      
      gain.connect(ctx.destination);
      osc.start();
      debugLog('Piano dissonant note started (line 2)');
      osc.stop(ctx.currentTime + 2.5);
    } catch (e) {}
    
    // Line 3 - bigger, it's the hook
    await typeText(2, lines[2], 120);
    
    // Complete silence for 1 second - the machine's breath
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Line 4 - violent appearance, like a system command
    await typeText(3, lines[3], 25);
    
    // Activate system pulse and allow interaction
    setShowSubmitPulse(true);
    setIsTextComplete(true);
    
  }, [oscillator, audioContext]);

  const stopAmbientAudio = useCallback(() => {
    if (oscillator) {
      debugLog('Stopping ambient oscillator');
      try { oscillator.stop(); } catch (_) {}
      try { oscillator.disconnect(); } catch (_) {}
      setOscillator(null);
    }
    if (audioContext) {
      debugLog('Closing ambient audioContext');
      try { audioContext.close(); } catch (_) {}
      setAudioContext(null);
    }
  }, [oscillator, audioContext]);

  const playInteractionSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create the main interaction sound - vault lock breaking + human breath
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode1 = ctx.createGain();
      const gainNode2 = ctx.createGain();
      const masterGain = ctx.createGain();
      
      // Deep resonant frequency for the "lock breaking"
      osc1.frequency.setValueAtTime(180, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.15);
      osc1.type = 'square';
      
      // Higher frequency for the "breath" element
      osc2.frequency.setValueAtTime(800, ctx.currentTime + 0.1);
      osc2.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.2);
      osc2.type = 'sine';
      
      // Sharp attack, quick decay for lock sound
      gainNode1.gain.setValueAtTime(0.4, ctx.currentTime);
      gainNode1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      // Softer, breath-like envelope
      gainNode2.gain.setValueAtTime(0, ctx.currentTime + 0.1);
      gainNode2.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.12);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      
      masterGain.gain.setValueAtTime(0.8, ctx.currentTime);
      
      osc1.connect(gainNode1);
      osc2.connect(gainNode2);
      gainNode1.connect(masterGain);
      gainNode2.connect(masterGain);
      masterGain.connect(ctx.destination);
      
      osc1.start();
      debugLog('Interaction osc1 start');
      osc2.start(ctx.currentTime + 0.1);
      debugLog('Interaction osc2 start');
      osc1.stop(ctx.currentTime + 0.15);
      debugLog('Interaction osc1 scheduled stop');
      osc2.stop(ctx.currentTime + 0.25);
      debugLog('Interaction osc2 scheduled stop');
      
    } catch (error) {
      console.warn('Interaction sound failed:', error);
    }
  }, []);

  const finalLines = [
    'K.A.E.L.E.N. has indexed every story ever told.',
    'Every joy, every sorrow, every war, every kiss.',
    'All but one.',
    'SUBMIT YOURS.'
  ];

  useEffect(() => {
    debugLog('Checking animation condition:', { videoEnded, isFirstTimeWelcome });
    if (videoEnded && isFirstTimeWelcome !== null) {
      if (isFirstTimeWelcome) {
        debugLog('First time visit, starting text animation.');
        startTextAnimation();
        localStorage.setItem('hasSeenWelcomeAnimation', 'true');
      } else {
        debugLog('Subsequent visit, skipping text animation.');
        setDisplayedText(finalLines);
        setIsTextComplete(true);
        setShowSubmitPulse(true);
      }
    }
  }, [videoEnded, isFirstTimeWelcome, startTextAnimation]);

  const handleVideoEnd = useCallback(() => {
    debugLog('Video has ended.');
    setVideoEnded(true);
  }, []);

  const handleSkip = useCallback(() => {
    debugLog('Skip button clicked');
    
    // Stop the current video
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = video.duration || 0;
    }
    
    // Trigger video end logic
    handleVideoEnd();
  }, []);

  const signInWithWallet = async () => {
    if (!MiniKit.isInstalled()) {
      onAuthError('This application must be opened in World App');
      return;
    }

    playInteractionSound();
    setIsSigningIn(true);
    setShowWalletCard(true);
    
    try {
      debugLog('signInWithWallet called');
      const { user, token } = await authenticateWithWorldWallet();
      debugLog('authenticateWithWorldWallet resolved');

      // 5. Authentication successful
      stopAmbientAudio();
      stopPianoNote();
      onAuthSuccess(user, token);
      debugLog('Ambient and piano stopped after auth success');
    } catch (error: any) {
      console.error('World Wallet authentication error:', error);
      onAuthError(error.message || 'Authentication error');
      debugLog('Auth error', error);
    } finally {
      setIsSigningIn(false);
      stopAmbientAudio();
      stopPianoNote();
    }
  };

  const stopPianoNote = useCallback(() => {
    if (pianoOscRef.current) {
      debugLog('Stopping piano oscillator');
      try { pianoOscRef.current.stop(); } catch (_) {}
      try { pianoOscRef.current.disconnect(); } catch (_) {}
      pianoOscRef.current = null;
    }
    if (pianoCtxRef.current) {
      debugLog('Closing piano audioContext');
      try { pianoCtxRef.current.close(); } catch (_) {}
      pianoCtxRef.current = null;
    }
  }, []);

  const handleEnterApp = useCallback(() => {
    // Trigger the interaction break sequence
    setShowInteractionBreak(true);
    
    // Hide only the first three lines of text
    setHideFirstThreeLines(true);
    
    // Stop ambient audio immediately for silence effect - deafening silence
    stopAmbientAudio();
    
    // Play the interaction sound - vault breaking + breath
    playInteractionSound();
    
    // After a brief moment, remove blur with supernatural speed
    setTimeout(() => {
      setBackgroundBlurred(false);
      
      // Show the transmission interface after the focus effect
      setTimeout(() => {
        setShowTransmissionInterface(true);
        
        // Play the suspended piano note
        try {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          // The suspended note - cold and mathematical
          osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
          osc.type = 'sine';
          
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.5);
          // Note stays suspended - doesn't fade
          
          debugLog('Suspended piano note started');
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          
          // Store references to stop later (refs avoid stale closure)
          pianoOscRef.current = osc; debugLog('Suspended piano oscillator stored');
          pianoCtxRef.current = ctx;
          
          debugLog('Suspended piano oscillator stored');
        } catch (e) {}
        
        // Continue with wallet auth after showing interface
        setTimeout(() => {
          // Keep the piano note playing during authentication
          debugLog('Trigger signInWithWallet after interface - piano note running');
          signInWithWallet();
        }, 1000);
      }, 300);
    }, 100);
  }, [stopAmbientAudio, playInteractionSound, stopPianoNote]);

  // Control video playback based on first-time status
  useEffect(() => {
    // isFirstTimeWelcome is null on first render while we read localStorage
    if (isFirstTimeWelcome === null) return;

    if (isFirstTimeWelcome === false) {
      // Visite ultérieure : afficher un splash statique pendant quelques secondes
      setVideoEnded(false);

      const timer = setTimeout(() => {
        setVideoEnded(true);
      }, SPLASH_DURATION_MS);

      return () => clearTimeout(timer);
    }

    // Première visite : on lit la vidéo normalement
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.play().catch(console.error);
    }
  }, [isFirstTimeWelcome]);

  useEffect(() => {
    return () => {
      stopAmbientAudio();
      stopPianoNote();
    };
  }, [stopAmbientAudio, stopPianoNote]);

  // Eruda debugging console - DISABLED
  // useEffect(() => {
  //   // Initialize Eruda to allow debugging even on the home screen
  //   if (typeof window !== 'undefined' && !(window as any).eruda) {
  //     const script = document.createElement('script');
  //     script.src = '//cdn.jsdelivr.net/npm/eruda';
  //     script.onload = () => {
  //       (window as any).eruda.init();
  //       console.log('🔧 Eruda console (WelcomePage) enabled');
  //     };
  //     document.head.appendChild(script);
  //   }
  // }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" style={{ height: '100vh', width: '100vw' }}>
      {/* Background visuals */}
      {isFirstTimeWelcome && (
        <video
          ref={videoRef}
          className={`absolute top-0 left-0 w-full h-full object-cover transition-all duration-300 ${
            videoEnded && backgroundBlurred 
              ? 'blur-[2px] brightness-90 contrast-105' 
              : videoEnded && !backgroundBlurred
              ? 'blur-[2px] brightness-95 contrast-102'
              : ''
          }`}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: -1,
            objectFit: 'cover'
          }}
          playsInline
          onEnded={handleVideoEnd}
          preload="auto"
        >
          <source src="https://res.cloudinary.com/detrymeup/video/upload/mu1yv5vfc0j8xcsevntj.mp4" type="video/mp4" />
          Your browser does not support video playback.
        </video>
      )}
      
      {/* Static background image (blurred) shown once video is finished OR on subsequent visits */}
      {(videoEnded || !isFirstTimeWelcome) && (
        <img
          src="/kaelen_sit.png"
          alt="Kaelen background"
          className="fixed top-0 left-0 w-screen h-screen object-cover object-center brightness-90 blur-[2px]"
          style={{ zIndex: -2 }}
        />
      )}
      
      {/* Overlay for the blue scar spectral effect */}
      {videoEnded && backgroundBlurred && (
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-900/5 pointer-events-none"></div>
      )}
      
      {/* Ghostly blue glow effect to simulate Kaelen's scar */}
      {videoEnded && backgroundBlurred && (
        <div 
          className="absolute right-1/3 top-2/3 w-32 h-8 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse, rgba(59, 130, 246, 0.4) 0%, rgba(59, 130, 246, 0.2) 40%, transparent 70%)',
            filter: 'blur(4px)',
            animation: 'spectral-glow 4s ease-in-out infinite'
          }}
        ></div>
      )}
      
      {/* Subtle spectral particles around the scar */}
      {videoEnded && backgroundBlurred && (
        <div className="absolute right-1/3 top-2/3 w-40 h-16 pointer-events-none">
          <div 
            className="absolute w-0.5 h-0.5 bg-blue-300 opacity-10"
            style={{
              left: '15%',
              top: '25%',
              animation: 'fade-in 6s ease-in-out infinite',
              animationDelay: '0s'
            }}
          ></div>
          <div 
            className="absolute w-0.5 h-0.5 bg-blue-400 opacity-15"
            style={{
              left: '75%',
              top: '55%',
              animation: 'fade-in 5s ease-in-out infinite',
              animationDelay: '2s'
            }}
          ></div>
        </div>
      )}

      {/* Skip button during the video */}
      {!videoEnded && isFirstTimeWelcome && (
        <button
          onClick={handleSkip}
          className="absolute top-8 right-8 bg-black/50 hover:bg-black/70 text-white px-6 py-3 rounded-lg backdrop-blur-sm transition-all duration-300 text-sm font-medium"
        >
          Skip →
        </button>
      )}

      {/* Soul Terminal - Immersive Interface */}
      {videoEnded && (
        <div 
          className={`absolute inset-0 flex items-start pt-24 justify-center z-40 transition-opacity duration-1000 ${
            isTextComplete && !showTransmissionInterface ? 'cursor-pointer' : 'cursor-default'
          }`}
          onClick={(isTextComplete && !showTransmissionInterface) ? handleEnterApp : undefined}
          style={{
            background: backgroundBlurred 
              ? 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.05) 70%, rgba(0,0,0,0.15) 100%)'
              : 'transparent'
          }}
        >
          <div className="text-center max-w-6xl px-8">
            {/* Line 1 - Surgical terminal, disappears on click */}
            {displayedText[0] && !hideFirstThreeLines && (
              <div className={`text-white font-bodoni terminal-text text-2xl md:text-3xl font-light tracking-wide leading-relaxed mb-6 transition-opacity duration-500 ${
                hideFirstThreeLines ? 'opacity-0' : 'opacity-100'
              }`}
                   style={{
                     textShadow: '0 0 8px rgba(255, 255, 255, 0.1)',
                     fontWeight: 400,
                     letterSpacing: '0.02em'
                   }}>
                {displayedText[0]}
              </div>
            )}
            
            {displayedText[1] && !hideFirstThreeLines && (
              <div className={`text-white font-bodoni terminal-text text-2xl md:text-3xl font-light tracking-wide leading-relaxed mb-10 transition-opacity duration-500 ${
                hideFirstThreeLines ? 'opacity-0' : 'opacity-100'
              }`}
                   style={{
                     textShadow: '0 0 10px rgba(255, 255, 255, 0.15)',
                     fontWeight: 400,
                     letterSpacing: '0.02em'
                   }}>
                {displayedText[1]}
              </div>
            )}
            
            {/* Line 3 - The hook, disappears on click */}
            {displayedText[2] && !hideFirstThreeLines && (
              <div className={`text-white font-bodoni terminal-text text-4xl md:text-5xl font-medium tracking-wider leading-relaxed mb-16 transition-opacity duration-500 ${
                hideFirstThreeLines ? 'opacity-0' : 'opacity-100'
              }`}
                   style={{
                     textShadow: '0 0 15px rgba(255, 255, 255, 0.2)',
                     fontWeight: 500,
                     letterSpacing: '0.05em'
                   }}>
                {displayedText[2]}
              </div>
            )}
            
            {/* Interface area - no more SUBMIT YOURS */}
            {displayedText[3] && (
              <div className="relative">
                
                {/* Transmission interface - elegant and relentless */}
                {isTextComplete && !showTransmissionInterface && (
                  <div className="mt-20 space-y-4 animate-fade-in" style={{ animationDelay: '3s' }}>
                    <div className="text-green-400/40 text-sm font-mono tracking-wider">
                      [ MNEMONIC CORE - Awaiting Synchronization ]
                    </div>
                    <div className="text-green-400/60 text-xs font-mono tracking-wide animate-pulse">
                      {'>'} CONNECT YOUR WORLD WALLET - Click to authenticate and enter...
                    </div>
                  </div>
                )}
                
                {/* Post-interaction input interface */}
                {showTransmissionInterface && (
                  <div className="mt-20 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.5s' }}>
                    {/* AI chat integration in the terminal */}
                    <TerminalChat 
                      fragments={messageFragments} 
                      onSubTerminalToggle={setIsSubTerminalOpen}
                      onFragmentsUpdate={setMessageFragments}
                    />
                  </div>
                )}
              </div>
            )}
            
            {/* Message for Kaelen - he is watching you now */}
            {showTransmissionInterface && !isSubTerminalOpen && (
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/30 text-xs font-mono animate-fade-in" style={{ animationDelay: '1s' }}>
                [ He sees you now. The fourth wall has evaporated. ]
              </div>
            )}
          </div>
        </div>
      )}

      {/* Authentication loading overlay */}
      {isSigningIn && (
        <div
          className="wallet-overlay absolute inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md"
          style={{ height: '100vh' }}
        >
          <div className="max-w-5xl w-full mx-auto px-8 flex flex-col items-center">
            {/* Protocol Initialization Terminal */}
            <div className="font-mono space-y-3 text-green-400 w-full max-w-3xl flex flex-col items-center">
              <div className="text-3xl mb-8 text-center">
                <span className="animate-pulse">[ INITIALIZATION PROTOCOL ]</span>
              </div>
              
              <div className="space-y-3 text-base w-full">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0 }}
                  className="text-center"
                >
                  <span className="text-green-500">&gt;</span> INITIALIZING CONNECTION...
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-center"
                >
                  <span className="text-green-500">&gt;</span> VERIFYING SECURITY PROTOCOL...
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="interfacial-message text-yellow-400 text-center"
                >
                  <span className="text-yellow-500">&gt;</span> INTERFACIAL LINK WITH MNEMONIC CORE REQUIRED.
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                  className="w-full flex justify-center"
                >
                  <div className="wallet-connection-card border border-green-400/30 p-6 bg-black/50 w-full max-w-2xl mx-auto flex flex-col items-center justify-center space-y-4">
                    <div className="text-green-400 text-center text-lg">
                      <span className="text-green-500">&gt;</span> Authenticate your Datastream to continue.
                    </div>
                    <div className="text-base text-green-400/60 space-y-3 text-center">
                      <div>[SYSTEM] Creating your unique identifier in the system...</div>
                      <div>[SYSTEM] Generating your Datastream_ID...</div>
                      <div>[SYSTEM] Synchronizing with the World Protocol...</div>
                    </div>
                  </div>
                </motion.div>
                
                {/* Scan lines effect */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute inset-0"
                       style={{
                         backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34, 197, 94, 0.03) 2px, rgba(34, 197, 94, 0.03) 4px)',
                         animation: 'scanlines 2s linear infinite'
                       }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isFirstTimeWelcome && !videoEnded && (
        <>
          {/* Splash text */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-thin text-white tracking-[0.3em]">K.A.E.L.E.N</h1>
              <p className="text-sm md:text-base lg:text-lg font-light text-white/80 tracking-widest mt-4">SEASON ONE</p>
            </div>
          </div>
        </>
      )}

    </div>
  );
}