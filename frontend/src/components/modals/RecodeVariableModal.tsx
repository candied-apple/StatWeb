import React, { useState } from 'react';
import { useUIStore } from '@/stores/use-ui-store';
import { useDataset } from '@/hooks/use-datasets';
import { Variable } from '@/types/variable';
import { RecodeRule } from '@/types/dataset';
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
import { Plus, Trash2 } from 'lucide-react';

interface RecodeVariableModalProps {
  variables: Variable[];
}

export const RecodeVariableModal: React.FC<RecodeVariableModalProps> = ({ variables }) => {
  const { activeDatasetId, isRecodeOpen, setRecodeOpen } = useUIStore();
  const { recodeVariable } = useDataset(activeDatasetId);

  const [sourceVar, setSourceVar] = useState(variables[0]?.name || '');
  const [targetVar, setTargetVar] = useState(variables[0]?.name || '');
  const [label, setLabel] = useState('');
  const [rules, setRules] = useState<RecodeRule[]>([
    { old_value: '', new_value: '', is_range: false },
  ]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (variables.length > 0 && !sourceVar) {
      setSourceVar(variables[0].name);
      setTargetVar(variables[0].name + '_kodlu');
    }
  }, [variables]);

  const addRule = () => {
    setRules([...rules, { old_value: '', new_value: '', is_range: false }]);
  };

  const removeRule = (idx: number) => {
    setRules(rules.filter((_, i) => i !== idx));
  };

  const updateRule = (idx: number, patch: Partial<RecodeRule>) => {
    setRules(rules.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceVar || !targetVar.trim() || rules.length === 0) {
      setErrorMsg('Lütfen kaynak, hedef değişken ve en az bir kural tanımlayın.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await recodeVariable({
        source_variable: sourceVar,
        target_variable: targetVar.trim(),
        rules: rules.map((r) => ({
          ...r,
          old_value: r.is_range ? undefined : (isNaN(Number(r.old_value)) ? r.old_value : Number(r.old_value)),
          new_value: isNaN(Number(r.new_value)) ? r.new_value : Number(r.new_value),
        })),
        label: label.trim() || undefined,
      });
      setRecodeOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Yeniden kodlama işlemi başarısız oldu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isRecodeOpen} onOpenChange={setRecodeOpen}>
      <DialogContent className="max-w-xl" onClose={() => setRecodeOpen(false)}>
        <DialogHeader>
          <DialogTitle>Değişkeni Yeniden Kodla (Recode Variable)</DialogTitle>
          <DialogDescription>
            Değerleri veya aralıkları yeni değerlerle eşleyerek kategorize edin veya yeniden kodlayın.
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
              <label className="font-semibold text-slate-700 block mb-1">Kaynak Değişken</label>
              <select
                value={sourceVar}
                onChange={(e) => {
                  setSourceVar(e.target.value);
                  setTargetVar(e.target.value + '_kodlu');
                }}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 focus:outline-none"
              >
                {variables.map((v) => (
                  <option key={v.name} value={v.name}>{v.name} {v.label ? `(${v.label})` : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Hedef Değişken Adı</label>
              <Input
                value={targetVar}
                onChange={(e) => setTargetVar(e.target.value)}
                placeholder="Örn: yas_grubu"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Hedef Değişken Etiketi</label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Örn: Yaş Kategorileri"
            />
          </div>

          {/* Kurallar Tablosu */}
          <div className="border border-slate-300 rounded p-2 bg-slate-50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-700">Eski Değerler $\rightarrow$ Yeni Değer Kuralları:</span>
              <Button type="button" variant="outline" size="sm" onClick={addRule} className="h-6 px-2 text-[11px] bg-white">
                <Plus className="h-3 w-3 mr-1" />
                Kural Ekle
              </Button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {rules.map((rule, idx) => (
                <div key={idx} className="flex items-center space-x-2 bg-white p-2 rounded border border-slate-200">
                  <select
                    value={rule.is_range ? 'range' : 'exact'}
                    onChange={(e) => updateRule(idx, { is_range: e.target.value === 'range' })}
                    className="border border-slate-300 rounded px-1.5 py-1 text-[11px]"
                  >
                    <option value="exact">Tek Değer</option>
                    <option value="range">Aralık (Min - Maks)</option>
                  </select>

                  {rule.is_range ? (
                    <div className="flex items-center space-x-1 flex-1">
                      <Input
                        type="number"
                        placeholder="Min"
                        className="h-7 text-xs"
                        value={rule.range_min ?? ''}
                        onChange={(e) => updateRule(idx, { range_min: parseFloat(e.target.value) })}
                      />
                      <span className="text-slate-400">-</span>
                      <Input
                        type="number"
                        placeholder="Maks"
                        className="h-7 text-xs"
                        value={rule.range_max ?? ''}
                        onChange={(e) => updateRule(idx, { range_max: parseFloat(e.target.value) })}
                      />
                    </div>
                  ) : (
                    <Input
                      placeholder="Eski Değer"
                      className="h-7 text-xs flex-1"
                      value={rule.old_value ?? ''}
                      onChange={(e) => updateRule(idx, { old_value: e.target.value })}
                    />
                  )}

                  <span className="text-slate-400 font-bold">$\rightarrow$</span>

                  <Input
                    placeholder="Yeni Değer"
                    className="h-7 text-xs w-28"
                    value={rule.new_value ?? ''}
                    onChange={(e) => updateRule(idx, { new_value: e.target.value })}
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRule(idx)}
                    disabled={rules.length === 1}
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setRecodeOpen(false)}>
              İptal
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? 'İşleniyor...' : 'Yeniden Kodla (Tamam)'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
