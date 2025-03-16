// app/page.js
"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export default function YoutubeVideo2() {
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");

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
        setEditedTitle(response.data.title);
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

    // Load comments from localStorage if available
    const savedComments = localStorage.getItem("youtubeVideoComments");
    if (savedComments) {
      setComments(JSON.parse(savedComments));
    }
  }, []);

  // Save comments to localStorage whenever they change
  useEffect(() => {
    if (comments.length > 0) {
      localStorage.setItem("youtubeVideoComments", JSON.stringify(comments));
    }
  }, [comments]);

  const handleAddComment = () => {
    if (newComment.trim() === "") return;

    const comment = {
      id: Date.now(),
      text: newComment,
      timestamp: new Date().toISOString(),
      username: "You", // In a real app, this would be the logged-in user
    };

    setComments([...comments, comment]);
    setNewComment("");
  };

  const handleDeleteComment = (commentId) => {
    setComments(comments.filter((comment) => comment.id !== commentId));

    // Update localStorage after deletion
    const updatedComments = comments.filter(
      (comment) => comment.id !== commentId
    );
    if (updatedComments.length > 0) {
      localStorage.setItem(
        "youtubeVideoComments",
        JSON.stringify(updatedComments)
      );
    } else {
      localStorage.removeItem("youtubeVideoComments");
    }
  };

  const handleSaveTitle = () => {
    if (editedTitle.trim() === "") return;

    setVideoData({
      ...videoData,
      title: editedTitle,
    });

    setIsEditingTitle(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          YouTube Video Info
        </h1>

        {loading && (
          <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
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
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            <div className="aspect-w-16 aspect-h-9">
              <iframe
                src={`https://www.youtube.com/embed/${videoData.id}`}
                title={videoData.title}
                className="w-full h-full"
                allowFullScreen
              ></iframe>
            </div>

            <div className="p-6">
              {isEditingTitle ? (
                <div className="mb-4">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={handleSaveTitle}
                      className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingTitle(false);
                        setEditedTitle(videoData.title);
                      }}
                      className="bg-gray-300 text-gray-700 px-4 py-1 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-2xl font-bold">{videoData.title}</h2>
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit Title
                  </button>
                </div>
              )}

              <div className="flex items-center mb-4">
                <img
                  src={videoData.channelThumbnail}
                  alt={videoData.channelTitle}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <span className="font-medium">{videoData.channelTitle}</span>
              </div>

              <div className="flex gap-4 text-sm text-gray-600 mb-4">
                <div>{videoData.viewCount.toLocaleString()} views</div>
                <div>
                  {new Date(videoData.publishedAt).toLocaleDateString()}
                </div>
                <div>{videoData.likeCount.toLocaleString()} likes</div>
              </div>

              <div className="mt-4 bg-gray-50 p-4 rounded">
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

              {/* Comments Section */}
              <div className="mt-8 border-t pt-6">
                <h3 className="text-xl font-bold mb-4">Comments</h3>

                <div className="mb-6">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  ></textarea>
                  <button
                    onClick={handleAddComment}
                    disabled={newComment.trim() === ""}
                    className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    Comment
                  </button>
                </div>

                {comments.length === 0 ? (
                  <p className="text-gray-500 italic">
                    No comments yet. Be the first to comment!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="border-b pb-4">
                        <div className="flex justify-between">
                          <span className="font-semibold">
                            {comment.username}
                          </span>
                          <span className="text-gray-500 text-sm">
                            {new Date(comment.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="my-2">{comment.text}</p>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-red-600 text-sm hover:text-red-800"
                        >
                          Delete comment
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
