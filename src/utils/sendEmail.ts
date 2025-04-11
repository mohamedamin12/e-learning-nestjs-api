import * as nodemailer from "nodemailer";

export const sendEmail = async (options: { email: any; subject: any; message: any; }) => {

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  const mailOptions = {
    from: "E-Learning <MR.Amin>",
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  // 3 - send email

  await transporter.sendMail(mailOptions);
};