import React, { useState } from 'react';
import { useUIStore } from '@/stores/use-ui-store';
import { useDataset } from '@/hooks/use-datasets';
import { Variable } from '@/types/variable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ComputeVariableModalProps {
  variables: Variable[];
}

export const ComputeVariableModal: React.FC<ComputeVariableModalProps> = ({ variables }) => {
  const { activeDatasetId, isComputeOpen, setComputeOpen } = useUIStore();
  const { computeVariable } = useDataset(activeDatasetId);

  const [targetVar, setTargetVar] = useState('');
  const [label, setLabel] = useState('');
  const [expression, setExpression] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const insertToken = (token: string) => {
    setExpression((prev) => prev + token);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetVar.trim() || !expression.trim()) {
      setErrorMsg('Lütfen hedef değişken adını ve hesaplama ifadesini girin.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await computeVariable({
        target_variable: targetVar.trim(),
        expression: expression.trim(),
        label: label.trim() || undefined,
      });
      setTargetVar('');
      setLabel('');
      setExpression('');
      setComputeOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Değişken hesaplanamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isComputeOpen} onOpenChange={setComputeOpen}>
      <DialogContent className="max-w-2xl" onClose={() => setComputeOpen(false)}>
        <DialogHeader>
          <DialogTitle>Değişken Hesapla (Compute Variable)</DialogTitle>
          <DialogDescription>
            Mevcut değişkenler ve matematiksel işlemlerle yeni bir değişken türetin (SPSS Transform / Compute).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {errorMsg && (
            <div className="p-2 bg-red-50 border border-red-200 text-red-700 rounded">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Hedef Değişken Adı</label>
              <Input
                value={targetVar}
                onChange={(e) => setTargetVar(e.target.value)}
                placeholder="toplam_puan"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Hedef Değişken Etiketi (Opsiyonel)</label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Örn: Ölçek Toplam Puanı"
              />
            </div>
          </div>

          <div className="grid grid-cols-[1fr_2fr] gap-3">
            {/* Değişken Listesi */}
            <div className="flex flex-col border border-slate-300 rounded bg-slate-50 h-52">
              <div className="px-2 py-1 font-semibold border-b border-slate-200 bg-slate-100 text-slate-700">
                Değişkenler:
              </div>
              <div className="flex-1 overflow-y-auto p-1 bg-white">
                {variables.map((v) => (
                  <div
                    key={v.name}
                    onDoubleClick={() => insertToken(v.name)}
                    className="px-2 py-1 rounded cursor-pointer hover:bg-blue-50 text-slate-800 truncate"
                    title="İfadeye eklemek için çift tıklayın"
                  >
                    {v.name}
                  </div>
                ))}
              </div>
            </div>

            {/* İfade Editörü & Tuş Takımı */}
            <div className="flex flex-col space-y-2">
              <label className="font-semibold text-slate-700 block">Sayısal İfade =</label>
              <textarea
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                rows={3}
                placeholder="Örn: (v1 + v2) / 2 veya sqrt(gelir)"
                className="w-full p-2 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />

              {/* Hızlı İşlem Tuşları */}
              <div className="grid grid-cols-6 gap-1">
                {['+', '-', '*', '/', '(', ')', '**', 'sqrt(', 'log(', 'abs(', 'round(', '0'].map((btn) => (
                  <button
                    key={btn}
                    type="button"
                    onClick={() => insertToken(btn)}
                    className="py-1 px-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-800 font-mono text-center font-medium"
                  >
                    {btn}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setComputeOpen(false)}>
              İptal
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? 'Hesaplanıyor...' : 'Değişkeni Hesapla (Tamam)'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
