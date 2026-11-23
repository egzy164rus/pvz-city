/* Набор векторных иконок (24×24, обводка currentColor).
   Инлайн-SVG: работает без сети и в песочнице предпросмотра. */

const ICON_PATHS = {
  /* навигация */
  layout: '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
  bag: '<path d="M5.5 8h13l-1.1 11.2a2 2 0 0 1-2 1.8H8.6a2 2 0 0 1-2-1.8L5.5 8z"/><path d="M9 8V6.2a3 3 0 0 1 6 0V8"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3.2 20.2c0-3.2 2.6-5.8 5.8-5.8s5.8 2.6 5.8 5.8"/><path d="M16.6 11.4a3 3 0 1 0-1.2-5.7"/><path d="M17.4 14.7c2.1.6 3.6 2.4 3.6 4.6"/>',
  archive: '<rect x="3" y="3.8" width="18" height="5.2" rx="1.8"/><path d="M4.8 9v9.2a2 2 0 0 0 2 2h10.4a2 2 0 0 0 2-2V9"/><path d="M9.8 13h4.4"/>',

  /* показатели */
  wallet: '<path d="M3.2 8.4A2.4 2.4 0 0 1 5.6 6h11.2a2.4 2.4 0 0 1 2.4 2.4v1.1"/><path d="M3.2 8.4v9.2A2.4 2.4 0 0 0 5.6 20h12.8a2.4 2.4 0 0 0 2.4-2.4v-6.2a2.4 2.4 0 0 0-2.4-2.4H3.2z"/><circle cx="16.4" cy="14.4" r="1.3"/>',
  star: '<path d="M12 3.6l2.6 5.3 5.9.9-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.8l5.9-.9L12 3.6z"/>',
  award: '<circle cx="12" cy="9" r="4.8"/><path d="M8.6 13.2 7.5 21l4.5-2.3 4.5 2.3-1.1-7.8"/>',
  zap: '<path d="M13.2 2.6 4.8 13.8h6.1l-1.1 7.6 8.4-11.2h-6.1l1.1-7.6z"/>',

  /* день */
  truck: '<rect x="2.4" y="7.2" width="10.8" height="9" rx="1.6"/><path d="M13.2 10.4h3.1l3.3 3.2v2.6h-6.4"/><circle cx="6.9" cy="18.2" r="1.8"/><circle cx="16.7" cy="18.2" r="1.8"/>',
  inbox: '<path d="M2.8 13.2h4.6l1.4 2.8h6.4l1.4-2.8h4.6"/><path d="M5.2 4.6h13.6l2.4 8.6v4.2a2 2 0 0 1-2 2H4.8a2 2 0 0 1-2-2v-4.2l2.4-8.6z"/>',
  activity: '<path d="M2.8 12.4h3.4l2.2-5.8 3.2 11 2.6-7.6 1.8 2.4h4.8"/>',
  box: '<path d="M12 2.8 3.2 7.4v9.2L12 21.2l8.8-4.6V7.4L12 2.8z"/><path d="M3.2 7.4 12 12l8.8-4.6M12 12v9.2"/>',
  package: '<path d="M12 3.4 4.4 7.2v8.4l7.6 3.8 7.6-3.8V7.2L12 3.4z"/><path d="M4.4 7.2 12 11l7.6-3.8M12 11v8.4"/><path d="M8.2 5.3l7.6 3.8"/>',
  map: '<path d="M9 3.6 3.2 6v14.4L9 18l6 2.4 5.8-2.4V3.6L15 6 9 3.6z"/><path d="M9 3.6V18M15 6v14.4"/>',
  pin: '<path d="M12 21.2s6.8-6.4 6.8-11a6.8 6.8 0 1 0-13.6 0c0 4.6 6.8 11 6.8 11z"/><circle cx="12" cy="10.2" r="2.6"/>',
  clock: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.4V12l3.2 2.1"/>',
  check: '<path d="M4.8 12.6 9.4 17 19.2 6.8"/>',
  x: '<path d="M6.4 6.4 17.6 17.6M17.6 6.4 6.4 17.6"/>',
  chevron: '<path d="M9.4 5.4 16.2 12l-6.8 6.6"/>',
  plus: '<path d="M12 5.2v13.6M5.2 12h13.6"/>',
  refresh: '<path d="M4 10.2a8 8 0 0 1 13.6-4.4L20.4 8"/><path d="M20.4 3.6V8h-4.4"/><path d="M20 13.8a8 8 0 0 1-13.6 4.4L3.6 16"/><path d="M3.6 20.4V16h4.4"/>',
  undo: '<path d="M4 8.6h9.4a5.4 5.4 0 0 1 0 10.8H8.4"/><path d="M8.2 4.4 4 8.6l4.2 4.2"/>',
  alert: '<path d="M12 3.6 2.6 20.2h18.8L12 3.6z"/><path d="M12 9.6v5"/><circle cx="12" cy="17.4" r="1"/>',
  info: '<circle cx="12" cy="12" r="8.6"/><path d="M12 11.2v5.4"/><circle cx="12" cy="7.8" r="1"/>',
  help: '<circle cx="12" cy="12" r="8.6"/><path d="M9.6 9.4a2.6 2.6 0 1 1 3.6 2.4c-.8.4-1.2 1-1.2 1.9"/><circle cx="12" cy="16.8" r="1"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 14.4a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 4.2 14H4a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 11 3.4V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.3a2 2 0 1 1 0 4h-.3a1.6 1.6 0 0 0-1.1 1.1z"/>',
  flag: '<path d="M5.4 21V4.2"/><path d="M5.4 4.2h11.2l-1.6 4.2 1.6 4.2H5.4"/>',
  lamp: '<path d="M9.4 17.6h5.2M10.4 21h3.2"/><path d="M12 3.2a6 6 0 0 0-3.4 10.9v3.5h6.8v-3.5A6 6 0 0 0 12 3.2z"/>',
  scan: '<path d="M4 8.4V6.6A2.6 2.6 0 0 1 6.6 4h1.8M15.6 4h1.8A2.6 2.6 0 0 1 20 6.6v1.8M20 15.6v1.8A2.6 2.6 0 0 1 17.4 20h-1.8M8.4 20H6.6A2.6 2.6 0 0 1 4 17.4v-1.8"/><path d="M3.4 12h17.2"/>',
  printer: '<path d="M7.2 8.4V4.2h9.6v4.2"/><rect x="3.6" y="8.4" width="16.8" height="7.6" rx="2"/><path d="M7.2 16h9.6v4.2H7.2z"/>',
  card: '<rect x="2.6" y="5.4" width="18.8" height="13.2" rx="2.6"/><path d="M2.6 10h18.8"/><path d="M6.4 15h3.8"/>',
  coffee: '<path d="M4 8.2h11.6v6.2a5.2 5.2 0 0 1-5.2 5.2H9.2A5.2 5.2 0 0 1 4 14.4V8.2z"/><path d="M15.6 9.4h2.2a2.6 2.6 0 0 1 0 5.2h-2.2"/><path d="M4 20.6h11.6"/>',
  sofa: '<path d="M5.4 11.4V8.6a2 2 0 0 1 2-2h9.2a2 2 0 0 1 2 2v2.8"/><path d="M2.8 12.6a2 2 0 0 1 3.8.9v3.1h10.8v-3.1a2 2 0 0 1 3.8-.9v6.2H2.8v-6.2z"/>',
  door: '<path d="M5.4 21V4.6a1.4 1.4 0 0 1 1.4-1.4h8.4a1.4 1.4 0 0 1 1.4 1.4V21"/><path d="M3.4 21h17.2"/><circle cx="13.8" cy="12" r="1"/>',
  wind: '<path d="M3.4 8.2h10.4a3 3 0 1 0-3-3"/><path d="M3.4 12h14.2a3 3 0 1 1-3 3"/><path d="M3.4 15.8h6.8"/>',
  music: '<path d="M9.4 18.4V6.4l10-2v12"/><circle cx="6.8" cy="18.4" r="2.6"/><circle cx="16.8" cy="16.4" r="2.6"/>',
  video: '<rect x="2.8" y="6.2" width="12.4" height="11.6" rx="2.6"/><path d="M15.2 11 21.2 7.6v8.8L15.2 13"/>',
  shelf: '<path d="M4 3.6v16.8M20 3.6v16.8"/><path d="M4 9.6h16M4 15.4h16"/>',
  fragile: '<path d="M12 3.4 4.4 7.2v8.4l7.6 3.8 7.6-3.8V7.2L12 3.4z"/><path d="M12 8.6v3.2M12 14.4v.2"/>',
  boxes: '<rect x="2.6" y="7.4" width="8.6" height="8.8" rx="1.6"/><rect x="12.8" y="10.6" width="8.6" height="8.8" rx="1.6"/><path d="M2.6 11.4h8.6M12.8 14.6h8.6"/>',
  store: '<path d="M3.4 9.4 5 4.2h14l1.6 5.2"/><path d="M4.6 9.4V20h14.8V9.4"/><path d="M3.4 9.4h17.2"/><path d="M9.4 20v-5.4h5.2V20"/>',
  cart: '<circle cx="9.4" cy="19.6" r="1.5"/><circle cx="17.6" cy="19.6" r="1.5"/><path d="M2.6 3.6h2.8l2.4 11.2h11l2-8.2H7"/>',
  user: '<circle cx="12" cy="8" r="3.4"/><path d="M5.4 20.4a6.6 6.6 0 0 1 13.2 0"/>',
  loader: '<circle cx="12" cy="7.4" r="3.2"/><path d="M6.2 20.4v-1.8a4 4 0 0 1 4-4h3.6a4 4 0 0 1 4 4v1.8"/><path d="M4.4 12.4 7 15l4.4-2.2"/>',
  manager: '<rect x="3" y="8.2" width="18" height="11.4" rx="2.4"/><path d="M9 8.2V6.4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.8"/><path d="M3 13.2h18"/>',
  sparkle: '<path d="M12 3.2l1.9 4.9 4.9 1.9-4.9 1.9L12 16.8l-1.9-4.9-4.9-1.9 4.9-1.9L12 3.2z"/><path d="M18.6 16.4l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z"/>',
  chart: '<path d="M4 20V4"/><path d="M4 20h16"/><rect x="7.4" y="12" width="3.4" height="5.2" rx="1"/><rect x="13" y="8.2" width="3.4" height="9" rx="1"/>',
  play: '<path d="M8 5.6 18.4 12 8 18.4z"/>',
  pause: '<rect x="8.4" y="6.4" width="2.8" height="11.2" rx="1.2"/><rect x="12.8" y="6.4" width="2.8" height="11.2" rx="1.2"/>',
  fire: '<path d="M12 21c3.6 0 6-2.4 6-5.6 0-4.2-4.4-5.6-4.4-9.8 0 0-3.6 1.6-3.6 5.2 0 1.6.8 2.4.8 3.4 0 1-.8 1.8-1.8 1.8s-1.8-.8-1.8-1.8c0-.4.1-.7.2-1C6.6 13.9 6 14.7 6 15.6 6 18.6 8.4 21 12 21z"/>',
};

function icon(name, cls){
  const p = ICON_PATHS[name];
  if (!p) return '';
  return `<svg class="i${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}

/* иконка предмета по его id */
const ITEM_ICONS = {
  counter:'store', banner:'flag', light:'lamp', scanner:'scan', printer:'printer',
  terminal:'card', coffee:'coffee', sofa:'sofa', fitting:'door', ac:'wind',
  music:'music', cam:'video', shelfStd:'shelf', shelfFrag:'fragile', shelfKgt:'boxes',
};
function itemIcon(id, cls){ return icon(ITEM_ICONS[id] || 'box', cls); }

const ROLE_ICONS = { seller:'user', loader:'loader', manager:'manager' };
function roleIcon(role, cls){ return icon(ROLE_ICONS[role] || 'user', cls); }
