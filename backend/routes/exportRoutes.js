const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { exportTicketsToExcel, exportTicketsToPDF } = require('../services/exportService');
const logger = require('../config/logger');

/**
 * @route   GET /api/export/tickets/excel
 * @desc    Export tickets to Excel
 * @access  Private
 */
router.get('/tickets/excel', protect, async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;
        const filters = {};

        if (status) filters.status = status;
        if (startDate) filters.startDate = new Date(startDate);
        if (endDate) filters.endDate = new Date(endDate);

        const buffer = await exportTicketsToExcel(req.user.id, req.user.role, filters);

        const filename = `tickets_${new Date().toISOString().split('T')[0]}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);

        logger.info(`User ${req.user.id} exported tickets to Excel`);
    } catch (error) {
        logger.error('Error exporting to Excel:', error);
        res.status(500).json({ message: 'Erro ao exportar para Excel', error: error.message });
    }
});

/**
 * @route   GET /api/export/tickets/pdf
 * @desc    Export tickets to PDF
 * @access  Private
 */
router.get('/tickets/pdf', protect, async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;
        const filters = {};

        if (status) filters.status = status;
        if (startDate) filters.startDate = new Date(startDate);
        if (endDate) filters.endDate = new Date(endDate);

        const buffer = await exportTicketsToPDF(req.user.id, req.user.role, filters);

        const filename = `tickets_${new Date().toISOString().split('T')[0]}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);

        logger.info(`User ${req.user.id} exported tickets to PDF`);
    } catch (error) {
        logger.error('Error exporting to PDF:', error);
        res.status(500).json({ message: 'Erro ao exportar para PDF', error: error.message });
    }
});

module.exports = router;
