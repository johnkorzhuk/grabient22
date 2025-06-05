import { useClipboard } from '@mantine/hooks';
import { Copy, Check, Download } from 'lucide-react';
import { cn } from '~/lib/utils';
import { useEffect, useRef, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';

interface CopyButtonProps {
  cssString: string;
  svgString: string;
  copyClassName?: string;
  isActive?: boolean;
  onOpen?: () => void;
}

export function CopyButton({
  cssString,
  svgString,
  copyClassName,
  isActive = false,
  onOpen,
}: CopyButtonProps) {
  const clipboard = useClipboard({ timeout: 1000 });
  const [copiedType, setCopiedType] = useState<'none' | 'css' | 'svg'>('none');
  const [open, setOpen] = useState(false);

  const handleCopyCss = () => {
    clipboard.copy(cssString);
    setCopiedType('css');
    // Close the dropdown after a short delay to show the checkmark
    setTimeout(() => {
      // Use document.body.click() to simulate a click outside which will close the dropdown
      document.body.click();
    }, 300);
  };

  const handleCopySvg = () => {
    clipboard.copy(svgString);
    setCopiedType('svg');
    // Close the dropdown after a short delay to show the checkmark
    setTimeout(() => {
      // Use document.body.click() to simulate a click outside which will close the dropdown
      document.body.click();
    }, 300);
  };

  const handleDownloadSvg = () => {
    // Create a Blob with the SVG content
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    // Create a temporary link and trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gradient.svg';
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Close the dropdown
    setTimeout(() => {
      document.body.click();
    }, 300);
  };

  // Reset copied type when clipboard.copied becomes false
  useEffect(() => {
    if (!clipboard.copied && copiedType !== 'none') {
      setCopiedType('none');
    }
  }, [clipboard.copied, copiedType]);

  // Create a ref to track hover state
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative">
      {/* The copy button container */}
      <div
        ref={buttonRef}
        className={cn(
          'bg-background/20 backdrop-blur-sm rounded-md transition-all flex items-center justify-center px-0.5 z-10',
          {
            'opacity-0 group-hover:opacity-100': !open && !isActive,
            'opacity-100': open || isActive,
            'bg-background/40': isHovered,
          },
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* The actual copy button that's always visible */}
        <div className={cn('p-1.5 rounded-full transition-colors cursor-pointer hover:text-foreground', copyClassName)}>
          {clipboard.copied ? (
            <Check
              className="w-5 h-5 text-foreground"
            />
          ) : (
            <Copy
              className="w-5 h-5 text-foreground"
            />
          )}
        </div>
      </div>

      {/* Dropdown menu with transparent trigger */}
      <div className="absolute inset-0">
        <DropdownMenu
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (isOpen && onOpen) {
              onOpen();
            }
          }}
        >
          <DropdownMenuTrigger asChild>
            <button 
              className="w-full h-full opacity-0 cursor-pointer z-20" 
              aria-label="Copy options"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <span className="sr-only">Open copy options</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-background/20 backdrop-blur-sm border-none"
          >
            <DropdownMenuGroup className="font-medium">
              <DropdownMenuItem
                onClick={handleCopyCss}
                className="focus:bg-background/30 hover:bg-background/30 dark:focus:bg-background/10 dark:hover:bg-background/10"
              >
                <span>{copiedType === 'css' ? 'Copied!' : 'Copy CSS'}</span>
                {copiedType === 'css' && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleCopySvg}
                className="focus:bg-background/30 hover:bg-background/30 dark:focus:bg-background/10 dark:hover:bg-background/10"
              >
                <span>{copiedType === 'svg' ? 'Copied!' : 'Copy SVG'}</span>
                {copiedType === 'svg' && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDownloadSvg}
                className="focus:bg-background/30 hover:bg-background/30 dark:focus:bg-background/10 dark:hover:bg-background/10"
              >
                <Download className="ml-auto h-4 w-4" />
                <span>Download SVG</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
