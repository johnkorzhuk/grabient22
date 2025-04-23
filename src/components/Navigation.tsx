import { Link, useLocation } from '@tanstack/react-router';
import { cn } from '~/lib/utils';

export function Navigation() {
  const location = useLocation();
  
  // Navigation links
  const navLinks = [
    { name: 'Popular', path: '/' },
    { name: 'Random', path: '/random' },
    { name: 'Collection', path: '/collection' },
  ];

  return (
    <nav className="flex flex-col space-y-1 w-full">
      {navLinks.map((link) => {
        const isActive = location.pathname === link.path;
        
        return (
          <Link
            key={link.path}
            to={link.path}
            className={cn(
              "flex items-center px-4 py-2 text-sm font-medium rounded-md",
              "hover:bg-accent hover:text-accent-foreground transition-colors",
              isActive 
                ? "bg-accent text-accent-foreground" 
                : "text-foreground"
            )}
          >
            {link.name}
          </Link>
        );
      })}
    </nav>
  );
}
