export function notFound(_req, _res, next) {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Internal Error",
    stack: err.stack, // keep visible for dev
  });
}
