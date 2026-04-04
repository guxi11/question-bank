import React, { createContext, useContext, useEffect, useReducer } from 'react'
import { type AppState } from '../types'
import { reducer, type Action } from './reducer'
import { load, save, KEYS } from '../lib/storage'

const initState = (): AppState => ({
  questions: load(KEYS.questions, []),
  currentSession: load(KEYS.session, null),
  history: load(KEYS.history, []),
  favorites: load(KEYS.favorites, []),
})

interface Ctx {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const AppContext = createContext<Ctx | null>(null)

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, undefined, initState)

  useEffect(() => { save(KEYS.questions, state.questions) }, [state.questions])
  useEffect(() => { save(KEYS.session, state.currentSession) }, [state.currentSession])
  useEffect(() => { save(KEYS.history, state.history) }, [state.history])
  useEffect(() => { save(KEYS.favorites, state.favorites) }, [state.favorites])

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export const useApp = (): Ctx => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
