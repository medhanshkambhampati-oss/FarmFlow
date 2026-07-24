const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const Farmer = require('../models/Farmer');
require('dotenv').config();

const router = express.Router();

const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const CALLBACK_URL         = `${process.env.pburl}/auth/google/callback`;
const FRONTEND_URL         = process.env.furl;

// Helper: safely redirect and set CORS so the browser follows the redirect
function safeRedirect(res, url) {
    res.header('Access-Control-Allow-Origin', '*');
    res.redirect(url);
}

// Step 1: Redirect user to Google consent screen
router.get('/google', (req, res) => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        console.error('Google OAuth env vars not set (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)');
        return safeRedirect(res, `${FRONTEND_URL}/login?error=server_config`);
    }

    const googleAuthURL =
        `https://accounts.google.com/o/oauth2/v2/auth` +
        `?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(CALLBACK_URL)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent('openid email profile')}` +
        `&access_type=offline` +
        `&prompt=consent`;

    console.log('[OAuth] Redirecting to Google. Callback URL:', CALLBACK_URL);
    safeRedirect(res, googleAuthURL);
});

// Step 2: Handle Google callback — exchange code for tokens, find/create user, issue JWT
router.get('/google/callback', async (req, res) => {
    const { code, error: oauthError } = req.query;

    // Google can return an error param (e.g. access_denied)
    if (oauthError) {
        console.error('[OAuth] Google returned error:', oauthError);
        return safeRedirect(res, `${FRONTEND_URL}/login?error=${oauthError}`);
    }

    if (!code) {
        console.error('[OAuth] No authorization code received');
        return safeRedirect(res, `${FRONTEND_URL}/login?error=no_code`);
    }

    try {
        // Exchange authorization code for access token
        const tokenResponse = await axios.post(
            'https://oauth2.googleapis.com/token',
            new URLSearchParams({
                code,
                client_id:     GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri:  CALLBACK_URL,
                grant_type:    'authorization_code',
            }).toString(),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const { access_token } = tokenResponse.data;

        if (!access_token) {
            console.error('[OAuth] No access_token in token response:', tokenResponse.data);
            return safeRedirect(res, `${FRONTEND_URL}/login?error=no_access_token`);
        }

        // Fetch user profile from Google
        const profileResponse = await axios.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            { headers: { Authorization: `Bearer ${access_token}` } }
        );

        const { email, name } = profileResponse.data;

        if (!email) {
            console.error('[OAuth] No email in Google profile');
            return safeRedirect(res, `${FRONTEND_URL}/login?error=no_email`);
        }

        // Find or create Farmer in the database
        let farmer = await Farmer.findOne({ email });

        if (!farmer) {
            // New Google user → create account (no password for Google users)
            farmer = new Farmer({
                name:     name || email.split('@')[0],
                email,
                password: '__google_oauth__', // placeholder — never used for login
            });
            await farmer.save();
            console.log('[OAuth] New farmer created via Google:', email);
        } else {
            console.log('[OAuth] Existing farmer signed in via Google:', email);
        }

        // Generate JWT token — 7 day expiry (same as normal login should use)
        const token = jwt.sign(
            { fid: farmer._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Redirect to frontend with token + user info in URL params
        const params = new URLSearchParams({
            token,
            name:  farmer.name,
            email: farmer.email,
        });

        const redirectTo = `${FRONTEND_URL}/auth/callback?${params.toString()}`;
        console.log('[OAuth] Success — redirecting to frontend callback');
        safeRedirect(res, redirectTo);

    } catch (error) {
        const detail = error.response?.data || error.message;
        console.error('[OAuth] Error during Google callback:', detail);

        // Distinguish token exchange errors (likely redirect_uri_mismatch) from other errors
        const isRedirectMismatch =
            typeof detail === 'object' && detail?.error === 'redirect_uri_mismatch';

        const errorCode = isRedirectMismatch ? 'redirect_mismatch' : 'auth_failed';
        safeRedirect(res, `${FRONTEND_URL}/login?error=${errorCode}`);
    }
});

module.exports = router;
