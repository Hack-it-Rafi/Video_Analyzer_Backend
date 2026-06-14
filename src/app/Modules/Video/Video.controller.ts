/* eslint-disable no-console */
// import httpStatus from 'http-status';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import axios from 'axios';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { VIDEOServices } from './Video.service';
import { uploadToMinIO, minioClient } from './Video.utility';
import { LLMService } from './Video.llm.service';

const bucketName = 'video-files';

const getTimeoutForVideo = (fileSize: number): number => {
  const baseTimeout = 600000; // 10 minutes

  // Add 5 minutes for every 50MB
  const sizeMB = fileSize / (1024 * 1024);
  const additionalTimeout = Math.floor(sizeMB / 50) * 300000;

  // Maximum 30 minutes timeout
  return Math.min(baseTimeout + additionalTimeout, 1800000);
};

const processPredictionInBackground = async (
  videoId: string,
  fileUrl: string,
  originalname: string,
  fileSize: number,
  retryCount = 0,
) => {
  const maxRetries = 2;
  const timeout = getTimeoutForVideo(fileSize);
  const tempFilePath = path.join(
    process.cwd(),
    `${Date.now()}_prediction_temp.mp4`,
  );

  try {
    // eslint-disable-next-line no-console
    console.log(
      `🎬 Processing video ${videoId} (${(fileSize / (1024 * 1024)).toFixed(2)}MB, timeout: ${timeout / 1000}s, attempt: ${retryCount + 1}/${maxRetries + 1})`,
    );

    const fileName = fileUrl.split('/').pop();
    const dataStream = await minioClient.getObject(bucketName, fileName || '');
    const writeStream = fs.createWriteStream(tempFilePath);

    await new Promise((resolve, reject) => {
      dataStream.pipe(writeStream);
      dataStream.on('end', resolve);
      dataStream.on('error', reject);
    });

    const formData = new FormData();
    formData.append('video', fs.createReadStream(tempFilePath), {
      filename: originalname,
      contentType: 'video/mp4',
    });

    const predictionResponse = await axios.post(
      'http://localhost:5000/predict',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      },
    );

    const prediction = predictionResponse.data;

    await VIDEOServices.updateVIDEOInDB(videoId, {
      prediction: JSON.stringify(prediction),
      status: 'completed',
    });

    // eslint-disable-next-line no-console
    console.log(`Video ${videoId} prediction completed successfully`);

    // Delete temp file
    if (fs.existsSync(tempFilePath)) {
      await fs.promises.unlink(tempFilePath);
      console.log(`Deleted prediction temp file for video ${videoId}`);
    }
  } catch (error: unknown) {
    const axiosError = error as {
      code?: string;
      message?: string;
      response?: { data?: { message?: string } };
    };
    const isTimeout =
      axiosError.code === 'ECONNABORTED' ||
      axiosError.message?.includes('timeout');
    const errorMessage =
      axiosError.response?.data?.message ||
      axiosError.message ||
      'Unknown error';

    // eslint-disable-next-line no-console
    console.error(
      `Video ${videoId} prediction failed (attempt ${retryCount + 1}/${maxRetries + 1}):`,
      {
        error: errorMessage,
        code: axiosError.code,
        isTimeout,
      },
    );

    // Retry logic for timeout errors
    if (isTimeout && retryCount < maxRetries) {
      // eslint-disable-next-line no-console
      console.log(
        `🔄 Retrying video ${videoId} prediction (attempt ${retryCount + 2}/${maxRetries + 1})...`,
      );

      // Delete temp file before retry
      if (fs.existsSync(tempFilePath)) {
        await fs.promises.unlink(tempFilePath);
      }

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, 5000 * (retryCount + 1)),
      );

      return processPredictionInBackground(
        videoId,
        fileUrl,
        originalname,
        fileSize,
        retryCount + 1,
      );
    }

    // Update video status to failed with error details
    await VIDEOServices.updateVIDEOInDB(videoId, {
      status: 'failed',
      prediction: JSON.stringify({
        error: errorMessage,
        errorCode: axiosError.code,
        timestamp: new Date().toISOString(),
        attempts: retryCount + 1,
      }),
    });

    if (fs.existsSync(tempFilePath)) {
      await fs.promises.unlink(tempFilePath);
      console.log(
        `Deleted prediction temp file for video ${videoId} after failure`,
      );
    }
  }
};

const createVIDEO = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No video file uploaded',
    });
  }

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  const videoFile = req.file;
  const tempFilePath = path.join(process.cwd(), `${Date.now()}_temp.mp4`);

  try {
    await fs.promises.writeFile(tempFilePath, videoFile.buffer);

    const file = {
      path: tempFilePath,
      originalname: `${Date.now()}_${videoFile.originalname}`,
      buffer: videoFile.buffer,
      size: videoFile.size,
    };

    await uploadToMinIO(bucketName, file);

    await fs.promises.unlink(tempFilePath);
    console.log(`Deleted temp file: ${tempFilePath}`);

    const fileUrl = `/${bucketName}/${file.originalname}`;

    const VIDEOData = {
      ...req.body,
      fileUrl,
      status: 'processing' as const,
      user: req.user._id,
    };

    const result = await VIDEOServices.createVIDEOIntoDB(VIDEOData);

    
    processPredictionInBackground(
      result._id.toString(),
      fileUrl,
      videoFile.originalname,
      videoFile.size,
      0,
    )
      // eslint-disable-next-line no-console
      .catch((err) => console.error('Background processing error:', err));

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Video uploaded successfully. Processing started.',
      data: {
        _id: result._id,
        caption: result.caption,
        fileUrl: result.fileUrl,
        status: result.status,
        user: result.user,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
    });
  } catch (error) {
    if (fs.existsSync(tempFilePath)) {
      await fs.promises.unlink(tempFilePath);
    }
    throw error;
  }
});

const getAllVIDEOs = catchAsync(async (req, res) => {
  const result = await VIDEOServices.getAllVIDEOsFromDB(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'VIDEOs are retrieved successfully',
    data: result,
  });
});

const getSingleVIDEO = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await VIDEOServices.getSingleVIDEOFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'VIDEO is retrieved successfully',
    data: result,
  });
});

const getVIDEOFile = catchAsync(async (req, res) => {
  const { fileName } = req.params;
  try {
    const stat = await minioClient.statObject(bucketName, fileName);
    const fileSize = stat.size;

    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', chunkSize);
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Cache-Control', 'no-cache');

      const stream = await minioClient.getObject(bucketName, fileName);

      let bytesRead = 0;
      let shouldSkip = true;

      stream.on('data', (chunk) => {
        if (shouldSkip) {
          if (bytesRead + chunk.length <= start) {
            bytesRead += chunk.length;
            return;
          } else if (bytesRead < start) {
            const offset = start - bytesRead;
            bytesRead = start;
            shouldSkip = false;

            const remainingInRange = end - bytesRead + 1;
            const chunkToSend = chunk.slice(offset, offset + remainingInRange);
            bytesRead += chunkToSend.length;
            res.write(chunkToSend);

            if (bytesRead > end) {
              stream.destroy();
              res.end();
            }
            return;
          }
        }

        if (bytesRead + chunk.length <= end + 1) {
          bytesRead += chunk.length;
          res.write(chunk);
        } else {
          const remaining = end - bytesRead + 1;
          const finalChunk = chunk.slice(0, remaining);
          res.write(finalChunk);
          stream.destroy();
          res.end();
        }
      });

      stream.on('end', () => {
        if (!res.writableEnded) {
          res.end();
        }
      });

      stream.on('error', (error) => {
        // eslint-disable-next-line no-console
        console.error('Stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error streaming video', error });
        } else if (!res.writableEnded) {
          res.end();
        }
      });

      req.on('close', () => {
        if (stream && !stream.destroyed) {
          stream.destroy();
        }
      });
    } else {
      res.setHeader('Content-Length', fileSize);
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'no-cache');

      const stream = await minioClient.getObject(bucketName, fileName);
      stream.pipe(res);

      stream.on('error', (error) => {
        // eslint-disable-next-line no-console
        console.error('Stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error streaming video', error });
        } else if (!res.writableEnded) {
          res.end();
        }
      });

      req.on('close', () => {
        if (stream && !stream.destroyed) {
          stream.destroy();
        }
      });
    }
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ message: 'Could not retrieve file.', error });
    }
  }
});

const generateVideoReport = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reportType } = req.query;

  // Get video from database
  const video = await VIDEOServices.getSingleVIDEOFromDB(id);

  if (!video) {
    return res.status(404).json({
      success: false,
      message: 'Video not found',
    });
  }

  if (video.status !== 'completed' || !video.prediction) {
    return res.status(400).json({
      success: false,
      message: 'Video analysis not completed yet',
    });
  }

  // Generate report
  const report = await LLMService.generateReport(
    video.prediction,
    (reportType as 'summary' | 'workflow') || 'summary',
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Report generated successfully',
    data: {
      videoId: id,
      reportType: reportType || 'summary',
      report,
    },
  });
});

const generateVideoReportStream = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reportType } = req.query;

  // Get video from database
  const video = await VIDEOServices.getSingleVIDEOFromDB(id);

  if (!video) {
    return res.status(404).json({
      success: false,
      message: 'Video not found',
    });
  }

  if (video.status !== 'completed' || !video.prediction) {
    return res.status(400).json({
      success: false,
      message: 'Video analysis not completed yet',
    });
  }

  // Set headers for streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    // Generate report stream
    const stream = await LLMService.generateReportStream(
      video.prediction,
      (reportType as 'summary' | 'workflow') || 'summary',
    );

    // Stream chunks to client
    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Streaming error:', error);
    res.write(
      `data: ${JSON.stringify({ error: 'Failed to generate report' })}\n\n`,
    );
    res.end();
  }
});

export const VIDEOControllers = {
  createVIDEO,
  getSingleVIDEO,
  getAllVIDEOs,
  getVIDEOFile,
  generateVideoReport,
  generateVideoReportStream,
};
