import mongoose from "mongoose";
export function isObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}
