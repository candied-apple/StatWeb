import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ReactGrid, Column, Row, CellChange } from '@silevis/reactgrid';
import { Variable } from '@/types/variable';
import { SpreadsheetWrapper } from './SpreadsheetWrapper';
import { Plus, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/use-ui-store';

interface VariableViewGridProps {
  variables: Variable[];
  onUpdateVariable: (variableId: string, updates: Partial<Variable>) => Promise<any>;
}

export const VariableViewGrid: React.FC<VariableViewGridProps> = ({
  variables,
  onUpdateVariable,
}) => {
  const { t } = useTranslation();
  const { setAddVariableOpen, setSelectedValueLabelVarId } = useUIStore();
  const [activeSelectedVarId, setActiveSelectedVarId] = useState<string>(variables[0]?.id || '');

  React.useEffect(() => {
    if (variables.length > 0 && !activeSelectedVarId) {
      setActiveSelectedVarId(variables[0].id);
    }
  }, [variables, activeSelectedVarId]);

  const columns: Column[] = [
    { columnId: '__index', width: 45, resizable: false },
    { columnId: 'name', width: 120, resizable: true },
    { columnId: 'type', width: 100, resizable: true },
    { columnId: 'width', width: 70, resizable: true },
    { columnId: 'decimals', width: 80, resizable: true },
    { columnId: 'label', width: 220, resizable: true },
    { columnId: 'values', width: 160, resizable: true },
    { columnId: 'missing', width: 110, resizable: true },
    { columnId: 'measure', width: 110, resizable: true },
    { columnId: 'role', width: 90, resizable: true },
  ];

  const headerRow: Row = {
    rowId: 'header',
    cells: [
      { type: 'header', text: '' },
      { type: 'header', text: t('spreadsheet.columns.name') },
      { type: 'header', text: t('spreadsheet.columns.type') },
      { type: 'header', text: t('spreadsheet.columns.width') },
      { type: 'header', text: t('spreadsheet.columns.decimals') },
      { type: 'header', text: t('spreadsheet.columns.label') },
      { type: 'header', text: t('spreadsheet.columns.values') },
      { type: 'header', text: t('spreadsheet.columns.missing') },
      { type: 'header', text: t('spreadsheet.columns.measure') },
      { type: 'header', text: t('spreadsheet.columns.role') },
    ],
  };

  const formatDataType = (dt: string) => {
    switch (dt) {
      case 'numeric': return t('spreadsheet.types.numeric');
      case 'string': return t('spreadsheet.types.string');
      case 'date': return t('spreadsheet.types.date');
      case 'boolean': return t('spreadsheet.types.boolean');
      default: return dt;
    }
  };

  const formatMeasure = (m: string) => {
    switch (m) {
      case 'scale': return t('spreadsheet.measures.scale');
      case 'nominal': return t('spreadsheet.measures.nominal');
      case 'ordinal': return t('spreadsheet.measures.ordinal');
      default: return m;
    }
  };

  const formatRole = (r: string) => {
    switch (r) {
      case 'input': return t('spreadsheet.roles.input');
      case 'target': return t('spreadsheet.roles.target');
      case 'both': return t('spreadsheet.roles.both');
      case 'none': return t('spreadsheet.roles.none');
      default: return r;
    }
  };

  const rows: Row[] = [
    headerRow,
    ...variables.map((v, idx) => {
      let valuesSummary = t('spreadsheet.valuesNone');
      if (v.value_labels && Object.keys(v.value_labels).length > 0) {
        valuesSummary = Object.entries(v.value_labels)
          .map(([code, lbl]) => `${code}=${lbl}`)
          .slice(0, 2)
          .join(', ');
        if (Object.keys(v.value_labels).length > 2) {
          valuesSummary += '...';
        }
      }

      let missingSummary = t('spreadsheet.missingNone');
      if (v.missing_values && v.missing_values.length > 0) {
        missingSummary = v.missing_values.join(', ');
      }

      return {
        rowId: v.id,
        cells: [
          { type: 'header' as const, text: String(idx + 1) },
          { type: 'text' as const, text: v.name },
          { type: 'text' as const, text: formatDataType(v.data_type) },
          { type: 'text' as const, text: String(v.display_width) },
          { type: 'text' as const, text: String(v.decimals) },
          { type: 'text' as const, text: v.label || '' },
          { type: 'text' as const, text: valuesSummary },
          { type: 'text' as const, text: missingSummary },
          { type: 'text' as const, text: formatMeasure(v.measurement_level) },
          { type: 'text' as const, text: formatRole(v.role) },
        ],
      };
    }),
  ];

  const handleCellsChanged = (changes: CellChange[]) => {
    changes.forEach((change) => {
      const varId = String(change.rowId);
      const targetVar = variables.find((v) => v.id === varId);
      if (!targetVar) return;

      const columnId = String(change.columnId);
      const newRawText = 'text' in change.newCell ? change.newCell.text : '';

      const updates: Partial<Variable> = {};

      if (columnId === 'label') {
        updates.label = newRawText;
      } else if (columnId === 'decimals') {
        const parsed = parseInt(newRawText, 10);
        if (!isNaN(parsed) && parsed >= 0) updates.decimals = parsed;
      } else if (columnId === 'width') {
        const parsed = parseInt(newRawText, 10);
        if (!isNaN(parsed) && parsed > 0) updates.display_width = parsed;
      } else if (columnId === 'measure') {
        const lower = newRawText.toLowerCase();
        if (lower.includes('ölçek') || lower.includes('scale')) updates.measurement_level = 'scale';
        else if (lower.includes('nom')) updates.measurement_level = 'nominal';
        else if (lower.includes('sıra') || lower.includes('ord')) updates.measurement_level = 'ordinal';
      } else if (columnId === 'type') {
        const lower = newRawText.toLowerCase();
        if (lower.includes('sayı') || lower.includes('num')) updates.data_type = 'numeric';
        else if (lower.includes('metin') || lower.includes('str')) updates.data_type = 'string';
        else if (lower.includes('tarih') || lower.includes('date')) updates.data_type = 'date';
        else if (lower.includes('mantık') || lower.includes('bool')) updates.data_type = 'boolean';
      }

      if (Object.keys(updates).length > 0) {
        onUpdateVariable(varId, updates);
      }
    });
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Değişken İşlemleri Araç Çubuğu */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 border-b border-slate-200 text-xs">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddVariableOpen(true)}
            className="h-7 px-2.5 text-xs bg-white text-slate-700 hover:bg-slate-50 border-slate-300"
          >
            <Plus className="h-3.5 w-3.5 mr-1 text-indigo-600" />
            {t('spreadsheet.addVariable')}
          </Button>

          {variables.length > 0 && (
            <div className="flex items-center space-x-1.5 ml-2">
              <span className="text-slate-500 font-medium text-[11px]">{t('spreadsheet.selectedVariable')}</span>
              <select
                value={activeSelectedVarId}
                onChange={(e) => setActiveSelectedVarId(e.target.value)}
                className="h-7 bg-white border border-slate-300 rounded px-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
              >
                {variables.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.label || formatDataType(v.data_type)})
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedValueLabelVarId(activeSelectedVarId)}
                className="h-7 px-2.5 text-xs bg-white text-slate-700 hover:bg-slate-50 border-slate-300"
              >
                <Tag className="h-3.5 w-3.5 mr-1 text-blue-600" />
                {t('spreadsheet.editValueLabels')}
              </Button>
            </div>
          )}
        </div>
      </div>

      <SpreadsheetWrapper
        title={t('spreadsheet.variableViewTitle')}
        countLabel={`${variables.length} ${t('spreadsheet.definedVariablesCount')}`}
      >
        {variables.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-sm text-slate-500">
            {t('spreadsheet.noVariablesFound')}
          </div>
        ) : (
          <ReactGrid
            rows={rows}
            columns={columns}
            onCellsChanged={handleCellsChanged}
            enableRangeSelection
          />
        )}
      </SpreadsheetWrapper>
    </div>
  );
};
