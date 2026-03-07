'use client'

import { useState, useEffect } from 'react'

export function useResponsiveBoard(): string {
  const [boardSize, setBoardSize] = useState('70vh')

  useEffect(() => {
    function updateSize() {
      setBoardSize(window.innerWidth < window.innerHeight ? '70vw' : '70vh')
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  return boardSize
}
