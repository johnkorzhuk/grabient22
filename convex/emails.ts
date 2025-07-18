import { v } from 'convex/values'
import { mutation } from './_generated/server'
import { Resend } from '@convex-dev/resend'
import { components } from './_generated/api'

export const resend: Resend = new Resend(components.resend, {
  testMode: false,
})

export const sendContactEmail = mutation({
  args: {
    email: v.optional(v.string()),
    subject: v.optional(v.string()),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const { email, subject, message } = args

    const emailSubject = subject || 'New Contact Form Submission'

    const emailContent = `
      <h2>New Contact Form Submission</h2>
      
      ${email ? `<p><strong>From:</strong> ${email}</p>` : '<p><strong>From:</strong> Anonymous</p>'}
      
      ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
      
      <p><strong>Message:</strong></p>
      <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        ${message.replace(/\n/g, '<br>')}
      </div>
      
      <hr>
      <p style="color: #666; font-size: 14px;">
        This email was sent from the Grabient contact form.
      </p>
    `

    try {
      await resend.sendEmail(ctx, {
        from: 'Contact Form <noreply@grabient.com>',
        to: 'john@grabient.com',
        subject: emailSubject,
        html: emailContent,
        ...(email && { replyTo: [email] }),
      })

      return { success: true }
    } catch (error) {
      console.error('Failed to send email:', error)
      throw new Error('Failed to send email')
    }
  },
})
