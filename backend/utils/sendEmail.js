const nodemailer = require('nodemailer');

// Set up a Nodemailer transporter. 
// For production, configure process.env.EMAIL_USER and process.env.EMAIL_PASS
// For now, we'll log out if the credentials aren't set, and use ethereal if possible, or just print to console.

let transporter;

const initializeTransporter = async () => {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        transporter = nodemailer.createTransport({
            service: 'gmail', // or your preferred service
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    } else {
        // Fallback to ethereal for testing if no credentials are provided
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        console.log("Using Ethereal Email for testing. User:", testAccount.user);
    }
};

initializeTransporter();

const sendEmail = async ({ to, subject, text, html }) => {
    try {
        if (!transporter) {
            await initializeTransporter();
        }

        const info = await transporter.sendMail({
            from: '"Expo-College Events" <noreply@expo-college-events.com>',
            to,
            subject,
            text,
            html
        });

        console.log("Email sent: %s", info.messageId);

        // This URL is useful for viewing the ethereal email in development
        if (nodemailer.getTestMessageUrl(info)) {
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        }

        return info;
    } catch (error) {
        console.error("Error sending email: ", error);
        throw new Error("Email could not be sent");
    }
};

module.exports = sendEmail;
