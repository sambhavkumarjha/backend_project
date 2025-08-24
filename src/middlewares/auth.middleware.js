//verify whether user is s or not
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req, res, next) =>{
   try {
     // next => dekho apna kaam to ho gya khatm ab ise jaha le jana hai waha le jao
     const token = req.cookies?.accessToken|| req.header
     ("Authorization")?.replace("Bearer ","")
 
     // Authorization: Bearer <token>
 
     if(!token)
     {
         throw new ApiError(401,"Unauthorized request")
     }
 
     const decodedToken =  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET )
 
     const user = await User.findById(decodedToken?._id).select(
         "-password -refreshToken"
     )
 
     if(!user)
     {
         throw new ApiError(401,"Invalid Access Token")
         // todo discuss about frontend
     }
 
     req.user = user;
     //adding user property in the request object
     next()
 
   } catch (error) {
        throw new 
        ApiError(401,error?.message || "Invalid Access Token")
   }
})