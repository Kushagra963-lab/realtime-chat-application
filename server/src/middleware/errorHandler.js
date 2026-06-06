export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const status = error.statusCode || error.status || 500;
  const payload = {
    message: status === 500 ? "Internal server error" : error.message
  };

  if (process.env.NODE_ENV !== "production") {
    payload.stack = error.stack;
  }

  res.status(status).json(payload);
}

