import { PostDatabase } from "../database/PostDatabase";
import { CreatePostInputDTO, CreatePostOutputDTO } from "../dtos/post/createPost.dto";
import { UnauthorizedError } from "../errors/UnauthorizedError";
import { NotFoundError } from "../errors/NotFoundError";
import { IdGenerator } from "../services/IdGenerator";
import { TokenManager } from "../services/TokenManager";
import { Post, LikeOrDislikeDB, POST_LIKE } from "../models/Post";
import { GetPostsInputDTO, GetPostsOutputDTO } from "../dtos/post/getPosts.dto";
import { EditPostInputDTO, EditPostOutputDTO } from "../dtos/post/editPost.dto";
import { ForbiddenError } from "../errors/ForbiddenError";
import { DeletePostInputDTO, DeletePostOutpuDTO } from "../dtos/post/deletePost.dto";
import { USER_ROLES } from "../models/User";
import { LikeOrDislikeInputDTO, LikeOrDislikeOutputDTO } from "../dtos/post/likeOrDilike.dto";

export class PostBusiness {
    constructor (
        private postDatabase: PostDatabase,
        private idGenerator: IdGenerator,
        private tokenManager: TokenManager
    ){}

    public getPosts = async (input: GetPostsInputDTO): Promise<GetPostsOutputDTO> => {
        const { token } = input

        const payload = this.tokenManager.getPayload(token)

        if (!payload) {
            throw new UnauthorizedError()
        }

        const postDBWithCreatorName = await this.postDatabase.getPostsWithCreatorName()

        const posts = postDBWithCreatorName.map((postWithCreatorName) => {
            const post = new Post(
                postWithCreatorName.id,
                postWithCreatorName.content,
                postWithCreatorName.likes,
                postWithCreatorName.dislikes,
                postWithCreatorName.created_at,
                postWithCreatorName.updated_at,
                postWithCreatorName.creator_id,
                postWithCreatorName.creator_name
            )

            return post.toBusinessModel()
        })

        const output: GetPostsOutputDTO = posts

        return output
    }

    public createPost = async (input: CreatePostInputDTO): Promise <CreatePostOutputDTO> => {
        const {content, token} = input

        const payload = this.tokenManager.getPayload(token)

        if(!payload){
            throw new UnauthorizedError()
        }

        const id = this.idGenerator.generate()

            const post = new Post(
                id,
                content,
                0,
                0,
                new Date().toISOString(),
                new Date().toISOString(),
                payload.id,
                payload.name
           )

           const postDB = post.toDBModel()
           await this.postDatabase.insertPost(postDB)
           
           const output: CreatePostOutputDTO = undefined

           return output
    }

    public editPost = async(input: EditPostInputDTO): Promise <EditPostOutputDTO> => {
        const {content, token, idToEdit} = input

        const payload = this.tokenManager.getPayload(token)

        if(!payload){
            throw new UnauthorizedError()
        }

        const postDB = await this.postDatabase.findPostById(idToEdit)

        if(!postDB){
            throw new NotFoundError("Id não existe no banco de dados")
        }

        if(payload.id !== postDB.creator_id) {
            throw new ForbiddenError("Apenas o criador do post pode editá-lo")
        }

        const post = new Post (
            postDB.id,
            postDB.content,
            postDB.likes,
            postDB.dislikes,
            postDB.created_at,
            postDB.updated_at,
            postDB.creator_id,
            payload.name
        )

        post.setContent(content)
        
        const updatedPostDB = post.toDBModel()
        await this.postDatabase.updatePost(updatedPostDB)

        const output: EditPostOutputDTO = undefined

        return output
    }

    public deletePost = async (input: DeletePostInputDTO): Promise <DeletePostOutpuDTO> => {
        const {token, idToDelete} = input

        const payload = this.tokenManager.getPayload(token)

        if(!payload){
            throw new UnauthorizedError()
        }

        const postDB = await this.postDatabase.findPostById(idToDelete) 

        if(!postDB){
            throw new NotFoundError("Id não existe no banco de dados")
        }

        
        if(payload.role !== USER_ROLES.ADMIN){
            if(payload.id !== postDB.creator_id){
            throw new ForbiddenError("Apenas o administrador ou o criador do post podem deletá-lo")
        }

        await this.postDatabase.deletePostById(idToDelete)

        const output: DeletePostOutpuDTO = undefined

        return output

    }
   
}

    public likeOrDislike = async (input: LikeOrDislikeInputDTO): Promise <LikeOrDislikeOutputDTO> => {
        const{ postId, token, like} = input

        const payload = this.tokenManager.getPayload(token)
        
        if(!payload){
            throw new UnauthorizedError()
        }

        const postDBWithCreatorName = await this.postDatabase.findPostWithCreatorNameById(postId)

        if(!postDBWithCreatorName){
            throw new NotFoundError ("id do post não está cadastrado no banco de dados")
        }
        
            const post = new Post (
                postDBWithCreatorName.id,
                postDBWithCreatorName.content,
                postDBWithCreatorName.likes,
                postDBWithCreatorName.dislikes,
                postDBWithCreatorName.created_at,
                postDBWithCreatorName.updated_at,
                postDBWithCreatorName.creator_id,
                postDBWithCreatorName.creator_name
            )
        
        const likeSQlite = like ? 1: 0
    
        const  likeOrDislikeDB: LikeOrDislikeDB = {
        user_id: payload.id,
        post_id: postId,
        like: likeSQlite
    }

    const likeOrDislikeExists = await this.postDatabase.findLikeOrDislike(likeOrDislikeDB)
    
    if (likeOrDislikeExists === POST_LIKE.LIKE){
        if(like){
            await this.postDatabase.deleteLikeOrDislike(likeOrDislikeDB)
            post.deleteLike()
        } else {
            await this.postDatabase.updateLikeOrDislike(likeOrDislikeDB)
            post.deleteLike()
            post.addDislike()
        }
    } else if (likeOrDislikeExists === POST_LIKE.DISLIKE) {
        if(!like){
            await this.postDatabase.deleteLikeOrDislike(likeOrDislikeDB)
            post.deleteDislike()
        } else {
            await this.postDatabase.updateLikeOrDislike(likeOrDislikeDB)
            post.deleteDislike()
            post.addLike()
        }
    } else {
        await this.postDatabase.insertLikeOrDislike(likeOrDislikeDB)
        like ? post.addLike() : post.addDislike
    }

    const updatedPostDB = post.toDBModel()
    await this.postDatabase.updatePost(updatedPostDB)

    const output: LikeOrDislikeOutputDTO = undefined

    return output
}
}