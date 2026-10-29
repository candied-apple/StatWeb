import React from 'react';
import { ReactGrid, Column, Row, CellChange } from '@silevis/reactgrid';
import { Variable } from '@/types/variable';
import { SpreadsheetWrapper } from './SpreadsheetWrapper';

interface VariableViewGridProps {
  variables: Variable[];
  onUpdateVariable: (variableId: string, updates: Partial<Variable>) => Promise<any>;
}

export const VariableViewGrid: React.FC<VariableViewGridProps> = ({
  variables,
  onUpdateVariable,
}) => {
  const columns: Column[] = [
    { columnId: '__index', width: 45, resizable: false },
    { columnId: 'name', width: 120, resizable: true },
    { columnId: 'type', width: 100, resizable: true },
    { columnId: 'width', width: 70, resizable: true },
    { columnId: 'decimals', width: 80, resizable: true },
    { columnId: 'label', width: 220, resizable: true },
    { columnId: 'values', width: 150, resizable: true },
    { columnId: 'missing', width: 110, resizable: true },
    { columnId: 'measure', width: 110, resizable: true },
    { columnId: 'role', width: 90, resizable: true },
  ];

  const headerRow: Row = {
    rowId: 'header',
    cells: [
      { type: 'header', text: '' },
      { type: 'header', text: 'Ad' },
      { type: 'header', text: 'Tür' },
      { type: 'header', text: 'Genişlik' },
      { type: 'header', text: 'Basamak' },
      { type: 'header', text: 'Etiket' },
      { type: 'header', text: 'Değerler' },
      { type: 'header', text: 'Kayıp' },
      { type: 'header', text: 'Ölçüm' },
      { type: 'header', text: 'Rol' },
    ],
  };

  const formatDataTypeTr = (dt: string) => {
    switch (dt) {
      case 'numeric': return 'Sayısal';
      case 'string': return 'Metin';
      case 'date': return 'Tarih';
      case 'boolean': return 'Mantıksal';
      default: return dt;
    }
  };

  const formatMeasureTr = (m: string) => {
    switch (m) {
      case 'scale': return 'Ölçek';
      case 'nominal': return 'Nominal';
      case 'ordinal': return 'Sıralı';
      default: return m;
    }
  };

  const formatRoleTr = (r: string) => {
    switch (r) {
      case 'input': return 'Girdi';
      case 'target': return 'Hedef';
      case 'both': return 'Her İkisi';
      case 'none': return 'Hiçbiri';
      default: return r;
    }
  };

  const rows: Row[] = [
    headerRow,
    ...variables.map((v, idx) => {
      let valuesSummary = 'Yok';
      if (v.value_labels && Object.keys(v.value_labels).length > 0) {
        valuesSummary = Object.entries(v.value_labels)
          .map(([code, lbl]) => `${code}=${lbl}`)
          .slice(0, 2)
          .join(', ');
        if (Object.keys(v.value_labels).length > 2) {
          valuesSummary += '...';
        }
      }

      let missingSummary = 'Yok';
      if (v.missing_values && v.missing_values.length > 0) {
        missingSummary = v.missing_values.join(', ');
      }

      return {
        rowId: v.id,
        cells: [
          { type: 'header' as const, text: String(idx + 1) },
          { type: 'text' as const, text: v.name },
          { type: 'text' as const, text: formatDataTypeTr(v.data_type) },
          { type: 'text' as const, text: String(v.display_width) },
          { type: 'text' as const, text: String(v.decimals) },
          { type: 'text' as const, text: v.label || '' },
          { type: 'text' as const, text: valuesSummary },
          { type: 'text' as const, text: missingSummary },
          { type: 'text' as const, text: formatMeasureTr(v.measurement_level) },
          { type: 'text' as const, text: formatRoleTr(v.role) },
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
        if (lower.includes('ölçek') || lower === 'scale') updates.measurement_level = 'scale';
        else if (lower.includes('nom')) updates.measurement_level = 'nominal';
        else if (lower.includes('sıra') || lower === 'ordinal') updates.measurement_level = 'ordinal';
      } else if (columnId === 'type') {
        const lower = newRawText.toLowerCase();
        if (lower.includes('sayı') || lower === 'numeric') updates.data_type = 'numeric';
        else if (lower.includes('metin') || lower === 'string') updates.data_type = 'string';
        else if (lower.includes('tarih') || lower === 'date') updates.data_type = 'date';
        else if (lower.includes('mantık') || lower === 'boolean') updates.data_type = 'boolean';
      }

      if (Object.keys(updates).length > 0) {
        onUpdateVariable(varId, updates);
      }
    });
  };

  return (
    <SpreadsheetWrapper
      title="Değişken Görünümü (SPSS Meta Veri Sözlüğü)"
      countLabel={`${variables.length} tanımlı değişken`}
    >
      {variables.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-sm text-slate-500">
          Değişken bulunamadı.
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
  );
};
