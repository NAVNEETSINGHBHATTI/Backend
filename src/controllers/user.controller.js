import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"


const generateAcessAndRefreshTokens= async(userId) => {
    try {
        const user=  await User.findById(userId)
        const accessToken= user.generateAcessToken()
        const refreshToken= user.generateRefreshToken()

        user.refreshToken = refreshToken 
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}
        
    } catch (error) {
        throw new ApiError(500,"something went wrong while generating access and refresh token")
    }
}

const registerUser = asyncHandler( async (req, res)=>{
    const {fullName, email, username, password} =req.body //get user detail
    
    
    if (  // validation
        [fullName, email, username, password].some((field)=>field?.trim()=== "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // check is user already exit 

    const exitedUser =  await User.findOne({
        $or: [{ username }, { email }]
    })
    if (exitedUser) {
        throw new ApiError(409, "User with email or username already exited")
    }

    // check images and avatar

    const avatarLocalPath= req.files?.avatar[0]?.path;
    // const coverImageLocalPath= req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0){
        coverImageLocalPath= req.files.coverImage[0].path
    }
    
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
// login user

const loginUser = asyncHandler(async (req, res)=>{
    // req data
    const {email, username, password} =req.body

    if (!username && !email){
        throw new ApiError(400, "Username or Email is neccessary for Login.")
    }

    //find username or password

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User not exist")
    }

    // password checking

    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(404,"Invalid user Credentials")
    }

    // generate and validate access and refresh token
    const {accessToken, refreshToken} =await generateAcessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select(" -password -refreshToken")
    
    // send tokens in cookie
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                 user: loggedInUser, accessToken, refreshToken
            },
            "User LoggedIn Sucsessfully"
        )
    )


})

//logout User

const logoutUser = asyncHandler(async (req,res)=> {
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
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{}, "User Logged Out"))
})

// end point for refresh token

const refreshAccessToken = asyncHandler(async (req, res)=>{
    //access the refresh token
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorised request")
    }

    // verify the refresh token
    try {
        const decodedToken= jwt.verify(
            incomingRefreshToken, 
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user= await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        const options={
            httpOnly:true,
            secure: true
        }
    
        const {accessToken, newrefreshToken}= await generateAcessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken)
        .cookie("refreshToken", newrefreshToken)
        .json(
            new ApiResponse(
                200,
                {accessToken, newrefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message|| "Inavalid refresh token")
    }
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}