import { Router } from "express";
import { verifyToken } from "../middlewares/AuthMiddleware";
import { searchContacts } from "../controllers/ContactsController";

const contactsRoutes = Router();

contactsRoutes.post("/search", verifyToken, searchContacts);

export default contactsRoutes;
