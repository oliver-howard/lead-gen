/**
 * invrse Brand Email Template
 * 
 * Provides a clean, modern HTML wrapper for outbound emails consistent
 * with the invrse.dev brand identity.
 */

function wrapEmailTemplate(content, subject) {
  // Convert plain text newlines to HTML breaks or paragraphs
  const htmlContent = content
    .split('\n\n')
    .map(para => `<p style="margin-bottom: 20px;">${para.replace(/\n/g, '<br>')}</p>`)
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      color: #1e293b;
    }

    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #ffffff;
      background-image: 
        linear-gradient(#f1f5f9 1px, transparent 1px),
        linear-gradient(90deg, #f1f5f9 1px, transparent 1px);
      background-size: 24px 24px;
      padding-top: 40px;
      padding-bottom: 60px;
    }

    .main {
      background-color: #ffffff;
      margin: 40px auto;
      width: 100%;
      max-width: 600px;
      border-spacing: 0;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    }

    .header {
      padding: 40px 40px 20px;
      text-align: left;
    }

    .logo {
      font-size: 24px;
      font-weight: 700;
      color: #000000;
      text-decoration: none;
      letter-spacing: -0.04em;
    }

    .content {
      padding: 0 40px 30px;
      font-size: 16px;
      line-height: 1.6;
      color: #1a1a1a;
    }

    .content p {
      margin: 0 0 20px;
    }

    .content strong {
      color: #0f172a;
      font-weight: 600;
    }

    .cta-container {
      padding: 0 40px 40px;
    }

    .button {
      display: inline-block;
      padding: 14px 28px;
      background-color: #0f172a;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 600;
      font-size: 15px;
      transition: background-color 0.2s;
    }

    .footer {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      text-align: center;
      padding: 20px;
      font-size: 13px;
      color: #94a3b8;
    }

    .footer a {
      color: #6366f1;
      text-decoration: none;
    }

    @media only screen and (max-width: 600px) {
      .main {
        margin: 20px auto;
        border-radius: 0;
        border-left: none;
        border-right: none;
      }
      .header, .content, .cta-container {
        padding-left: 24px;
        padding-right: 24px;
      }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main" role="presentation">
      <tr>
        <td class="header">
          <a href="https://invrse.dev" class="logo">invrse</a>
        </td>
      </tr>
      <tr>
        <td class="content">
          ${htmlContent}
        </td>
      </tr>
      <tr>
        <td class="cta-container">
          <a href="https://calendly.com/invrse/strategy-call" class="button">Book Strategy Call</a>
        </td>
      </tr>
    </table>
    <div class="footer">
      Sent by <strong>Oliver Howard</strong> from <a href="https://invrse.dev">invrse.dev</a><br>
      San Francisco, CA & Remote
    </div>
  </div>
</body>
</html>
  `;
}

module.exports = { wrapEmailTemplate };
