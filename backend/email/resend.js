const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends an email using the Resend API
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} [options.from] - Sender email (defaults to Resend onboarding or configured domain)
 */
async function sendEmail({ to, subject, html, from }) {
  try {
    const { data, error } = await resend.emails.send({
      from: from || 'oliver@invrse.dev',
      to,
      subject,
      html,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (err) {
    console.error('[Resend] Send error:', err.message);
    throw err;
  }
}

module.exports = { sendEmail, resend };
