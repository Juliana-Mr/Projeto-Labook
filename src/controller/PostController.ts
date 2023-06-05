import { Request, Response } from "express";
import { ZodError } from "zod";
import { PostBusiness } from "../business/PostBusiness";
import { CreatePostSchema } from "../dtos/post/createPost.dto";
import { DeletePostSchema } from "../dtos/post/deletePost.dto";
import { EditPostSchema } from "../dtos/post/editPost.dto";
import { GetPostsSchema } from "../dtos/post/getPosts.dto";
import { LikeOrDislikeSchema } from "../dtos/post/likeOrDilike.dto";
import { BaseError } from "../errors/BaseError";

export class PostController {
    constructor(
        private postBusiness: PostBusiness
    ){}

    public getPosts = async (req: Request, res: Response) => {
        try {
             const input = GetPostsSchema.parse ({
                token:req.headers.authorization
             })

             const output = await this.postBusiness.getPosts(input)

             res.status(200).send(output)
        }catch(error){
            console.log(error)
            
            if(error instanceof ZodError){
                res.status(400).send(error.issues)
            } else if (error instanceof BaseError){
                res.status(error.statusCode).send(error.message)
            } else { 
                res.status(500).send("Erro inesperado")
            }
        }
    }

    public createPost = async (req:Request, res:Response)=> {
        try{
            const input = CreatePostSchema.parse({
                content: req.body.content,
                token: req.headers.authorization
            })

            const output = await this.postBusiness.createPost(input)

            res.status(201).send(output)
        }catch(error){
            console.log(error)
            
            if(error instanceof ZodError){
                res.status(400).send(error.issues)
            } else if (error instanceof BaseError){
                res.status(error.statusCode).send(error.message)
            } else { 
                res.status(500).send("Erro inesperado")
            }
        }
    }

    public editPost = async (req:Request, res:Response) => {
       try{
        const input = EditPostSchema.parse({
            content: req.body.content,
            token:req.headers.authorization,
            idToEdit:req.params.id
        })

        const output = await this.postBusiness.editPost(input)

        res.status(200).send(output)
       }catch(error){
        console.log(error)

        if(error instanceof ZodError){
            res.status(400).send(error.issues)
        } else if (error instanceof BaseError){
            res.status(error.statusCode).send(error.message)
        } else {
            res.status(500).send("Erro inesperado")
        }
       }
    }

    public deletePost = async (req:Request, res:Response) => {
       
       try{
            const input = DeletePostSchema.parse({
            token: req.headers.authorization,
            idToDelete: req.params.id
        })

        const output = await this.postBusiness.deletePost(input)

        res.status(200).send(output)
    
       }catch(error){
        console.log(error)

        if(error instanceof ZodError){
            res.status(400).send(error.issues)
        } else if(error instanceof BaseError){
            res.status(error.statusCode).send(error.message)
        }else{
            res.status(500).send("Erro inesperado")
        }
    }
       
   
    }

    public likeOrDilikePost = async (req:Request, res:Response) => {
        try{
            const input = LikeOrDislikeSchema.parse({
                postId: req.params.id,
                token: req.headers.authorization,
                like: req.body.like
            })

            const output = await this.postBusiness.likeOrDislike(input)

            res.send(200).send(output)

        }catch(error){
            console.log(error)

            if(error instanceof ZodError){
                res.status(400).send(error.issues)
            } else if(error instanceof BaseError){
                res.status(error.statusCode).send(error.message)
            }else{
                res.status(500).send("Erro inesperado")
            }
        }
    }
}
