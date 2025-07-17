import { PrimaryDivider } from './Divider';
import { cn } from '~/lib/utils';
import { format } from 'date-fns';
import { Link } from '@tanstack/react-router';

interface FooterSectionProps {
  className?: string;
}

export function FooterSection({ className }: FooterSectionProps) {
  return (
    <footer className={cn('relative pb-8 lg:pb-13', className)}>
      <div className="relative">
        <PrimaryDivider />
      </div>
      <div className="px-5 lg:px-14 pt-6 lg:pt-13 pb-2 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <a
            href="https://iquilezles.org/articles/palettes/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200 font-poppins text-lg"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>About</span>
          </a>
          <div className="h-4 w-px bg-muted-foreground/30"></div>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200 font-poppins text-lg"
          >
            <span>Contact</span>
          </Link>
        </div>

        <div className="text-muted-foreground font-poppins text-sm translate-y-[1.5px]">
          <span>©{format(new Date(), 'yyyy')} Grabient</span>
        </div>
      </div>
    </footer>
  );
}
