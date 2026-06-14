/* eslint-disable no-undef */
import request from 'supertest';
import app from '../../app';
import { VIDEOServices } from '../../app/Modules/Video/Video.service';
import mongoose from 'mongoose';

jest.mock('../../app/Modules/Video/Video.service');
jest.mock('../../app/Modules/Video/Video.utility');
jest.mock('../../app/Modules/Video/Video.llm.service');

// Mock authentication middleware
jest.mock('../../app/middlewares/auth', () => ({
  __esModule: true,
  default: (req: any, res: any, next: any) => {
    req.user = {
      _id: new mongoose.Types.ObjectId(),
      email: 'test@example.com',
      role: 'user',
    };
    next();
  },
}));

describe('Video API Integration Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/videos', () => {
    it('should return all videos', async () => {
      const mockVideos = [
        {
          _id: new mongoose.Types.ObjectId(),
          caption: 'Video 1',
          fileUrl: '/video-files/video1.mp4',
          status: 'completed',
          user: new mongoose.Types.ObjectId(),
        },
        {
          _id: new mongoose.Types.ObjectId(),
          caption: 'Video 2',
          fileUrl: '/video-files/video2.mp4',
          status: 'processing',
          user: new mongoose.Types.ObjectId(),
        },
      ];

      (VIDEOServices.getAllVIDEOsFromDB as jest.Mock).mockResolvedValue(
        mockVideos,
      );

      const response = await request(app).get('/api/v1/videos');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/v1/videos/:id', () => {
    it('should return a single video by id', async () => {
      const videoId = new mongoose.Types.ObjectId().toString();
      const mockVideo = {
        _id: videoId,
        caption: 'Test Video',
        fileUrl: '/video-files/test.mp4',
        status: 'completed',
        prediction: JSON.stringify({ result: 'success' }),
        user: new mongoose.Types.ObjectId(),
      };

      (VIDEOServices.getSingleVIDEOFromDB as jest.Mock).mockResolvedValue(
        mockVideo,
      );

      const response = await request(app).get(`/api/v1/videos/${videoId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.caption).toBe('Test Video');
    });

    it('should handle non-existent video', async () => {
      const videoId = new mongoose.Types.ObjectId().toString();

      (VIDEOServices.getSingleVIDEOFromDB as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get(`/api/v1/videos/${videoId}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeNull();
    });
  });

  describe('Video Status', () => {
    it('should handle processing status', async () => {
      const mockVideo = {
        _id: new mongoose.Types.ObjectId(),
        caption: 'Processing Video',
        fileUrl: '/video-files/processing.mp4',
        status: 'processing',
        user: new mongoose.Types.ObjectId(),
      };

      (VIDEOServices.getSingleVIDEOFromDB as jest.Mock).mockResolvedValue(
        mockVideo,
      );

      const response = await request(app).get(
        `/api/v1/videos/${mockVideo._id}`,
      );

      expect(response.body.data.status).toBe('processing');
      expect(response.body.data.prediction).toBeUndefined();
    });

    it('should handle completed status with prediction', async () => {
      const mockVideo = {
        _id: new mongoose.Types.ObjectId(),
        caption: 'Completed Video',
        fileUrl: '/video-files/completed.mp4',
        status: 'completed',
        prediction: JSON.stringify({
          detections: ['car', 'person'],
          confidence: 0.95,
        }),
        user: new mongoose.Types.ObjectId(),
      };

      (VIDEOServices.getSingleVIDEOFromDB as jest.Mock).mockResolvedValue(
        mockVideo,
      );

      const response = await request(app).get(
        `/api/v1/videos/${mockVideo._id}`,
      );

      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.prediction).toBeDefined();
    });

    it('should handle failed status with error', async () => {
      const mockVideo = {
        _id: new mongoose.Types.ObjectId(),
        caption: 'Failed Video',
        fileUrl: '/video-files/failed.mp4',
        status: 'failed',
        prediction: JSON.stringify({
          error: 'Processing timeout',
          errorCode: 'TIMEOUT',
        }),
        user: new mongoose.Types.ObjectId(),
      };

      (VIDEOServices.getSingleVIDEOFromDB as jest.Mock).mockResolvedValue(
        mockVideo,
      );

      const response = await request(app).get(
        `/api/v1/videos/${mockVideo._id}`,
      );

      expect(response.body.data.status).toBe('failed');
      expect(response.body.data.prediction).toContain('error');
    });
  });
});
