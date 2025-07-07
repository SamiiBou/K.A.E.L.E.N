'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    eruda?: {
      init: () => void
      show: () => void
      hide: () => void
    }
  }
}

export default function Eruda() {
  // useEffect(() => {
  //   if (process.env.NODE_ENV === 'development') {
  //     const loadEruda = async () => {
  //       try {
  //         // Try to import the local version first ,
  //         const eruda = await import('eruda')
  //         eruda.default.init()
  //       } catch (error) {
  //         console.warn('Local Eruda failed to load, trying CDN...', error)
          
  //         // Fallback to CDN
  //         const script = document.createElement('script')
  //         script.src = 'https://cdn.jsdelivr.net/npm/eruda@3.4.3/eruda.min.js'
  //         script.onload = () => {
  //           if (window.eruda) {
  //             window.eruda.init()
  //           }
  //         }
  //         script.onerror = () => {
  //           console.error('Failed to load Eruda from CDN')
  //         }
  //         document.head.appendChild(script)
  //       }
  //     }

  //     loadEruda()
  //   }
  // }, [])

  return null
} 