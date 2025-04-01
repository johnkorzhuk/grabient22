import { outdent } from 'outdent';

/**
 * Script to initialize theme before React hydration to prevent flash of incorrect theme.
 * This script runs on the server and client before React takes over.
 */
export const injectThemeScript = () => outdent`
function initTheme() {
  if (typeof localStorage === 'undefined') return

  const localTheme = localStorage.getItem('theme')
  const preferTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  const resolvedTheme = localTheme === null || localTheme === 'system' ? preferTheme : localTheme

  if (localTheme === null) {
    localStorage.setItem('theme', 'system')
  }

  document.documentElement.dataset.theme = resolvedTheme
  document.documentElement.style.colorScheme = resolvedTheme
}

initTheme()`;
