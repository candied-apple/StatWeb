import React from 'react';
import { AnalysisRun } from '@/types/analysis';
import { PlotlyChart } from '@/components/charts/PlotlyChart';
import { Table, BarChart2, AlertCircle, Calendar, Hash } from 'lucide-react';

interface AnalysisResultsViewerProps {
  analysisRun?: AnalysisRun;
}

export const AnalysisResultsViewer: React.FC<AnalysisResultsViewerProps> = ({
  analysisRun,
}) => {
  if (!analysisRun) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
        <BarChart2 className="h-12 w-12 text-slate-300 mb-2" />
        <h3 className="font-semibold text-slate-600 text-sm">No Analysis Run Selected</h3>
        <p className="text-xs text-slate-400 mt-1">
          Run an analysis from the Analyze menu to inspect output tables and statistical charts.
        </p>
      </div>
    );
  }

  const variables = analysisRun.results?.variables || [];

  // Plotly chart data: Bar chart comparing Mean & Std Error across selected variables
  const meanComparisonTrace = {
    x: variables.map((v) => v.variable_name),
    y: variables.map((v) => v.mean ?? 0),
    type: 'bar' as const,
    name: 'Mean',
    error_y: {
      type: 'data' as const,
      array: variables.map((v) => v.std_error_mean ?? 0),
      visible: true,
      color: '#1e3a8a',
    },
    marker: {
      color: '#3b82f6',
    },
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-slate-50 p-6 select-text text-xs">
      {/* Run Header */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm mb-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
          <div className="flex items-center space-x-2">
            <BarChart2 className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">{analysisRun.name}</h2>
          </div>
          <div className="flex items-center space-x-3 text-slate-500 text-[11px]">
            <span className="flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              {new Date(analysisRun.created_at).toLocaleString()}
            </span>
            <span className="flex items-center">
              <Hash className="h-3.5 w-3.5 mr-1" />
              {analysisRun.results?.total_observations} Total Observations
            </span>
          </div>
        </div>

        {/* Descriptive Statistics Table (SPSS Style) */}
        <div className="overflow-x-auto">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center">
            <Table className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Descriptive Statistics Summary
          </h3>
          <table className="w-full border-collapse border border-slate-300 text-left bg-white text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-semibold">
                <th className="py-2 px-3 border-r border-slate-300">Variable</th>
                <th className="py-2 px-3 border-r border-slate-300 text-right">N (Valid)</th>
                <th className="py-2 px-3 border-r border-slate-300 text-right">Missing</th>
                <th className="py-2 px-3 border-r border-slate-300 text-right">Mean</th>
                <th className="py-2 px-3 border-r border-slate-300 text-right">Std. Error</th>
                <th className="py-2 px-3 border-r border-slate-300 text-right">Std. Dev</th>
                <th className="py-2 px-3 border-r border-slate-300 text-right">Variance</th>
                <th className="py-2 px-3 border-r border-slate-300 text-right">Median</th>
                <th className="py-2 px-3 border-r border-slate-300 text-right">Min</th>
                <th className="py-2 px-3 border-r border-slate-300 text-right">Max</th>
                <th className="py-2 px-3 text-right">IQR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {variables.map((v) => (
                <tr key={v.variable_name} className="hover:bg-blue-50/50">
                  <td className="py-2 px-3 font-medium text-slate-900 border-r border-slate-200">
                    {v.variable_name}
                  </td>
                  <td className="py-2 px-3 text-right border-r border-slate-200">{v.n_valid}</td>
                  <td className="py-2 px-3 text-right border-r border-slate-200">{v.n_missing}</td>
                  <td className="py-2 px-3 text-right font-medium border-r border-slate-200">
                    {v.mean !== null ? v.mean.toFixed(3) : '-'}
                  </td>
                  <td className="py-2 px-3 text-right border-r border-slate-200">
                    {v.std_error_mean !== null ? v.std_error_mean.toFixed(3) : '-'}
                  </td>
                  <td className="py-2 px-3 text-right border-r border-slate-200">
                    {v.std_dev !== null ? v.std_dev.toFixed(3) : '-'}
                  </td>
                  <td className="py-2 px-3 text-right border-r border-slate-200">
                    {v.variance !== null ? v.variance.toFixed(3) : '-'}
                  </td>
                  <td className="py-2 px-3 text-right border-r border-slate-200">
                    {v.median !== null ? v.median.toFixed(3) : '-'}
                  </td>
                  <td className="py-2 px-3 text-right border-r border-slate-200">
                    {v.minimum !== null ? v.minimum.toFixed(3) : '-'}
                  </td>
                  <td className="py-2 px-3 text-right border-r border-slate-200">
                    {v.maximum !== null ? v.maximum.toFixed(3) : '-'}
                  </td>
                  <td className="py-2 px-3 text-right">
                    {v.iqr !== null ? v.iqr.toFixed(3) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Statistical Warnings, if any */}
        {variables.some((v) => v.warnings && v.warnings.length > 0) && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 text-xs">
            <div className="font-semibold flex items-center mb-1">
              <AlertCircle className="h-4 w-4 mr-1.5 text-amber-600" />
              Statistical Diagnostics & Warnings:
            </div>
            <ul className="list-disc pl-5 space-y-0.5">
              {variables.flatMap((v) =>
                v.warnings.map((w, idx) => (
                  <li key={`${v.variable_name}-${idx}`}>
                    <span className="font-medium">{v.variable_name}:</span> {w}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Interactive Plotly Visualizations */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center">
          <BarChart2 className="h-3.5 w-3.5 mr-1 text-slate-500" />
          Interactive Statistical Charts (Plotly.js)
        </h3>

        <PlotlyChart
          data={[meanComparisonTrace]}
          layout={{
            title: { text: 'Mean Comparison with Standard Error Bars (SE)' },
            yaxis: { title: { text: 'Value' } },
            xaxis: { title: { text: 'Variables' } },
          }}
          title="Variable Means & Standard Error"
        />
      </div>
    </div>
  );
};
