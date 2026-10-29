import React, { useState } from 'react';
import { useUIStore } from '@/stores/use-ui-store';
import { useDataset, useDatasetData } from '@/hooks/use-datasets';
import { useVariables } from '@/hooks/use-variables';
import { useAnalysisRun } from '@/hooks/use-analyses';
import { DataViewGrid } from '@/components/spreadsheet/DataViewGrid';
import { VariableViewGrid } from '@/components/spreadsheet/VariableViewGrid';
import { AnalysisResultsViewer } from '@/components/analysis/AnalysisResultsViewer';
import { DescriptivesDialog } from '@/components/analysis/DescriptivesDialog';
import { FrequenciesDialog } from '@/components/analysis/FrequenciesDialog';
import { CrosstabsDialog } from '@/components/analysis/CrosstabsDialog';
import { TTestDialog } from '@/components/analysis/TTestDialog';
import { AnovaDialog } from '@/components/analysis/AnovaDialog';
import { CorrelationDialog } from '@/components/analysis/CorrelationDialog';
import { RegressionDialog } from '@/components/analysis/RegressionDialog';
import { UploadDatasetModal } from '@/components/modals/UploadDatasetModal';
import { NewProjectModal } from '@/components/modals/NewProjectModal';
import { AddVariableModal } from '@/components/modals/AddVariableModal';
import { ComputeVariableModal } from '@/components/modals/ComputeVariableModal';
import { RecodeVariableModal } from '@/components/modals/RecodeVariableModal';
import { ValueLabelsModal } from '@/components/modals/ValueLabelsModal';
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

  const {
    dataset,
    isLoading: isDatasetLoading,
    updateCells,
    addRow,
    exportDataset,
  } = useDataset(activeDatasetId);

  const { data: dataPage, isLoading: isDataLoading } = useDatasetData(
    activeDatasetId,
    dataOffset,
    dataLimit
  );
  const { updateVariable } = useVariables(activeDatasetId || undefined);
  const { data: analysisRun } = useAnalysisRun(activeAnalysisId);

  React.useEffect(() => {
    setDataOffset(0);
  }, [activeDatasetId]);

  if (!activeDatasetId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-inner">
          <FileSpreadsheet className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Açık Veri Seti Yok</h2>
        <p className="text-xs text-slate-500 max-w-md mt-1 mb-6">
          StatWeb, SPSS tarzı akademik bir istatistiksel analiz ortamı sunar. Mevcut bir veri setini içe aktarın (CSV, Excel veya SPSS .sav) ya da yeni bir proje çalışma alanı oluşturun.
        </p>

        <div className="flex items-center space-x-3">
          <Button
            variant="default"
            size="sm"
            onClick={() => setUploadOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Veri Seti İçe Aktar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNewProjectOpen(true)}
            className="bg-white"
          >
            <Database className="h-3.5 w-3.5 mr-1.5 text-slate-600" />
            Yeni Proje
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
      {/* Görünüm Yönlendirici */}
      {activeTab === 'data' && (
        <DataViewGrid
          variables={variables}
          dataRows={dataPage?.rows || []}
          totalRows={dataset?.row_count || 0}
          offset={dataOffset}
          limit={dataLimit}
          onOffsetChange={setDataOffset}
          onUpdateCells={updateCells}
          onAddRow={() => addRow()}
          onExport={exportDataset}
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

      {/* Analiz & İşlem Modalları */}
      {dataset && (
        <>
          <DescriptivesDialog datasetId={dataset.id} variables={variables} />
          <FrequenciesDialog datasetId={dataset.id} variables={variables} />
          <CrosstabsDialog datasetId={dataset.id} variables={variables} />
          <TTestDialog datasetId={dataset.id} variables={variables} />
          <AnovaDialog datasetId={dataset.id} variables={variables} />
          <CorrelationDialog datasetId={dataset.id} variables={variables} />
          <RegressionDialog datasetId={dataset.id} variables={variables} />
          <AddVariableModal />
          <ComputeVariableModal variables={variables} />
          <RecodeVariableModal variables={variables} />
          <ValueLabelsModal variables={variables} datasetId={dataset.id} />
        </>
      )}

      <UploadDatasetModal />
      <NewProjectModal />
    </div>
  );
};
