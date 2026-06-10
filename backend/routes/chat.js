const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Lấy danh sách cuộc trò chuyện của User
router.get('/conversations/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [conversations] = await db.query(`
            SELECT c.*, 
                   IF(c.type = 'private', 
                      (SELECT COALESCE(s.full_name, t.full_name, u2.email) FROM conversation_participants cp2 JOIN users u2 ON cp2.user_id = u2.id LEFT JOIN students s ON cp2.user_id = s.user_id LEFT JOIN teachers t ON cp2.user_id = t.user_id WHERE cp2.conversation_id = c.id AND cp2.user_id != ? LIMIT 1), 
                      c.name) as display_name
            FROM conversations c
            JOIN conversation_participants cp ON c.id = cp.conversation_id
            WHERE cp.user_id = ?
            ORDER BY c.last_message_at DESC
        `, [userId, userId]);
        res.json({ success: true, data: conversations });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Lấy tin nhắn trong cuộc trò chuyện
router.get('/messages/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [messages] = await db.query('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC', [id]);
        res.json({ success: true, data: messages });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


// Tạo/Tìm cuộc trò chuyện Private
router.post('/conversations', async (req, res) => {
    const { senderId, receiverId } = req.body;
    try {
        // Kiểm tra xem đã có conversation private chưa
        const [exists] = await db.query(`
            SELECT c.id FROM conversations c
            JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = ?
            JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = ?
            WHERE c.type = 'private'
        `, [senderId, receiverId]);

        if (exists.length > 0) {
            return res.json({ success: true, data: { id: exists[0].id } });
        }

        const [result] = await db.query('INSERT INTO conversations (type) VALUES ("private")');
        const convId = result.insertId;

        await db.query('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?), (?, ?)', [convId, senderId, convId, receiverId]);

        res.json({ success: true, data: { id: convId } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
