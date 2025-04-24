import type { CollectionStyle } from '~/types';
import React, { useState } from 'react';
import { cn } from '~/lib/utils';
import { useDebouncedCallback, useMounted } from '@mantine/hooks';
import { Heart } from 'lucide-react';
import { SignInButton, useAuth } from '@clerk/tanstack-react-start';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { useLikeSeedMutation } from '~/queries';
import { api } from '../../convex/_generated/api';

export function LikeButton({
  steps,
  angle,
  style,
  seed,
}: {
  steps: number;
  angle: number;
  style: CollectionStyle;
  seed: string;
}) {
  const { userId } = useAuth();
  const mounted = useMounted();

  //  TODO: this code sucks. we are making an extra query while auth is loading
  const { data: isLikedData, isPending: isLikedPending } = useQuery({
    ...convexQuery(api.collections.checkUserLikedSeed, {
      userId: userId!,
      seed,
    }),
    // this doesnt work for whatever reason
    enabled: Boolean(userId),
  });

  const isLiked = Boolean(isLikedData && !isLikedPending);

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
  React.useEffect(() => {
    setLocallyLiked(isLiked);
  }, [isLiked]);

  if (!userId && mounted) {
    return (
      <SignInButton mode="modal">
        <button
          type="button"
          className="p-1 rounded-full transition-colors cursor-pointer"
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
      className="p-1 rounded-full transition-colors cursor-pointer"
      aria-label="Favorite"
      disabled={isLikedPending}
      onClick={() => {
        if (isLikedPending || !userId) return;
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
