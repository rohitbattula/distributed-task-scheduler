import jwt from "jsonwebtoken";
import "dotenv/config";

const SECRET = process.env.JWT_SECRET || "dev_secret";
const EXPIRES = process.env.JWT_EXPIRES || "7d";

export function signJwt(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
}
export function verifyJwt(token) {
  return jwt.verify(token, SECRET);
}
