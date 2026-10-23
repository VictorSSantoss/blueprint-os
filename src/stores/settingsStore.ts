import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language } from '../i18n';
import { translations, type TranslationKey } from '../i18n';

interface SettingsState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const detectLanguage = (): Language => {
  const urlLang = new URLSearchParams(window.location.search).get('lang');
  if (urlLang === 'en') return 'en';
  return 'pt-BR';
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
      name: 'blueprint-os-settings',
      partialize: (state) => ({ language: state.language }),
    }
  )
);

// Helper hook for translations
export const useTranslation = () => {
  const { t, language, setLanguage } = useSettingsStore();
  return { t, language, setLanguage };
};
