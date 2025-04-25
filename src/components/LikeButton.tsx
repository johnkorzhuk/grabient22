import { cn } from '~/lib/utils';
import { useDebouncedCallback, useMounted } from '@mantine/hooks';
import { Heart } from 'lucide-react';
import { SignInButton, useAuth } from '@clerk/tanstack-react-start';
import { useLikeSeedMutation } from '~/queries';
import { useEffect, useState } from 'react';
import { useLocation, useSearch } from '@tanstack/react-router';
import { DEFAULT_ANGLE, DEFAULT_STEPS, DEFAULT_STYLE } from '~/validators';
import { Route as CollectionRoute } from '~/routes/_layout/collection';

export function LikeButton({
  seed,
  isLiked: _isLiked,
  pending,
  className,
}: {
  seed: string;
  isLiked: boolean;
  pending: boolean;
  className?: string;
}) {
  const location = useLocation();
  const likedRoute = location.pathname === CollectionRoute.fullPath;
  const isLiked = likedRoute ? true : _isLiked;
  const { userId } = useAuth();
  const mounted = useMounted();
  const search = useSearch({ from: '/_layout' });
  const steps = search.steps === 'auto' ? DEFAULT_STEPS : search.steps;
  const angle = search.angle === 'auto' ? DEFAULT_ANGLE : search.angle;
  const style = search.style === 'auto' ? DEFAULT_STYLE : search.style;
  const likedSeedMutation = useLikeSeedMutation();
  // Local state for immediate UI feedback
  const [locallyLiked, setLocallyLiked] = useState(isLiked);

  // Debounced mutation to avoid spamming
  const debouncedMutate = useDebouncedCallback((liked: boolean) => {
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
      <SignInButton mode="modal">
        <button
          type="button"
          className={cn('p-1 rounded-full transition-colors cursor-pointer', className)}
          aria-label="Favorite"
        >
          <Heart
            className={cn(
              'w-6 h-6 transition-colors',
              'text-gray-500',
              'hover:text-[color:var(--liked)] focus:text-[color:var(--liked)] active:text-[color:var(--liked)]',
            )}
            style={{ transition: 'color 0.2s' }}
            fill="none"
          />
        </button>
      </SignInButton>
    );
  }

  return (
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
          'w-6 h-6 transition-colors',
          locallyLiked ? 'text-[color:var(--liked)]' : 'text-gray-500',
          'hover:text-[color:var(--liked)] focus:text-[color:var(--liked)] active:text-[color:var(--liked)]',
        )}
        style={{ transition: 'color 0.2s' }}
        fill={locallyLiked ? 'currentColor' : 'none'}
      />
    </button>
  );
}
