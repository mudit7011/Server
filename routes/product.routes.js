import express from "express";
import { addProduct, getAllProducts, updateProduct } from "../controllers/product.controllers.js";
import upload from "../middleware/upload.js";

const productRouter = express.Router();

productRouter.post("/add-product",upload.single("image"), addProduct);
productRouter.get("/get-products", getAllProducts);
productRouter.put("/edit-product/:id", updateProduct);

export default productRouter;