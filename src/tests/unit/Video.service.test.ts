/* eslint-disable no-undef */
import { VIDEOServices } from '../../app/Modules/Video/Video.service';
import { VIDEO } from '../../app/Modules/Video/Video.model';
import { TVideo } from '../../app/Modules/Video/Video.interface';
import mongoose from 'mongoose';

jest.mock('../../app/Modules/Video/Video.model');

describe('Video Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createVIDEOIntoDB', () => {
    it('should create a video successfully', async () => {
      const mockVideo: TVideo = {
        caption: 'Test Video',
        fileUrl: '/video-files/test.mp4',
        status: 'processing',
        user: new mongoose.Types.ObjectId(),
      };

      const mockCreatedVideo = {
        _id: new mongoose.Types.ObjectId(),
        ...mockVideo,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (VIDEO.create as jest.Mock).mockResolvedValue(mockCreatedVideo);

      const result = await VIDEOServices.createVIDEOIntoDB(mockVideo);

      expect(VIDEO.create).toHaveBeenCalledWith(mockVideo);
      expect(result).toEqual(mockCreatedVideo);
      expect(result.caption).toBe(mockVideo.caption);
    });

    it('should throw error if video creation fails', async () => {
      const mockVideo: TVideo = {
        caption: 'Test Video',
        fileUrl: '/video-files/test.mp4',
        status: 'processing',
        user: new mongoose.Types.ObjectId(),
      };

      (VIDEO.create as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(VIDEOServices.createVIDEOIntoDB(mockVideo)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('getAllVIDEOsFromDB', () => {
    it('should return all videos with query builder', async () => {
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

      const mockQuery = {
        search: jest.fn().mockReturnThis(),
        filter: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        paginate: jest.fn().mockReturnThis(),
        fields: jest.fn().mockReturnThis(),
        modelQuery: Promise.resolve(mockVideos),
      };

      (VIDEO.find as jest.Mock).mockReturnValue(mockQuery);

      const result = await VIDEOServices.getAllVIDEOsFromDB({});

      expect(result).toEqual(mockVideos);
    });
  });

  describe('getSingleVIDEOFromDB', () => {
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

      (VIDEO.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockVideo),
      });

      const result = await VIDEOServices.getSingleVIDEOFromDB(videoId);

      expect(result).toEqual(mockVideo);
    });

    it('should return null for non-existent video', async () => {
      const videoId = new mongoose.Types.ObjectId().toString();

      (VIDEO.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const result = await VIDEOServices.getSingleVIDEOFromDB(videoId);

      expect(result).toBeNull();
    });
  });

  describe('updateVIDEOInDB', () => {
    it('should update video successfully', async () => {
      const videoId = new mongoose.Types.ObjectId().toString();
      const updateData: Partial<TVideo> = {
        status: 'completed',
        prediction: JSON.stringify({ result: 'analysis complete' }),
      };

      const mockUpdatedVideo = {
        _id: videoId,
        caption: 'Test Video',
        fileUrl: '/video-files/test.mp4',
        status: 'completed',
        prediction: JSON.stringify({ result: 'analysis complete' }),
        user: new mongoose.Types.ObjectId(),
      };

      (VIDEO.findByIdAndUpdate as jest.Mock).mockResolvedValue(
        mockUpdatedVideo,
      );

      const result = await VIDEOServices.updateVIDEOInDB(videoId, updateData);

      expect(VIDEO.findByIdAndUpdate).toHaveBeenCalledWith(
        videoId,
        updateData,
        { new: true },
      );
      expect(result).toEqual(mockUpdatedVideo);
      expect(result.status).toBe('completed');
    });

    it('should update failed video with error', async () => {
      const videoId = new mongoose.Types.ObjectId().toString();
      const updateData: Partial<TVideo> = {
        status: 'failed',
        prediction: JSON.stringify({
          error: 'Processing failed',
          errorCode: 'TIMEOUT',
        }),
      };

      const mockUpdatedVideo = {
        _id: videoId,
        caption: 'Test Video',
        fileUrl: '/video-files/test.mp4',
        status: 'failed',
        prediction: updateData.prediction,
        user: new mongoose.Types.ObjectId(),
      };

      (VIDEO.findByIdAndUpdate as jest.Mock).mockResolvedValue(
        mockUpdatedVideo,
      );

      const result = await VIDEOServices.updateVIDEOInDB(videoId, updateData);

      expect(result.status).toBe('failed');
      expect(result.prediction).toContain('error');
    });
  });
});
