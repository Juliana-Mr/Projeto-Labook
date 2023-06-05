import { OutgoingMessage } from "http";
import { TokenExpiredError } from "jsonwebtoken";
import { UserDatabase } from "../database/UserDatabase";
import { LoginInputDTO, LoginOutputDTO } from "../dtos/user/login.dto";
import { SignupInputDTO, SignupOutpuDTO } from "../dtos/user/signup.dto";
import { BadRequestError } from "../errors/BadRequestError";
import { BaseError } from "../errors/BaseError";
import { NotFoundError } from "../errors/NotFoundError";
import { TokenPayload, User, USER_ROLES } from "../models/User";
import { HashManager } from "../services/HashManager";
import { IdGenerator } from "../services/IdGenerator";
import { TokenManager } from "../services/TokenManager";

export class UserBusiness{
    constructor(
        private userDatabase: UserDatabase,
        private idGenerator: IdGenerator,
        private tokenManager: TokenManager,
        private hashManager: HashManager
    ){}

    public signup = async(input: SignupInputDTO):Promise <SignupOutpuDTO> => {
        const {name, email,password} =input

        const id = this.idGenerator.generate()

        const hashedPassword = await this.hashManager.hash(password)

        const user = new User(
            id, 
            name,
            email,
            hashedPassword,
            USER_ROLES.NORMAL,
            new Date().toISOString()
        )

        const userDB = user.toDBModel()
        await this.userDatabase.insertUser(userDB)

        const payload: TokenPayload = {
            id: user.getId(),
            name: user.getName(),
            role: user.getRole()
        }

        const output: SignupOutpuDTO = {
        token: this.tokenManager.createToken(payload)
        }

        return output
    }

    public login = async(input:LoginInputDTO):Promise <LoginOutputDTO> => {
        const {email,password} = input

        const userDB = await this.userDatabase.findUserByEmail(email)

        if(!userDB) {
            throw new NotFoundError ("Email não cadastrado")
        }

        const user = new User (
        userDB.id,
        userDB.name,
        userDB.email,
        userDB.password,
        userDB.role,
        userDB.created_at
        )

        const isPasswordTrue = await this.hashManager.compare(password, user.getPassword())

        if(!isPasswordTrue){
            throw new BadRequestError ("Senha incorreta")
        }

        const payload: TokenPayload = {
            id: user.getId(),
            name: user.getName(),
            role: user.getRole()
        }
        
        const token = this.tokenManager.createToken(payload)

        const output: LoginOutputDTO = {
            token
        }

        return output
    }
}