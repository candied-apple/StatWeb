import React, { useState } from 'react';
import { useUIStore } from '@/stores/use-ui-store';
import { useDataset, useDatasetData } from '@/hooks/use-datasets';
import { useVariables } from '@/hooks/use-variables';
import { useAnalysisRun } from '@/hooks/use-analyses';
import { DataViewGrid } from '@/components/spreadsheet/DataViewGrid';
import { VariableViewGrid } from '@/components/spreadsheet/VariableViewGrid';
import { AnalysisResultsViewer } from '@/components/analysis/AnalysisResultsViewer';
import { DescriptivesDialog } from '@/components/analysis/DescriptivesDialog';
import { UploadDatasetModal } from '@/components/modals/UploadDatasetModal';
import { NewProjectModal } from '@/components/modals/NewProjectModal';
import { FileSpreadsheet, Upload, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const DatasetWorkspace: React.FC = () => {
  const {
    activeDatasetId,
    activeTab,
    activeAnalysisId,
    setUploadOpen,
    setNewProjectOpen,
  } = useUIStore();

  const [dataOffset, setDataOffset] = useState<number>(0);
  const dataLimit = 50;

  const { dataset, isLoading: isDatasetLoading } = useDataset(activeDatasetId);
  const { data: dataPage, isLoading: isDataLoading } = useDatasetData(
    activeDatasetId,
    dataOffset,
    dataLimit
  );
  const { updateVariable } = useVariables(activeDatasetId || undefined);
  const { data: analysisRun } = useAnalysisRun(activeAnalysisId);

  // Reset offset when dataset changes
  React.useEffect(() => {
    setDataOffset(0);
  }, [activeDatasetId]);

  if (!activeDatasetId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-inner">
          <FileSpreadsheet className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">No Dataset Open</h2>
        <p className="text-xs text-slate-500 max-w-md mt-1 mb-6">
          StatWeb provides an SPSS-style statistical analysis environment. Import an existing dataset (CSV, Excel, or SPSS .sav) or create a new project workspace.
        </p>

        <div className="flex items-center space-x-3">
          <Button
            variant="default"
            size="sm"
            onClick={() => setUploadOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Import Dataset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNewProjectOpen(true)}
            className="bg-white"
          >
            <Database className="h-3.5 w-3.5 mr-1.5 text-slate-600" />
            New Project
          </Button>
        </div>

        <UploadDatasetModal />
        <NewProjectModal />
      </div>
    );
  }

  const variables = dataset?.variables || [];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white relative">
      {/* View router */}
      {activeTab === 'data' && (
        <DataViewGrid
          variables={variables}
          dataRows={dataPage?.rows || []}
          totalRows={dataset?.row_count || 0}
          offset={dataOffset}
          limit={dataLimit}
          onOffsetChange={setDataOffset}
          isLoading={isDatasetLoading || isDataLoading}
        />
      )}

      {activeTab === 'variable' && (
        <VariableViewGrid
          variables={variables}
          onUpdateVariable={(varId, updates) =>
            updateVariable({ variableId: varId, data: updates })
          }
        />
      )}

      {activeTab === 'output' && (
        <AnalysisResultsViewer analysisRun={analysisRun} />
      )}

      {/* Analysis & Upload Dialogs */}
      {dataset && (
        <DescriptivesDialog
          datasetId={dataset.id}
          variables={variables}
        />
      )}
      <UploadDatasetModal />
      <NewProjectModal />
    </div>
  );
};
