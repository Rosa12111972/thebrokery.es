/* ============================================================
   CÓDIGO COMÚN de las páginas de The Brokery España
   (boutique.html, propiedades.html, propiedad.html, valoracion.html).
   Se carga después de legal-data.js y antes del script de cada página.
   ============================================================ */

const BRAND = {
  // BRAND: teléfono general de la agencia (NO un móvil personal). Mientras esté vacío,
  // no se muestra ningún teléfono y los formularios se envían por email.
  telefono: '',           // formato visible, p. ej. '+34 910 000 000'
  whatsapp: '',           // mismo número en formato internacional sin '+' ni espacios, p. ej. '34910000000'
  email: 'rosa@thebrokery.com',  // destino de los formularios y mensajes mientras no haya WhatsApp
  // Emails que se muestran en la sección de contacto
  contactos: [
    { nombre:'Álvaro Corredor', email:'alvaro@thebrokery.com' },
    { nombre:'Guillermo Rocafort', email:'guillermo@thebrokery.com' },
    { nombre:'Rosa Rodríguez', email:'rosa@thebrokery.com' }
  ]
};

/* ---------- utilidades ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pending = v => !v || v.startsWith('[COMPLETAR');
const show = v => pending(v) ? `<span class="todo">${esc(v || '[COMPLETAR]')}</span>` : esc(v);
const fmtEUR = n => n.toLocaleString('es-ES', {maximumFractionDigits:0, useGrouping:'always'}) + ' €';
const waLink = text => BRAND.whatsapp
  ? `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(text)}`
  : `mailto:${BRAND.email}?subject=${encodeURIComponent('Contacto desde la web de The Brokery')}&body=${encodeURIComponent(text)}`;
const CANAL = BRAND.whatsapp ? 'wa' : 'mail';
const openContact = url => CANAL === 'wa' ? window.open(url, '_blank') : (location.href = url);
const nuevaPestana = () => CANAL === 'wa' ? ' target="_blank" rel="noopener"' : '';
const CEE_COLORS = {A:'#00843d',B:'#4cb748',C:'#bfd630',D:'#fff200',E:'#fcb814',F:'#f36e21',G:'#e21a22'};

function trackMeta(event, params){
  // fbq solo existe si el visitante aceptó las cookies de marketing (ver cookie-consent.js).
  if(typeof fbq === 'function') fbq('track', event, params || {});
}

/* ---------- propiedades (datos de Inmovilla) ---------- */
/* propiedades.json lo genera cada día la tarea de GitHub
   .github/workflows/propiedades-inmovilla.yml a partir del XML de la agencia. */
let _propiedades = null;
function cargarPropiedades(){
  if(!_propiedades){
    _propiedades = fetch('propiedades.json', {cache: 'no-cache'})
      .then(r => r.ok ? r.json() : [])
      .then(l => Array.isArray(l) ? l : [])
      .catch(() => []);
  }
  return _propiedades;
}

function ceeBadge(p){
  const cee = String(p.cee || 'En trámite').toUpperCase();
  const letra = cee.replace(/\+/g, '');
  return CEE_COLORS[letra]
    ? `<span class="cee">Cal. energética <b style="background:${CEE_COLORS[letra]};color:${'CD'.includes(letra)?'#111':'#fff'};width:auto;min-width:22px;padding:0 4px;">${esc(cee)}</b></span>`
    : `<span class="cee">Cal. energética: en trámite</span>`;
}

function precioHTML(p){
  const principal = p.precio ? fmtEUR(p.precio) : 'Precio a consultar';
  const nota = p.operacion === 'Alquiler' ? 'al mes' : 'Impuestos y gastos de compraventa no incluidos';
  const alq = p.precioAlquiler ? ` · También en alquiler: ${fmtEUR(p.precioAlquiler)}/mes` : '';
  return `${principal}<small>${nota}${alq}</small>`;
}

function metaHTML(p){
  return [
    p.dormitorios && `${p.dormitorios} dorm.`,
    p.banos && `${p.banos} baños`,
    p.m2 && `${p.m2} m² constr.`,
    p.parcela && `Parcela ${p.parcela} m²`
  ].filter(Boolean).map(t => `<span>${t}</span>`).join('');
}

const urlFicha = p => `propiedad.html?ref=${encodeURIComponent(p.ref)}`;

/* Tarjeta de propiedad usada en la portada y en el buscador. */
function tarjetaPropiedad(p, attrs = ''){
  const img = p.foto || (p.fotos && p.fotos[0]);
  const foto = img ? `background-image:url('${esc(img)}')` : '';
  const ficha = p.ref && p.fotos ? urlFicha(p) : '';
  const titulo = ficha ? `<a href="${ficha}">${esc(p.titulo)}</a>` : esc(p.titulo);
  const imagen = `<div class="prop-img" style="${foto}"><span class="prop-badge">${esc(p.operacion || 'Venta')}</span>${ceeBadge(p)}</div>`;
  return `<article class="prop"${attrs}>
    ${ficha ? `<a href="${ficha}" class="prop-img-link" aria-label="Ver ${esc(p.titulo)}">${imagen}</a>` : imagen}
    <div class="prop-body">
      <div class="prop-price">${precioHTML(p)}</div>
      <div class="prop-title">${titulo}</div>
      <div style="font-size:14px;color:var(--muted);">${esc(p.zona || '')}${p.ref ? ' · Ref. ' + esc(p.ref) : ''}</div>
      <div class="prop-meta">${metaHTML(p)}</div>
      ${ficha
        ? `<a class="btn btn-line" style="margin-top:14px;" href="${ficha}">Ver propiedad</a>`
        : `<a class="btn btn-line" style="margin-top:14px;" href="${waLink(`Hola, me interesa la propiedad ${p.ref ? 'Ref. ' + p.ref : p.titulo}. ¿Me podéis enviar el Documento Informativo Abreviado y más información?`)}"${nuevaPestana()}>Solicitar información</a>`}
    </div>
  </article>`;
}

/* ---------- formularios ---------- */
function validate(form){
  const msg = form.querySelector('.form-msg');
  for(const el of form.querySelectorAll('[required]')){
    const bad = el.type === 'checkbox' ? !el.checked : !el.value.trim() || (el.type === 'email' && !el.checkValidity());
    if(bad){
      msg.textContent = el.type === 'checkbox'
        ? 'Para continuar debes aceptar la Política de Privacidad.'
        : 'Revisa los campos obligatorios (*).';
      el.focus();
      return false;
    }
  }
  msg.textContent = '';
  return true;
}
function sendForm(form, titulo){
  if(!validate(form)) return;
  const lines = [`*${titulo}*`];
  for(const [k, v] of new FormData(form).entries()){
    if(k === 'privacidad') continue;
    if(k === 'comercial') continue;
    if(v && String(v).trim()) lines.push(`${k}: ${v}`);
  }
  lines.push('Política de privacidad: aceptada');
  lines.push(`Comunicaciones comerciales: ${form.comercial && form.comercial.checked ? 'sí' : 'no'}`);
  openContact(waLink(lines.join('\n')));
  trackMeta('Lead', {content_name: titulo});
  form.querySelector('.form-msg').textContent = (CANAL === 'wa' ? 'Se ha abierto WhatsApp' : 'Se ha abierto tu correo') + ' con tu mensaje. ¡Gracias!';
}

/* ---------- plantilla de cabecera y pie para las páginas interiores ----------
   Las páginas con <header data-plantilla></header> y <footer data-plantilla></footer>
   reciben aquí el mismo menú y pie que la portada (boutique.html). Si cambias el menú
   o el pie de boutique.html, cámbialos también aquí. */
const PLANTILLA_HEADER = `
  <div class="nav">
    <a href="boutique.html" class="logo" aria-label="The Brokery España, inicio"><svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70.5 10.3" ><g fill="currentColor"><path d="M0.63 0.446L0.63 0.946L2.303 0.946L2.303 5.662L2.803 5.662L2.803 0.946L4.475 0.946L4.475 0.446L0.63 0.446Z"/><path d="M11.084 0.446L11.084 2.838L8.223 2.838L8.223 0.446L7.723 0.446L7.723 5.662L8.223 5.662L8.223 3.308L11.084 3.308L11.084 5.662L11.584 5.662L11.584 0.446L11.084 0.446Z"/><path d="M15.369 0.446L15.369 5.662L18.427 5.662L18.427 5.162L15.869 5.162L15.869 3.353L18.033 3.353L18.033 2.853L15.869 2.853L15.869 0.946L18.344 0.946L18.344 0.446L15.369 0.446Z"/><path d="M24.797 3.133L24.797 5.163L26.356 5.163C26.947 5.163 27.326 4.708 27.326 4.201C27.326 3.723 26.932 3.133 26.326 3.133L24.797 3.133ZM26.25 2.663C26.795 2.663 27.045 2.217 27.045 1.74C27.045 1.219 26.674 0.938 26.137 0.938L24.797 0.938L24.797 2.663L26.25 2.663ZM26.909 2.883C27.439 2.982 27.825 3.626 27.825 4.201C27.825 4.988 27.295 5.663 26.364 5.663L24.29 5.663L24.29 0.447L26.19 0.447C27.03 0.447 27.545 0.945 27.545 1.74C27.545 2.232 27.386 2.71 26.909 2.883Z"/><path d="M31.769 0.946L31.769 3.126L33.162 3.126C33.896 3.126 34.146 2.596 34.146 2.043C34.146 1.491 33.896 0.946 33.2 0.946L31.769 0.946ZM34.699 5.662L34.085 5.662L32.647 3.626L31.769 3.626L31.769 5.662L31.262 5.662L31.262 0.446L33.2 0.446C34.26 0.446 34.646 1.241 34.646 2.043C34.646 2.831 34.275 3.595 33.26 3.626L34.699 5.662Z"/><path d="M40.406 5.238C41.61 5.238 42.533 4.269 42.533 3.065C42.533 1.862 41.61 0.886 40.406 0.886C39.202 0.886 38.286 1.862 38.286 3.065C38.286 4.269 39.202 5.238 40.406 5.238ZM40.406 0.386C41.889 0.386 43.033 1.582 43.033 3.065C43.033 4.542 41.889 5.738 40.406 5.738C38.93 5.738 37.787 4.542 37.787 3.065C37.787 1.582 38.93 0.386 40.406 0.386Z"/><path d="M48.937 0.446L46.97 2.982L46.97 0.446L46.469 0.446L46.469 5.661L46.97 5.661L46.97 3.209L49.292 5.661L49.967 5.661L47.499 3.058L49.527 0.446L48.937 0.446Z"/><path d="M52.965 0.446L52.965 5.661L56.023 5.661L56.023 5.162L53.465 5.162L53.465 3.353L55.63 3.353L55.63 2.854L53.465 2.854L53.465 0.945L55.94 0.945L55.94 0.446L52.965 0.446Z"/><path d="M59.975 0.946L59.975 3.126L61.368 3.126C62.102 3.126 62.352 2.596 62.352 2.043C62.352 1.491 62.102 0.946 61.406 0.946L59.975 0.946ZM62.904 5.662L62.291 5.662L60.853 3.626L59.975 3.626L59.975 5.662L59.468 5.662L59.468 0.446L61.406 0.446C62.465 0.446 62.852 1.241 62.852 2.043C62.852 2.831 62.481 3.595 61.466 3.626L62.904 5.662Z"/><path d="M69.422 0.446L67.787 2.694L66.167 0.446L65.568 0.446L67.529 3.24L67.529 5.661L68.044 5.661L68.044 3.24L70.027 0.446L69.422 0.446Z"/><path d="M12.79 8.458L12.79 9.91L13.723 9.91L13.723 9.752L12.958 9.752L12.958 8.458L12.79 8.458Z"/><path d="M15.151 9.775C15.477 9.775 15.734 9.551 15.734 9.182C15.734 8.812 15.477 8.588 15.151 8.588C14.823 8.588 14.568 8.815 14.568 9.182C14.568 9.551 14.823 9.775 15.151 9.775ZM15.151 8.428C15.574 8.428 15.904 8.732 15.904 9.182C15.904 9.634 15.574 9.937 15.151 9.937C14.726 9.937 14.398 9.634 14.398 9.182C14.398 8.732 14.726 8.428 15.151 8.428Z"/><path d="M18.119 9.501C18.007 9.775 17.747 9.936 17.441 9.936C17.017 9.936 16.694 9.638 16.694 9.179C16.694 8.723 17.015 8.428 17.441 8.428C17.777 8.428 18.009 8.611 18.1 8.825L17.936 8.871C17.882 8.771 17.739 8.588 17.437 8.588C17.1 8.588 16.864 8.817 16.864 9.181C16.864 9.549 17.113 9.775 17.433 9.775C17.669 9.775 17.864 9.653 17.955 9.457L18.119 9.501Z"/><path d="M19.72 8.991C19.664 8.858 19.579 8.653 19.577 8.651L19.573 8.651C19.571 8.653 19.485 8.858 19.432 8.989L19.272 9.371L19.88 9.371L19.72 8.991ZM19.207 9.524L19.046 9.91L18.865 9.91L19.483 8.458L19.668 8.458L20.286 9.91L20.106 9.91L19.944 9.524L19.207 9.524Z"/><path d="M21.117 8.458L21.285 8.458L21.285 9.753L22.05 9.753L22.05 9.91L21.117 9.91L21.117 8.458Z"/><path d="M24.51 9.2C24.723 9.2 24.863 9.125 24.863 8.916C24.863 8.711 24.727 8.613 24.501 8.613L24.217 8.613L24.217 9.2L24.51 9.2ZM24.529 9.339C24.499 9.341 24.428 9.341 24.396 9.341L24.217 9.341L24.217 9.909L24.049 9.909L24.049 8.457L24.493 8.457C24.835 8.457 25.035 8.626 25.035 8.909C25.035 9.134 24.908 9.264 24.703 9.308L25.062 9.909L24.859 9.909L24.529 9.339Z"/><path d="M25.921 8.458L26.898 8.458L26.898 8.616L26.089 8.616L26.089 9.072L26.72 9.072L26.72 9.23L26.089 9.23L26.089 9.753L26.902 9.753L26.902 9.91L25.921 9.91L25.921 8.458Z"/><path d="M28.53 8.991C28.474 8.858 28.389 8.653 28.387 8.651L28.383 8.651C28.381 8.653 28.295 8.858 28.241 8.989L28.082 9.371L28.69 9.371L28.53 8.991ZM28.017 9.524L27.856 9.91L27.675 9.91L28.293 8.458L28.478 8.458L29.096 9.91L28.916 9.91L28.754 9.524L28.017 9.524Z"/><path d="M29.928 8.458L30.096 8.458L30.096 9.753L30.861 9.753L30.861 9.91L29.928 9.91L29.928 8.458Z"/><path d="M32.86 8.458L33.837 8.458L33.837 8.616L33.028 8.616L33.028 9.072L33.659 9.072L33.659 9.23L33.028 9.23L33.028 9.753L33.841 9.753L33.841 9.91L32.86 9.91L32.86 8.458Z"/><path d="M34.801 9.484C34.818 9.692 34.99 9.785 35.212 9.785C35.423 9.785 35.552 9.701 35.552 9.527C35.552 9.287 35.312 9.274 35.131 9.236C34.934 9.189 34.681 9.119 34.681 8.824C34.681 8.572 34.867 8.428 35.173 8.428C35.442 8.428 35.641 8.54 35.703 8.789L35.541 8.833C35.502 8.673 35.384 8.58 35.17 8.58C34.959 8.58 34.853 8.671 34.853 8.818C34.853 9.011 35.036 9.052 35.243 9.094C35.458 9.135 35.724 9.204 35.724 9.523C35.724 9.798 35.533 9.936 35.21 9.936C34.965 9.936 34.685 9.855 34.639 9.529L34.801 9.484Z"/><path d="M37.122 8.615L37.122 9.91L36.952 9.91L36.952 8.615L36.454 8.615L36.454 8.457L37.622 8.457L37.622 8.615L37.122 8.615Z"/><path d="M38.995 8.991C38.939 8.858 38.854 8.653 38.852 8.651L38.848 8.651C38.846 8.653 38.76 8.858 38.706 8.989L38.547 9.371L39.155 9.371L38.995 8.991ZM38.483 9.524L38.321 9.91L38.14 9.91L38.758 8.458L38.943 8.458L39.561 9.91L39.381 9.91L39.219 9.524L38.483 9.524Z"/><path d="M40.75 8.615L40.75 9.91L40.58 9.91L40.58 8.615L40.082 8.615L40.082 8.457L41.25 8.457L41.25 8.615L40.75 8.615Z"/><path d="M42.108 8.458L43.085 8.458L43.085 8.616L42.276 8.616L42.276 9.072L42.907 9.072L42.907 9.23L42.276 9.23L42.276 9.753L43.089 9.753L43.089 9.91L42.108 9.91L42.108 8.458Z"/><path d="M45.669 9.764C45.864 9.764 45.997 9.675 45.997 9.496C45.997 9.314 45.843 9.212 45.665 9.212L45.283 9.212L45.283 9.764L45.669 9.764ZM45.621 9.08C45.783 9.08 45.901 8.997 45.901 8.839C45.901 8.697 45.791 8.602 45.605 8.602L45.283 8.602L45.283 9.08L45.621 9.08ZM45.843 9.134C45.98 9.156 46.173 9.258 46.173 9.505C46.173 9.749 45.997 9.91 45.677 9.91L45.115 9.91L45.115 8.457L45.638 8.457C45.904 8.457 46.072 8.611 46.072 8.814C46.072 9.005 45.949 9.102 45.843 9.128L45.843 9.134Z"/><path d="M47.49 9.2C47.701 9.2 47.843 9.125 47.843 8.916C47.843 8.711 47.705 8.613 47.48 8.613L47.197 8.613L47.197 9.2L47.49 9.2ZM47.509 9.339C47.478 9.341 47.407 9.341 47.376 9.341L47.197 9.341L47.197 9.909L47.029 9.909L47.029 8.457L47.473 8.457C47.813 8.457 48.015 8.626 48.015 8.909C48.015 9.134 47.888 9.264 47.683 9.308L48.042 9.909L47.838 9.909L47.509 9.339Z"/><path d="M49.566 9.775C49.892 9.775 50.149 9.551 50.149 9.182C50.149 8.812 49.892 8.588 49.566 8.588C49.239 8.588 48.983 8.815 48.983 9.182C48.983 9.551 49.239 9.775 49.566 9.775ZM49.566 8.428C49.989 8.428 50.319 8.732 50.319 9.182C50.319 9.634 49.989 9.937 49.566 9.937C49.141 9.937 48.813 9.634 48.813 9.182C48.813 8.732 49.141 8.428 49.566 8.428Z"/><path d="M51.348 9.426L51.348 9.91L51.18 9.91L51.18 8.457L51.348 8.457L51.348 8.91L51.348 9.223L51.352 9.223L51.588 8.972L52.072 8.457L52.275 8.457L51.73 9.038L52.331 9.911L52.132 9.91L51.605 9.158L51.348 9.426Z"/><path d="M53.148 8.458L54.125 8.458L54.125 8.616L53.316 8.616L53.316 9.072L53.947 9.072L53.947 9.23L53.316 9.23L53.316 9.753L54.13 9.753L54.13 9.91L53.148 9.91L53.148 8.458Z"/><path d="M55.475 9.2C55.687 9.2 55.827 9.125 55.827 8.916C55.827 8.711 55.691 8.613 55.465 8.613L55.182 8.613L55.182 9.2L55.475 9.2ZM55.494 9.339C55.463 9.341 55.392 9.341 55.361 9.341L55.182 9.341L55.182 9.909L55.015 9.909L55.015 8.457L55.458 8.457C55.799 8.457 56 8.626 56 8.909C56 9.134 55.873 9.264 55.668 9.308L56.027 9.909L55.823 9.909L55.494 9.339Z"/><path d="M56.944 9.492C56.961 9.7 57.133 9.793 57.355 9.793C57.567 9.793 57.695 9.708 57.695 9.534C57.695 9.295 57.454 9.282 57.274 9.243C57.077 9.197 56.824 9.127 56.824 8.832C56.824 8.579 57.01 8.436 57.316 8.436C57.585 8.436 57.784 8.548 57.846 8.797L57.685 8.841C57.645 8.681 57.527 8.588 57.313 8.588C57.102 8.588 56.996 8.679 56.996 8.826C56.996 9.019 57.179 9.06 57.386 9.102C57.601 9.143 57.867 9.212 57.867 9.531C57.867 9.805 57.677 9.944 57.352 9.944C57.108 9.944 56.828 9.863 56.782 9.536L56.944 9.492Z"/></g></svg><small>España</small></a>
    <nav class="nav-links" id="navLinks" aria-label="Principal">
      <a href="propiedades.html">Propiedades</a>
      <a href="valoracion.html">Valoración</a>
      <a href="calculadora.html">Calculadora</a>
      <a href="boutique.html#barrios" data-if-barrios>Zonas</a>
      <a href="boutique.html#equipo">Nosotros</a>
      <a href="empleo.html">Empleo</a>
      <a href="boutique.html#contacto">Contacto</a>
    </nav>
    <a class="nav-phone" data-phone hidden></a>
    <button class="burger" id="burger" aria-label="Abrir menú" aria-expanded="false">☰</button>
  </div>
`;
const PLANTILLA_FOOTER = `
  <section class="work-with-us" aria-labelledby="wwuTitle">
    <div class="wwu-box">
      <span class="wwu-eyebrow">Hablemos</span>
      <h2 id="wwuTitle">Trabaja con nosotros</h2>
      <p>Tanto si compras como si vendes, nadie conoce mejor el entorno que The Brokery. Contacta con nosotros y te ayudamos a conseguir tus objetivos inmobiliarios.</p>
      <a class="btn-pill" href="#" data-wa="Hola, vengo de la web de The Brokery y me gustaría hablar con vosotros.">Contacta con nosotros <span aria-hidden="true"></span></a>
      <div class="wwu-or"><span>o</span></div>
      <p class="wwu-alt" data-if-phone hidden>Llámanos al <a data-phone hidden></a></p>
      <p class="wwu-alt" data-if-nophone>Escríbenos a <a href="mailto:rosa@thebrokery.com" data-brand-email>rosa@thebrokery.com</a></p>
    </div>
  </section>
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <div class="foot-logo" id="footLogo" role="img" aria-label="The Brokery"></div>
        <p>Inmobiliaria boutique especializada en propiedades residenciales de alto standing en toda la Comunidad de Madrid.</p>
      </div>
      <div>
        <h4>Explorar</h4>
        <p><a href="propiedades.html">Propiedades</a></p>
        <p><a href="valoracion.html">Valora tu vivienda</a></p>
        <p><a href="boutique.html#equipo">Nuestro equipo</a></p>
        <p><a href="boutique.html#informes">Informes de mercado</a></p>
        <p><a href="empleo.html">Trabaja en The Brokery</a></p>
      </div>
      <div>
        <h4>Herramientas</h4>
        <p><a href="calculadora.html#calculadora">Calculadora de rentabilidad</a></p>
        <p><a href="calculadora.html#hipoteca">Calculadora de hipoteca</a></p>
        <p><a href="boutique.html#normativa">Transparencia y normativa</a></p>
      </div>
      <div>
        <h4>Contacto</h4>
        <p><a data-phone hidden></a></p>
        <p><a href="#" data-wa="Hola, vengo de la web de The Brokery y quiero más información." data-label-wa="WhatsApp" data-label-mail="Email">WhatsApp</a></p>
        <p id="footAddress"></p>
      </div>
    </div>

    <div class="foot-legal">
      <!-- NORMATIVA (art. 10 LSSI-CE): datos identificativos del prestador. Se rellenan desde LEGAL en el script. -->
      <p id="legalIdent"></p>
      <p id="legalRegistro"></p>
      <p>Hojas de reclamaciones a disposición de los consumidores y usuarios. La información de las propiedades no tiene carácter contractual.</p>
      <div class="foot-links">
        <a href="aviso-legal.html">Aviso legal</a>
        <a href="privacidad.html">Política de privacidad</a>
        <a href="cookies.html">Política de cookies</a>
        <button type="button" data-cookie-settings>Configurar cookies</button>
      </div>
      <p>© <span id="year"></span> The Brokery España · ROCOBORT, S.L. Todos los derechos reservados.</p>
    </div>
  </div>
`;
document.querySelectorAll('header[data-plantilla]').forEach(el => { el.innerHTML = PLANTILLA_HEADER; });
document.querySelectorAll('footer[data-plantilla]').forEach(el => { el.innerHTML = PLANTILLA_FOOTER; });

/* ---------- elementos comunes: cabecera, pie, contacto ---------- */
(function iniciarComun(){
  // Teléfono y canal de contacto
  document.querySelectorAll('[data-phone]').forEach(a => {
    if(!BRAND.telefono) return;
    a.textContent = BRAND.telefono;
    a.href = 'tel:' + BRAND.telefono.replace(/\s/g, '');
    a.hidden = false;
  });
  document.querySelectorAll('[data-label-wa]').forEach(el => { el.textContent = el.dataset['label' + (CANAL === 'wa' ? 'Wa' : 'Mail')]; });
  document.querySelectorAll('[data-if-phone]').forEach(el => { el.hidden = !BRAND.telefono; });
  document.querySelectorAll('[data-if-nophone]').forEach(el => { el.hidden = !!BRAND.telefono; });
  document.querySelectorAll('[data-brand-email]').forEach(a => { a.href = 'mailto:' + BRAND.email; a.textContent = BRAND.email; });
  const flotante = $('.wa-float');
  if(flotante && BRAND.whatsapp) flotante.hidden = false;

  // Año y logo del pie
  const year = document.getElementById('year');
  if(year) year.textContent = new Date().getFullYear();
  const footLogo = $('#footLogo'), logo = $('.logo svg');
  if(footLogo && logo) footLogo.innerHTML = logo.outerHTML;

  // Cabecera: transparente sobre la portada y sólida al bajar (o siempre, con data-solid)
  const header = $('header'), nav = $('#navLinks'), burger = $('#burger');
  if(header && nav && burger){
    const siempre = header.hasAttribute('data-solid');
    const onScroll = () => header.classList.toggle('solid', siempre || window.scrollY > 40 || nav.classList.contains('open'));
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open);
      onScroll();
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); onScroll(); }));
  }

  // Datos legales del pie (art. 10 LSSI-CE)
  const ident = $('#legalIdent');
  if(ident) ident.innerHTML = `Titular: ${show(LEGAL.titular)} (${show(LEGAL.nombreComercial)}) · NIF: ${show(LEGAL.nif)} · Domicilio social: ${show(LEGAL.domicilio)} · ${show(LEGAL.registroMercantil)} · Email: ${show(LEGAL.email)}${LEGAL.telefono ? ' · Tel.: ' + show(LEGAL.telefono) : ''}`;
  const registro = $('#legalRegistro');
  if(registro) registro.innerHTML = LEGAL.registroAgentes === '' ? '' : `Registro de Agentes Inmobiliarios: ${show(LEGAL.registroAgentes)} · Seguro de responsabilidad civil: ${show(LEGAL.seguroRC)}`;
  const addr = $('#footAddress');
  if(addr && !pending(LEGAL.domicilio)) addr.textContent = LEGAL.domicilio;
  const emails = $('#contactEmail');
  if(emails) emails.innerHTML = BRAND.contactos.map(c => `<span class="contact-person">${esc(c.nombre)} · <a href="mailto:${esc(c.email)}">${esc(c.email)}</a></span>`).join('');

  // Enlaces de contacto (WhatsApp o email)
  document.querySelectorAll('[data-wa]').forEach(a => {
    a.href = waLink(a.dataset.wa);
    if(CANAL === 'wa'){ a.target = '_blank'; a.rel = 'noopener'; } else a.removeAttribute('target');
    a.addEventListener('click', () => trackMeta('Contact'));
  });
})();

/* ============================================================
   EQUIPO — se usa en la portada (sección «Nuestro equipo») y en la
   página individual de cada persona (agente.html?id=…).
   · bio: párrafos de presentación. Solo información real y confirmada.
   · idiomas / especialidades: listas opcionales; si están vacías no se muestran.
   El primero (lead:true) aparece solo en la primera fila.
   ============================================================ */
const EQUIPO = [
  { id:'oleg-bortman', nombre:'Oleg Bortman', cargo:'Cofundador', subcargo:'Associate Broker', lead:true,
    telefono:'+1 602 402 2296', email:'Oleg@TheBrokery.com', foto:'img/equipo-oleg.jpg',
    redes:{ instagram:'https://www.instagram.com/olegbortman1/', youtube:'https://www.youtube.com/@olegbortman',
             linkedin:'https://www.linkedin.com/in/oleg-bortman', minnect:'http://expert.minnect.com/@OlegBortman' },
    bio:[], idiomas:[], especialidades:[] },
  { id:'alvaro-corredor', nombre:'Álvaro Corredor Ochoa, PhD', cargo:'Director de Operaciones – España', subcargo:'Global Real Estate Professional',
    telefono:'+34 641 836 977', email:'Alvaro@TheBrokery.com', foto:'img/equipo-alvaro.jpg',
    bio:[], idiomas:[], especialidades:[] },
  { id:'rosa-rodriguez', nombre:'Rosa Rodríguez', cargo:'Gerente Comercial', subcargo:'',
    telefono:'+34 698 222 520', email:'Rosa@TheBrokery.com', foto:'img/equipo-rosa.jpg',
    redes:{ instagram:'https://www.instagram.com/rosarodriguezthebrokery/', linkedin:'https://www.linkedin.com/in/rosa-rodr%C3%ADguez-50b741b4/' },
    bio:[], idiomas:[], especialidades:[] },
  { id:'guillermo-rocafort', nombre:'Guillermo Rocafort Moreno', cargo:'Director de Desarrollo de Negocio', subcargo:'',
    telefono:'+34 669 797 659', email:'Guillermo@TheBrokery.com', foto:'img/equipo-guillermo.jpg',
    bio:[], idiomas:[], especialidades:[] }
];

const urlAgente = a => `agente.html?id=${encodeURIComponent(a.id)}`;
const telHref = t => 'tel:' + t.replace(/[^\d+]/g, '');

function tarjetaEquipo(a){
  return `<article class="card-person${a.lead ? ' lead' : ''}">
    <a href="${urlAgente(a)}" class="card-person-link" aria-label="Ver la página de ${esc(a.nombre)}"><img src="${esc(a.foto)}" alt="${esc(a.nombre)}" loading="lazy"></a>
    <h3><a href="${urlAgente(a)}">${esc(a.nombre)}</a></h3>
    <p class="role">${esc(a.cargo)}${a.subcargo ? `<br><span>${esc(a.subcargo)}</span>` : ''}</p>
    ${a.telefono ? `<p><a href="${telHref(a.telefono)}">${esc(a.telefono)}</a></p>` : ''}
    <p><a href="mailto:${esc(a.email)}">${esc(a.email)}</a></p>
    <p><a class="card-person-more" href="${urlAgente(a)}">Ver perfil →</a></p>
  </article>`;
}
