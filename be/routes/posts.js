const express = require("express");
const { check, validationResult } = require("express-validator");
const auth = require("../middleware/auth");
const Post = require("../models/Post");
const User = require("../models/User");
const { successResponse, errorResponse } = require("../helpers/response");
const router = express.Router();

// @route   POST /api/posts
// @desc    Create a post
// @access  Private
router.post(
  "/",
  [
    auth,
    [
      check("title", "Title is required").not().isEmpty(),
      check("content", "Content is required").not().isEmpty(),
    ],
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, errors.array(), 400);
    }

    try {
      const user = await User.findById(req.user.id).select("-password");

      const newPost = new Post({
        title: req.body.title,
        content: req.body.content,
        user: req.user.id,
      });

      const post = await newPost.save();

      return successResponse(res, post, "Post created successfully");
    } catch (err) {
      next(err);
    }
  }
);

// @route   GET /api/posts
// @desc    Get all posts
// @access  Public
router.get("/", async (req, res, next) => {
  try {
    const posts = await Post.find()
      .populate("user", ["name"])
      .sort({ date: -1 });

    if (posts.length === 0) {
      return successResponse(res, [], "No posts found");
    }

    return successResponse(res, posts, "Posts fetched successfully");
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/posts/:id
// @desc    Get post by ID
// @access  Public
router.get("/:id", async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate("user", ["name"]);

    if (!post) {
      return errorResponse(res, "Post not found", 404);
    }

    return successResponse(res, post, "Post fetched successfully");
  } catch (err) {
    if (err.kind === "ObjectId") {
      return errorResponse(res, "Post not found", 404);
    }
    next(err);
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete("/:id", auth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return errorResponse(res, "Post not found", 404);
    }

    if (post.user.toString() !== req.user.id) {
      return errorResponse(res, "User not authorized", 401);
    }

    await post.deleteOne();

    return successResponse(res, {}, "Post removed successfully");
  } catch (err) {
    if (err.kind === "ObjectId") {
      return errorResponse(res, "Post not found", 404);
    }
    next(err);
  }
});

// @route   POST /api/posts/comment/:id
// @desc    Comment on a post
// @access  Private
router.post(
  "/comment/:id",
  [auth, [check("content", "Content is required").not().isEmpty()]],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, errors.array(), 400);
    }

    try {
      const post = await Post.findById(req.params.id);

      if (!post) {
        return errorResponse(res, "Post not found", 404);
      }

      const newComment = {
        content: req.body.content,
        user: req.user.id,
      };

      post.comments.unshift(newComment);

      await post.save();

      return successResponse(res, post.comments, "Comment added successfully");
    } catch (err) {
      next(err);
    }
  }
);

// @route   POST /api/posts/comment/reply/:postId/:commentId
// @desc    Reply to a comment
// @access  Private
router.post(
  "/comment/reply/:postId/:commentId",
  [auth, [check("content", "Content is required").not().isEmpty()]],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, errors.array(), 400);
    }

    try {
      const post = await Post.findById(req.params.postId);

      if (!post) {
        return errorResponse(res, "Post not found", 404);
      }

      const comment = post.comments.find(
        (comment) => comment.id === req.params.commentId
      );

      if (!comment) {
        return errorResponse(res, "Comment not found", 404);
      }

      const newReply = {
        content: req.body.content,
        user: req.user.id,
      };

      comment.replies.unshift(newReply);

      await post.save();

      return successResponse(res, comment.replies, "Reply added successfully");
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
