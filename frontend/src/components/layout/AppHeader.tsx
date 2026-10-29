import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileSpreadsheet,
  Upload,
  BarChart2,
  Table,
  PlusCircle,
  Play,
  Calculator,
  Shuffle,
  Download,
  Plus,
} from 'lucide-react';
import { useUIStore } from '@/stores/use-ui-store';
import { useDataset } from '@/hooks/use-datasets';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from './LanguageSwitcher';

export const AppHeader: React.FC = () => {
  const { t } = useTranslation();
  const {
    activeDatasetId,
    setUploadOpen,
    setDescriptivesOpen,
    setFrequenciesOpen,
    setCrosstabsOpen,
    setTTestOpen,
    setAnovaOpen,
    setCorrelationOpen,
    setRegressionOpen,
    setNewProjectOpen,
    setComputeOpen,
    setRecodeOpen,
    setAddVariableOpen,
    setActiveTab,
  } = useUIStore();

  const { exportDataset } = useDataset(activeDatasetId);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleMenuClick = (menuName: string) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  const closeMenu = () => setActiveMenu(null);

  return (
    <header className="flex flex-col bg-slate-100 border-b border-slate-300 select-none">
      {/* Üst Bilgi Başlığı */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-900 text-slate-100 text-xs font-semibold">
        <div className="flex items-center space-x-2">
          <FileSpreadsheet className="h-4 w-4 text-blue-400" />
          <span>{t('common.appName')} — {t('common.tagline')}</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            {t('common.backendEngineInfo')}
          </span>
          <LanguageSwitcher />
        </div>
      </div>

      {/* SPSS Klasik Menü Çubuğu */}
      <div className="relative flex items-center px-2 py-0.5 text-xs text-slate-800 bg-slate-200 border-b border-slate-300">
        <div className="flex items-center space-x-1">
          {/* 1. Dosya Menüsü */}
          <div className="relative">
            <button
              onClick={() => handleMenuClick('file')}
              className={`px-2 py-1 rounded hover:bg-slate-300 ${activeMenu === 'file' ? 'bg-slate-300 font-semibold' : ''}`}
            >
              {t('menu.file')}
            </button>
            {activeMenu === 'file' && (
              <div
                className="absolute left-0 mt-1 w-56 bg-white border border-slate-300 shadow-lg rounded-sm py-1 z-50 text-xs"
                onClick={closeMenu}
              >
                <button
                  onClick={() => setNewProjectOpen(true)}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center"
                >
                  <PlusCircle className="h-3.5 w-3.5 mr-2 text-slate-500" />
                  {t('menu.newProject')}
                </button>
                <button
                  onClick={() => setUploadOpen(true)}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center"
                >
                  <Upload className="h-3.5 w-3.5 mr-2 text-slate-500" />
                  {t('menu.importData')}
                </button>
                <div className="border-t border-slate-200 my-1" />
                <button
                  onClick={() => exportDataset('csv')}
                  disabled={!activeDatasetId}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center disabled:opacity-40"
                >
                  <Download className="h-3.5 w-3.5 mr-2 text-slate-500" />
                  {t('menu.exportCsv')}
                </button>
                <button
                  onClick={() => exportDataset('xlsx')}
                  disabled={!activeDatasetId}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center disabled:opacity-40"
                >
                  <Download className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                  {t('menu.exportXlsx')}
                </button>
              </div>
            )}
          </div>

          {/* 2. Dönüştür Menüsü (Transform) */}
          <div className="relative">
            <button
              onClick={() => handleMenuClick('transform')}
              className={`px-2 py-1 rounded hover:bg-slate-300 ${activeMenu === 'transform' ? 'bg-slate-300 font-semibold' : ''}`}
            >
              {t('menu.transform')}
            </button>
            {activeMenu === 'transform' && (
              <div
                className="absolute left-0 mt-1 w-64 bg-white border border-slate-300 shadow-lg rounded-sm py-1 z-50 text-xs"
                onClick={closeMenu}
              >
                <button
                  onClick={() => setComputeOpen(true)}
                  disabled={!activeDatasetId}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center disabled:opacity-40"
                >
                  <Calculator className="h-3.5 w-3.5 mr-2 text-blue-600" />
                  {t('menu.computeVariable')}
                </button>
                <button
                  onClick={() => setRecodeOpen(true)}
                  disabled={!activeDatasetId}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center disabled:opacity-40"
                >
                  <Shuffle className="h-3.5 w-3.5 mr-2 text-indigo-600" />
                  {t('menu.recodeVariable')}
                </button>
                <div className="border-t border-slate-200 my-1" />
                <button
                  onClick={() => setAddVariableOpen(true)}
                  disabled={!activeDatasetId}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5 mr-2 text-slate-500" />
                  {t('menu.addVariable')}
                </button>
              </div>
            )}
          </div>

          {/* 3. Çözümle Menüsü (Analyze) */}
          <div className="relative">
            <button
              onClick={() => handleMenuClick('analyze')}
              className={`px-2 py-1 rounded hover:bg-slate-300 ${activeMenu === 'analyze' ? 'bg-slate-300 font-semibold' : ''}`}
            >
              {t('menu.analyze')}
            </button>
            {activeMenu === 'analyze' && (
              <div
                className="absolute left-0 mt-1 w-64 bg-white border border-slate-300 shadow-lg rounded-sm py-1 z-50 text-xs"
                onClick={closeMenu}
              >
                <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {t('menu.descriptiveStats')}
                </div>
                <button
                  onClick={() => setDescriptivesOpen(true)}
                  disabled={!activeDatasetId}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Play className="h-3.5 w-3.5 mr-2 text-blue-600" />
                  {t('menu.descriptives')}
                </button>
                <button
                  onClick={() => setFrequenciesOpen(true)}
                  disabled={!activeDatasetId}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Play className="h-3.5 w-3.5 mr-2 text-indigo-600" />
                  {t('menu.frequencies')}
                </button>
                <button
                  onClick={() => setCrosstabsOpen(true)}
                  disabled={!activeDatasetId}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Play className="h-3.5 w-3.5 mr-2 text-purple-600" />
                  {t('menu.crosstabs')}
                </button>

                <div className="border-t border-slate-200 my-1" />
                <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {t('menu.compareMeans')}
                </div>
                <button
                  onClick={() => setTTestOpen(true)}
                  disabled={!activeDatasetId}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Play className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                  {t('menu.tTest')}
                </button>
                <button
                  onClick={() => setAnovaOpen(true)}
                  disabled={!activeDatasetId}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Play className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                  {t('menu.anova')}
                </button>

                <div className="border-t border-slate-200 my-1" />
                <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {t('menu.relationalModels')}
                </div>
                <button
                  onClick={() => setCorrelationOpen(true)}
                  disabled={!activeDatasetId}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Play className="h-3.5 w-3.5 mr-2 text-amber-600" />
                  {t('menu.correlate')}
                </button>
                <button
                  onClick={() => setRegressionOpen(true)}
                  disabled={!activeDatasetId}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Play className="h-3.5 w-3.5 mr-2 text-amber-600" />
                  {t('menu.regression')}
                </button>
              </div>
            )}
          </div>

          {/* 4. Görünüm Menüsü */}
          <div className="relative">
            <button
              onClick={() => handleMenuClick('view')}
              className={`px-2 py-1 rounded hover:bg-slate-300 ${activeMenu === 'view' ? 'bg-slate-300 font-semibold' : ''}`}
            >
              {t('menu.view')}
            </button>
            {activeMenu === 'view' && (
              <div
                className="absolute left-0 mt-1 w-48 bg-white border border-slate-300 shadow-lg rounded-sm py-1 z-50 text-xs"
                onClick={closeMenu}
              >
                <button
                  onClick={() => setActiveTab('data')}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center"
                >
                  <Table className="h-3.5 w-3.5 mr-2 text-slate-500" />
                  {t('menu.dataView')}
                </button>
                <button
                  onClick={() => setActiveTab('variable')}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center"
                >
                  <Table className="h-3.5 w-3.5 mr-2 text-slate-500" />
                  {t('menu.variableView')}
                </button>
                <button
                  onClick={() => setActiveTab('output')}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center"
                >
                  <BarChart2 className="h-3.5 w-3.5 mr-2 text-slate-500" />
                  {t('menu.outputViewer')}
                </button>
              </div>
            )}
          </div>

          {/* 5. Yardım Menüsü */}
          <div className="relative">
            <button
              onClick={() => handleMenuClick('help')}
              className={`px-2 py-1 rounded hover:bg-slate-300 ${activeMenu === 'help' ? 'bg-slate-300 font-semibold' : ''}`}
            >
              {t('menu.help')}
            </button>
            {activeMenu === 'help' && (
              <div
                className="absolute left-0 mt-1 w-64 bg-white border border-slate-300 shadow-lg rounded-sm py-1 z-50 text-xs"
                onClick={closeMenu}
              >
                <div className="px-3 py-2 text-slate-600">
                  <p className="font-semibold text-slate-900">{t('menu.aboutTitle')}</p>
                  <p className="mt-1 text-[11px]">{t('menu.aboutText')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hızlı İşlem Araç Çubuğu */}
      <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 border-b border-slate-300 text-xs">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setUploadOpen(true)}
          className="h-7 text-xs bg-white shadow-none"
        >
          <Upload className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
          {t('menu.importData').replace('...', '')}
        </Button>

        <div className="h-4 w-px bg-slate-300 mx-1" />

        <Button
          variant="outline"
          size="sm"
          disabled={!activeDatasetId}
          onClick={() => setComputeOpen(true)}
          className="h-7 text-xs bg-white shadow-none"
        >
          <Calculator className="h-3.5 w-3.5 mr-1 text-blue-600" />
          {t('menu.computeVariable').replace('...', '')}
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={!activeDatasetId}
          onClick={() => setRecodeOpen(true)}
          className="h-7 text-xs bg-white shadow-none"
        >
          <Shuffle className="h-3.5 w-3.5 mr-1 text-indigo-600" />
          {t('menu.recodeVariable').replace('...', '')}
        </Button>

        <div className="h-4 w-px bg-slate-300 mx-1" />

        <Button
          variant="default"
          size="sm"
          disabled={!activeDatasetId}
          onClick={() => setDescriptivesOpen(true)}
          className="h-7 text-xs bg-blue-700 hover:bg-blue-800 text-white"
        >
          <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
          {t('menu.descriptiveStats')}
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={!activeDatasetId}
          onClick={() => setFrequenciesOpen(true)}
          className="h-7 text-xs bg-white shadow-none"
        >
          <Play className="h-3.5 w-3.5 mr-1.5 text-indigo-600" />
          {t('menu.frequencies').replace('...', '')}
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={!activeDatasetId}
          onClick={() => setCrosstabsOpen(true)}
          className="h-7 text-xs bg-white shadow-none"
        >
          <Play className="h-3.5 w-3.5 mr-1.5 text-purple-600" />
          {t('menu.crosstabs').replace('...', '')}
        </Button>

        <div className="h-4 w-px bg-slate-300 mx-1" />

        <Button
          variant="outline"
          size="sm"
          onClick={() => setActiveTab('output')}
          className="h-7 text-xs bg-white shadow-none"
        >
          <BarChart2 className="h-3.5 w-3.5 mr-1.5 text-purple-600" />
          {t('menu.outputViewer')}
        </Button>
      </div>
    </header>
  );
};
