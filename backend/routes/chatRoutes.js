const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/process-video', authMiddleware, chatController.processVideo);
router.post('/ask', authMiddleware, chatController.askQuestion);
router.get('/history', authMiddleware, chatController.getChatHistory);

module.exports = router;