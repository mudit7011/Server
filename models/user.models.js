import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true
    },
    password:{
        type:String,
        required:true
    },
    verifyOTP:{
        type:String,
        default:""
    },
    verifyOtpExpireAt:{
        type:Number,
        default:0
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    resetOtp:{
        type:String,
        default:""
    },
    resetOtpExpiryTime:{
        type:Number,
        default:0
    },
    wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
    role: {
        type: String,
        enum: ['admin', 'seller', 'user'],
        default: 'seller',
      }

},{timestamps:true})



const User = mongoose.models.user || mongoose.model("User",userSchema)

export default User;