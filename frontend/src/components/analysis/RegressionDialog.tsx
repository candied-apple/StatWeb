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

interface RegressionDialogProps {
  datasetId: string;
  variables: Variable[];
}

export const RegressionDialog: React.FC<RegressionDialogProps> = ({
  datasetId,
  variables,
}) => {
  const { isRegressionOpen, setRegressionOpen, setActiveAnalysis } = useUIStore();
  const { runRegression } = useAnalyses(datasetId);

  const candidateVars = variables.map((v) => v.name);
  const [depVar, setDepVar] = useState<string>(candidateVars[0] || '');
  const [availableList, setAvailableList] = useState<string[]>([]);
  const [selectedIndeps, setSelectedIndeps] = useState<string[]>([]);
  const [selectedAvailable, setSelectedAvailable] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (isRegressionOpen) {
      const defaultDep = candidateVars[0] || '';
      setDepVar(defaultDep);
      setAvailableList(candidateVars.filter((v) => v !== defaultDep));
      setSelectedIndeps([]);
      setSelectedAvailable(null);
      setSelectedTarget(null);
      setErrorMsg(null);
    }
  }, [isRegressionOpen, datasetId]);

  const handleDepChange = (newDep: string) => {
    setDepVar(newDep);
    setAvailableList(candidateVars.filter((v) => v !== newDep && !selectedIndeps.includes(v)));
    setSelectedIndeps((prev) => prev.filter((v) => v !== newDep));
  };

  const moveToTarget = () => {
    if (selectedAvailable && !selectedIndeps.includes(selectedAvailable)) {
      setSelectedIndeps((prev) => [...prev, selectedAvailable]);
      setAvailableList((prev) => prev.filter((v) => v !== selectedAvailable));
      setSelectedAvailable(null);
    }
  };

  const moveToAvailable = () => {
    if (selectedTarget && !availableList.includes(selectedTarget)) {
      setAvailableList((prev) => [...prev, selectedTarget]);
      setSelectedIndeps((prev) => prev.filter((v) => v !== selectedTarget));
      setSelectedTarget(null);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depVar) {
      setErrorMsg('Lütfen bir bağımlı değişken seçin.');
      return;
    }
    if (selectedIndeps.length === 0) {
      setErrorMsg('Lütfen en az bir bağımsız (yordayıcı) değişken seçin.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await runRegression({
        dataset_id: datasetId,
        dependent_variable: depVar,
        independent_variables: selectedIndeps,
      });
      setRegressionOpen(false);
      setActiveAnalysis(result.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Doğrusal regresyon hesaplanamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isRegressionOpen} onOpenChange={setRegressionOpen}>
      <DialogContent className="max-w-xl" onClose={() => setRegressionOpen(false)}>
        <DialogHeader>
          <DialogTitle>Doğrusal Regresyon Analizi</DialogTitle>
          <DialogDescription>
            En Küçük Kareler (OLS) yöntemiyle Model Özeti, ANOVA ve Katsayı tanılarını hesaplayın.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-3 text-xs">
          {errorMsg && (
            <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Bağımlı Değişken (Y)</label>
            <select
              value={depVar}
              onChange={(e) => handleDepChange(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 focus:outline-none"
            >
              {candidateVars.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Bağımsız Değişken(ler) (X)</label>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
              <div className="flex flex-col h-48 border border-slate-300 rounded bg-slate-50">
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

              <div className="flex flex-col h-48 border border-slate-300 rounded bg-slate-50">
                <div className="px-2 py-1 bg-slate-100 font-semibold border-b border-slate-200 text-slate-700">
                  Yordayıcılar (Bağımsız):
                </div>
                <div className="flex-1 overflow-y-auto p-1 bg-white">
                  {selectedIndeps.map((vName) => (
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
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setRegressionOpen(false)}>
              İptal
            </Button>
            <Button type="submit" size="sm" disabled={selectedIndeps.length === 0 || loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? 'Hesaplanıyor...' : 'Regresyonu Çalıştır (Tamam)'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
