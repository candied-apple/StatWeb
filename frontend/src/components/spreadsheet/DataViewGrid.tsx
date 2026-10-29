import React from 'react';
import { ReactGrid, Column, Row, CellChange } from '@silevis/reactgrid';
import { Variable } from '@/types/variable';
import { SpreadsheetWrapper } from './SpreadsheetWrapper';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DataViewGridProps {
  variables: Variable[];
  dataRows: Record<string, any>[];
  totalRows: number;
  offset: number;
  limit: number;
  onOffsetChange: (newOffset: number) => void;
  isLoading?: boolean;
}

export const DataViewGrid: React.FC<DataViewGridProps> = ({
  variables,
  dataRows,
  totalRows,
  offset,
  limit,
  onOffsetChange,
  isLoading,
}) => {
  // Build ReactGrid columns: row index column + variable columns
  const columns: Column[] = [
    { columnId: '__row_num', width: 60, resizable: false },
    ...variables.map((v) => ({
      columnId: v.name,
      width: Math.max(100, v.display_width * 10),
      resizable: true,
    })),
  ];

  // Header row
  const headerRow: Row = {
    rowId: 'header',
    cells: [
      { type: 'header', text: '' },
      ...variables.map((v) => ({
        type: 'header' as const,
        text: `${v.name} [${v.measurement_level[0].toUpperCase()}]`,
      })),
    ],
  };

  // Data rows
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
              return { type: 'text' as const, text: '.' }; // SPSS dot notation for system missing
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

  const handleCellsChanged = (_changes: CellChange[]) => {
    // In future increments, cell edits can be committed to the backend.
  };

  const totalPages = Math.ceil(totalRows / limit) || 1;
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="flex flex-col h-full w-full">
      <SpreadsheetWrapper
        title="Data View (Spreadsheet Cases & Variables)"
        countLabel={`Showing cases ${totalRows > 0 ? offset + 1 : 0} to ${Math.min(offset + dataRows.length, totalRows)} of ${totalRows}`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-sm text-slate-500">
            Loading dataset observations...
          </div>
        ) : variables.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-sm text-slate-500">
            No variables found in this dataset.
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

      {/* Pagination Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-t border-slate-200 text-xs">
        <span className="text-slate-600 font-medium">
          Page {currentPage} of {totalPages} ({totalRows} total cases)
        </span>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0 || isLoading}
            onClick={() => onOffsetChange(Math.max(0, offset - limit))}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={offset + limit >= totalRows || isLoading}
            onClick={() => onOffsetChange(offset + limit)}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};
