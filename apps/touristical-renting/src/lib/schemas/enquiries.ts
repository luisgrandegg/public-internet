import { z } from 'zod'

export const CreateEnquirySchema = z.object({
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
})

export const ReplyEnquirySchema = z.object({
  reply: z.string().min(1, 'Reply is required').max(2000),
})

export type CreateEnquiryInput = z.infer<typeof CreateEnquirySchema>
export type ReplyEnquiryInput = z.infer<typeof ReplyEnquirySchema>
