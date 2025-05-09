import { useState, useCallback } from 'react';

/**
 * A hook to manage item interaction state for mobile and desktop devices
 * Uses a toggle approach that works better across all devices
 */
export function useItemInteraction() {
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  // Toggle item active state - if same item, toggle off, if different item, set as active
  const toggleItem = useCallback((id: string) => {
    setActiveItemId((prevId) => (prevId === id ? null : id));
  }, []);

  // Clear active item
  const clearActiveItem = useCallback(() => {
    setActiveItemId(null);
  }, []);

  // Check if item is active
  const isItemActive = useCallback(
    (id: string) => {
      return activeItemId === id;
    },
    [activeItemId],
  );

  return {
    toggleItem,
    clearActiveItem,
    isItemActive,
    activeItemId,
  };
}
