import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { redis } from "../lib/redis.js";

const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
    });

    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "7d",
    });

    return { accessToken, refreshToken };
}

const storeRefreshToken = async (userId, refreshToken) => {
    await redis.set(`refreshToken:${userId}`, refreshToken, "EX", 7 * 24 * 60 * 60);
}

const setCookies = (res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true, //prevents XSS attacks
        sameSite: "strict", //prevents CSRF attacks
        secure: process.env.NODE_ENV === "production",
        maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true, //prevents XSS attacks
        sameSite: "strict", //prevents CSRF attacks
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
}


export const signup = async (req, res) => {
    const { email, password, name } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const user = await User.create({ email, password, name });

        //authenticate
        const { accessToken, refreshToken } = generateTokens(user._id);
        await storeRefreshToken(user._id, refreshToken);

        setCookies(res, accessToken, refreshToken);

        res.status(201).json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email
            },
            message: "User created successfully"
        });
    } catch (error) {
        console.log("error in signup controller", + error.message)
        res.status(500).json({ message: error.message });
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await user.comparePassword(password))) {
            const { accessToken, refreshToken } = generateTokens(user._id);

            await storeRefreshToken(user._id, refreshToken);

            setCookies(res, accessToken, refreshToken);

            res.json({
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email
                },
                message: "Login successful"
            })
        }
    } catch (error) {
        console.log("error in login controller", + error.message);
        res.status(500).json({ message: error.message });
    }
}

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            await redis.del(`refreshToken:${decoded.userId}`);
        }

        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.json({ message: "Logout successful" });
    } catch (error) {
        console.log("error in logout controller", + error.message)
        res.status(500).json({ message: error.message || "Server Error" });
    }
}

export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ message: "no refresh token provided" });
        }

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const storedToken = await redis.get(`refreshToken:${decoded.userId}`);

        if (refreshToken !== storedToken) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        const accessToken = jwt.sign({ userId: decoded.userId }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "15m",
        });

        res.cookie("accessToken", accessToken, {
            httpOnly: true, //prevents XSS attacks
            sameSite: "strict", //prevents CSRF attacks
            secure: process.env.NODE_ENV === "production",
            maxAge: 15 * 60 * 1000,
        });

        res.json({ message: "Token refreshed successfully" });
    } catch (error) {
        console.log("error in refresh token controller", + error)
        res.status(500).json({ message: error.message || "Server Error" });
    }
}