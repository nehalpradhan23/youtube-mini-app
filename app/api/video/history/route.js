import { NextResponse } from "next/server";
import connectToDatabase from "@/utils/mongodb";
import Video from "@/models/Video";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("videoId");

    if (!videoId) {
      return NextResponse.json(
        { message: "Video ID is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const video = await Video.findOne({ videoId });

    if (!video) {
      return NextResponse.json({ message: "Video not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      actionHistory: video.actionHistory,
    });
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json(
      { message: "Error fetching action history", error: error.message },
      { status: 500 }
    );
  }
}
