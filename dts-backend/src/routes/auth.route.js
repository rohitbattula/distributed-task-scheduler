import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import User from "../models/User.js";
import { signJwt } from "../utils/jwt.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().trim().min(1).optional(),
});

router.post("/register", async (req, res, next) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body || {});
    const exists = await User.findOne({ email });
    if (exists)
      return res.status(409).json({ message: "email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, name });
    const token = signJwt({
      id: String(user._id),
      email: user.email,
      name: user.name,
    });

    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (err) {
    next(err);
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body || {});
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "invalid credentials" });

    const token = signJwt({
      id: String(user._id),
      email: user.email,
      name: user.name,
    });
    res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
