import { createFileRoute } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { Button } from '~/components/ui/button'
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
import { CheckIcon, ChevronsUpDown } from 'lucide-react'
import { cn } from '~/lib/utils'
import * as v from 'valibot'
import { useState } from 'react'

export const Route = createFileRoute('/_layout/contact')({
  component: RouteComponent,
})

function RouteComponent() {
  return <ContactPage />
}

const SUBJECT_OPTIONS = [
  { value: 'feedback', label: 'Feedback' },
  { value: 'bug-report', label: 'Bug Report' },
  { value: 'feature-request', label: 'Feature Request' },
  { value: 'other', label: 'Other' },
] as const

// Valibot schema for form validation
const contactSchema = v.object({
  email: v.pipe(
    v.string(),
    v.minLength(1, 'Email is required'),
    v.email('Please enter a valid email address'),
  ),
  subject: v.pipe(v.string(), v.minLength(1, 'Please select a subject')),
  message: v.pipe(
    v.string(),
    v.minLength(1, 'Message is required'),
    v.minLength(10, 'Message must be at least 10 characters long'),
  ),
})

type ContactFormData = v.InferInput<typeof contactSchema>

function ContactPage() {
  const [subjectOpen, setSubjectOpen] = useState(false)

  const form = useForm({
    defaultValues: {
      email: '',
      subject: '',
      message: '',
    } as ContactFormData,
    onSubmit: async ({ value }) => {
      // TODO: Implement actual form submission logic
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call

      console.log('Form submitted:', value)

      // Reset form after successful submission
      form.reset()
    },
    validators: {
      onChange: ({ value }) => {
        try {
          v.parse(contactSchema, value)
          return undefined
        } catch (error) {
          if (v.isValiError(error)) {
            return error.issues.map((issue) => issue.message).join(', ')
          }
          return 'Validation error'
        }
      },
    },
  })

  return (
    <div className="container mx-auto px-4 pt-4 pb-16 lg:pb-11 max-w-2xl">
      <div className="space-y-4">
        <div className="text-center space-y-2 pb-8">
          <h1 className="text-3xl font-bold text-foreground">Contact Us</h1>
          <p className="text-muted-foreground font-poppins">
            We'd love to hear from you. Send us a message and we'll respond as
            soon as possible.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="space-y-4"
        >
          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) => {
                try {
                  v.parse(
                    v.pipe(
                      v.string(),
                      v.minLength(1, 'Email is required'),
                      v.email('Please enter a valid email address'),
                    ),
                    value,
                  )
                  return undefined
                } catch (error) {
                  if (v.isValiError(error)) {
                    return error.issues[0]?.message || 'Invalid email'
                  }
                  return 'Invalid email'
                }
              },
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={field.name}
                    className="text-sm font-medium text-foreground"
                  >
                    Email
                  </label>
                  {field.state.meta.errors.length > 0 && (
                    <span className="text-sm text-red-500 font-poppins">
                      {field.state.meta.errors[0]}
                    </span>
                  )}
                </div>
                <input
                  id={field.name}
                  type="email"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className={cn(
                    'w-full h-10 px-3 text-sm',
                    'font-poppins',
                    'bg-transparent border border-input rounded-md shadow-sm',
                    'text-foreground placeholder:text-muted-foreground',
                    'hover:border-muted-foreground/50 hover:bg-background',
                    'focus:outline-none focus:border-ring',
                    'transition-colors duration-200',
                  )}
                  placeholder="Your email"
                />
              </div>
            )}
          </form.Field>

          <form.Field
            name="subject"
            validators={{
              onChange: ({ value }) => {
                try {
                  v.parse(
                    v.pipe(
                      v.string(),
                      v.minLength(1, 'Please select a subject'),
                    ),
                    value,
                  )
                  return undefined
                } catch (error) {
                  if (v.isValiError(error)) {
                    return error.issues[0]?.message || 'Please select a subject'
                  }
                  return 'Please select a subject'
                }
              },
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={field.name}
                    className="text-sm font-medium text-foreground"
                  >
                    Subject
                  </label>
                  {field.state.meta.errors.length > 0 && (
                    <span className="text-sm text-red-500 font-poppins">
                      {field.state.meta.errors[0]}
                    </span>
                  )}
                </div>
                <Popover open={subjectOpen} onOpenChange={setSubjectOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-haspopup="listbox"
                      aria-expanded={subjectOpen}
                      aria-label="Select subject"
                      className={cn(
                        'w-full justify-between',
                        'font-poppins text-sm h-10 px-3',
                        'bg-transparent border-input hover:border-muted-foreground/50 hover:bg-background text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer',
                      )}
                    >
                      {field.state.value
                        ? SUBJECT_OPTIONS.find(
                            (option) => option.value === field.state.value,
                          )?.label
                        : 'Select subject'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-muted-foreground group-hover:text-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className={cn(
                      'p-0 w-[var(--radix-popover-trigger-width)] bg-background/80 backdrop-blur-sm border-border rounded-md',
                    )}
                  >
                    <Command className="border-0 rounded-md w-full bg-transparent [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-1.5 [&_[cmdk-item]]:font-bold [&_[cmdk-item]]:text-sm [&_[cmdk-item][data-selected=true]]:bg-background [&_[cmdk-item][data-selected=true]]:text-foreground [&_[cmdk-item]]:hover:bg-background [&_[cmdk-item]]:hover:text-foreground">
                      <CommandList>
                        <CommandGroup>
                          {SUBJECT_OPTIONS.map((option) => (
                            <CommandItem
                              key={option.value}
                              value={option.value}
                              onSelect={() => {
                                field.handleChange(option.value)
                                setSubjectOpen(false)
                              }}
                              className="cursor-pointer relative h-9 min-h-[2.25rem] text-muted-foreground hover:text-foreground transition-colors duration-200"
                              aria-label={`Select ${option.label}`}
                            >
                              {option.label}
                              <CheckIcon
                                className={cn(
                                  'mr-2 h-3 w-3 absolute right-0',
                                  field.state.value === option.value
                                    ? 'opacity-100'
                                    : 'opacity-0',
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </form.Field>

          <form.Field
            name="message"
            validators={{
              onChange: ({ value }) => {
                try {
                  v.parse(
                    v.pipe(
                      v.string(),
                      v.minLength(1, 'Message is required'),
                      v.minLength(
                        10,
                        'Message must be at least 10 characters long',
                      ),
                    ),
                    value,
                  )
                  return undefined
                } catch (error) {
                  if (v.isValiError(error)) {
                    return error.issues[0]?.message || 'Invalid message'
                  }
                  return 'Invalid message'
                }
              },
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={field.name}
                    className="text-sm font-medium text-foreground"
                  >
                    Message
                  </label>
                  {field.state.meta.errors.length > 0 && (
                    <span className="text-sm text-red-500 font-poppins">
                      {field.state.meta.errors[0]}
                    </span>
                  )}
                </div>
                <textarea
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  rows={6}
                  className={cn(
                    'w-full px-3 py-2 text-sm',
                    'font-poppins',
                    'bg-transparent border border-input rounded-md shadow-sm',
                    'text-foreground placeholder:text-muted-foreground',
                    'hover:border-muted-foreground/50 hover:bg-background',
                    'focus:outline-none focus:border-ring',
                    'transition-colors duration-200',
                    'resize-none',
                  )}
                  placeholder="Your message"
                />
              </div>
            )}
          </form.Field>

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className={cn(
                  'w-full h-10 px-3',
                  'font-bold text-sm',
                  'bg-primary text-primary-foreground',
                  'hover:bg-primary/90 cursor-pointer',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-colors duration-200',
                )}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </div>
    </div>
  )
}
