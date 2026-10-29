import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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

const descriptivesSchema = z.object({
  variable_names: z.array(z.string()).min(1, 'Lütfen analiz edilecek en az bir değişken seçin'),
});

type DescriptivesFormData = z.infer<typeof descriptivesSchema>;

interface DescriptivesDialogProps {
  datasetId: string;
  variables: Variable[];
}

export const DescriptivesDialog: React.FC<DescriptivesDialogProps> = ({
  datasetId,
  variables,
}) => {
  const { isDescriptivesOpen, setDescriptivesOpen, setActiveAnalysis } = useUIStore();
  const { runDescriptives } = useAnalyses(datasetId);
  const [loading, setLoading] = useState(false);

  const candidateVars = variables.map((v) => v.name);

  const [availableList, setAvailableList] = useState<string[]>([]);
  const [selectedList, setSelectedList] = useState<string[]>([]);
  const [selectedAvailable, setSelectedAvailable] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  React.useEffect(() => {
    if (isDescriptivesOpen) {
      setAvailableList(candidateVars);
      setSelectedList([]);
      setSelectedAvailable(null);
      setSelectedTarget(null);
    }
  }, [isDescriptivesOpen, datasetId]);

  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DescriptivesFormData>({
    resolver: zodResolver(descriptivesSchema),
    defaultValues: {
      variable_names: [],
    },
  });

  const moveToTarget = () => {
    if (selectedAvailable && !selectedList.includes(selectedAvailable)) {
      const nextSelected = [...selectedList, selectedAvailable];
      const nextAvailable = availableList.filter((v) => v !== selectedAvailable);
      setSelectedList(nextSelected);
      setAvailableList(nextAvailable);
      setValue('variable_names', nextSelected, { shouldValidate: true });
      setSelectedAvailable(null);
    }
  };

  const moveToAvailable = () => {
    if (selectedTarget && !availableList.includes(selectedTarget)) {
      const nextAvailable = [...availableList, selectedTarget];
      const nextSelected = selectedList.filter((v) => v !== selectedTarget);
      setAvailableList(nextAvailable);
      setSelectedList(nextSelected);
      setValue('variable_names', nextSelected, { shouldValidate: true });
      setSelectedTarget(null);
    }
  };

  const onSubmit = async () => {
    if (selectedList.length === 0) return;
    setLoading(true);
    try {
      const result = await runDescriptives({
        dataset_id: datasetId,
        variable_names: selectedList,
      });
      setDescriptivesOpen(false);
      setActiveAnalysis(result.id);
    } catch (err: any) {
      alert(`Betimsel istatistik hesaplama hatası: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isDescriptivesOpen} onOpenChange={setDescriptivesOpen}>
      <DialogContent className="max-w-xl" onClose={() => setDescriptivesOpen(false)}>
        <DialogHeader>
          <DialogTitle>Betimsel İstatistikler</DialogTitle>
          <DialogDescription>
            Ortalama, standart sapma, standart hata, varyans, çeyreklikler ve uç değerleri hesaplamak için sürekli/ölçek değişkenleri seçin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          {errors.variable_names && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
              {errors.variable_names.message}
            </div>
          )}

          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center my-3 text-xs">
            <div className="flex flex-col h-60 border border-slate-300 rounded bg-slate-50">
              <div className="px-2 py-1 bg-slate-100 font-semibold border-b border-slate-200 text-slate-700">
                Değişkenler:
              </div>
              <div className="flex-1 overflow-y-auto p-1 bg-white">
                {availableList.map((vName) => {
                  const meta = variables.find((v) => v.name === vName);
                  return (
                    <div
                      key={vName}
                      onClick={() => setSelectedAvailable(vName)}
                      onDoubleClick={moveToTarget}
                      className={`px-2 py-1 rounded cursor-pointer flex items-center justify-between ${
                        selectedAvailable === vName
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <span className="truncate">{vName}</span>
                      <span className={`text-[10px] uppercase ${selectedAvailable === vName ? 'text-blue-100' : 'text-slate-400'}`}>
                        {meta?.measurement_level?.[0] || 'Ö'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!selectedAvailable}
                onClick={moveToTarget}
                title="Değişkenlere Aktar"
                className="h-8 w-8 p-0"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!selectedTarget}
                onClick={moveToAvailable}
                title="Değişkenlerden Çıkar"
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-col h-60 border border-slate-300 rounded bg-slate-50">
              <div className="px-2 py-1 bg-slate-100 font-semibold border-b border-slate-200 text-slate-700">
                Seçilen Değişken(ler):
              </div>
              <div className="flex-1 overflow-y-auto p-1 bg-white">
                {selectedList.map((vName) => (
                  <div
                    key={vName}
                    onClick={() => setSelectedTarget(vName)}
                    onDoubleClick={moveToAvailable}
                    className={`px-2 py-1 rounded cursor-pointer ${
                      selectedTarget === vName
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    {vName}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDescriptivesOpen(false)}
            >
              İptal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={selectedList.length === 0 || loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Hesaplanıyor...' : 'Analizi Çalıştır (Tamam)'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
