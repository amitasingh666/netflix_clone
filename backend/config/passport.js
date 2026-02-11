const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const pool = require('../db');

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;

module.exports = function (passport) {
    // Local Strategy
    passport.use(
        new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
            try {
                const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
                const user = rows[0];

                if (!user) {
                    return done(null, false, { message: 'That email is not registered' });
                }

                if (!user.password_hash) {
                    return done(null, false, { message: 'Please log in with your social account' });
                }

                const isMatch = await bcrypt.compare(password, user.password_hash);
                if (isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Password incorrect' });
                }
            } catch (err) {
                return done(err);
            }
        })
    );

    // Google Strategy
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback"
    },
        async (accessToken, refreshToken, profile, done) => {
            const newUser = {
                provider_id: profile.id,
                full_name: profile.displayName,
                email: profile.emails[0].value,
                avatar_url: profile.photos[0].value,
                auth_provider: 'google'
            };

            try {
                let [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [profile.emails[0].value]);
                let user = rows[0];

                if (user) {
                    // Determine if we need to update provider info?
                    // For MVP, just return user.
                    // If user exists but provider is different, we might want to handle linking, 
                    // but simpler logic: if email exists, log them in.
                    done(null, user);
                } else {
                    const [result] = await pool.query(
                        'INSERT INTO users (provider_id, full_name, email, avatar_url, auth_provider) VALUES (?, ?, ?, ?, ?)',
                        [newUser.provider_id, newUser.full_name, newUser.email, newUser.avatar_url, newUser.auth_provider]
                    );
                    // Fetch the new user
                    [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
                    done(null, rows[0]);
                }
            } catch (err) {
                console.error(err);
                done(err, null);
            }
        }));

    // GitHub Strategy
    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "/api/auth/github/callback",
        scope: ['user:email']
    },
        async (accessToken, refreshToken, profile, done) => {
            // Should handle case where email is private/null, but passport-github2 usually handles fetching emails if scope is set.
            // profile.emails might be empty if user has private email setting without extensive scope.
            const email = (profile.emails && profile.emails[0] && profile.emails[0].value) || `${profile.username}@github.placeholder`;

            const newUser = {
                provider_id: profile.id,
                full_name: profile.displayName || profile.username,
                email: email,
                avatar_url: profile.photos[0].value,
                auth_provider: 'github'
            };

            try {
                let [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]); // fallback logic might be needed for ID
                // Better to check provider_id first for social login
                if (rows.length === 0) {
                    [rows] = await pool.query('SELECT * FROM users WHERE provider_id = ? AND auth_provider = ?', [profile.id, 'github']);
                }

                let user = rows[0];

                if (user) {
                    done(null, user);
                } else {
                    const [result] = await pool.query(
                        'INSERT INTO users (provider_id, full_name, email, avatar_url, auth_provider) VALUES (?, ?, ?, ?, ?)',
                        [newUser.provider_id, newUser.full_name, newUser.email, newUser.avatar_url, newUser.auth_provider]
                    );
                    [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
                    done(null, rows[0]);
                }
            } catch (err) {
                console.error(err);
                done(err, null);
            }
        }));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
            if (rows && rows.length > 0) {
                done(null, rows[0]);
            } else {
                // User not found (e.g. deleted), treat as logged out
                done(null, null);
            }
        } catch (err) {
            console.error('Deserialization Error:', err);
            done(err, null);
        }
    });
};
