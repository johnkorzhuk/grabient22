// Shared constants to avoid circular dependencies
export const SEARCH_DEFAULTS = {
  rowHeight: 25,
  style: 'auto' as const,
  steps: 'auto' as const,
  angle: 'auto' as const,
} as const;

export const COMMON_SEARCH_DEFAULTS = {
  style: 'auto' as const,
  steps: 'auto' as const,
  angle: 'auto' as const,
};

export const LAYOUT_SEARCH_DEFUALTS = {
  rowHeight: 25,
};
