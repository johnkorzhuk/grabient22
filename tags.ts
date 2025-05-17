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
  'Ocean',
  'Pastel',
  'Psychedelic',
  'Rainbow',
  'Retro',
  'Rustic',
  'Serene',
  'Silver',
  'Sky',
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
  Kids: ['Luxury', 'Corporate', 'Elegant', 'Melancholic'],
  Rustic: ['Digital', 'Cyberpunk', 'Neon', 'Holographic', 'Modern', 'Space'],
  Elegant: ['Kids', 'Cyberpunk', 'Halloween', 'Psychedelic'],
  Modern: ['Vintage', 'Retro', 'Nostalgic', 'Rustic'],
  Neon: ['Earthy', 'Rustic', 'Matte', 'Pastel', 'Stone', 'Wood'],
  Neutral: ['Rainbow', 'Neon', 'Psychedelic', 'Vibrant'],
  Pastel: ['High Contrast', 'Industrial', 'Gothic', 'Halloween'],
  Melancholic: ['Happy', 'Kids', 'Fresh', 'Sweet'],
  Serene: ['Psychedelic', 'Halloween', 'Cyberpunk', 'Neon'],
  Luxury: ['Kids', 'Rustic', 'Industrial'],
  Gothic: ['Pastel', 'Kids', 'Sweet', 'Beach', 'Tropical'],
  Earthy: ['Space', 'Digital', 'Cyberpunk', 'Neon'],
  Cyberpunk: ['Rustic', 'Earthy', 'Wedding', 'Corporate', 'Elegant', 'Serene'],
  Wedding: ['Halloween', 'Industrial', 'Cyberpunk', 'Gothic'],
  Christmas: ['Halloween', 'Easter', 'Valentine', 'Summer', 'Beach'],
  Valentine: ['Halloween', 'Industrial', 'Rustic'],
  Easter: ['Halloween', 'Gothic', 'Industrial', 'Winter'],
};

/**
 * Detailed descriptions for each tag, explaining their color characteristics
 * and typical applications in design contexts.
 */
const TAG_DESCRIPTIONS: Record<Tag, string> = {
  Analogous:
    'Colors adjacent to each other on the color wheel, creating a harmonious and cohesive look.',
  Autumn:
    'Warm, earthy colors reminiscent of fall foliage - oranges, deep reds, browns, and olive greens.',
  Beach:
    'Bright blues, sandy beiges, coral pinks, and sunshine yellows inspired by coastal scenery.',
  Bohemian:
    'Rich, eclectic colors with a mix of jewel tones, earthy hues, and unexpected combinations.',
  Botanical:
    'Natural greens, soft pinks, and earthy browns inspired by plants and botanical illustrations.',
  Bronze:
    'Warm metallic browns with amber and copper undertones, often paired with deep complementary colors.',
  Celestial:
    'Deep blues, purples, and teals with sparkles of white and gold, inspired by night skies.',
  Christmas: 'Traditional red and green combinations, often with gold, white, or blue accents.',
  Cold: 'Cool blues, purples, and grays that evoke winter temperatures and icy landscapes.',
  Complementary:
    'Colors opposite each other on the color wheel, creating vibrant contrast and visual interest.',
  Copper: 'Warm, reddish-brown metallic shades paired with complementary or analogous colors.',
  Corporate:
    'Professional, restrained color schemes often featuring blues, grays, and minimal accent colors.',
  Cozy: 'Warm, soft colors that create a sense of comfort - muted oranges, browns, and cream tones.',
  Cyberpunk:
    'Neon colors on dark backgrounds with high contrast, inspired by futuristic dystopian aesthetics.',
  Desert:
    'Warm terracottas, sand tones, burnt oranges, and pale blues inspired by arid landscapes.',
  Digital:
    'Vibrant colors typical of tech interfaces, featuring bright blues, high contrast, and neon accents.',
  Earthy:
    'Natural browns, greens, terracottas, and muted tones found in soil, rocks, and vegetation.',
  Easter:
    'Soft pastels like lavender, mint green, pale yellow, and light pink associated with spring celebrations.',
  Elegant:
    'Sophisticated combinations often featuring black, white, gold, or silver with minimal accent colors.',
  Ethereal: 'Dreamy, light colors with low saturation, creating a magical or otherworldly feel.',
  Forest: 'Various greens with browns and dark blues inspired by woodland environments.',
  Fresh:
    'Bright, clean colors that feel invigorating, often with prominent whites and light accents.',
  Gold: 'Rich yellow-orange metallic tones paired with complementary colors for a luxurious effect.',
  Gothic: 'Dark, dramatic colors dominated by black, deep purples, reds, and emerald greens.',
  Halloween: 'Orange and black combinations, often with purple, green, or blood red accents.',
  Happy: 'Bright, cheerful colors with high saturation that evoke positive emotions.',
  'High Contrast':
    'Color combinations with strong differences in value, creating bold visual distinction.',
  Holographic:
    'Iridescent rainbow effects that shift in appearance, usually on silver or light backgrounds.',
  Industrial:
    'Urban-inspired colors including grays, rusted reds, and muted blues reminiscent of factories and machinery.',
  Iridescent:
    'Shifting, multi-hued colors that change appearance from different angles, like soap bubbles or oil slicks.',
  Jewel:
    'Rich, deep colors with high saturation inspired by precious stones - rubies, emeralds, sapphires, and amethysts.',
  Kids: 'Bright primary and secondary colors with playful combinations appealing to children.',
  'Low Contrast':
    'Subtle color combinations with minimal difference in value, creating a soft, cohesive look.',
  Luxury:
    'Rich, saturated colors often incorporating gold, black, and deep jewel tones for an opulent effect.',
  Matte:
    'Flat, non-reflective color appearance with slightly reduced saturation and no glossy effect.',
  Melancholic: 'Subdued, often cool-toned colors that evoke thoughtfulness or gentle sadness.',
  Metallic:
    'Colors that mimic metal surfaces with reflective qualities - silvers, golds, bronzes, and chromes.',
  Minimalist:
    'Limited color palettes with plenty of white space, often monochromatic or with minimal accent colors.',
  Modern:
    'Contemporary color combinations with clean lines, often featuring black, white, and bold accent colors.',
  Monochromatic:
    'Different shades, tints, and tones of a single base hue, creating a cohesive look.',
  Muted: 'Softened colors with reduced saturation, as if slightly grayed out or toned down.',
  Neon: 'Extremely bright, fluorescent colors that appear to glow - hot pinks, electric blues, and acid greens.',
  Neutral:
    'Understated colors with very low saturation - whites, beiges, grays, tans, and soft browns.',
  Night: 'Dark blues, purples, and blacks with selective bright accents, evoking the night sky.',
  Nostalgic: 'Color schemes that evoke specific time periods, often with a slightly faded quality.',
  Ocean:
    'Various blues and greens inspired by sea water, sometimes with sandy beiges or coral accents.',
  Pastel:
    'Soft, light colors with high brightness and low to medium saturation, creating a gentle effect.',
  Psychedelic:
    'Intensely saturated, contrasting colors in unusual combinations, inspired by 1960s art and hallucinations.',
  Rainbow: 'Full spectrum of hues in sequential order, representing all colors of the rainbow.',
  Retro: 'Color combinations specific to past design eras, especially the 50s, 60s, 70s, and 80s.',
  Rustic:
    'Weathered, natural colors inspired by farmhouses and rural settings - browns, reds, and muted greens.',
  Serene: 'Gentle, calming colors with low saturation, often cool-toned blues and greens.',
  Silver:
    'Cool metallic gray tones with blue undertones, paired with complementary or analogous colors.',
  Sky: 'Various blue tones inspired by the sky, from pale morning light to deep evening hues.',
  Space:
    'Deep blues, purples, and blacks with bright nebula-inspired accents and occasional metallic highlights.',
  'Split Complementary':
    'A base color plus two colors adjacent to its direct complement, creating balanced contrast.',
  Spring:
    'Fresh, light colors with medium saturation - soft greens, pinks, and yellows inspired by new growth.',
  Stone: 'Gray, beige, and taupe tones inspired by various types of rock and mineral formations.',
  Summer: 'Bright, clear colors with high saturation - vibrant blues, pinks, yellows, and greens.',
  Sunset: 'Warm oranges, pinks, purples, and golden yellows inspired by the setting sun.',
  Sweet: 'Cheerful, often pink-based palettes reminiscent of candies and desserts.',
  Tetradic: 'Four colors arranged as two complementary pairs, creating a rich, balanced scheme.',
  Triadic:
    'Three colors evenly spaced around the color wheel, creating a vibrant and balanced combination.',
  Tropical:
    'Vibrant, exotic colors inspired by tropical flowers, birds, and fruits - hot pinks, turquoise, yellow, and orange.',
  Valentine: "Red, pink, and white combinations associated with romance and Valentine's Day.",
  Vintage: 'Slightly desaturated colors with warm undertones, evoking an aged, nostalgic feel.',
  Warm: 'Colors from the red, orange, and yellow side of the color wheel that evoke heat and energy.',
  Wedding: 'Elegant, often light color schemes featuring whites, creams, and subtle accent colors.',
  Winter:
    'Cool, clear colors with high contrast - whites, blues, and silvers reminiscent of snow and ice.',
  Wood: 'Various brown tones from light maple to dark walnut, inspired by different wood types.',
  Vibrant: 'Highly saturated, intense colors that create energy and visual impact.',
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
export { TAGS, TAG_BLACKLIST, TAG_DESCRIPTIONS };
export type { Tag, BlacklistType };
