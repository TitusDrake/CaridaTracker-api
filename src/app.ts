import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes';
import organizationRoutes from './routes/organization.routes';
import clubRoutes from './routes/club.routes';
import troopRoutes from './routes/troop.routes';
import attendanceRoutes from './routes/attendance.routes';
import userRoutes from './routes/user.routes';
import searchRoutes from './routes/search.routes';
import costumeRoutes from './routes/costume.routes';
import shiftRoutes from './routes/shift.routes';

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration
// Allow all origins in development, restrict in production
const corsOptions = {
  origin: process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? false : true),
  credentials: true,
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/troops', troopRoutes);
app.use('/api/troops', attendanceRoutes); // Attendance routes under /api/troops/:id/attend
app.use('/api/troops', shiftRoutes); // Shift routes under /api/troops/:id/shifts
app.use('/api/users', userRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/costumes', costumeRoutes);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;
