/* eslint-disable no-undef */
import mongoose from 'mongoose';
import { User } from '../../app/Modules/User/User.model';
import { TUser } from '../../app/Modules/User/User.interface';

describe('User Model Test', () => {
  beforeAll(async () => {
    // Connect to a test database
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
    await User.deleteMany({});
  });

  describe('User Creation', () => {
    it('should create a new user successfully', async () => {
      const userData: Partial<TUser> = {
        email: 'test@example.com',
        phone: '1234567890',
        name: 'Test User',
        password: 'TestPassword123',
        role: 'user',
      };

      const user = await User.create(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.phone).toBe(userData.phone);
      expect(user.name).toBe(userData.name);
      expect(user.role).toBe('user');
      expect(user.totalPdf).toBe(0);
    });

    it('should hash password before saving', async () => {
      const userData: Partial<TUser> = {
        email: 'test2@example.com',
        phone: '0987654321',
        name: 'Test User 2',
        password: 'PlainPassword123',
        role: 'user',
      };

      const user = await User.create(userData);

      // Password should be hashed
      expect(user.password).not.toBe('PlainPassword123');
    });

    it('should fail to create user without required fields', async () => {
      const invalidUserData = {
        email: 'test3@example.com',
        // missing phone and name
      };

      await expect(User.create(invalidUserData)).rejects.toThrow();
    });

    it('should fail to create duplicate email', async () => {
      const userData: Partial<TUser> = {
        email: 'duplicate@example.com',
        phone: '1111111111',
        name: 'User One',
        password: 'Password123',
        role: 'user',
      };

      await User.create(userData);

      const duplicateUser = {
        email: 'duplicate@example.com',
        phone: '2222222222',
        name: 'User Two',
        password: 'Password456',
        role: 'user',
      };

      await expect(User.create(duplicateUser)).rejects.toThrow();
    });

    it('should set default role to user', async () => {
      const userData = {
        email: 'default@example.com',
        phone: '3333333333',
        name: 'Default User',
        password: 'Password123',
      };

      const user = await User.create(userData);

      expect(user.role).toBe('user');
    });

    it('should allow admin role', async () => {
      const userData: Partial<TUser> = {
        email: 'admin@example.com',
        phone: '4444444444',
        name: 'Admin User',
        password: 'AdminPass123',
        role: 'admin',
      };

      const user = await User.create(userData);

      expect(user.role).toBe('admin');
    });
  });

  describe('User Query', () => {
    beforeEach(async () => {
      // Create test users
      await User.create({
        email: 'user1@example.com',
        phone: '1111111111',
        name: 'User One',
        password: 'Password123',
        role: 'user',
      });

      await User.create({
        email: 'user2@example.com',
        phone: '2222222222',
        name: 'User Two',
        password: 'Password123',
        role: 'admin',
      });
    });

    it('should find user by email', async () => {
      const user = await User.findOne({ email: 'user1@example.com' });

      expect(user).toBeDefined();
      expect(user?.email).toBe('user1@example.com');
      expect(user?.name).toBe('User One');
    });

    it('should find user by id', async () => {
      const createdUser = await User.findOne({ email: 'user1@example.com' });
      const foundUser = await User.findById(createdUser?._id);

      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe('user1@example.com');
    });

    it('should return all users', async () => {
      const users = await User.find({});

      expect(users).toHaveLength(2);
    });

    it('should filter users by role', async () => {
      const admins = await User.find({ role: 'admin' });

      expect(admins).toHaveLength(1);
      expect(admins[0].email).toBe('user2@example.com');
    });
  });

  describe('User Update', () => {
    it('should update user information', async () => {
      const user = await User.create({
        email: 'update@example.com',
        phone: '5555555555',
        name: 'Update User',
        password: 'Password123',
        role: 'user',
      });

      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { name: 'Updated Name', totalPdf: 5 },
        { new: true },
      );

      expect(updatedUser?.name).toBe('Updated Name');
      expect(updatedUser?.totalPdf).toBe(5);
    });
  });

  describe('User Deletion', () => {
    it('should delete user successfully', async () => {
      const user = await User.create({
        email: 'delete@example.com',
        phone: '6666666666',
        name: 'Delete User',
        password: 'Password123',
        role: 'user',
      });

      await User.deleteOne({ _id: user._id });

      const deletedUser = await User.findById(user._id);
      expect(deletedUser).toBeNull();
    });
  });
});
