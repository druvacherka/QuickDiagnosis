const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Create a transporter using standard SMTP defaults
    const transporter = nodemailer.createTransport({
        service: 'gmail', // Standardizing on Gmail for default, can use SMTP Host/Port configs
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: `QuickDiagnosis <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Message sent: ${info.messageId}`);
};

module.exports = sendEmail;
