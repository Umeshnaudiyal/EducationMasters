export const requestLogger = (req, res, next) => {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const timeStr = new Date().toISOString();
    
    let statusSymbol = '🟢';
    if (statusCode >= 400 && statusCode < 500) statusSymbol = '🟡';
    if (statusCode >= 500) statusSymbol = '🔴';

    const logLine = `${statusSymbol} [API] [${timeStr}] ${method} ${originalUrl} -> Status ${statusCode} (${duration}ms)\n`;
    process.stdout.write(logLine);
  });

  next();
};
