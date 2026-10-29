"""
PDF Report Generation Service.

Renders validated statistical analysis results to PDF using WeasyPrint from HTML templates.
CRITICAL: As specified in AGENTS.md, modify HTML templates for layout changes, not the PDF generation logic.
"""

from datetime import datetime
from weasyprint import HTML
from app.models.analysis import AnalysisRun


class ReportService:
    @staticmethod
    def _render_html_template(analysis: AnalysisRun) -> str:
        res = analysis.results
        a_type = analysis.analysis_type

        # Generate tables based on analysis type
        tables_html = ""

        if a_type == "descriptives":
            vars_list = res.get("variables", [])
            rows_html = "".join(
                f"""<tr>
                    <td><strong>{v.get('variable_name')}</strong></td>
                    <td class="num">{v.get('n_valid')}</td>
                    <td class="num">{v.get('n_missing')}</td>
                    <td class="num">{(v.get('mean') if v.get('mean') is not None else '-'):.3f}</td>
                    <td class="num">{(v.get('std_error_mean') if v.get('std_error_mean') is not None else '-'):.3f}</td>
                    <td class="num">{(v.get('std_dev') if v.get('std_dev') is not None else '-'):.3f}</td>
                    <td class="num">{(v.get('variance') if v.get('variance') is not None else '-'):.3f}</td>
                    <td class="num">{(v.get('median') if v.get('median') is not None else '-'):.3f}</td>
                    <td class="num">{(v.get('minimum') if v.get('minimum') is not None else '-'):.3f}</td>
                    <td class="num">{(v.get('maximum') if v.get('maximum') is not None else '-'):.3f}</td>
                    <td class="num">{(v.get('iqr') if v.get('iqr') is not None else '-'):.3f}</td>
                </tr>"""
                for v in vars_list
            )
            tables_html = f"""
            <h3>Descriptive Statistics</h3>
            <table>
                <thead>
                    <tr>
                        <th>Variable</th>
                        <th class="num">N (Valid)</th>
                        <th class="num">Missing</th>
                        <th class="num">Mean</th>
                        <th class="num">Std. Error</th>
                        <th class="num">Std. Dev</th>
                        <th class="num">Variance</th>
                        <th class="num">Median</th>
                        <th class="num">Min</th>
                        <th class="num">Max</th>
                        <th class="num">IQR</th>
                    </tr>
                </thead>
                <tbody>{rows_html}</tbody>
            </table>
            """

        elif a_type == "frequencies":
            for v in res.get("variables", []):
                cats_html = "".join(
                    f"""<tr>
                        <td>{c.get('label')}</td>
                        <td class="num">{c.get('frequency')}</td>
                        <td class="num">{c.get('percent'):.1f}%</td>
                        <td class="num">{(str(c.get('valid_percent')) + '%') if c.get('valid_percent') is not None else '-'}</td>
                        <td class="num">{(str(c.get('cumulative_percent')) + '%') if c.get('cumulative_percent') is not None else '-'}</td>
                    </tr>"""
                    for c in v.get("categories", [])
                )
                tables_html += f"""
                <h3>Frequency Distribution: {v.get('variable_name')} (N={v.get('total')})</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Category / Value</th>
                            <th class="num">Frequency</th>
                            <th class="num">Percent</th>
                            <th class="num">Valid Percent</th>
                            <th class="num">Cumulative Percent</th>
                        </tr>
                    </thead>
                    <tbody>{cats_html}</tbody>
                </table>
                """

        elif a_type == "crosstabs":
            r_cats = res.get("row_categories", [])
            c_cats = res.get("col_categories", [])
            cells = { (c["row_val"], c["col_val"]): c for c in res.get("cells", []) }

            header_cols = "".join(f"<th class='num'>{c['label']}</th>" for c in c_cats)
            grid_rows = ""
            for r in r_cats:
                cells_td = "".join(
                    f"<td class='num'>{cells.get((r['value'], c['value']), {}).get('count', 0)} ({cells.get((r['value'], c['value']), {}).get('row_percent', 0):.1f}%)</td>"
                    for c in c_cats
                )
                grid_rows += f"<tr><td><strong>{r['label']}</strong></td>{cells_td}</tr>"

            chi2_html = "".join(
                f"<tr><td>{t['test_name']}</td><td class='num'>{t['value']:.3f}</td><td class='num'>{t['df']}</td><td class='num'>{t['p_value']:.4f}</td></tr>"
                for t in res.get("chi_square_tests", [])
            )

            tables_html = f"""
            <h3>Cross-tabulation ({res.get('row_var_name')} × {res.get('col_var_name')})</h3>
            <table>
                <thead>
                    <tr><th>{res.get('row_var_name')}</th>{header_cols}</tr>
                </thead>
                <tbody>{grid_rows}</tbody>
            </table>
            <h3>Chi-Square Tests</h3>
            <table>
                <thead>
                    <tr><th>Test</th><th class="num">Value</th><th class="num">df</th><th class="num">Asymp. Sig. (2-sided)</th></tr>
                </thead>
                <tbody>{chi2_html}</tbody>
            </table>
            """

        else:
            tables_html = f"<div class='info-box'><p>Analysis Type: <strong>{a_type}</strong></p><pre>{str(res)}</pre></div>"

        # Complete HTML document
        html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>StatWeb Statistical Report - {analysis.name}</title>
    <style>
        @page {{
            size: A4;
            margin: 20mm;
            @bottom-right {{
                content: "Page " counter(page) " of " counter(pages);
                font-size: 9pt;
                color: #64748b;
            }}
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            color: #1e293b;
            line-height: 1.4;
            font-size: 10pt;
        }}
        .header {{
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 20px;
        }}
        .title {{
            font-size: 18pt;
            font-weight: bold;
            color: #0f172a;
            margin: 0 0 6px 0;
        }}
        .meta {{
            font-size: 9pt;
            color: #64748b;
        }}
        h3 {{
            font-size: 11pt;
            font-weight: bold;
            color: #1e293b;
            margin-top: 18px;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
            font-size: 9pt;
        }}
        th, td {{
            border: 1px solid #cbd5e1;
            padding: 5px 8px;
            text-align: left;
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
            Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | StatWeb Statistical Computing Platform
        </div>
    </div>
    <div class="content">
        {tables_html}
    </div>
</body>
</html>
"""
        return html

    @classmethod
    def generate_pdf_report(cls, analysis: AnalysisRun) -> bytes:
        html_str = cls._render_html_template(analysis)
        return HTML(string=html_str).write_pdf()
