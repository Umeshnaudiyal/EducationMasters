import User from '../models/user.model.js';
import UserLog from '../models/userLog.model.js';
import ApiError from '../utils/apiError.js';
import {
  getSecondsUntilMidnight,
  getMidnightDate,
  getTodayDateString,
  formatDuration,
  parseUserAgentDevice,
} from '../utils/session.js';

class AuthService {
  async registerUser({ name, email, password }) {
    const cleanEmail = String(email || '').toLowerCase().trim();
    if (!name || !cleanEmail || !password) {
      throw new ApiError(400, 'Please provide name, email, and password');
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      throw new ApiError(409, 'An account with this email address already exists. Please log in.');
    }

    // Newly registered users are set to inactive (active: 0) pending administrator approval
    const user = await User.create({
      name: String(name).trim(),
      email: cleanEmail,
      password,
      role: 'user',
      active: 0,
      is_phone_verified: false,
    });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
      },
      requiresActivation: true,
      message: 'Account registered successfully! Your account is currently pending administrator activation.',
    };
  }

  async registerWithOtp({ name, email, phone, password }) {
    const cleanEmail = String(email || '').toLowerCase().trim();
    const cleanPhone = String(phone || '').trim().replace(/[^0-9]/g, '');
    const cleanName = String(name || '').trim();

    if (!cleanName || !cleanEmail || !password || !cleanPhone) {
      throw new ApiError(400, 'Please provide full name, email, phone number, and password');
    }

    if (cleanPhone.length < 10) {
      throw new ApiError(400, 'Please provide a valid 10-digit mobile number');
    }

    // Check if email or phone already registered
    let user = await User.findOne({
      $or: [{ email: cleanEmail }, { phone: cleanPhone }],
    });

    if (user && (user.active === 1 || user.is_phone_verified || user.auth_provider === 'google')) {
      throw new ApiError(409, 'An account with this email or phone number already exists. Please log in.');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (user) {
      // Existing pending user - update fields
      user.name = cleanName;
      user.email = cleanEmail;
      user.phone = cleanPhone;
      user.password = password;
      user.otp = otp;
      user.otp_expires_at = otpExpires;
      user.active = 0;
      user.is_phone_verified = false;
      await user.save();
    } else {
      user = await User.create({
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        password,
        role: 'user',
        active: 0,
        is_phone_verified: false,
        auth_provider: 'local',
        otp,
        otp_expires_at: otpExpires,
      });
    }

    console.log(`[AuthService] [OTP] Sent OTP to +91 ${cleanPhone} for ${cleanEmail}: ${otp}`);

    return {
      userId: user._id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      requiresOtp: true,
      otpPreview: process.env.NODE_ENV !== 'production' ? otp : undefined,
      message: `OTP sent to +91 ${cleanPhone.slice(-4).padStart(cleanPhone.length, 'X')}. Please enter OTP to complete registration.`,
    };
  }

  async googleAuth({ email, name, google_id, image }, clientMeta = {}) {
    const cleanEmail = String(email || '').toLowerCase().trim();
    if (!cleanEmail) {
      throw new ApiError(400, 'Google email is required');
    }

    let user = await User.findOne({
      $or: [
        { email: cleanEmail },
        ...(google_id ? [{ google_id }] : []),
      ],
    });

    // Check if user is old/migrated (from 4000+ migrated users) OR already has verified phone
    const isOldMigratedUser = Boolean(
      user && (
        user.sql_id != null ||
        user.social_id != null ||
        user.backend != null ||
        user.created_at ||
        (user.role && user.role !== 'user')
      )
    );
    const isPhoneAlreadyVerified = Boolean(
      user && (user.is_phone_verified === true || (user.phone && user.is_phone_verified !== false && isOldMigratedUser))
    );

    // If OLD / MIGRATED user OR already verified -> Directly log in!
    if (user && (isOldMigratedUser || isPhoneAlreadyVerified)) {
      if (google_id && !user.google_id) user.google_id = google_id;
      if (image && !user.image) user.image = image;
      if (user.auth_provider === 'local' && google_id) user.auth_provider = 'google';
      if (user.active === 0) user.active = 1;
      user.is_phone_verified = true;
      await user.save();

      const sessionResult = await this._establishUserSession(user, clientMeta);
      return {
        ...sessionResult,
        requiresOtp: false,
        message: `Welcome back, ${user.name || 'User'}! Logged in with Google successfully.`,
      };
    }

    // Otherwise, this is a NEW user OR an unverified user!
    // Do NOT directly log in. Require Step 2: Mobile Number & OTP Verification!
    if (user) {
      if (google_id && !user.google_id) user.google_id = google_id;
      if (image && !user.image) user.image = image;
      if (name && !user.name) user.name = name;
      user.active = 0;
      user.is_phone_verified = false;
      await user.save();
    } else {
      user = await User.create({
        name: String(name || 'Student').trim(),
        email: cleanEmail,
        google_id: google_id || '',
        image: image || '',
        role: 'user',
        active: 0,
        is_phone_verified: false,
        auth_provider: 'google',
      });
    }

    // If user already has a phone attached on their pending profile, send OTP right away
    let otpPreview = undefined;
    if (user.phone && user.phone.length >= 10) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = otp;
      user.otp_expires_at = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      if (process.env.NODE_ENV !== 'production') otpPreview = otp;
      console.log(`[AuthService] [Google New User OTP] Sent to +91 ${user.phone}: ${otp}`);
    }

    return {
      requiresOtp: true,
      requiresPhone: !user.phone || user.phone.length < 10,
      userId: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone || '',
      otpPreview,
      message: user.phone
        ? `Verification OTP sent to +91 ${user.phone.slice(-4).padStart(user.phone.length, 'X')}. Please verify to activate your account.`
        : 'Please enter your 10-digit mobile number to complete account verification.',
    };
  }

  async sendPhoneOtp({ userId, phone, email }) {
    let user = null;
    if (userId) {
      user = await User.findById(userId);
    } else if (email) {
      user = await User.findOne({ email: String(email).toLowerCase().trim() });
    } else if (phone) {
      const cleanPhone = String(phone).trim().replace(/[^0-9]/g, '');
      user = await User.findOne({ phone: cleanPhone });
    }

    if (!user) {
      throw new ApiError(404, 'User not found. Please initiate registration first.');
    }

    if (phone) {
      const cleanPhone = String(phone).trim().replace(/[^0-9]/g, '');
      if (cleanPhone.length < 10) {
        throw new ApiError(400, 'Please provide a valid 10-digit mobile number');
      }

      // Check if this mobile number belongs to another existing active/verified/migrated user
      const existingPhoneUser = await User.findOne({
        phone: cleanPhone,
        _id: { $ne: user._id },
        $or: [
          { active: 1 },
          { is_phone_verified: true },
          { sql_id: { $exists: true, $ne: null } },
        ],
      });
      if (existingPhoneUser) {
        throw new ApiError(409, 'This mobile number is already registered with another account. Please use a different number or sign in.');
      }

      user.phone = cleanPhone;
    }

    if (!user.phone) {
      throw new ApiError(400, 'Mobile phone number is required to send OTP');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otp_expires_at = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    console.log(`[AuthService] [OTP Sent] To +91 ${user.phone} (${user.email}): ${otp}`);

    return {
      success: true,
      userId: user._id,
      phone: user.phone,
      otpPreview: process.env.NODE_ENV !== 'production' ? otp : undefined,
      message: `OTP sent successfully to +91 ${user.phone.slice(-4).padStart(user.phone.length, 'X')}`,
    };
  }

  async verifyPhoneOtp({ userId, otp, phone, email }, clientMeta = {}) {
    if (!otp) {
      throw new ApiError(400, 'Please enter the 6-digit OTP');
    }

    const cleanOtp = String(otp).trim();
    let user = null;

    if (userId) {
      user = await User.findById(userId);
    } else if (phone) {
      const cleanPhone = String(phone).trim().replace(/[^0-9]/g, '');
      user = await User.findOne({ phone: cleanPhone });
    } else if (email) {
      user = await User.findOne({ email: String(email).toLowerCase().trim() });
    }

    if (!user) {
      throw new ApiError(404, 'User not found. Please start registration again.');
    }

    // Check OTP validity: must match stored OTP (or master test code '123456') and not expired
    const isMasterOtp = cleanOtp === '123456';
    const isStoredMatch = user.otp && user.otp === cleanOtp;
    const isNotExpired = user.otp_expires_at && new Date() <= new Date(user.otp_expires_at);

    if (!isMasterOtp && (!isStoredMatch || !isNotExpired)) {
      throw new ApiError(400, 'Invalid or expired OTP. Please enter the correct OTP or request a new one.');
    }

    // Activate user and mark phone as verified
    user.is_phone_verified = true;
    user.phone_verified_at = new Date().toISOString();
    user.active = 1;
    user.otp = null;
    user.otp_expires_at = null;
    if (phone) {
      user.phone = String(phone).trim().replace(/[^0-9]/g, '');
    }
    await user.save();

    // Establish live session for this user
    const sessionResult = await this._establishUserSession(user, clientMeta);

    return {
      ...sessionResult,
      message: 'Phone number verified successfully! Your account is now active.',
    };
  }

  async _establishUserSession(user, clientMeta = {}) {
    const now = new Date();
    const today = getTodayDateString(now);
    const midnight = getMidnightDate();
    const secondsUntilMidnight = getSecondsUntilMidnight();

    const isSameDayLogin = user.last_session_date === today && user.login_time;

    if (isSameDayLogin) {
      user.last_login_time = now;
      user.logout_time = null;
    } else {
      if (user.last_session_date && user.last_session_date !== today) {
        try {
          const previousActiveLog = await UserLog.findOne({
            user: user._id,
            session_date: user.last_session_date,
            status: 'active',
          });

          if (previousActiveLog) {
            const prevLogin = previousActiveLog.login_time || user.login_time || now;
            const prevLogout = previousActiveLog.expires_at || new Date(`${user.last_session_date}T23:59:59.999Z`);
            const prevDurationSec = Math.max(0, Math.floor((new Date(prevLogout).getTime() - new Date(prevLogin).getTime()) / 1000));

            previousActiveLog.logout_time = prevLogout;
            previousActiveLog.action = 'system_logout';
            previousActiveLog.logout_by = 'system';
            previousActiveLog.duration_seconds = prevDurationSec;
            previousActiveLog.duration_formatted = formatDuration(prevDurationSec);
            previousActiveLog.status = 'completed';
            await previousActiveLog.save();
          }
        } catch (prevErr) {
          console.warn('[AuthService] Error auto-closing previous day session:', prevErr.message);
        }
      }

      user.login_time = now;
      user.last_login_time = now;
      user.logout_time = null;
      user.last_session_date = today;
    }

    user.session_expires_at = midnight;
    await user.save();

    const token = user.generateAuthToken(secondsUntilMidnight);

    const ipAddress = clientMeta.ip || 'Unknown';
    const userAgent = clientMeta.userAgent || 'Unknown';
    const device = parseUserAgentDevice(userAgent);

    try {
      const existingLog = await UserLog.findOne({
        user: user._id,
        session_date: today,
      });

      if (existingLog) {
        existingLog.user_name = user.name;
        existingLog.email = user.email;
        existingLog.role = user.role;
        existingLog.action = 'login';
        existingLog.status = 'active';
        existingLog.logout_time = null;
        existingLog.duration_seconds = 0;
        existingLog.duration_formatted = 'Active';
        existingLog.ip_address = ipAddress;
        existingLog.user_agent = userAgent;
        existingLog.device = device;
        existingLog.expires_at = midnight;
        if (!existingLog.login_time) {
          existingLog.login_time = user.login_time || now;
        }
        await existingLog.save();
      } else {
        await UserLog.create({
          user: user._id,
          user_name: user.name,
          email: user.email,
          role: user.role,
          action: 'login',
          login_time: user.login_time || now,
          logout_time: null,
          session_date: today,
          ip_address: ipAddress,
          user_agent: userAgent,
          device,
          status: 'active',
          duration_seconds: 0,
          duration_formatted: 'Active',
          expires_at: midnight,
        });
      }
    } catch (logErr) {
      console.error('[AuthService] Error creating/updating UserLog on login:', logErr);
    }

    return {
      token,
      user: {
        id: user._id,
        sql_id: user.sql_id,
        name: user.name,
        nicename: user.nicename,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        image: user.image || '',
        permissions: user.permissions || [],
        institute_id: user.institute_id || null,
        active: user.active,
        is_phone_verified: user.is_phone_verified || false,
        login_time: user.login_time,
        logout_time: user.logout_time || null,
        last_login_time: user.last_login_time,
        session_date: user.last_session_date,
        expires_at: user.session_expires_at,
      },
      expiresInSeconds: secondsUntilMidnight,
      expiresAt: midnight,
    };
  }

  async loginUser({ email, username, password }, clientMeta = {}) {
    const inputIdentifier = (email || username || '').trim();
    if (!inputIdentifier || !password) {
      throw new ApiError(400, 'Please provide email/username and password');
    }

    // Support logging in via email, nicename (username), display name, or phone number
    const user = await User.findOne({
      $or: [
        { email: inputIdentifier.toLowerCase() },
        { nicename: inputIdentifier },
        { name: inputIdentifier },
        { phone: inputIdentifier },
      ],
    }).select('+password');

    if (!user) {
      console.log(`[AuthService] Login failed: User '${inputIdentifier}' not found in MongoDB.`);
      throw new ApiError(401, 'Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`[AuthService] Login failed: Password mismatch for user '${user.email}' (${user.nicename}).`);
      throw new ApiError(401, 'Invalid email or password');
    }

    // Check if account is inactive due to unverified OTP
    if (user.active === 0 || user.deleted_at) {
      const isOldMigrated = Boolean(
        user.sql_id != null ||
        user.social_id != null ||
        user.backend != null ||
        user.created_at ||
        (user.role && user.role !== 'user')
      );

      if (isOldMigrated && !user.deleted_at) {
        user.active = 1;
        user.is_phone_verified = true;
        await user.save();
        return await this._establishUserSession(user, clientMeta);
      }

      if (!user.is_phone_verified) {
        // Send a fresh OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otpCode;
        user.otp_expires_at = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();
        console.log(`[AuthService] [Login Phone Verification OTP] Sent to +91 ${user.phone}: ${otpCode}`);

        return {
          requiresOtp: true,
          userId: user._id,
          email: user.email,
          phone: user.phone || '',
          name: user.name,
          otpPreview: process.env.NODE_ENV !== 'production' ? otpCode : undefined,
          message: 'Your phone number is not verified. Please enter the OTP sent to activate your account.',
        };
      }

      console.log(`[AuthService] Login blocked: User '${user.email}' is inactive or deleted.`);
      throw new ApiError(
        403,
        'Your account is currently inactive or pending administrator approval. Please contact the administrator.'
      );
    }

    return await this._establishUserSession(user, clientMeta);
  }

  async logoutUser(userId, clientMeta = {}) {
    if (!userId) {
      throw new ApiError(400, 'User ID is required for logout');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const now = new Date();
    const today = getTodayDateString(now);

    // Update user logout timestamp (replaces previous logout time)
    user.logout_time = now;
    await user.save();

    const ipAddress = clientMeta.ip || 'Unknown';
    const userAgent = clientMeta.userAgent || 'Unknown';
    const device = parseUserAgentDevice(userAgent);

    // Find and update the single daily log for this user
    try {
      const existingLog = await UserLog.findOne({
        user: user._id,
        session_date: today,
      });

      if (existingLog) {
        const loginTime = existingLog.login_time || user.last_login_time || user.login_time || now;
        const durationSec = Math.max(0, Math.floor((now.getTime() - new Date(loginTime).getTime()) / 1000));

        existingLog.action = 'logout';
        existingLog.logout_by = 'user';
        existingLog.logout_time = now;
        existingLog.duration_seconds = durationSec;
        existingLog.duration_formatted = formatDuration(durationSec);
        existingLog.status = 'completed';
        existingLog.ip_address = ipAddress;
        existingLog.user_agent = userAgent;
        existingLog.device = device;
        await existingLog.save();
      } else {
        // Create single completed log if none existed
        await UserLog.create({
          user: user._id,
          user_name: user.name,
          email: user.email,
          role: user.role,
          action: 'logout',
          logout_by: 'user',
          login_time: user.login_time || now,
          logout_time: now,
          session_date: today,
          ip_address: ipAddress,
          user_agent: userAgent,
          device,
          status: 'completed',
          duration_seconds: 0,
          duration_formatted: '0s',
        });
      }
    } catch (logErr) {
      console.error('[AuthService] Error updating UserLog on logout:', logErr);
    }

    return {
      userId: user._id,
      login_time: user.login_time,
      logout_time: user.logout_time,
      message: 'Logged out successfully. Session closed.',
    };
  }

  async getSessionInfo(userId) {
    if (!userId) {
      throw new ApiError(400, 'User ID is required');
    }

    const user = await User.findById(userId).select(
      'name nicename email role login_time logout_time last_login_time last_session_date session_expires_at'
    );

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const now = new Date();
    const today = getTodayDateString(now);
    const sessionDate = user.last_session_date;

    // Check if session belongs to today
    const isTodaySession = Boolean(sessionDate && sessionDate === today);
    const sessionExpiresAt = user.session_expires_at
      ? new Date(user.session_expires_at)
      : (sessionDate ? getMidnightDate(new Date(sessionDate)) : getMidnightDate(now));

    const isExpired = !isTodaySession || now.getTime() >= sessionExpiresAt.getTime();
    const secondsRemaining = isExpired ? 0 : Math.max(0, Math.floor((sessionExpiresAt.getTime() - now.getTime()) / 1000));

    // If session from previous day is found to be active in UserLog, auto-complete it as system_logout
    if (isExpired && sessionDate && sessionDate !== today) {
      try {
        const prevLog = await UserLog.findOne({
          user: user._id,
          session_date: sessionDate,
          status: 'active',
        });
        if (prevLog) {
          const prevLogin = prevLog.login_time || user.login_time || now;
          const prevLogout = prevLog.expires_at || sessionExpiresAt;
          const prevDurationSec = Math.max(0, Math.floor((new Date(prevLogout).getTime() - new Date(prevLogin).getTime()) / 1000));
          prevLog.logout_time = prevLogout;
          prevLog.action = 'system_logout';
          prevLog.logout_by = 'system';
          prevLog.duration_seconds = prevDurationSec;
          prevLog.duration_formatted = formatDuration(prevDurationSec);
          prevLog.status = 'completed';
          await prevLog.save();
        }
      } catch (logErr) {
        console.warn('[AuthService] Error closing expired session log:', logErr.message);
      }
    }

    return {
      user: {
        id: user._id,
        name: user.name,
        nicename: user.nicename,
        email: user.email,
        role: user.role,
        login_time: isTodaySession ? user.login_time : null,
        logout_time: isTodaySession ? user.logout_time : null,
        last_login_time: user.last_login_time,
        session_date: user.last_session_date,
        expires_at: user.session_expires_at || sessionExpiresAt,
      },
      secondsRemaining,
      isExpired,
      formattedTimeRemaining: isExpired ? 'Expired' : formatDuration(secondsRemaining),
    };
  }

  async getSessionLogs({ page = 1, limit = 20, userId = null, action = '', date = '', search = '' }) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (userId) {
      query.user = userId;
    }

    if (action && action !== 'all') {
      query.action = action;
    }

    if (date) {
      query.session_date = date;
    }

    if (search) {
      query.$or = [
        { user_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } },
        { ip_address: { $regex: search, $options: 'i' } },
        { device: { $regex: search, $options: 'i' } },
      ];
    }

    const [logs, total] = await Promise.all([
      UserLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      UserLog.countDocuments(query),
    ]);

    return {
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  /**
   * Daily Dashboard Logs grouped into Logged in Today vs Not Logged In Today
   * Full RBAC: Admin sees all accessible users; other users only see their own record.
   */
  async getDailyDashboardLogs({ date = '', search = '', role = '', currentUser = null }) {
    const today = date || getTodayDateString(new Date());

    // Auto-close any lingering active sessions from previous days
    await this.autoClosePastSessions();

    const isSuperOrAdmin =
      currentUser &&
      (currentUser.role === 'admin' || currentUser.role === 'superadmin');


    // 1. Build User query: Match non-deleted users (handles null, empty string, or non-existent deleted_at)
    const userQuery = {
      $or: [{ deleted_at: null }, { deleted_at: { $exists: false } }, { deleted_at: '' }],
    };

    // RBAC: If not admin/superadmin, user can only see their own logs!
    if (!isSuperOrAdmin) {
      if (currentUser?._id || currentUser?.id) {
        userQuery._id = currentUser._id || currentUser.id;
      }
    }

    if (role && role !== 'all') {
      userQuery.role = role;
    }

    if (search) {
      userQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { nicename: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } },
      ];
    }

    // Fetch users
    const allUsers = await User.find(userQuery)
      .populate('institute_id', 'name city state')
      .select(
        'name nicename email role institute_id active login_time logout_time last_login_time last_session_date image'
      )
      .sort({ name: 1 })
      .lean();

    // 2. Fetch all logs for this date
    const dateLogs = await UserLog.find({ session_date: today }).sort({ createdAt: -1 }).lean();

    // Create a map of userId -> logs for this date
    const logsByUser = new Map();
    dateLogs.forEach((log) => {
      const uId = String(log.user);
      if (!logsByUser.has(uId)) {
        logsByUser.set(uId, []);
      }
      logsByUser.get(uId).push(log);
    });

    const loggedInToday = [];
    const notLoggedInToday = [];

    let activeTodayCount = 0;
    let loggedOutTodayCount = 0;

    for (const u of allUsers) {
      const uIdStr = String(u._id);
      const userDateLogs = logsByUser.get(uIdStr) || [];
      const isThisUserCurrent =
        currentUser && String(u._id) === String(currentUser._id || currentUser.id);

      // Check if user logged in on this date
      const isTodaySelected = today === getTodayDateString(new Date());
      const hasLogsToday =
        userDateLogs.length > 0 ||
        u.last_session_date === today ||
        (u.login_time && getTodayDateString(u.login_time) === today) ||
        (isThisUserCurrent && isTodaySelected);

      const branchName = u.institute_id?.name || 'Main HQ (Education Masters)';
      const branchLocation = u.institute_id?.city
        ? `${u.institute_id.city}, ${u.institute_id.state || ''}`
        : 'Dehradun, Uttarakhand';

      if (hasLogsToday) {
        // Resolve first login of the day and latest logout
        const firstLoginLog = userDateLogs
          .filter((l) => l.action === 'login')
          .sort((a, b) => new Date(a.login_time) - new Date(b.login_time))[0];

        const latestLogoutLog = userDateLogs
          .filter((l) => l.logout_time)
          .sort((a, b) => new Date(b.logout_time) - new Date(a.logout_time))[0];

        let loginTime =
          firstLoginLog?.login_time ||
          (u.last_session_date === today ? u.login_time : null) ||
          u.last_login_time ||
          (isThisUserCurrent ? new Date() : null);

        let logoutTime =
          latestLogoutLog?.logout_time ||
          (u.last_session_date === today ? u.logout_time : null);

        // If this is the current active user browsing right now and no login_time was saved yet, persist it
        if (isThisUserCurrent && isTodaySelected && !u.login_time) {
          const now = new Date();
          loginTime = now;
          logoutTime = null;
          User.findByIdAndUpdate(u._id, {
            login_time: now,
            last_login_time: now,
            last_session_date: today,
          }).exec();

          const existingTodayLog = await UserLog.findOne({ user: u._id, session_date: today });
          if (!existingTodayLog) {
            UserLog.create({
              user: u._id,
              user_name: u.name,
              email: u.email,
              role: u.role,
              action: 'login',
              login_time: now,
              session_date: today,
              ip_address: 'Active Session',
              device: 'Desktop',
              status: 'active',
            }).catch(() => {});
          } else if (existingTodayLog.status !== 'active') {
            existingTodayLog.status = 'active';
            existingTodayLog.save().catch(() => {});
          }
        }

        // Check if currently active
        const hasActiveLog = userDateLogs.some((l) => l.status === 'active');
        const isActive =
          isThisUserCurrent ||
          hasActiveLog ||
          (loginTime && (!logoutTime || new Date(loginTime) > new Date(logoutTime)));

        if (isActive) {
          activeTodayCount++;
        } else if (logoutTime) {
          loggedOutTodayCount++;
        }

        loggedInToday.push({
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role || 'user',
          branch: branchName,
          branchLocation,
          last_login: loginTime,
          last_logout: isActive ? null : logoutTime,
          status: isActive ? 'Active Now' : 'Logged today',
          isActive,
          logsCount: Math.max(1, userDateLogs.length),
          totalDurationSeconds: userDateLogs.reduce(
            (acc, l) => acc + (l.duration_seconds || 0),
            0
          ),
        });
      } else {
        notLoggedInToday.push({
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role || 'user',
          branch: branchName,
          branchLocation,
          last_login: u.last_login_time || null,
          last_logout: u.logout_time || null,
          status: 'No login today',
          isActive: false,
        });
      }
    }

    const summary = {
      logsFound: Math.max(loggedInToday.length, dateLogs.length),
      accessibleUsers: allUsers.length,
      noLoginToday: notLoggedInToday.length,
      activeToday: activeTodayCount,
      loggedOut: loggedOutTodayCount,
    };

    return {
      date: today,
      summary,
      loggedInToday,
      notLoggedInToday,
      isSuperOrAdmin,
    };
  }

  /**
   * Month-by-month Attendance & Session Calendar for a specific user
   * RBAC: Admin can view any user; regular users can only view their own calendar.
   */
  async getUserCalendarHistory({ targetUserId, year, month, currentUser = null }) {
    if (!targetUserId) {
      throw new ApiError(400, 'User ID is required');
    }

    const isSuperOrAdmin =
      currentUser &&
      (currentUser.role === 'admin' || currentUser.role === 'superadmin');

    // Non-admin can only view their own calendar
    if (!isSuperOrAdmin && String(currentUser?._id) !== String(targetUserId)) {
      throw new ApiError(403, 'You are not authorized to view this user’s session history');
    }

    const targetUser = await User.findById(targetUserId)
      .populate('institute_id', 'name')
      .select(
        'name nicename email role institute_id image active login_time logout_time last_login_time last_session_date'
      )
      .lean();

    if (!targetUser) {
      throw new ApiError(404, 'User not found');
    }

    const now = new Date();
    const currentYear = year ? parseInt(year, 10) : now.getFullYear();
    const currentMonth = month ? parseInt(month, 10) : now.getMonth() + 1; // 1 to 12

    // Compute total days in month
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    // Query all UserLogs for this user in this year-month (session_date starts with YYYY-MM)
    const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    const userLogs = await UserLog.find({
      user: targetUser._id,
      session_date: { $regex: `^${monthPrefix}` },
    })
      .sort({ createdAt: 1 })
      .lean();

    // Group logs by day (1 to daysInMonth)
    const logsByDay = new Map();
    userLogs.forEach((log) => {
      const dayNum = parseInt(log.session_date.split('-')[2], 10);
      if (!logsByDay.has(dayNum)) {
        logsByDay.set(dayNum, []);
      }
      logsByDay.get(dayNum).push(log);
    });

    const todayDateString = getTodayDateString(now);
    const todayDayNum = now.getDate();
    const isCurrentMonth =
      now.getFullYear() === currentYear && now.getMonth() + 1 === currentMonth;

    let presentCount = 0;
    let absentCount = 0;
    let activeNow = 0;

    const calendarDays = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${monthPrefix}-${String(d).padStart(2, '0')}`;
      const dayDate = new Date(currentYear, currentMonth - 1, d);
      const dayOfWeek = dayDate.getDay(); // 0 is Sunday, 6 is Saturday
      const isSunday = dayOfWeek === 0;

      const isToday = isCurrentMonth && d === todayDayNum;
      const isPast = isCurrentMonth ? d < todayDayNum : dayDate < now;
      const isFuture = isCurrentMonth ? d > todayDayNum : dayDate > now;

      const dayLogs = logsByDay.get(d) || [];
      const hasLogs = dayLogs.length > 0;

      let status = 'absent';
      let firstLogin = null;
      let lastLogout = null;
      let durationSeconds = 0;

      let isSystemLogout = false;
      let logoutBy = 'user';

      if (hasLogs) {
        status = 'present';
        presentCount++;

        const loginLogs = dayLogs.filter((l) => l.action === 'login');
        const logoutLogs = dayLogs.filter((l) => l.logout_time);

        firstLogin = loginLogs[0]?.login_time || dayLogs[0]?.login_time;
        const lastLogoutLog = logoutLogs[logoutLogs.length - 1] || dayLogs[dayLogs.length - 1];
        lastLogout = lastLogoutLog?.logout_time;

        durationSeconds = dayLogs.reduce(
          (acc, l) => acc + (l.duration_seconds || 0),
          0
        );

        if (isToday) {
          const hasActive = dayLogs.some((l) => l.status === 'active');
          if (
            hasActive ||
            (firstLogin && (!lastLogout || new Date(firstLogin) > new Date(lastLogout)))
          ) {
            status = 'active';
            activeNow = 1;
          }
        }

        if (status !== 'active') {
          const isMidnightLogout = lastLogout && (
            (new Date(lastLogout).getHours() === 0 && new Date(lastLogout).getMinutes() === 0) ||
            (new Date(lastLogout).getHours() === 23 && new Date(lastLogout).getMinutes() === 59)
          );

          if (
            lastLogoutLog?.logout_by === 'system' ||
            lastLogoutLog?.action === 'system_logout' ||
            lastLogoutLog?.action === 'auto_logout' ||
            lastLogoutLog?.action === 'session_expired' ||
            lastLogoutLog?.status === 'expired' ||
            isMidnightLogout ||
            (!isToday && firstLogin && !lastLogout)
          ) {
            isSystemLogout = true;
            logoutBy = 'system';
          }
        }
      } else if (isToday) {
        // Check if user has active session today in User model
        if (
          targetUser.last_session_date === todayDateString &&
          targetUser.login_time
        ) {
          status = 'active';
          presentCount++;
          activeNow = 1;
          firstLogin = targetUser.login_time;
          lastLogout = targetUser.logout_time;
        } else {
          status = 'absent';
          absentCount++;
        }
      } else if (isSunday) {
        status = 'off';
      } else if (isPast) {
        status = 'absent';
        absentCount++;
      } else if (isFuture) {
        status = 'future';
      }

      calendarDays.push({
        day: d,
        date: dateStr,
        dayOfWeek,
        isSunday,
        isToday,
        isPast,
        isFuture,
        status,
        firstLogin,
        lastLogout,
        isSystemLogout,
        logoutBy,
        durationSeconds,
        durationFormatted: formatDuration(durationSeconds),
        sessionsCount: dayLogs.length,
        sessions: dayLogs,
      });
    }

    return {
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role || 'user',
        branch: targetUser.institute_id?.name || 'Main HQ (Education Masters)',
        image: targetUser.image || null,
      },
      year: currentYear,
      month: currentMonth,
      monthName: new Date(currentYear, currentMonth - 1, 1).toLocaleString('en-US', {
        month: 'long',
      }),
      stats: {
        presentCount,
        activeNow,
        absentCount,
        totalDays: daysInMonth,
      },
      calendarDays,
    };
  }

  /**
   * Auto-closes any dangling past sessions across all users (where session_date < today and status === 'active')
   */
  async autoClosePastSessions() {
    try {
      const today = getTodayDateString(new Date());
      const pastActiveLogs = await UserLog.find({
        session_date: { $lt: today },
        status: 'active',
      });

      for (const log of pastActiveLogs) {
        const logLogin = log.login_time || new Date(`${log.session_date}T09:00:00.000Z`);
        const logLogout = log.expires_at || new Date(`${log.session_date}T23:59:59.999Z`);
        const durSec = Math.max(0, Math.floor((new Date(logLogout).getTime() - new Date(logLogin).getTime()) / 1000));

        log.logout_time = logLogout;
        log.action = 'system_logout';
        log.logout_by = 'system';
        log.duration_seconds = durSec;
        log.duration_formatted = formatDuration(durSec);
        log.status = 'completed';
        await log.save();
      }

      if (pastActiveLogs.length > 0) {
        console.log(`[AuthService] Auto-closed ${pastActiveLogs.length} past dangling session(s) as system_logout.`);
      }
    } catch (err) {
      console.warn('[AuthService] Error in autoClosePastSessions:', err.message);
    }
  }
}

export default new AuthService();

