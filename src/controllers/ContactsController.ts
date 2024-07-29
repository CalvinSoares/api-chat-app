import { Request, Response, NextFunction } from "express";
import User from "../models/UserModel";

export const searchContacts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { searchTerm } = req.body;

    if (searchTerm === undefined || searchTerm === null) {
      return res.status(400).send("searchTerm is required");
    }

    const sanitizedSearchTerm = searchTerm.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const regex = new RegExp(sanitizedSearchTerm, "i");

    const contacts = await User.find({
      $and: [
        { _id: { $ne: req.userId } },
        {
          $or: [{ email: regex }, { firstName: regex }, { lastName: regex }],
        },
      ],
    });

    return res.status(200).json({ contacts });
  } catch (error) {
    console.error({ error });
    res.status(500).send("Internal Server Error");
  }
};
