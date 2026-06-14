import { model, Schema } from 'mongoose';
import { TVideo } from './Video.interface';

const videoSchema = new Schema<TVideo>(
  {
    caption: {
      type: String,
    },
    fileUrl: {
      type: String,
    },
    prediction: {
      type: String,
    },
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'processing',
    },
    user: {
      type: Schema.Types.ObjectId,
      unique: false,
      ref: 'User',
    },
    telegramChatId: {
      type: Number,
    }
  },
  {
    timestamps: true,
  },
);

export const VIDEO = model<TVideo>('Video', videoSchema);

VIDEO.syncIndexes();
