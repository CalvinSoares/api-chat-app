import { Request, Response, NextFunction } from "express";
import User from "../models/UserModel";
import { sign } from "jsonwebtoken";
import dotenv from "dotenv";
import { compare } from "bcrypt";
import { renameSync, unlinkSync } from "fs";

dotenv.config();

const maxAge = 3 * 24 * 60 * 60 * 1000;

const jwt = process.env.JWT_KEY;

if (!jwt) {
  throw new Error("ORIGIN is not defined in environment variables");
}

const createToken = (email: string, userId: string) => {
  return sign({ email, userId }, jwt, { expiresIn: maxAge });
};

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send("Email and password is required");
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).send("Email already exists");
    }

    const user = await User.create({ email: email, password: password });
    res.cookie("jwt", createToken(email, user.id), {
      maxAge,
      secure: true,
    });
    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        profileSetup: user.profileSetup,
      },
    });
  } catch (error) {
    console.error({ error });
    res.status(500).send("Internal Server Error");
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send("Email and password is required");
    }

    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res.status(404).send("User does not exist");
    }

    const auth = await compare(password, existingUser.password);

    if (!auth) {
      return res.status(404).send("Password is incorrect");
    }

    res.cookie("jwt", createToken(email, existingUser.id), {
      maxAge,
      secure: true,
    });
    return res.status(200).json({
      user: {
        id: existingUser.id,
        email: existingUser.email,
        profileSetup: existingUser.profileSetup,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        image: existingUser.image,
        color: existingUser.color,
      },
    });
  } catch (error) {
    console.error({ error });
    res.status(500).send("Internal Server Error");
  }
};

export const getUserInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userData = await User.findById(req.userId);
    if (!userData) {
      return res.status(404).send("User not found");
    }
    return res.status(200).json({
      user: {
        id: userData.id,
        email: userData.email,
        profileSetup: userData.profileSetup,
        firstName: userData.firstName,
        lastName: userData.lastName,
        image: userData.image,
        color: userData.color,
      },
    });
  } catch (error) {
    console.error({ error });
    res.status(500).send("Internal Server Error");
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;
    const { firstName, lastName, color } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).send("Firstname lastname and color is required");
    }

    const userData = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, color, profileSetup: true },
      { new: true, runValidators: true }
    );

    if (!userData) {
      return res.status(404).send("User not found");
    }

    return res.status(200).json({
      user: {
        id: userData.id,
        email: userData.email,
        profileSetup: userData.profileSetup,
        firstName: userData.firstName,
        lastName: userData.lastName,
        image: userData.image,
        color: userData.color,
      },
    });
  } catch (error) {
    console.error({ error });
    res.status(500).send("Internal Server Error");
  }
};

export const addProfileImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }

    const date = Date.now();

    let fileName = "uploads/profiles/" + date + req.file.originalname;
    renameSync(req.file.path, fileName);

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { image: fileName },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).send("User not found");
    }

    return res.status(200).json({
      image: updatedUser.image,
    });
  } catch (error) {
    console.error({ error });
    res.status(500).send("Internal Server Error");
  }
};

export const removeProfileImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send("User not found");
    }

    if (user.image) {
      unlinkSync(user.image);
    }

    user.image = undefined;
    await user.save();

    return res.status(200).send("Profile image removed successfully");
  } catch (error) {
    console.error({ error });
    res.status(500).send("Internal Server Error");
  }
};

export const logOut = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.cookie("jwt", "", { maxAge: 1, secure: true, sameSite: true });

    return res.status(200).send("Logout successfull");
  } catch (error) {
    console.error({ error });
    res.status(500).send("Internal Server Error");
  }
};
