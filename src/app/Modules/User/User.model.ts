import { model, Schema } from "mongoose";
import { TUser } from "./User.interface";
import config from "../../config";
import bcrypt from 'bcryptjs';

const userSchema = new Schema<TUser>(
    {
      email: {
        type: String,
        required: true,
        unique: true,
      },
      phone: {
        type: String,
        required: true,
        unique: true,
      },
      name: {
        type: String,
        required: true,
      },
      totalPdf: {
        type: Number,
        default: 0,
      },
      photo: {
        type: String,
      },
      password: {
        type: String,
        default: "Ujjal123",
        select:0
      },
      role: {
        type: String,
        enum: ['user', 'admin'],
        default:'user'
      },
    },
    {
      timestamps: true,
    },
  );

  userSchema.pre('save', async function (next) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const user = this; // doc
    // hashing password and save into DB
    user.password = await bcrypt.hash(
      user.password,
      Number(config.bycrypt_salt_round),
    );
    next();
  });

  userSchema.post('save', function (doc, next) {
    doc.password = '';
    next();
  });
  

  export const User = model<TUser>('User', userSchema);