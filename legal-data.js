/* ============================================================
   DATOS LEGALES — obligatorios por el art. 10 de la LSSI-CE.
   Rellena cada campo marcado con [COMPLETAR]. Mientras quede
   alguno sin rellenar, se mostrará resaltado en el pie de página.
   Se usan en boutique.html, aviso-legal.html, privacidad.html
   y cookies.html.
   ============================================================ */
window.LEGAL = {
  // Denominación social exacta, como figura en las escrituras (p. ej. 'Ejemplo Inmobiliaria, S.L.').
  titular: 'ROCOBORT, S.L.',
  // Nombre comercial con el que opera la agencia.
  nombreComercial: 'The Brokery',
  web: 'thebrokery.es',
  // NIF de la sociedad (antiguo CIF). En una S.L. empieza por B.
  nif: 'B88790894',
  // Datos de inscripción en el Registro Mercantil (art. 10.1.b LSSI-CE).
  // Formato habitual: 'Registro Mercantil de Madrid, tomo X, folio Y, hoja M-Z'.
  registroMercantil: '[COMPLETAR Registro Mercantil de Madrid, tomo …, folio …, hoja M-…]',
  domicilio: 'Calle Tomás y Valiente, 5, 6.º 3 C, 28660 Boadilla del Monte (Madrid)',
  email: 'alvaro@thebrokery.com',
  // Teléfono general de la empresa (no un móvil personal). Vacío = no se muestra.
  telefono: '',
  // Registro de agentes inmobiliarios: obligatorio en Cataluña (AICAT, Decreto 12/2010)
  // y en la Comunitat Valenciana (Ley 2/2017). En otras comunidades es voluntario: déjalo vacío si no aplica.
  // En la Comunidad de Madrid no es obligatorio, por eso está vacío.
  registroAgentes: '',
  // Seguro de responsabilidad civil y garantía/caución (obligatorios donde el registro lo es).
  seguroRC: ''
};

/* Rellena los elementos <span data-legal="campo"></span> y los recuadros
   <div data-rgpd></div> de información básica sobre protección de datos
   (primera capa informativa, art. 11 LOPDGDD) en todas las páginas.
   Con data-rgpd="empleo" se muestra la versión para candidaturas.
   Las páginas que crean formularios después de cargar llaman a rellenarLegal(elemento). */
const FINALIDADES_RGPD = {
  '': 'Atender tu solicitud y, si lo autorizas, enviarte comunicaciones comerciales.',
  empleo: 'Gestionar tu candidatura y valorar tu perfil para procesos de selección de The Brokery España. Conservaremos tu candidatura un máximo de 12 meses.'
};
window.rellenarLegal = function(raiz){
  raiz = raiz || document;
  raiz.querySelectorAll('[data-rgpd]').forEach(el => {
    const finalidad = FINALIDADES_RGPD[el.dataset.rgpd || ''] || FINALIDADES_RGPD[''];
    el.innerHTML = `<strong>Información básica sobre protección de datos</strong>
    <table>
      <tr><th>Responsable</th><td><span data-legal="titular"></span> (<span data-legal="nombreComercial"></span>)</td></tr>
      <tr><th>Finalidad</th><td>${finalidad}</td></tr>
      <tr><th>Legitimación</th><td>Tu consentimiento y la aplicación de medidas precontractuales.</td></tr>
      <tr><th>Destinatarios</th><td>No se ceden datos a terceros, salvo obligación legal. Si envías por WhatsApp, Meta actúa como proveedor del servicio de mensajería.</td></tr>
      <tr><th>Derechos</th><td>Acceso, rectificación, supresión, oposición, limitación y portabilidad, además de reclamar ante la AEPD.</td></tr>
      <tr><th>Más info</th><td><a href="privacidad.html" target="_blank">Política de Privacidad</a></td></tr>
    </table>`;
  });
  raiz.querySelectorAll('[data-legal]').forEach(el => {
    const v = window.LEGAL[el.dataset.legal] || '';
    el.textContent = v || '—';
    if(!v || v.startsWith('[COMPLETAR')) el.classList.add('todo');
  });
  raiz.querySelectorAll('[data-legal-if]').forEach(el => {
    if(window.LEGAL[el.dataset.legalIf] === '') el.remove();
  });
};
document.addEventListener('DOMContentLoaded', () => window.rellenarLegal(document));
