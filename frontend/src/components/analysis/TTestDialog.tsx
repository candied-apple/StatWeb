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
import { Input } from '@/components/ui/input';

interface TTestDialogProps {
  datasetId: string;
  variables: Variable[];
}

export const TTestDialog: React.FC<TTestDialogProps> = ({
  datasetId,
  variables,
}) => {
  const { isTTestOpen, setTTestOpen, setActiveAnalysis } = useUIStore();
  const { runIndependentTTest, runPairedTTest } = useAnalyses(datasetId);

  const [activeTab, setActiveTab] = useState<'independent' | 'paired'>('independent');

  // Independent t-test fields
  const [testVar, setTestVar] = useState<string>(variables[0]?.name || '');
  const [groupVar, setGroupVar] = useState<string>(variables[1]?.name || variables[0]?.name || '');
  const [group1Val, setGroup1Val] = useState<string>('1');
  const [group2Val, setGroup2Val] = useState<string>('2');

  // Paired t-test fields
  const [pair1Var, setPair1Var] = useState<string>(variables[0]?.name || '');
  const [pair2Var, setPair2Var] = useState<string>(variables[1]?.name || variables[0]?.name || '');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      let result;
      if (activeTab === 'independent') {
        result = await runIndependentTTest({
          dataset_id: datasetId,
          test_variable: testVar,
          group_variable: groupVar,
          group1_value: group1Val,
          group2_value: group2Val,
        });
      } else {
        result = await runPairedTTest({
          dataset_id: datasetId,
          pair1_variable: pair1Var,
          pair2_variable: pair2Var,
        });
      }
      setTTestOpen(false);
      setActiveAnalysis(result.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'T-testi hesaplanamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isTTestOpen} onOpenChange={setTTestOpen}>
      <DialogContent onClose={() => setTTestOpen(false)}>
        <DialogHeader>
          <DialogTitle>Ortalamaları Karşılaştır: T-Testi</DialogTitle>
          <DialogDescription>
            İki örneklemli bağımsız t-testi (Levene homojenlik testi ile) veya eşleştirilmiş örneklem t-testi hesaplayın.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('independent')}
            className={`py-1.5 px-3 border-b-2 transition-colors ${
              activeTab === 'independent' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Bağımsız Örneklem T-Testi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paired')}
            className={`py-1.5 px-3 border-b-2 transition-colors ${
              activeTab === 'paired' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Eşleştirilmiş Örneklem T-Testi
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
              {errorMsg}
            </div>
          )}

          {activeTab === 'independent' ? (
            <>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Test Değişkeni (Sürekli)</label>
                <select
                  value={testVar}
                  onChange={(e) => setTestVar(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                >
                  {variables.map((v) => (
                    <option key={v.id} value={v.name}>
                      {v.name} {v.label ? `(${v.label})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Gruplama Değişkeni (Kategorik)</label>
                <select
                  value={groupVar}
                  onChange={(e) => setGroupVar(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                >
                  {variables.map((v) => (
                    <option key={v.id} value={v.name}>
                      {v.name} {v.label ? `(${v.label})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Grup 1 Değeri</label>
                  <Input value={group1Val} onChange={(e) => setGroup1Val(e.target.value)} placeholder="Örn. 1 veya Erkek" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Grup 2 Değeri</label>
                  <Input value={group2Val} onChange={(e) => setGroup2Val(e.target.value)} placeholder="Örn. 2 veya Kadın" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">1. Değişken (Ön-test / Başlangıç)</label>
                <select
                  value={pair1Var}
                  onChange={(e) => setPair1Var(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                >
                  {variables.map((v) => (
                    <option key={v.id} value={v.name}>{v.name} {v.label ? `(${v.label})` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">2. Değişken (Son-test / İzlem)</label>
                <select
                  value={pair2Var}
                  onChange={(e) => setPair2Var(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                >
                  {variables.map((v) => (
                    <option key={v.id} value={v.name}>{v.name} {v.label ? `(${v.label})` : ''}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setTTestOpen(false)}>
              İptal
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? 'Hesaplanıyor...' : 'T-Testini Çalıştır (Tamam)'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
