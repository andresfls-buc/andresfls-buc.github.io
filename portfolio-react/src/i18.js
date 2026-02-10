import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector'; // 1. Import this

import en from './locales/en.json';
import es from './locales/es.json';
import ja from './locales/ja.json';

// src/i18.js
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      ja: { translation: ja },
    },
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'cookie', 'htmlTag'],
      caches: ['localStorage'],
    },
    react: {
      // This is the "Magic" setting that forces React to 
      // re-render when changeLanguage is called
      bindI18n: 'languageChanged', 
      useSuspense: false
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;