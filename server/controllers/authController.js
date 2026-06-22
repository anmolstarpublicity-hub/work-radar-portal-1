const Employee = require('../models/employee.js');
const generateToken = require('../generateToken.js');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Import crypto module
const sendEmail = require('./sendEmail.js');

class AuthController {
  static login = async (req, res) => {
    const { employeeId, password } = req.body;
    try {
      const user = await Employee.findOne({ employeeId });

      if (user && (await user.matchPassword(password))) {
        return res.json({
          // Return the user object, but exclude the password
          user: await Employee.findById(user._id).select('-password'),
          token: generateToken(user._id),
        });
      } else {
        res.status(401).json({ message: 'Invalid credentials' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  };

  static getMe = async (req, res) => {
    res.status(200).json(req.user);
  };

  static logout = (req, res) => {
    // This is a stateless JWT setup. The client is responsible for clearing the token.
    // This endpoint simply provides a formal way for the client to "log out"
    // and can be used for logging or other server-side cleanup if needed in the future.
    res.status(200).json({ message: 'Logged out successfully.' });
  };

  /**
   * @description Handle forgot password request
   * @route POST /api/auth/forgot-password
   * @access Public
   */
  static forgotPassword = async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address.' });
    }

    try {
      const user = await Employee.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        // Send a generic success message to prevent user enumeration
        return res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
      }

      // Generate a random reset token
      const resetToken = crypto.randomBytes(32).toString('hex');

      // Hash the token and save it to the user document
      user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      user.passwordResetExpires = Date.now() + 15 * 60 * 1000; // Token valid for 15 minutes
      await user.save({ validateBeforeSave: false }); // Save without re-validating password

      // Construct the reset URL pointing to your frontend application
      // Use the UNHASHED token for the URL
      const frontendUrls = process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',') : [];
      const baseUrl = frontendUrls.length > 0 ? frontendUrls[0].trim() : 'http://localhost:5173';
      const resetUrl = `${baseUrl}/workradar/reset-password/${resetToken}`;
      
      const message = `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\nPlease click on the following link, or paste it into your browser to complete the process:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\nThis link is valid for 15 minutes.`;

      try {
        await sendEmail({
          email: user.email,
          subject: 'Your Work Radar Password Reset Token',
          message,
        });
        console.log(`Password Reset Link Sent to: ${user.email}`);
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Still return success to prevent user enumeration, but log the error
      }

      res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: 'Server error while processing forgot password request.' });
    }
  };

  /**
   * @description Handle password reset
   * @route POST /api/auth/reset-password/:token
   * @access Public
   */
  static resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    try {
      // Hash the incoming token to compare with the stored hashed token
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      const user = await Employee.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }, // Check if token is not expired
      });

      if (!user) {
        return res.status(400).json({ message: 'Invalid token or user does not exist.' });
      }

      user.password = password; // The 'save' pre-hook will hash it
      user.passwordResetToken = undefined; // Invalidate the token
      user.passwordResetExpires = undefined; // Clear expiration
      await user.save();
      res.status(200).json({ message: 'Password reset successfully.' });
    } catch (error) {
      res.status(400).json({ message: 'Invalid or expired token.' });
    }
  };
}

module.exports = AuthController;