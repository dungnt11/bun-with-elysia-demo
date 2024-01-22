import { Schema, model } from 'mongoose';

const schema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // will not appear in the response
    },
  },
  {
    timestamps: true,
  }
);

export default model('user', schema);