from pathlib import Path
from xml.sax.saxutils import escape
import re
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import A4

ROOT = Path(__file__).resolve().parent.parent
styles = getSampleStyleSheet()
for name, options in {
    'Title2': dict(fontName='Helvetica-Bold', fontSize=24, leading=28, spaceAfter=16, textColor=colors.HexColor('#163b4c')),
    'H2': dict(fontName='Helvetica-Bold', fontSize=15, leading=19, spaceBefore=13, spaceAfter=8, keepWithNext=True, textColor=colors.HexColor('#163b4c')),
    'Body2': dict(fontName='Helvetica', fontSize=10, leading=13.5, spaceAfter=7),
    'Cell2': dict(fontName='Helvetica', fontSize=8.1, leading=11),
    'Head2': dict(fontName='Helvetica-Bold', fontSize=8.1, leading=11, textColor=colors.white),
}.items():
    styles.add(ParagraphStyle(name=name, **options))

def inline(text):
    text = escape(text.replace('\u2014', '-').replace('\u2013', '-'))
    text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'`([^`]+)`', r'<font name="Courier">\1</font>', text)
    def link(match):
        label, url = match.group(1), match.group(2)
        if not url.startswith('http'):
            url = 'https://github.com/JonBoyd2401/REA-War-Games/blob/main/' + (url[3:] if url.startswith('../') else 'docs/' + url)
        return '<link href="' + url + '" color="#176593">' + label + '</link>'
    return re.sub(r'\[([^\]]+)\]\(([^)]+)\)', link, text)

def build(source, output, title, footer_label):
    story = []
    lines = (ROOT / 'docs' / source).read_text(encoding='utf-8').splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        i += 1
        if not line.strip():
            continue
        if line.startswith('|'):
            rows = [line]
            while i < len(lines) and lines[i].startswith('|'):
                rows.append(lines[i])
                i += 1
            data = []
            for row in rows:
                if re.fullmatch(r'[\s|:\-]+', row):
                    continue
                data.append([Paragraph(inline(c.strip()), styles['Head2' if not data else 'Cell2']) for c in row.strip('|').split('|')])
            count = len(data[0])
            if count == 5:
                widths = [143, 87, 87, 87, 87]
            elif count == 4:
                widths = [66, 229, 98, 98] if rows[0].split('|')[1].strip() == 'Target' else [161, 110, 110, 110]
            else:
                widths = [143, 174, 174]
            table = Table(data, colWidths=widths, repeatRows=1, hAlign='LEFT')
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#163b4c')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#edf4f6')]),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 7), ('RIGHTPADDING', (0, 0), (-1, -1), 7),
                ('TOPPADDING', (0, 0), (-1, -1), 7), ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
                ('LINEBELOW', (0, 0), (-1, 0), .7, colors.HexColor('#163b4c')),
                ('LINEBELOW', (0, 1), (-1, -1), .3, colors.HexColor('#c1d3da')),
            ]))
            story.extend([KeepTogether([table, Spacer(1, 9)])] if len(data) <= 9 else [table, Spacer(1, 9)])
        elif line.startswith('# '):
            story.append(Paragraph(inline(line[2:]), styles['Title2']))
        elif line.startswith('## '):
            story.append(Paragraph(inline(line[3:]), styles['H2']))
        else:
            story.append(KeepTogether([Paragraph(inline(line[2:] if line.startswith('- ') else line), styles['Body2'], bulletText='-' if line.startswith('- ') else None)]))
    grouped = []
    index = 0
    while index < len(story):
        item = story[index]
        if (isinstance(item, Paragraph) and item.style.name == 'H2'
                and index + 1 < len(story) and isinstance(story[index + 1], KeepTogether)):
            content = [item] + story[index + 1]._content
            consumed = 2
            if index + 2 < len(story) and isinstance(story[index + 2], KeepTogether):
                following = story[index + 2]._content
                if following and isinstance(following[0], Paragraph) and following[0].getPlainText().startswith(('Valid predictors:', 'This secondary score')):
                    content += following
                    consumed = 3
            grouped.append(KeepTogether(content))
            index += consumed
        else:
            grouped.append(item)
            index += 1
    story = grouped
    def footer(canvas, document):
        canvas.saveState()
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(colors.HexColor('#526272'))
        canvas.drawString(52, 28, 'REA War Games | ' + footer_label + ' | 19 October 2026')
        canvas.drawRightString(A4[0] - 52, 28, str(document.page))
        canvas.restoreState()
    result = ROOT / 'docs' / output
    document = SimpleDocTemplate(str(result), pagesize=A4, leftMargin=52, rightMargin=52,
                                topMargin=44, bottomMargin=48, title=title,
                                author='REA War Games research', subject='Measured reconstruction accuracy, server boundaries and product trade-offs')
    document.build(story, onFirstPage=footer, onLaterPages=footer)
    print(result.name)

build('CONTEXT_BENCHMARK.md', 'REA_Context_Effectiveness_Report.pdf',
      'Exact workflow and private context effectiveness', 'Exact workflows and contexts')
build('REA_SaaS_Protection_White_Paper_Contexts.md', 'REA_SaaS_Protection_White_Paper_Contexts.pdf',
      'Protecting SaaS behaviour from REA-assisted reconstruction', 'Current white paper')
