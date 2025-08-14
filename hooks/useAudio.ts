import { useRef, useCallback } from 'react'

// Função para gerar beep sintético usando Web Audio API
const createBeep = (frequency = 800, duration = 200) => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = frequency
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + duration / 1000)
    
    return true
  } catch (error) {
    console.warn('Web Audio API não suportada:', error)
    return false
  }
}

export const useAudio = (audioSrc: string) => {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const play = useCallback(() => {
    // Primeiro tentar tocar o arquivo de áudio se carregado
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(error => {
        console.warn('Erro ao tocar arquivo de áudio, usando beep sintético:', error)
        createBeep()
      })
    } else {
      // Se não há arquivo carregado, usar beep sintético
      createBeep()
    }
  }, [])

  const loadAudio = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        audioRef.current = new Audio(audioSrc)
        audioRef.current.preload = 'auto'
        audioRef.current.volume = 0.5
        
        audioRef.current.addEventListener('error', (e) => {
          console.warn('Arquivo de áudio não encontrado, usando beep sintético:', audioSrc)
          audioRef.current = null
        })
      } catch (error) {
        console.warn('Erro ao carregar áudio, usando beep sintético:', error)
        audioRef.current = null
      }
    }
  }, [audioSrc])

  return {
    play,
    loadAudio,
    audioRef
  }
}
