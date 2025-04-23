import { Badge } from './ui/badge';
import { cn } from '~/lib/utils';
import { getCategoryDisplayName } from '~/validators';
import type { PaletteCategoryKey } from '~/validators';

export interface CategoryBadgeProps {
  category: PaletteCategoryKey;
  isSelected?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'secondary' | 'outline';
  className?: string;
}

/**
 * A reusable category badge component used throughout the application
 * for displaying palette categories with consistent styling
 */
export function CategoryBadge({
  category,
  isSelected = false,
  onClick,
  variant: propVariant,
  className,
}: CategoryBadgeProps) {
  // Determine the variant based on selection state and props
  const variant = propVariant || (isSelected ? 'default' : 'outline');

  // Determine if the badge should be interactive
  const isInteractive = typeof onClick === 'function';

  return (
    <Badge
      variant={variant}
      className={cn(
        'whitespace-nowrap transition-colors select-none',
        isInteractive && 'cursor-pointer hover:bg-accent hover:text-accent-foreground',
        className,
      )}
      onClick={isInteractive ? onClick : undefined}
    >
      {getCategoryDisplayName(category)}
    </Badge>
  );
}
