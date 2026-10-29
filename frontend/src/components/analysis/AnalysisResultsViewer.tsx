import React from 'react';
import { AnalysisRun } from '@/types/analysis';
import { PlotlyChart } from '@/components/charts/PlotlyChart';
import { Button } from '@/components/ui/button';
import {
  Table,
  BarChart2,
  AlertCircle,
  Calendar,
  Hash,
  Download,
} from 'lucide-react';

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
        <h3 className="font-semibold text-slate-600 text-sm">Seçili Analiz Çıktısı Yok</h3>
        <p className="text-xs text-slate-400 mt-1">
          Çıktı tablolarını ve istatistiksel grafikleri görüntülemek için Çözümle menüsünden bir analiz çalıştırın.
        </p>
      </div>
    );
  }

  const { analysis_type, name, created_at, results } = analysisRun;

  const handleDownloadPdf = () => {
    window.open(`/api/v1/analyses/${analysisRun.id}/pdf`, '_blank');
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-slate-50 p-6 select-text text-xs space-y-6">
      {/* Üst Bilgi Kartı */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart2 className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">{name}</h2>
          </div>
          <div className="flex items-center space-x-3 text-slate-500 text-[11px] mt-1">
            <span className="flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              {new Date(created_at).toLocaleString('tr-TR')}
            </span>
            <span className="flex items-center">
              <Hash className="h-3.5 w-3.5 mr-1" />
              {results?.total_observations || results?.n_valid || '-'} Gözlem
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadPdf}
          className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          <Download className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
          Raporu PDF Olarak İndir
        </Button>
      </div>

      {/* 1. BETİMSEL İSTATİSTİKLER */}
      {analysis_type === 'descriptives' && (
        <div className="bg-white border border-slate-200 rounded p-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center">
            <Table className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Betimsel İstatistikler Özeti
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300 text-left bg-white text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-semibold">
                  <th className="py-2 px-3 border-r border-slate-300">Değişken</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">Geçerli N</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">Kayıp</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">Ortalama</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">Std. Hata</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">Std. Sapma</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">Varyans</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">Medyan</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">Min</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">Maks</th>
                  <th className="py-2 px-3 text-right">Çeyrekler Açıklığı (IQR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(results?.variables || []).map((v: any) => (
                  <tr key={v.variable_name} className="hover:bg-blue-50/50">
                    <td className="py-2 px-3 font-medium text-slate-900 border-r border-slate-200">{v.variable_name}</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200">{v.n_valid}</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200">{v.n_missing}</td>
                    <td className="py-2 px-3 text-right font-medium border-r border-slate-200">{v.mean !== null ? v.mean.toFixed(3) : '-'}</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200">{v.std_error_mean !== null ? v.std_error_mean.toFixed(3) : '-'}</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200">{v.std_dev !== null ? v.std_dev.toFixed(3) : '-'}</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200">{v.variance !== null ? v.variance.toFixed(3) : '-'}</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200">{v.median !== null ? v.median.toFixed(3) : '-'}</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200">{v.minimum !== null ? v.minimum.toFixed(3) : '-'}</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200">{v.maximum !== null ? v.maximum.toFixed(3) : '-'}</td>
                    <td className="py-2 px-3 text-right">{v.iqr !== null ? v.iqr.toFixed(3) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PlotlyChart
            data={[{
              x: (results?.variables || []).map((v: any) => v.variable_name),
              y: (results?.variables || []).map((v: any) => v.mean ?? 0),
              type: 'bar',
              name: 'Ortalama',
              marker: { color: '#3b82f6' },
            }]}
            title="Değişken Ortalamaları Grafiği"
          />
        </div>
      )}

      {/* 2. FREKANSLAR */}
      {analysis_type === 'frequencies' && (
        <div className="space-y-6">
          {(results?.variables || []).map((v: any) => {
            const chartCategories = (v.categories || []).filter((c: any) => !c.is_missing);
            return (
              <div key={v.variable_name} className="bg-white border border-slate-200 rounded p-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                  Frekans Tablosu: {v.variable_name} (Toplam N = {v.total})
                </h3>
                <div className="overflow-x-auto mb-4">
                  <table className="w-full border-collapse border border-slate-300 text-left bg-white text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-semibold">
                        <th className="py-2 px-3 border-r border-slate-300">Değer / Etiket</th>
                        <th className="py-2 px-3 border-r border-slate-300 text-right">Frekans</th>
                        <th className="py-2 px-3 border-r border-slate-300 text-right">Yüzde</th>
                        <th className="py-2 px-3 border-r border-slate-300 text-right">Geçerli Yüzde</th>
                        <th className="py-2 px-3 text-right">Kümülatif Yüzde</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(v.categories || []).map((cat: any, cIdx: number) => (
                        <tr key={cIdx} className={cat.is_missing ? 'bg-amber-50/40 text-slate-500' : 'hover:bg-blue-50/50'}>
                          <td className="py-2 px-3 border-r border-slate-200 font-medium">{cat.label}</td>
                          <td className="py-2 px-3 text-right border-r border-slate-200">{cat.frequency}</td>
                          <td className="py-2 px-3 text-right border-r border-slate-200">%{cat.percent.toFixed(1)}</td>
                          <td className="py-2 px-3 text-right border-r border-slate-200">{cat.valid_percent !== null ? `%${cat.valid_percent.toFixed(1)}` : '-'}</td>
                          <td className="py-2 px-3 text-right">{cat.cumulative_percent !== null ? `%${cat.cumulative_percent.toFixed(1)}` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {chartCategories.length > 0 && (
                  <PlotlyChart
                    data={[{
                      x: chartCategories.map((c: any) => c.label),
                      y: chartCategories.map((c: any) => c.frequency),
                      type: 'bar',
                      marker: { color: '#6366f1' },
                    }]}
                    title={`Frekans Çubuk Grafiği: ${v.variable_name}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 3. ÇAPRAZ TABLOLAR */}
      {analysis_type === 'crosstabs' && (
        <div className="bg-white border border-slate-200 rounded p-4 shadow-sm space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Çapraz Tablo: {results?.row_var_name} × {results?.col_var_name} (N = {results?.n_valid})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-300 text-left bg-white text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-semibold">
                    <th className="py-2 px-3 border-r border-slate-300">{results?.row_var_name}</th>
                    {(results?.col_categories || []).map((col: any) => (
                      <th key={String(col.value)} className="py-2 px-3 border-r border-slate-300 text-right">{col.label}</th>
                    ))}
                    <th className="py-2 px-3 text-right">Toplam</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(results?.row_categories || []).map((row: any) => {
                    const rowCells = (results?.cells || []).filter((c: any) => String(c.row_val) === String(row.value));
                    const rowTot = results?.row_totals?.[String(row.value)] || 0;
                    return (
                      <tr key={String(row.value)} className="hover:bg-blue-50/50">
                        <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-200">{row.label}</td>
                        {(results?.col_categories || []).map((col: any) => {
                          const cell = rowCells.find((c: any) => String(c.col_val) === String(col.value));
                          return (
                            <td key={String(col.value)} className="py-2 px-3 text-right border-r border-slate-200">
                              <span className="font-medium text-slate-900">{cell?.count || 0}</span>
                              <div className="text-[10px] text-slate-400">
                                %{cell?.row_percent?.toFixed(1)} satır
                              </div>
                            </td>
                          );
                        })}
                        <td className="py-2 px-3 text-right font-bold text-slate-900">{rowTot}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Ki-Kare Testleri
            </h3>
            <table className="w-full border-collapse border border-slate-300 text-left bg-white text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-semibold">
                  <th className="py-2 px-3 border-r border-slate-300">Test</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">Değer</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">sd</th>
                  <th className="py-2 px-3 text-right">Asimptotik Anlamlılık (2-yönlü)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(results?.chi_square_tests || []).map((t: any) => (
                  <tr key={t.test_name}>
                    <td className="py-2 px-3 border-r border-slate-200 font-medium">{t.test_name === 'Pearson Chi-Square' ? 'Pearson Ki-Kare' : t.test_name}</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200 font-mono">{t.value.toFixed(3)}</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200">{t.df}</td>
                    <td className="py-2 px-3 text-right font-medium text-blue-700">{t.p_value < 0.001 ? '< .001' : t.p_value.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(results?.effect_sizes || []).length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Simetrik Ölçüler (Etki Büyüklüğü)</h3>
              <table className="w-full border-collapse border border-slate-300 text-left bg-white text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-semibold">
                    <th className="py-2 px-3 border-r border-slate-300">Ölçü</th>
                    <th className="py-2 px-3 text-right">Değer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {results.effect_sizes.map((e: any) => (
                    <tr key={e.name}>
                      <td className="py-2 px-3 border-r border-slate-200 font-medium">{e.name}</td>
                      <td className="py-2 px-3 text-right font-mono">{e.value.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. BAĞIMSIZ T-TESTİ */}
      {analysis_type === 'ttest_ind' && (
        <div className="bg-white border border-slate-200 rounded p-4 shadow-sm space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Grup İstatistikleri</h3>
            <table className="w-full border-collapse border border-slate-300 text-left bg-white text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-semibold">
                  <th className="py-2 px-3 border-r border-slate-300">Grup</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">N</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">Ortalama</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">Standart Sapma</th>
                  <th className="py-2 px-3 text-right">Standart Hata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(results?.group_stats || []).map((g: any) => (
                  <tr key={String(g.group_value)}>
                    <td className="py-2 px-3 border-r border-slate-200 font-semibold">{g.group_label}</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200">{g.n}</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200 font-mono">{g.mean.toFixed(3)}</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200 font-mono">{g.std_dev.toFixed(3)}</td>
                    <td className="py-2 px-3 text-right font-mono">{g.std_error_mean.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Bağımsız Örneklemler Testi (Levene Homojenlik Testi: F={results?.levene_f?.toFixed(3) || '-'}, Sig.={results?.levene_p?.toFixed(4) || '-'})
            </h3>
            <table className="w-full border-collapse border border-slate-300 text-left bg-white text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-semibold">
                  <th className="py-2 px-3 border-r border-slate-300">Varsayım</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">t</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">sd</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">Sig. (2-yönlü)</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">Ortalama Fark</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">Std. Hata Fark</th>
                  <th className="py-2 px-3 text-right">%95 Güven Aralığı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(results?.tests || []).map((t: any) => (
                  <tr key={t.variance_assumption}>
                    <td className="py-2 px-3 border-r border-slate-200 font-medium">
                      {t.variance_assumption === 'Equal variances assumed' ? 'Eşit varyanslar varsayıldı' : 'Eşit varyanslar varsayılmadı'}
                    </td>
                    <td className="py-2 px-3 text-right border-r border-slate-200 font-mono">{t.t_stat.toFixed(3)}</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200">{t.df.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200 font-medium text-blue-700">{t.p_value < 0.001 ? '< .001' : t.p_value.toFixed(4)}</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200 font-mono">{t.mean_difference.toFixed(3)}</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200 font-mono">{t.std_error_difference.toFixed(3)}</td>
                    <td className="py-2 px-3 text-right font-mono">[{t.ci_lower.toFixed(3)}, {t.ci_upper.toFixed(3)}]</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. TEK YÖNLÜ ANOVA */}
      {analysis_type === 'anova' && (
        <div className="bg-white border border-slate-200 rounded p-4 shadow-sm space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Grup Betimsel İstatistikleri</h3>
            <table className="w-full border-collapse border border-slate-300 text-left bg-white text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-semibold">
                  <th className="py-2 px-3 border-r border-slate-300">Faktör Grubu</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">N</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">Ortalama</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">Standart Sapma</th>
                  <th className="py-2 px-3 text-right">%95 Güven Aralığı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(results?.group_descriptives || []).map((g: any) => (
                  <tr key={String(g.group_val)}>
                    <td className="py-2 px-3 border-r border-slate-200 font-semibold">{g.group_label}</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200">{g.n}</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200 font-mono">{g.mean.toFixed(3)}</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200 font-mono">{g.std_dev.toFixed(3)}</td>
                    <td className="py-2 px-3 text-right font-mono">[{g.ci_lower.toFixed(2)}, {g.ci_upper.toFixed(2)}]</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">ANOVA Tablosu</h3>
            <table className="w-full border-collapse border border-slate-300 text-left bg-white text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-semibold">
                  <th className="py-2 px-3 border-r border-slate-300">Varyans Kaynağı</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">Kareler Toplamı</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">sd</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">Kareler Ortalaması</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">F</th>
                  <th className="py-2 px-3 text-right">Sig.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(results?.anova_table || []).map((r: any) => {
                  let sourceTr = r.source;
                  if (r.source === 'Between Groups') sourceTr = 'Gruplar Arası';
                  else if (r.source === 'Within Groups') sourceTr = 'Grup İçi';
                  else if (r.source === 'Total') sourceTr = 'Toplam';
                  return (
                    <tr key={r.source}>
                      <td className="py-2 px-3 border-r border-slate-200 font-semibold">{sourceTr}</td>
                      <td className="py-2 px-3 text-right border-r border-slate-200 font-mono">{r.sum_of_squares.toFixed(3)}</td>
                      <td className="py-2 px-3 text-right border-r border-slate-200">{r.df}</td>
                      <td className="py-2 px-3 text-right border-r border-slate-200 font-mono">{r.mean_square !== null ? r.mean_square.toFixed(3) : ''}</td>
                      <td className="py-2 px-3 text-right border-r border-slate-200 font-bold font-mono">{r.f_statistic !== null ? r.f_statistic.toFixed(3) : ''}</td>
                      <td className="py-2 px-3 text-right font-bold text-blue-700">{r.p_value !== null ? (r.p_value < 0.001 ? '< .001' : r.p_value.toFixed(4)) : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. KORELASYONLAR */}
      {analysis_type === 'correlation' && (
        <div className="bg-white border border-slate-200 rounded p-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">İki Değişkenli Korelasyon Matrisi (Pearson)</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300 text-left bg-white text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-semibold">
                  <th className="py-2 px-3 border-r border-slate-300">Değişkenler</th>
                  {(results?.variables || []).map((v: string) => (
                    <th key={v} className="py-2 px-3 border-r border-slate-300 text-center">{v}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(results?.variables || []).map((v1: string) => (
                  <tr key={v1}>
                    <td className="py-2 px-3 border-r border-slate-200 font-semibold">{v1}</td>
                    {(results?.variables || []).map((v2: string) => {
                      const pair = (results?.matrix || []).find((p: any) => p.var1 === v1 && p.var2 === v2);
                      return (
                        <td key={v2} className="py-2 px-3 text-center border-r border-slate-200">
                          <div className="font-bold text-slate-900 font-mono">
                            {pair?.pearson_r !== null ? pair?.pearson_r.toFixed(3) : '-'}
                          </div>
                          <div className="text-[10px] text-blue-600">
                            p = {pair?.pearson_p !== null ? (pair.pearson_p < 0.001 ? '< .001' : pair.pearson_p.toFixed(3)) : '-'}
                          </div>
                          <div className="text-[10px] text-slate-400">N={pair?.n || 0}</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. DOĞRUSAL REGRESYON */}
      {analysis_type === 'regression' && (
        <div className="bg-white border border-slate-200 rounded p-4 shadow-sm space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Model Özeti</h3>
            <table className="w-full border-collapse border border-slate-300 text-left bg-white text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-semibold">
                  <th className="py-2 px-3 border-r border-slate-300 text-right">R</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">R Kare</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">Düzeltilmiş R Kare</th>
                  <th className="py-2 px-3 text-right">Tahminin Standart Hatası</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 px-3 text-right border-r border-slate-200 font-mono">{results?.r?.toFixed(3)}</td>
                  <td className="py-2 px-3 text-right border-r border-slate-200 font-mono font-bold">{results?.r_squared?.toFixed(3)}</td>
                  <td className="py-2 px-3 text-right border-r border-slate-200 font-mono">{results?.adj_r_squared?.toFixed(3)}</td>
                  <td className="py-2 px-3 text-right font-mono">{results?.std_error_estimate?.toFixed(3)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Katsayılar Tablosu</h3>
            <table className="w-full border-collapse border border-slate-300 text-left bg-white text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-semibold">
                  <th className="py-2 px-3 border-r border-slate-300">Model</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">B</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">Std. Hata</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">Beta</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">t</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right">Sig.</th>
                  <th className="py-2 px-3 text-right">VIF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(results?.coefficients || []).map((c: any) => (
                  <tr key={c.variable_name}>
                    <td className="py-2 px-3 border-r border-slate-200 font-semibold">
                      {c.variable_name === '(Constant)' ? '(Sabit)' : c.variable_name}
                    </td>
                    <td className="py-2 px-3 text-right border-r border-slate-200 font-mono">{c.unstandardized_b.toFixed(3)}</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200 font-mono">{c.std_error.toFixed(3)}</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200 font-mono">{c.standardized_beta !== null ? c.standardized_beta.toFixed(3) : '-'}</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200 font-mono">{c.t_stat.toFixed(3)}</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200 font-bold text-blue-700">{c.p_value < 0.001 ? '< .001' : c.p_value.toFixed(4)}</td>
                    <td className="py-2 px-3 text-right font-mono">{c.vif !== null ? c.vif.toFixed(2) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Uyarılar Paneli */}
      {results?.warnings && results.warnings.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 text-xs">
          <div className="font-semibold flex items-center mb-1">
            <AlertCircle className="h-4 w-4 mr-1.5 text-amber-600" />
            İstatistiksel Tanı ve Uyarılar:
          </div>
          <ul className="list-disc pl-5 space-y-0.5">
            {results.warnings.map((w: string, idx: number) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
