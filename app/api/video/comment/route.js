import { NextResponse } from "next/server";
import connectToDatabase from "@/utils/mongodb";
import Video from "@/models/Video";
import axios from "axios";
import mongoose from "mongoose";

async function ensureVideoExists(videoId) {
  let video = await Video.findOne({ videoId });

  if (!video) {
    const API_KEY = process.env.YOUTUBE_API_KEY;
    if (!API_KEY) {
      throw new Error("YouTube API key is not configured");
    }

    const videoResponse = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos`,
      {
        params: {
          part: "snippet",
          id: videoId,
          key: API_KEY,
        },
      }
    );

    if (videoResponse.data.items.length === 0) {
      throw new Error("Video not found on YouTube");
    }

    const videoItem = videoResponse.data.items[0];

    video = await Video.create({
      videoId,
      originalTitle: videoItem.snippet.title,
      currentTitle: videoItem.snippet.title,
      channelTitle: videoItem.snippet.channelTitle,
      comments: [],
      actionHistory: [],
    });
  }

  return video;
}

export async function POST(request) {
  try {
    const { videoId, text, username = "Default" } = await request.json();

    if (!videoId || !text) {
      return NextResponse.json(
        { message: "Video ID and comment text are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // check if video exists
    const video = await ensureVideoExists(videoId);

    // Create new comment with an ObjectId
    const newComment = {
      _id: new mongoose.Types.ObjectId(),
      text,
      username,
      timestamp: new Date(),
    };

    video.comments.push(newComment);

    video.actionHistory.push({
      type: "COMMENT_ADD",
      data: { commentId: newComment._id, text },
      timestamp: new Date(),
    });

    await video.save();

    // Convert _id to string to ensure consistency
    const commentToReturn = {
      ...newComment,
      _id: newComment._id.toString(),
    };

    return NextResponse.json({
      success: true,
      comment: commentToReturn,
      actionHistory: video.actionHistory,
    });
  } catch (error) {
    console.error("Comment add error:", error);
    return NextResponse.json(
      { message: "Error adding comment", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("videoId");
    const commentId = searchParams.get("commentId");

    if (!videoId || !commentId) {
      return NextResponse.json(
        { message: "Video ID and comment ID are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    let video;
    try {
      video = await ensureVideoExists(videoId);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 404 }
      );
    }

    // Find the comment
    let comment;
    try {
      const objectId = mongoose.Types.ObjectId.isValid(commentId)
        ? new mongoose.Types.ObjectId(commentId)
        : commentId;

      comment = video.comments.id(objectId);
    } catch (error) {
      console.error("Comment ID conversion error:", error);
      comment = video.comments.find((c) => c._id.toString() === commentId);
    }

    if (!comment) {
      return NextResponse.json(
        { message: "Comment not found", commentId },
        { status: 404 }
      );
    }

    // Store comment data for history
    const commentData = {
      id: commentId,
      text: comment.text,
      username: comment.username,
    };

    video.comments.pull(commentId);

    video.actionHistory.push({
      type: "COMMENT_DELETE",
      data: commentData,
      timestamp: new Date(),
    });

    await video.save();

    return NextResponse.json({
      success: true,
      message: "Comment deleted successfully",
      actionHistory: video.actionHistory,
    });
  } catch (error) {
    console.error("Comment delete error:", error);
    return NextResponse.json(
      { message: "Error deleting comment", error: error.message },
      { status: 500 }
    );
  }
}
