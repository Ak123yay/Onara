// Icons — clean line icons for hi-fi UI
const Ic = ({ name, size = 16, color = 'currentColor', strokeWidth = 1.5 }) => {
  const s = { fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const v = `0 0 24 24`;
  const w = size, h = size;
  switch (name) {
    case 'search': return <svg width={w} height={h} viewBox={v}><circle cx="11" cy="11" r="7" {...s}/><path d="M16 16 L21 21" {...s}/></svg>;
    case 'arrow-r': return <svg width={w} height={h} viewBox={v}><path d="M5 12 H19 M13 6 L19 12 L13 18" {...s}/></svg>;
    case 'arrow-l': return <svg width={w} height={h} viewBox={v}><path d="M19 12 H5 M11 6 L5 12 L11 18" {...s}/></svg>;
    case 'arrow-up-right': return <svg width={w} height={h} viewBox={v}><path d="M7 17 L17 7 M9 7 H17 V15" {...s}/></svg>;
    case 'check': return <svg width={w} height={h} viewBox={v}><path d="M5 12 L10 17 L19 7" {...s}/></svg>;
    case 'check-circle': return <svg width={w} height={h} viewBox={v}><circle cx="12" cy="12" r="9" {...s}/><path d="M8 12 L11 15 L16 9" {...s}/></svg>;
    case 'plus': return <svg width={w} height={h} viewBox={v}><path d="M12 5 V19 M5 12 H19" {...s}/></svg>;
    case 'x': return <svg width={w} height={h} viewBox={v}><path d="M6 6 L18 18 M18 6 L6 18" {...s}/></svg>;
    case 'pin': return <svg width={w} height={h} viewBox={v}><path d="M12 21 C 12 21 5 14 5 9 a7 7 0 0 1 14 0 c0 5 -7 12 -7 12 z" {...s}/><circle cx="12" cy="9" r="2.5" {...s}/></svg>;
    case 'star': return <svg width={w} height={h} viewBox={v}><path d="M12 3 L14.5 9 L21 9.7 L16 14 L17.3 20.5 L12 17.3 L6.7 20.5 L8 14 L3 9.7 L9.5 9 Z" {...s}/></svg>;
    case 'star-fill': return <svg width={w} height={h} viewBox={v}><path d="M12 3 L14.5 9 L21 9.7 L16 14 L17.3 20.5 L12 17.3 L6.7 20.5 L8 14 L3 9.7 L9.5 9 Z" fill={color} stroke={color} strokeWidth="0.5" strokeLinejoin="round"/></svg>;
    case 'sparkle': return <svg width={w} height={h} viewBox={v}><path d="M12 3 L13.5 10 L21 12 L13.5 14 L12 21 L10.5 14 L3 12 L10.5 10 Z" {...s}/></svg>;
    case 'cog': return <svg width={w} height={h} viewBox={v}><circle cx="12" cy="12" r="3" {...s}/><path d="M12 2 V4 M12 20 V22 M22 12 H20 M4 12 H2 M19 5 L17.5 6.5 M6.5 17.5 L5 19 M19 19 L17.5 17.5 M6.5 6.5 L5 5" {...s}/></svg>;
    case 'globe': return <svg width={w} height={h} viewBox={v}><circle cx="12" cy="12" r="9" {...s}/><path d="M3 12 H21 M12 3 C 8 7 8 17 12 21 M12 3 C 16 7 16 17 12 21" {...s}/></svg>;
    case 'menu': return <svg width={w} height={h} viewBox={v}><path d="M4 6 H20 M4 12 H20 M4 18 H20" {...s}/></svg>;
    case 'phone': return <svg width={w} height={h} viewBox={v}><path d="M5 4 H9 L11 9 L8.5 11 C 10 14 11 15 14 16.5 L16 14 L21 16 V20 C 21 20.5 20.5 21 20 21 C 11 21 3 13 3 5 C 3 4.5 3.5 4 4 4 Z" {...s}/></svg>;
    case 'mail': return <svg width={w} height={h} viewBox={v}><rect x="3" y="5" width="18" height="14" rx="1" {...s}/><path d="M3 7 L12 13 L21 7" {...s}/></svg>;
    case 'edit': return <svg width={w} height={h} viewBox={v}><path d="M16 3 L21 8 L9 20 L4 21 L5 16 Z" {...s}/></svg>;
    case 'eye': return <svg width={w} height={h} viewBox={v}><path d="M2 12 C 5 6 19 6 22 12 C 19 18 5 18 2 12 Z" {...s}/><circle cx="12" cy="12" r="3" {...s}/></svg>;
    case 'trash': return <svg width={w} height={h} viewBox={v}><path d="M4 7 H20 M9 7 V4 H15 V7 M6 7 L7 20 H17 L18 7" {...s}/></svg>;
    case 'clock': return <svg width={w} height={h} viewBox={v}><circle cx="12" cy="12" r="9" {...s}/><path d="M12 7 V12 L15 14" {...s}/></svg>;
    case 'home': return <svg width={w} height={h} viewBox={v}><path d="M4 11 L12 4 L20 11 V20 H14 V14 H10 V20 H4 Z" {...s}/></svg>;
    case 'sites': return <svg width={w} height={h} viewBox={v}><rect x="3" y="4" width="18" height="16" rx="1" {...s}/><path d="M3 8 H21 M7 6 H7.01" {...s}/></svg>;
    case 'bolt': return <svg width={w} height={h} viewBox={v}><path d="M13 2 L4 14 H11 L10 22 L20 10 H13 Z" {...s}/></svg>;
    case 'logout': return <svg width={w} height={h} viewBox={v}><path d="M9 21 H4 V3 H9 M16 17 L21 12 L16 7 M21 12 H9" {...s}/></svg>;
    case 'user': return <svg width={w} height={h} viewBox={v}><circle cx="12" cy="8" r="4" {...s}/><path d="M4 21 C 4 16 8 14 12 14 C 16 14 20 16 20 21" {...s}/></svg>;
    case 'card': return <svg width={w} height={h} viewBox={v}><rect x="3" y="6" width="18" height="13" rx="1" {...s}/><path d="M3 10 H21" {...s}/></svg>;
    case 'lock': return <svg width={w} height={h} viewBox={v}><rect x="5" y="11" width="14" height="10" rx="1" {...s}/><path d="M8 11 V8 a4 4 0 0 1 8 0 V11" {...s}/></svg>;
    case 'copy': return <svg width={w} height={h} viewBox={v}><rect x="8" y="8" width="13" height="13" rx="1" {...s}/><path d="M16 8 V4 H3 V17 H8" {...s}/></svg>;
    case 'download': return <svg width={w} height={h} viewBox={v}><path d="M12 4 V16 M6 11 L12 17 L18 11 M4 20 H20" {...s}/></svg>;
    case 'refresh': return <svg width={w} height={h} viewBox={v}><path d="M4 9 a8 8 0 0 1 14 -3 L21 9 M21 4 V9 H16 M20 15 a8 8 0 0 1 -14 3 L3 15 M3 20 V15 H8" {...s}/></svg>;
    case 'paint': return <svg width={w} height={h} viewBox={v}><path d="M5 21 L9 17 M9 17 a3 3 0 1 1 3 -5 L20 4 L21 6 L13 14 a3 3 0 0 1 -4 3 Z" {...s}/></svg>;
    case 'layout': return <svg width={w} height={h} viewBox={v}><rect x="3" y="3" width="18" height="18" rx="1" {...s}/><path d="M3 9 H21 M9 9 V21" {...s}/></svg>;
    case 'send': return <svg width={w} height={h} viewBox={v}><path d="M22 2 L11 13 M22 2 L15 22 L11 13 L2 9 Z" {...s}/></svg>;
    case 'circle': return <svg width={w} height={h} viewBox={v}><circle cx="12" cy="12" r="9" {...s}/></svg>;
    case 'circle-fill': return <svg width={w} height={h} viewBox={v}><circle cx="12" cy="12" r="9" fill={color}/></svg>;
    case 'pause': return <svg width={w} height={h} viewBox={v}><rect x="6" y="5" width="4" height="14" {...s}/><rect x="14" y="5" width="4" height="14" {...s}/></svg>;
    case 'play': return <svg width={w} height={h} viewBox={v}><path d="M6 4 L20 12 L6 20 Z" {...s}/></svg>;
    case 'tag': return <svg width={w} height={h} viewBox={v}><path d="M3 12 V3 H12 L21 12 L12 21 Z" {...s}/><circle cx="7" cy="7" r="1.5" {...s}/></svg>;
    case 'shield': return <svg width={w} height={h} viewBox={v}><path d="M12 2 L20 5 V12 C 20 17 16 21 12 22 C 8 21 4 17 4 12 V5 Z" {...s}/></svg>;
    case 'zap': return <svg width={w} height={h} viewBox={v}><path d="M13 2 L4 14 H11 L10 22 L20 10 H13 Z" {...s}/></svg>;
    case 'history': return <svg width={w} height={h} viewBox={v}><path d="M3 12 a9 9 0 1 0 3 -7 L3 8 V3" {...s}/><path d="M12 7 V12 L15 14" {...s}/></svg>;
    case 'external': return <svg width={w} height={h} viewBox={v}><path d="M14 4 H20 V10 M20 4 L11 13 M18 14 V19 H5 V6 H10" {...s}/></svg>;
    case 'info': return <svg width={w} height={h} viewBox={v}><circle cx="12" cy="12" r="9" {...s}/><path d="M12 11 V17 M12 7.5 V8" {...s}/></svg>;
    case 'image': return <svg width={w} height={h} viewBox={v}><rect x="3" y="4" width="18" height="16" rx="1" {...s}/><circle cx="9" cy="10" r="1.5" {...s}/><path d="M3 17 L9 12 L13 16 L17 12 L21 16" {...s}/></svg>;
    case 'bell': return <svg width={w} height={h} viewBox={v}><path d="M18 10 a6 6 0 0 0 -12 0 c0 5 -2 7 -2 7 H20 s-2-2-2-7 M9 17 a3 3 0 0 0 6 0" {...s}/></svg>;
    case 'inbox': return <svg width={w} height={h} viewBox={v}><path d="M4 4 H20 L21 16 H3 Z M3 16 H21 V20 H3 Z M9 18 H15" {...s}/></svg>;
    case 'users': return <svg width={w} height={h} viewBox={v}><circle cx="9" cy="8" r="3.5" {...s}/><path d="M2 21 C2 16.5 5.5 14 9 14 C12.5 14 16 16.5 16 21" {...s}/><circle cx="17" cy="8" r="3" {...s}/><path d="M17 14 C19 14 22 15.5 22 19" {...s}/></svg>;
    case 'book': return <svg width={w} height={h} viewBox={v}><path d="M4 4 V21 H20 V4 H4 Z M4 4 C4 4 8 2 12 4 C16 2 20 4 20 4" {...s}/><path d="M12 4 V21" {...s}/></svg>;
    case 'close': return <svg width={w} height={h} viewBox={v}><path d="M6 6 L18 18 M18 6 L6 18" {...s}/></svg>;
    case 'google': return (
      <svg width={w} height={h} viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.5 12.3 c0 -0.8 -0.1 -1.6 -0.2 -2.3 H12 v4.4 h5.9 c -0.3 1.4 -1 2.6 -2.2 3.4 v2.8 h3.6 c 2.1 -1.9 3.2 -4.8 3.2 -8.3 z"/>
        <path fill="#34A853" d="M12 23 c 2.9 0 5.4 -1 7.2 -2.6 l -3.6 -2.8 c -1 0.7 -2.3 1.1 -3.6 1.1 -2.8 0 -5.2 -1.9 -6 -4.4 H2.3 v2.8 C 4.2 20.7 7.9 23 12 23 z"/>
        <path fill="#FBBC04" d="M6 14.3 c -0.2 -0.7 -0.4 -1.5 -0.4 -2.3 s 0.1 -1.6 0.4 -2.3 V6.9 H2.3 C 1.5 8.5 1 10.2 1 12 s 0.5 3.5 1.3 5.1 L6 14.3 z"/>
        <path fill="#EA4335" d="M12 5.4 c 1.6 0 3 0.5 4.1 1.6 l 3.1 -3.1 C 17.4 2.1 14.9 1 12 1 7.9 1 4.2 3.3 2.3 6.9 L6 9.7 c 0.9 -2.6 3.3 -4.3 6 -4.3 z"/>
      </svg>
    );
    default: return <svg width={w} height={h} viewBox={v}><circle cx="12" cy="12" r="3" {...s}/></svg>;
  }
};

window.Ic = Ic;
