import bcrypt, { hash } from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.models.js";

import dotenv from "dotenv";
import transporter from "../config/nodemailer.js";
import Product from "../models/product.models.js";

dotenv.config();

export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.json({ success: false, message: "Please fill all the fields" });
  }

  // console.log(email)

  try {
    const existedUser = await User.findOne({ email });

    if (existedUser) {
      return res.json({ message: "User is already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await new User({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
    });

    if (role === "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Cannot assign admin role" });
    }
    console.log(password);

    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 1 * 24 * 60 * 60 * 1000,
    });

    // Sending welcome email
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: "Welcome to our website",
      text: `Welcome to our website. Your account has been created with email id: ${email}`,
    };
    await transporter.sendMail(mailOptions);
    // console.log(value)

    return res.json({ success: true, message: "User Registered Successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({
      success: false,
      message: "Email and Password is required",
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "Invalid Credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid Credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: true, // Always true for HTTPS
        sameSite: "none", // Required for cross-origin cookies
        maxAge: 1 * 24 * 60 * 60 * 1000,
      })
      .json({
        success: true,
        message: "Login Success",
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          name: user.name,
          isVerified: user.isVerified,
        },
      });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const sellerDashboard = async (req, res) => {
  try {
    const sellerId = req.userId;

    // Fetch products created by the seller
    const products = await Product.find({ createdBy: sellerId });

    res.json({
      success: true,
      message: "Seller dashboard data fetched",
      seller: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
      products,
    });
  } catch (error) {
    console.error("Error in sellerDashboard:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const logoutUser = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });

    return res.json({ success: true, message: "Logout Success" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const sendVerifyOtp = async (req, res) => {
  try {
    // const {userId} = req.body;
    const userId = req.userId;
    console.log(req.body);

    const user = await User.findById(userId);
    if (!user) {
      return res.json({ message: "userid not found" });
    }

    if (user.isVerified) {
      return res.json({ success: false, message: "User is already Verified" });
    }

    console.log(user.verifyOTP);

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    user.verifyOTP = otp;

    user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

    await user.save();

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: user.email,
      subject: "Account Verification OTP is",
      text: `Your OTP is ${otp}. Use this otp to verify your Account`,
    };

    await transporter.sendMail(mailOptions);

    return res.json({ message: "Verification OTP sent on Email" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  const { otp } = req.body;
  const userId = req.userId;

  if (!userId || !otp) {
    return res.json({ success: false, message: "Missing Details" });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.json({ success: false, message: "User is not Found" });
    }

    if (user.verifyOTP === "" || user.verifyOTP !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    if (user.verifyOtpExpireAt < Date.now()) {
      return res.json({ success: false, message: "OTP is expired" });
    }

    (user.isVerified = true),
      (user.verifyOTP = ""),
      (user.verifyOtpExpireAt = 0),
      await user.save();

    return res.json({ success: true, message: "Email Verified Successfully" });
  } catch (error) {
    return res.json({ success: false, message: "Email is not Verified" });
  }
};

// check if user is auhtenticated or not
export const isAuthenticated = async (req, res) => {
  try {
    return res.json({ success: true });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Send password reset OTP
export const resetPasswordOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.json({ success: false, message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User Not Found" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    user.resetOtp = otp;
    user.resetOtpExpiryTime = Date.now() + 15 * 60 * 1000;

    await user.save();

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: user.email,
      subject: "Password reset OTP is",
      text: `Your OTP for resetting your password is ${otp}. Use this otp to procees d with esetting your password`,
    };

    await transporter.sendMail(mailOptions);

    return res.json({
      success: true,
      message: "OTP sent to your email successfully",
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// reset user password

export const resetUserPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.json({
      success: false,
      message: "Email,OTP,Password and newPassword is required",
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User is not found" });
    }

    if (user.resetOtp === "" || user.resetOtp !== otp) {
      return res.json({ success: false, message: "OTP invalid" });
    }

    if (user.resetOtpExpiryTime < Date.now()) {
      return res.json({ success: false, message: "OTP is expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetOtp = "";
    user.resetOtpExpiryTime = 0;

    await user.save();

    return res.json({
      success: true,
      message: "Password is reset Successfully",
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
