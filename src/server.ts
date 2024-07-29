import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import http from "http";
import authRoutes from "./routes/AuthRoutes";
import contactsRoutes from "./routes/ContactsRoutes";
import setupSocket from "./socket";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const databaseURL = process.env.DATABASE_URL;
const origin = process.env.ORIGIN;

if (!origin) {
  throw new Error("ORIGIN is not defined in environment variables");
}

app.use(
  cors({
    origin: [origin],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.use("/uploads/profiles", express.static("uploads/profiles"));

app.use(cookieParser());

app.use(express.json());

app.use("/post/auth", authRoutes);
app.use("/api/contacts", contactsRoutes);

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

if (!databaseURL) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

setupSocket(server);

mongoose
  .connect(databaseURL)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB", error);
  });
