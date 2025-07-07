const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const commentSchema = new Schema(
  {
    rating: {
      type: Number,
      min: 1,
      max: 3,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
  },
  { timestamps: true }
);

const Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;
