const mongoose = require('mongoose');

// Simple collection pour stocker le montant du Prize Pool (en WLD)
const PrizePoolSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    default: 20, // Valeur initiale
  },
}, { timestamps: true });

module.exports = mongoose.model('PrizePool', PrizePoolSchema); 