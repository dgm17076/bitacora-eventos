const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const logger = require('../logger');

// GET dashboard stats
router.get('/', async (req, res) => {
  try {
    const [total, bySeverity, byCategory, recentActivity, resolved] = await Promise.all([
      Event.countDocuments(),
      Event.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]),
      Event.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      Event.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title severity createdAt resolved'),
      Event.countDocuments({ resolved: true })
    ]);

    logger.info('Consulta de estadísticas realizada');

    res.json({
      total,
      resolved,
      pending: total - resolved,
      bySeverity: Object.fromEntries(bySeverity.map(i => [i._id, i.count])),
      byCategory: Object.fromEntries(byCategory.map(i => [i._id, i.count])),
      recentActivity
    });
  } catch (err) {
    logger.error(`Error al obtener estadísticas: ${err.message}`);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

module.exports = router;
