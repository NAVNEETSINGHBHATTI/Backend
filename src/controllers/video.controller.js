import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

// get all videos
const getAllVideos = asyncHandler(async (req, res) => {
    const {
         page = 1, 
         limit = 10, 
         query= "", 
         sortBy ="createdAt", 
         sortType = "desc", 
         userId 
        } = req.query

    if (!req.user) {
        throw new ApiError(400,"User need to be loggedIn")
    }
    
    const match = {
        ...(query ? {title: {$regex : query, $options: "i"}}: {}),
        ...(userId?{owner: mongoose.Types.ObjectId(userId)}: {})
    };

    const videos = await Video.aggregate([
        {
            $match: match
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"videosByOwner"
            }
        },
        {
           $project:{
                videoFile:1,
                thumbnail:1,
                title:1,
                description:1,
                duration:1,
                views:1,
                isPublished:1,
                owner:{
                    $arrayElemAt: ["$videosByOwner",0]
                }
           } 
        },
        {
            $sort:{
                [sortBy]: sortType === "desc"? -1:1
            }
        },
        {
            $skip: (page - 1)* parseInt(limit)
        },
        {
            $limit: parseInt(limit)
        }
    ]);
    
    if (!videos) {
        throw new ApiError(404, "videos are not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, videos, "videos fetched successfully")
    )
})

// publish a video
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    
    try {
        if ([title, description].some((field)=>{ field.trim()===""})) { 
            throw new ApiError(400, "title and description is not given")
        }
        const videoFileLocalPath= req.files?.videoFile[0]?.path
        const thumbnailLocalPath = req.files?.thumbnail[0]?.path
    
        if(!videoFileLocalPath)
        {
            throw new ApiError(400, "video file is required")
        }
    
        if (!thumbnailLocalPath) {
            throw new ApiError(400, "video file is required")
        }
    
        const uploadedVideofile= await uploadOnCloudinary(videoFileLocalPath)
        const uploadedthumbnail= await uploadOnCloudinary(thumbnailLocalPath)
    
        if (!uploadedVideofile) {
            throw new ApiError(400, "videoFile is not uploaded on cloudinary")
        }
        if (!uploadedthumbnail) {
            throw new ApiError(400, "thumbnail is not uploaded on cloudinary")
        }
    
        const video = await Video.create({
            title,
            description,
            duration: uploadedVideofile?.duration,
            videoFile: uploadedVideofile?.url,
            thumbnail: uploadedthumbnail?.url,
            isPublished: true,
            owner: req.user?._id
        })
    
        if (!video) {
            throw new ApiError(400, "video details are required")
        }

        return res
        .status(201)
        .json(
            new ApiResponse(200,video, "video details are published" )
        )
    } catch (error) {
        throw new ApiError(501, error?.message || "video is not uploaded on cloudinary" )
    }
})

// get video by id
const getVideoById = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params
        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, "videoId is not valid")
        }

        const video = await Video.findById(videoId)

        if (!video) {
            throw new ApiError(400, "video is not found")
        }

        return res.status(200)
        .json(
             new ApiResponse(200, video, "video is found by Id" )
        )
    } catch (error) {
        throw new ApiError(500, error?.message||"Inavalid videoId")
    }
}) 

//Update a video
const updateVideo = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params
        
        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, "Inavalid video Id")
        }
    
        const {title ,  description}= req.body
        if ([title, description]?.some((field)=>{field.trim()===""})) {
            throw new ApiError(400, "Please provide title, description")
        }

        const thumbnailLocalPath = req.file?.path
        if (!thumbnailLocalPath) {
            throw new ApiError(400, "new thumbnail is provided")
        }

        const uploadedthumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        if(!uploadedthumbnail.url){
        throw new ApiError(400, "Error while uploading thumbnail")
    } 

        const video= await Video.findOneAndUpdate(
             { _id:videoId , owner:req.user._id},
             {
                $set: {
                    title,
                    description,
                    thumbnail:uploadedthumbnail.url
                }
             },{new: true}   
        )

        return res. status(200)
        .json(
            new ApiResponse(200, video, "video updated seuccessfully")
        )
    } catch (error) {
        throw new ApiError(400, error?.message||"updation for video is not done")
    }
})

// delete a video
const deleteVideo= asyncHandler(async(req, res)=>{
    try {
        const {videoId}= req.params
    
        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid videoID")
        }
        
        const video =  await Video.findOneAndDelete({_id: videoId , owner: req.user._id})
        
        if(!video){
            throw new ApiError(400, "video is not deleted")
        }
    
        return res.status(200)
                .json(
                    new ApiResponse(200, {}, "video is deleted" )
                )
    } catch (error) {
        throw new ApiError(400,error?.message || "sometging went wrong before deletion")
    }
})

// toggled published
const togglePublishStatus = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params
    
        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid videoId") 
        }

        const video = await Video.findOne({_id: videoId, owner: req.user._id})
        
        if (!video) {
            throw new ApiError(400, "you have no access ")
        }

        video.isPublished= !video.isPublished

        await video.save()
        return res.status(200)
        .json(
            new ApiResponse(200,{} , "Video toggled successfully")
        )
    } catch (error) {
        throw new ApiError(400, error?.message ||"toggled function is not available") 
    }
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}