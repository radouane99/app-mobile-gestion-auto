"""Render the production ReportPdf Canvas commands emitted by JVM QA adapters."""
import json
import sys
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader
root=Path(__file__).parent
pdfmetrics.registerFont(TTFont('Arial', 'C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('ArialBold', 'C:/Windows/Fonts/arialbd.ttf'))
output=root/'output/pdf';output.mkdir(parents=True,exist_ok=True)
resale='--resale' in sys.argv
coach='--coach' in sys.argv
finance='year' if '--finance-year' in sys.argv else 'month' if '--finance-month' in sys.argv else None
path=output/('AutoCarnet-exemple-bilan-consommation.pdf' if coach else 'AutoCarnet-exemple-dossier-revente.pdf' if resale else 'AutoCarnet-exemple-rapport-mensuel.pdf')
if finance: path=output/('AutoCarnet-exemple-financier-'+finance+'.pdf')
doc=canvas.Canvas(str(path),pagesize=(595,842))
doc.setTitle('AutoCarnet - Exemple fictif de rapport mensuel')
pages=json.loads((root/('build/coach-commands.json' if coach else 'build/resale-commands.json' if resale else 'build/report-commands.json')).read_text('utf-8'))['pages']
if finance: pages=json.loads((root/('build/finance-'+finance+'-commands.json')).read_text('utf-8'))['pages']
for page in pages:
    for item in page:
        color=item['color']&0xffffff
        doc.setFillColorRGB(((color>>16)&255)/255,((color>>8)&255)/255,(color&255)/255)
        if item['kind']=='rect':
            doc.rect(item['left'],842-item['bottom'],item['right']-item['left'],item['bottom']-item['top'],fill=1,stroke=0)
        elif item['kind']=='image':
            doc.drawImage(item['path'],item['left'],842-item['bottom'],width=item['right']-item['left'],height=item['bottom']-item['top'])
        else:
            font='ArialBold' if item['bold'] else 'Arial'
            doc.setFont(font,item['size'])
            assert item['x']+pdfmetrics.stringWidth(item['text'],font,item['size'])<596, item['text']
            doc.drawString(item['x'],842-item['y'],item['text'])
    doc.showPage()
doc.save()
reader=PdfReader(path)
assert len(reader.pages)==len(pages)
text='\n'.join(p.extract_text() for p in reader.pages)
assert 'EXEMPLE FICTIF' in text
if resale:
    assert 'ENTRETIEN & REVENTE' in text and 'REF-DEMO-123' in text and 'PRIVATEPLATE' not in text and 'SECRETNOTE' not in text
else:
    assert 'TOTAL PAYÉ' in text and 'Dépenses par catégorie' in text
    if coach:
        assert 'Consommation : repères personnalisés' in text and 'Hausse répétée' in text
print(f'PDF exemple vérifié : {len(pages)} pages, texte et marges contrôlés : {path}')
