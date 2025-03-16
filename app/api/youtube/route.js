import { NextResponse } from "next/server";
import axios from "axios";
import connectToDatabase from "@/utils/mongodb";
import Video from "@/models/Video";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return NextResponse.json(
      { message: "Video ID is required" },
      { status: 400 }
    );
  }

  try {
    const API_KEY = process.env.YOUTUBE_API_KEY;

    if (!API_KEY) {
      return NextResponse.json(
        { message: "YouTube API key is not configured" },
        { status: 500 }
      );
    }

    const videoResponse = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos`,
      {
        params: {
          part: "snippet,statistics,contentDetails",
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
    const channelId = videoItem.snippet.channelId;

    const channelResponse = await axios.get(
      `https://www.googleapis.com/youtube/v3/channels`,
      {
        params: {
          part: "snippet",
          id: channelId,
          key: API_KEY,
        },
      }
    );

    const channelItem = channelResponse.data.items[0];

    const videoFromYouTube = {
      id: videoId,
      title: videoItem.snippet.title,
      description: videoItem.snippet.description,
      publishedAt: videoItem.snippet.publishedAt,
      thumbnails: videoItem.snippet.thumbnails,
      channelId: channelId,
      channelTitle: videoItem.snippet.channelTitle,
      channelThumbnail: channelItem.snippet.thumbnails.default.url,
      viewCount: parseInt(videoItem.statistics.viewCount || 0),
      likeCount: parseInt(videoItem.statistics.likeCount || 0),
      commentCount: parseInt(videoItem.statistics.commentCount || 0),
      duration: videoItem.contentDetails.duration,
      tags: videoItem.snippet.tags || [],
    };

    await connectToDatabase();

    let storedVideo = await Video.findOne({ videoId });

    if (!storedVideo) {
      storedVideo = await Video.create({
        videoId,
        originalTitle: videoFromYouTube.title,
        currentTitle: videoFromYouTube.title,
        channelTitle: videoFromYouTube.channelTitle,
        viewCount: videoFromYouTube.viewCount,
        comments: [],
        actionHistory: [],
      });
    }

    const responseData = {
      ...videoFromYouTube,
      title: storedVideo.currentTitle,
      comments: storedVideo.comments,
      actionHistory: storedVideo.actionHistory,
      originalTitle: storedVideo.originalTitle,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("API Error:", error.response?.data || error.message);
    return NextResponse.json(
      {
        message: "Error fetching data",
        error: error.response?.data?.error?.message || error.message,
      },
      { status: 500 }
    );
  }
}
