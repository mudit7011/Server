import Cart from "../models/cart.models.js";
import Product from "../models/product.models.js";

export const addToCart = async (req, res) => {
  const { productId, quantity } = req.body;
  console.log('Received data:', req.body);
  const userId = req.userId;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (product.stock < quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Not enough stock" });
    }
    let cart = await Cart.findOne({ user: userId }).populate("items.product");


    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const productIndex = cart.items.findIndex(
      (item) => item.product._id.toString() === productId
    );

    if (productIndex > -1) {
      // Product exists, update the quantity
      cart.items[productIndex].quantity = quantity; // Replace with new quantity
    } else {
      // Add as new item
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    const updatedCart = await Cart.findById(cart._id).populate("items.product");
    res.json({ success: true, message: "Product added to cart", cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId }).populate(
      "items.product"
    );
    if (!cart) return res.json({ success: true, cart: { items: [] } });

    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const removeFromCart = async (req, res) => {
  const { productId } = req.body; // Changed from req.body to req.query

  try {
    if (!productId) {
      return res
        .status(400)
        .json({ success: false, message: "Product ID is required" });
    }

    const cart = await Cart.findOne({ user: req.userId });
    if (!cart)
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });

    const itemExists = cart.items.some(
      (item) => item.product.toString() === productId
    );
    if (!itemExists) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Product is already removed from the cart",
        });
    }
    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    await cart.save();

    res.json({ success: true, message: "Product removed from cart", cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateCartQuantity = async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId || quantity < 1) {
    return res.status(400).json({ success: false, message: "Invalid input" });
  }

  try {
    const cart = await Cart.findOne({ user: req.userId });

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    const item = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not in cart" });
    }

    item.quantity = quantity;
    await cart.save();

    res.json({ success: true, message: "Quantity updated" });
  } catch (err) {
    console.error("Error updating quantity:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
