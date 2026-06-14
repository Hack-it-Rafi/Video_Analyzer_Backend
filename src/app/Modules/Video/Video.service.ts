import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { VideoSearchableFields } from './Video.constant';
import { TVideo } from './Video.interface';
import { VIDEO } from './Video.model';

const createVIDEOIntoDB = async (payload: TVideo) => {
  const result = await VIDEO.create([payload]);

  if (!result) {
    throw new AppError(400, 'Failed to create Video');
  }

  return result[0];
};

const getAllVIDEOsFromDB = async (query: Record<string, unknown>) => {
  const VIDEOQuery = new QueryBuilder(VIDEO.find().populate('user'), query)
    .search(VideoSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await VIDEOQuery.modelQuery;
  return result;
};

const getSingleVIDEOFromDB = async (id: string) => {
  const result = await VIDEO.findById(id).populate('user');
  return result;
};

const updateVIDEOInDB = async (id: string, payload: Partial<TVideo>) => {
  const result = await VIDEO.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!result) {
    throw new AppError(404, 'Video not found');
  }

  return result;
};

export const VIDEOServices = {
  createVIDEOIntoDB,
  getAllVIDEOsFromDB,
  getSingleVIDEOFromDB,
  updateVIDEOInDB,
};
