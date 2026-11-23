import React from 'react';
const paths = {
  network: <><circle cx="12" cy="12" r="3"/><circle cx="4" cy="4" r="2"/><circle cx="20" cy="4" r="2"/><circle cx="4" cy="20" r="2"/><circle cx="20" cy="20" r="2"/><path d="m6 6 4 4m4 4 4 4M6 18l4-4m4-4 4-4"/></>,
  bus: <><path d="M4 17V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v11M4 10h16M4 16h16M7 17v3m10-3v3"/><circle cx="8" cy="13" r=".5"/><circle cx="16" cy="13" r=".5"/></>,
  pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/></>,
  book: <><path d="M12 7v14M3 4h5a4 4 0 0 1 4 3 4 4 0 0 1 4-3h5v14h-5a5 5 0 0 0-4 3 5 5 0 0 0-4-3H3z"/></>,
  card: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10h3m-3 4h5m4-5a4 4 0 0 1 0 6m-2-5a2 2 0 0 1 0 4"/></>,
  school: <><path d="m3 10 9-6 9 6M5 10v11h14V10M9 21v-6h6v6M12 2v2"/><path d="M11 10h2"/></>,
  users: <><circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5"/></>,
  phone: <><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 5h4m-3 14h2"/></>,
  shirt: <path d="m8 3-6 4 3 5 3-2v11h8V10l3 2 3-5-6-4a4 4 0 0 1-8 0Z"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  play: <path d="m9 5 11 7-11 7z"/>, pause: <><path d="M8 5v14m8-14v14"/></>,
  expand: <path d="M3 9V3h6m6 0h6v6m0 6v6h-6M9 21H3v-6"/>,
  menu: <path d="M4 6h16M4 12h16M4 18h16"/>, close: <path d="m6 6 12 12M6 18 18 6"/>,
  external: <><path d="M14 3h7v7m0-7L10 14"/><path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/></>,
  signal: <path d="M4 20v-3m5 3v-7m5 7V9m5 11V4"/>, clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  download: <><path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/></>, reset: <><path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/></>,
};
export function Icon({ name, size = 20, ...props }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.school}</svg>; }
