#!/usr/bin/env python3
"""Copia la cabecera, el pie y el botón de WhatsApp de boutique.html a la
plantilla de brokery-comun.js (páginas interiores) y al botón de cada página.

Úsalo cada vez que cambies el menú o el pie de boutique.html:
    python3 scripts/actualizar_plantilla.py
"""
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
portada = (RAIZ / 'boutique.html').read_text(encoding='utf-8')


def bloque(inicio, fin):
    a = portada.index(inicio)
    return portada[a:portada.index(fin, a) + len(fin)]


def interior(html, etiqueta):
    return html[html.index('>') + 1:html.rindex(f'</{etiqueta}>')]


def enlaces_absolutos(html):
    html = re.sub(r'href="#([a-z]+)"', r'href="boutique.html#\1"', html)
    return html.replace('href="boutique.html#top"', 'href="boutique.html"')


def js_literal(texto):
    return texto.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')


cabecera = interior(enlaces_absolutos(bloque('<header id="top">', '</header>')), 'header')
pie = interior(enlaces_absolutos(bloque('<footer>', '</footer>')), 'footer')

comun = RAIZ / 'brokery-comun.js'
js = comun.read_text(encoding='utf-8')
js = re.sub(r'const PLANTILLA_HEADER = `.*?`;', lambda m: f'const PLANTILLA_HEADER = `{js_literal(cabecera)}`;', js, flags=re.S)
js = re.sub(r'const PLANTILLA_FOOTER = `.*?`;', lambda m: f'const PLANTILLA_FOOTER = `{js_literal(pie)}`;', js, flags=re.S)
comun.write_text(js, encoding='utf-8')

boton = bloque('<a class="wa-float"', '</a>')
for pagina in ['propiedades.html', 'propiedad.html', 'valoracion.html', 'agente.html']:
    ruta = RAIZ / pagina
    html = ruta.read_text(encoding='utf-8')
    html = re.sub(r'<a class="wa-float".*?</a>', lambda m: boton, html, count=1, flags=re.S)
    ruta.write_text(html, encoding='utf-8')
print('Plantilla actualizada')
