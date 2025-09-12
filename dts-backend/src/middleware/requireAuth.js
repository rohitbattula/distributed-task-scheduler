import { verifyJwt } from "../utils/jwt.js";

export function requireAuth(req, res, next) {
  const h = req.headers.authorization || "";
  const [, token] = h.split(" ");
  if (!token) return res.status(401).json({ message: "missing bearer token" });

  try {
    const decoded = verifyJwt(token);
    // minimal user object on request
    req.user = { id: decoded.id, email: decoded.email, name: decoded.name };
    next();
  } catch (e) {
    return res.status(401).json({ message: "invalid token" });
  }
}
