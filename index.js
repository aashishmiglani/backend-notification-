import express from 'express';
import cors from 'cors';
import scheduleRoutes from './routes/scheduleRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import notificationsRouter from './routes/notificationRoutes.js';
import sendMessageRouter from './routes/sendMessage.js';

dotenv.config();


dotenv.config();

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true })); // optional
app.use(express.json());                         // ✅ Required

app.use('/api/schedule', scheduleRoutes);

app.use('/api/contacts', contactRoutes);
app.use('/api/notifications', notificationsRouter);
app.use('/api/send-message', sendMessageRouter);




const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
