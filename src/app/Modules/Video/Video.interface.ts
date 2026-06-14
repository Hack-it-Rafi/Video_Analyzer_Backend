import { Types } from 'mongoose';

export interface TVideo {
  caption: string;
  fileUrl: string;
  prediction?: string;
  status: 'processing' | 'completed' | 'failed';
  user?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  telegramChatId?: number;
}
