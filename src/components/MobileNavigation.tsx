import React from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { cn } from '~/lib/utils';
import { SignInButton, useAuth } from '@clerk/tanstack-react-start';
import { useMounted } from '@mantine/hooks';
import { uiTempStore$ } from '~/stores/ui';
import { observer, use$ } from '@legendapp/state/react';
import { navLinks } from './Navigation';

export const MobileNavigation = observer(function MobileNavigation() {
  const location = useLocation();
  const { isSignedIn } = useAuth();
  const mounted = useMounted();
  const preferredOptions = use$(uiTempStore$.preferredOptions);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border md:hidden z-10">
      <div className="flex justify-around items-center h-14">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path;

          if (link.path === '/collection' && !isSignedIn && mounted) {
            return (
              <SignInButton key={link.path} mode="modal">
                <div
                  className={cn(
                    'flex flex-col items-center justify-center w-full h-full px-3 py-2',
                    'cursor-pointer transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <div className="mb-0.5">
                    {/* Remove mr-3 class from icon for centered display */}
                    {React.cloneElement(link.icon, { className: 'h-5 w-5' })}
                  </div>
                  <span className="text-xs">{link.name}</span>
                </div>
              </SignInButton>
            );
          }

          return (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full px-3 py-2',
                'transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
              search={(search) => {
                return {
                  ...search,
                  ...preferredOptions,
                };
              }}
            >
              <div className="mb-0.5">
                {/* Remove mr-3 class from icon for centered display */}
                {React.cloneElement(link.icon, { className: 'h-5 w-5' })}
              </div>
              <span className="text-xs">{link.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
});
