import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {Like} from "../models/like.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { isValidObjectId } from "mongoose";

const toggleVideoLike = asyncHandler(async (req, res) => {
try {
        const {videoId} = req.params
    
        const userId = req.user._id
    
        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid VideoId")
        }
    
        const existingLike= await Like.findOne({
            video: videoId,
            likedBy: userId
        })
    
        if (existingLike) {
            await Like.findByIdAndDelete(existingLike._id)
    
            return res
                    .status(200)
                    .json(
                        new ApiResponse(200, existingLike, "Video unliked Succesfully")
                    )
        }
    
        const likedVideo= await Like.create({
            video: videoId,
            likedBy: userId
        })
        
        if (!likedVideo) {
            throw new ApiError(500, "video isnot liked")
        }
        
        return res
                .status(200)
                .json(
                    new ApiResponse(200, likedVideo, "video liked successfully")
                )
} catch (error) {
    throw new ApiError(404, error?.message || "something went wrong during toggling the like")
}
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    try {
        const {commentId} = req.params
    
        const userId = req.user._id
    
        if (!isValidObjectId(commentId)) {
            throw new ApiError(400, "Invalid CommentId")
        }
    
        const existingComment= await Like.findOne({
            comment: commentId,
            likedBy: userId
        })
    
        if (existingComment) {
            await Like.findByIdAndDelete(existingComment._id)
    
            return res
                    .status(200)
                    .json(
                        new ApiResponse(200, existingComment, "Comment like deleted Succesfully")
                    )
        }
    
        const commentVideo= await Like.create({
            comment: commentId,
            likedBy: userId
        })
        
        if (!commentVideo) {
            throw new ApiError(500, "comment is not found")
        }
        
        return res
                .status(200)
                .json(
                    new ApiResponse(200, commentVideo, "comment Liked successfully")
                )
} catch (error) {
    throw new ApiError(404, error?.message || "something went wrong during toggling the commentLike")
}
})

const toggleTweetLike = asyncHandler(async (req, res) => {
     try {
        const {tweetId} = req.params
    
        const userId = req.user._id
    
        if (!isValidObjectId(tweetId)) {
            throw new ApiError(400, "Invalid TwweetId")
        }
    
        const existingTweet= await Like.findOne({
            tweet: tweetId,
            likedBy: userId
        })
    
        if (existingTweet) {
            await Like.findByIdAndDelete(existingTweet._id)
    
            return res
                    .status(200)
                    .json(
                        new ApiResponse(200, existingTweet, "Tweet like's deleted Succesfully")
                    )
        }
    
        const tweetVideo= await Like.create({
            tweet: tweetId,
            likedBy: userId
        })
        
        if (!tweetVideo) {
            throw new ApiError(500, "tweet is not found")
        }
        
        return res
                .status(200)
                .json(
                    new ApiResponse(200, tweetVideo, "tweet Liked successfully")
                )
} catch (error) {
    throw new ApiError(404, error?.message || "something went wrong during toggling the Like a Tweet")
}
})

const getLikedVideos = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id
    
        if (!userId) {
            throw new ApiError(400,"Invalid User Id")
        }

        const likedVideo= await Like.find({
            likedBy:userId,
            video: {$exists: true}
        }).populate("video", "_id title url")

        if (!likedVideo) {
            throw new ApiError(500, "Liked is not found")
        }

        return res
                .status(200)
                .json(
                    new ApiResponse(200, likedVideo, "Liked Video fetched successfully")
                )

    } catch (error) {
        throw new ApiError(400, error?.message || "something went wrong during getting liked video")
    }
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}