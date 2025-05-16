const TAGS = [
  'Analogous',
  'Autumn',
  'Beach',
  'Bohemian',
  'Botanical',
  'Bronze',
  'Celestial',
  'Christmas',
  'Cold',
  'Complementary',
  'Copper',
  'Corporate',
  'Cozy',
  'Cyberpunk',
  'Desert',
  'Digital',
  'Dramatic',
  'Earthy',
  'Easter',
  'Elegant',
  'Ethereal',
  'Forest',
  'Fresh',
  'Gold',
  'Gothic',
  'Halloween',
  'Happy',
  'High Contrast',
  'Holographic',
  'Industrial',
  'Iridescent',
  'Jewel',
  'Kids',
  'Low Contrast',
  'Luxury',
  'Matte',
  'Melancholic',
  'Metallic',
  'Minimalist',
  'Modern',
  'Monochromatic',
  'Muted',
  'Neon',
  'Neutral',
  'Night',
  'Nostalgic',
  'Oceanic',
  'Pastel',
  'Psychedelic',
  'Rainbow',
  'Retro',
  'Rustic',
  'Serene',
  'Silver',
  'Sky',
  'Sophisticated',
  'Space',
  'Split Complementary',
  'Spring',
  'Stone',
  'Summer',
  'Sunset',
  'Sweet',
  'Tetradic',
  'Triadic',
  'Tropical',
  'Valentine',
  'Vintage',
  'Warm',
  'Wedding',
  'Winter',
  'Wood',
  'Vibrant',
] as const;

// Define the tag type as a union of all possible tag values
type Tag = (typeof TAGS)[number];

// Define the blacklist type as a Record with Tag keys and arrays of Tag values
type BlacklistType = Record<Tag, Tag[]>;

// Define the tag blacklist - which tags shouldn't be used together
const TAG_BLACKLIST: Partial<BlacklistType> = {
  Cold: ['Warm', 'Desert', 'Tropical', 'Autumn'],
  'High Contrast': ['Low Contrast', 'Muted', 'Pastel'],
  Muted: ['Vibrant', 'Neon', 'Rainbow', 'Psychedelic'],
  Monochromatic: ['Rainbow', 'Split Complementary', 'Triadic', 'Tetradic', 'Complementary'],
  Winter: ['Summer', 'Tropical', 'Desert', 'Beach'],
  Autumn: ['Spring', 'Tropical'],
  Minimalist: ['Psychedelic', 'Rainbow', 'Bohemian', 'Nostalgic'],
  Industrial: ['Botanical', 'Tropical', 'Forest', 'Beach', 'Wedding'],
  Corporate: ['Psychedelic', 'Cyberpunk', 'Kids', 'Bohemian', 'Halloween'],
  Kids: ['Sophisticated', 'Luxury', 'Corporate', 'Elegant', 'Melancholic'],
  Rustic: ['Digital', 'Cyberpunk', 'Neon', 'Holographic', 'Modern', 'Space'],
  Elegant: ['Kids', 'Cyberpunk', 'Halloween', 'Psychedelic'],
  Modern: ['Vintage', 'Retro', 'Nostalgic', 'Rustic'],
  Neon: ['Earthy', 'Rustic', 'Matte', 'Pastel', 'Stone', 'Wood'],
  Neutral: ['Rainbow', 'Neon', 'Psychedelic', 'Vibrant'],
  Pastel: ['High Contrast', 'Industrial', 'Gothic', 'Halloween'],
  Melancholic: ['Happy', 'Kids', 'Fresh', 'Sweet'],
  Serene: ['Dramatic', 'Psychedelic', 'Halloween', 'Cyberpunk', 'Neon'],
  Luxury: ['Kids', 'Rustic', 'Industrial'],
  Gothic: ['Pastel', 'Kids', 'Sweet', 'Beach', 'Tropical'],
  Earthy: ['Space', 'Digital', 'Cyberpunk', 'Neon'],
  Cyberpunk: ['Rustic', 'Earthy', 'Wedding', 'Corporate', 'Elegant', 'Serene'],
  Wedding: ['Halloween', 'Industrial', 'Cyberpunk', 'Gothic'],
  Christmas: ['Halloween', 'Easter', 'Valentine', 'Summer', 'Beach'],
  Valentine: ['Halloween', 'Industrial', 'Rustic'],
  Easter: ['Halloween', 'Gothic', 'Industrial', 'Winter'],
  Dramatic: ['Serene', 'Minimalist'],
  Sophisticated: ['Kids', 'Psychedelic'],
};

/**
 * Returns the full list of available tags, excluding any that conflict with the provided tags
 * @param selectedTags Array of currently selected tags
 * @returns Array of all non-conflicting tags that can be used
 */
function getAvailableTags(selectedTags: Tag[]): Tag[] {
  // If no tags are selected, return all tags
  if (selectedTags.length === 0) {
    return [...TAGS];
  }

  // Collect all tags that conflict with the selected tags
  const conflictingTags = new Set<Tag>();

  for (const tag of selectedTags) {
    // Add conflicts from this tag's blacklist
    const blacklist = TAG_BLACKLIST[tag] || [];
    blacklist.forEach((conflict) => conflictingTags.add(conflict));

    // Add conflicts where this tag appears in other tags' blacklists
    for (const [blacklistTag, blacklistedTags] of Object.entries(TAG_BLACKLIST)) {
      if (blacklistedTags.includes(tag)) {
        conflictingTags.add(blacklistTag as Tag);
      }
    }
  }

  // Return all tags except the selected ones and conflicting ones
  return TAGS.filter((tag) => !selectedTags.includes(tag) && !conflictingTags.has(tag));
}

/**
 * Removes conflicting tags from the provided array of tags
 * @param tags Array of tags to check and clean
 * @returns A new array with conflicting tags removed
 */
function removeConflictingTags(tags: Tag[]): Tag[] {
  // If less than 2 tags, no conflicts possible
  if (tags.length < 2) {
    return [...tags];
  }

  const result: Tag[] = [];
  const conflictMap: Record<string, boolean> = {};

  // First pass: identify all conflicts
  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i];

    // Skip if already marked as conflicting
    if (conflictMap[tag]) continue;

    // Check this tag against all other tags for conflicts
    for (let j = 0; j < tags.length; j++) {
      if (i === j) continue;

      const otherTag = tags[j];
      // Skip if other tag already marked as conflicting
      if (conflictMap[otherTag]) continue;

      // Check for conflicts in both directions
      const tagBlacklist = TAG_BLACKLIST[tag] || [];
      const otherTagBlacklist = TAG_BLACKLIST[otherTag] || [];

      if (tagBlacklist.includes(otherTag) || otherTagBlacklist.includes(tag)) {
        // Mark later tag as conflicting (keeps first encountered tags)
        conflictMap[otherTag] = true;
      }
    }
  }

  // Second pass: build result array without conflicting tags
  for (const tag of tags) {
    if (!conflictMap[tag]) {
      result.push(tag);
    }
  }

  return result;
}

export { getAvailableTags, removeConflictingTags };

// Export constants and types
export { TAGS, TAG_BLACKLIST };
export type { Tag, BlacklistType };
