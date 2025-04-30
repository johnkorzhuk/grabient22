import { cn } from '~/lib/utils';
import { useDebouncedCallback, useMounted } from '@mantine/hooks';
import { Heart } from 'lucide-react';
import { SignInButton, useAuth } from '@clerk/tanstack-react-start';
import { useLikeSeedMutation } from '~/queries';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { useEffect, useState } from 'react';
import { useLocation, useSearch } from '@tanstack/react-router';
import { DEFAULT_ANGLE, DEFAULT_STEPS, DEFAULT_STYLE } from '~/validators';
import { Route as CollectionRoute } from '~/routes/_layout/collection';
import type { CollectionStyle } from '~/types';

export function LikeButton({
  seed,
  isLiked: _isLiked,
  pending,
  className,
  collectionSteps,
  collectionStyle,
  collectionAngle,
}: {
  seed: string;
  isLiked: boolean;
  pending: boolean;
  className?: string;
  collectionSteps?: number;
  collectionStyle?: CollectionStyle;
  collectionAngle?: number;
}) {
  const location = useLocation();
  const likedRoute = location.pathname === CollectionRoute.fullPath;
  const isLiked = likedRoute ? true : _isLiked;
  const { userId } = useAuth();
  const mounted = useMounted();
  const search = useSearch({ from: '/_layout' });
  const steps = search.steps === 'auto' ? collectionSteps : search.steps;
  const angle = search.angle === 'auto' ? collectionAngle : search.angle;
  const style = search.style === 'auto' ? collectionStyle : search.style;
  const likedSeedMutation = useLikeSeedMutation();
  // Local state for immediate UI feedback
  const [locallyLiked, setLocallyLiked] = useState(isLiked);

  // Debounced mutation to avoid spamming
  const debouncedMutate = useDebouncedCallback((liked: boolean) => {
    console.log(steps, angle, style);
    if (!userId || liked === isLiked) return;
    likedSeedMutation.mutate({
      userId,
      seed,
      steps,
      style,
      angle,
    });
  }, 300);

  // Keep local state in sync with server state
  useEffect(() => {
    setLocallyLiked(isLiked);
  }, [isLiked]);

  if (!userId && mounted) {
    return (
      <TooltipProvider>
        <Tooltip>
          <SignInButton mode="modal">
            <TooltipTrigger asChild>
              <button
                type="button"
                className={cn('p-1 rounded-full transition-colors cursor-pointer', className)}
                aria-label="Favorite"
              >
                <Heart
                  className={cn(
                    'w-5.5 h-5.5 transition-colors',
                    'hover:text-[color:var(--liked)] focus:text-[color:var(--liked)] active:text-[color:var(--liked)]',
                  )}
                  style={{ transition: 'color 0.2s' }}
                  fill="none"
                />
              </button>
            </TooltipTrigger>
          </SignInButton>
          <TooltipContent>
            <p>Sign in to like</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn('p-1 rounded-full transition-colors cursor-pointer', className)}
            aria-label="Favorite"
            disabled={pending}
            onClick={() => {
              if (pending || !userId) return;
              setLocallyLiked((prev) => {
                const next = !prev;
                debouncedMutate(next);
                return next;
              });
            }}
          >
            <Heart
              className={cn(
                'w-5.5 h-5.5 transition-colors',
                locallyLiked && 'text-[color:var(--liked)]',
                'hover:text-[color:var(--liked)] focus:text-[color:var(--liked)] active:text-[color:var(--liked)]',
              )}
              style={{ transition: 'color 0.2s' }}
              fill={locallyLiked ? 'currentColor' : 'none'}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{locallyLiked ? 'Unlike' : 'Like'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
