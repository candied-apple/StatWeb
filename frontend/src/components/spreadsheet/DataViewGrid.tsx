import React from 'react';
import { useTranslation } from 'react-i18next';
import { ReactGrid, Column, Row, CellChange } from '@silevis/reactgrid';
import { Variable } from '@/types/variable';
import { SpreadsheetWrapper } from './SpreadsheetWrapper';
import { ChevronLeft, ChevronRight, Plus, Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/use-ui-store';

interface DataViewGridProps {
  variables: Variable[];
  dataRows: Record<string, any>[];
  totalRows: number;
  offset: number;
  limit: number;
  onOffsetChange: (newOffset: number) => void;
  onUpdateCells?: (updates: { row_index: number; column_name: string; value: any }[]) => Promise<any>;
  onAddRow?: () => Promise<any>;
  onExport?: (format: 'csv' | 'xlsx') => void;
  isLoading?: boolean;
}

export const DataViewGrid: React.FC<DataViewGridProps> = ({
  variables,
  dataRows,
  totalRows,
  offset,
  limit,
  onOffsetChange,
  onUpdateCells,
  onAddRow,
  onExport,
  isLoading,
}) => {
  const { t } = useTranslation();
  const { setAddVariableOpen } = useUIStore();

  const getMeasureShort = (level: string) => {
    switch (level) {
      case 'nominal': return t('spreadsheet.measures.nominal').slice(0, 3);
      case 'ordinal': return t('spreadsheet.measures.ordinal').slice(0, 3);
      default: return t('spreadsheet.measures.scale').slice(0, 3);
    }
  };

  // ReactGrid sütunları: satır numarası + değişken sütunları
  const columns: Column[] = [
    { columnId: '__row_num', width: 60, resizable: false },
    ...variables.map((v) => ({
      columnId: v.name,
      width: Math.max(100, v.display_width * 10),
      resizable: true,
    })),
  ];

  // Başlık satırı
  const headerRow: Row = {
    rowId: 'header',
    cells: [
      { type: 'header', text: '' },
      ...variables.map((v) => ({
        type: 'header' as const,
        text: `${v.name} [${getMeasureShort(v.measurement_level)}]`,
      })),
    ],
  };

  // Veri satırları
  const rows: Row[] = [
    headerRow,
    ...dataRows.map((rowObj, idx) => {
      const caseNumber = offset + idx + 1;
      return {
        rowId: caseNumber,
        cells: [
          { type: 'header' as const, text: String(caseNumber) },
          ...variables.map((v) => {
            const rawVal = rowObj[v.name];
            if (rawVal === null || rawVal === undefined) {
              return { type: 'text' as const, text: '.' };
            }
            if (v.data_type === 'numeric' && typeof rawVal === 'number') {
              const formatted = rawVal.toFixed(v.decimals ?? 2);
              return { type: 'text' as const, text: formatted };
            }
            return { type: 'text' as const, text: String(rawVal) };
          }),
        ],
      };
    }),
  ];

  const handleCellsChanged = (changes: CellChange[]) => {
    if (!onUpdateCells) return;
    const cellUpdates: { row_index: number; column_name: string; value: any }[] = [];

    changes.forEach((change) => {
      const caseNumber = Number(change.rowId);
      if (isNaN(caseNumber) || caseNumber < 1) return;
      const rowIndex = caseNumber - 1;
      const colName = String(change.columnId);
      if (colName === '__row_num') return;

      const newText = 'text' in change.newCell ? change.newCell.text : null;
      cellUpdates.push({
        row_index: rowIndex,
        column_name: colName,
        value: newText === '.' ? null : newText,
      });
    });

    if (cellUpdates.length > 0) {
      onUpdateCells(cellUpdates);
    }
  };

  const totalPages = Math.ceil(totalRows / limit) || 1;
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="flex flex-col h-full w-full">
      {/* Veri İşlem Araç Çubuğu */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 border-b border-slate-200 text-xs">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onAddRow}
            className="h-7 px-2.5 text-xs bg-white text-slate-700 hover:bg-slate-50 border-slate-300"
          >
            <Plus className="h-3.5 w-3.5 mr-1 text-blue-600" />
            {t('spreadsheet.addRow')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddVariableOpen(true)}
            className="h-7 px-2.5 text-xs bg-white text-slate-700 hover:bg-slate-50 border-slate-300"
          >
            <Plus className="h-3.5 w-3.5 mr-1 text-indigo-600" />
            {t('spreadsheet.addVariable')}
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          {onExport && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport('csv')}
                className="h-7 px-2 text-xs bg-white text-slate-700 hover:bg-slate-50 border-slate-300"
              >
                <Download className="h-3 w-3 mr-1 text-slate-500" />
                {t('spreadsheet.exportCsv')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport('xlsx')}
                className="h-7 px-2 text-xs bg-white text-slate-700 hover:bg-slate-50 border-slate-300"
              >
                <FileSpreadsheet className="h-3 w-3 mr-1 text-emerald-600" />
                {t('spreadsheet.exportXlsx')}
              </Button>
            </>
          )}
        </div>
      </div>

      <SpreadsheetWrapper
        title={t('spreadsheet.dataViewTitle')}
        countLabel={`${t('common.cases')}: ${totalRows > 0 ? offset + 1 : 0} - ${Math.min(offset + dataRows.length, totalRows)} / ${totalRows}`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-sm text-slate-500">
            {t('spreadsheet.loadingRows')}
          </div>
        ) : variables.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-sm text-slate-500">
            {t('spreadsheet.emptyVariables')}
          </div>
        ) : (
          <ReactGrid
            rows={rows}
            columns={columns}
            onCellsChanged={handleCellsChanged}
            enableRangeSelection
            enableRowSelection
            enableColumnSelection
          />
        )}
      </SpreadsheetWrapper>

      {/* Sayfalama Çubuğu */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-t border-slate-200 text-xs">
        <span className="text-slate-600 font-medium">
          {t('common.page')} {currentPage} / {totalPages} ({totalRows} {t('common.observations')})
        </span>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0 || isLoading}
            onClick={() => onOffsetChange(Math.max(0, offset - limit))}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t('common.previous')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={offset + limit >= totalRows || isLoading}
            onClick={() => onOffsetChange(offset + limit)}
          >
            {t('common.next')}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};
