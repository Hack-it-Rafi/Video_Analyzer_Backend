import { NextFunction, Request, Response } from 'express';
import httptatus from 'http-status';
import jwt, { JwtPayload, TokenExpiredError } from 'jsonwebtoken';
import config from '../config';
import AppError from '../errors/AppError';
import catchAsync from '../utils/catchAsync';
import { TUserRole } from '../Modules/User/User.interface';
import { User } from '../Modules/User/User.model';

const auth = (...requiredRoles: TUserRole[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token;

    if (!token) {
      throw new AppError(httptatus.UNAUTHORIZED, 'You are not authorized!');
    }

    try {
      const decoded = jwt.verify(
        token,
        config.JWT_ACCESS_SECRET as string,
      ) as JwtPayload;

      const { email } = decoded;

      const user = await User.findOne({ email: email });

      if (!user) {
        throw new AppError(httptatus.UNAUTHORIZED, 'User not found!');
      }

      if (requiredRoles.length && !requiredRoles.includes(user.role)) {
        throw new AppError(httptatus.FORBIDDEN, 'You are not authorized!');
      }

      req.user = user;

      next();
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new AppError(
          httptatus.UNAUTHORIZED,
          'Token expired. Please log in again.',
        );
      }
      throw new AppError(httptatus.UNAUTHORIZED, 'Invalid token.');
    }
  });
};

export default auth;
