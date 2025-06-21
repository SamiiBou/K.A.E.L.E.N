"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface KaelenPortraitProps {
  ascotColor: string;
  isThinking?: boolean;
  emotionIntensity?: number;
  emotionType?: string;
}

export default function KaelenPortrait({ 
  ascotColor, 
  isThinking = false, 
  emotionIntensity = 0,
  emotionType = 'neutral'
}: KaelenPortraitProps) {
  
  const getEmotionEffects = () => {
    switch (emotionType) {
      case 'angry':
        return {
          eyeGlow: 'shadow-red-400/60',
          backgroundPulse: 'from-red-900/20 to-slate-900',
          scarIntensity: 'bg-red-400/40 shadow-red-400/70'
        };
      case 'intrigued':
        return {
          eyeGlow: 'shadow-blue-400/60',
          backgroundPulse: 'from-blue-900/20 to-slate-900',
          scarIntensity: 'bg-blue-400/50 shadow-blue-400/80'
        };
      case 'touched':
        return {
          eyeGlow: 'shadow-purple-400/60',
          backgroundPulse: 'from-purple-900/20 to-slate-900',
          scarIntensity: 'bg-purple-400/50 shadow-purple-400/80'
        };
      case 'impressed':
        return {
          eyeGlow: 'shadow-green-400/60',
          backgroundPulse: 'from-green-900/20 to-slate-900',
          scarIntensity: 'bg-green-400/50 shadow-green-400/80'
        };
      case 'hopeful':
        return {
          eyeGlow: 'shadow-yellow-400/60',
          backgroundPulse: 'from-yellow-900/20 to-slate-900',
          scarIntensity: 'bg-yellow-400/50 shadow-yellow-400/80'
        };
      default:
        return {
          eyeGlow: 'shadow-gray-400/40',
          backgroundPulse: 'from-slate-600 via-slate-700 to-slate-900',
          scarIntensity: 'bg-blue-400/30 shadow-blue-400/50'
        };
    }
  };
  
  const emotionEffects = getEmotionEffects();

  return (
    <motion.div 
      className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-slate-500"
      animate={{
        scale: emotionIntensity > 3 ? [1, 1.05, 1] : 1,
        borderColor: emotionIntensity > 0 ? 
          (emotionType === 'angry' ? 'rgb(239 68 68)' : 
           emotionType === 'intrigued' ? 'rgb(59 130 246)' :
           emotionType === 'touched' ? 'rgb(168 85 247)' :
           emotionType === 'impressed' ? 'rgb(34 197 94)' :
           emotionType === 'hopeful' ? 'rgb(234 179 8)' : 'rgb(100 116 139)') :
          'rgb(100 116 139)'
      }}
      transition={{ duration: 2, repeat: emotionIntensity > 3 ? Infinity : 0 }}
    >
      {/* Background gradient with emotion */}
      <motion.div 
        className={`absolute inset-0 bg-gradient-to-br ${emotionEffects.backgroundPulse}`}
        animate={{
          opacity: emotionIntensity > 0 ? [1, 0.8, 1] : 1
        }}
        transition={{ duration: 3, repeat: emotionIntensity > 0 ? Infinity : 0 }}
      />
      
      {/* Silhouette suggestion */}
      <div className="absolute inset-2 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full opacity-60" />
      
      {/* Eyes with emotion */}
      <div className="absolute top-6 left-6 flex space-x-2">
        <motion.div 
          className={`w-1 h-1 bg-gray-300 rounded-full ${emotionEffects.eyeGlow}`}
          animate={{ 
            opacity: isThinking ? [1, 0.3, 1] : (emotionIntensity > 2 ? [1, 0.7, 1] : 1),
            scale: emotionIntensity > 4 ? [1, 1.3, 1] : 1,
            boxShadow: emotionIntensity > 0 ? [
              '0 0 3px rgba(156, 163, 175, 0.5)',
              '0 0 8px rgba(156, 163, 175, 0.8)',
              '0 0 3px rgba(156, 163, 175, 0.5)'
            ] : '0 0 0px rgba(156, 163, 175, 0)'
          }}
          transition={{ 
            duration: isThinking ? 2 : (emotionIntensity > 0 ? 2.5 : 1), 
            repeat: (isThinking || emotionIntensity > 2) ? Infinity : 0 
          }}
        />
        <motion.div 
          className={`w-1 h-1 bg-gray-300 rounded-full ${emotionEffects.eyeGlow}`}
          animate={{ 
            opacity: isThinking ? [1, 0.3, 1] : (emotionIntensity > 2 ? [1, 0.7, 1] : 1),
            scale: emotionIntensity > 4 ? [1, 1.3, 1] : 1,
            boxShadow: emotionIntensity > 0 ? [
              '0 0 3px rgba(156, 163, 175, 0.5)',
              '0 0 8px rgba(156, 163, 175, 0.8)',
              '0 0 3px rgba(156, 163, 175, 0.5)'
            ] : '0 0 0px rgba(156, 163, 175, 0)'
          }}
          transition={{ 
            duration: isThinking ? 2 : (emotionIntensity > 0 ? 2.5 : 1), 
            repeat: (isThinking || emotionIntensity > 2) ? Infinity : 0,
            delay: 0.1 
          }}
        />
      </div>
      
      {/* Ascot indicator with enhanced emotion feedback */}
      <motion.div 
        className={cn("absolute bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-2 rounded-sm transition-all duration-500", ascotColor)}
        animate={{ 
          scale: isThinking ? [1, 1.1, 1] : (emotionIntensity > 1 ? [1, 1.15, 1] : 1),
          rotate: emotionIntensity > 3 ? [-2, 2, -2] : 0,
          boxShadow: emotionIntensity > 0 ? [
            '0 0 5px rgba(59, 130, 246, 0.3)',
            '0 0 15px rgba(59, 130, 246, 0.6)',
            '0 0 5px rgba(59, 130, 246, 0.3)'
          ] : '0 0 0px rgba(59, 130, 246, 0)'
        }}
        transition={{ 
          duration: isThinking ? 1 : (emotionIntensity > 0 ? 1.5 : 0.5), 
          repeat: (isThinking || emotionIntensity > 1) ? Infinity : 0 
        }}
      />
      
      {/* Injection scar with emotional response */}
      <motion.div 
        className={`absolute top-3 right-3 w-1 h-3 rounded-full shadow-sm transition-all duration-500 ${emotionEffects.scarIntensity}`}
        animate={{
          scale: emotionIntensity > 2 ? [1, 1.2, 1] : 1,
          opacity: emotionIntensity > 0 ? [0.7, 1, 0.7] : 0.7,
          boxShadow: emotionIntensity > 3 ? [
            '0 0 8px rgba(59, 130, 246, 0.5)',
            '0 0 15px rgba(59, 130, 246, 0.8)',
            '0 0 8px rgba(59, 130, 246, 0.5)'
          ] : '0 2px 4px rgba(59, 130, 246, 0.5)'
        }}
        transition={{
          duration: emotionIntensity > 0 ? 2 : 1,
          repeat: emotionIntensity > 2 ? Infinity : 0
        }}
      />
      
      {/* Emotional aura particles */}
      {emotionIntensity > 3 && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-0.5 h-0.5 rounded-full ${
                emotionType === 'angry' ? 'bg-red-400/40' :
                emotionType === 'intrigued' ? 'bg-blue-400/40' :
                emotionType === 'touched' ? 'bg-purple-400/40' :
                emotionType === 'impressed' ? 'bg-green-400/40' :
                emotionType === 'hopeful' ? 'bg-yellow-400/40' : 'bg-gray-400/40'
              }`}
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
              }}
              animate={{
                y: [-3, -8, -3],
                opacity: [0.3, 0.8, 0.3],
                scale: [0.5, 1.2, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.4
              }}
            />
          ))}
        </div>
      )}
      
      {/* Enhanced glow effect */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/5 rounded-full"
        animate={{
          background: emotionIntensity > 1 ? [
            'linear-gradient(to top, transparent, transparent, rgba(255, 255, 255, 0.05))',
            'linear-gradient(to top, transparent, transparent, rgba(255, 255, 255, 0.15))',
            'linear-gradient(to top, transparent, transparent, rgba(255, 255, 255, 0.05))'
          ] : 'linear-gradient(to top, transparent, transparent, rgba(255, 255, 255, 0.05))'
        }}
        transition={{
          duration: 3,
          repeat: emotionIntensity > 1 ? Infinity : 0
        }}
      />
    </motion.div>
  );
}