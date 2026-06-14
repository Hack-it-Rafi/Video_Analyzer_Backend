/* eslint-disable no-undef */
import { UserServices } from '../../app/Modules/User/User.service';
import { User } from '../../app/Modules/User/User.model';
import { TUser } from '../../app/Modules/User/User.interface';
import mongoose from 'mongoose';

jest.mock('../../app/Modules/User/User.model');

describe('User Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUserIntoDB', () => {
    it('should create a user successfully', async () => {
      const mockUser: Partial<TUser> = {
        email: 'test@example.com',
        phone: '1234567890',
        name: 'Test User',
        password: 'Password123',
        role: 'user',
      };

      const mockCreatedUser = {
        _id: new mongoose.Types.ObjectId(),
        ...mockUser,
        totalPdf: 0,
        photo: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (User.create as jest.Mock).mockResolvedValue(mockCreatedUser);

      const result = await UserServices.createUserIntoDB(mockUser as TUser);

      expect(User.create).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockCreatedUser);
      expect(result.email).toBe(mockUser.email);
    });

    it('should throw error if user creation fails', async () => {
      const mockUser: Partial<TUser> = {
        email: 'test@example.com',
        phone: '1234567890',
        name: 'Test User',
        password: 'Password123',
        role: 'user',
      };

      (User.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        UserServices.createUserIntoDB(mockUser as TUser),
      ).rejects.toThrow('Database error');
    });
  });

  describe('getAllUsersFromDB', () => {
    it('should return all users with query builder', async () => {
      const mockUsers = [
        {
          _id: new mongoose.Types.ObjectId(),
          email: 'user1@example.com',
          phone: '1111111111',
          name: 'User One',
          role: 'user',
          totalPdf: 0,
        },
        {
          _id: new mongoose.Types.ObjectId(),
          email: 'user2@example.com',
          phone: '2222222222',
          name: 'User Two',
          role: 'admin',
          totalPdf: 5,
        },
      ];

      const mockQuery = {
        search: jest.fn().mockReturnThis(),
        filter: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        paginate: jest.fn().mockReturnThis(),
        fields: jest.fn().mockReturnThis(),
        modelQuery: Promise.resolve(mockUsers),
      };

      (User.find as jest.Mock).mockReturnValue(mockQuery);

      const result = await UserServices.getAllUsersFromDB({});

      expect(result).toEqual(mockUsers);
    });
  });

  describe('getSingleUserFromDB', () => {
    it('should return a single user by id', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const mockUser = {
        _id: userId,
        email: 'test@example.com',
        phone: '1234567890',
        name: 'Test User',
        role: 'user',
        totalPdf: 0,
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserServices.getSingleUserFromDB(userId);

      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('should return null for non-existent user', async () => {
      const userId = new mongoose.Types.ObjectId().toString();

      (User.findById as jest.Mock).mockResolvedValue(null);

      const result = await UserServices.getSingleUserFromDB(userId);

      expect(result).toBeNull();
    });
  });

  describe('updateUserIntoDB', () => {
    it('should update user successfully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const updateData: Partial<TUser> = {
        name: 'Updated Name',
        totalPdf: 10,
      };

      const mockUpdatedUser = {
        _id: userId,
        email: 'test@example.com',
        phone: '1234567890',
        name: 'Updated Name',
        role: 'user',
        totalPdf: 10,
      };

      (User.findOneAndUpdate as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const result = await UserServices.updateUserIntoDB(userId, updateData);

      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: userId },
        updateData,
        { new: true },
      );
      expect(result).toEqual(mockUpdatedUser);
      if (result) {
        expect(result.name).toBe('Updated Name');
      }
    });
  });

  describe('deleteUserFromDB', () => {
    it('should delete user successfully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const mockDeleteResult = {
        acknowledged: true,
        deletedCount: 1,
      };

      (User.deleteOne as jest.Mock).mockResolvedValue(mockDeleteResult);

      const result = await UserServices.deleteUserFromDB(userId);

      expect(User.deleteOne).toHaveBeenCalledWith({ _id: userId });
      expect(result).toEqual(mockDeleteResult);
      expect(result.deletedCount).toBe(1);
    });

    it('should return 0 deletedCount for non-existent user', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const mockDeleteResult = {
        acknowledged: true,
        deletedCount: 0,
      };

      (User.deleteOne as jest.Mock).mockResolvedValue(mockDeleteResult);

      const result = await UserServices.deleteUserFromDB(userId);

      expect(result.deletedCount).toBe(0);
    });
  });
});
