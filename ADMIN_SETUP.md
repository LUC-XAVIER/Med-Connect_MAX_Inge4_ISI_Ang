# Admin Setup and Email Configuration Guide

## Admin Credentials

### Default Admin Credentials
- **Email**: `admin@medconnect.com`
- **Password**: `Admin123!@#`

### Creating an Admin User

To create an admin user, run the following script from the `MedConnect-Back` directory:

```bash
cd MedConnect-Back
node scripts/create_admin.js
```

### Customizing Admin Credentials

You can customize the admin credentials by setting environment variables in your `.env` file:

```env
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=YourSecurePassword
ADMIN_FIRST_NAME=YourFirstName
ADMIN_LAST_NAME=YourLastName
```

Then run the script again:
```bash
node scripts/create_admin.js
```

**Note**: If an admin user already exists with the specified email, the script will skip creation. To reset the password, update `ADMIN_PASSWORD` in `.env` and run the script again (you may need to delete the existing admin user first).

## Password Reset Email Configuration

The password reset functionality requires SMTP (email) configuration. To enable password reset emails, configure the following environment variables in your `.env` file:

### Gmail Configuration (Recommended for Development)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Important**: For Gmail, you need to:
1. Enable 2-Step Verification on your Google account
2. Generate an "App Password" (not your regular password)
   - Go to: https://myaccount.google.com/apppasswords
   - Generate a new app password for "Mail"
   - Use this app password as `SMTP_PASS`

### Other Email Providers

For other email providers, update the SMTP settings accordingly:

```env
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-email@your-provider.com
SMTP_PASS=your-password
```

### Frontend URL Configuration

Make sure to set the frontend URL for password reset links:

```env
FRONTEND_URL=http://localhost:4200
```

For production:
```env
FRONTEND_URL=https://your-domain.com
```

## Troubleshooting

### Password Reset Emails Not Received

1. **Check SMTP Configuration**: Verify all SMTP environment variables are set correctly
2. **Check Spam Folder**: Password reset emails might be in your spam folder
3. **Check Backend Logs**: Look for email sending errors in the backend console
4. **Verify Email Exists**: The email must exist in the database for a reset link to be sent
5. **Check Gmail App Password**: If using Gmail, ensure you're using an app password, not your regular password

### Admin Login Issues

1. **Verify Admin User Exists**: Check the database `users` table for a user with `role='admin'`
2. **Run Admin Creation Script**: If no admin exists, run `node scripts/create_admin.js`
3. **Check Password**: Ensure you're using the correct password (default: `Admin123!@#`)


