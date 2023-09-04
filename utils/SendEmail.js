

import nodemailer from "nodemailer";

export const SendEmail = async(options)=>{

    // 1 Create transporter 
    const transporter= nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: true,
        auth:{
            user: process.env.EMAIL_USER,
            pass:process.env.EMAIL_PASSWORD
        }
    })
    //2 Define email options ( like from , to , subject , email content  )
    const mailOpts= {
        from: "Marketplace App <devabdellah1@gmail.com>",
        to : options.email,
        subject: options.subject,
        html:  options.message,
    }

    // 3 Send email

    await transporter.sendMail(mailOpts);

 };


//  module.exports = SendEmail;

//  mexports = SendEmail;