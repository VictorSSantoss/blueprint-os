import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language } from '../i18n';
import { translations, type TranslationKey } from '../i18n';

interface SettingsState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

// Detect browser language from multiple sources
const detectLanguage = (): Language => {
  // Check multiple browser language sources
  const languages: string[] = [];

  // Primary language
  if (navigator.language) {
    languages.push(navigator.language.toLowerCase());
  }

  // All preferred languages (ordered by preference)
  if (navigator.languages && navigator.languages.length > 0) {
    languages.push(...navigator.languages.map(l => l.toLowerCase()));
  }

  // Check URL parameter for language override (useful for testing)
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  if (urlLang) {
    languages.unshift(urlLang.toLowerCase());
  }

  // Check for Turkish language codes
  for (const lang of languages) {
    if (lang.startsWith('tr') || lang === 'tr-tr' || lang === 'tr-cy') {
      return 'tr';
    }
  }

  return 'en';
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      language: detectLanguage(),

      setLanguage: (lang) => {
        set({ language: lang });
      },

      t: (key) => {
        const { language } = get();
        return translations[language][key] || translations.en[key] || key;
      },
    }),
    {
      name: 'floor-maker-settings',
      partialize: (state) => ({ language: state.language }),
    }
  )
);

// Helper hook for translations
export const useTranslation = () => {
  const { t, language, setLanguage } = useSettingsStore();
  return { t, language, setLanguage };
};
