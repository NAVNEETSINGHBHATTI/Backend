import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {Subscription} from "../models/subscription.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import  {isValidObjectId} from "mongoose";

const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    const subscriberId =  req.user._id

    try {
        if (!isValidObjectId(channelId)) {
            throw new ApiError(400, "Invalid channelId")
        }

        if(subscriberId.toString()=== channelId.toString()){
            throw new ApiError(400, "You cannot subscribe to own channel")
        }

        const subscriber = await Subscription.findOne({subscriber: subscriberId, channel: channelId})

        if (subscriber) {
            await Subscription.findByIdAndDelete(subscriber._id)

            return res
                    .status(200)
                    .json(
                        new ApiResponse(200, {} , "Subscriber's unsubscribe the channel")
                    )
        }

        await Subscription.create({subscriber: subscriberId, channel: channelId})
        
        return res
                .status(200)
                .json(
                    new ApiResponse(200, {}, "You subscribed the channel")
                )
    } catch (error) {
        throw new ApiError(400, error?.message || "error during toggle subscription")
    }
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    try {
        const channelId = req.user._id
    
        if (!isValidObjectId(channelId)) {
            throw new ApiError(400,"Invalid Channel Id")
        }

        const subscbriberList = await Subscription.find({channel: channelId}).populate("subscriber", "_id name email")
console.log(subscbriberList)
        if (!subscbriberList) {
            throw new ApiError(400, "Subscriber List is not find")
        }

        return res
                .status(200)
                .json(
                    new ApiResponse(200, subscbriberList, "The Channel Subscribers fetched successfully")
                )

    } catch (error) {
        throw new ApiError(400, error?.message|| "Error during finding channel subscbriber")
    }
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    try {
        const  subscriberId  = req.user._id

        console.log(subscriberId);
        
    
        if (!isValidObjectId(subscriberId)) {
            throw new ApiError(400, "Invalid Subscriber Id")
        }

        const channelList = await Subscription.find({subscriber: subscriberId}).populate("channel", "_id name email")
        console.log("channelList")

        if (!channelList || channelList.length===0) {
            throw new ApiError(400,"Channel list is not found")
        }

        return res
                .status(200)
                .json(
                    new ApiResponse(200, channelList, "Channel List fetched Successfully")
                )
    } catch (error) {
        throw new ApiError(400, error?.message || "Error during find channels")
    }
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}