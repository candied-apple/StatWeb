import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { tr } from './locales/tr';
import { en } from './locales/en';

const savedLang = (localStorage.getItem('statweb_lang') as 'tr' | 'en') || 'tr';

i18n.use(initReactI18next).init({
  resources: {
    tr: { translation: tr },
    en: { translation: en },
  },
  lng: savedLang,
  fallbackLng: 'tr',
  interpolation: {
    escapeValue: false,
  },
});

export const changeLanguage = (lang: 'tr' | 'en') => {
  i18n.changeLanguage(lang);
  localStorage.setItem('statweb_lang', lang);
  document.documentElement.lang = lang;
};

export default i18n;
