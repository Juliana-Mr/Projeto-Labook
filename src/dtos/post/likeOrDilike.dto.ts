import z, { transformer } from 'zod'

export interface LikeOrDislikeInputDTO {
    postId: string,
    token: string,
    like: boolean
}

export type LikeOrDislikeOutputDTO = undefined

export const LikeOrDislikeSchema = z.object({
    postId: z.string().min(1),
    token: z.string().min(1),
    like: z.boolean()
}).transform(data => data as LikeOrDislikeInputDTO)