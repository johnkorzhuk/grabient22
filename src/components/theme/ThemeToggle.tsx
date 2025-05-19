import { Moon, Sun } from 'lucide-react';
import { useTheme } from '~/components/theme/ThemeProvider';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';

export function ThemeToggle() {
  const theme = useTheme();

  const handleToggle = () => {
    const newTheme = theme.value === 'light' ? 'dark' : 'light';
    theme.set(newTheme);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="transform-gpu origin-center">
            <Button
              variant="ghost"
              className="disable-animation-on-theme-change p-0 h-10 w-10 cursor-pointer text-muted-foreground hover:text-foreground transition-colors duration-200"
              onClick={handleToggle}
            >
              <div className="scale-130 transform-gpu origin-center">
                <Sun className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <Moon className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              </div>
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Switch to {theme.value === 'light' ? 'dark' : 'light'} mode</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
