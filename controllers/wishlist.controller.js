
import User from "../models/user.models.js";
import Product from "../models/product.models.js";

// Add product to wishlist
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.userId;

    if (!productId) {
      return res.json({ success: false, message: "Product ID is required" });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }

    // Find user and update wishlist
    const user = await User.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Check if product is already in wishlist
    if (user.wishlist && user.wishlist.includes(productId)) {
      return res.json({ success: false, message: "Product already in wishlist" });
    }

    // Add to wishlist
    if (!user.wishlist) {
      user.wishlist = [];
    }
    user.wishlist.push(productId);
    await user.save();

    return res.json({ success: true, message: "Product added to wishlist" });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Remove product from wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.userId;

    if (!productId) {
      return res.json({ success: false, message: "Product ID is required" });
    }

    // Find user and update wishlist
    const user = await User.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Remove from wishlist
    if (user.wishlist) {
      user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
      await user.save();
    }

    return res.json({ success: true, message: "Product removed from wishlist" });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get user's wishlist
export const getWishlist = async (req, res) => {
  try {
    const userId = req.userId;

    // Find user and populate wishlist with product details including images
    const user = await User.findById(userId).populate({
      path: 'wishlist',
      model: 'Product',
      select: 'name description price images stock createdBy'
    });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    return res.json({ 
      success: true, 
      wishlist: user.wishlist || [],
      message: "Wishlist fetched successfully"
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Check if product is in wishlist
export const checkWishlistStatus = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const isInWishlist = user.wishlist && user.wishlist.includes(productId);

    return res.json({ 
      success: true, 
      isInWishlist,
      message: "Wishlist status checked"
    });
  } catch (error) {
    console.error("Error checking wishlist status:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
