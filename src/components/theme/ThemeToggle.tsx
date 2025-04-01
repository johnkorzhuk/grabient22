import { Moon, Sun } from 'lucide-react';
import { useTheme } from '~/components/theme/ThemeProvider';
import { Button } from '~/components/ui/button';

export function ThemeToggle() {
  const theme = useTheme();

  const handleToggle = () => {
    const newTheme = theme.value === 'light' ? 'dark' : 'light';
    theme.set(newTheme);
  };

  return (
    <Button
      variant="ghost"
      className="disable-animation-on-theme-change size-9"
      onClick={handleToggle}
    >
      <Sun className="absolute h-6 w-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <Moon className="h-6 w-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
