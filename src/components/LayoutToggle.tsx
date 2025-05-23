import { useNavigate, useSearch, useLocation, useMatches } from '@tanstack/react-router';
import { cn } from '~/lib/utils';
import { Button } from '~/components/ui/button';
import { COLLECTION_LAYOUTS } from '~/validators';
import { LayoutGrid, Rows } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';

export function LayoutToggle() {
  const { layout } = useSearch({ from: '/_layout' });
  const location = useLocation();
  const matches = useMatches();
  const isSeedRoute = matches.some((match) => match.routeId === '/_layout/$seed');

  const from = isSeedRoute
    ? '/$seed'
    : location.pathname === '/random'
      ? '/random'
      : location.pathname === '/collection'
        ? '/collection'
        : '/';

  const navigate = useNavigate({ from });

  // Handle layout toggle
  const handleLayoutChange = (newLayout: (typeof COLLECTION_LAYOUTS)[number]) => {
    navigate({
      search: (prev) => ({ ...prev, layout: newLayout }),
      replace: true,
    });
  };

  return (
    <div className="flex space-x-2 w-fit disable-animation-on-theme-change">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={layout === 'row' ? 'default' : 'outline'}
              size="icon"
              onClick={() => handleLayoutChange('row')}
              className={cn('w-8 h-8 cursor-pointer')}
              aria-label="Rows Layout"
            >
              <Rows className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Row Layout</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={layout === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => handleLayoutChange('grid')}
              className={cn('w-8 h-8 cursor-pointer')}
              aria-label="Grid Layout"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Grid Layout</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
