const logger = require('../utils/logger');
const config = require('../config');

class EmailService {
  constructor() {
    this.sentEmails = [];
  }

  /**
   * Send College Approval & Initial Login Credentials Email
   */
  async sendCollegeApprovalEmail({ to, collegeName, username, tempPassword, loginUrl }) {
    const portalUrl = loginUrl || process.env.FRONTEND_URL || 'http://localhost:5173/login';
    const subject = `Welcome to SIPS — ${collegeName} Onboarding Approved!`;
    const textBody = `
Dear Administrator,

Congratulations! Your onboarding application for ${collegeName} on the Skill Intelligence & Placement System (SIPS) has been officially approved by the Super Administrator.

Your Login Credentials:
----------------------------------------
Portal URL: ${portalUrl}
Login ID / Username: ${username}
Initial Password: ${tempPassword}
Role: University / Institution Administrator
----------------------------------------

Security Instructions:
1. Navigate to ${portalUrl} and select "University / College Sign In".
2. Enter your Login ID and Initial Password.
3. Upon first login, please change your password in your Account Settings.
4. You can then begin onboarding your academic departments, faculties, and student batches.

If you have any questions, feel free to contact our institutional support team at support@sips.edu.

Warm regards,
SIPS Super Administration Team
    `.trim();

    const htmlBody = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h2 style="color: #4f46e5; margin: 0; font-size: 24px;">Skill Intelligence & Placement System</h2>
    <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Institutional Onboarding Approval</p>
  </div>
  
  <p style="color: #1e293b; font-size: 16px;">Dear <strong>${collegeName}</strong> Administrator,</p>
  
  <p style="color: #475569; font-size: 15px; line-height: 1.6;">
    We are pleased to inform you that your institutional onboarding application has been <strong>approved</strong> by the SIPS Super Administration.
  </p>
  
  <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px; margin: 20px 0;">
    <h4 style="color: #334155; margin-top: 0; margin-bottom: 12px; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">Your Institutional Credentials</h4>
    <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
      <tr>
        <td style="padding: 6px 0; color: #64748b; width: 140px;">Portal Login URL:</td>
        <td style="padding: 6px 0; color: #1e293b; font-weight: bold;"><a href="${portalUrl}" style="color: #4f46e5; text-decoration: none;">${portalUrl}</a></td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #64748b;">Login ID / Username:</td>
        <td style="padding: 6px 0; color: #1e293b; font-weight: bold; font-family: monospace; font-size: 15px;">${username}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #64748b;">Temporary Password:</td>
        <td style="padding: 6px 0; color: #1e293b; font-weight: bold; font-family: monospace; font-size: 15px; background: #e0e7ff; padding: 2px 6px; border-radius: 4px;">${tempPassword}</td>
      </tr>
    </table>
  </div>

  <div style="margin-top: 24px; text-align: center;">
    <a href="${portalUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 12px 28px; font-size: 15px; font-weight: bold; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">Sign In to SIPS Portal</a>
  </div>
  
  <p style="color: #94a3b8; font-size: 13px; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
    Please change your password immediately upon first sign in. If you did not request this account, please contact <a href="mailto:support@sips.edu" style="color: #6366f1;">support@sips.edu</a>.
  </p>
</div>
    `.trim();

    const emailRecord = {
      to,
      subject,
      textBody,
      htmlBody,
      sentAt: new Date().toISOString(),
      type: 'COLLEGE_APPROVAL'
    };

    this.sentEmails.push(emailRecord);
    logger.info(`[EmailService] College approval email dispatched to ${to} (${collegeName}) with username '${username}'`);

    // Try sending real email via nodemailer if configured
    await this._dispatchSmtpEmail({
      to,
      subject,
      text: textBody,
      html: htmlBody
    });

    return {
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      to,
      subject
    };
  }

  /**
   * Send College Rejection Notice Email
   */
  async sendCollegeRejectionEmail({ to, collegeName, reason }) {
    const subject = `Update regarding ${collegeName} Onboarding Application on SIPS`;
    const textBody = `
Dear Administrator,

Thank you for your interest in the Skill Intelligence & Placement System (SIPS).

After reviewing your onboarding submission for ${collegeName}, our Super Administration team was unable to approve your application at this time.

Reason / Remarks:
${reason || 'Additional verification or institutional accreditation details required.'}

If you believe this decision was made in error or if you have updated verification documentation, please reply directly to this email or contact support@sips.edu.

Sincerely,
SIPS Super Administration Team
    `.trim();

    const emailRecord = {
      to,
      subject,
      textBody,
      sentAt: new Date().toISOString(),
      type: 'COLLEGE_REJECTION'
    };

    this.sentEmails.push(emailRecord);
    logger.info(`[EmailService] College rejection notice sent to ${to} (${collegeName})`);

    // Try sending real email via nodemailer if configured
    await this._dispatchSmtpEmail({
      to,
      subject,
      text: textBody
    });

    return {
      success: true,
      to,
      subject
    };
  }

  /**
   * Internal dispatcher for real SMTP email delivery (via nodemailer)
   */
  async _dispatchSmtpEmail({ to, subject, text, html }) {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      logger.info(`[EmailService] SMTP_USER or SMTP_PASS not set in environment. Running in simulated mode (email logged in sentEmails).`);
      return { success: false, simulated: true, reason: 'SMTP credentials not configured' };
    }

    try {
      let nodemailer;
      try {
        nodemailer = require('nodemailer');
      } catch (e) {
        logger.warn(`[EmailService] nodemailer package is not installed. Please run 'npm install nodemailer'.`);
        return { success: false, reason: 'nodemailer not installed' };
      }

      const isGmail = (process.env.SMTP_HOST || '').includes('gmail') || (!process.env.SMTP_HOST && smtpUser.includes('@gmail.com'));
      
      const transportConfig = isGmail
        ? {
            service: 'gmail',
            auth: {
              user: smtpUser,
              pass: smtpPass
            },
            tls: {
              rejectUnauthorized: false
            }
          }
        : {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT, 10) || 587,
            secure: process.env.SMTP_PORT === '465',
            auth: {
              user: smtpUser,
              pass: smtpPass
            },
            tls: {
              rejectUnauthorized: false
            }
          };

      const transporter = nodemailer.createTransport(transportConfig);

      const fromAddress = process.env.SMTP_FROM || `SIPS Administration <${smtpUser}>`;

      const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        text,
        html: html || undefined
      });

      logger.info(`[EmailService] Live SMTP email successfully delivered to ${to} (MessageId: ${info?.messageId})`);
      return { success: true, messageId: info?.messageId };
    } catch (err) {
      logger.error(`[EmailService] SMTP delivery failed to ${to}: ${err.message}`, {
        code: err.code,
        response: err.response
      });
      return { success: false, error: err.message, code: err.code };
    }
  }

  /**
   * Get history of dispatched emails (for diagnostics / tests)
   */
  getSentEmails() {
    return this.sentEmails;
  }

  /**
   * Clear sent emails history
   */
  clear() {
    this.sentEmails = [];
  }
}

module.exports = new EmailService();
