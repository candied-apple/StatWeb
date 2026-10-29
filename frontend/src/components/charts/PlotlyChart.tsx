import React from 'react';
import Plotly from 'plotly.js-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';

const Plot = createPlotlyComponent(Plotly);

interface PlotlyChartProps {
  data: Plotly.Data[];
  layout?: Partial<Plotly.Layout>;
  title?: string;
}

export const PlotlyChart: React.FC<PlotlyChartProps> = ({
  data,
  layout,
  title,
}) => {
  return (
    <div className="w-full bg-white border border-slate-200 rounded p-2 shadow-sm my-4">
      {title && (
        <h4 className="text-xs font-semibold text-slate-800 px-2 py-1 border-b border-slate-100 mb-2">
          {title}
        </h4>
      )}
      <div className="w-full flex justify-center">
        <Plot
          data={data}
          layout={{
            autosize: true,
            margin: { l: 50, r: 30, t: 30, b: 50 },
            font: { family: 'sans-serif', size: 11 },
            paper_bgcolor: 'transparent',
            plot_bgcolor: '#f8fafc',
            ...layout,
          }}
          useResizeHandler
          style={{ width: '100%', height: '350px' }}
          config={{ responsive: true, displayModeBar: true, displaylogo: false }}
        />
      </div>
    </div>
  );
};
