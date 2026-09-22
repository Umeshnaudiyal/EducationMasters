import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import authService from '../services/auth.service.js';

export const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);
  res.status(201).json(new ApiResponse(201, result, 'User registered successfully'));
});

export const login = asyncHandler(async (req, res) => {
  const clientMeta = {
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || 'Unknown',
    userAgent: req.headers['user-agent'] || 'Unknown',
  };

  const result = await authService.loginUser(req.body, clientMeta);
  res.status(200).json(new ApiResponse(200, result, 'Login successful'));
});

export const logout = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.body?.userId || req.query?.userId;

  const clientMeta = {
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || 'Unknown',
    userAgent: req.headers['user-agent'] || 'Unknown',
  };

  const result = await authService.logoutUser(userId, clientMeta);
  res.status(200).json(new ApiResponse(200, result, 'Logged out successfully'));
});

export const getSessionInfo = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.query?.userId;
  const result = await authService.getSessionInfo(userId);
  res.status(200).json(new ApiResponse(200, result, 'Session info fetched successfully'));
});

export const getSessionLogs = asyncHandler(async (req, res) => {
  const result = await authService.getSessionLogs(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Session logs fetched successfully'));
});

export const getDailyDashboardLogs = asyncHandler(async (req, res) => {
  const result = await authService.getDailyDashboardLogs({
    date: req.query.date,
    search: req.query.search,
    role: req.query.role,
    currentUser: req.user,
  });
  res.status(200).json(new ApiResponse(200, result, 'Daily login logs fetched successfully'));
});

export const getUserCalendarHistory = asyncHandler(async (req, res) => {
  const targetUserId = req.query.userId || req.params.userId || req.user?._id;
  const result = await authService.getUserCalendarHistory({
    targetUserId,
    year: req.query.year,
    month: req.query.month,
    currentUser: req.user,
  });
  res.status(200).json(new ApiResponse(200, result, 'User calendar history fetched successfully'));
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(
    new ApiResponse(
      200,
      {
        user: {
          id: req.user._id,
          name: req.user.name,
          nicename: req.user.nicename,
          email: req.user.email,
          role: req.user.role,
          login_time: req.user.login_time,
          logout_time: req.user.logout_time,
          last_login_time: req.user.last_login_time,
          session_date: req.user.last_session_date,
          expires_at: req.user.session_expires_at,
        },
      },
      'Current user profile fetched successfully'
    )
  );
});
