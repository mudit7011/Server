import dotenv from "dotenv"
import nodemailer from "nodemailer"

dotenv.config();

const transporter = nodemailer.createTransport({
    service:"gmail",
    secure:true,
    host:"smtp.gmail.com",
    port:465,
    auth:{
        user:process.env.SMTP_USER,
        pass:process.env.SMTP_PASS
    }
})

export default transporter;