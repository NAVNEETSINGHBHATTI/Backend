import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.model.js";
import { Comment } from "../models/comment.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id
    
        const totalVideos= await Video.countDocuments({owner: userId})
        if (totalVideos===null || totalVideos===undefined) {
            throw new ApiError(500, "something went wrong during displaying total vidoes")
        }
    
        const totalSubscribers= await Subscription.countDocuments({channel: userId})
        if (totalSubscribers===null || totalSubscribers===undefined) {
            throw new ApiError(500, "something went wrong during displaying total Subscribers")
        }
    
        const totalVideoLikes = await Like.countDocuments({
            video: {
                $in: await Video.find({owner: userId}).distinct("_id")
            }
        })
    
        if (totalVideoLikes===null || totalVideoLikes===undefined) {
            throw new ApiError(500, "something went wrong during displaying total video Likes")
        }
    
        const totalTweetLikes = await Like.countDocuments({
            video: {
                $in: await Tweet.find({owner: userId}).distinct("_id")
            }
        })
    
        if (totalTweetLikes===null || totalTweetLikes===undefined) {
            throw new ApiError(500, "something went wrong during displaying total Tweet Likes")
        }
    
        const totalCommentLikes = await Like.countDocuments({
            video: {
                $in: await Comment.find({owner: userId}).distinct("_id")
            }
        })
    
        if (totalCommentLikes===null || totalCommentLikes===undefined) {
            throw new ApiError(500, "something went wrong during displaying total Comment Likes")
        }
    
        const totalViews = await Video.aggregate([
            {
                $match: {owner: userId}
            },
            {
                $group: {
                    _id: null,
                    totalViews : {$sum: "$views"}
                }
            }
        ])
    
        if (totalViews===null || totalViews===undefined) {
            throw new ApiError(500, "something went wrong during displaying total Video Views")
        }
    
        return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        {totalVideos,
                        totalSubscribers,
                        totalVideoLikes,
                        totalTweetLikes,
                        totalCommentLikes,
                        totalViews: totalViews[0]?.totalViews || 0
                        },
                        "Channel stats fetched successfully"
                    )
                )
    } catch (error) {
        throw new ApiError(400, error?.message || "something went wrong during displaying the channel stats")
    }


    
})

const getChannelVideos = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id
    
        const videos = await Video.find({
            owner: userId
        }).sort({createdAt: -1})
    
        if (!videos || videos.length===0) {
            throw new ApiError(500, "videos is not found ")
        }
    
        return res
                .status(200)
                .json(
                    new ApiResponse(200, videos, "Videos fetched successfully")
                )
    } catch (error) {
        throw new ApiError(400, error?.message || "something went wrong during displaying the channel videos")
    }    
})

export {
    getChannelStats,
    getChannelVideos
}