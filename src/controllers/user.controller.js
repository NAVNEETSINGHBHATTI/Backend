import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req, res)=>{
    const {fullName, email, username, password} =req.body //get user detail
    console.log("email:", email);
    
    if (  // validation
        [fullName, email, username, password].some(()=>field?.trim()=== "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // check is user already exit 

    const exitedUser = User.findOne({
        $or: [{ username }, { email }]
    })
    if (exitedUser) {
        throw new ApiError(409, "User with email or username already exited")
    }

    // check images and avatar

    const avatarLocalPath= req.files?.avatar[0]?.path;
    const coverImageLocalPath= req.files?.coverImage[0]?.path;
    
    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar File is required")
    }

    // uplaod them to cloudinary

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "avatar File is required") 
    }

    // create user  object and entry in db

    const user= await User.create({
        fullName,
        avatar : avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
        
    //remove password and refresh token
    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering a user")
    }

    // return response

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Sucessfully")
    )
})

export {registerUser}