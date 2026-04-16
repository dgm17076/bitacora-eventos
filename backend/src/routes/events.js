const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const logger = require('../logger');

// GET all events with filtering & pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, severity, category, search, resolved } = req.query;
    const filter = {};

    if (severity) filter.severity = severity;
    if (category) filter.category = category;
    if (resolved !== undefined) filter.resolved = resolved === 'true';
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { source: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Event.countDocuments(filter);
    const events = await Event.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    logger.info(`Consulta realizada: ${events.length} eventos obtenidos (filtros: ${JSON.stringify(filter)})`);

    res.json({
      events,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    logger.error(`Error al obtener eventos: ${err.message}`);
    res.status(500).json({ error: 'Error al obtener eventos' });
  }
});

// GET single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      logger.warn(`Evento no encontrado: ${req.params.id}`);
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    logger.info(`Evento consultado: ${event._id} - "${event.title}"`);
    res.json(event);
  } catch (err) {
    logger.error(`Error al obtener evento ${req.params.id}: ${err.message}`);
    res.status(500).json({ error: 'Error al obtener evento' });
  }
});

// POST create event
router.post('/', async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    logger.info(`Nuevo evento registrado: [${event.severity.toUpperCase()}] "${event.title}" (${event.category})`);
    res.status(201).json(event);
  } catch (err) {
    if (err.name === 'ValidationError') {
      logger.warn(`Validación fallida al crear evento: ${err.message}`);
      return res.status(400).json({ error: err.message });
    }
    logger.error(`Error al crear evento: ${err.message}`);
    res.status(500).json({ error: 'Error al crear evento' });
  }
});

// PUT update event
router.put('/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    logger.info(`Evento actualizado: ${event._id} - "${event.title}"`);
    res.json(event);
  } catch (err) {
    logger.error(`Error al actualizar evento ${req.params.id}: ${err.message}`);
    res.status(500).json({ error: 'Error al actualizar evento' });
  }
});

// PATCH toggle resolved
router.patch('/:id/resolve', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
    
    event.resolved = !event.resolved;
    await event.save();
    logger.info(`Evento ${event.resolved ? 'resuelto' : 'reabierto'}: "${event.title}"`);
    res.json(event);
  } catch (err) {
    logger.error(`Error al resolver evento: ${err.message}`);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

// DELETE event
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
    logger.info(`Evento eliminado: "${event.title}"`);
    res.json({ message: 'Evento eliminado correctamente' });
  } catch (err) {
    logger.error(`Error al eliminar evento ${req.params.id}: ${err.message}`);
    res.status(500).json({ error: 'Error al eliminar evento' });
  }
});

module.exports = router;
