import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Backend is running!' });
});

app.get('/api/chat/health', (req, res) => {
  res.json({ success: true, status: 'healthy' });
});

export default app;
