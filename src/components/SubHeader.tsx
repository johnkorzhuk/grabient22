import { cn } from '~/lib/utils';
import { NavigationSelect } from '~/components/NavigationSelect';
import { StyleSelect } from './StyleSelect';
import { StepsInput } from './StepsInput';
import { AngleInput } from './AngleInput';
import { useSearch } from '@tanstack/react-router';
import { Menu } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { useState, useEffect, useRef, useCallback } from 'react';

interface SubHeaderProps {
  className?: string;
}

export function SubHeader({ className }: SubHeaderProps) {
  const { steps, angle, style } = useSearch({ from: '/_layout' });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuContentRef = useRef<HTMLDivElement>(null);

  // Toggle menu open/closed
  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 450) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle clicks outside the menu button to close the menu
  useEffect(() => {
    // Only add the listener if the menu is open
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      // Only close if click is on the menu button (toggle) or outside the menu content
      const isClickOnMenuButton = menuRef.current?.contains(event.target as Node);

      // If clicking the menu button, let the onClick handler handle it
      if (isClickOnMenuButton) return;

      // If clicking outside the menu content, close the menu
      const isClickInsideMenuContent = menuContentRef.current?.contains(event.target as Node);

      // If clicking inside a popover content, don't close the menu
      const isClickInsidePopover = !!document
        .querySelector('[data-radix-popper-content-wrapper]')
        ?.contains(event.target as Node);

      // Only close if clicking outside both the menu content and any popover
      if (!isClickInsideMenuContent && !isClickInsidePopover) {
        setIsMenuOpen(false);
      }
    };

    // Add the listener
    document.addEventListener('mousedown', handleClickOutside);

    // Remove the listener when the menu closes or component unmounts
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  return (
    <header
      className={cn(
        'w-full bg-background/90 backdrop-blur-sm py-3 md:border-b md:border-dashed md:border-border/70',
        className,
      )}
    >
      <div className="mx-auto w-full px-5 lg:px-14">
        <div className="flex items-center justify-between">
          <NavigationSelect />

          {/* Desktop view (> 450px) */}
          <div className="hidden sm:flex items-center gap-3">
            <StyleSelect value={style} className="w-[190px] h-10" />
            <StepsInput value={steps} className="w-[110px] h-10" />
            <AngleInput value={angle} className="w-[110px] h-10" />
          </div>

          {/* Mobile view (≤ 450px) */}
          <div className="sm:hidden relative" ref={menuRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label="Toggle menu"
              className="h-10 w-10 cursor-pointer hover:bg-background hover:border-input"
              aria-expanded={isMenuOpen}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu - full width row */}
      {isMenuOpen && (
        <div
          ref={menuContentRef}
          className="sm:hidden fixed left-0 right-0 top-[64px] z-50 w-full bg-background/90 backdrop-blur-sm border-b border-dashed border-border/70 shadow-md"
        >
          <div className="px-5 py-3 flex items-center gap-2 w-full overflow-x-auto">
            <StyleSelect value={style} className="w-[50%] min-w-[160px] h-10" />
            <StepsInput value={steps} className="w-[25%] min-w-[80px] h-10" />
            <AngleInput value={angle} className="w-[25%] min-w-[80px] h-10" />
          </div>
        </div>
      )}
    </header>
  );
}
