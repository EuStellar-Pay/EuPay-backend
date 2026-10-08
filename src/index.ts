import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { streamRouter }   from './routes/streams';
import { employerRouter } from './routes/employers';
import { workerRouter }   from './routes/workers';
import { healthRouter }   from './routes/health';
import { authRouter }     from './routes/auth';
import { requestLogger }  from './middleware/requestLogger';
import { errorHandler }   from './middleware/errorHandler';
import { apiLimiter }     from './middleware/rateLimit';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '64kb' }));
app.use(requestLogger);

app.use('/health',        healthRouter);
app.use('/api/auth',      authRouter);
app.use('/api',           apiLimiter);
app.use('/api/streams',   streamRouter);
app.use('/api/employers', employerRouter);
app.use('/api/workers',   workerRouter);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`EuPay backend running on port ${PORT}`));

export default app;
