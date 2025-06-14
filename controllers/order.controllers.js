import Cart from "../models/cart.models.js";
import Order from "../models/order.models.js";
import Product from "../models/product.models.js";

export const placeOrder = async (req, res) => {
  const { shippingAddress } = req.body;
  const userId = req.userId;

  if (!shippingAddress) {
    return res.json({ success: false, message: "Shipping address is required" });
  }

  try {
    
    const cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.json({ success: false, message: "Your cart is empty" });
    }

    const orderItems = [];
    let totalAmount = 0;

    for (let cartItem of cart.items) {
      if (!cartItem.product) {
        return res.json({ success: false, message: "Product not found in cart" });
      }

      if (cartItem.product.stock < cartItem.quantity) {
        return res.json({
          success: false,
          message: `Not enough stock for ${cartItem.product.name}. Only ${cartItem.product.stock} available`,
        });
      }

      orderItems.push({
        product: cartItem.product._id,
        quantity: cartItem.quantity,
      });

      totalAmount += cartItem.product.price * cartItem.quantity;

      // Decrease stock
      cartItem.product.stock -= cartItem.quantity;
      await cartItem.product.save();
    }

    const order = await Order.create({
      user: userId,
      orderItems,
      totalAmount,
      shippingAddress,
      orderStatus: "Paid",
    });

    // Clear cart after successful order
    cart.items = [];
    await cart.save();

    res.json({
      success: true,
      message: "Order placed successfully",
      order,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
  

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId }).populate(
      "orderItems.product",
      "name price"
    );

    return res.json({ success: true, orders });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const cancelOrder = async (req, res) => {
    const {orderId}= req.body;

    if(!orderId){
        return res.json({success:false,message:"Order ID is required"})
    }

    try {

        const order = await Order.findById(orderId);
        if(!order){
            return res.json({success:false,message:"Order not found"})
        }

        for (let item of order.orderItems) {
            const product = await Product.findById(item.product);
      
            if (product) {
              product.stock += item.quantity; //this will icrease stock again
              await product.save();
            }
          }

        if(order.orderStatus === "Cancelled"){
            return res.json({success:false,message:"Order already cancelled"})
        }
        order.orderStatus = "Cancelled";
        await order.save();

        return res.json({success:true,message:"Order cancelled successfully"})
        
    } catch (error) {

        return res.json({success:false,message:error.message})
    }
}
