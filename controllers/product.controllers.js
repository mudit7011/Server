import Product from "../models/product.models.js";
import cloudinary from "../config/cloudinaryConfig.js";

export const addProduct = async (req, res) => {
  try {
    // Get all fields
    const { name, price, description, category, stock, imageUrl } = req.body;
    const userId = req.userId;

    // Check required fields
    if (!name || !price || !description || !category || stock === undefined) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    let productImage = null;

    // Case 1: Local file upload
    if (req.file) {
      // Upload the file to Cloudinary
      const uploadResult = await cloudinary.v2.uploader.upload(req.file.path);
      productImage = uploadResult.secure_url;
      // Optionally: delete the local file after upload (fs.unlinkSync)
    } 
    // Case 2: Provided image URL
    else if (imageUrl && imageUrl.trim() !== '') {
      try {
        // Let Cloudinary fetch and store it
        const uploadResult = await cloudinary.v2.uploader.upload(imageUrl);
        productImage = uploadResult.secure_url;
      } catch (err) {
        return res.status(400).json({ success: false, message: "Invalid image URL or failed to upload image" });
      }
    } 
    // Case 3: Neither
    else {
      return res.status(400).json({ success: false, message: "Please provide an image file or image URL" });
    }

    // Save new product - POPULATE BOTH image AND images fields
    const productData = {
      name: name.trim(),
      price: Number(price),
      description: description.trim(),
      category: category.trim(),
      stock: Number(stock),
      image: productImage, // Keep for backward compatibility
      images: [{ url: productImage }], // Add to images array for frontend
      createdBy: userId,
    };

    const newProduct = new Product(productData);
    const savedProduct = await newProduct.save();

    res.json({
      success: true,
      message: "Product added successfully",
      product: savedProduct,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to add product",
      error: error.message,
    });
  }
};


export const getProducts = async (req, res) => {
  try {
    console.log("=== GET PRODUCTS API DEBUG ===");

    const products = await Product.find({ isActive: true })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for better performance and to avoid Mongoose document overhead

    console.log(
      "Raw products from database:",
      JSON.stringify(products, null, 2)
    );

    // Log each product's image field specifically
    products.forEach((product, index) => {
      console.log(`=== DATABASE PRODUCT ${index + 1}: ${product.name} ===`);
      console.log("product._id:", product._id);
      console.log("product.image from DB:", product.image);
      console.log("product.images from DB:", product.images);
      console.log("typeof product.image:", typeof product.image);
      console.log("=== END DB PRODUCT DEBUG ===");
    });

    // Ensure the image field is properly serialized in the response
    const serializedProducts = products.map((product) => ({
      ...product,
      image: product.image || null, // Explicitly ensure image field exists
    }));

    console.log(
      "Serialized products being sent:",
      JSON.stringify(serializedProducts, null, 2)
    );

    res.json({
      success: true,
      products: serializedProducts,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate(
      "createdBy",
      "name email"
    );

    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({}).select(
      "name description price category stock images"
    );
    return res.json({ success: true, products });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, category, imageUrl } = req.body;
    const userId = req.userId;

    // Find the product by its ID
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Check if user owns this product (if you have authorization)
    // if (product.createdBy.toString() !== userId) {
    //   return res.status(403).json({ success: false, message: "Not authorized to edit this product" });
    // }

    // Update basic product details
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price ? Number(price) : product.price;
    product.stock = stock !== undefined ? Number(stock) : product.stock;
    product.category = category || product.category;

    // Handle image update (same logic as addProduct)
    let productImage = null;

    // Case 1: Local file upload
    if (req.file) {
      // Upload the file to Cloudinary
      const uploadResult = await cloudinary.v2.uploader.upload(req.file.path);
      productImage = uploadResult.secure_url;
    } 
    // Case 2: Provided image URL
    else if (imageUrl && imageUrl.trim() !== '') {
      try {
        // Let Cloudinary fetch and store it
        const uploadResult = await cloudinary.v2.uploader.upload(imageUrl);
        productImage = uploadResult.secure_url;
      } catch (err) {
        return res.status(400).json({ success: false, message: "Invalid image URL or failed to upload image" });
      }
    }

    // Update image fields if new image provided
    if (productImage) {
      product.image = productImage; // Keep for backward compatibility
      product.images = [{ url: productImage }]; // Update images array for frontend
    }

    // Save updated product
    const savedProduct = await product.save();

    res.json({
      success: true,
      message: "Product updated successfully",
      product: savedProduct,
    });

  } catch (error) {
    console.error("Update product error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
};

