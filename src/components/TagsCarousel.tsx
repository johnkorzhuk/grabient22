import { Carousel, CarouselContent, CarouselItem } from '~/components/ui/carousel';
import { X } from 'lucide-react';

import { TAGS, type Tag } from '../../tags';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { observer, use$ } from '@legendapp/state/react';
import { uiTempStore$ } from '~/stores/ui';

export const TagsCarousel = observer(function TagsCarousel() {
  const navSelect = use$(uiTempStore$.navSelect);
  const search = useSearch({
    from: '/_layout',
  });
  const navigate = useNavigate({
    from: navSelect,
  });

  // Check if any tags are selected
  const hasSelectedTags = search.tags && search.tags.length > 0;

  const handleTagClick = (tag: Tag) => {
    navigate({
      search: (search) => {
        const currentTags = search.tags || [];

        // If tag already exists, remove it; otherwise, add it
        if (currentTags.includes(tag)) {
          return {
            ...search,
            tags: currentTags.filter((t) => t !== tag),
          };
        } else {
          return {
            ...search,
            tags: [...currentTags, tag],
          };
        }
      },
      replace: true,
    });
  };

  // Function to clear all selected tags
  const clearAllTags = () => {
    navigate({
      search: (search) => ({
        ...search,
        tags: undefined,
      }),
      replace: true,
    });
  };

  return (
    <div className="w-full bg-background/90 backdrop-blur-sm flex justify-center mb-6 lg:mb-8 mt-3">
      <div className="w-full md:max-w-[700px] lg:max-w-[900px] xl:max-w-[1000px] 2xl:max-w-[1200px] font-poppins px-5 lg:px-14 md:flex md:justify-center">
        {/* Mobile: Popular tags label or Clear tags button */}
        <div className="md:hidden w-full mb-2 px-1">
          {hasSelectedTags ? (
            <button
              onClick={clearAllTags}
              className="text-sm text-primary hover:text-primary/80 font-poppins font-medium transition-colors cursor-pointer flex items-center gap-1"
              id="mobile-tags-clear"
              aria-label="Clear all selected tags"
            >
              clear tags
            </button>
          ) : (
            <div
              className="text-sm text-muted-foreground/80 font-poppins font-normal"
              id="mobile-tags-label"
            >
              Popular tags
            </div>
          )}
        </div>

        {/* Single row carousel for all screen sizes */}
        <div className="w-full flex items-center justify-center">
          {/* Desktop: Popular tags label or Clear tags button */}
          {hasSelectedTags ? (
            <button
              onClick={clearAllTags}
              className="hidden md:flex mr-4 text-sm text-primary hover:text-primary/80 font-poppins font-medium transition-colors cursor-pointer items-center gap-1 whitespace-nowrap"
              id="desktop-tags-clear"
              aria-label="Clear all selected tags"
            >
              clear tags
            </button>
          ) : (
            <div
              className="hidden md:block mr-4 text-sm text-muted-foreground/80 font-poppins font-normal whitespace-nowrap"
              id="tags-label"
            >
              Popular tags
            </div>
          )}
          <Carousel
            opts={{
              align: 'start',
              loop: false,
              dragFree: true,
              containScroll: 'trimSnaps',
            }}
            className="w-full"
            aria-label="Tags carousel"
            aria-live="polite"
          >
            <CarouselContent className="-ml-2 md:-ml-4 pl-4">
              {/* Sort tags to move selected tags to the front */}
              {[...TAGS]
                .sort((a, b) => {
                  const aSelected = search.tags?.includes(a) || false;
                  const bSelected = search.tags?.includes(b) || false;
                  if (aSelected && !bSelected) return -1;
                  if (!aSelected && bSelected) return 1;
                  return 0;
                })
                .map((tag, index) => (
                  <CarouselItem
                    key={tag}
                    className={`pl-2 md:pl-4 basis-auto ${index === 0 ? 'pl-4 md:pl-0' : ''}`}
                  >
                    <button
                      className={`disable-animation-on-theme-change cursor-pointer font-poppins transition-all duration-200 text-xs px-2.5 py-0.5 rounded-sm border select-none z-10 whitespace-nowrap inline-flex justify-center items-center h-7 lowercase gap-1.5 ${
                        search.tags?.includes(tag)
                          ? 'text-muted-foreground hover:text-primary border-primary/30 font-medium'
                          : 'bg-background/20 text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 border-border font-normal backdrop-blur-sm'
                      }`}
                      onClick={() => handleTagClick(tag)}
                      aria-label={`${tag} tag ${search.tags?.includes(tag) ? '(selected)' : ''}`}
                      aria-pressed={search.tags?.includes(tag)}
                      role="checkbox"
                    >
                      {tag}
                      {search.tags?.includes(tag) && (
                        <X className="h-3 w-3 stroke-[3]" aria-hidden="true" />
                      )}
                    </button>
                  </CarouselItem>
                ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </div>
  );
});
