'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('BuildaQuest: Service Worker registered successfully:', registration)

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (
                  newWorker.state === 'installed' &&
                  navigator.serviceWorker.controller
                ) {
                  // New content is available, show notification to user
                  console.log('BuildaQuest: New content is available, please refresh')

                  // Optional: Show a notification to the user
                  if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('BuildaQuest Update Available', {
                      body: 'A new version is available. Please refresh the page.',
                      icon: '/icon-192.png'
                    })
                  }
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('BuildaQuest: Service Worker registration failed:', error)
        })

      // Handle service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('BuildaQuest: Message from Service Worker:', event.data)
      })
    }
  }, [])

  return null
}