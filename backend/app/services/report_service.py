"""
PDF Report Generation Service.

Renders validated statistical analysis results to PDF using WeasyPrint from HTML templates.
CRITICAL: As specified in AGENTS.md:
- Modify HTML templates for layout changes, not the PDF generation logic.
- Both Turkish (tr) and English (en) report templates are supported via localization.
"""

from datetime import datetime
from typing import Any, Optional
from weasyprint import HTML
from app.models.analysis import AnalysisRun


def _fmt(val: Any, digits: int = 3, default: str = "-") -> str:
    if val is None:
        return default
    if isinstance(val, (int, float)):
        return f"{val:.{digits}f}"
    return str(val)


def _fmt_p(p: Optional[float]) -> str:
    if p is None:
        return "-"
    if p < 0.001:
        return "< .001"
    return f"{p:.4f}"


class ReportService:
    @staticmethod
    def _render_html_template(analysis: AnalysisRun, lang: str = "tr") -> str:
        res = analysis.results or {}
        a_type = analysis.analysis_type
        is_tr = (lang.lower() == "tr")
        tables_html = ""

        # 1. BETİMSEL İSTATİSTİKLER / DESCRIPTIVES
        if a_type == "descriptives":
            vars_list = res.get("variables", [])
            rows_html = "".join(
                f"""<tr>
                    <td><strong>{v.get('variable_name')}</strong></td>
                    <td class="num">{v.get('n_valid', '-')}</td>
                    <td class="num">{v.get('n_missing', '-')}</td>
                    <td class="num">{_fmt(v.get('mean'))}</td>
                    <td class="num">{_fmt(v.get('std_error_mean'))}</td>
                    <td class="num">{_fmt(v.get('std_dev'))}</td>
                    <td class="num">{_fmt(v.get('variance'))}</td>
                    <td class="num">{_fmt(v.get('median'))}</td>
                    <td class="num">{_fmt(v.get('minimum'))}</td>
                    <td class="num">{_fmt(v.get('maximum'))}</td>
                    <td class="num">{_fmt(v.get('iqr'))}</td>
                </tr>"""
                for v in vars_list
            )
            title = "Betimsel İstatistikler Özeti" if is_tr else "Descriptive Statistics Summary"
            h_var = "Değişken" if is_tr else "Variable"
            h_n = "Geçerli N" if is_tr else "N (Valid)"
            h_miss = "Kayıp" if is_tr else "Missing"
            h_mean = "Ortalama" if is_tr else "Mean"
            h_se = "Std. Hata" if is_tr else "Std. Error"
            h_sd = "Std. Sapma" if is_tr else "Std. Dev"
            h_varc = "Varyans" if is_tr else "Variance"
            h_med = "Medyan" if is_tr else "Median"
            tables_html = f"""
            <h3>{title}</h3>
            <table>
                <thead>
                    <tr>
                        <th>{h_var}</th>
                        <th class="num">{h_n}</th>
                        <th class="num">{h_miss}</th>
                        <th class="num">{h_mean}</th>
                        <th class="num">{h_se}</th>
                        <th class="num">{h_sd}</th>
                        <th class="num">{h_varc}</th>
                        <th class="num">{h_med}</th>
                        <th class="num">Min</th>
                        <th class="num">Max</th>
                        <th class="num">IQR</th>
                    </tr>
                </thead>
                <tbody>{rows_html}</tbody>
            </table>
            """

        # 2. FREKANSLAR / FREQUENCIES
        elif a_type == "frequencies":
            for v in res.get("variables", []):
                cats_html = "".join(
                    f"""<tr class="{'missing-row' if c.get('is_missing') else ''}">
                        <td>{c.get('label')}</td>
                        <td class="num">{c.get('frequency')}</td>
                        <td class="num">%{_fmt(c.get('percent'), 1)}</td>
                        <td class="num">{'%' + _fmt(c.get('valid_percent'), 1) if c.get('valid_percent') is not None else '-'}</td>
                        <td class="num">{'%' + _fmt(c.get('cumulative_percent'), 1) if c.get('cumulative_percent') is not None else '-'}</td>
                    </tr>"""
                    for c in v.get("categories", [])
                )
                title = f"Frekans Dağılımı: {v.get('variable_name')} (Toplam N = {v.get('total')})" if is_tr else f"Frequency Distribution: {v.get('variable_name')} (Total N = {v.get('total')})"
                h_val = "Değer / Etiket" if is_tr else "Category / Label"
                h_freq = "Frekans" if is_tr else "Frequency"
                h_pct = "Yüzde" if is_tr else "Percent"
                h_vpct = "Geçerli Yüzde" if is_tr else "Valid Percent"
                h_cpct = "Kümülatif Yüzde" if is_tr else "Cumulative Percent"
                tables_html += f"""
                <h3>{title}</h3>
                <table>
                    <thead>
                        <tr>
                            <th>{h_val}</th>
                            <th class="num">{h_freq}</th>
                            <th class="num">{h_pct}</th>
                            <th class="num">{h_vpct}</th>
                            <th class="num">{h_cpct}</th>
                        </tr>
                    </thead>
                    <tbody>{cats_html}</tbody>
                </table>
                """

        # 3. ÇAPRAZ TABLOLAR / CROSSTABS
        elif a_type == "crosstabs":
            r_cats = res.get("row_categories", [])
            c_cats = res.get("col_categories", [])
            cells = {(c["row_val"], c["col_val"]): c for c in res.get("cells", [])}

            header_cols = "".join(f"<th class='num'>{c['label']}</th>" for c in c_cats)
            grid_rows = ""
            for r in r_cats:
                cells_td = "".join(
                    f"<td class='num'>{cells.get((r['value'], c['value']), {}).get('count', 0)} "
                    f"<small>(%{_fmt(cells.get((r['value'], c['value']), {}).get('row_percent', 0), 1)})</small></td>"
                    for c in c_cats
                )
                row_tot = res.get("row_totals", {}).get(str(r["value"]), 0)
                grid_rows += f"<tr><td><strong>{r['label']}</strong></td>{cells_td}<td class='num'><strong>{row_tot}</strong></td></tr>"

            tot_cells = "".join(
                f"<td class='num'><strong>{res.get('col_totals', {}).get(str(c['value']), 0)}</strong></td>"
                for c in c_cats
            )
            tot_label = "Toplam" if is_tr else "Total"
            grid_rows += f"<tr class='total-row'><td><strong>{tot_label}</strong></td>{tot_cells}<td class='num'><strong>{res.get('total_n', 0)}</strong></td></tr>"

            chi2_name = "Pearson Ki-Kare" if is_tr else "Pearson Chi-Square"
            chi2_html = "".join(
                f"<tr><td>{chi2_name if t['test_name'] == 'Pearson Chi-Square' else t['test_name']}</td>"
                f"<td class='num'>{_fmt(t['value'])}</td>"
                f"<td class='num'>{t['df']}</td>"
                f"<td class='num'>{_fmt_p(t['p_value'])}</td></tr>"
                for t in res.get("chi_square_tests", [])
            )

            eff_html = ""
            if res.get("effect_sizes"):
                eff_rows = "".join(
                    f"<tr><td>{e.get('name')}</td><td class='num'>{_fmt(e.get('value'))}</td></tr>"
                    for e in res.get("effect_sizes", [])
                )
                eff_title = "Simetrik Ölçüler (Etki Büyüklüğü)" if is_tr else "Symmetric Measures (Effect Size)"
                eff_col = "Ölçü" if is_tr else "Measure"
                eff_html = f"""
                <h3>{eff_title}</h3>
                <table>
                    <thead><tr><th>{eff_col}</th><th class="num">{'Değer' if is_tr else 'Value'}</th></tr></thead>
                    <tbody>{eff_rows}</tbody>
                </table>
                """

            crosstab_title = f"Çapraz Tablo: {res.get('row_var_name')} × {res.get('col_var_name')} (N = {res.get('n_valid')})" if is_tr else f"Cross-tabulation: {res.get('row_var_name')} × {res.get('col_var_name')} (N = {res.get('n_valid')})"
            chi2_title = "Ki-Kare Testleri" if is_tr else "Chi-Square Tests"
            chi2_val_hdr = "Değer" if is_tr else "Value"
            chi2_sig_hdr = "Asimptotik Anlamlılık (2-yönlü)" if is_tr else "Asymp. Sig. (2-sided)"

            tables_html = f"""
            <h3>{crosstab_title}</h3>
            <table>
                <thead>
                    <tr><th>{res.get('row_var_name')}</th>{header_cols}<th class="num">{tot_label}</th></tr>
                </thead>
                <tbody>{grid_rows}</tbody>
            </table>

            <h3>{chi2_title}</h3>
            <table>
                <thead>
                    <tr><th>Test</th><th class="num">{chi2_val_hdr}</th><th class="num">df</th><th class="num">{chi2_sig_hdr}</th></tr>
                </thead>
                <tbody>{chi2_html}</tbody>
            </table>
            {eff_html}
            """

        # 4. BAĞIMSIZ ÖRNEKLEM T-TESTİ / INDEPENDENT T-TEST
        elif a_type == "ttest_ind":
            grp_rows = "".join(
                f"""<tr>
                    <td><strong>{g.get('group_label')}</strong></td>
                    <td class="num">{g.get('n')}</td>
                    <td class="num">{_fmt(g.get('mean'))}</td>
                    <td class="num">{_fmt(g.get('std_dev'))}</td>
                    <td class="num">{_fmt(g.get('std_error_mean'))}</td>
                </tr>"""
                for g in res.get("group_stats", [])
            )

            assump_eq = "Eşit varyanslar varsayıldı" if is_tr else "Equal variances assumed"
            assump_neq = "Eşit varyanslar varsayılmadı" if is_tr else "Equal variances not assumed"
            test_rows = "".join(
                f"""<tr>
                    <td>{assump_eq if t.get('variance_assumption') == 'Equal variances assumed' else assump_neq}</td>
                    <td class="num">{_fmt(t.get('t_stat'))}</td>
                    <td class="num">{_fmt(t.get('df'), 2)}</td>
                    <td class="num">{_fmt_p(t.get('p_value'))}</td>
                    <td class="num">{_fmt(t.get('mean_difference'))}</td>
                    <td class="num">{_fmt(t.get('std_error_difference'))}</td>
                    <td class="num">[{_fmt(t.get('ci_lower'))}, {_fmt(t.get('ci_upper'))}]</td>
                </tr>"""
                for t in res.get("tests", [])
            )

            g_title = "Grup İstatistikleri" if is_tr else "Group Statistics"
            t_title = f"Bağımsız Örneklemler Testi (Levene: F = {_fmt(res.get('levene_f'))}, Sig. = {_fmt_p(res.get('levene_p'))})" if is_tr else f"Independent Samples Test (Levene: F = {_fmt(res.get('levene_f'))}, Sig. = {_fmt_p(res.get('levene_p'))})"
            h_grp = "Grup" if is_tr else "Group"
            h_mean = "Ortalama" if is_tr else "Mean"
            h_sd = "Standart Sapma" if is_tr else "Std. Deviation"
            h_se = "Standart Hata" if is_tr else "Std. Error Mean"
            h_assump = "Varsayım" if is_tr else "Assumption"
            h_sig = "Sig. (2-yönlü)" if is_tr else "Sig. (2-tailed)"
            h_diff = "Ortalama Fark" if is_tr else "Mean Difference"
            h_sediff = "Std. Hata Fark" if is_tr else "Std. Error Difference"
            h_ci = "%95 Güven Aralığı" if is_tr else "95% Confidence Interval"

            tables_html = f"""
            <h3>{g_title}</h3>
            <table>
                <thead>
                    <tr>
                        <th>{h_grp}</th>
                        <th class="num">N</th>
                        <th class="num">{h_mean}</th>
                        <th class="num">{h_sd}</th>
                        <th class="num">{h_se}</th>
                    </tr>
                </thead>
                <tbody>{grp_rows}</tbody>
            </table>

            <h3>{t_title}</h3>
            <table>
                <thead>
                    <tr>
                        <th>{h_assump}</th>
                        <th class="num">t</th>
                        <th class="num">df</th>
                        <th class="num">{h_sig}</th>
                        <th class="num">{h_diff}</th>
                        <th class="num">{h_sediff}</th>
                        <th class="num">{h_ci}</th>
                    </tr>
                </thead>
                <tbody>{test_rows}</tbody>
            </table>
            """

        # 5. EŞLEŞTİRİLMİŞ ÖRNEKLEM T-TESTİ / PAIRED T-TEST
        elif a_type == "ttest_paired":
            p_title = "Eşleştirilmiş Örneklemler İstatistikleri" if is_tr else "Paired Samples Statistics"
            d_title = f"Eşleştirilmiş Farklar Testi ({res.get('var1_name')} - {res.get('var2_name')})" if is_tr else f"Paired Differences Test ({res.get('var1_name')} - {res.get('var2_name')})"
            h_var = "Değişken" if is_tr else "Variable"
            h_mean = "Ortalama" if is_tr else "Mean"
            h_diff = "Ortalama Fark" if is_tr else "Mean Difference"
            h_sddiff = "Std. Sapma Fark" if is_tr else "Std. Dev Difference"
            h_sediff = "Std. Hata" if is_tr else "Std. Error"
            h_ci = "%95 Güven Aralığı" if is_tr else "95% Confidence Interval"
            h_sig = "Sig. (2-yönlü)" if is_tr else "Sig. (2-tailed)"

            tables_html = f"""
            <h3>{p_title}</h3>
            <table>
                <thead>
                    <tr>
                        <th>{h_var}</th>
                        <th class="num">N</th>
                        <th class="num">{h_mean}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>{res.get('var1_name')}</td><td class="num">{res.get('n')}</td><td class="num">{_fmt(res.get('mean1'))}</td></tr>
                    <tr><td>{res.get('var2_name')}</td><td class="num">{res.get('n')}</td><td class="num">{_fmt(res.get('mean2'))}</td></tr>
                </tbody>
            </table>

            <h3>{d_title}</h3>
            <table>
                <thead>
                    <tr>
                        <th>{h_diff}</th>
                        <th class="num">{h_sddiff}</th>
                        <th class="num">{h_sediff}</th>
                        <th class="num">{h_ci}</th>
                        <th class="num">t</th>
                        <th class="num">df</th>
                        <th class="num">{h_sig}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{_fmt(res.get('mean_diff'))}</td>
                        <td class="num">{_fmt(res.get('std_dev_diff'))}</td>
                        <td class="num">{_fmt(res.get('std_error_diff'))}</td>
                        <td class="num">[{_fmt(res.get('ci_lower'))}, {_fmt(res.get('ci_upper'))}]</td>
                        <td class="num">{_fmt(res.get('t_stat'))}</td>
                        <td class="num">{res.get('df')}</td>
                        <td class="num">{_fmt_p(res.get('p_value'))}</td>
                    </tr>
                </tbody>
            </table>
            """

        # 6. TEK YÖNLÜ ANOVA / ONE-WAY ANOVA
        elif a_type == "anova":
            grp_rows = "".join(
                f"""<tr>
                    <td><strong>{g.get('group_label')}</strong></td>
                    <td class="num">{g.get('n')}</td>
                    <td class="num">{_fmt(g.get('mean'))}</td>
                    <td class="num">{_fmt(g.get('std_dev'))}</td>
                    <td class="num">[{_fmt(g.get('ci_lower'), 2)}, {_fmt(g.get('ci_upper'), 2)}]</td>
                </tr>"""
                for g in res.get("group_descriptives", [])
            )

            source_map = {
                "Between Groups": "Gruplar Arası" if is_tr else "Between Groups",
                "Within Groups": "Grup İçi" if is_tr else "Within Groups",
                "Total": "Toplam" if is_tr else "Total",
            }
            anova_rows = "".join(
                f"""<tr>
                    <td><strong>{source_map.get(r.get('source'), r.get('source'))}</strong></td>
                    <td class="num">{_fmt(r.get('sum_of_squares'))}</td>
                    <td class="num">{r.get('df')}</td>
                    <td class="num">{_fmt(r.get('mean_square')) if r.get('mean_square') is not None else ''}</td>
                    <td class="num"><strong>{_fmt(r.get('f_statistic')) if r.get('f_statistic') is not None else ''}</strong></td>
                    <td class="num"><strong>{_fmt_p(r.get('p_value')) if r.get('p_value') is not None else ''}</strong></td>
                </tr>"""
                for r in res.get("anova_table", [])
            )

            g_title = "Grup Betimsel İstatistikleri" if is_tr else "Group Descriptives"
            a_title = f"ANOVA Tablosu ({res.get('dependent_var_name')} ~ {res.get('factor_var_name')})" if is_tr else f"ANOVA Table ({res.get('dependent_var_name')} ~ {res.get('factor_var_name')})"
            h_fgroup = "Faktör Grubu" if is_tr else "Factor Group"
            h_mean = "Ortalama" if is_tr else "Mean"
            h_sd = "Standart Sapma" if is_tr else "Std. Deviation"
            h_ci = "%95 Güven Aralığı" if is_tr else "95% Confidence Interval"
            h_src = "Varyans Kaynağı" if is_tr else "Source of Variation"
            h_ss = "Kareler Toplamı" if is_tr else "Sum of Squares"
            h_ms = "Kareler Ortalaması" if is_tr else "Mean Square"

            tables_html = f"""
            <h3>{g_title}</h3>
            <table>
                <thead>
                    <tr>
                        <th>{h_fgroup}</th>
                        <th class="num">N</th>
                        <th class="num">{h_mean}</th>
                        <th class="num">{h_sd}</th>
                        <th class="num">{h_ci}</th>
                    </tr>
                </thead>
                <tbody>{grp_rows}</tbody>
            </table>

            <h3>{a_title}</h3>
            <table>
                <thead>
                    <tr>
                        <th>{h_src}</th>
                        <th class="num">{h_ss}</th>
                        <th class="num">df</th>
                        <th class="num">{h_ms}</th>
                        <th class="num">F</th>
                        <th class="num">Sig.</th>
                    </tr>
                </thead>
                <tbody>{anova_rows}</tbody>
            </table>
            """

        # 7. KORELASYONLAR / CORRELATIONS
        elif a_type == "correlation":
            vars_list = res.get("variables", [])
            matrix_list = res.get("matrix", [])

            header_cols = "".join(f"<th class='num'>{v}</th>" for v in vars_list)
            rows_html = ""
            for v1 in vars_list:
                cols_td = ""
                for v2 in vars_list:
                    pair = next((p for p in matrix_list if p.get("var1") == v1 and p.get("var2") == v2), None)
                    if pair:
                        cols_td += f"""<td class="num">
                            <div><strong>{_fmt(pair.get('pearson_r'))}</strong></div>
                            <div style="font-size: 8pt; color: #2563eb;">p = {_fmt_p(pair.get('pearson_p'))}</div>
                            <div style="font-size: 7.5pt; color: #64748b;">N = {pair.get('n')}</div>
                        </td>"""
                    else:
                        cols_td += "<td class='num'>-</td>"
                rows_html += f"<tr><td><strong>{v1}</strong></td>{cols_td}</tr>"

            c_title = "İki Değişkenli Korelasyon Matrisi (Pearson)" if is_tr else "Bivariate Correlation Matrix (Pearson)"
            h_vars = "Değişkenler" if is_tr else "Variables"

            tables_html = f"""
            <h3>{c_title}</h3>
            <table>
                <thead>
                    <tr><th>{h_vars}</th>{header_cols}</tr>
                </thead>
                <tbody>{rows_html}</tbody>
            </table>
            """

        # 8. DOĞRUSAL REGRESYON / REGRESSION
        elif a_type == "regression":
            m_title = "Model Özeti" if is_tr else "Model Summary"
            h_r2 = "R Kare" if is_tr else "R Square"
            h_ar2 = "Düzeltilmiş R Kare" if is_tr else "Adjusted R Square"
            h_se_est = "Tahminin Standart Hatası" if is_tr else "Std. Error of the Estimate"

            summary_html = f"""
            <h3>{m_title}</h3>
            <table>
                <thead>
                    <tr>
                        <th class="num">R</th>
                        <th class="num">{h_r2}</th>
                        <th class="num">{h_ar2}</th>
                        <th class="num">{h_se_est}</th>
                        <th class="num">F</th>
                        <th class="num">Sig.</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="num">{_fmt(res.get('r'))}</td>
                        <td class="num"><strong>{_fmt(res.get('r_squared'))}</strong></td>
                        <td class="num">{_fmt(res.get('adj_r_squared'))}</td>
                        <td class="num">{_fmt(res.get('std_error_estimate'))}</td>
                        <td class="num">{_fmt(res.get('f_statistic'))}</td>
                        <td class="num">{_fmt_p(res.get('f_p_value'))}</td>
                    </tr>
                </tbody>
            </table>
            """

            const_label = "(Sabit)" if is_tr else "(Constant)"
            coef_rows = "".join(
                f"""<tr>
                    <td><strong>{const_label if c.get('variable_name') == '(Constant)' else c.get('variable_name')}</strong></td>
                    <td class="num">{_fmt(c.get('unstandardized_b'))}</td>
                    <td class="num">{_fmt(c.get('std_error'))}</td>
                    <td class="num">{_fmt(c.get('standardized_beta')) if c.get('standardized_beta') is not None else '-'}</td>
                    <td class="num">{_fmt(c.get('t_stat'))}</td>
                    <td class="num"><strong>{_fmt_p(c.get('p_value'))}</strong></td>
                    <td class="num">{_fmt(c.get('vif')) if c.get('vif') is not None else '-'}</td>
                </tr>"""
                for c in res.get("coefficients", [])
            )

            coef_title = f"Katsayılar Tablosu (Bağımlı Değişken: {res.get('dependent_var')})" if is_tr else f"Coefficients (Dependent: {res.get('dependent_var')})"
            h_model = "Model"
            h_se = "Std. Hata" if is_tr else "Std. Error"

            coef_html = f"""
            <h3>{coef_title}</h3>
            <table>
                <thead>
                    <tr>
                        <th>{h_model}</th>
                        <th class="num">B</th>
                        <th class="num">{h_se}</th>
                        <th class="num">Beta</th>
                        <th class="num">t</th>
                        <th class="num">Sig.</th>
                        <th class="num">VIF</th>
                    </tr>
                </thead>
                <tbody>{coef_rows}</tbody>
            </table>
            """
            tables_html = summary_html + coef_html

        else:
            tables_html = f"<div class='info-box'><p>Type: <strong>{a_type}</strong></p><pre>{str(res)}</pre></div>"

        # Uyarılar
        warnings = res.get("warnings", [])
        warnings_html = ""
        if warnings:
            items = "".join(f"<li>{w}</li>" for w in warnings)
            w_title = "İstatistiksel Tanı ve Uyarılar:" if is_tr else "Statistical Diagnostics & Warnings:"
            warnings_html = f"""
            <div class="warning-box">
                <div class="warning-title">{w_title}</div>
                <ul>{items}</ul>
            </div>
            """

        footer_left = "StatWeb Akademik İstatistik Platformu" if is_tr else "StatWeb Academic Statistical Computing Platform"
        footer_right = '"Sayfa " counter(page) " / " counter(pages)' if is_tr else '"Page " counter(page) " of " counter(pages)'
        meta_gen = "Oluşturulma Tarihi" if is_tr else "Generated on"
        meta_plat = "StatWeb İstatistiksel Hesaplama Platformu" if is_tr else "StatWeb Statistical Computing Platform"
        date_str = datetime.now().strftime('%d.%m.%Y %H:%M:%S') if is_tr else datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        # HTML Belgesi
        html = f"""<!DOCTYPE html>
<html lang="{lang}">
<head>
    <meta charset="utf-8">
    <title>StatWeb Report - {analysis.name}</title>
    <style>
        @page {{
            size: A4;
            margin: 18mm 16mm 20mm 16mm;
            @bottom-right {{
                content: {footer_right};
                font-size: 8.5pt;
                color: #64748b;
            }}
            @bottom-left {{
                content: "{footer_left}";
                font-size: 8.5pt;
                color: #94a3b8;
            }}
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0f172a;
            line-height: 1.35;
            font-size: 9.5pt;
        }}
        .header {{
            border-bottom: 2px solid #1e3a8a;
            padding-bottom: 8px;
            margin-bottom: 16px;
        }}
        .title {{
            font-size: 16pt;
            font-weight: 700;
            color: #1e3a8a;
            margin: 0 0 4px 0;
        }}
        .meta {{
            font-size: 8.5pt;
            color: #64748b;
        }}
        h3 {{
            font-size: 10.5pt;
            font-weight: 700;
            color: #1e293b;
            margin-top: 14px;
            margin-bottom: 6px;
            letter-spacing: 0.3px;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
            font-size: 8.5pt;
            page-break-inside: avoid;
        }}
        th, td {{
            border: 1px solid #cbd5e1;
            padding: 4px 6px;
            text-align: left;
            vertical-align: middle;
        }}
        th {{
            background-color: #f1f5f9;
            color: #0f172a;
            font-weight: 600;
        }}
        td.num, th.num {{
            text-align: right;
        }}
        tr:nth-child(even) {{
            background-color: #f8fafc;
        }}
        tr.missing-row {{
            background-color: #fffbeb;
            color: #92400e;
        }}
        tr.total-row {{
            background-color: #e2e8f0;
            font-weight: 600;
        }}
        .warning-box {{
            background-color: #fffbeb;
            border-left: 4px solid #f59e0b;
            border-radius: 2px;
            padding: 8px 12px;
            margin-top: 12px;
            font-size: 8.5pt;
            color: #92400e;
            page-break-inside: avoid;
        }}
        .warning-title {{
            font-weight: 700;
            margin-bottom: 4px;
        }}
        .warning-box ul {{
            margin: 0;
            padding-left: 18px;
        }}
        .info-box {{
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 10px;
            margin-top: 10px;
        }}
    </style>
</head>
<body>
    <div class="header">
        <div class="title">{analysis.name}</div>
        <div class="meta">
            {meta_gen}: {date_str} | {meta_plat}
        </div>
    </div>
    <div class="content">
        {tables_html}
        {warnings_html}
    </div>
</body>
</html>
"""
        return html

    @classmethod
    def generate_pdf_report(cls, analysis: AnalysisRun, lang: str = "tr") -> bytes:
        html_str = cls._render_html_template(analysis, lang=lang)
        return HTML(string=html_str).write_pdf()
