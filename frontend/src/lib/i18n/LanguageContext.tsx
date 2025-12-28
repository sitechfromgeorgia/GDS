'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { en } from './translations/en'
import { ka } from './translations/ka'
import { logger } from '@/lib/logger'

type Language = 'en' | 'ka'
type Translations = typeof en

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('ka') // Default to Georgian

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language
    if (savedLang && (savedLang === 'en' || savedLang === 'ka')) {
      setLanguage(savedLang)
    }
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('language', lang)
  }

  const t = (path: string): string => {
    const keys = path.split('.')
    let current: any = language === 'en' ? en : ka

    for (const key of keys) {
      if (current[key] === undefined) {
        logger.warn(`Translation missing for key: ${path}`)
        return path
      }
      current = current[key]
    }

    return current as string
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
