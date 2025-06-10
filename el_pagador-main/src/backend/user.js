const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const bcrypt = require("bcrypt");
// Definição do esquema do utilizador para o REGISTO
// O esquema define a estrutura dos documentos na coleção "user"
// e os tipos de dados dos campos (email e pk)
const userSchema = new mongoose.Schema({
  _id: Number,
  email: {
    type: String,
    required: true,
    unique: true
  },
  publicKey: {
    type: String,
    required: true,
    unique: true
  },
  nome: {
    type: String,
  },
  data_criacao: {
    type: Date,
    require: true
  },
  flag_ativo: {
    type: Boolean,
    require: true
  },
  pedidos_pendentes: [{
    id_grupo: Number,
    id_user_admin: Number,
    email_user_admin: String,
  }],
  historico_presenca_encontros: [{
    semana: Number,
    lista_de_encontros_com_presenca: [{
      id_grupo: Number,
      nome_grupo: String,
      dia_encontro_grupo: String,
      hora_encontro_grupo: String,
      flag_comparecer: Boolean
    }]
  }]

}, { _id: false });

userSchema.plugin(AutoIncrement, { id: 'user_seq', inc_field: '_id' });

userSchema.methods.verifyPassword = async function (pk) {

  

  const user = this;
  console.log('pk', pk)
  console.log('user.publicKey', user.publicKey)
  return pk === user.publicKey
};

module.exports = mongoose.model('User', userSchema);
