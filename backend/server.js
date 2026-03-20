const express = require('express');
const cors = require('cors');
const http = require('http'); // 🆕
const { Server } = require('socket.io'); // 🆕
require('dotenv').config();

const db = require('./config/db'); // 🆕 Cần cho socket lưu tin nhắn
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const chatRoutes = require('./routes/chat'); // 🆕

const app = express();
const server = http.createServer(app); // 🆕
const io = new Server(server, { cors: { origin: '*' } }); // 🆕

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Main Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes); // 🆕

// Test ping
app.get('/api/ping', (req, res) => {
    res.json({ message: 'Backend v1.1 online!' });
});

// Socket.io Logic
io.on('connection', (socket) => {
    console.log(`🔌 Client kết nối: ${socket.id}`);

    socket.on('join_chat', (conversationId) => {
        const roomId = String(conversationId);
        socket.join(roomId);
        console.log(`💬 Socket ${socket.id} gia nhập phòng ${roomId}`);
    });

    socket.on('send_message', async (data) => {
        const { conversation_id, sender_id, content } = data;
        const roomId = String(conversation_id);
        
        try {
            await db.query('INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)', [conversation_id, sender_id, content]);
            await db.query('UPDATE conversations SET last_message_at = NOW() WHERE id = ?', [conversation_id]);
            
            // Phát sóng cho cả phòng sử dụng String roomId
            io.to(roomId).emit('receive_message', { ...data, created_at: new Date() });
        } catch (err) {
            console.error('Lỗi lưu tin nhắn Socket:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log(`🔌 Client ngắt kết nối: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => { // 🆕 Thay app.listen thành server.listen
    console.log(`🚀 Server running: http://localhost:${PORT}`);
});

