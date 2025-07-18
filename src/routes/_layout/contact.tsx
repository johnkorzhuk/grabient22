import { createFileRoute } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { Button } from '~/components/ui/button'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
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
import { CheckIcon, ChevronsUpDown, Check } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
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
  email: v.optional(v.string()),
  subject: v.optional(v.string()),
  message: v.pipe(
    v.string(),
    v.minLength(1, 'Message is required'),
    v.minLength(10, 'Message must be at least 10 characters long'),
  ),
})

type ContactFormData = v.InferInput<typeof contactSchema>

function ContactPage() {
  const [subjectOpen, setSubjectOpen] = useState(false)
  const [customSubject, setCustomSubject] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const navigate = useNavigate()
  const sendContactEmail = useMutation(api.emails.sendContactEmail)

  const form = useForm({
    defaultValues: {
      email: undefined,
      subject: undefined,
      message: '',
    } as ContactFormData,
    onSubmit: async ({ value }) => {
      try {
        const submitData = {
          email: value.email || undefined,
          subject:
            value.subject === 'other'
              ? customSubject
              : value.subject || undefined,
          message: value.message,
        }

        await sendContactEmail(submitData)

        // Show success message
        setIsSubmitted(true)

        // Reset form after successful submission
        form.reset()
        setCustomSubject('')
      } catch (error) {
        console.error('Failed to send email:', error)
        // Handle error state here if needed
      }
    },
    validators: {
      onChange: ({ value }) => {
        try {
          // Create a copy of the value with proper handling of undefined email and subject
          const valueToValidate = {
            ...value,
            email: value.email || undefined,
            subject: value.subject || undefined,
          }
          v.parse(contactSchema, valueToValidate)
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
    <div className="container mx-auto px-4 py-4 max-w-2xl">
      <div className="space-y-4">
        <div className="text-center space-y-2 pb-8">
          {isSubmitted ? (
            <>
              <div className="flex items-center justify-center mb-4">
                <Check className="h-12 w-12 text-green-500" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">
                Message Sent
              </h1>
              <p className="text-muted-foreground font-poppins">Thank you!</p>
              <Button
                onClick={() => navigate({ to: '/' })}
                className={cn(
                  'mt-6 px-6 py-2',
                  'font-bold text-sm',
                  'bg-primary text-primary-foreground',
                  'hover:bg-primary/90 cursor-pointer',
                  'transition-colors duration-200',
                )}
              >
                Back to Home
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-foreground">Contact Us</h1>
              <p className="text-muted-foreground font-poppins">
                We'd love to hear from you. Send us a message and we'll respond
                as soon as possible.
              </p>
            </>
          )}
        </div>

        {!isSubmitted && (
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
                  // Email is now optional, only validate if provided
                  if (value && value.trim()) {
                    try {
                      v.parse(
                        v.pipe(
                          v.string(),
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
                  }
                  return undefined
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

            <form.Field name="subject">
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
                      <div className="relative">
                        <input
                          type="text"
                          readOnly={field.state.value !== 'other'}
                          value={
                            field.state.value === 'other'
                              ? customSubject
                              : field.state.value
                                ? SUBJECT_OPTIONS.find(
                                    (option) =>
                                      option.value === field.state.value,
                                  )?.label || ''
                                : ''
                          }
                          onChange={(e) => {
                            if (field.state.value === 'other') {
                              setCustomSubject(e.target.value)
                              field.validate('change')
                            }
                          }}
                          onClick={(e) => {
                            if (field.state.value === 'other') {
                              e.stopPropagation()
                            }
                          }}
                          placeholder={
                            field.state.value === 'other'
                              ? 'Your subject'
                              : 'Select subject'
                          }
                          className={cn(
                            'w-full h-10 px-3 pr-10 text-sm',
                            'font-poppins',
                            'bg-transparent border border-input rounded-md shadow-sm',
                            'text-foreground placeholder:text-muted-foreground',
                            'hover:border-muted-foreground/50 hover:bg-background',
                            'focus:outline-none focus:border-ring',
                            'transition-colors duration-200',
                            field.state.value !== 'other' && 'cursor-pointer',
                          )}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setSubjectOpen(!subjectOpen)
                          }}
                          className="cursor-pointer absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                        >
                          <ChevronsUpDown className="h-4 w-4" />
                        </button>
                      </div>
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
                                  if (option.value !== 'other') {
                                    setCustomSubject('')
                                  } else {
                                    setCustomSubject('')
                                  }
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
                      Message*
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
                    placeholder="Your message (required)"
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
        )}
      </div>
    </div>
  )
}
