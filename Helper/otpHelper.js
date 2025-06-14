const nodemailer = require('nodemailer');
require('dotenv').config();
module.exports = {
    async sendEmail(emailId, template, subject, cc = null, attachments = []) {
        try {
            // console.log(process.env..USER_EMAIL,process.env..USER_PASSWORD);
            // return { status: false };
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                secure: true,
                port: 465,
                auth: {
                    user: process.env.USER_EMAIL,
                    pass: process.env.USER_PASSWORD
                }
            });
            let mailOptions = {
                from: `"Task Management Services" <${process.env.EMAIL_ID}>`,
                to: emailId,
                subject: subject,
                html: template, 
            };
            if (cc) {
                mailOptions.cc = cc;
            }
            if (attachments.length > 0) {
                mailOptions.attachments = attachments;
            }
            await transporter.sendMail(mailOptions);
            return { status: true };
        } catch (error) {
            console.error('Error sending email:', error);
            return { status: false };
        }
    },
}