import mongoose from 'mongoose';

const whatsappSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      default: 'Primary Worker',
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['DISCONNECTED', 'CONNECTING', 'SCAN_QR', 'CONNECTED'],
      default: 'DISCONNECTED',
      index: true,
    },
    qrCode: {
      type: String, // Base64 data URL
      default: '',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    autoReconnect: {
      type: Boolean,
      default: true,
    },
    messagesSent: {
      type: Number,
      default: 0,
    },
    lastConnectedAt: {
      type: Date,
      default: null,
    },
    lastActiveAt: {
      type: Date,
      default: null,
    },
    lastError: {
      type: String,
      default: '',
    },
    metadata: {
      platform: { type: String, default: 'Baileys Multi-Device' },
      pushName: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

const WhatsappSession =
  mongoose.models.WhatsappSession || mongoose.model('WhatsappSession', whatsappSessionSchema);

export default WhatsappSession;
