const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true,
    maxlength: [200, 'El título no puede superar 200 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'La descripción no puede superar 2000 caracteres']
  },
  category: {
    type: String,
    enum: ['sistema', 'seguridad', 'red', 'aplicacion', 'base_datos', 'usuario', 'otro'],
    default: 'otro'
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info'
  },
  source: {
    type: String,
    trim: true,
    default: 'manual'
  },
  tags: [{
    type: String,
    trim: true
  }],
  resolved: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
eventSchema.index({ createdAt: -1 });
eventSchema.index({ severity: 1 });
eventSchema.index({ category: 1 });

module.exports = mongoose.model('Event', eventSchema);
