// // app/api/video/comment/route.js
// import { NextResponse } from "next/server";
// import connectToDatabase from "@/utils/mongodb";
// import Video from "@/models/Video";

// export async function POST(request) {
//   try {
//     const { videoId, text, username = "Anonymous" } = await request.json();

//     if (!videoId || !text) {
//       return NextResponse.json(
//         { message: "Video ID and comment text are required" },
//         { status: 400 }
//       );
//     }

//     await connectToDatabase();
//     const video = await Video.findOne({ videoId });

//     if (!video) {
//       return NextResponse.json({ message: "Video not found" }, { status: 404 });
//     }

//     // Create new comment
//     const newComment = {
//       text,
//       username,
//       timestamp: new Date(),
//     };

//     // Add comment to the video
//     video.comments.push(newComment);

//     // Record the action
//     video.actionHistory.push({
//       type: "COMMENT_ADD",
//       data: { commentId: newComment._id, text },
//     });

//     await video.save();

//     return NextResponse.json({
//       success: true,
//       comment: newComment,
//       actionHistory: video.actionHistory,
//     });
//   } catch (error) {
//     console.error("Comment add error:", error);
//     return NextResponse.json(
//       { message: "Error adding comment", error: error.message },
//       { status: 500 }
//     );
//   }
// }

// export async function DELETE(request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const videoId = searchParams.get("videoId");
//     const commentId = searchParams.get("commentId");

//     if (!videoId || !commentId) {
//       return NextResponse.json(
//         { message: "Video ID and comment ID are required" },
//         { status: 400 }
//       );
//     }

//     await connectToDatabase();
//     const video = await Video.findOne({ videoId });

//     if (!video) {
//       return NextResponse.json({ message: "Video not found" }, { status: 404 });
//     }

//     // Find the comment
//     const comment = video.comments.id(commentId);

//     if (!comment) {
//       return NextResponse.json(
//         { message: "Comment not found" },
//         { status: 404 }
//       );
//     }

//     // Store comment data for history
//     const commentData = {
//       id: commentId,
//       text: comment.text,
//       username: comment.username,
//     };

//     // Remove the comment
//     video.comments.pull(commentId);

//     // Record the action
//     video.actionHistory.push({
//       type: "COMMENT_DELETE",
//       data: commentData,
//     });

//     await video.save();

//     return NextResponse.json({
//       success: true,
//       message: "Comment deleted successfully",
//       actionHistory: video.actionHistory,
//     });
//   } catch (error) {
//     console.error("Comment delete error:", error);
//     return NextResponse.json(
//       { message: "Error deleting comment", error: error.message },
//       { status: 500 }
//     );
//   }
// }

// app/api/video/comment/route.js
import { NextResponse } from "next/server";
import connectToDatabase from "@/utils/mongodb";
import Video from "@/models/Video";
import axios from "axios";

// Helper function to ensure video exists
async function ensureVideoExists(videoId) {
  let video = await Video.findOne({ videoId });

  if (!video) {
    const API_KEY = process.env.YOUTUBE_API_KEY;
    if (!API_KEY) {
      throw new Error("YouTube API key is not configured");
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
      throw new Error("Video not found on YouTube");
    }

    const videoItem = videoResponse.data.items[0];

    // Create new video document
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
    const { videoId, text, username = "Anonymous" } = await request.json();

    if (!videoId || !text) {
      return NextResponse.json(
        { message: "Video ID and comment text are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Ensure video exists in our database
    const video = await ensureVideoExists(videoId);

    // Create new comment
    const newComment = {
      text,
      username,
      timestamp: new Date(),
    };

    // Add comment to the video
    video.comments.push(newComment);

    // Record the action
    video.actionHistory.push({
      type: "COMMENT_ADD",
      data: { commentId: newComment._id, text },
    });

    await video.save();

    return NextResponse.json({
      success: true,
      comment: newComment,
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

    // Ensure video exists in our database
    let video;
    try {
      video = await ensureVideoExists(videoId);
    } catch (error) {
      // If the video doesn't exist, then there's no comment to delete
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 404 }
      );
    }

    // Find the comment
    const comment = video.comments.id(commentId);

    if (!comment) {
      return NextResponse.json(
        { message: "Comment not found" },
        { status: 404 }
      );
    }

    // Store comment data for history
    const commentData = {
      id: commentId,
      text: comment.text,
      username: comment.username,
    };

    // Remove the comment
    video.comments.pull(commentId);

    // Record the action
    video.actionHistory.push({
      type: "COMMENT_DELETE",
      data: commentData,
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
