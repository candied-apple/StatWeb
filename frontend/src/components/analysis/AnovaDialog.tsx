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

interface AnovaDialogProps {
  datasetId: string;
  variables: Variable[];
}

export const AnovaDialog: React.FC<AnovaDialogProps> = ({
  datasetId,
  variables,
}) => {
  const { isAnovaOpen, setAnovaOpen, setActiveAnalysis } = useUIStore();
  const { runAnova } = useAnalyses(datasetId);

  const [depVar, setDepVar] = useState<string>(variables[0]?.name || '');
  const [factorVar, setFactorVar] = useState<string>(variables[1]?.name || variables[0]?.name || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (variables.length >= 2) {
      setDepVar(variables[0].name);
      setFactorVar(variables[1].name);
    }
  }, [variables]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depVar || !factorVar) {
      setErrorMsg('Lütfen hem bağımlı değişkeni hem faktör değişkenini seçin.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await runAnova({
        dataset_id: datasetId,
        dependent_variable: depVar,
        factor_variable: factorVar,
      });
      setAnovaOpen(false);
      setActiveAnalysis(result.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'ANOVA testi hesaplanamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isAnovaOpen} onOpenChange={setAnovaOpen}>
      <DialogContent onClose={() => setAnovaOpen(false)}>
        <DialogHeader>
          <DialogTitle>Tek Yönlü ANOVA (Varyans Analizi)</DialogTitle>
          <DialogDescription>
            Gruplar arası ve grup içi kareler toplamı ile grup ortalamaları arasındaki anlamlı farklılıkları test edin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Bağımlı Değişken (Sürekli)</label>
            <select
              value={depVar}
              onChange={(e) => setDepVar(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 focus:outline-none"
            >
              {variables.map((v) => (
                <option key={v.id} value={v.name}>{v.name} {v.label ? `(${v.label})` : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Faktör (Kategorik Gruplar)</label>
            <select
              value={factorVar}
              onChange={(e) => setFactorVar(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 focus:outline-none"
            >
              {variables.map((v) => (
                <option key={v.id} value={v.name}>{v.name} {v.label ? `(${v.label})` : ''}</option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setAnovaOpen(false)}>
              İptal
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? 'Hesaplanıyor...' : 'ANOVA Testini Çalıştır (Tamam)'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
