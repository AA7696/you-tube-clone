
import { asyncHandeler } from "../utils/async.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from "../utils/ApiResponse.js";


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

export default registerUser