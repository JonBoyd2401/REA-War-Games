from pathlib import Path
from xml.sax.saxutils import escape
import re
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,Table,TableStyle,KeepTogether
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
from reportlab.lib.pagesizes import A4
ROOT=Path(__file__).resolve().parent.parent
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='Title2',fontName='Helvetica-Bold',fontSize=23,leading=27,spaceAfter=14))
styles.add(ParagraphStyle(name='H2',fontName='Helvetica-Bold',fontSize=15,leading=19,spaceBefore=12,spaceAfter=8,keepWithNext=True))
styles.add(ParagraphStyle(name='H3',fontName='Helvetica-Bold',fontSize=11.5,leading=15,spaceBefore=10,spaceAfter=6,keepWithNext=True))
styles.add(ParagraphStyle(name='Body2',fontName='Helvetica',fontSize=10,leading=14,spaceAfter=7))
styles.add(ParagraphStyle(name='Cell2',fontName='Helvetica',fontSize=8.6,leading=11.6))
styles.add(ParagraphStyle(name='Head2',fontName='Helvetica-Bold',fontSize=8.6,leading=11.6,textColor=colors.white))
def inline(s):
    s=escape(s.replace('—','-').replace('–','-'))
    s=re.sub(r'\*\*(.*?)\*\*',r'<b>\1</b>',s)
    s=re.sub(r'`([^`]+)`',r'<font name="Courier">\1</font>',s)
    def link(m):
        label,url=m.group(1),m.group(2)
        if not url.startswith('http'):
            url='https://github.com/JonBoyd2401/REA-War-Games/blob/main/'+('docs/'+url if not url.startswith('../') else url[3:])
        return '<link href="'+url+'" color="#195c91">'+label+'</link>'
    return re.sub(r'\[([^\]]+)\]\(([^)]+)\)',link,s)
story=[];lines=(ROOT/'docs/BOUNDARY_FINDINGS.md').read_text(encoding='utf-8').splitlines();i=0
while i<len(lines):
    line=lines[i];i+=1
    if not line.strip():continue
    if line.startswith('|'):
        rows=[line]
        while i<len(lines) and lines[i].startswith('|'):rows.append(lines[i]);i+=1
        data=[]
        for idx,row in enumerate(rows):
            if re.fullmatch(r'[\s|:\-]+',row):continue
            data.append([Paragraph(inline(c.strip()),styles['Head2' if idx==0 else 'Cell2']) for c in row.strip('|').split('|')])
        widths=[146,60,70,215] if len(data[0])==4 else [170,135,186]
        table=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT')
        table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#203a52')),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#f0f4f7')]),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),('GRID',(0,0),(-1,-1),.35,colors.HexColor('#c6cdd3'))]));story.extend([table,Spacer(1,8)]);continue
    if line.startswith('# '):story.append(Paragraph(inline(line[2:]),styles['Title2']))
    elif line.startswith('## '):story.append(Paragraph(inline(line[3:]),styles['H2']))
    elif line.startswith('### '):story.append(Paragraph(inline(line[4:]),styles['H3']))
    else:story.append(Paragraph(inline(line[2:] if line.startswith('- ') else line),styles['Body2'],bulletText='-' if line.startswith('- ') else None))
def footer(canvas,doc):
    canvas.saveState();canvas.setFont('Helvetica',8);canvas.setFillColor(colors.HexColor('#526272'));canvas.drawString(52,28,'REA War Games | Workflow boundary evidence | 19 October 2026');canvas.drawRightString(A4[0]-52,28,str(doc.page));canvas.restoreState()
out=ROOT/'docs/REA_Workflow_Boundary_Report.pdf'
doc=SimpleDocTemplate(str(out),pagesize=A4,leftMargin=52,rightMargin=52,topMargin=44,bottomMargin=48,title='Protecting private SaaS behaviour from reconstruction',author='REA War Games research',subject='Workflow closure, conditional identifiability and measured request denials')
doc.build(story,onFirstPage=footer,onLaterPages=footer);print(out)
