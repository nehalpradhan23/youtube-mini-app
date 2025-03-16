"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export default function YoutubeVideo3() {
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [actionHistory, setActionHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const hardcodedVideoUrl = "https://youtu.be/KcpoJOME0fA";

  const extractVideoId = (url) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

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
      setEditedTitle(response.data.currentTitle || response.data.title);
      setComments(response.data.comments || []);
      setActionHistory(response.data.actionHistory || []);
    } catch (err) {
      setError(
        "Error fetching video data: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideoData();
  }, []);

  const handleAddComment = async () => {
    if (newComment.trim() === "") return;

    try {
      const response = await axios.post("/api/video/comment", {
        videoId: videoData.id,
        text: newComment,
        username: "User",
      });

      console.log("New comment from server:", response.data.comment);
      console.log("Comment ID type:", typeof response.data.comment._id);

      const newCommentWithId = {
        ...response.data.comment,
        _id: response.data.comment._id,
      };

      setComments((prev) => [...prev, newCommentWithId]);
      setActionHistory(response.data.actionHistory);
      setNewComment("");
    } catch (err) {
      setError(
        "Error adding comment: " + (err.response?.data?.message || err.message)
      );
    }
  };

  const handleDeleteComment = async (commentId) => {
    console.log("Deleting comment with ID:", commentId);

    try {
      const response = await axios.delete(`/api/video/comment`, {
        params: {
          videoId: videoData.id,
          commentId,
        },
      });

      setComments(comments.filter((comment) => comment._id !== commentId));
      setActionHistory(response.data.actionHistory);
    } catch (err) {
      setError(
        "Error deleting comment: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const handleSaveTitle = async () => {
    if (editedTitle.trim() === "") return;

    try {
      const response = await axios.put("/api/video/title", {
        videoId: videoData.id,
        newTitle: editedTitle,
      });

      // Update local state
      setVideoData({
        ...videoData,
        title: editedTitle,
      });
      setActionHistory(response.data.actionHistory);
      setIsEditingTitle(false);
    } catch (err) {
      setError(
        "Error updating title: " + (err.response?.data?.message || err.message)
      );
    }
  };

  const formatActionHistoryItem = (action) => {
    const date = new Date(action.timestamp).toLocaleString();

    switch (action.type) {
      case "TITLE_CHANGE":
        return `${date}: Title changed from "${action.data.previousTitle}" to "${action.data.newTitle}"`;
      case "COMMENT_ADD":
        return `${date}: Comment added: "${action.data.text}"`;
      case "COMMENT_DELETE":
        return `${date}: Comment deleted: "${action.data.text}" by ${action.data.username}`;
      default:
        return `${date}: ${action.type} action performed`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          YouTube Mini App - cactro fullstack test 16/03/25
        </h1>

        {loading && (
          <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-center mt-4 text-2xl font-bold">
              Loading video data...
            </p>
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
            <div className="h-[500px]">
              <iframe
                src={`https://www.youtube.com/embed/${videoData.id}`}
                title={videoData.title}
                className="w-full h-full"
                allowFullScreen
              ></iframe>
            </div>

            <div className="p-6">
              {isEditingTitle ? (
                <div className="mb-10 flex items-center gap-4">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2 items-center justify-center">
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
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h2 className="text-2xl font-bold">{videoData.title}</h2>
                    {/* {videoData.originalTitle !== videoData.title && (
                      <p className="text-lg text-gray-600">
                        Original title: {videoData.originalTitle}
                      </p>
                    )} */}
                  </div>
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="text-blue-600 hover:text-blue-800 text-xl"
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

              {/* <div className="mt-4 bg-gray-50 p-4 rounded">
                <h3 className="font-semibold mb-2">Description:</h3>
                <p className="text-gray-700 whitespace-pre-line">
                  {videoData.description}
                </p>
              </div> */}

              {/* {videoData.tags && videoData.tags.length > 0 && (
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
              )} */}

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
                    {comments.map((comment, index) => (
                      <div key={index} className="border-b pb-4">
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
                          onClick={() => handleDeleteComment(comment._id)}
                          className="text-red-600 text-sm hover:text-red-800"
                        >
                          Delete comment
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action History Section */}
              <div className="mt-8 border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Action History</h3>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
                  >
                    {showHistory ? "Hide History" : "Show History"}
                  </button>
                </div>

                {showHistory && (
                  <div className="mb-6 bg-gray-50 p-4 rounded max-h-60 overflow-y-auto">
                    {actionHistory.length === 0 ? (
                      <p className="text-gray-500 italic">
                        No actions recorded yet.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {actionHistory.map((action, index) => (
                          <li key={index} className="border-b pb-2">
                            {formatActionHistoryItem(action)}
                          </li>
                        ))}
                      </ul>
                    )}
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
