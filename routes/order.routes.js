import express from "express";
import { cancelOrder, getMyOrders, placeOrder } from "../controllers/order.controllers.js";
import authUser from "../middleware/userAuth.js";

const orderRouter = express.Router();

orderRouter.post("/place-order", authUser, placeOrder);
orderRouter.get("/my-orders", authUser, getMyOrders);
orderRouter.post("/cancel-order", authUser, cancelOrder);

export default orderRouter;
