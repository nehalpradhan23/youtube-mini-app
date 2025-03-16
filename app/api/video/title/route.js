import { NextResponse } from "next/server";
import connectToDatabase from "@/utils/mongodb";
import Video from "@/models/Video";
import axios from "axios";

export async function PUT(request) {
  try {
    const { videoId, newTitle } = await request.json();

    if (!videoId || !newTitle) {
      return NextResponse.json(
        { message: "Video ID and new title are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    let video = await Video.findOne({ videoId });

    // If video is not found in our database, fetch from YouTube and create it
    if (!video) {
      const API_KEY = process.env.YOUTUBE_API_KEY;
      if (!API_KEY) {
        return NextResponse.json(
          { message: "YouTube API key is not configured" },
          { status: 500 }
        );
      }

      // Get video details from YouTube API
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
        return NextResponse.json(
          { message: "Video not found on YouTube" },
          { status: 404 }
        );
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

    video.actionHistory.push({
      type: "TITLE_CHANGE",
      data: {
        previousTitle: video.currentTitle,
        newTitle,
      },
    });

    // Update the title
    video.currentTitle = newTitle;
    await video.save();

    return NextResponse.json({
      success: true,
      message: "Title updated successfully",
      currentTitle: newTitle,
      actionHistory: video.actionHistory,
    });
  } catch (error) {
    console.error("Title update error:", error);
    return NextResponse.json(
      { message: "Error updating title", error: error.message },
      { status: 500 }
    );
  }
}
