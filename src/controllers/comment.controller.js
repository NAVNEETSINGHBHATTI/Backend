import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {Comment} from "../models/comment.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";

const getVideoComments = asyncHandler(async (req, res) => {
    try {
        const {videoId} = req.params
        const {page = 1, limit = 10} = req.query
    
        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid videoId")
        }
    
        const videoObjectId= new mongoose.Types.ObjectId(videoId)
    
        const comment = await Comment.aggregate([
            {
                $match: {
                    video: videoObjectId
                }
            },
            {
                $lookup: {
                    from:"videos",
                    localField:"video",
                    foreignField:"_id",
                    as: "commentOnWhichId"
                }
            },
            {
                $lookup: {
                    from:"users",
                    localField:"owner",
                    foreignField:"_id",
                    as:"ownerOfComment"
                }
            },
            {
                $project:{
                    content:1,
                    owner:{
                        $arrayElemAt: ["$OwnerOfComment", 0],
                    },
                    videos: {
                        $arrayElemAt: ["$commentOnWhichId", 0],
                    },
                    createdAt:1
                }
            },
            {
                $skip:(page - 1) * parseInt(limit),
            },
            {
                $limit: parseInt(limit)
            }
        ]);
    
        if(comment.length===0){
            throw new ApiError(400, "comment is empty")
        }
    
        return res
                .status(200)
                .json(
                    new ApiResponse(200, comment, "Video Comments fetched successfully")
                )
    } catch (error) {
        throw new ApiError(400,"something went wrong during fetching video's comments")
    }
})

const addComment = asyncHandler(async (req, res) => {
    try {
        const {videoId} = req.params
        const {content} = req.body

        if(!isValidObjectId(videoId)){
            throw new ApiError(400, "Invalid video Id")
        }

        if (!req.user){
            throw new ApiError(400, "User need tobe loggedIn")
        }

        const addedContent = await Comment.create({
            content,
            owner: req.user?._id,
            video: videoId
        })

        if(!addedContent){
            throw new ApiError(500, "comment is not added to video")
        }

        return res
                .status(200)
                .json(
                    new ApiResponse(200, addedContent, "comment added successfully")
                )

    } catch (error) {
        throw new ApiError(400,error?.message || "something went wrong during add comments")
    }
})

const updateComment = asyncHandler(async (req, res) => {
    try {
        const {commentId} = req.params
        const {content} = req.body
        if(!isValidObjectId(commentId)){
            throw new ApiError(400, "Invalid Comment Id")
        }
    
        if (!content) {
            throw new ApiError(400, "comment cannot be empty")
        }
    
        if(!req.user){
            throw new ApiError(400, "user need to logged in")
        }
    
        const updatedComment = await Comment.findOneAndUpdate(
            {
                _id: commentId,
                owner: req.user._id
            },
            {
                $set: {
                    content
                }  
            },
            {new : true}
        )
    
        if (!updatedComment) {
            throw new ApiError(404 ,"comment is not updated")
        }
    
        return res
                .status(200)
                .json(
                    new ApiResponse(200, updatedComment, "Comment Updated Successfully")
                )
    } catch (error) {
        throw new ApiError(400, error?.message ||"something went wrong during updation the comment")
    }
})

const deleteComment = asyncHandler(async (req, res) => {
    try {
        const {commentId} = req.params
    
        if (!isValidObjectId(commentId)) {
            throw new ApiError(400, "Invalid Comment ID")
        }
    
        if(!req.user){
            throw new ApiError(400, "User need to logged In")
        }
    
        const deletedComment = await Comment.findOneAndDelete(
            {
                _id: commentId,
                owner: req.user._id
            }
        )
    
        if (!deletedComment) {
            throw new ApiError(404, "Comment is deleted")
        }
    
        return res
                .status(200)
                .json(
                    new ApiResponse(200, deletedComment, "Comment deleted Successfully" )
                )

    } catch (error) {
        throw new ApiError(400, error?.message ||"Something went wrong during deletion of comment")
    }
})

export{
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}