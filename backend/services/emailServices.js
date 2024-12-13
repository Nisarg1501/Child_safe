const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "ishanupadhyay1111@gmail.com",
    pass: "cpbznxcpfomujndx",
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.log("Error configuring email:", error);
  } else {
    console.log("Email service is ready to send messages");
  }
});

// Function to send an email
const sendEmail = (to, subject, text) => {
  const mailOptions = {
    from: "ishanupadhyay1111@gmail.com",
    to,
    subject,
    text,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
