
import { asyncHandeler } from "../utils/async.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken'
import mongoose from "mongoose";


const generateAccessAndRefresToken = async(userId)=> {
    try {
        const user = await User.findById(userId)
        const accesToken = user.genrateAccessToken()
        const refreshToken = user.genrateRefreshToken()

        user.refreshToken = refreshToken;
        await user.save({validateBeforeState: false})  // validate before save

        return {accesToken, refreshToken}
    } catch (error) {
        throw new ApiErrors(500, "Something went wrong while geting tokens")
    }
}

const registerUser = asyncHandeler(async (req,res) =>{
   // get user detils
   // validation
   // check if user already exist username , email
   // check files are there are not
   // upload to cloudinary
   // check cloudinary 
   //remove password and refresh token from response
   // check for user creation
   // return res

   const {fullname, email, username, password} = req.body
   console.log(email);

//    if(fullname === ""){
//         throw new ApiErrors(400, "Full name is required")
//    }

if([fullname, email, username, password].some((field) => field?.trim() === "" )){
    throw new ApiErrors(400, "All Fieds are required")
}

const existedUser = await User.findOne({
    $or: [{username}, {email}]
})

if(existedUser){
    throw new ApiErrors(409, "user with email or username already exsit")
}

const avatarLocation = req.files?.avatar[0]?.path;
// const coverImageLocation = req.files?.coverImage[0]?.path;

let coverImageLocation;
if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocation = req.files.coverImage[0].path
}


if(!avatarLocation){
    throw new ApiErrors(400, "Avatar File is require")
}

const avatar = await uploadOnCloudinary(avatarLocation)
const coverImage = await uploadOnCloudinary(coverImageLocation)


if(!avatar){
    throw new ApiErrors(400, "Avatar File is require")
}


const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
})


const createduser = await User.findById(user._id).select(
    "-password -refreshTokens"
)

if (!createduser) {
    throw ApiErrors(500, "Some thing went wrong")
}


   res.status(200).json(
    new ApiResponse(200, createduser, "User registration successfull")
   )
})

const loginUser = asyncHandeler(async (req,res) => {
   // req body -> data
   // username or email
   // find the user
   // password check 
   // access and refresh token
   // send them in cookie and success res

   const {email, username, password} = req.body

   if (!(username || email)) {
       throw new ApiErrors(400, "username or email is required")
   }

    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!existedUser) {
        throw new ApiErrors(404, "User does not exist Please Register your self first")
    }

    const isPasswordValid = await existedUser.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiErrors(401, "Invalid Password")
    }

    const {accesToken, refreshToken} = await generateAccessAndRefresToken(existedUser._id)

    const loggesInUser  = await User.findById(existedUser._id).select("-password -refreshToken")

    // cookie code

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res.status(200).cookie("accessToken", accesToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, {user: loggesInUser, accesToken, refreshToken}, "User logged in successfully")
    )

})

const loggedOut = asyncHandeler(async(req,res) =>{
 await User.findByIdAndUpdate(
    req.user._id,
    {
        $set: {
            refreshToken: undefined
        }
    },
    {
        new: true
    }
  )

  const options = {
    httpOnly: true,
    secure: true,
}
  return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options)
  .json(new ApiResponse(200, "User logged out successfully"))
})

const refreshAccessToken = asyncHandeler(async(req,res) =>{
    const IncommingrefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!IncommingrefreshToken) {
        throw new ApiErrors(401, "Unathorised request")
    }

   const decodedToken =  jwt.verify(IncommingrefreshToken, process.env.REFRESH_TOKEN_SECRET)

 const user = await User.findById(decodedToken?._id)

 if (!user) {
    throw new ApiErrors(401, "Invalid")
 }

 if (IncommingrefreshToken !== user?.refreshAccessToken) {
    throw new ApiErrors(401, "Invalid Expired")
 }

 const option ={
    httpOnly: true,
    secure: true,
 }

 const {accesToken, newrefreshToken} = await generateAccessAndRefresToken(user._id)
 
 return res
 .status(200)
 .cookie("accessToken",accesToken, option)
 .cookie("refreshToken", newrefreshToken, option)
 .json(new ApiResponse(200,{accesToken, refreshToken: newrefreshToken}, 
    "Access token refreshed"
 ))
})

const changeCurrentPassword = asyncHandeler(async(req,res) =>{
    const {oldPassword, newPassword} = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiErrors(400, "Invalid Password")
    }

    user.password = newPassword
    await user.save({validateBeforeState: false})

    return res.status(200)
    .json(new ApiResponse(200), {}, "Password Changed Successfully")
})

const getCurrentUser = asyncHandeler(async(req,res) =>{
    return res.status(200)
    .json(new ApiResponse(200, req.user, "Current User fetch Succesfully"))
})

const updateAccountDetails = asyncHandeler(async(req,res) =>{
    const {fullname, email} = req.body

    if(!fullname || !email){
        throw new ApiErrors(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,{
        $set: {
            fullname,
            email
        }
    }, {new: true}).select("-password")

    return res.status(200)
    .json(new ApiResponse(200, user, "Updated"))
})

const updateAvatar = asyncHandeler(async(req,res) =>{
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiErrors(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiErrors(400, "Avatar file is not uploaded")
    }

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            avatar: avatar.url
        }
    }, {new: true}).select("-password")

    return res.status(200)
    .json(new ApiResponse(200, user, "Avatar Updated"))
})

const updateCoverImage = asyncHandeler(async(req,res) =>{
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiErrors(400, "Cover Image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiErrors(400, "cover Image file is not uploaded")
    }

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            coverImage: coverImage.url
        }
    }, {new: true}).select("-password")

    return res.status(200)
    .json(new ApiResponse(200, user, "Cover Image updated"))

})

const getUserProfile = asyncHandeler(async(req,res) =>{
  const {username} = req.params

  if (!username?.trim()) {
    throw new ApiErrors(400, "Username is Missing")
  }

  const channel = await User.aggregate([
    {
        $match: { 
            username: username?.toLowerCase() 
        },
    },
    {
        $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers",
        }
    },
    {
        $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribedTo",
        }
    },
    {
        $addFields: {
            subscriberCount: { $size: "$subscribers" },
            channelSubscribedToCount: {$size: "$subscribedTo"},
            isSubscribed: {
                $cond: {
                    if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                     then: true, else: false

                }
            }
        }
    },
    {
        $project: {
            fullname: 1,
            username: 1,
            avatar: 1,
            subscriberCount: 1,
            channelSubscribedToCount: 1,
            isSubscribed: 1,
            email: 1,
            coverImage: 1

        }
    }

  ])

  if (!channel?.length) {
    throw new ApiErrors(404, "Channel does not exsist")
  }

  return res
  .status(200)
  .json(new ApiResponse(200, channel[0], "Fetched success"))
   
})

const getWatchHistory = asyncHandeler(async(req,res) =>{
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "Video",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "User",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        avatar: 1,
                                        username: 1,

                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])
    return res
    .status(200)
    .json(new ApiResponse(200, user[0].watchHistory, "Fetched success"))
  
})





export {registerUser, loginUser, loggedOut,
     refreshAccessToken, changeCurrentPassword,
      getCurrentUser, updateAccountDetails, updateAvatar, updateCoverImage, getUserProfile, getWatchHistory}