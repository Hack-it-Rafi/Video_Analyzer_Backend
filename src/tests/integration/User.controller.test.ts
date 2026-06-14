/* eslint-disable no-undef */
import request from 'supertest';
import express from 'express';
import { UserControllers } from '../../app/Modules/User/User.controller';
import { UserServices } from '../../app/Modules/User/User.service';
import mongoose from 'mongoose';

jest.mock('../../app/Modules/User/User.service');

const app = express();
app.use(express.json());

// Setup routes for testing
app.post('/api/v1/users', UserControllers.createUser);
app.get('/api/v1/users', UserControllers.getAllUsers);
app.get('/api/v1/users/:id', UserControllers.getSingleUser);
app.patch('/api/v1/users/:userId', UserControllers.updateUser);
app.delete('/api/v1/users/:userId', UserControllers.deleteUser);

describe('User Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/users - createUser', () => {
    it('should create a user and return 200', async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        email: 'test@example.com',
        phone: '1234567890',
        name: 'Test User',
        role: 'user',
        totalPdf: 0,
      };

      (UserServices.createUserIntoDB as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app).post('/api/v1/users').send({
        email: 'test@example.com',
        phone: '1234567890',
        name: 'Test User',
        password: 'Password123',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User is created successfully');
      expect(response.body.data).toEqual(mockUser);
    });

    it('should handle errors during user creation', async () => {
      (UserServices.createUserIntoDB as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      const response = await request(app).post('/api/v1/users').send({
        email: 'test@example.com',
        phone: '1234567890',
        name: 'Test User',
        password: 'Password123',
      });

      expect(response.status).not.toBe(200);
    });
  });

  describe('GET /api/v1/users - getAllUsers', () => {
    it('should return all users', async () => {
      const mockUsers = [
        {
          _id: new mongoose.Types.ObjectId(),
          email: 'user1@example.com',
          phone: '1111111111',
          name: 'User One',
          role: 'user',
        },
        {
          _id: new mongoose.Types.ObjectId(),
          email: 'user2@example.com',
          phone: '2222222222',
          name: 'User Two',
          role: 'admin',
        },
      ];

      (UserServices.getAllUsersFromDB as jest.Mock).mockResolvedValue(
        mockUsers,
      );

      const response = await request(app).get('/api/v1/users');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Users are retrieved successfully');
      expect(response.body.data).toEqual(mockUsers);
    });

    it('should handle query parameters', async () => {
      (UserServices.getAllUsersFromDB as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/users')
        .query({ role: 'admin', limit: 10 });

      expect(response.status).toBe(200);
      expect(UserServices.getAllUsersFromDB).toHaveBeenCalledWith({
        role: 'admin',
        limit: '10',
      });
    });
  });

  describe('GET /api/v1/users/:id - getSingleUser', () => {
    it('should return a single user', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const mockUser = {
        _id: userId,
        email: 'test@example.com',
        phone: '1234567890',
        name: 'Test User',
        role: 'user',
      };

      (UserServices.getSingleUserFromDB as jest.Mock).mockResolvedValue(
        mockUser,
      );

      const response = await request(app).get(`/api/v1/users/${userId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User is retrieved successfully');
      expect(response.body.data).toEqual(mockUser);
    });

    it('should handle non-existent user', async () => {
      const userId = new mongoose.Types.ObjectId().toString();

      (UserServices.getSingleUserFromDB as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get(`/api/v1/users/${userId}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeNull();
    });
  });

  describe('PATCH /api/v1/users/:userId - updateUser', () => {
    it('should update user successfully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const mockUpdatedUser = {
        _id: userId,
        email: 'test@example.com',
        phone: '1234567890',
        name: 'Updated Name',
        role: 'user',
        totalPdf: 5,
      };

      (UserServices.updateUserIntoDB as jest.Mock).mockResolvedValue(
        mockUpdatedUser,
      );

      const response = await request(app)
        .patch(`/api/v1/users/${userId}`)
        .send({ name: 'Updated Name', totalPdf: 5 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User is updated successfully');
      expect(response.body.data.name).toBe('Updated Name');
    });
  });

  describe('DELETE /api/v1/users/:userId - deleteUser', () => {
    it('should delete user successfully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const mockDeleteResult = {
        acknowledged: true,
        deletedCount: 1,
      };

      (UserServices.deleteUserFromDB as jest.Mock).mockResolvedValue(
        mockDeleteResult,
      );

      const response = await request(app).delete(`/api/v1/users/${userId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User is deleted successfully');
    });
  });
});
