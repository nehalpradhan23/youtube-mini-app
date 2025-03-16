import mongoose from "mongoose";

const ActionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["TITLE_CHANGE", "COMMENT_ADD", "COMMENT_DELETE"],
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
  user: { type: String, default: "Default" },
  data: { type: mongoose.Schema.Types.Mixed },
});

const CommentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  username: { type: String, default: "Default" },
  timestamp: { type: Date, default: Date.now },
});

const VideoSchema = new mongoose.Schema({
  videoId: { type: String, required: true, unique: true },
  originalTitle: { type: String, required: true },
  currentTitle: { type: String, required: true },
  comments: [CommentSchema],
  actionHistory: [ActionSchema],
  channelTitle: String,
  viewCount: Number,
});

export default mongoose.models.Video || mongoose.model("Video", VideoSchema);
