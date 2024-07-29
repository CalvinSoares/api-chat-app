import { Server as SockerIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http"; // ou "https" se você estiver usando https
import Message, { IMessage } from "./models/MessagesModel";

const setupSocket = (server: HttpServer) => {
  const io = new SockerIOServer(server, {
    cors: {
      origin: process.env.ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const userSocketMap = new Map<string, string>();

  const disconnect = (socket: Socket) => {
    console.log(`Client disconnected ${socket.id}`);
    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        console.log(`User disconnected: ${userId} with socket ID: ${socketId}`);
        break;
      }
    }
  };

  const sendMessage = async (message: IMessage) => {
    if (!message.sender) {
      throw new Error("Sender is required");
    }

    const senderSocketId = userSocketMap.get(String(message.sender));
    const recipientSocketId = userSocketMap.get(String(message.recipient));

    const createdMessage = await Message.create(message);

    const messageData = await Message.findById(createdMessage._id)
      .populate("sender", "id email firstName lastName image color")
      .populate("recipient", "id email firstName lastName image color");

    if (recipientSocketId) {
      io.to(recipientSocketId).emit("receiveMessage", messageData);
    }

    if (senderSocketId) {
      io.to(senderSocketId).emit("receiveMessage", messageData);
    }
  };

  io.on("connection", (socket: Socket) => {
    const userId = socket.handshake.query.userId as string;

    if (userId) {
      userSocketMap.set(userId, socket.id);
      console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
    } else {
      console.log("User ID not provided during connection");
    }

    socket.on("sendMessage", (message: IMessage) => {
      if (!message.sender) {
        console.error("Message sender is required");
        return;
      }
      sendMessage(message).catch(console.error);
    });

    socket.on("disconnect", () => disconnect(socket));
  });
};

export default setupSocket;
