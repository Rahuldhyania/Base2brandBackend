const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
 
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'tech@base2brand.com', // Verified sender email
      to,
      subject,
      text,
      html,
    });
 
    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }
 
    console.log('Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
 
module.exports = sendEmail;