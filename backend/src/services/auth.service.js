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
      throw new ApiError(400, 'User with this email already exists');
    }

    // Newly registered users are set to inactive (active: 0) pending administrator approval
    const user = await User.create({
      name: String(name).trim(),
      email: cleanEmail,
      password,
      role: 'user',
      active: 0,
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

    // Block inactive or deleted accounts
    if (user.active === 0 || user.deleted_at) {
      console.log(`[AuthService] Login blocked: User '${user.email}' is inactive or deleted.`);
      throw new ApiError(
        403,
        'Your account is currently inactive or pending administrator approval. Please contact the administrator.'
      );
    }

    const now = new Date();
    const today = getTodayDateString(now);
    const midnight = getMidnightDate();
    const secondsUntilMidnight = getSecondsUntilMidnight();

    // Session logic:
    // If the user already logged in today (same day session), PRESERVE the initial login_time.
    // If it is a new day or first login, set login_time to now.
    const isSameDayLogin = user.last_session_date === today && user.login_time;

    if (isSameDayLogin) {
      // Same day login: login_time remains the initial login time of today!
      user.last_login_time = now;
    } else {
      // First login of the day or after midnight expiry:
      user.login_time = now;
      user.last_login_time = now;
      user.last_session_date = today;
    }

    user.session_expires_at = midnight;
    await user.save();

    // Generate JWT token that strictly expires at 12:00 AM midnight
    const token = user.generateAuthToken(secondsUntilMidnight);

    // Create or update single daily UserLog audit entry for this login
    const ipAddress = clientMeta.ip || 'Unknown';
    const userAgent = clientMeta.userAgent || 'Unknown';
    const device = parseUserAgentDevice(userAgent);

    try {
      const existingLog = await UserLog.findOne({
        user: user._id,
        session_date: today,
      });

      if (existingLog) {
        // Update existing daily log for this user
        existingLog.user_name = user.name;
        existingLog.email = user.email;
        existingLog.role = user.role;
        existingLog.action = 'login';
        existingLog.status = 'active';
        existingLog.ip_address = ipAddress;
        existingLog.user_agent = userAgent;
        existingLog.device = device;
        existingLog.expires_at = midnight;
        if (!existingLog.login_time) {
          existingLog.login_time = user.login_time || now;
        }
        await existingLog.save();
      } else {
        // Create single daily log
        await UserLog.create({
          user: user._id,
          user_name: user.name,
          email: user.email,
          role: user.role,
          action: 'login',
          login_time: user.login_time || now,
          session_date: today,
          ip_address: ipAddress,
          user_agent: userAgent,
          device,
          status: 'active',
          expires_at: midnight,
        });
      }
    } catch (logErr) {
      console.error('[AuthService] Error creating/updating UserLog on login:', logErr);
    }

    return {
      user: {
        id: user._id,
        sql_id: user.sql_id,
        name: user.name,
        nicename: user.nicename,
        email: user.email,
        role: user.role,
        active: user.active,
        login_time: user.login_time,
        logout_time: user.logout_time || null,
        last_login_time: user.last_login_time,
        session_date: user.last_session_date,
        expires_at: user.session_expires_at,
      },
      token,
      expiresInSeconds: secondsUntilMidnight,
      expiresAt: midnight,
    };
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
          action: 'login',
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
    const midnight = getMidnightDate();
    const secondsRemaining = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));

    return {
      user: {
        id: user._id,
        name: user.name,
        nicename: user.nicename,
        email: user.email,
        role: user.role,
        login_time: user.login_time,
        logout_time: user.logout_time,
        last_login_time: user.last_login_time,
        session_date: user.last_session_date,
        expires_at: user.session_expires_at || midnight,
      },
      secondsRemaining,
      isExpired: secondsRemaining <= 0,
      formattedTimeRemaining: formatDuration(secondsRemaining),
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

      if (hasLogs) {
        status = 'present';
        presentCount++;

        const loginLogs = dayLogs.filter((l) => l.action === 'login');
        const logoutLogs = dayLogs.filter((l) => l.logout_time);

        firstLogin = loginLogs[0]?.login_time || dayLogs[0]?.login_time;
        lastLogout =
          logoutLogs[logoutLogs.length - 1]?.logout_time ||
          dayLogs[dayLogs.length - 1]?.logout_time;

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
}

export default new AuthService();
