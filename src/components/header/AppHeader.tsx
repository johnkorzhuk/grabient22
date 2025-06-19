import { ThemeToggle } from '../theme/ThemeToggle';
import { Link, useLocation } from '@tanstack/react-router';
import { Button } from '~/components/ui/button';

import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
  useAuth,
} from '@clerk/tanstack-react-start';
import { cn } from '~/lib/utils';
import { observer, use$ } from '@legendapp/state/react';
import { useMounted } from '@mantine/hooks';
import { uiTempStore$ } from '~/stores/ui';
import { GrabientLogo } from '../GrabientLogo';

export const AppHeader = observer(function AppHeader({ className }: { className?: string }) {
  const preferredOptions = use$(uiTempStore$.preferredOptions);
  const mounted = useMounted();
  const location = useLocation();
  const { isSignedIn } = useAuth();

  return (
    <header className={cn('w-full bg-background', className)}>
      <div className="mx-auto flex w-full items-center justify-between bg-background px-5 lg:px-14 pt-3 pb-4 lg:pt-5 lg:pb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            search={(search) => {
              return {
                ...search,
                ...preferredOptions,
              };
            }}
          >
            <div className="md:w-[200px] relative flex items-center">
              <GrabientLogo />
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {/* <ThemeToggle /> */}
          <div
            className={cn(
              'flex items-center justify-end',
              isSignedIn ? 'w-[48px] sm:w-[72px]' : 'w-[80px]',
            )}
          >
            {mounted ? (
              <>
                <SignedIn>
                  <div className="scale-130 relative right-[4px] top-[2px] transform-gpu origin-center">
                    <UserButton afterSignOutUrl={location.pathname} />
                  </div>
                </SignedIn>
                <SignedOut>
                  <SignInButton mode="modal">
                    <Button
                      size="default"
                      variant="outline"
                      className="font-poppins cursor-pointer disable-animation-on-theme-change relative right-[2px]"
                    >
                      Sign In
                    </Button>
                  </SignInButton>
                </SignedOut>
              </>
            ) : (
              <div className="w-10 h-10 transform-gpu origin-center rounded-full bg-muted animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
});
