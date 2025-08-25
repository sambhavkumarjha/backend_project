import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { use } from "react";

const generateAccessAndRefreshTokens = async (userId) => {
    try { 
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken() ;
        const refreshToken = user.generateRefreshToken();
        
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave:false})

        return {accessToken,refreshToken};

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access tokens")
    }
}

const registerUser = asyncHandler( async (req, res) =>{
    // res.status(200).json({
    //     message: "ok"
    // })
    //get user details from frontend
    //validation - not empty  and others
    //check if user already exists :username, email
    //check for images , check fo avatar
    // upload them to cloudinary ,avatar
    //create user object  - create entry in db 
    // remove password and refresh token field from response
    //check for user creation 
    //return response


    const  {Fullname, email, username, password} =  req.body
    console.log("email: ",email);

    // if(Fullname ==="")
    // {
    //     throw new ApiError(400, "full name is required");
    // }
    if(
        [Fullname,email,username,password].some((field)=>{
            field?.trim() === "" 
        }) 
    )
    {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or:[{ email },{ username }]
    })
    if(existedUser)
    {
        throw new ApiError(409,"user with existing email or username");
    }

    //multer gives us the req.files access
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.
        coverImage
        )&& req.files.coverImage.length >0
    )
    {
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar is required");
    }

    const user = await User.create({
        Fullname,
        avatar:avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })
    const createdUser = await User.findById(user._id)
    .select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200 , createdUser, "User registered successfully")
    )
} )

const loginUser = asyncHandler(async (req,res)=>{
    // req.body => data
    // username or email
    //find the user
    // check the password
    // access and refresh token generate
    // send the tokens through cookies and send the response

    const {email,username,password} = req.body;
    if(!username &&  !email)
    {
        throw new ApiError(400,"username or email is required");
    }

    const user =  await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404,"user does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid)
    {
        throw new ApiError(401,"Invalid User Credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken");

    const options = {
        httpOnly:true,
        secure: true
    }
    // can only be modified from server not from even frontend

    return res
    .status(200)
    .cookie("accessToken",accessToken , options )
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )
})

const logoutUser = asyncHandler(async (req,res) => {
    // middle ware jane se pehle milke jayega
    // like multer form ka data ja hi rha hai image ka bhi mujhse leke jayo
    // similar we can write our own middleware here
    // since we have add cookieParser in the app.js, then we can access the cookies in req field too
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new:true
        }
    )
    const options = {
        httpOnly: true,
        secure: true 
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(200,{},"User logged OUT")
    )
})

const refreshAccessToken  = asyncHandler( async (req,res) =>{
    const incomingRefreshToken = req.cookies.refreshToken ||
     req.body.refreshToken
     if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized request")
     }

    try {
         const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
    
        const user = await User.findById(decodedToken?._id);
    
        if(!user)
        {
            throw new ApiError(401,"Invalid  refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }
    
        const options = {
            httpOnly:true,
            secure: true
        }
    
        const {accessToken,newrefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newrefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newrefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token")

    }
})

const changeCurrentPassword = asyncHandler( async(req,res)=>{

    const {oldPassword, newPassword} = req.body

    // agar change password pe user aa rha hai to wo 
    // login hona chaiye
    // agar nhi hai to login page pr jana chaiye
    // agar log in hai to auth middleware se hm use ke request mein user property add kar sakte hai

    const user = await User.findById(req.user?._id)
    const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isOldPasswordCorrect)
    {
        throw new ApiError(401,"incorrect old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},
            "Password changed successfully"
        )
    )
})

const getCurrentUser = asyncHandler (async (req,res)=>{
    return res
    .status(200)
    .json(
        new ApiResponse(200,req.user,"current user fetched successfully")
    )

})

const updateAccountDetails = asyncHandler(async (req,res)=>{
    const {Fullname, email} = req.body;
    if(!Fullname || !email)
    {
        throw new ApiError(400,"both  fields(fullname and email) are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id ,
        {
            $set :{
                Fullname:Fullname,
                email:email
            }
        },
        {new: true}
    )   

    .select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,
            user,
            "Account details updated successfully"
         )
    )
})

const updateUserAvatar = asyncHandler(async (req,res)=>{
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath)
    {
        throw new ApiError(400,"Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url)
    {
        throw new ApiError(401,"error while uploading the avatar file")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "user avatar is updated successfully"
        )
    )
})
const updateUserCoverImage = asyncHandler(async (req,res)=>{
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath)
    {
        throw new ApiError(400,"coverImage file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url)
    {
        throw new ApiError(401,"error while uploading the coverImage file")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "user coverImage is updated successfully"
        )
    )
})

const getUserChannnelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params

    if(!username?.trim())
    {
        throw new ApiError(400,"username is missing")
    }

    //User.find({username})
    //User.aggregate([{},{},{}])
    // aggregate is a method that is used for the pipelines aggregation which takes an array in which there will be multiple pipelines in the form of objects

    const channel = await User.aggregate([
        {
            // first pipeline is of match field
            // it wants a value from which you want to match
            $match:{
                username:username?.toLowerCase()
            }
        },
        // we will get the user document 
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",

                foreignField:"channel",
                as:"subscribers"
            }
        },
        

        // this pipeline will give the output array containings all the document which have the channel name as the userid of the username found earlier

        {
            $lookup:{
                from: "subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        // the above pipeline will give the documents in which the subscriber field is given reference as the username calculated or obtained above
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                }, 
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if: {$in: [req.user?._id,"$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        // now the above two pipelines size will be added as a separate field in the collection and named as the property of the given pipeline
        // the third field mein hum yeh bta rhe hain
        //ki jis user ke login rehte is endpoint pr aya gaya hai
        // jaise 'x' user ne login kiya aur phir usne 'y' channel ke bare me search kiya
        // 'y' channel ke home page pr number of subscriber hmne pehle field se represent kiya 
        // phir the number of channels the 'y' channel has subscribed to represent kr rhe
        // third field mein yeh represent hoga ki 'x ' ne 'y' ko subscribe kiya ki nhi
        // humare paas pehle se wo sare documents hai jinme 'y' as a channel mojud hai 
        // hum phir un sabhi documents mein check krenge ki kya unme 'x' as as subscriber  hai 
        // agar ha to true return hoga//
        // agar nhi to sab documents ko check krne ke bad false return kr denge
        // yeh hum kr pa rhe hai by using a middle ware jo ki  humare mein req object mein ek user naam ki property ko add kr rha hai
        // phir hum condition mein in operator ka use kr rhe hai 
        // jo ki array as well as object mein bhi search kr lega ki kya yeh user id 'subscriber' field ki kisi document mein as a subscriber present hai ki nhi
        {
            $project:{
                Fullname: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
        // project gives projection that it will not use all the values at once 
        // else it will represent selected values
    ])
    console.log(channel);

    if(!channel?.length)
    {
        throw new ApiError(404,"channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0], "User channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async(req,res)=>{
    // hum jb bhi req.user._id use kr rhe hai to wo hume string return kar ta hai 
    // phir query krne ke time pr mongoose internally usko phir object id mein change kr leta hai
    const user  = await User.aggregate([
        // 1st pipeline
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
                // pipelines aggregation mein mongoose ke internal features kaam nhi karte
                // isliye hume explicitly convert krna padta hai object_id mein
                
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        Fullname:1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannnelProfile,
    getWatchHistory
};