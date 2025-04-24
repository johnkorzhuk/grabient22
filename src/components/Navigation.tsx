import { Link, useLocation } from '@tanstack/react-router';
import { cn } from '~/lib/utils';
import { Flame, Shuffle, Heart } from 'lucide-react';
import { SignInButton, useAuth } from '@clerk/tanstack-react-start';
import { useMounted } from '@mantine/hooks';

export function Navigation() {
  const location = useLocation();
  const { isSignedIn } = useAuth();
  const mounted = useMounted();

  // Navigation links
  const navLinks = [
    { name: 'Popular', path: '/', icon: <Flame className="h-4 w-4 mr-3" /> },
    { name: 'Random', path: '/random', icon: <Shuffle className="h-4 w-4 mr-3" /> },
    { name: 'Collection', path: '/collection', icon: <Heart className="h-4 w-4 mr-3" /> },
  ];

  return (
    <nav className="flex flex-col space-y-1 w-full">
      {navLinks.map((link) => {
        const isActive = location.pathname === link.path;

        if (link.path === '/collection' && !isSignedIn && mounted) {
          return (
            <SignInButton mode="modal">
              <span
                key={link.path}
                className={cn(
                  'flex items-center pl-2 pr-4 py-2 text-sm font-medium rounded-md cursor-pointer',
                  'hover:bg-accent hover:text-accent-foreground transition-colors',
                  isActive ? 'bg-accent text-accent-foreground' : 'text-foreground',
                )}
              >
                {link.icon}
                {link.name}
              </span>
            </SignInButton>
          );
        }

        return (
          <Link
            key={link.path}
            to={link.path}
            className={cn(
              'flex items-center pl-2 pr-4 py-2 text-sm font-medium rounded-md',
              'hover:bg-accent hover:text-accent-foreground transition-colors',
              isActive ? 'bg-accent text-accent-foreground' : 'text-foreground',
            )}
            search={(search) => {
              return search;
            }}
          >
            {link.icon}
            {link.name}
          </Link>
        );
      })}
    </nav>
  );
}
