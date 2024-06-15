import jwt from 'jsonwebtoken'
import { ApiErrors } from "../utils/ApiErrors.js";
import { asyncHandeler } from "../utils/async.js";
import { User } from "../models/user.model.js";



 const verifyJWT = asyncHandeler(async(req, res, next) =>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        if (!token) {
            throw new ApiErrors(401, "Unauthorize request")
        }
    
        const decodedToken = jwt.verify(token, process.env.Access_Token_SECRET)
    
       const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user){
            throw new ApiErrors(401, "Invalis Access Token")
        }
    
        req.user = user;
        next()
    } catch (error) {
        throw new ApiErrors(401, " Invalid access")
    }
})

export {verifyJWT}