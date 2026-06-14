/* eslint-disable no-undef */
import mongoose from 'mongoose';
import { VIDEO } from '../../app/Modules/Video/Video.model';
import { TVideo } from '../../app/Modules/Video/Video.interface';

describe('Video Model Test', () => {
  beforeAll(async () => {
    const url =
      process.env.TEST_DATABASE_URL || 'mongodb://localhost:27017/test-db';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(url);
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await VIDEO.deleteMany({});
  });

  describe('Video Creation', () => {
    it('should create a new video successfully', async () => {
      const videoData: TVideo = {
        caption: 'Test Video',
        fileUrl: '/video-files/test.mp4',
        status: 'processing',
        user: new mongoose.Types.ObjectId(),
      };

      const video = await VIDEO.create(videoData);

      expect(video).toBeDefined();
      expect(video.caption).toBe(videoData.caption);
      expect(video.fileUrl).toBe(videoData.fileUrl);
      expect(video.status).toBe('processing');
      expect(video.user).toEqual(videoData.user);
    });

    it('should set default status to processing', async () => {
      const videoData = {
        caption: 'Test Video',
        fileUrl: '/video-files/test.mp4',
        user: new mongoose.Types.ObjectId(),
      };

      const video = await VIDEO.create(videoData);

      expect(video.status).toBe('processing');
    });

    it('should allow completed status', async () => {
      const videoData: TVideo = {
        caption: 'Completed Video',
        fileUrl: '/video-files/completed.mp4',
        status: 'completed',
        prediction: JSON.stringify({ result: 'success' }),
        user: new mongoose.Types.ObjectId(),
      };

      const video = await VIDEO.create(videoData);

      expect(video.status).toBe('completed');
      expect(video.prediction).toBeDefined();
    });

    it('should allow failed status', async () => {
      const videoData: TVideo = {
        caption: 'Failed Video',
        fileUrl: '/video-files/failed.mp4',
        status: 'failed',
        prediction: JSON.stringify({ error: 'Processing failed' }),
        user: new mongoose.Types.ObjectId(),
      };

      const video = await VIDEO.create(videoData);

      expect(video.status).toBe('failed');
    });

    it('should store telegram chat id', async () => {
      const videoData: TVideo = {
        caption: 'Telegram Video',
        fileUrl: '/video-files/telegram.mp4',
        status: 'processing',
        user: new mongoose.Types.ObjectId(),
        telegramChatId: 123456789,
      };

      const video = await VIDEO.create(videoData);

      expect(video.telegramChatId).toBe(123456789);
    });
  });

  describe('Video Query', () => {
    beforeEach(async () => {
      const userId = new mongoose.Types.ObjectId();

      await VIDEO.create({
        caption: 'Video 1',
        fileUrl: '/video-files/video1.mp4',
        status: 'completed',
        user: userId,
      });

      await VIDEO.create({
        caption: 'Video 2',
        fileUrl: '/video-files/video2.mp4',
        status: 'processing',
        user: userId,
      });
    });

    it('should find video by id', async () => {
      const createdVideo = await VIDEO.findOne({ caption: 'Video 1' });
      const foundVideo = await VIDEO.findById(createdVideo?._id);

      expect(foundVideo).toBeDefined();
      expect(foundVideo?.caption).toBe('Video 1');
    });

    it('should return all videos', async () => {
      const videos = await VIDEO.find({});

      expect(videos).toHaveLength(2);
    });

    it('should filter videos by status', async () => {
      const completedVideos = await VIDEO.find({ status: 'completed' });

      expect(completedVideos).toHaveLength(1);
      expect(completedVideos[0].caption).toBe('Video 1');
    });

    it('should populate user data', async () => {
      const video = await VIDEO.findOne({ caption: 'Video 1' }).populate(
        'user',
      );

      expect(video).toBeDefined();
      expect(video?.user).toBeDefined();
    });
  });

  describe('Video Update', () => {
    it('should update video status', async () => {
      const video = await VIDEO.create({
        caption: 'Update Test',
        fileUrl: '/video-files/update.mp4',
        status: 'processing',
        user: new mongoose.Types.ObjectId(),
      });

      const updatedVideo = await VIDEO.findByIdAndUpdate(
        video._id,
        {
          status: 'completed',
          prediction: JSON.stringify({ result: 'analysis complete' }),
        },
        { new: true },
      );

      expect(updatedVideo?.status).toBe('completed');
      expect(updatedVideo?.prediction).toBeDefined();
    });
  });

  describe('Video Deletion', () => {
    it('should delete video successfully', async () => {
      const video = await VIDEO.create({
        caption: 'Delete Test',
        fileUrl: '/video-files/delete.mp4',
        status: 'processing',
        user: new mongoose.Types.ObjectId(),
      });

      await VIDEO.deleteOne({ _id: video._id });

      const deletedVideo = await VIDEO.findById(video._id);
      expect(deletedVideo).toBeNull();
    });
  });
});
