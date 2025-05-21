import { useLocation, useNavigate } from '@tanstack/react-router';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';

interface NavigationSelectProps {
  className?: string;
}

export function NavigationSelect({ className }: NavigationSelectProps) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get the current path for the select value
  const currentPath = location.pathname === '/' ? 'popular' : location.pathname.substring(1);

  return (
    <Select
      value={currentPath}
      onValueChange={(value) => {
        const path = value === 'popular' ? '/' : `/${value}`;
        navigate({ to: path, search: (search) => search });
      }}
    >
      <SelectTrigger className={`w-[150px] md:w-[170px] font-medium text-base h-10 px-3 ${className}`}>
        <SelectValue placeholder="Navigation" />
      </SelectTrigger>
      <SelectContent className="bg-background/80 backdrop-blur-sm border-border">
        <SelectItem
          value="popular"
          className="focus:bg-accent/60 focus:text-accent-foreground hover:bg-accent/60 hover:text-accent-foreground px-3"
        >
          <span className="font-medium text-base">Popular</span>
        </SelectItem>
        <SelectItem
          value="random"
          className="focus:bg-accent/60 focus:text-accent-foreground hover:bg-accent/60 hover:text-accent-foreground px-3"
        >
          <span className="font-medium text-base">Random</span>
        </SelectItem>
        <SelectItem
          value="collection"
          className="focus:bg-accent/60 focus:text-accent-foreground hover:bg-accent/60 hover:text-accent-foreground px-3"
        >
          <span className="font-medium text-base">Collection</span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
