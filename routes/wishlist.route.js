import express from "express";
import authUser from "../middleware/userAuth.js";
import { addToWishlist, checkWishlistStatus, getWishlist, removeFromWishlist } from "../controllers/wishlist.controller.js";

export const wishlistRouter = express.Router();

wishlistRouter.post("/add-wishlist", authUser, addToWishlist);
wishlistRouter.get("/get-wishlist", authUser, getWishlist);
wishlistRouter.post("/check-status", authUser, checkWishlistStatus);
wishlistRouter.post("/remove-item", authUser, removeFromWishlist);