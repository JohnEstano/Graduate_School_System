// Dark Mode Fix Utility
// This file ensures consistent dark mode across the entire application

/**
 * Common dark mode class patterns to use throughout the app:
 * 
 * BACKGROUNDS:
 * - Light: bg-white
 * - Dark: dark:bg-zinc-900 or dark:bg-zinc-950
 * 
 * TEXT:
 * - Light: text-zinc-900 or text-gray-900
 * - Dark: dark:text-zinc-100 or dark:text-white
 * 
 * BORDERS:
 * - Light: border-zinc-200 or border-gray-200
 * - Dark: dark:border-zinc-800 or dark:border-zinc-700
 * 
 * CARDS/CONTAINERS:
 * - Light: bg-white border border-zinc-200
 * - Dark: dark:bg-zinc-900 dark:border-zinc-800
 * 
 * INPUTS:
 * - Light: bg-white border-zinc-300 text-zinc-900
 * - Dark: dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100
 * 
 * HOVER STATES:
 * - Light: hover:bg-zinc-100
 * - Dark: dark:hover:bg-zinc-800
 */

export const darkModeClasses = {
  // Page/Container backgrounds
  pageBackground: 'bg-zinc-50 dark:bg-zinc-950',
  cardBackground: 'bg-white dark:bg-zinc-900',
  sectionBackground: 'bg-zinc-100 dark:bg-zinc-800',
  
  // Text colors
  textPrimary: 'text-zinc-900 dark:text-zinc-100',
  textSecondary: 'text-zinc-600 dark:text-zinc-400',
  textMuted: 'text-zinc-500 dark:text-zinc-500',
  
  // Borders
  border: 'border-zinc-200 dark:border-zinc-800',
  borderLight: 'border-zinc-100 dark:border-zinc-700',
  
  // Interactive elements
  input: 'bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
  button: 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700',
  
  // Hover states
  hover: 'hover:bg-zinc-100 dark:hover:bg-zinc-800',
  hoverLight: 'hover:bg-zinc-50 dark:hover:bg-zinc-900',
  
  // Table elements
  tableHeader: 'bg-zinc-50 dark:bg-zinc-800',
  tableRow: 'border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900',
  
  // Dividers
  divider: 'border-zinc-200 dark:border-zinc-800',
};

// Helper function to combine dark mode classes
export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export default darkModeClasses;
