const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);


const historicoSchema = new mongoose.Schema({
  _id: Number,

    membros: [{
        id_user: Number,
        nome_user: String,
        email_user: String,
    }],
    membros_subgrupo: [{
        id_user: Number,
        nome_user: String,
        email_user: String,
    }],
    admin: { 
        id_user: Number,
        nome_user: String,
        email_user: String,
    },
    dia_encontro: {
        type: Date,
        required: true,
    },
});

historicoSchema.plugin(AutoIncrement, { id: 'historico_seq', inc_field: '_id' });

module.exports = mongoose.model('Historico', historicoSchema);
