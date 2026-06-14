import { z } from 'zod';

const addUserSchema = z.object({
    body: z.object({
        email: z.string().email(),
        name: z.string(),
        phone: z.string(),
        totalPdf: z.number().optional(),
        password: z.string().optional(),
        photo: z.string().optional(),
        role: z.enum(['admin', 'user']).optional()
    })
})

const updateUserSchema = z.object({
    body: z.object({
        password: z.string().optional(),
        totalPdf: z.number().optional(),
        photo: z.string().optional(),
        role: z.enum(['admin', 'user'])
    })
})

export const UserValidation = {
    addUserSchema,
    updateUserSchema
}