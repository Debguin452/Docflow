import { useState, useCallback } from 'react'
import type { ProcessState, ProcessStatus, ProcessedFile } from '../types'

const initialState: ProcessState = {
  status: 'idle',
  progress: 0,
  files: [],
}

export function useFileProcess() {
  const [state, setState] = useState<ProcessState>(initialState)

  const setStatus = useCallback((status: ProcessStatus) => {
    setState(prev => ({ ...prev, status }))
  }, [])

  const setProgress = useCallback((progress: number) => {
    setState(prev => ({ ...prev, progress: Math.min(100, Math.max(0, progress)) }))
  }, [])

  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, status: 'error', error }))
  }, [])

  const addResult = useCallback((file: ProcessedFile) => {
    setState(prev => ({
      ...prev,
      files: [...prev.files, file],
    }))
  }, [])

  const reset = useCallback(() => {
    setState(initialState)
  }, [])

  const process = useCallback(
    async <T>(
      fn: (onProgress: (pct: number) => void) => Promise<T>,
      onSuccess?: (result: T) => void,
    ) => {
      setState({ status: 'processing', progress: 0, files: [] })
      try {
        const result = await fn((pct) => {
          setState(prev => ({ ...prev, progress: pct }))
        })
        setState(prev => ({ ...prev, status: 'done', progress: 100 }))
        onSuccess?.(result)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'An error occurred'
        setState(prev => ({ ...prev, status: 'error', error: msg, progress: 0 }))
      }
    },
    [],
  )

  return {
    ...state,
    isIdle: state.status === 'idle',
    isProcessing: state.status === 'processing',
    isDone: state.status === 'done',
    isError: state.status === 'error',
    setStatus,
    setProgress,
    setError,
    addResult,
    reset,
    process,
  }
}
