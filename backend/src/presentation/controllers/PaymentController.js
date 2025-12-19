const getPayments = require('../../application/GetPayments');
const asyncHandler = require('express-async-handler');

class PaymentController {
  list = asyncHandler(async (req, res) => {
    const { status, method, from, to, q } = req.query;
    const payments = await getPayments.execute({
      userId: req.user.id,
      role: req.user.role,
      status,
      method,
      from,
      to,
      q,
    });
    res.status(200).json({ items: payments });
  });

  // Other methods like updateStatus, getReport, etc. will be added as needed
}

module.exports = new PaymentController();
