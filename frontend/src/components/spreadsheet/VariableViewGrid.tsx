import React from 'react';
import { ReactGrid, Column, Row, CellChange } from '@silevis/reactgrid';
import { Variable, MeasurementLevel, VariableDataType } from '@/types/variable';
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
    { columnId: 'type', width: 90, resizable: true },
    { columnId: 'width', width: 60, resizable: true },
    { columnId: 'decimals', width: 70, resizable: true },
    { columnId: 'label', width: 220, resizable: true },
    { columnId: 'values', width: 140, resizable: true },
    { columnId: 'missing', width: 100, resizable: true },
    { columnId: 'measure', width: 100, resizable: true },
    { columnId: 'role', width: 80, resizable: true },
  ];

  const headerRow: Row = {
    rowId: 'header',
    cells: [
      { type: 'header', text: '' },
      { type: 'header', text: 'Name' },
      { type: 'header', text: 'Type' },
      { type: 'header', text: 'Width' },
      { type: 'header', text: 'Decimals' },
      { type: 'header', text: 'Label' },
      { type: 'header', text: 'Values' },
      { type: 'header', text: 'Missing' },
      { type: 'header', text: 'Measure' },
      { type: 'header', text: 'Role' },
    ],
  };

  const rows: Row[] = [
    headerRow,
    ...variables.map((v, idx) => {
      // Format value labels summary (e.g. '{1=Male, 2=Female}')
      let valuesSummary = 'None';
      if (v.value_labels && Object.keys(v.value_labels).length > 0) {
        valuesSummary = Object.entries(v.value_labels)
          .map(([code, lbl]) => `${code}=${lbl}`)
          .slice(0, 2)
          .join(', ');
        if (Object.keys(v.value_labels).length > 2) {
          valuesSummary += '...';
        }
      }

      // Format missing summary
      let missingSummary = 'None';
      if (v.missing_values && v.missing_values.length > 0) {
        missingSummary = v.missing_values.join(', ');
      }

      return {
        rowId: v.id,
        cells: [
          { type: 'header' as const, text: String(idx + 1) },
          { type: 'text' as const, text: v.name },
          { type: 'text' as const, text: v.data_type.toUpperCase() },
          { type: 'text' as const, text: String(v.display_width) },
          { type: 'text' as const, text: String(v.decimals) },
          { type: 'text' as const, text: v.label || '' },
          { type: 'text' as const, text: valuesSummary },
          { type: 'text' as const, text: missingSummary },
          { type: 'text' as const, text: v.measurement_level.toUpperCase() },
          { type: 'text' as const, text: v.role.toUpperCase() },
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
        if (['scale', 'nominal', 'ordinal'].includes(lower)) {
          updates.measurement_level = lower as MeasurementLevel;
        }
      } else if (columnId === 'type') {
        const lower = newRawText.toLowerCase();
        if (['numeric', 'string', 'date', 'boolean'].includes(lower)) {
          updates.data_type = lower as VariableDataType;
        }
      }

      if (Object.keys(updates).length > 0) {
        onUpdateVariable(varId, updates);
      }
    });
  };

  return (
    <SpreadsheetWrapper
      title="Variable View (SPSS Metadata Dictionary)"
      countLabel={`${variables.length} defined variables`}
    >
      {variables.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-sm text-slate-500">
          No variables available.
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
