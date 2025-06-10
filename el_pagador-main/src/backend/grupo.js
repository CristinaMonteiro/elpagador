const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);


const grupoSchema = new mongoose.Schema({
    _id: Number,
    membros: [{
        id_user: Number,
        email_user: String,
    }],
    membros_decifradores: [{
        id_user: Number,
        email_user: String,
    }],
    membros_pendentes: [{
        id_user: Number,
        email_user: String,
    }],
    membros_pagadores: [{
        id_user: Number,
        email_user: String,
    }],
    admin: {
        id_user: Number,
        email_user: String,
    },
    dia_encontro: {
        type: String,
        required: true,
    },
    hora_encontro: {
        type: String,
        required: true,
    },
    nome: {
        type: String,
        required: true,

    },
    numero_de_pagadores: {
        type: Number,
        required: true,

    }
});

grupoSchema.plugin(AutoIncrement, { id: 'grupo_seq', inc_field: '_id' });

module.exports = mongoose.model('Grupo', grupoSchema);
