import { useEffect, useRef, useState } from 'react';

function useScrollThreshold(threshold = 50) {
  const [isVisible, setIsVisible] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const ticking = useRef(false);

  function updateVisibility() {
    if (!scrollContainerRef.current) {
      ticking.current = false;
      return;
    }

    const scrollTop = scrollContainerRef.current.scrollTop;
    const shouldBeVisible = scrollTop < threshold;

    setIsVisible(shouldBeVisible);
    ticking.current = false;
  }

  function handleScroll() {
    if (!ticking.current) {
      requestAnimationFrame(updateVisibility);
      ticking.current = true;
    }
  }

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    // Initial check
    updateVisibility();

    // Add scroll listener
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [threshold]);

  return { scrollContainerRef, isVisible };
}

export default useScrollThreshold;
