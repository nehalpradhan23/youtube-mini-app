"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export default function YoutubeVideo() {
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Hardcoded YouTube video URL - replace with your desired video
  const hardcodedVideoUrl = "https://youtu.be/KcpoJOME0fA";

  const extractVideoId = (url) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  useEffect(() => {
    const fetchVideoData = async () => {
      setLoading(true);
      setError("");

      const videoId = extractVideoId(hardcodedVideoUrl);

      if (!videoId) {
        setError("Invalid YouTube URL");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get("/api/youtube", {
          params: { videoId },
        });
        setVideoData(response.data);
      } catch (err) {
        setError(
          "Error fetching video data: " +
            (err.response?.data?.message || err.message)
        );
      } finally {
        setLoading(false);
      }
    };

    fetchVideoData();
  }, []);

  return (
    <div className="text-black">
      <main className="mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          YouTube Video Info
        </h1>

        {loading && (
          <div className="max-w-4xl mx-auto p-6 rounded-lg shadow-md">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-center mt-4">Loading video data...</p>
          </div>
        )}

        {error && (
          <div className="max-w-4xl mx-auto p-6 bg-red-100 text-red-700 rounded-lg shadow-md">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {videoData && (
          <div className="max-w-4xl h-[700px] flex flex-col mx-auto rounded-lg shadow-md overflow-hidden border">
            <div className="h-full flex flex-1">
              <iframe
                src={`https://www.youtube.com/embed/${videoData.id}`}
                title={videoData.title}
                className="w-full h-full"
                allowFullScreen
              ></iframe>
            </div>

            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">{videoData.title}</h2>

              <div className="flex items-center mb-4">
                <img
                  src={videoData.channelThumbnail}
                  alt={videoData.channelTitle}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <span className="font-medium">{videoData.channelTitle}</span>
              </div>

              <div className="flex gap-4 text-sm  mb-4">
                <div>{videoData.viewCount.toLocaleString()} views</div>
                <div>
                  {new Date(videoData.publishedAt).toLocaleDateString()}
                </div>
                <div>{videoData.likeCount.toLocaleString()} likes</div>
              </div>

              <div className="mt-4 p-4 rounded">
                <h3 className="font-semibold mb-2">Description:</h3>
                <p className="text-gray-700 whitespace-pre-line">
                  {videoData.description}
                </p>
              </div>

              {videoData.tags && videoData.tags.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Tags:</h3>
                  <div className="flex flex-wrap gap-2">
                    {videoData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-gray-200 px-2 py-1 rounded text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
