import express from 'express';
import cors from "cors";
import "dotenv/config";
import connectDb from "./config/mongodb.js";
import cookieParser from "cookie-parser";
import authRouter from "./routes/user.routes.js"
import userRouter  from './routes/userData.routes.js';
import productRouter from './routes/product.routes.js';
import orderRouter from './routes/order.routes.js';
import cartRouter from './routes/cart.routes.js';
import { wishlistRouter } from './routes/wishlist.route.js';


const app =  express();
const port = process.env.PORT || 4000;
connectDb();

const allowedOrigins = ['https://dynamic-ecom-vibe.vercel.app']

app.use(express.json());
app.use(express.urlencoded({extended:false}))
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({origin:allowedOrigins,credentials:true}))

// API endpoints
app.get('/',(req,res)=>{
    res.send("Home Page")
})

app.use("/api/auth",authRouter)
app.use("/api/user",userRouter)
app.use("/api/product",productRouter)
app.use("/api/order", orderRouter);
app.use("/api/cart", cartRouter);
app.use("/api/wishlist",wishlistRouter );

app.listen(port, ()=> console.log(`Server is runnning on Port: ${port}`))