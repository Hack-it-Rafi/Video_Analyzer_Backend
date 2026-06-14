import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import notFound from './app/middlewares/notFound';
import router from './app/routes';
import cookieParser from 'cookie-parser';

const app: Application = express();

const corsOptions = {
  origin: ['http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// CORS must be first to handle preflight requests
app.use(cors(corsOptions));

// parsers
app.use(cookieParser());
app.use(express.json());

// JWT and logout endpoints - must come before main router
app.post('/api/v1/jwt', async (req: Request, res: Response) => {
  const user = req.body;

  try {
    const token = jwt.sign(user, process.env.JWT_ACCESS_SECRET as string, {
      // expiresIn: '1h',
      expiresIn: '12h',
    });

    res
      .cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        // maxAge: 3600000,
        maxAge: 12 * 60 * 60 * 1000,
      })
      .send({ success: true });
  } catch (error) {
    res.status(500).send({ success: false, message: 'JWT generation failed' });
  }
});

app.post('/api/v1/logout', async (req: Request, res: Response) => {
  res
    .clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    })
    .send({ success: true });
});

// application routes
app.use('/api/v1', router);
//http://localhost:3000/api/v1/*router

app.use(globalErrorHandler);

app.use(notFound);

export default app;
