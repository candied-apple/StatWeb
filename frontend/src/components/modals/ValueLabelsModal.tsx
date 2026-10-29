import React, { useState, useEffect } from 'react';
import { useUIStore } from '@/stores/use-ui-store';
import { useVariables } from '@/hooks/use-variables';
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
import { Plus, Trash2 } from 'lucide-react';

interface ValueLabelsModalProps {
  variables: Variable[];
  datasetId: string;
}

export const ValueLabelsModal: React.FC<ValueLabelsModalProps> = ({ variables, datasetId }) => {
  const { selectedValueLabelVarId, setSelectedValueLabelVarId } = useUIStore();
  const { updateVariable } = useVariables(datasetId);

  const targetVar = variables.find((v) => v.id === selectedValueLabelVarId);

  const [labelsMap, setLabelsMap] = useState<Record<string, string>>({});
  const [valInput, setValInput] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (targetVar) {
      setLabelsMap(targetVar.value_labels || {});
      setValInput('');
      setLabelInput('');
      setSelectedKey(null);
    }
  }, [targetVar]);

  if (!selectedValueLabelVarId || !targetVar) {
    return null;
  }

  const handleAddOrUpdate = () => {
    if (!valInput.trim() || !labelInput.trim()) return;
    setLabelsMap((prev) => ({
      ...prev,
      [valInput.trim()]: labelInput.trim(),
    }));
    setValInput('');
    setLabelInput('');
    setSelectedKey(null);
  };

  const handleRemove = () => {
    if (!selectedKey) return;
    setLabelsMap((prev) => {
      const next = { ...prev };
      delete next[selectedKey];
      return next;
    });
    setSelectedKey(null);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateVariable({
        variableId: targetVar.id,
        data: { value_labels: labelsMap },
      });
      setSelectedValueLabelVarId(null);
    } catch (err: any) {
      alert(`Etiketler kaydedilemedi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={Boolean(selectedValueLabelVarId)} onOpenChange={(open) => !open && setSelectedValueLabelVarId(null)}>
      <DialogContent className="max-w-md" onClose={() => setSelectedValueLabelVarId(null)}>
        <DialogHeader>
          <DialogTitle>Değer Etiketleri: {targetVar.name}</DialogTitle>
          <DialogDescription>
            Sayısal veya kodlu kategorik değerlere metinsel etiketler atayın (SPSS Value Labels).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-[1fr_2fr] gap-2">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Değer (Kod)</label>
              <Input
                value={valInput}
                onChange={(e) => setValInput(e.target.value)}
                placeholder="Örn: 1"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Etiket</label>
              <Input
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                placeholder="Örn: Kadın"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!valInput.trim() || !labelInput.trim()}
              onClick={handleAddOrUpdate}
              className="h-7 text-xs bg-white text-slate-700"
            >
              <Plus className="h-3 w-3 mr-1 text-blue-600" />
              Ekle / Güncelle
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!selectedKey}
              onClick={handleRemove}
              className="h-7 text-xs bg-white text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Kaldır
            </Button>
          </div>

          <div className="border border-slate-300 rounded bg-slate-50 h-44 overflow-y-auto p-1">
            {Object.keys(labelsMap).length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                Tanımlı değer etiketi yok
              </div>
            ) : (
              Object.entries(labelsMap).map(([code, text]) => (
                <div
                  key={code}
                  onClick={() => {
                    setSelectedKey(code);
                    setValInput(code);
                    setLabelInput(text);
                  }}
                  className={`p-1.5 rounded cursor-pointer flex justify-between items-center ${
                    selectedKey === code ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  <span>{code} = &quot;{text}&quot;</span>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSelectedValueLabelVarId(null)}
          >
            İptal
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={loading}
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Kaydediliyor...' : 'Tamam'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
