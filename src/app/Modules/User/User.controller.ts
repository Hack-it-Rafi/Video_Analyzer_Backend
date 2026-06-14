import { RequestHandler } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { UserServices } from './User.service';
import httpstatus from 'http-status';

const createUser = catchAsync(async (req, res) => {
  // console.log(req.body);
  const result = await UserServices.createUserIntoDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'User is created successfully',
    data: result,
  });
});

const getAllUsers: RequestHandler = catchAsync(async (req, res) => {
  const result = await UserServices.getAllUsersFromDB(req.query);

  sendResponse(res, {
    statusCode: httpstatus.OK,
    success: true,
    message: 'Users are retrieved successfully',
    data: result,
  });
});

const getSingleUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await UserServices.getSingleUserFromDB(id);

  sendResponse(res, {
    statusCode: httpstatus.OK,
    success: true,
    message: 'User is retrieved successfully',
    data: result,
  });
});

const updateUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const user  = req.body;
  const result = await UserServices.updateUserIntoDB(userId, user);

  sendResponse(res, {
    statusCode: httpstatus.OK,
    success: true,
    message: 'User is updated successfully',
    data: result,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const result = await UserServices.deleteUserFromDB(userId);

  sendResponse(res, {
    statusCode: httpstatus.OK,
    success: true,
    message: 'User is deleted successfully',
    data: result,
  });
});

export const UserControllers = {
    createUser,
    getSingleUser,
    getAllUsers,
    updateUser,
    deleteUser
  };
