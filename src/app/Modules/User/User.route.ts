import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { UserValidation } from './User.validation';
import { UserControllers } from './User.controller';
import auth from '../../middlewares/auth';

const router = express.Router();

router.post(
  '/create-user',
  //http://localhost:3000/api/v1/user/create-user
  validateRequest(UserValidation.addUserSchema),
  UserControllers.createUser,
);

router.get('/:id',
   auth('admin', 'user'), 
UserControllers.getSingleUser);

router.get('/',
  //http://localhost:3000/api/v1/user
  //http://localhost:3000/api/v1/user?search=admin 
  auth('admin','user'),
 UserControllers.getAllUsers);

router.patch(
  '/:userId',
  auth(),
  UserControllers.updateUser,
);

router.delete('/:userId', auth('admin'), UserControllers.deleteUser);

export const UserRoutes = router;
