import { observer } from '@legendapp/state/react'
import { useNavigate } from '@tanstack/react-router'
import * as v from 'valibot'
import { useState } from 'react'
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '~/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { Button } from '~/components/ui/button'
import { CheckIcon, ChevronsUpDown } from 'lucide-react'
import { cn } from '~/lib/utils'
import { MODIFIERS, modifierValidator } from '~/validators'

export type SelectModifier = v.InferOutput<typeof modifierValidator>

type ModifierSelectProps = {
  value: SelectModifier
  className?: string
  popoverClassName?: string
}

export const ModifierSelect = observer(function ModifierSelect({
  value,
  className,
  popoverClassName,
}: ModifierSelectProps) {
  const navigate = useNavigate({ from: '/$seed/' })
  const [open, setOpen] = useState(false)

  const handleValueClick = (clickedMod: SelectModifier) => {
    // If clicking the already selected style, toggle to auto
    if (clickedMod === value) {
      navigate({
        search: (prev) => ({
          ...prev,
          style: 'auto',
        }),
        replace: true,
      })
    } else {
      // Otherwise set to the new style
      navigate({
        search: (prev) => ({
          ...prev,
          mod: clickedMod,
        }),
        replace: true,
      })
    }

    // Close the popover after selection
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={false}
          aria-label="Select modifier type"
          className={cn(
            'w-[190px] justify-between',
            'font-bold capitalize text-sm h-8.5 lg:h-10 px-3',
            'bg-transparent border-input hover:border-muted-foreground/50 hover:bg-background text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer',
            'disable-animation-on-theme-change',
            className,
          )}
        >
          {value} Settings
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-muted-foreground group-hover:text-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          'p-0 w-[190px] bg-background/80 backdrop-blur-sm border-border rounded-md',
          popoverClassName,
        )}
        align="start"
      >
        <Command className="border-0 rounded-md w-full bg-transparent [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-1.5 [&_[cmdk-item]]:font-bold [&_[cmdk-item]]:text-sm [&_[cmdk-item][data-selected=true]]:bg-background [&_[cmdk-item][data-selected=true]]:text-foreground [&_[cmdk-item]]:hover:bg-background [&_[cmdk-item]]:hover:text-foreground">
          <CommandList>
            <CommandGroup>
              {MODIFIERS.map((mod) => (
                <CommandItem
                  key={mod}
                  value={mod}
                  onSelect={() => handleValueClick(mod)}
                  aria-label={`Select ${mod} modifier`}
                  className="cursor-pointer relative h-9 min-h-[2.25rem] text-muted-foreground hover:text-foreground transition-colors duration-200 capitalize"
                >
                  {mod}
                  <CheckIcon
                    className={cn(
                      'mr-2 h-3 w-3 absolute right-0',
                      value === mod ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
})
