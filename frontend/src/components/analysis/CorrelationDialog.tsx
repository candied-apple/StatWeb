import React, { useState } from 'react';
import { Variable } from '@/types/variable';
import { useAnalyses } from '@/hooks/use-analyses';
import { useUIStore } from '@/stores/use-ui-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface CorrelationDialogProps {
  datasetId: string;
  variables: Variable[];
}

export const CorrelationDialog: React.FC<CorrelationDialogProps> = ({
  datasetId,
  variables,
}) => {
  const { isCorrelationOpen, setCorrelationOpen, setActiveAnalysis } = useUIStore();
  const { runCorrelation } = useAnalyses(datasetId);

  const candidateVars = variables.map((v) => v.name);
  const [availableList, setAvailableList] = useState<string[]>([]);
  const [selectedList, setSelectedList] = useState<string[]>([]);
  const [selectedAvailable, setSelectedAvailable] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (isCorrelationOpen) {
      setAvailableList(candidateVars);
      setSelectedList([]);
      setSelectedAvailable(null);
      setSelectedTarget(null);
      setErrorMsg(null);
    }
  }, [isCorrelationOpen, datasetId]);

  const moveToTarget = () => {
    if (selectedAvailable && !selectedList.includes(selectedAvailable)) {
      const nextSelected = [...selectedList, selectedAvailable];
      const nextAvailable = availableList.filter((v) => v !== selectedAvailable);
      setSelectedList(nextSelected);
      setAvailableList(nextAvailable);
      setSelectedAvailable(null);
    }
  };

  const moveToAvailable = () => {
    if (selectedTarget && !availableList.includes(selectedTarget)) {
      const nextAvailable = [...availableList, selectedTarget];
      const nextSelected = selectedList.filter((v) => v !== selectedTarget);
      setAvailableList(nextAvailable);
      setSelectedList(nextSelected);
      setSelectedTarget(null);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedList.length < 2) {
      setErrorMsg('İki değişkenli korelasyonu hesaplamak için lütfen en az 2 değişken seçin.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await runCorrelation({
        dataset_id: datasetId,
        variable_names: selectedList,
      });
      setCorrelationOpen(false);
      setActiveAnalysis(result.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Korelasyon matrisi hesaplanamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isCorrelationOpen} onOpenChange={setCorrelationOpen}>
      <DialogContent className="max-w-xl" onClose={() => setCorrelationOpen(false)}>
        <DialogHeader>
          <DialogTitle>İki Değişkenli Korelasyonlar</DialogTitle>
          <DialogDescription>
            İki yönlü anlamlılık testleri ile Pearson ve Spearman sıra korelasyon katsayılarını hesaplayın.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          {errorMsg && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center my-3 text-xs">
            <div className="flex flex-col h-60 border border-slate-300 rounded bg-slate-50">
              <div className="px-2 py-1 bg-slate-100 font-semibold border-b border-slate-200 text-slate-700">
                Değişkenler:
              </div>
              <div className="flex-1 overflow-y-auto p-1 bg-white">
                {availableList.map((vName) => (
                  <div
                    key={vName}
                    onClick={() => setSelectedAvailable(vName)}
                    onDoubleClick={moveToTarget}
                    className={`px-2 py-1 rounded cursor-pointer ${
                      selectedAvailable === vName ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    {vName}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <Button type="button" variant="outline" size="sm" disabled={!selectedAvailable} onClick={moveToTarget} className="h-8 w-8 p-0">
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={!selectedTarget} onClick={moveToAvailable} className="h-8 w-8 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-col h-60 border border-slate-300 rounded bg-slate-50">
              <div className="px-2 py-1 bg-slate-100 font-semibold border-b border-slate-200 text-slate-700">
                Seçilen Değişkenler:
              </div>
              <div className="flex-1 overflow-y-auto p-1 bg-white">
                {selectedList.map((vName) => (
                  <div
                    key={vName}
                    onClick={() => setSelectedTarget(vName)}
                    onDoubleClick={moveToAvailable}
                    className={`px-2 py-1 rounded cursor-pointer ${
                      selectedTarget === vName ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    {vName}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setCorrelationOpen(false)}>
              İptal
            </Button>
            <Button type="submit" size="sm" disabled={selectedList.length < 2 || loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? 'Hesaplanıyor...' : 'Korelasyonları Hesapla (Tamam)'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
