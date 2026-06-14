import { USER_ROLE } from "./User.constant"

export interface TUser {
  email: string;
  name: string;
  phone: string;
  totalPdf: number;
  password: string;
  photo: string;
  role: 'admin' | 'user';
};

export type TUserRole = keyof typeof USER_ROLE;