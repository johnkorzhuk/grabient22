import { useEffect, useState, useRef } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '~/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Show button when page is scrolled down
  const toggleVisibility = () => {
    // Find the scrollable container
    const scrollContainer =
      scrollContainerRef.current || (document.querySelector('.scrollbar-stable') as HTMLDivElement);

    if (scrollContainer) {
      // Store the reference for future use
      if (!scrollContainerRef.current) {
        scrollContainerRef.current = scrollContainer;
      }

      if (scrollContainer.scrollTop > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    }
  };

  // Set up scroll event listener
  useEffect(() => {
    // Find the scrollable container
    const scrollContainer = document.querySelector('.scrollbar-stable') as HTMLDivElement;

    if (scrollContainer) {
      scrollContainerRef.current = scrollContainer;
      scrollContainer.addEventListener('scroll', toggleVisibility);

      // Initial check
      toggleVisibility();

      // Clean up the event listener on component unmount
      return () => scrollContainer.removeEventListener('scroll', toggleVisibility);
    }

    return undefined;
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  return (
    <>
      {isVisible && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={scrollToTop}
                className={cn(
                  'fixed bottom-10 md:bottom-8 right-2 md:right-6 z-[100]',
                  'p-3',
                  'rounded-full bg-background/20 border border-foreground/10 backdrop-blur-lg',
                  'cursor-pointer hover:bg-background/10 hover:scale-110',
                  'transition-all duration-200 transform-gpu disable-animation-on-theme-change',
                  'text-foreground',
                  'shadow-lg',
                  'flex items-center justify-center',
                )}
                aria-label="Scroll to top"
              >
                <ArrowUp size={20} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Scroll to top</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </>
  );
}
