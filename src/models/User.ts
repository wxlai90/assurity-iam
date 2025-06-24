import * as MicrosoftGraph from "@microsoft/microsoft-graph-types";
import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Omit<Document, "id">, MicrosoftGraph.User {}

const userSchema = new Schema<IUser>(
  {
    id: { type: String, unique: true, index: true },
    userPrincipalName: { type: String, unique: true, index: true },
  },
  {
    id: false,
    timestamps: true,
  }
);

const UserModel = mongoose.model<IUser>("User", userSchema);

export default UserModel;
