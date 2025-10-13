import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import express,{Request,Response} from 'express';

const router = express.Router();

dotenv.config();

const transporter = nodemailer.createTransport({
    service : 'gmail',
    auth:{
        user : process.env.EMAIL_USER,
        pass:process.env.EMAIL_APP_PASSWORD 
    }
})

 
export const sendemail = async (email: string, message: string) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,   
      subject: "TheraConnect: Important Notification",
      text: `
         ${message}
      `
    });

    return { success: true };  
  } catch (error) {
    console.error("Error sending booking reminder email:", error);
    return { success: false, error };
  }
};


export default router;
