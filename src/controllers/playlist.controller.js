import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {Playlist} from "../models/playlist.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";

const createPlaylist = asyncHandler(async (req, res) => {
    try {
        const {name , description} = req.body

        if (!name || !description) {
            throw new ApiError(400,"name and description is required ")
        }
    
        const createdPlaylist= await Playlist.create(
            {
                name,
                description,
                owner: req.user._id
            }
        )
    
        if (!createdPlaylist) {
            throw new ApiError(500,"PLaylist is not created")
        }

        return res
                .status(200)
                .json(
                    new ApiResponse(200, createdPlaylist, "Playlist create succesfully")
                )

    } catch (error) {
        throw new ApiError(400, error?.message||"something went wrong during playlist creation ")
    }
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    try {
        const {userId} = req.params
    
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Inavalid User ID")
        }
    
        const playlist = await Playlist.find({owner : userId})
    
        if (!playlist || playlist.length===0) {
            throw new ApiError(400, "Playlsit is not found")
        }
    
        return res
                .status(200)
                .json(
                    new ApiResponse(200, playlist, "Playlsit fetched Successfully")
                )
    } catch (error) {
        throw new ApiError(400, error?.message || "something went wrong during user finding playlist" )
    }
})

const getPlaylistById = asyncHandler(async (req, res) => {
    try {
        const {playlistId} = req.params
    
        if (!isValidObjectId(playlistId)) {
            throw new ApiError(400, "Inavalid Playlist ID")
        }

        const playlist = await Playlist.findById( playlistId).populate("videos")

        if (!playlist) {
            throw new ApiError(404, "Playlist is not found")
        }

        return res
                .status(200)
                .json(
                    new ApiResponse(200, playlist, "Playlist found Successfully ")
                )

    } catch (error) {
     throw new ApiError(400, error?.message || "something went wrong during playlist by Id")   
    }
    
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    try {
        const {playlistId, videoId} = req.params
    
        if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
            throw new ApiError(400, "Invalid playlistId or videoId")
        }

        const playlist =await Playlist.findById(playlistId)

        if (!playlist) {
            throw new ApiError(404, "Playlist is not found")
        }
        if (req.user._id.toString() != playlist.owner.toString()) {
            throw new ApiError(400, "Only owner can edit the playlist")
        }

        const addVideo = await Playlist.aggregate([
            {
                $match: {
                            _id : new mongoose.Types.ObjectId(playlistId)
                    }
            },
            {
                $addFields: {
                               videos: {
                                $setUnion: ["$videos", [new mongoose.Types.ObjectId(videoId)]]
                               }
                        }
            },
            {
                $merge: {
                    into: "playlists"
                }
            } 
    ])

    if(!addVideo){
        throw new ApiError(404, "vidoe is not added")
    }

    return res
            .status(200)
            .json(
                new ApiResponse(200, addVideo, "video added to playlist successfully")
            )

    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong during adding video")
    }
}) 

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    try {
        const {playlistId, videoId} = req.params
        
        if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid PlaylistID or VideoId")
        }

        const playlist = await Playlist.findById(playlistId)
        if(req.user._id.toString() != playlist.owner.toString() ){
            throw new ApiError(400, "Only owner can update the playlist")
        }

        const removedVideo = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $pull: {
                    videos: new mongoose.Types.ObjectId(videoId)
                },
            },{new : true}
        )

        if (!removedVideo) {
            throw new ApiError(400,"video is not remove form playlist")
        }

        return res
                .status(200)
                .json(
                    new ApiResponse(200, removedVideo, "video removed from playlist successfully")
                )

    } catch (error) {
        throw new ApiError(400, error?.message || "something went wrong during deletion of video from playlist")
    }
})

const deletePlaylist = asyncHandler(async (req, res) => {
    try {
        const {playlistId} = req.params
        
        if (!isValidObjectId(playlistId)) {
            throw new ApiError(400, "Invalid Playlist Id" )
        }
        
        const playlist = await Playlist.findById(playlistId)
        if (!playlist) {
            throw new ApiError(404, "Playlist is not found")
        }
    
        if (req.user._id.toString() != playlist.owner.toString()) {
            throw new ApiError(400, "Only owner can delete the playlist")
        }
    
        const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId)
    
        if (!deletedPlaylist) {
            throw new ApiError(400, "Playlist is not delted by owner")
        }
    
        return res
                .status(200)
                .json(
                    new ApiResponse(200, deletedPlaylist, "playlist delted successfully ")
                )
    } catch (error) {
        throw new ApiError(400, error?.message||"something went wrong durin deletion playlist ")
    }
})

const updatePlaylist = asyncHandler(async (req, res) => {
    try {
        const {playlistId} = req.params
        const {name, description} = req.body

        if(!isValidObjectId(playlistId)){
            throw new ApiError(400, "Invalid PlaylistId")
        }
        
        if (!name || !description) {
            throw new ApiError(400, "Name and description is required ")
        }

        const playlist = await Playlist.findById(playlistId)
        if (!playlist) {
            throw new ApiError(400, "Playlist is not found")
        } 
        
        if (req.user._id.toString() != playlist.owner.toString()) {
            throw new ApiError(400, "Only owner can update teh playlist ")
        }

        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $set: {
                    name,
                    description
                }
            },
            {new: true}
        )

        if (!updatedPlaylist) {
            throw new ApiError(400,"Playlist is not updated")
        }

        return res
                .status(200)
                .json(
                    new ApiResponse(200, updatedPlaylist, "Playlist Updated successfully")
                )

    } catch (error) {
        throw new ApiError(400, error?.message||"something went wrong uspdation playlist")
    }
})   
export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}