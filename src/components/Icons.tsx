import type { SVGProps } from 'react';

const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
type P = SVGProps<SVGSVGElement>;

export const IBag = (p: P) => <svg {...base} {...p}><path d="M5 8h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>;
export const IArrow = (p: P) => <svg {...base} strokeWidth={2} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
export const IBack = (p: P) => <svg {...base} strokeWidth={2} {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>;
export const IPhone = (p: P) => <svg {...base} {...p}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" /></svg>;
export const IClock = (p: P) => <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
export const IPin = (p: P) => <svg {...base} {...p}><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>;
export const IClose = (p: P) => <svg {...base} strokeWidth={2} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>;
export const IPlus = (p: P) => <svg {...base} strokeWidth={2.2} {...p}><path d="M12 5v14M5 12h14" /></svg>;
export const IMinus = (p: P) => <svg {...base} strokeWidth={2.2} {...p}><path d="M5 12h14" /></svg>;
export const IZoom = (p: P) => <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4M11 8v6M8 11h6" /></svg>;
export const ISearch = (p: P) => <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>;
export const ICheck = (p: P) => <svg {...base} strokeWidth={2.4} {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
export const IMenu = (p: P) => <svg {...base} strokeWidth={2} {...p}><path d="M4 7h16M4 12h16M4 17h10" /></svg>;
export const IGift = (p: P) => <svg {...base} {...p}><rect x="3" y="8" width="18" height="13" rx="2" /><path d="M3 12h18M12 8v13M12 8S10.5 3 8 3.5 7.5 8 12 8zM12 8s1.5-5 4-4.5S16.5 8 12 8z" /></svg>;
export const IUsers = (p: P) => <svg {...base} {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8" /></svg>;
export const IList = (p: P) => <svg {...base} {...p}><path d="M4 6h16M4 12h10M4 18h7" /><circle cx="18" cy="17" r="3" /></svg>;
export const IChat = (p: P) => <svg {...base} {...p}><path d="M21 12a8.5 8.5 0 0 1-12.4 7.6L3 21l1.4-5.4A8.5 8.5 0 1 1 21 12z" /></svg>;
export const IHome = (p: P) => <svg {...base} {...p}><path d="M3 9l9-6 9 6v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" /><path d="M9 21v-7h6v7" /></svg>;
export const ISpark = (p: P) => <svg {...base} {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" /></svg>;
export const ITruck = (p: P) => <svg {...base} {...p}><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>;
export const ICard = (p: P) => <svg {...base} {...p}><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 10h19M6 15h4" /></svg>;
export const ICube = (p: P) => <svg {...base} {...p}><path d="M12 2.8l8.5 4.7v9L12 21.2 3.5 16.5v-9z" /><path d="M3.5 7.5L12 12l8.5-4.5M12 12v9.2" /></svg>;
export const IRotate = (p: P) => <svg {...base} {...p}><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.2L3 16M3 21v-5h5" /></svg>;

export const IWa = (p: P) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.3-.5 0-1 .2-3.3-.7a11.4 11.4 0 0 1-4.5-4 5 5 0 0 1-1.1-2.7c0-1.3.7-1.9 1-2.2.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c0 .2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2 1.1 1 2.1 1.3 2.4 1.5.3.1.5.1.7-.1l.9-1.1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.6.3.1.2.1.7-.1 1.4z" /></svg>;
export const IVk = (p: P) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12.8 17.3c-5.5 0-8.6-3.8-8.7-10h2.7c.1 4.6 2.1 6.5 3.7 6.9V7.3h2.6v3.9c1.6-.2 3.2-2 3.8-3.9h2.6a7.7 7.7 0 0 1-3.5 5 7.9 7.9 0 0 1 4.1 5h-2.8a5 5 0 0 0-4.2-3.6v3.6z" /></svg>;
