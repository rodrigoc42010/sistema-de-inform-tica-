const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const pushService = require('../services/pushNotificationService');
const logger = require('../config/logger');

/**
 * @route   GET /api/push/vapid-public-key
 * @desc    Get VAPID public key for push subscriptions
 * @access  Private
 */
router.get('/vapid-public-key', protect, (req, res) => {
    try {
        const publicKey = process.env.VAPID_PUBLIC_KEY;

        if (!publicKey) {
            return res.status(500).json({ message: 'VAPID public key not configured' });
        }

        res.json({ publicKey });
    } catch (error) {
        logger.error('Error getting VAPID key:', error);
        res.status(500).json({ message: 'Erro ao obter chave VAPID' });
    }
});

/**
 * @route   POST /api/push/subscribe
 * @desc    Subscribe to push notifications
 * @access  Private
 */
router.post('/subscribe', protect, async (req, res) => {
    try {
        const subscription = req.body;
        const userId = req.user.id;

        await pushService.subscribe(userId, subscription);

        logger.info(`User ${userId} subscribed to push notifications`);
        res.json({ message: 'Inscrito com sucesso em notificações push' });
    } catch (error) {
        logger.error('Error subscribing to push:', error);
        res.status(500).json({ message: 'Erro ao inscrever em notificações push' });
    }
});

/**
 * @route   POST /api/push/unsubscribe
 * @desc    Unsubscribe from push notifications
 * @access  Private
 */
router.post('/unsubscribe', protect, async (req, res) => {
    try {
        const subscription = req.body;
        const userId = req.user.id;

        await pushService.unsubscribe(userId, subscription);

        logger.info(`User ${userId} unsubscribed from push notifications`);
        res.json({ message: 'Desinscrito de notificações push' });
    } catch (error) {
        logger.error('Error unsubscribing from push:', error);
        res.status(500).json({ message: 'Erro ao desinscrever de notificações push' });
    }
});

/**
 * @route   POST /api/push/test
 * @desc    Send test push notification
 * @access  Private
 */
router.post('/test', protect, async (req, res) => {
    try {
        const userId = req.user.id;

        await pushService.sendNotification(userId, {
            title: 'Notificação de Teste',
            body: 'Esta é uma notificação de teste do sistema TREA.IA',
            icon: '/logo192.png',
            badge: '/logo192.png'
        });

        logger.info(`Test notification sent to user ${userId}`);
        res.json({ message: 'Notificação de teste enviada' });
    } catch (error) {
        logger.error('Error sending test notification:', error);
        res.status(500).json({ message: 'Erro ao enviar notificação de teste' });
    }
});

module.exports = router;
