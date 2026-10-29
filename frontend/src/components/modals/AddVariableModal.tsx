import React, { useState } from 'react';
import { useUIStore } from '@/stores/use-ui-store';
import { useDataset } from '@/hooks/use-datasets';
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

export const AddVariableModal: React.FC = () => {
  const { activeDatasetId, isAddVariableOpen, setAddVariableOpen } = useUIStore();
  const { addVariable } = useDataset(activeDatasetId);

  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [dataType, setDataType] = useState<'numeric' | 'string' | 'date' | 'boolean'>('numeric');
  const [measurementLevel, setMeasurementLevel] = useState<'scale' | 'nominal' | 'ordinal'>('scale');
  const [decimals, setDecimals] = useState(2);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Lütfen geçerli bir değişken adı girin.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await addVariable({
        name: name.trim(),
        label: label.trim() || undefined,
        data_type: dataType,
        measurement_level: measurementLevel,
        decimals: dataType === 'numeric' ? decimals : 0,
      });
      setName('');
      setLabel('');
      setAddVariableOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Değişken eklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isAddVariableOpen} onOpenChange={setAddVariableOpen}>
      <DialogContent onClose={() => setAddVariableOpen(false)}>
        <DialogHeader>
          <DialogTitle>Yeni Değişken Ekle</DialogTitle>
          <DialogDescription>
            Veri setine yeni bir değişken (sütun) ve meta veri tanımı ekleyin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {errorMsg && (
            <div className="p-2 bg-red-50 border border-red-200 text-red-700 rounded">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Değişken Adı (Örn: v_score, gelir)</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="v_yeni"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Değişken Etiketi (Açıklama)</label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Örn: Katılımcı Aylık Net Geliri"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Veri Türü</label>
              <select
                value={dataType}
                onChange={(e) => setDataType(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 focus:outline-none"
              >
                <option value="numeric">Sayısal (Numeric)</option>
                <option value="string">Metin (String)</option>
                <option value="date">Tarih (Date)</option>
                <option value="boolean">Mantıksal (Boolean)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Ölçüm Düzeyi</label>
              <select
                value={measurementLevel}
                onChange={(e) => setMeasurementLevel(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 focus:outline-none"
              >
                <option value="scale">Ölçek (Scale)</option>
                <option value="nominal">Nominal</option>
                <option value="ordinal">Sıralı (Ordinal)</option>
              </select>
            </div>
          </div>

          {dataType === 'numeric' && (
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Ondalık Basamak Sayısı</label>
              <Input
                type="number"
                min={0}
                max={10}
                value={decimals}
                onChange={(e) => setDecimals(parseInt(e.target.value, 10) || 0)}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setAddVariableOpen(false)}>
              İptal
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? 'Ekleniyor...' : 'Değişkeni Ekle (Tamam)'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
