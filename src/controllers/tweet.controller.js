import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {Tweet} from "../models/tweet.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { isValidObjectId, mongo } from "mongoose";

const createTweet = asyncHandler(async (req, res) => {
    try {
        const {content} = req.body
        const ownerId = req.user._id
    
        if (!content) {
            throw new ApiError(400, "Tweet Should not be empty")
        }
    
        const newTweet =await Tweet.create({content ,owner: ownerId})
    
        if (!newTweet) {
            throw new ApiError(400, "Tweet isnot Created")
        }
    
        return res
                .status(200)
                .json(
                    new ApiResponse(200, newTweet, "Tweet created successfully")
                )
    } catch (error) {
        throw new ApiError(400,error?.message || "Something went wrong during creation of tweet")
    }
})

const getUserTweets = asyncHandler(async (req, res) => {
    try {
        const {userId}= req.params
    
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid User Id")
        }
    
        const tweets= await Tweet.find({owner: userId}).sort({createdAt: -1})
    
        if (!tweets || tweets.length===0) {
            throw new ApiError(400, "Tweets should not be empty")
        }
    
        return res
                .status(200)
                .json(
                    new ApiResponse(200, tweets, "Tweets fetched Successfully")
                )
    } catch (error) {
        throw new ApiError(400, error?.message || "something went wrong during fetching the user tweets")
    }
})

const updateTweet = asyncHandler(async (req, res) => {
    try {
        const { tweetId } = req.params
        const { content } = req.body
    
        if (!isValidObjectId(tweetId)) {
            throw new ApiError(400, "Invalid Tweet Id")
        }
    
        const userId = req.user._id
    
        const tweet= await Tweet.findById(tweetId)
        if (!tweet) {
            throw new ApiError(400,"tweet is not found")
        }
        if (tweet.owner.toString() != userId.toString()) {
            throw new ApiError(400, "Only owner can update tweet")
        }
    
        const updatedTweet= await Tweet.findByIdAndUpdate(
            tweetId,
            {
                $set: {content}
            },
            {new: true}
        )
    
        if (!updatedTweet) {
            throw new ApiError(400,"Tweet is not updated")
        }
    
        return res 
                .status(200)
                .json(
                    new ApiResponse(200, updatedTweet, "Tweet updated succesfully ")
                )
    } catch (error) {
        throw new ApiError(400, error?.message || "something went wrong during updating the tweet")
    }
})

const deleteTweet = asyncHandler(async (req, res) => {
    try {
        const { tweetId } = req.params
        const userId =req.user._id
    
        if (!isValidObjectId(tweetId)) {
            throw new ApiError(400, "Invalid tweet Id")
        }
    
        const tweet = await Tweet.findById(tweetId)
        if (!tweet) {
            throw new ApiError(400, "Tweet is not found")
        }
    
        if(tweet.owner.toString() != userId.toString()){
            throw new ApiError(400, "only owner can delete the tweet")
        }
    
        const deletedTweet = await Tweet.findByIdAndDelete(tweetId)
        if (!deletedTweet) {
            throw new ApiError(500, "tweet is not deleted")
        }
        return res
                .status(200)
                .json(
                    new ApiResponse(200, deletedTweet, "Tweet deleted succesfully")
                )
    } catch (error) {
        throw new ApiError(400, error?.message || "something went wrong during deleting the tweet")
    }

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}