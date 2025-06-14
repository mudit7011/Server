import dotenv from "dotenv"
import jwt from "jsonwebtoken"
dotenv.config()

const authUser = async (req,res,next)=>{
    const {token} = req.cookies;

    if(!token){
        return res.json({success:false,message:"Token is not Found"})
    }

    try {

        const tokenDecode =  jwt.verify(token, process.env.JWT_SECRET)

        if(tokenDecode.id){
            req.userId = tokenDecode.id
            console.log(tokenDecode.id)
        }else{
            return res.json({success:false, message:"Not Authorized Login Again"})
        }
        
        next();

    } catch (error) {
        return res.json({success:false,message:error.message})
    }
}


  

export default authUser;