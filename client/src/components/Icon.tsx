import type { SVGProps } from 'react'
const paths = {
 bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',
 grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
 room: 'M4 21V3h12v18 M2 21h20 M16 8h4v13 M11 12h1',
 calendar: 'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2 M7 3v4 M17 3v4 M3 11h18 M7 15h2 M13 15h4',
 star: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z',
 search: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
 plus: 'M12 5v14 M5 12h14', arrow: 'M5 12h14 M13 6l6 6-6 6',
 clock: 'M12 8v5l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
 users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M17 3a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.9',
 logout: 'M9 21H3V3h6 M9 12h13 M17 7l5 5-5 5', settings: 'M4 7h16 M4 17h16 M8 4v6 M16 14v6',
 refresh: 'M20 7a9 9 0 1 0 1 8 M20 2v5h-5', close: 'M6 6l12 12 M18 6 6 18', check: 'm5 12 4 4L19 6',
 lab: 'M9 3h6 M10 3v6L4 19a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2L14 9V3 M8 14h8',
 menu: 'M4 6h16 M4 12h16 M4 18h16', back: 'M19 12H5 M11 6l-6 6 6 6',
}
export type IconName = keyof typeof paths
type IconProps = SVGProps<SVGSVGElement> & { name?: IconName; size?: number }

export default function Icon({ name = 'grid', size = 20, ...props }: IconProps) {
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] || paths.grid}/></svg>
}
