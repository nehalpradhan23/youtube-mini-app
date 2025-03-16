// First, let's set up our MongoDB schema (in a file like models/Video.js)
import mongoose from "mongoose";

const ActionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["TITLE_CHANGE", "COMMENT_ADD", "COMMENT_DELETE"],
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
  user: { type: String, default: "Anonymous" }, // In a real app, use user IDs
  data: { type: mongoose.Schema.Types.Mixed }, // Store relevant data like previous/new title or comment details
});

const CommentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  username: { type: String, default: "Anonymous" },
  timestamp: { type: Date, default: Date.now },
});

const VideoSchema = new mongoose.Schema({
  videoId: { type: String, required: true, unique: true },
  originalTitle: { type: String, required: true }, // The original YouTube title
  currentTitle: { type: String, required: true }, // The current title (after edits)
  comments: [CommentSchema],
  actionHistory: [ActionSchema],
  // You can store other video data here as well
  channelTitle: String,
  viewCount: Number,
  // etc.
});

export default mongoose.models.Video || mongoose.model("Video", VideoSchema);
