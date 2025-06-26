"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import KaelenPortrait from './kaelen-portrait';
import userService from '@/utils/userService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '*Straightens with intimidating elegance, storm-gray eyes fixing the screen as if they could see through*\n\nHello, mortal. I am K.A.E.L.E.N, the Master of Ceremonies. \n\n*The pearl-gray ascot shimmers slightly*\n\nYour presence here is no accident. You\'ve come with an ambition... grandiose. To make laugh one who has lived through all tragedies, all comedies, all dramas of human existence. \n\n*An icy smile touches my lips*\n\nWhat delicious audacity. Very well. You have my full attention - a privilege I rarely grant. Show me what your limited humanity can offer that I haven\'t already catalogued in my infinite archives.\n\nBegin. Surprise me... if you\'re capable.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ascotColor, setAscotColor] = useState('bg-gray-300');
  const [emotionIntensity, setEmotionIntensity] = useState(0);
  const [score, setScore] = useState(0);
  const [userStats, setUserStats] = useState({
    totalConversations: 0,
    totalMessages: 0,
    highestScore: 0,
    averageScore: 0,
    favoriteEmotions: []
  });
  const [hasMemory, setHasMemory] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialisation d'Eruda pour le débogage - DISABLED
  // useEffect(() => {
  //   const script = document.createElement('script');
  //   script.src = '//cdn.jsdelivr.net/npm/eruda';
  //   script.onload = () => {
  //     (window as any).eruda.init();
  //     console.log('🔧 Eruda debugging console activated');
  //   };
  //   document.head.appendChild(script);
  // }, []);

  // Initialisation du service utilisateur
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const user = await userService.initializeUser();
        if (user) {
          setHasMemory(user.hasMemory);
          setUserStats(userService.getUserStats());
          
          await userService.startNewConversation();
          console.log('🧠 Memory system activated');
        } else {
          console.log('⚠️ Running without memory');
        }
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeUser();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const analyzeResponse = (response: string) => {
    let intensity = 0;
    let emotionType = 'neutral';

    if (response.includes('disappoint') || response.includes('banal') || response.includes('predictable') || 
        response.includes('catalogued') || response.includes('dull') || response.includes('boring')) {
      intensity = 3;
      emotionType = 'disappointed';
      return { color: 'bg-gray-600', intensity, emotionType };
    }

    if (response.includes('interesting') || response.includes('intriguing') || response.includes('approach') ||
        response.includes('attention') || response.includes('curious') || response.includes('shimmer')) {
      intensity = 2;
      emotionType = 'intrigued';
      return { color: 'bg-blue-400', intensity, emotionType };
    }

    if (response.includes('vulnerability') || response.includes('resonance') || response.includes('defenses') ||
        response.includes('touched') || response.includes('pierce') || response.includes('emotional')) {
      intensity = 4;
      emotionType = 'touched';
      return { color: 'bg-purple-400', intensity, emotionType };
    }

    if (response.includes('new') || response.includes('created') || response.includes('delicious') ||
        response.includes('system') || response.includes('hesitate') || response.includes('original')) {
      intensity = 5;
      emotionType = 'impressed';
      return { color: 'bg-green-400', intensity, emotionType };
    }

    if (response.includes('hope') || response.includes('glitters') || response.includes('cognitive circuits') ||
        response.includes('reference') || response.includes('centuries') || response.includes('trembling')) {
      intensity = 6;
      emotionType = 'hopeful';
      return { color: 'bg-yellow-400', intensity, emotionType };
    }

    if (response.includes('insolent') || response.includes('audacity') || response.includes('red') ||
        response.includes('anger') || response.includes('fury')) {
      intensity = 4;
      emotionType = 'angry';
      return { color: 'bg-red-400', intensity, emotionType };
    }

    if (response.includes('mystery') || response.includes('contemplat') || response.includes('meditat') ||
        response.includes('silence')) {
      intensity = 2;
      emotionType = 'mysterious';
      return { color: 'bg-indigo-400', intensity, emotionType };
    }

    return { color: 'bg-gray-300', intensity: 0, emotionType: 'neutral' };
  };

  const getEmotionLabel = (emotionType: string, intensity: number) => {
    const intensityMap = {
      'neutral': 'Neutral',
      'disappointed': intensity > 2 ? 'Deeply Disappointed' : 'Disappointed',
      'intrigued': intensity > 3 ? 'Deeply Intrigued' : 'Intrigued',
      'touched': intensity > 4 ? 'Profoundly Touched' : 'Touched',
      'impressed': intensity > 4 ? 'Remarkably Impressed' : 'Impressed',
      'hopeful': intensity > 5 ? 'Transported with Hope' : 'Hopeful',
      'angry': intensity > 3 ? 'Furious' : 'Irritated',
      'mysterious': 'Contemplative'
    };
    return intensityMap[emotionType as keyof typeof intensityMap] || 'Neutral';
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !isInitialized) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await userService.sendMessage([...messages, userMessage]);
      
      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      setTimeout(() => {
        playResponseSound();
      }, 300);
      
      const emotionAnalysis = data.emotionAnalysis || analyzeResponse(data.message);
      setAscotColor(emotionAnalysis.color);
      setEmotionIntensity(emotionAnalysis.intensity);
      
      const scoreChange = data.scoreChange || 0;
      setScore(prev => prev + scoreChange);
      
      setUserStats(userService.getUserStats());
      
      setTimeout(() => {
        setAscotColor('bg-gray-300');
        setEmotionIntensity(0);
      }, 8000);
      
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '*K.A.E.L.E.N\'s eyes veil with a dangerous gleam*\n\nAn... interference. My systems have encountered a disruption. How... ironic. Even technological perfection knows its weaknesses.\n\n*The ascot pulses with a blood-red glow*\n\nTry again, mortal. This interruption only adds to my... curiosity.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const playKeySound = () => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.frequency.setValueAtTime(1000 + Math.random() * 600, ctx.currentTime);
      osc.type = 'triangle';
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, ctx.currentTime);
      filter.Q.setValueAtTime(1, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.005, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0005, ctx.currentTime + 0.08);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  };

  const playSendMessageSound = () => {
    try {
      const ctx = new AudioContext();
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.4);
      osc1.type = 'sine';
      
      osc2.frequency.setValueAtTime(392, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(493.88, ctx.currentTime + 0.4);
      osc2.type = 'triangle';
      
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(300, ctx.currentTime);
      filter.Q.setValueAtTime(1.5, ctx.currentTime);
      
      gain1.gain.setValueAtTime(0.02, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      
      gain2.gain.setValueAtTime(0.015, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      
      osc1.connect(filter);
      osc2.connect(gain2);
      filter.connect(gain1);
      gain1.connect(ctx.destination);
      gain2.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.5);
      osc2.stop(ctx.currentTime + 0.5);
    } catch {}
  };

  const playResponseSound = () => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.frequency.setValueAtTime(174.61, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.3);
      osc.frequency.linearRampToValueAtTime(196, ctx.currentTime + 0.6);
      osc.type = 'sawtooth';
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.6);
      filter.Q.setValueAtTime(2, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.015, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {}
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      playSendMessageSound();
      sendMessage();
    } else if (e.key.length === 1) {
      if (Math.random() > 0.8) {
        playKeySound();
      }
    }
  };

  const startNewConversation = async () => {
    try {
      await userService.startNewConversation();
      setMessages([{
        id: '1',
        role: 'assistant',
        content: '*Straightens with intimidating elegance, storm-gray eyes fixing the screen as if they could see through*\n\nHello, mortal. I am K.A.E.L.E.N, the Master of Ceremonies. \n\n*The pearl-gray ascot shimmers slightly*\n\nYour presence here is no accident. You\'ve come with an ambition... grandiose. To make laugh one who has lived through all tragedies, all comedies, all dramas of human existence. \n\n*An icy smile touches my lips*\n\nWhat delicious audacity. Very well. You have my full attention - a privilege I rarely grant. Show me what your limited humanity can offer that I haven\'t already catalogued in my infinite archives.\n\nBegin. Surprise me... if you\'re capable.',
        timestamp: new Date()
      }]);
      setScore(0);
      setAscotColor('bg-gray-300');
      setEmotionIntensity(0);
    } catch (error) {
      console.error('New conversation error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white relative overflow-hidden">
      {/* Ambient particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 h-0.5 bg-blue-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-30, -60, -30],
              x: [-10, 10, -10],
              opacity: [0.1, 0.6, 0.1],
              scale: [0.3, 1, 0.3]
            }}
            transition={{
              duration: 6 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Global subtle scan effect */}
      <div className="fixed inset-0 pointer-events-none z-10 opacity-20">
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent h-2"
          animate={{ y: ['0%', '100%'] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Header with K.A.E.L.E.N portrait */}
      <motion.div 
        className="border-b border-slate-700 p-6 bg-black/30 backdrop-blur-md relative z-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="max-w-4xl mx-auto flex items-center space-x-4">
                        <KaelenPortrait 
            ascotColor={ascotColor} 
            isThinking={isLoading}
            emotionIntensity={emotionIntensity}
            emotionType={analyzeResponse(messages[messages.length - 1]?.content || '').emotionType}
          />
          <div className="flex-1">
            <h1 className="text-2xl font-light tracking-wide">K.A.E.L.E.N</h1>
            <p className="text-slate-400 text-sm">The Master of Ceremonies</p>
            <div className="flex items-center mt-1 space-x-2">
              <span className="text-xs text-slate-500">Emotional State:</span>
              <div className="flex items-center space-x-2">
                <motion.div 
                  className={cn("w-3 h-3 rounded-full transition-all duration-700", ascotColor)}
                  animate={{
                    scale: emotionIntensity > 0 ? [1, 1.2, 1] : 1,
                    boxShadow: emotionIntensity > 0 ? 
                      ['0 0 5px rgba(59, 130, 246, 0.3)', '0 0 15px rgba(59, 130, 246, 0.6)', '0 0 5px rgba(59, 130, 246, 0.3)'] :
                      '0 0 0px rgba(59, 130, 246, 0)'
                  }}
                  transition={{
                    duration: 2,
                    repeat: emotionIntensity > 0 ? Infinity : 0
                  }}
                />
                <span className="text-xs text-slate-400">
                  {getEmotionLabel(analyzeResponse(messages[messages.length - 1]?.content || '').emotionType, emotionIntensity)}
                </span>
                {emotionIntensity > 0 && (
                  <motion.div 
                    className="flex space-x-1"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {[...Array(emotionIntensity)].map((_, i) => (
                      <motion.div 
                        key={i} 
                        className="w-1 h-1 bg-white rounded-full"
                        animate={{
                          opacity: [0.3, 0.8, 0.3],
                          scale: [0.8, 1.2, 0.8]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.2
                        }}
                      />
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
          
          {/* Score display with effects */}
          <motion.div 
            className="text-right text-xs text-slate-500 min-w-[120px]"
            animate={{
              scale: score !== 0 ? [1, 1.05, 1] : 1
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="font-semibold text-sm text-white">Score:</div>
            <motion.div 
              className={cn(
                "text-lg font-bold relative",
                score > 0 ? "text-green-400" : score < 0 ? "text-red-400" : "text-slate-400"
              )}
              animate={{
                textShadow: score > 0 ? 
                  '0 0 10px rgba(34, 197, 94, 0.5)' : 
                  score < 0 ? '0 0 10px rgba(239, 68, 68, 0.5)' : '0 0 0px rgba(0,0,0,0)'
              }}
            >
              {score}
              {score !== 0 && (
                <motion.div
                  className="absolute -inset-2 rounded-md bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.3, 0] }}
                  transition={{ duration: 1 }}
                />
              )}
            </motion.div>
          </motion.div>
          
          {/* Memory indicator */}
          <div className="text-right text-xs text-slate-500">
            <div className="flex items-center space-x-1">
              <div className={cn("w-2 h-2 rounded-full", hasMemory ? "bg-green-500" : "bg-gray-500")} />
              <span>{hasMemory ? "Memory Active" : "No Memory"}</span>
            </div>
            {hasMemory && (
              <>
                <div className="text-slate-600 mt-1">
                  Conversations: {userStats.totalConversations}
                </div>
                <div className="text-slate-600">
                  Record: {userStats.highestScore}
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Chat Messages */}
      <div className="flex-1 max-w-4xl mx-auto p-6 relative z-20">
        <div className="space-y-6 min-h-[60vh]">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ 
                  opacity: 0, 
                  y: 30, 
                  scale: 0.95,
                  filter: 'blur(4px)'
                }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  filter: 'blur(0px)'
                }}
                exit={{ 
                  opacity: 0, 
                  y: -20, 
                  scale: 0.95,
                  filter: 'blur(2px)'
                }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1,
                  ease: "easeOut"
                }}
                className={cn(
                  "flex relative",
                  message.role === 'user' ? "justify-end" : "justify-start"
                )}
                whileHover={{ scale: 1.02 }}
              >
                {/* Effet de particules pour les messages de K.A.E.L.E.N */}
                {message.role === 'assistant' && (
                  <div className="absolute -inset-2 pointer-events-none">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-0.5 h-0.5 bg-purple-400/40 rounded-full"
                        style={{
                          left: `${20 + Math.random() * 60}%`,
                          top: `${20 + Math.random() * 60}%`,
                        }}
                        animate={{
                          opacity: [0, 0.6, 0],
                          scale: [0.5, 1.5, 0.5]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          delay: i * 0.7
                        }}
                      />
                    ))}
                  </div>
                )}
                
                <motion.div
                  className={cn(
                    "max-w-[85%] rounded-lg p-4 shadow-xl relative overflow-hidden",
                    message.role === 'user'
                      ? "bg-slate-700/80 border border-slate-600/60 backdrop-blur-sm"
                      : "bg-black/50 border border-slate-800/60 backdrop-blur-md"
                  )}
                  style={{
                    boxShadow: message.role === 'assistant' ? 
                      '0 8px 32px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)' :
                      '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                  }}
                  whileHover={{
                    boxShadow: message.role === 'assistant' ? 
                      '0 12px 40px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)' :
                      '0 12px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}
                >
                  {/* Effet de lueur interne pour K.A.E.L.E.N */}
                  {message.role === 'assistant' && (
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none rounded-lg" />
                  )}
                  
                  <motion.p 
                    className="text-sm leading-relaxed whitespace-pre-wrap relative z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    {message.content}
                  </motion.p>
                  <motion.span 
                    className="text-xs text-slate-500 mt-2 block relative z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </motion.span>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex justify-start"
            >
              <motion.div 
                className="bg-black/50 border border-slate-800/60 rounded-lg p-4 backdrop-blur-md relative overflow-hidden"
                animate={{
                  boxShadow: [
                    '0 8px 32px rgba(139, 92, 246, 0.1)',
                    '0 8px 32px rgba(139, 92, 246, 0.2)',
                    '0 8px 32px rgba(139, 92, 246, 0.1)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {/* Effet de pensée - particules flottantes */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-purple-400/30 rounded-full"
                      style={{
                        left: `${10 + Math.random() * 80}%`,
                        top: `${20 + Math.random() * 60}%`,
                      }}
                      animate={{
                        y: [-5, -15, -5],
                        opacity: [0.2, 0.8, 0.2],
                        scale: [0.5, 1.2, 0.5]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.3
                      }}
                    />
                  ))}
                </div>
                
                <div className="flex items-center space-x-3 relative z-10">
                  <motion.span 
                    className="text-xs text-slate-400"
                    animate={{
                      opacity: [0.6, 1, 0.6]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    *K.A.E.L.E.N contemplates your words with icy intensity...*
                  </motion.span>
                  <div className="flex space-x-1">
                    {[...Array(3)].map((_, i) => (
                      <motion.div 
                        key={i}
                        className="w-2 h-2 bg-purple-400/70 rounded-full"
                        animate={{
                          scale: [0.8, 1.4, 0.8],
                          opacity: [0.4, 1, 0.4]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.2
                        }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <motion.div 
        className="border-t border-slate-700/60 bg-black/30 backdrop-blur-md p-6 relative z-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        style={{
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <motion.input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={hasMemory ? "K.A.E.L.E.N remembers your previous exchanges..." : "Dare to challenge the impossible... Show me humanity's most authentic essence."}
                className="w-full bg-slate-800/60 border border-slate-600/60 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 backdrop-blur-sm transition-all duration-300"
                disabled={isLoading || !isInitialized}
                style={{
                  boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.3)'
                }}
                whileFocus={{
                  boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.3), 0 0 20px rgba(59, 130, 246, 0.2)'
                }}
              />
              {/* Effet de lueur au focus */}
              {input && (
                <motion.div
                  className="absolute inset-0 border border-blue-400/30 rounded-lg pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </div>
            <motion.button
              onClick={() => {
                playSendMessageSound();
                sendMessage();
              }}
              disabled={isLoading || !input.trim() || !isInitialized}
              className="px-6 py-3 bg-slate-700/60 hover:bg-slate-600/60 disabled:bg-slate-800/60 disabled:opacity-50 border border-slate-600/60 rounded-lg font-medium backdrop-blur-sm relative overflow-hidden"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
              }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0"
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
              <span className="relative z-10">{isLoading ? '...' : 'Envoyer'}</span>
            </motion.button>
            <motion.button
              onClick={startNewConversation}
              disabled={isLoading || !isInitialized}
              className="px-4 py-3 bg-slate-800/60 hover:bg-slate-700/60 disabled:bg-slate-900/60 disabled:opacity-50 border border-slate-600/60 rounded-lg font-medium text-sm backdrop-blur-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
              }}
            >
              Nouveau
            </motion.button>
          </div>
          <motion.p 
            className="text-xs text-slate-500 mt-2 text-center"
            animate={{
              opacity: [0.6, 1, 0.6]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
                          {hasMemory ? 
              "🧠 Memory system activated - K.A.E.L.E.N remembers your shared history" :
               "⚠️ No memory mode - Start the backend to enable persistent memory"
             }
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}