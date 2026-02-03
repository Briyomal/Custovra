export const VERIFICATION_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify Your Email</title>
</head>

<body style="margin:0; padding:0; background-color:#f3f4f6; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

  <div style="max-width:600px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.08);">

    <!-- Header -->
<div style="background:linear-gradient(135deg, #16bf4c, #84cc16); padding:32px; text-align:center;">

  <div style="
    display:inline-block;
    background:#ffffff;
    padding:10px 14px;
    border-radius:10px;
    margin-bottom:16px;">
    <img
      src="{logoUrl}"
      alt="Custovra"
      width="110"
      style="display:block;"
    />
  </div>

  <h1 style="margin:0; color:#ffffff; font-size:26px; font-weight:600;">
    Verify Your Email 📧
  </h1>

  <p style="margin-top:8px; color:#ecfdf5; font-size:15px;">
    One more step to get started
  </p>

</div>

    <!-- Content -->
    <div style="padding:32px; color:#111827;">

      <p style="font-size:16px; margin-top:0;">
        Hello,
      </p>

      <p style="font-size:15px; line-height:1.6; color:#374151;">
        Thanks for signing up with <strong>Custovra</strong>!  
        Use the verification code below to confirm your email address.
      </p>

      <!-- Verification Code -->
      <div style="text-align:center; margin:32px 0;">
        <div style="
          display:inline-block;
          padding:16px 28px;
          font-size:32px;
          font-weight:700;
          letter-spacing:6px;
          color:#16bf4c;
          background:#ecfdf5;
          border:1px dashed #86efac;
          border-radius:10px;">
          {verificationCode}
        </div>
      </div>

      <p style="font-size:15px; color:#374151;">
        Enter this code on the verification page to complete your registration.
      </p>

      <!-- Info Box -->
      <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:18px; margin:24px 0;">
        <p style="margin:0; font-size:14px; color:#374151;">
          ⏰ This code will expire in <strong>15 minutes</strong> for security reasons.
        </p>
      </div>

      <p style="font-size:14px; color:#6b7280;">
        If you didn’t create an account with us, you can safely ignore this email.
      </p>

      <p style="margin-top:32px; font-size:15px;">
        Best regards,<br />
        <strong>Custovra Team</strong>
      </p>

    </div>

    <!-- Footer -->
    <div style="background:#f9fafb; padding:16px; text-align:center; font-size:12px; color:#9ca3af;">
      This is an automated message. Please do not reply.
    </div>

  </div>

</body>
</html>
`;

export const PASSWORD_RESET_SUCCESS_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Reset Successful</title>
</head>

<body style="margin:0; padding:0; background-color:#f3f4f6; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

  <div style="max-width:600px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg, #16bf4c, #84cc16); padding:32px; text-align:center;">
      <div style="
    display:inline-block;
    background:#ffffff;
    padding:10px 14px;
    border-radius:10px;
    margin-bottom:16px;">
    <img
      src="{logoUrl}"
      alt="Custovra"
      width="110"
      style="display:block;"
    />
  </div>
      <h1 style="margin:0; color:#ffffff; font-size:26px; font-weight:600;">
        Password Updated ✅
      </h1>
      <p style="margin-top:8px; color:#ecfdf5; font-size:15px;">
        Your account is secure
      </p>
    </div>

    <!-- Content -->
    <div style="padding:32px; color:#111827;">

      <p style="font-size:16px; margin-top:0;">
        Hello,
      </p>

      <p style="font-size:15px; line-height:1.6; color:#374151;">
        This email confirms that your <strong>Custovra</strong> account password was successfully reset.
      </p>

      <!-- Success Icon -->
      <div style="text-align:center; margin:32px 0;">
        <div style="
          width:64px;
          height:64px;
          line-height:64px;
          border-radius:50%;
          background:#16bf4c;
          color:#ffffff;
          font-size:32px;
          display:inline-block;
          font-weight:600;">
          ✓
        </div>
      </div>

      <p style="font-size:15px; color:#374151;">
        If you did not perform this action, please contact our support team immediately.
      </p>

      <!-- Security Tips -->
      <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:18px; margin:24px 0;">
        <p style="margin-top:0; font-size:14px; font-weight:600; color:#111827;">
          Security tips:
        </p>
        <ul style="margin:8px 0 0 18px; padding:0; font-size:14px; color:#374151;">
          <li>Use a strong, unique password</li>
          <li>Enable two-factor authentication (2FA)</li>
          <li>Avoid reusing passwords across sites</li>
        </ul>
      </div>

      <p style="font-size:15px; color:#374151;">
        Thank you for helping us keep your account secure.
      </p>

      <p style="margin-top:32px; font-size:15px;">
        Best regards,<br />
        <strong>Custovra Team</strong>
      </p>

    </div>

    <!-- Footer -->
    <div style="background:#f9fafb; padding:16px; text-align:center; font-size:12px; color:#9ca3af;">
      This is an automated security email. Please do not reply.
    </div>

  </div>

</body>
</html>
`;

export const PASSWORD_RESET_REQUEST_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password</title>
</head>

<body style="margin:0; padding:0; background-color:#f3f4f6; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

  <div style="max-width:600px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg, #16bf4c, #84cc16); padding:32px; text-align:center;">

      <div style="
    display:inline-block;
    background:#ffffff;
    padding:10px 14px;
    border-radius:10px;
    margin-bottom:16px;">
    <img
      src="{logoUrl}"
      alt="Custovra"
      width="110"
      style="display:block;"
    />
  </div>

      <h1 style="margin:0; color:#ffffff; font-size:26px; font-weight:600;">
        Reset Your Password 🔐
      </h1>
      <p style="margin-top:8px; color:#ecfdf5; font-size:15px;">
        Secure access to your account
      </p>
    </div>

    <!-- Content -->
    <div style="padding:32px; color:#111827;">

      <p style="font-size:16px; margin-top:0;">
        Hello,
      </p>

      <p style="font-size:15px; line-height:1.6; color:#374151;">
        We received a request to reset the password for your <strong>Custovra</strong> account.
        If you didn’t request this, you can safely ignore this email.
      </p>

      <!-- Info Box -->
      <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:18px; margin:24px 0;">
        <p style="margin:0; font-size:14px; color:#374151;">
          ⏰ This reset link will expire in <strong>1 hour</strong> for security reasons.
        </p>
      </div>

      <p style="font-size:15px; color:#374151;">
        Click the button below to reset your password:
      </p>

      <!-- CTA -->
      <div style="text-align:center; margin:32px 0;">
        <a
          href="{resetURL}"
          style="display:inline-block; padding:14px 28px; background:#16bf4c; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:600; font-size:15px;"
        >
          Reset Password
        </a>
      </div>

      <p style="font-size:14px; color:#6b7280;">
        If the button doesn’t work, copy and paste this link into your browser:
      </p>

      <p style="font-size:13px; word-break:break-all; color:#16bf4c;">
        {resetURL}
      </p>

      <p style="margin-top:32px; font-size:15px;">
        Regards,<br />
        <strong>Custovra Team</strong>
      </p>

    </div>

    <!-- Footer -->
    <div style="background:#f9fafb; padding:16px; text-align:center; font-size:12px; color:#9ca3af;">
      This is an automated security email. Please do not reply.
    </div>

  </div>

</body>
</html>
`;

export const WELCOME_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Custovra</title>
</head>

<body style="margin:0; padding:0; background-color:#f3f4f6; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

  <div style="max-width:600px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg, #16bf4c, #84cc16); padding:32px; text-align:center;">

      <div style="
    display:inline-block;
    background:#ffffff;
    padding:10px 14px;
    border-radius:10px;
    margin-bottom:16px;">
    <img
      src="{logoUrl}"
      alt="Custovra"
      width="110"
      style="display:block;"
    />
  </div>

      <h1 style="margin:0; color:#ffffff; font-size:26px; font-weight:600;">
        Welcome to Custovra 👋
      </h1>
      <p style="margin-top:8px; color:#ecfdf5; font-size:15px;">
        We’re excited to have you onboard
      </p>
    </div>

    <!-- Content -->
    <div style="padding:32px; color:#111827;">

      <p style="font-size:16px; margin-top:0;">
        Hi <strong>{name}</strong>,
      </p>

      <p style="font-size:15px; line-height:1.6; color:#374151;">
        Thank you for joining <strong>Custovra</strong>! Your account has been successfully created, and you’re all set to start exploring the platform.
      </p>

      <!-- Highlight Card -->
      <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:20px; margin:24px 0;">
        <p style="margin:0; font-size:14px; color:#374151;">
          🚀 Create and manage your forms<br />
          📊 View insights and submissions<br />
          🔒 Secure and scalable platform
        </p>
      </div>

      <p style="font-size:15px; color:#374151;">
        Click below to get started:
      </p>

      <!-- CTA -->
      <div style="text-align:center; margin:32px 0;">
        <a
          href="https://custovra.com/"
          style="display:inline-block; padding:14px 28px; background:#16bf4c; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:600; font-size:15px;"
        >
          Start Exploring
        </a>
      </div>

      <p style="font-size:14px; color:#6b7280;">
        If you have any questions, our support team is always here to help.
      </p>

      <p style="margin-top:32px; font-size:15px;">
        Cheers,<br />
        <strong>Custovra Team</strong>
      </p>

    </div>

    <!-- Footer -->
    <div style="background:#f9fafb; padding:16px; text-align:center; font-size:12px; color:#9ca3af;">
      This is an automated message. Please do not reply.
    </div>

  </div>

</body>
</html>

`;

export const SUBSCRIPTION_EXPIRY_REMINDER_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Subscription Expiring Soon</title>
</head>

<body style="margin:0; padding:0; background-color:#f3f4f6; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

  <div style="max-width:600px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg, #f59e0b, #eab308); padding:32px; text-align:center;">

      <div style="
        display:inline-block;
        background:#ffffff;
        padding:10px 14px;
        border-radius:10px;
        margin-bottom:16px;">
        <img
          src="{logoUrl}"
          alt="Custovra"
          width="110"
          style="display:block;"
        />
      </div>

      <h1 style="margin:0; color:#ffffff; font-size:26px; font-weight:600;">
        Subscription Expiring Soon ⏰
      </h1>
      <p style="margin-top:8px; color:#fef3c7; font-size:15px;">
        Don't lose access to your forms
      </p>
    </div>

    <!-- Content -->
    <div style="padding:32px; color:#111827;">

      <p style="font-size:16px; margin-top:0;">
        Hi <strong>{userName}</strong>,
      </p>

      <p style="font-size:15px; line-height:1.6; color:#374151;">
        This is a friendly reminder that your <strong>Custovra</strong> subscription is expiring soon.
      </p>

      <!-- Expiry Info Card -->
      <div style="background:#fef3c7; border:1px solid #fcd34d; border-radius:10px; padding:20px; margin:24px 0; text-align:center;">
        <p style="margin:0 0 8px 0; font-size:14px; color:#92400e;">Your subscription expires in</p>
        <p style="margin:0; font-size:32px; font-weight:700; color:#b45309;">{daysRemaining} day(s)</p>
        <p style="margin:8px 0 0 0; font-size:14px; color:#92400e;">on <strong>{expiryDate}</strong></p>
      </div>

      <!-- Plan Details -->
      <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:20px; margin:24px 0;">
        <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
          <span style="color:#6b7280; font-size:14px;">Current Plan</span>
          <span style="font-weight:600;">{planName}</span>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span style="color:#6b7280; font-size:14px;">Billing Period</span>
          <span style="font-weight:600;">{billingPeriod}</span>
        </div>
      </div>

      <p style="font-size:15px; color:#374151;">
        To continue enjoying uninterrupted access to all your forms and submissions, please renew your subscription before it expires.
      </p>

      <!-- CTA -->
      <div style="text-align:center; margin:32px 0;">
        <a
          href="https://custovra.com/billing"
          style="display:inline-block; padding:14px 28px; background:#16bf4c; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:600; font-size:15px;"
        >
          Renew Subscription
        </a>
      </div>

      <!-- Warning -->
      <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:10px; padding:18px; margin:24px 0;">
        <p style="margin:0; font-size:14px; color:#991b1b;">
          ⚠️ <strong>What happens if you don't renew?</strong><br />
          Your forms will become inactive and you won't be able to receive new submissions until you renew.
        </p>
      </div>

      <p style="font-size:14px; color:#6b7280;">
        If you have any questions or need assistance, feel free to contact our support team.
      </p>

      <p style="margin-top:32px; font-size:15px;">
        Best regards,<br />
        <strong>Custovra Team</strong>
      </p>

    </div>

    <!-- Footer -->
    <div style="background:#f9fafb; padding:16px; text-align:center; font-size:12px; color:#9ca3af;">
      This is an automated reminder. Please do not reply.
    </div>

  </div>

</body>
</html>
`;

export const PAYMENT_SUCCESS_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Successful</title>
</head>

<body style="margin:0; padding:0; background-color:#f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

  <div style="max-width:600px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg, #16bf4c, #84cc16); padding:32px; text-align:center;">

      <div style="
    display:inline-block;
    background:#ffffff;
    padding:10px 14px;
    border-radius:10px;
    margin-bottom:16px;">
    <img
      src="{logoUrl}"
      alt="Custovra"
      width="110"
      style="display:block;"
    />
  </div>
  
      <h1 style="margin:0; color:#ffffff; font-size:26px; font-weight:600;">
        Payment Successful 🎉
      </h1>
      <p style="margin-top:8px; color:#ecfdf5; font-size:15px;">
        Your subscription is now active
      </p>
    </div>

    <!-- Content -->
    <div style="padding:32px; color:#111827;">
      <p style="font-size:16px; margin-top:0;">
        Hi <strong>{userName}</strong>,
      </p>

      <p style="font-size:15px; line-height:1.6; color:#374151;">
        Thank you for your payment! We've successfully activated your subscription.
        Below are your plan details:
      </p>

      <!-- Info Card -->
      <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:20px; margin:24px 0;">

        <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
          <span style="color:#6b7280; font-size:14px;">Plan</span>
          <span style="font-weight:600;">{planName}</span>
        </div>

        <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
          <span style="color:#6b7280; font-size:14px;">Billing Period</span>
          <span style="font-weight:600;">{billingPeriod}</span>
        </div>

        <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
          <span style="color:#6b7280; font-size:14px;">Amount Paid</span>
          <span style="font-weight:600;">{amount}</span>
        </div>

        <div style="display:flex; justify-content:space-between;">
          <span style="color:#6b7280; font-size:14px;">Valid Until</span>
          <span style="font-weight:600;">{expiryDate}</span>
        </div>
      </div>

      <p style="font-size:15px; color:#374151;">
        You now have full access to all features included in your plan.
      </p>

      <!-- CTA -->
      <div style="text-align:center; margin:32px 0;">
        <a href="{dashboardUrl}"
           style="display:inline-block; padding:14px 28px; background:#16bf4c; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:600; font-size:15px;">
          Go to Dashboard
        </a>
      </div>

      <p style="font-size:14px; color:#6b7280;">
        Need help? Contact our support team anytime.
      </p>

      <p style="margin-top:32px; font-size:15px;">
        Cheers,<br />
        <strong>Custovra Team</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb; padding:16px; text-align:center; font-size:12px; color:#9ca3af;">
      This is an automated message. Please do not reply.
    </div>

  </div>

</body>
</html>
`;

