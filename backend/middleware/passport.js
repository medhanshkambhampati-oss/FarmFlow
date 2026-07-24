const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require('dotenv').config()

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${process.env.pburl}/auth/google/callback`,
            passReqToCallback: true
        },
        (req, accessToken, refreshToken, profile, done) => {
            try {
                if (!profile.emails || !profile.emails.length) {
                    return done(new Error("Google account has no email"), null);
                }
                return done(null, profile);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

module.exports = passport;
