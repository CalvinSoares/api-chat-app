import mongoose, { Document } from "mongoose";

export interface IMessage extends Document {
  sender: mongoose.Schema.Types.ObjectId;
  recipient?: mongoose.Schema.Types.ObjectId;
  messageType: "text" | "file";
  content?: string;
  fileUrl?: string;
  timestamp: Date;
}

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: false,
  },
  messageType: {
    type: String,
    enum: ["text", "file"],
    required: true,
  },
  content: {
    type: String,
    required: function (this: IMessage) {
      return this.messageType === "text";
    },
  },
  fileUrl: {
    type: String,
    required: function (this: IMessage) {
      return this.messageType === "file";
    },
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Message = mongoose.model<IMessage>("Message", messageSchema);

export default Message;
