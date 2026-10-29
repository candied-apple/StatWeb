import React from 'react';
import '@silevis/reactgrid/styles.css';

interface SpreadsheetWrapperProps {
  children: React.ReactNode;
  title?: string;
  countLabel?: string;
}

export const SpreadsheetWrapper: React.FC<SpreadsheetWrapperProps> = ({
  children,
  title,
  countLabel,
}) => {
  return (
    <div className="flex flex-col h-full w-full bg-white border border-slate-200 overflow-hidden shadow-sm">
      {(title || countLabel) && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 border-b border-slate-200 text-xs font-medium text-slate-700">
          <span>{title}</span>
          <span>{countLabel}</span>
        </div>
      )}
      <div className="flex-1 overflow-auto relative">
        {children}
      </div>
    </div>
  );
};
