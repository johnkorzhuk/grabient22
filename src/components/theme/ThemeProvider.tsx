import type { PropsWithChildren } from 'react';

import { useDidUpdate } from '@mantine/hooks';
import { ScriptOnce } from '@tanstack/react-router';
import { outdent } from 'outdent';
import { useEffect, useState, useRef } from 'react';
import * as v from 'valibot';

import { createContextFactory } from '~/lib/utils';

const themeSchema = v.picklist(['dark', 'light', 'system'] as const);

type Theme = v.InferInput<typeof themeSchema>;
type ResolvedTheme = Exclude<Theme, 'system'>;

interface ThemeContext {
  value: Theme;
  resolved: ResolvedTheme;
  set: (theme: Theme) => void;
  toggle: () => void;
}

const [ThemeContextProvider, useTheme] = createContextFactory<ThemeContext>({
  errorMessage: 'useTheme must be used within a ThemeProvider',
});

// Duration to disable animations during theme change (in milliseconds)
const ANIMATION_DISABLE_DURATION = 300;

function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, _setTheme] = useState<Theme>(getLocalTheme());
  const [resolvedTheme, _setResolvedTheme] = useState<ResolvedTheme>(getResolvedTheme(theme));
  const timeoutRef = useRef<number | null>(null);

  const setTheme = (theme: Theme) => {
    _setTheme(theme);
    _setResolvedTheme(getResolvedTheme(theme));
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  /**
   * Temporarily disables animations on elements with the class 'disable-animation-on-theme-change'
   */
  const disableAnimationsTemporarily = () => {
    // Clear any existing timeout to prevent memory leaks
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Find all elements with the disable-animation class
    const elements = document.querySelectorAll('.disable-animation-on-theme-change');

    // Add a temporary class to disable all transitions
    elements.forEach((element) => {
      element.classList.add('no-transitions');
    });

    // Remove the class after the specified duration
    timeoutRef.current = window.setTimeout(() => {
      elements.forEach((element) => {
        element.classList.remove('no-transitions');
      });
      timeoutRef.current = null;
    }, ANIMATION_DISABLE_DURATION);
  };

  useDidUpdate(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useDidUpdate(() => {
    // Disable animations before changing theme
    disableAnimationsTemporarily();

    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;

    // Apply or remove the 'dark' class for Tailwind 4 dark mode
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [resolvedTheme]);

  // Handle cross-tab theme changes
  useEffect(() => {
    const handleStorageListener = () => {
      setTheme(getLocalTheme());
    };

    handleStorageListener();

    window.addEventListener('storage', handleStorageListener);
    return () => window.removeEventListener('storage', handleStorageListener);
  }, []);

  // Handle system theme changes
  useEffect(() => {
    if (theme !== 'system') {
      return;
    }

    const handleSystemThemeChange = () => {
      _setResolvedTheme(getResolvedTheme(theme));
    };

    const media = window.matchMedia('(prefers-color-scheme: dark)');

    // Intentionally use deprecated listener methods to support iOS & old browsers
    media.addListener(handleSystemThemeChange);
    return () => media.removeListener(handleSystemThemeChange);
  }, [theme]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const context: ThemeContext = {
    value: theme,
    resolved: resolvedTheme,
    set: setTheme,
    toggle: toggleTheme,
  };

  return (
    <ThemeContextProvider value={context}>
      <ScriptOnce>
        {outdent`
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
            
            // Apply or remove the 'dark' class for Tailwind 4 dark mode
            if (resolvedTheme === 'dark') {
              document.documentElement.classList.add('dark')
            } else {
              document.documentElement.classList.remove('dark')
            }
          }

          // Add style for no-transitions class (only once)
          if (!document.getElementById('theme-transitions-style')) {
            const style = document.createElement('style')
            style.id = 'theme-transitions-style'
            style.textContent = '.no-transitions, .no-transitions * { transition: none !important; animation: none !important; }'
            document.head.appendChild(style)
          }

          initTheme()
        `}
      </ScriptOnce>
      {children}
    </ThemeContextProvider>
  );
}

function getLocalTheme(): Theme {
  if (typeof localStorage === 'undefined') {
    return 'system';
  }

  const localTheme = localStorage.getItem('theme');
  if (localTheme === null) {
    throw new Error(
      "Can't find theme in localStorage. Make sure you wrap the app with ThemeProvider.",
    );
  }

  try {
    return v.parse(themeSchema, localTheme);
  } catch (error) {
    return 'system';
  }
}

function getPreferTheme(): ResolvedTheme {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getResolvedTheme(theme: Theme): ResolvedTheme {
  return theme === 'system' ? getPreferTheme() : theme;
}

export { themeSchema };
export { ThemeProvider, useTheme };
export type { ResolvedTheme, Theme };
