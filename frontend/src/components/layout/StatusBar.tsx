import React from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore, WorkspaceTab } from '@/stores/use-ui-store';
import { Table, ListFilter, BarChart2 } from 'lucide-react';
import { Dataset } from '@/types/dataset';

interface StatusBarProps {
  dataset?: Dataset;
}

export const StatusBar: React.FC<StatusBarProps> = ({ dataset }) => {
  const { t } = useTranslation();
  const { activeTab, setActiveTab } = useUIStore();

  const tabs: { id: WorkspaceTab; label: string; icon: React.ReactNode }[] = [
    { id: 'data', label: t('statusBar.dataView'), icon: <Table className="h-3.5 w-3.5 mr-1.5" /> },
    { id: 'variable', label: t('statusBar.variableView'), icon: <ListFilter className="h-3.5 w-3.5 mr-1.5" /> },
    { id: 'output', label: t('statusBar.outputViewer'), icon: <BarChart2 className="h-3.5 w-3.5 mr-1.5" /> },
  ];

  return (
    <footer className="h-8 bg-slate-200 border-t border-slate-300 flex items-center justify-between px-2 text-xs select-none">
      {/* Görünüm Sekmeleri */}
      <div className="flex items-center space-x-1 h-full pt-0.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-3 h-7 text-xs font-medium border-t-2 transition-colors cursor-pointer ${
                isActive
                  ? 'bg-white text-blue-700 border-blue-600 shadow-sm font-semibold'
                  : 'bg-slate-200 text-slate-700 border-transparent hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Durum Bilgisi */}
      <div className="flex items-center space-x-4 text-slate-600 text-[11px]">
        {dataset ? (
          <>
            <span>{dataset.original_filename}</span>
            <span>|</span>
            <span>{dataset.row_count} {t('common.cases')}</span>
            <span>|</span>
            <span>{dataset.column_count} {t('common.variables')}</span>
            <span>|</span>
          </>
        ) : null}
        <span className="flex items-center text-emerald-700 font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block mr-1.5 animate-pulse" />
          {t('statusBar.engineReady')}
        </span>
      </div>
    </footer>
  );
};
