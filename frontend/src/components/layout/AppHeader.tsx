import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  BarChart2,
  Table,
  PlusCircle,
  Play,
} from 'lucide-react';
import { useUIStore } from '@/stores/use-ui-store';
import { Button } from '@/components/ui/button';

export const AppHeader: React.FC = () => {
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
    setActiveTab,
  } = useUIStore();

  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleMenuClick = (menuName: string) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  const closeMenu = () => setActiveMenu(null);

  return (
    <header className="flex flex-col bg-slate-100 border-b border-slate-300 select-none">
      {/* Brand & Window Title */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-900 text-slate-100 text-xs font-semibold">
        <div className="flex items-center space-x-2">
          <FileSpreadsheet className="h-4 w-4 text-blue-400" />
          <span>StatWeb — Statistical Platform (SPSS Academic Workflow)</span>
        </div>
        <div className="text-[11px] text-slate-400">
          Standalone SciPy & Statsmodels Engine | Local Storage Abstraction
        </div>
      </div>

      {/* SPSS Classic Menu Bar */}
      <div className="relative flex items-center px-2 py-0.5 text-xs text-slate-800 bg-slate-200 border-b border-slate-300">
        <div className="flex items-center space-x-1">
          {/* File Menu */}
          <div className="relative">
            <button
              onClick={() => handleMenuClick('file')}
              className={`px-2 py-1 rounded hover:bg-slate-300 ${activeMenu === 'file' ? 'bg-slate-300 font-semibold' : ''}`}
            >
              File
            </button>
            {activeMenu === 'file' && (
              <div
                className="absolute left-0 mt-1 w-48 bg-white border border-slate-300 shadow-lg rounded-sm py-1 z-50 text-xs"
                onClick={closeMenu}
              >
                <button
                  onClick={() => setNewProjectOpen(true)}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center"
                >
                  <PlusCircle className="h-3.5 w-3.5 mr-2 text-slate-500" />
                  New Project...
                </button>
                <button
                  onClick={() => setUploadOpen(true)}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center"
                >
                  <Upload className="h-3.5 w-3.5 mr-2 text-slate-500" />
                  Import Data (CSV, SAV, XLSX)...
                </button>
              </div>
            )}
          </div>

          {/* Analyze Menu */}
          <div className="relative">
            <button
              onClick={() => handleMenuClick('analyze')}
              className={`px-2 py-1 rounded hover:bg-slate-300 ${activeMenu === 'analyze' ? 'bg-slate-300 font-semibold' : ''}`}
            >
              Analyze
            </button>
            {activeMenu === 'analyze' && (
              <div
                className="absolute left-0 mt-1 w-56 bg-white border border-slate-300 shadow-lg rounded-sm py-1 z-50 text-xs"
                onClick={closeMenu}
              >
                <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Descriptive Statistics
                </div>
                <button
                  onClick={() => setDescriptivesOpen(true)}
                  disabled={!activeDatasetId}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Play className="h-3.5 w-3.5 mr-2 text-blue-600" />
                  Descriptives...
                </button>
                <button
                  onClick={() => setFrequenciesOpen(true)}
                  disabled={!activeDatasetId}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Play className="h-3.5 w-3.5 mr-2 text-indigo-600" />
                  Frequencies...
                </button>
                <button
                  onClick={() => setCrosstabsOpen(true)}
                  disabled={!activeDatasetId}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Play className="h-3.5 w-3.5 mr-2 text-purple-600" />
                  Crosstabs...
                </button>

                <div className="border-t border-slate-200 my-1" />
                <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Compare Means
                </div>
                <button
                  onClick={() => setTTestOpen(true)}
                  disabled={!activeDatasetId}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Play className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                  T-Test (Independent / Paired)...
                </button>
                <button
                  onClick={() => setAnovaOpen(true)}
                  disabled={!activeDatasetId}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Play className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                  One-Way ANOVA...
                </button>

                <div className="border-t border-slate-200 my-1" />
                <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Associative Models
                </div>
                <button
                  onClick={() => setCorrelationOpen(true)}
                  disabled={!activeDatasetId}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Play className="h-3.5 w-3.5 mr-2 text-amber-600" />
                  Bivariate Correlations...
                </button>
                <button
                  onClick={() => setRegressionOpen(true)}
                  disabled={!activeDatasetId}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Play className="h-3.5 w-3.5 mr-2 text-amber-600" />
                  Linear Regression...
                </button>
              </div>
            )}
          </div>

          {/* View Menu */}
          <div className="relative">
            <button
              onClick={() => handleMenuClick('view')}
              className={`px-2 py-1 rounded hover:bg-slate-300 ${activeMenu === 'view' ? 'bg-slate-300 font-semibold' : ''}`}
            >
              View
            </button>
            {activeMenu === 'view' && (
              <div
                className="absolute left-0 mt-1 w-44 bg-white border border-slate-300 shadow-lg rounded-sm py-1 z-50 text-xs"
                onClick={closeMenu}
              >
                <button
                  onClick={() => setActiveTab('data')}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center"
                >
                  <Table className="h-3.5 w-3.5 mr-2 text-slate-500" />
                  Data View
                </button>
                <button
                  onClick={() => setActiveTab('variable')}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center"
                >
                  <Table className="h-3.5 w-3.5 mr-2 text-slate-500" />
                  Variable View
                </button>
                <button
                  onClick={() => setActiveTab('output')}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center"
                >
                  <BarChart2 className="h-3.5 w-3.5 mr-2 text-slate-500" />
                  Output Viewer
                </button>
              </div>
            )}
          </div>

          {/* Help Menu */}
          <div className="relative">
            <button
              onClick={() => handleMenuClick('help')}
              className={`px-2 py-1 rounded hover:bg-slate-300 ${activeMenu === 'help' ? 'bg-slate-300 font-semibold' : ''}`}
            >
              Help
            </button>
            {activeMenu === 'help' && (
              <div
                className="absolute left-0 mt-1 w-52 bg-white border border-slate-300 shadow-lg rounded-sm py-1 z-50 text-xs"
                onClick={closeMenu}
              >
                <div className="px-3 py-2 text-slate-600">
                  <p className="font-semibold text-slate-900">StatWeb v0.2.0</p>
                  <p className="mt-1 text-[11px]">SPSS-style web computing platform with SciPy, statsmodels, and WeasyPrint PDF reports.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar with Action Buttons */}
      <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 border-b border-slate-300 text-xs">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setUploadOpen(true)}
          className="h-7 text-xs bg-white shadow-none"
        >
          <Upload className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
          Import Dataset
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
          Descriptives
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={!activeDatasetId}
          onClick={() => setFrequenciesOpen(true)}
          className="h-7 text-xs bg-white shadow-none"
        >
          <Play className="h-3.5 w-3.5 mr-1.5 text-indigo-600" />
          Frequencies
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={!activeDatasetId}
          onClick={() => setCrosstabsOpen(true)}
          className="h-7 text-xs bg-white shadow-none"
        >
          <Play className="h-3.5 w-3.5 mr-1.5 text-purple-600" />
          Crosstabs
        </Button>

        <div className="h-4 w-px bg-slate-300 mx-1" />

        <Button
          variant="outline"
          size="sm"
          onClick={() => setActiveTab('output')}
          className="h-7 text-xs bg-white shadow-none"
        >
          <BarChart2 className="h-3.5 w-3.5 mr-1.5 text-purple-600" />
          Output Viewer
        </Button>
      </div>
    </header>
  );
};
