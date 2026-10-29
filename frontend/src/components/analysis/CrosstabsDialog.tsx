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

interface CrosstabsDialogProps {
  datasetId: string;
  variables: Variable[];
}

export const CrosstabsDialog: React.FC<CrosstabsDialogProps> = ({
  datasetId,
  variables,
}) => {
  const { isCrosstabsOpen, setCrosstabsOpen, setActiveAnalysis } = useUIStore();
  const { runCrosstabs } = useAnalyses(datasetId);

  const [rowVar, setRowVar] = useState<string>(variables[0]?.name || '');
  const [colVar, setColVar] = useState<string>(variables[1]?.name || variables[0]?.name || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (variables.length >= 2) {
      setRowVar(variables[0].name);
      setColVar(variables[1].name);
    } else if (variables.length === 1) {
      setRowVar(variables[0].name);
      setColVar(variables[0].name);
    }
  }, [variables]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rowVar || !colVar) {
      setErrorMsg('Please select both a row and a column variable.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await runCrosstabs({
        dataset_id: datasetId,
        row_variable: rowVar,
        column_variable: colVar,
      });
      setCrosstabsOpen(false);
      setActiveAnalysis(result.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to compute cross-tabulation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isCrosstabsOpen} onOpenChange={setCrosstabsOpen}>
      <DialogContent onClose={() => setCrosstabsOpen(false)}>
        <DialogHeader>
          <DialogTitle>Crosstabs & Chi-Square Tests</DialogTitle>
          <DialogDescription>
            Compute contingency tables, row and column percentages, Pearson Chi-Square, and Cramer's V.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Row Variable(s)</label>
            <select
              value={rowVar}
              onChange={(e) => setRowVar(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 focus:outline-none"
            >
              {variables.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.name} {v.label ? `(${v.label})` : ''} [{v.measurement_level}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Column Variable(s)</label>
            <select
              value={colVar}
              onChange={(e) => setColVar(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 focus:outline-none"
            >
              {variables.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.name} {v.label ? `(${v.label})` : ''} [{v.measurement_level}]
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setCrosstabsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? 'Calculating...' : 'Run Crosstabs (OK)'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
