require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
mongoose.set("bufferCommands", false);
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const path = require("path");
const crypto = require("crypto");

// Models
const User = require("./models/User");
class AuditLog {
    constructor(data) {
        this.data = data;
    }
    async save() {
        console.log(`[AUDIT LOG] ${new Date().toISOString()} - Action: ${this.data.action}, Email: ${this.data.email || 'unknown'}, IP: ${this.data.ip_address}, Status: ${this.data.status}, Reason: ${this.data.reason || 'N/A'}`);
        return this;
    }
    static async create(data) {
        console.log(`[AUDIT LOG] ${new Date().toISOString()} - Action: ${data.action}, Email: ${data.email || 'unknown'}, IP: ${data.ip_address}, Status: ${data.status}, Reason: ${data.reason || 'N/A'}`);
        return data;
    }
}
const InvitationKey = require("./models/InvitationKey");
const InvitationRequest = require("./models/InvitationRequest");

const app = express();
const PORT = process.env.PORT || 5000;

// Rate Limiter
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 auth requests per windowMs
    message: { message: "Too many authentication attempts. Please try again later." }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || "session_secret_cryptomin_2026_secure_key!",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 60 * 1000 // 30 minutes
    }
}));
app.use(cors({
    origin: [
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5000",
        "http://127.0.0.1:5000"
    ],
    credentials: true
}));

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// Database Connection Event Listeners
mongoose.connection.on("connected", () => {
    console.log("[MongoDB] Connection established successfully.");
});
mongoose.connection.on("error", (err) => {
    console.error("[MongoDB] Connection error occurred:", err);
});
mongoose.connection.on("disconnected", () => {
    console.warn("[MongoDB] Connection disconnected.");
});

// Mail Transporter Setup
let transporter;
async function initMailTransporter() {
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    if (smtpUser && smtpPass) {
        const mailConfig = {
            auth: {
                user: smtpUser,
                pass: smtpPass
            }
        };
        if (process.env.SMTP_HOST) {
            mailConfig.host = process.env.SMTP_HOST;
            mailConfig.port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
            mailConfig.secure = mailConfig.port === 465;
        } else {
            mailConfig.service = process.env.EMAIL_SERVICE || "Gmail";
        }
        transporter = nodemailer.createTransport(mailConfig);
        console.log("[Nodemailer] Configured with production SMTP.");
    } else {
        try {
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: testAccount.smtp.host,
                port: testAccount.smtp.port,
                secure: testAccount.smtp.secure,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
            console.log("[Nodemailer] Configured with Ethereal testing account.");
            console.log(`[Nodemailer] Testing User: ${testAccount.user}`);
        } catch (err) {
            console.warn("[Nodemailer] Ephemeral test account generation failed. Mail features will print to console.");
        }
    }
}
initMailTransporter();

// Helper: Send mail
async function sendMail(to, subject, text, html) {
    if (!transporter) {
        console.log("\n================ MAIL LOG ================");
        console.log(`To: ${to}\nSubject: ${subject}\nText: ${text}`);
        console.log("==========================================\n");
        return;
    }
    try {
        const info = await transporter.sendMail({
            from: `"CRYPTOMIN Ledger Vaults" <no-reply@cryptomin.com>`,
            to,
            subject,
            text,
            html
        });
        const testUrl = nodemailer.getTestMessageUrl(info);
        if (testUrl) {
            console.log(`\n[Nodemailer] Testing mail sent. View link: ${testUrl}`);
            console.log(`[Nodemailer] Verification Code/Link content: ${text}\n`);
        }
    } catch (err) {
        console.error("[Nodemailer] Mail sending failed:", err);
        throw err;
    }
}



// JWT helper
function generateTokens(user) {
    const accessToken = jwt.sign(
        { user_id: user._id, email: user.email, full_name: user.full_name, role: user.role },
        process.env.JWT_SECRET || "supersecretjwtsecret12345!",
        { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign(
        { user_id: user._id },
        process.env.JWT_REFRESH_SECRET || "supersecretrefreshjwtsecret12345!",
        { expiresIn: "7d" }
    );
    return { accessToken, refreshToken };
}

// --- SECURE ADMIN AUTHENTICATION MIDDLEWARE & ROUTES ---
const requireAdminAuth = (req, res, next) => {
    if (req.session && req.session.isAdmin) {
        next();
    } else {
        res.redirect("/admin-login");
    }
};

// Lockout tracking for admin login
const loginAttempts = {};

function recordFailedAttempt(ip) {
    if (!loginAttempts[ip]) {
        loginAttempts[ip] = { count: 0, lockoutUntil: null };
    }
    const attempt = loginAttempts[ip];
    attempt.count += 1;
    if (attempt.count >= 5) {
        attempt.lockoutUntil = Date.now() + 15 * 60 * 1000; // 15 minutes lockout
        attempt.count = 0; // reset counter after locking
    }
}

// Page Routes
app.get("/admin-login", (req, res) => {
    if (req.session && req.session.isAdmin) {
        return res.redirect("/admin-dashboard");
    }
    res.sendFile(path.join(__dirname, "admin-login.html"));
});

app.get(["/admin", "/admin-dashboard", "/operator-console"], requireAdminAuth, (req, res) => {
    res.sendFile(path.join(__dirname, "admin-dashboard.html"));
});

// API Routes
app.post("/api/admin/login", async (req, res) => {
    const { username, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;

    // lockout check
    if (loginAttempts[ip]) {
        const attempt = loginAttempts[ip];
        if (attempt.lockoutUntil && attempt.lockoutUntil > Date.now()) {
            const minutesLeft = Math.ceil((attempt.lockoutUntil - Date.now()) / (60 * 1000));
            await AuditLog.create({
                email: username || "unknown",
                ip_address: ip,
                action: "failed_login",
                status: "failure",
                reason: `Admin login lockout active. Expires in ${minutesLeft}m.`
            });
            return res.status(429).json({ message: `Too many failed attempts. Locked out. Try again in ${minutesLeft} minutes.` });
        }
    }

    const adminUser = process.env.ADMIN_USERNAME || "admin_operator";
    const adminHash = process.env.ADMIN_PASSWORD_HASH;

    if (!adminHash) {
        console.error("ADMIN_PASSWORD_HASH environment variable is missing!");
        return res.status(500).json({ message: "Server configuration error." });
    }

    if (username !== adminUser) {
        recordFailedAttempt(ip);
        await AuditLog.create({
            email: username || "unknown",
            ip_address: ip,
            action: "failed_login",
            status: "failure",
            reason: "Invalid Administrative Credentials (username mismatch)"
        });
        return res.status(401).json({ message: "Invalid Administrative Credentials" });
    }

    try {
        const match = await bcrypt.compare(password, adminHash);
        if (!match) {
            recordFailedAttempt(ip);
            await AuditLog.create({
                email: username,
                ip_address: ip,
                action: "failed_login",
                status: "failure",
                reason: "Invalid Administrative Credentials (password mismatch)"
            });
            return res.status(401).json({ message: "Invalid Administrative Credentials" });
        }

        // Success: reset attempts
        if (loginAttempts[ip]) {
            delete loginAttempts[ip];
        }

        req.session.isAdmin = true;
        req.session.adminUsername = username;

        await AuditLog.create({
            email: username,
            ip_address: ip,
            action: "login",
            status: "success"
        });

        res.json({ success: true, redirect: "/admin-dashboard" });
    } catch (err) {
        console.error("[Admin Auth] Login error:", err);
        res.status(500).json({ message: "Internal server error during authentication." });
    }
});

app.post("/api/admin/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("[Admin Auth] Logout error:", err);
            return res.status(500).json({ message: "Logout failed" });
        }
        res.clearCookie("connect.sid");
        res.json({ success: true, redirect: "/admin-login" });
    });
});

// --- AUTH ROUTES ---

// 1. User Registration
app.post("/api/auth/register", authLimiter, async (req, res) => {
    const { full_name, email, password, confirm_password, invitation_key } = req.body;
    const ip = req.ip || req.connection.remoteAddress;

    // Input fields verification
    if (!full_name || !email || !password || !confirm_password) {
        return res.status(400).json({ message: "All input fields are required." });
    }

    // Validate invitation key
    try {
        const userCount = await User.countDocuments();
        const isFirstUser = userCount === 0;

        if (!isFirstUser) {
            if (!invitation_key) {
                return res.status(400).json({ message: "Invalid invitation key. Access denied." });
            }
            const keyRecord = await InvitationKey.findOne({ key: invitation_key });
            if (!keyRecord || !keyRecord.active) {
                return res.status(400).json({ message: "Invalid invitation key. Access denied." });
            }
            if (keyRecord.used) {
                return res.status(400).json({ message: "This invitation key has already been activated." });
            }
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Error validating invitation key." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Please enter a valid email address." });
    }

    if (password !== confirm_password) {
        return res.status(400).json({ message: "Passwords do not match." });
    }

    if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    // Check strength
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasNonsAlphanumeric = /\W/.test(password);
    if (!(hasUpperCase && hasLowerCase && (hasNumbers || hasNonsAlphanumeric))) {
        return res.status(400).json({ message: "Password is too weak. Ensure it has upper, lower, and numeric or special characters." });
    }

    try {
        // Check unique email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email is already registered." });
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const password_hash = await bcrypt.hash(password, salt);

        // Generate OTP token (6 digits)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

        const userCount = await User.countDocuments();
        const role = userCount === 0 ? "admin" : "user";

        const user = new User({
            full_name,
            email,
            password_hash,
            role,
            invitation_key: invitation_key || null,
            verification_token: otp,
            verification_token_expires: otpExpires,
            email_verified: false
        });
        await user.save();

        // Audit Log
        await new AuditLog({
            user_id: user._id,
            email: email,
            ip_address: ip,
            action: "registration",
            status: "success"
        }).save();

        // Send Email
        const mailText = `Your identity authorization security code is: ${otp}. This code expires in 15 minutes.`;
        const mailHtml = `
            <div style="background:#030308; color:#ffffff; padding:30px; border-radius:12px; font-family:'Outfit',sans-serif; border:1px solid #00f0ff;">
                <h2 style="color:#00f0ff;">CRYPTOMIN Authorization Engine</h2>
                <p>Welcome to the node network, ${full_name}.</p>
                <p>Verify your security email using the OTP token below:</p>
                <div style="background:#080816; border:1px dashed #00f0ff; padding:20px; font-size:24px; font-weight:700; text-align:center; color:#00f0ff; letter-spacing:4px; margin:20px 0;">
                    ${otp}
                </div>
                <p style="color:#718096; font-size:12px;">This node token expires in 15 minutes. If you did not make this request, please audit your access security logs.</p>
            </div>
        `;
        await sendMail(email, "System Node Verification OTP", mailText, mailHtml);

        res.status(201).json({ message: "Node credentials staged. Verify your email to activate.", email });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server registry error. Please try again." });
    }
});

// 2. Verify Email OTP
app.post("/api/auth/verify", authLimiter, async (req, res) => {
    const { email, code } = req.body;
    const ip = req.ip || req.connection.remoteAddress;

    if (!email || !code) {
        return res.status(400).json({ message: "Email and verification code are required." });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found." });
        }

        if (user.email_verified) {
            return res.status(400).json({ message: "Account is already active." });
        }

        if (user.verification_token !== code) {
            return res.status(400).json({ message: "Invalid verification code." });
        }

        if (user.verification_token_expires < new Date()) {
            return res.status(400).json({ message: "Verification code has expired. Request a new OTP." });
        }

        user.email_verified = true;
        user.verification_token = null;
        user.verification_token_expires = null;
        await user.save();

        // Mark invitation key as used
        if (user.invitation_key) {
            try {
                const keyRecord = await InvitationKey.findOne({ key: user.invitation_key });
                if (keyRecord) {
                    keyRecord.used = true;
                    keyRecord.used_by = user.email;
                    keyRecord.used_at = new Date();
                    await keyRecord.save();
                }
            } catch (err) {
                console.error("Failed to mark invitation key as used:", err);
            }
        }

        // Log Verification
        await new AuditLog({
            user_id: user._id,
            email: email,
            ip_address: ip,
            action: "verification",
            status: "success"
        }).save();

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Store refresh token in secure cookie
        res.cookie("jid", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
            message: "Account successfully activated.",
            accessToken,
            user: {
                full_name: user.full_name,
                email: user.email
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to verify. Try again." });
    }
});

// 3. Resend OTP
app.post("/api/auth/resend-otp", authLimiter, async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found." });
        if (user.email_verified) return res.status(400).json({ message: "Account is already verified." });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.verification_token = otp;
        user.verification_token_expires = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();

        const mailText = `Your new identity verification code is: ${otp}`;
        const mailHtml = `<h3>OTP Code: ${otp}</h3>`;
        await sendMail(email, "Resent Verification OTP", mailText, mailHtml);

        res.status(200).json({ message: "Verification code resent." });
    } catch (err) {
        res.status(500).json({ message: "Error resending code." });
    }
});

// 5. Token Refresh
app.post("/api/auth/refresh", async (req, res) => {
    const token = req.cookies.jid;
    if (!token) return res.status(401).json({ message: "No refresh token provided." });

    try {
        const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET || "supersecretrefreshjwtsecret12345!");
        const user = await User.findById(payload.user_id);
        if (!user) return res.status(401).json({ message: "User not found." });

        const { accessToken } = generateTokens(user);
        res.status(200).json({ accessToken });
    } catch (err) {
        res.status(401).json({ message: "Invalid or expired refresh token." });
    }
});

// 6. Logout
app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("jid");
    res.status(200).json({ message: "Node session disconnected." });
});

// 7. Forgot Password
app.post("/api/auth/forgot-password", authLimiter, async (req, res) => {
    const { email } = req.body;
    const ip = req.ip || req.connection.remoteAddress;

    if (!email) return res.status(400).json({ message: "Email is required." });

    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            // Keep generic message for security, but log it internally
            return res.status(200).json({ message: "If the email exists, a password recovery link has been sent." });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        user.reset_password_token = resetToken;
        user.reset_password_expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry
        await user.save();

        // Log request
        await new AuditLog({
            user_id: user._id,
            email: email,
            ip_address: ip,
            action: "reset_password_request",
            status: "success"
        }).save();

        const host = req.get("host");
        const protocol = req.protocol;
        const resetLink = `${protocol}://${host}/reset-password.html?token=${resetToken}`;

        const mailText = `Restore your passkey using this link: ${resetLink}`;
        const mailHtml = `
            <div style="background:#030308; color:#ffffff; padding:30px; border-radius:12px; font-family:'Outfit',sans-serif; border:1px solid #ffbd3d;">
                <h2 style="color:#ffbd3d;">CRYPTOMIN Account Recovery</h2>
                <p>We received an identity restore request for your account.</p>
                <p>Click the link below to restore your passkey:</p>
                <div style="text-align:center; margin:30px 0;">
                    <a href="${resetLink}" style="background:#ffbd3d; color:#030308; padding:12px 24px; border-radius:6px; font-weight:700; text-decoration:none; display:inline-block;">
                        Restore Access Passkey
                    </a>
                </div>
                <p style="color:#718096; font-size:12px;">This secure restoration link expires in 1 hour. If you did not make this request, audit your nodes immediately.</p>
            </div>
        `;
        await sendMail(email, "System Staged Password Recovery", mailText, mailHtml);

        res.status(200).json({ message: "If the email exists, a password recovery link has been sent." });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to dispatch recovery link." });
    }
});

// 8. Reset Password
app.post("/api/auth/reset-password", authLimiter, async (req, res) => {
    const { token, password, confirm_password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;

    if (!token || !password || !confirm_password) {
        return res.status(400).json({ message: "All input fields are required." });
    }

    if (password !== confirm_password) {
        return res.status(400).json({ message: "Passwords do not match." });
    }

    if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    try {
        const user = await User.findOne({
            reset_password_token: token,
            reset_password_expires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ message: "Recovery token is invalid or has expired." });
        }

        // Check password strength
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasNonsAlphanumeric = /\W/.test(password);
        if (!(hasUpperCase && hasLowerCase && (hasNumbers || hasNonsAlphanumeric))) {
            return res.status(400).json({ message: "Password is too weak." });
        }

        const salt = await bcrypt.genSalt(12);
        user.password_hash = await bcrypt.hash(password, salt);
        user.reset_password_token = null;
        user.reset_password_expires = null;
        await user.save();

        // Audit Log success
        await new AuditLog({
            user_id: user._id,
            email: user.email,
            ip_address: ip,
            action: "reset_password_success",
            status: "success"
        }).save();

        res.status(200).json({ message: "Passkey updated successfully. You can now log in." });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Restoration failed. Try requesting a new recovery link." });
    }
});

// Me Auth check
app.get("/api/auth/me", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized node connection." });
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecretjwtsecret12345!");
        const user = await User.findById(decoded.user_id).select("full_name email role");
        if (!user) return res.status(401).json({ message: "User not found." });
        res.status(200).json({ user });
    } catch (err) {
        res.status(401).json({ message: "Session expired or signature invalid." });
    }
});

// Admin Authentication Middleware
const isAdmin = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized node connection." });
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecretjwtsecret12345!");
        const user = await User.findById(decoded.user_id);
        if (!user || user.role !== "admin") {
            return res.status(403).json({ message: "Forbidden. Admin authority required." });
        }
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Session expired or signature invalid." });
    }
};

// Admin Endpoints for managing invitation keys
// 1. List invitation keys
app.get("/api/admin/invitations", isAdmin, async (req, res) => {
    try {
        const keys = await InvitationKey.find().sort({ created_at: -1 });
        res.status(200).json({ keys });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch invitation keys." });
    }
});

// 2. Generate a key
app.post("/api/admin/invitations/generate", isAdmin, async (req, res) => {
    try {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let keyStr = "MINER-";
        for (let i = 0; i < 54; i++) {
            keyStr += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        const newKey = new InvitationKey({ key: keyStr });
        await newKey.save();

        res.status(201).json({ message: "Invitation key generated successfully.", key: newKey });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to generate key." });
    }
});

// 3. Toggle active status of a key
app.post("/api/admin/invitations/:id/toggle-active", isAdmin, async (req, res) => {
    try {
        const keyRecord = await InvitationKey.findById(req.params.id);
        if (!keyRecord) {
            return res.status(404).json({ message: "Invitation key not found." });
        }
        keyRecord.active = !keyRecord.active;
        await keyRecord.save();
        res.status(200).json({ message: `Key status updated to ${keyRecord.active ? 'active' : 'inactive'}.`, key: keyRecord });
    } catch (err) {
        res.status(500).json({ message: "Failed to update key status." });
    }
});

// 4. Toggle used status of a key
app.post("/api/admin/invitations/:id/toggle-used", isAdmin, async (req, res) => {
    try {
        const keyRecord = await InvitationKey.findById(req.params.id);
        if (!keyRecord) {
            return res.status(404).json({ message: "Invitation key not found." });
        }
        keyRecord.used = !keyRecord.used;
        if (keyRecord.used) {
            keyRecord.used_by = keyRecord.used_by || "Admin Manual";
            keyRecord.used_at = keyRecord.used_at || new Date();
        } else {
            keyRecord.used_by = null;
            keyRecord.used_at = null;
        }
        await keyRecord.save();
        res.status(200).json({ message: `Key status updated to ${keyRecord.used ? 'used' : 'unused'}.`, key: keyRecord });
    } catch (err) {
        res.status(500).json({ message: "Failed to update key status." });
    }
});

// 5. Delete a key
app.delete("/api/admin/invitations/:id", isAdmin, async (req, res) => {
    try {
        const keyRecord = await InvitationKey.findByIdAndDelete(req.params.id);
        if (!keyRecord) {
            return res.status(404).json({ message: "Invitation key not found." });
        }
        res.status(200).json({ message: "Invitation key deleted successfully." });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete key." });
    }
});

// Rate limiter specifically for invitation requests
const inviteRequestLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: { message: "Too many invitation requests from this IP. Please try again later." }
});

// Public endpoint: Submit invitation request
app.post("/api/auth/request-invitation", inviteRequestLimiter, async (req, res) => {
    const { full_name, email, country, telegram, occupation, experience_level, purpose } = req.body;
    const ip = req.ip || req.connection.remoteAddress || "127.0.0.1";

    // Server-side validation
    if (!full_name || !email || !country || !experience_level || !purpose) {
        return res.status(400).json({ message: "All required fields must be filled." });
    }

    const validLevels = ["Beginner", "Intermediate", "Advanced"];
    if (!validLevels.includes(experience_level)) {
        return res.status(400).json({ message: "Invalid experience level selected." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Please enter a valid email address." });
    }

    try {
        // 1. Duplicate email protection
        const existingRequest = await InvitationRequest.findOne({
            email: email.toLowerCase(),
            status: { $in: ["Pending", "Pending Notification", "Approved", "Invitation Sent"] }
        });
        if (existingRequest) {
            await new AuditLog({
                email: email.toLowerCase(),
                ip_address: ip,
                action: "invitation_request_submitted",
                status: "failure",
                reason: "Duplicate request detected"
            }).save();
            return res.status(400).json({ message: "An active invitation request has already been submitted for this email address." });
        }

        // 2. Cooldown period (24 hours check)
        const cooldownWindow = 24 * 60 * 60 * 1000;
        const lastRequest = await InvitationRequest.findOne({
            $or: [
                { email: email.toLowerCase() },
                { ip_address: ip }
            ]
        }).sort({ created_at: -1 });

        if (lastRequest) {
            const timeSinceLast = Date.now() - new Date(lastRequest.created_at).getTime();
            if (timeSinceLast < cooldownWindow) {
                const hoursLeft = Math.ceil((cooldownWindow - timeSinceLast) / (60 * 60 * 1000));
                await new AuditLog({
                    email: email.toLowerCase(),
                    ip_address: ip,
                    action: "invitation_request_submitted",
                    status: "failure",
                    reason: `Cooldown active. Wait ${hoursLeft} hours`
                }).save();
                return res.status(429).json({ message: `Submission cooldown active. Please wait ${hoursLeft} hours before resubmitting.` });
            }
        }

        // 3. Generate unique request ID matching format REQ-XXXXXXXX
        let requestId = "";
        let isUnique = false;
        while (!isUnique) {
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            let randPart = "";
            for (let i = 0; i < 8; i++) {
                randPart += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            requestId = `REQ-${randPart}`;
            const existing = await InvitationRequest.findOne({ request_id: requestId });
            if (!existing) isUnique = true;
        }

        // 4. Save to database BEFORE sending email (starts as "Pending")
        const newRequest = new InvitationRequest({
            request_id: requestId,
            full_name,
            email: email.toLowerCase(),
            country,
            telegram: telegram || "",
            occupation: occupation || "",
            experience_level,
            purpose,
            ip_address: ip,
            status: "Pending"
        });
        await newRequest.save();

        // 5. Send Email using env variable ADMIN_EMAIL (never hardcoded)
        const adminEmail = process.env.ADMIN_EMAIL;
        if (!adminEmail) {
            console.error("[Configuration Error] process.env.ADMIN_EMAIL is missing.");
            throw new Error("Admin email is not configured in server environment.");
        }

        const submissionTime = new Date().toLocaleString();
        const mailText = `New Access Invitation Request received.\n\nRequest ID: ${requestId}\nName: ${full_name}\nEmail: ${email}\nCountry: ${country}\nTelegram: ${telegram || 'N/A'}\nOccupation: ${occupation || 'N/A'}\nExperience Level: ${experience_level}\nPurpose: ${purpose}\nSubmission Time: ${submissionTime}`;
        
        const mailHtml = `
            <div style="background:#030308; color:#ffffff; padding:30px; border-radius:12px; font-family:'Outfit',sans-serif; border:1px solid #ffbd3d;">
                <h2 style="color:#ffbd3d; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px;">New Platform Access Request</h2>
                <p>A new operator access invitation request has been submitted and is pending review.</p>
                <table style="width:100%; border-collapse:collapse; margin-top:20px; font-size:14px; color:#cbd5e1;">
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:8px 0; font-weight:700; width:150px;">Request ID:</td><td style="padding:8px 0; color:#ffbd3d; font-family:monospace;">${requestId}</td></tr>
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:8px 0; font-weight:700;">Full Name:</td><td style="padding:8px 0;">${full_name}</td></tr>
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:8px 0; font-weight:700;">Email:</td><td style="padding:8px 0;">${email}</td></tr>
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:8px 0; font-weight:700;">Country:</td><td style="padding:8px 0;">${country}</td></tr>
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:8px 0; font-weight:700;">Telegram:</td><td style="padding:8px 0;">${telegram || 'N/A'}</td></tr>
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:8px 0; font-weight:700;">Occupation:</td><td style="padding:8px 0;">${occupation || 'N/A'}</td></tr>
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:8px 0; font-weight:700;">Exp. Level:</td><td style="padding:8px 0;">${experience_level}</td></tr>
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:8px 0; font-weight:700; vertical-align:top;">Purpose:</td><td style="padding:8px 0; line-height:1.4;">${purpose}</td></tr>
                    <tr><td style="padding:8px 0; font-weight:700;">Submitted At:</td><td style="padding:8px 0;">${submissionTime}</td></tr>
                </table>
            </div>
        `;

        let emailSent = false;
        try {
            await sendMail(adminEmail, `[NEW REQUEST] Access Invitation - ${requestId}`, mailText, mailHtml);
            emailSent = true;
        } catch (mailErr) {
            console.error("[Nodemailer] Failed to notify admin:", mailErr);
            // 6. If email delivery fails, status = Pending Notification
            newRequest.status = "Pending Notification";
            await newRequest.save();
        }

        // 10. Log for auditing
        await new AuditLog({
            email: email.toLowerCase(),
            ip_address: ip,
            action: "invitation_request_submitted",
            status: "success",
            reason: emailSent ? "Submitted and email notified" : "Submitted but admin notification failed (Pending Notification)"
        }).save();

        // 4. Return exact message
        res.status(201).json({ 
            message: "Your invitation request has been submitted successfully.\n\nOur team will review your application.\n\nPlease allow up to 7 business days for a response.", 
            request_id: requestId 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to submit request." });
    }
});

// Chatbot endpoint removed - Miranova AI runs locally on client-side


// Admin endpoint: List all invitation requests
app.get("/api/admin/requests", isAdmin, async (req, res) => {
    try {
        const requests = await InvitationRequest.find().sort({ created_at: -1 });
        res.status(200).json({ requests });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch invitation requests." });
    }
});

// Admin endpoint: Approve request (generates a key and emails it)
app.post("/api/admin/requests/:id/approve", isAdmin, async (req, res) => {
    try {
        const request = await InvitationRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: "Request not found." });
        }

        if (request.status !== "Pending" && request.status !== "Pending Notification") {
            return res.status(400).json({ message: `Request is already ${request.status.toLowerCase()}.` });
        }

        // Generate key
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let keyStr = "MINER-";
        for (let i = 0; i < 54; i++) {
            keyStr += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        const newKey = new InvitationKey({ key: keyStr });
        await newKey.save();

        request.status = "Approved";
        await request.save();

        // Send Email
        const mailText = `Congratulations! Your operator request has been approved. Your invitation key is: ${keyStr}`;
        const mailHtml = `
            <div style="background:#030308; color:#ffffff; padding:30px; border-radius:12px; font-family:'Outfit',sans-serif; border:1px solid #ffbd3d;">
                <h2 style="color:#ffbd3d;">CRYPTOMIN Request Approved</h2>
                <p>Hello ${request.full_name},</p>
                <p>Your platform access request has been reviewed and approved by the network administration.</p>
                <p>Use the following 60-character invitation key to register your account:</p>
                <div style="background:#080816; border:1px dashed #ffbd3d; padding:20px; font-size:16px; font-weight:700; text-align:center; color:#ffbd3d; word-break:break-all; margin:20px 0; font-family:monospace;">
                    ${keyStr}
                </div>
                <p style="color:#718096; font-size:12px;">This invitation key can only be activated once. Do not share it.</p>
            </div>
        `;

        let emailSent = false;
        try {
            await sendMail(request.email, "Operator Access Request Approved", mailText, mailHtml);
            request.status = "Invitation Sent";
            await request.save();
            emailSent = true;
        } catch (mailErr) {
            console.error("[Nodemailer] Approved key email failed:", mailErr);
        }

        // Log action (Req 10)
        await new AuditLog({
            user_id: req.user._id,
            email: request.email,
            ip_address: req.ip || req.connection.remoteAddress || "127.0.0.1",
            action: "invitation_request_approved",
            status: "success",
            reason: emailSent ? "Approved and invitation sent" : "Approved but email failed (status Approved)"
        }).save();

        res.status(200).json({ message: "Request approved and invitation key generated.", key: keyStr, status: request.status });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to approve request." });
    }
});

// Admin endpoint: Reject request
app.post("/api/admin/requests/:id/reject", isAdmin, async (req, res) => {
    try {
        const request = await InvitationRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: "Request not found." });
        }

        if (request.status !== "Pending" && request.status !== "Pending Notification") {
            return res.status(400).json({ message: `Request is already ${request.status.toLowerCase()}.` });
        }

        request.status = "Rejected";
        await request.save();

        // Send Email
        const mailText = `We regret to inform you that your operator request has been rejected.`;
        const mailHtml = `
            <div style="background:#030308; color:#ffffff; padding:30px; border-radius:12px; font-family:'Outfit',sans-serif; border:1px solid #ff3838;">
                <h2 style="color:#ff3838;">CRYPTOMIN Request Rejected</h2>
                <p>Hello ${request.full_name},</p>
                <p>We regret to inform you that your platform access request has been rejected during administrative review.</p>
                <p style="color:#718096; font-size:12px;">For security or operational reasons, access cannot be granted at this time.</p>
            </div>
        `;
        try {
            await sendMail(request.email, "Operator Access Request Update", mailText, mailHtml);
        } catch (mailErr) {
            console.error("[Nodemailer] Reject notification email failed:", mailErr);
        }

        // Log action (Req 10)
        await new AuditLog({
            user_id: req.user._id,
            email: request.email,
            ip_address: req.ip || req.connection.remoteAddress || "127.0.0.1",
            action: "invitation_request_rejected",
            status: "success"
        }).save();

        res.status(200).json({ message: "Request rejected successfully." });
    } catch (err) {
        res.status(500).json({ message: "Failed to reject request." });
    }
});

// Startup Health Check Route
app.get("/api/health", (req, res) => {
    const dbState = mongoose.connection.readyState;
    const states = ["disconnected", "connected", "connecting", "disconnecting"];
    if (dbState === 1) {
        return res.status(200).json({ status: "healthy", database: states[dbState] });
    } else {
        return res.status(503).json({ status: "unhealthy", database: states[dbState] });
    }
});

// For any other route, serve index.html (fallback SPA style)
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Start Server after Database Connection (Optional connection)
const startExpressServer = () => {
    app.listen(PORT, () => {
        console.log(`\n=================== SERVER UP ===================`);
        console.log(`[Express] Listening at http://localhost:${PORT}`);
        console.log(`=================================================\n`);
    });
};

console.log("[MongoDB] Initializing connection to database...");
mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/cryptomin", {
    serverSelectionTimeoutMS: 2000
})
    .then(() => {
        console.log("[MongoDB] Database connected successfully. Starting Express server...");
        startExpressServer();
    })
    .catch(err => {
        console.warn("\n[MongoDB] WARNING: Connection failure. MongoDB is currently unavailable.");
        console.warn("[MongoDB] Continuing server startup without database...\n");
        startExpressServer();
    });
