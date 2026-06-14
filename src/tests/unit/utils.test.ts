/* eslint-disable no-undef */
import catchAsync from '../../app/utils/catchAsync';
import { Request, Response, NextFunction } from 'express';

describe('catchAsync Utility', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it('should call async function and handle success', async () => {
    const asyncFn = jest.fn().mockResolvedValue('success');
    const wrappedFn = catchAsync(asyncFn);

    await wrappedFn(mockReq as Request, mockRes as Response, mockNext);

    expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should catch errors and pass to next', async () => {
    const error = new Error('Test error');
    const asyncFn = jest.fn().mockRejectedValue(error);
    const wrappedFn = catchAsync(asyncFn);

    await wrappedFn(mockReq as Request, mockRes as Response, mockNext);

    expect(asyncFn).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it('should work with controller functions', async () => {
    const controllerFn = catchAsync(async (req, res) => {
      res.status(200).json({ success: true });
    });

    await controllerFn(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ success: true });
  });
});
