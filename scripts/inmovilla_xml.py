#!/usr/bin/env python3
"""Descarga el XML diario de Inmovilla y genera propiedades.json para la web.

Solo se copian los campos que la web necesita (nunca el XML completo), para
no publicar datos internos que pudiera traer el fichero.

Uso: INMOVILLA_XML_URL=... python3 scripts/inmovilla_xml.py
"""
import json
import os
import sys
import urllib.request
import xml.etree.ElementTree as ET

URL = os.environ.get('INMOVILLA_XML_URL', '').strip()
SALIDA = os.environ.get('SALIDA', 'propiedades.json')
MAX_FOTOS = 150

# Características (campos 0/1 del XML) que se muestran en la ficha.
EXTRAS = {
    'ascensor': 'Ascensor', 'piscina_prop': 'Piscina privada', 'piscina_com': 'Piscina comunitaria',
    'plaza_gara': 'Plaza de garaje', 'garajedoble': 'Garaje doble', 'trastero': 'Trastero',
    'terraza': 'Terraza', 'balcon': 'Balcón', 'patio': 'Patio', 'jardin': 'Jardín',
    'aire_con': 'Aire acondicionado', 'calefaccion': 'Calefacción', 'chimenea': 'Chimenea',
    'alarma': 'Alarma', 'puerta_blin': 'Puerta blindada', 'gimnasio': 'Gimnasio',
    'urbanizacion': 'Urbanización', 'vistasalmar': 'Vistas al mar', 'luminoso': 'Luminoso',
    'todoext': 'Todo exterior', 'muebles': 'Amueblado', 'cocina_inde': 'Cocina independiente',
    'lavanderia': 'Lavadero', 'sotano': 'Sótano', 'solarium': 'Solárium', 'sauna': 'Sauna',
    'jacuzzi': 'Jacuzzi', 'barbacoa': 'Barbacoa', 'adaptadominus': 'Adaptado a movilidad reducida',
}


def texto(p, campo):
    return (p.findtext(campo) or '').strip()


def numero(p, campo):
    try:
        return float(texto(p, campo).replace(',', '.') or 0)
    except ValueError:
        return 0.0


def entero(p, campo):
    return int(round(numero(p, campo)))


def convertir(p):
    accion = texto(p, 'accion')
    venta = numero(p, 'precioinmo')
    alquiler = numero(p, 'precioalq')
    es_alquiler = 'alquil' in accion.lower() and not venta
    fotos = [texto(p, f'foto{i}') for i in range(1, 151)]
    fotos = [f for f in fotos if f.startswith('http')][:MAX_FOTOS]
    tipo = texto(p, 'tipo_ofer')
    zona = texto(p, 'zona')
    ciudad = texto(p, 'ciudad')
    titulo = texto(p, 'titulo1') or ' en '.join(x for x in [tipo, zona or ciudad] if x)
    descripcion = (texto(p, 'descrip1') or texto(p, 'tinterior')).replace('~', '\n')
    # Coordenadas redondeadas a 3 decimales (≈100 m): el mapa muestra la zona, no la dirección exacta.
    lat, lng = numero(p, 'latitud'), numero(p, 'altitud')
    coords = [round(lat, 3), round(lng, 3)] if lat and lng else None
    return {
        'ref': texto(p, 'ref'),
        'titulo': titulo,
        'tipo': tipo,
        'operacion': 'Alquiler' if es_alquiler else ('Venta' if 'vend' in accion.lower() else accion or 'Venta'),
        'precio': int(round(alquiler if es_alquiler else venta)) or None,
        'precioAlquiler': (int(round(alquiler)) or None) if not es_alquiler else None,
        'zona': ', '.join(x for x in [zona, ciudad] if x),
        'dormitorios': entero(p, 'habitaciones') + entero(p, 'habdobles') or None,
        'banos': entero(p, 'banyos') + entero(p, 'aseos') or None,
        'm2': entero(p, 'm_cons') or None,
        'parcela': entero(p, 'm_parcela') or None,
        'cee': texto(p, 'energialetra').upper() or 'En trámite',
        'destacado': texto(p, 'destacado') == '1',
        'fotos': fotos,
        'descripcion': descripcion[:4000],
        'extras': [nombre for campo, nombre in EXTRAS.items() if texto(p, campo) == '1'],
        'm2Utiles': entero(p, 'm_uties') or None,
        'conservacion': texto(p, 'conservacion'),
        'antiguedad': entero(p, 'antiguedad') or None,
        'planta': texto(p, 'numplanta'),
        'coords': coords,
    }


def main():
    if not URL:
        sys.exit('Falta la variable INMOVILLA_XML_URL')
    with urllib.request.urlopen(URL, timeout=120) as r:
        datos = r.read()
    print(f'XML descargado: {len(datos)} bytes')
    raiz = ET.fromstring(datos)
    print(f'Raíz <{raiz.tag}> con {len(raiz)} elementos:', sorted({c.tag for c in raiz})[:10])
    props = [convertir(p) for p in raiz.iter('propiedad')]
    props = [p for p in props if p['ref']]
    if not props:
        print('Inicio del XML:', datos[:800].decode('utf-8', 'replace'))
        # No borrar las propiedades publicadas si el XML llega vacío por un fallo puntual.
        if os.path.exists(SALIDA):
            try:
                if json.load(open(SALIDA, encoding='utf-8')):
                    sys.exit('El XML no trae propiedades; se mantienen las publicadas.')
            except ValueError:
                pass
    props.sort(key=lambda p: (not p['destacado'], -(p['precio'] or 0)))
    with open(SALIDA, 'w', encoding='utf-8') as f:
        json.dump(props, f, ensure_ascii=False, indent=1)
    print(f'{len(props)} propiedades escritas en {SALIDA}')
    for p in props[:5]:
        print(' -', p['ref'], p['operacion'], p['precio'], p['zona'], p['cee'], len(p['fotos']), 'fotos')


if __name__ == '__main__':
    main()
