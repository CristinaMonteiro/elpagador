const mongoose = require('mongoose');

const segredoGrupoSchema = new mongoose.Schema({
  _id: Number,
  ciphertext: {
    type: String,
    required: true,
  },
  chaveAES: {
    type: String,
    required: true,
  },
  iv: {
    type: String,
    required: true,
  },
  hmac: {
    type: String,
    required: true,
  },
  shares: [{
    type: String,
    required: true,
  }],
}, {
  timestamps: true // adiciona createdAt e updatedAt automaticamente
});

module.exports = mongoose.model('SegredoGrupo', segredoGrupoSchema);
