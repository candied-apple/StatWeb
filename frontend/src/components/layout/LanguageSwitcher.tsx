import React from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/i18n';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language.startsWith('en') ? 'en' : 'tr';

  return (
    <div className="flex items-center space-x-1 bg-slate-800 text-slate-300 rounded px-1.5 py-0.5 text-[11px] border border-slate-700">
      <Globe className="h-3 w-3 text-slate-400 mr-0.5" />
      <button
        type="button"
        onClick={() => changeLanguage('tr')}
        className={`px-1.5 py-0.5 rounded transition-colors font-medium ${
          currentLang === 'tr' ? 'bg-blue-600 text-white font-bold' : 'hover:text-white'
        }`}
      >
        TR
      </button>
      <span className="text-slate-600">|</span>
      <button
        type="button"
        onClick={() => changeLanguage('en')}
        className={`px-1.5 py-0.5 rounded transition-colors font-medium ${
          currentLang === 'en' ? 'bg-blue-600 text-white font-bold' : 'hover:text-white'
        }`}
      >
        EN
      </button>
    </div>
  );
};
