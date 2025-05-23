import { PrimaryDivider } from './Divider';
import { cn } from '~/lib/utils';
import { format } from 'date-fns';

interface FooterSectionProps {
  className?: string;
}

export function FooterSection({ className }: FooterSectionProps) {
  return (
    <footer className={cn('relative pb-3 lg:pb-13', className)}>
      <div className="relative">
        <PrimaryDivider />
      </div>
      <div className="px-5 lg:px-14 pt-4 lg:pt-13 pb-2 flex justify-between items-center">
        <a
          href="https://iquilezles.org/articles/palettes/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200 font-poppins text-lg"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>About</span>
        </a>

        <div className="text-muted-foreground font-poppins text-sm translate-y-[1.5px]">
          <span>©{format(new Date(), 'yyyy')} Grabient</span>
        </div>
      </div>
    </footer>
  );
}
