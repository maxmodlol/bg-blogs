const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const User = require("../models/User");
const { successResponse, errorResponse } = require("../helpers/response");
const auth = require("../middleware/auth");

const router = express.Router();

router.post(
  "/register",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").isLength({ min: 6 }),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, errors.array(), 400);
    }

    const { name, email, password } = req.body;

    try {
      let user = await User.findOne({ email });
      if (user) {
        return errorResponse(res, "User with this email already exists", 400);
      }

      user = new User({
        name,
        email,
        password,
      });

      await user.save();

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
        (err, token) => {
          if (err) throw err;
          return successResponse(
            res,
            { token },
            "User registered successfully"
          );
        }
      );
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, errors.array(), 400);
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });
      if (!user) {
        return errorResponse(res, "Invalid credentials", 400);
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return errorResponse(res, "Invalid credentials", 400);
      }

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
        (err, token) => {
          if (err) throw err;
          return successResponse(res, { token }, "User logged in successfully");
        }
      );
    } catch (err) {
      next(err);
    }
  }
);
router.get("/profile", auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }
    return successResponse(res, user);
  } catch (err) {
    next(err);
  }
});

router.put(
  "/profile",
  [
    auth,
    [
      check("email", "Please include a valid email").isEmail(),
      check("name", "Name is required").not().isEmpty(),
    ],
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, errors.array(), 400);
    }

    const { name, email, password } = req.body;

    const profileFields = {};
    if (name) profileFields.name = name;
    if (email) profileFields.email = email;

    try {
      let user = await User.findById(req.user.id);

      if (!user) {
        return errorResponse(res, "User not found", 404);
      }

      if (email && email !== user.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
          return errorResponse(res, "Email already in use", 400);
        }
        profileFields.email = email;
      }

      if (password) {
        const salt = await bcrypt.genSalt(10);
        profileFields.password = await bcrypt.hash(password, salt);
      }

      user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: profileFields },
        { new: true }
      ).select("-password");

      return successResponse(res, user, "Profile updated successfully");
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
