const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    // 1) Create a transporter using your SMTP service
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER || 'webenquiry11@gmail.com',
        pass: process.env.EMAIL_PASS || 'jagrnaovvpvyvdqa',
      },
    });

    // 2) Define the email options
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Work Radar Support <support@workradar.com>',
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || `<pre>${options.message}</pre>`,
    };

    // 3) Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${options.email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = sendEmail;