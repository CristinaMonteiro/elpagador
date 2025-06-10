const https = require('https');
const fs = require('fs');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const User = require('./user');
const cors = require('cors');
const session = require('express-session');
const { randomBytes, createPublicKey, verify } = require('crypto');
const Grupo = require('./grupo');
const { escolher_membros_pagadores } = require('./func_aux/escolher_membros_pagadores');
const Convites = require('./convites');
const secrets = require('secrets.js-grempe');
const crypto = require('crypto');
const { add_lista_historico_presenca_encontros, update_lista_historico_presenca_encontros } = require('./func_aux/add_lista_historico_presenca_encontros');
const SegredoGrupo = require('./segredoGrupo');
const jwt = require("jsonwebtoken");
require('dotenv').config();

const app = express();
const PORT = 3001;


const options = {
  key: fs.readFileSync('../../ssl/key.pem'),
  cert: fs.readFileSync('../../ssl/cert.pem')
};


app.use(cors({
  origin: 'https://localhost:3000',
  credentials: true
}));

app.use(session({
  secret: 'chave-secreta-segura',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 60000, // 1 minuto
    sameSite: 'lax',  // importante para sessões em localhost
    secure: process.env.NODE_ENV === 'production'     // importante: deve ser false em HTTP local
  }
}));

app.use(bodyParser.json());


// Conexão com MongoDB
//mongoose.connect('mongodb://127.0.0.1:27017/elpagador', {
mongoose.connect('mongodb://localhost/elpagador', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Conectado ao MongoDB');
}).catch(err => console.error('Erro ao conectar:', err));

/*REGISTO*/
app.post('/registo', async (req, res) => {
  const { email, publicKey } = req.body;

  if (!email || !publicKey) {
    return res.status(400).json({ error: 'Email e chave pública são obrigatórios' });
  }

  try {
    const userExiste = await User.findOne({ email });
    console.log('userExiste', userExiste)
    if (userExiste) {
      return res.status(409).json({ error: 'Email já registado' });
    }
    console.log('aqui')
    const novoUser = new User({ email, publicKey });
    console.log('novoUser', novoUser)

    await novoUser.save();
    console.log('aqui2')

    return res.status(201).json({ message: 'Registo efetuado com sucesso' });
  } catch (err) {
    console.error('Erro ao registar utilizador1:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});


/* Rota LOGIN utilizador existente*/
app.post('/login', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email é obrigatório' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'Operação Inválida' }); //utilizador não encontrado
    }

    return res.status(200).json({ message: 'Login efetuado com sucesso', user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/* Rota DESAFIO */
app.get('/gerar-nonce', (req, res) => {
  const nonce = randomBytes(16).toString('base64');
  req.session.nonce = {
    valor: nonce,
    timestamp: Date.now()
  };
  res.json({ nonce });
});

/*Verificar Assinatura e se a Chave Publica=publicKey da bd*/
app.post('/verificar-assinatura', async (req, res) => {
  const { assinatura, publicKey, email } = req.body;

  if (!req.session || !req.session.nonce) {
    return res.status(400).json({ ok: false, message: 'Nonce não encontrado ou expirado' });
  }

  const { valor: nonce, timestamp } = req.session.nonce;

  if (Date.now() - timestamp > 60000) {
    return res.status(400).json({ ok: false, message: 'Nonce expirado' });
  }

  if (!assinatura || !publicKey || !email) {
    return res.status(400).json({ ok: false, message: 'Operação Inválida' }); //Dados em falta (assinatura, chave pública ou email)
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ ok: false, message: 'Operação Inválida' }); //Utilizador não encontrado
    }

    if (user.publicKey.trim() !== publicKey.trim()) {
      return res.status(401).json({ ok: false, message: 'Operação Inválida' }); //Chave pública não corresponde ao email
    }

    const pubKey = createPublicKey({ key: publicKey, format: 'pem' });

    const isValid = verify(
      'sha256',
      Buffer.from(nonce),
      pubKey,
      Buffer.from(assinatura, 'base64')
    );

    if (isValid) {
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
      return res.json({ ok: true, message: { user: user, token: token } });
    } else {
      return res.status(401).json({ ok: false, message: 'Operação Inválida' }); //Assinatura inválida
    }

  } catch (err) {
    console.error(''); //Erro ao verificar assinatura (err.message)
    return res.status(500).json({ ok: false, message: 'Erro interno na verificação' });
  }
});







app.get('/users', authenticateToken, async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Operação Inválida' }); // Erro ao obter utilizadores
  }
});
app.post('/update_user_flag_presenca', authenticateToken, async (req, res) => {

  const payload = req.body;

  try {
    const userAtualizado = await User.findOneAndUpdate(
      { _id: payload._id },
      payload,
      { new: true }
    );
    console.log('userAtualizado', userAtualizado)
    return res.status(200).json(userAtualizado);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
})
app.get('/get_user_by_id/:id', authenticateToken, async (req, res) => {
  try {
    const user_id = req.params.id;

    const utilizador = await User.findById(user_id);
    res.status(200).json(utilizador);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter grupos' });
  }
});

//  ----------------------------------------grupo-----------------------------------------------------
app.post('/create_grupo', authenticateToken, async (req, res) => {
  const { payload } = req.body;

  if (!payload.dia_encontro || !payload.nome) {
    return res.status(400).json({ error: 'Nome, data do encontro são obrigatórios' });
  }

  if (payload.membros_decifradores.length < 2) {
    return res.status(400).json({ error: 'Número de membros decifradores deve ser maior que 2' });
  }

  try {
    const admin = payload.admin;

    payload.membros_pendentes = payload.membros_pendentes.filter(m => m.email_user !== admin.email_user);

    const membros = [
      {
        id_user: admin.id_user,
        email_user: admin.email_user
      },
      ...payload.membros || []
    ];

    const novoGrupo = new Grupo({
      membros: membros,
      membros_decifradores: payload.membros_decifradores,
      admin: payload.admin,
      dia_encontro: payload.dia_encontro,
      hora_encontro: payload.hora_encontro,
      nome: payload.nome,
      numero_de_pagadores: payload.numero_de_pagadores,
      membros_pendentes: payload.membros_pendentes
    });

    const grupo = await novoGrupo.save();

    let pedidos_pendentes_aux = {
      pedidos_pendentes: {
        id_grupo: grupo._id,
        id_user_admin: grupo.admin.id_user,
        email_user_admin: grupo.admin.email_user,
      }
    }

    const idsMembros = grupo.membros_pendentes.map(m => m.id_user)

    await add_lista_historico_presenca_encontros(User, grupo)
    // update utilizadores

    const user_lista = await User.updateMany(
      { _id: { $in: idsMembros } },
      { $addToSet: pedidos_pendentes_aux }
    );


    return res.status(200).json(grupo);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/update_grupo', authenticateToken, async (req, res) => {
  let payload = req.body;
  try {
    if (!payload.dia_encontro || !payload.nome) {
      return res.status(400).json({ error: 'Nome e data do encontro são obrigatórios' });
    }

    if (payload.membros_decifradores.length < 2) {
      return res.status(400).json({ error: 'Número de membros decifradores deve ser maior que 2' });
    }

    const groupBeforeUpdate = await Grupo.findOne({ _id: payload._id });

    if (!groupBeforeUpdate) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }

    if (payload.membros.length !== groupBeforeUpdate.membros.length || payload.membros_decifradores.length !== groupBeforeUpdate.membros_decifradores.length) {
      payload.numero_de_pagadores = payload.membros.length - payload.membros_decifradores.length;
      if (payload.numero_de_pagadores < 2) {
        payload.numero_de_pagadores = 2;
      }
      const lista_decifradores_pendentes = payload.membros_decifradores.filter(el => payload.membros_pendentes.includes(el))

      let limite = payload.membros_decifradores.length - lista_decifradores_pendentes.length

      if (payload.membros.length >= 3 && limite >= 1) {

        let aux_membros_pagadores = await escolher_membros_pagadores(payload.membros, payload.numero_de_pagadores, payload.membros_decifradores, payload._id);

      }

    }

    if (payload.membros_pendentes.length !== groupBeforeUpdate.membros_pendentes.length) {
      const novosPendentes = payload.membros_pendentes.filter(p1 =>
        !groupBeforeUpdate.membros_pendentes.some(p2 => p2.id_user === p1.id_user)
      );

      let pedidos_pendentes_aux = {
        pedidos_pendentes: {
          id_grupo: payload._id,
          id_user_admin: payload.admin.id_user,
          email_user_admin: payload.admin.email_user,
        }
      }
      const ids = novosPendentes.map(m => m.id_user);
      const user_lista = await User.updateMany(
        { _id: { $in: ids } },
        { $addToSet: pedidos_pendentes_aux }
      );
    }

    console.log("Pré-atualizar grupo!");
    let grupo = await Grupo.findByIdAndUpdate(payload._id, payload, { new: true });

    console.log("Atualizar histórico!");
    await update_lista_historico_presenca_encontros(User, Grupo, grupo);

    return res.status(200).json(grupo);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao atualizar grupo!' });
  }
})

app.get('/get_lista_grupos_by_id_user/:id', authenticateToken, async (req, res) => {
  try {
    const admin_id = req.params.id;

    const lista_grupos = await Grupo.find({ 'admin.id_user': admin_id });
    res.status(200).json(lista_grupos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter grupos' });
  }
});

app.post('/get_users_by_emails', authenticateToken, async (req, res) => {
  const { emails } = req.body;

  if (!Array.isArray(emails)) {
    return res.status(400).json({ error: 'Operação Inválida' }); //Formato inválido: emails deve ser um array
  }


  try {
    const users = await User.find({ email: { $in: emails } }, { _id: 1, /*nome: 1,*/ email: 1 });
    const formattedUsers = users.map(user => ({
      id_user: user._id,
      //nome_user: user.nome,
      email_user: user.email
    }));
    res.status(200).json(formattedUsers);
  } catch (error) {
    res.status(500).json({ error: '' }); //Erro ao buscar utilizadores
  }
});

app.get('/get_grupo_by_id/:id', authenticateToken, async (req, res) => {
  try {
    const grupo = await Grupo.findById(req.params.id);
    if (!grupo) {
      return res.status(404).json({ error: 'Operação Inválida' }); //Grupo não encontrado
    }
    res.status(200).json(grupo);
  } catch (err) {
    console.error('Operação Inválida', err); //Erro ao obter grupo
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});


// rota para entrar num grupo entrar_grupo

app.post('/entrar_grupo', authenticateToken, async (req, res) => {
  const { id_grupo, id_user } = req.body;
  console.log('id_grupo', id_grupo)
  console.log('id_user', id_user)

  if (!id_grupo) {
    return res.status(400).json({ error: "ID do grupo obrigatório." });
  }

  try {
    // Verifica se o utilizador existe
    const utilizador = await User.findById(id_user);

    if (!utilizador) {
      return res.status(404).json({ error: "Operação Inválida" }); // Utilizador não encontrado na db
    }

    const grupo = await Grupo.findById(id_grupo);

    if (!grupo) {
      return res.status(404).json({ error: "Operação Inválida" }); // Grupo não encontrado na db
    }

    // Verificar se já é membro
    const ja_membro_pendente = grupo.membros_pendentes.find(m => m.email_user === utilizador.email);
    const ja_membro = grupo.membros.find(m => m.email_user === utilizador.email);
    const ja_decifrador = grupo.membros_decifradores.find(m => m.email_user === utilizador.email);
    const ja_admin = grupo.admin.email_user === utilizador.email;

    if (ja_membro !== undefined || ja_decifrador !== undefined || ja_admin == true || ja_membro_pendente !== undefined) {
      return res.status(400).json({ error: "Este utilizador já faz parte do grupo." });
    }
    let aux_membros_pagadores = await escolher_membros_pagadores(grupo.membros, grupo.numero_de_pagadores, grupo.membros_decifradores, grupo._id);

    // grupo.membros_pagadores = aux_membros_pagadores
    // Adicionar à lista de membros pendentes
    grupo.membros.push({
      id_user: utilizador._id,
      email_user: utilizador.email,
    });

    await add_lista_historico_presenca_encontros(User, grupo, utilizador)
    await grupo.save();

    res.status(200).json({ message: "Entraste no grupo com sucesso.", nome: grupo.nome, grupo });
  } catch (err) {
    console.error("Erro ao entrar no grupo:", err);
    res.status(500).json({ error: "Erro interno ao entrar no grupo." });
  }
});

app.get('/grupo/:id', authenticateToken, async (req, res) => {
  try {
    const grupo = await Grupo.findById(req.params.id);
    if (!grupo) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }
    res.status(200).json(grupo);
  } catch (err) {
    console.error('Erro ao obter grupo:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/create_convite', authenticateToken, async (req, res) => {
  const { payload } = req.body;

  try {
    const novoConvite = new Convites({
      email: payload.email,
      group_id: payload.group_id,
      token: payload.token,
      expires_at: payload.expires_at
    });
    const convite = await novoConvite.save();

    return res.status(200).json(convite);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/invite/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const convite = await Convites.findOne({ token });
    if (!convite) return res.status(404).json({ error: 'Convite não encontrado' });

    if (convite.expires_at < new Date()) {
      return res.status(400).json({ error: 'Convite expirado' });
    }

    if (convite.accepted) {
      return res.status(400).json({ error: 'Convite já aceite' });
    }

    const grupo = await Grupo.findById(convite.group_id);

    if (!grupo) return res.status(404).json({ error: 'Operação Inválida' }); //Grupo associado não encontrado

    res.json({
      email: convite.email,
      groupName: grupo.nome,
      expiresAt: convite.expires_at,
      admin: grupo.admin
    });

  } catch (err) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
})

app.post('/invite/:token/respond', authenticateToken, async (req, res) => {
  const { token } = req.params;
  const { answer } = req.body;

  try {
    const convite = await Convites.findOne({ token });
    if (!convite) return res.status(404).json({ error: 'Convite não encontrado' });

    if (convite.expires_at < new Date()) {
      const grupo = await Grupo.findById(convite.group_id);
      if (grupo) {
        grupo.membros_pendentes = grupo.membros_pendentes.filter(m => m.email_user !== convite.email);
        await grupo.save();

        const totalUsers = grupo.membros.length + grupo.membros_pendentes.length;
        if (totalUsers <= 1) {
          await Grupo.deleteOne({ _id: grupo._id });
        }
      }

      await Convites.deleteOne({ token });
      return res.status(400).json({ error: 'Convite expirado' });
    }

    const grupo = await Grupo.findById(convite.group_id);
    if (!grupo) return res.status(404).json({ error: 'Operação Inválida' }); //Grupo não encontrado

    const user = await User.findOne({ email: convite.email });
    if (!user) return res.status(404).json({ error: 'Operação Inválida' }); //Utilizador não encontrado

    grupo.membros_pendentes = grupo.membros_pendentes.filter(m => m.email_user !== convite.email);

    if (answer) {
      grupo.membros.push({
        id_user: user._id,
        email_user: user.email
      });

      await User.updateMany(
        // { _id: { $in: user._id } },
        { _id: user._id },
        {
          $pull: {
            pedidos_pendentes: {
              id_grupo: grupo._id
            }
          }
        }
      );
      await add_lista_historico_presenca_encontros(User, grupo, user);

    }
    await Convites.deleteOne({ token });

    const totalUsers = grupo.membros.length + grupo.membros_pendentes.length;
    if (totalUsers <= 1) {
      await Grupo.deleteOne({ _id: grupo._id });
      return res.status(200).json({ message: 'Convite recusado' });
    } else if (totalUsers > 2) {
      let numero_de_pagadores = grupo.membros.length - grupo.membros_decifradores.length;
      if (numero_de_pagadores < 2) {
        numero_de_pagadores = 2;
      }
      const aux_membros_pagadores = escolher_membros_pagadores(grupo.membros, numero_de_pagadores, grupo.membros_decifradores, grupo._id);
      grupo.membros_pagadores = aux_membros_pagadores;
    }

    await grupo.save();

    const shares = await SegredoGrupo.findOne({ _id: grupo._id }).select('shares');
    if (!shares) return res.status(404).json({ error: 'Shares não encontradas para este grupo' });

    return res.status(200).json({
      message: `Convite ${answer ? 'aceite' : 'recusado'}`, infor_for_email: {
        shares: shares,
        membros_decifradores: grupo.membros_decifradores,
      }
    });

  } catch (err) {
    console.error('Erro ao tratar convite:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/shares/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const grupo = await Grupo.findOne({ _id: id }).select('membros_decifradores');
    if (!grupo) return res.status(404).json({ error: 'Grupo não encontrado ' });

    console.log(grupo);

    const shares = await SegredoGrupo.findOne({ _id: id }).select('shares');
    if (!shares) return res.status(404).json({ error: 'Shares não encontradas para este grupo' });

    console.log(shares);

    res.status(200).json({
      membros_decifradores: grupo.membros_decifradores,
      shares: shares.shares,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
})

// Rota para ir buscar dados para decifrar com SHAMIR
app.get('/decifrar/:grupoId', async (req, res) => {
  const grupoId = req.params.grupoId;

  try {
    const grupo = await SegredoGrupo.findOne({ _id: grupoId });

    if (!grupo) {
      return res.status(404).json({ erro: 'Operação Inválida' });
    }

    res.json({
      iv: grupo.iv,
      hmac: grupo.hmac,
      ciphertext: grupo.ciphertext,
      shares: grupo.shares
    });
  } catch (err) {
    res.status(500).json({ erro: 'Operação Inválida' });
  }
});

// Função para Gerar HMAC
function gerarHMAC(chave, mensagemCifrada) {
  return crypto.createHmac('sha512', chave).update(mensagemCifrada).digest('hex');
}

// Função para decifrar a lista de Pagadores
function decifrarMensagem(encryptedBase64, ivHex, chave) {
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedBase64, 'base64');
  const decipher = crypto.createDecipheriv('aes-128-cbc', chave, iv);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);
  return decrypted.toString('utf8');
}

// Rota para decifrar a lista de Pagadores
app.post('/decifrar', authenticateToken, (req, res) => {

  const { shares, iv, hmac, ciphertext } = req.body;

  if (!shares || !iv || !hmac || !ciphertext) {
    return res.status(400).json({ error: 'Faltam parâmetros obrigatórios.' });
  };

  try {
    // 1. Reconstruir a chave secreta (hex)
    const secretHex = secrets.combine(shares);
    const chaveAES = Buffer.from(secretHex, 'hex');
    const chaveAES_str = chaveAES.toString('hex');


    // Gerar HMAC
    const hmacGerado = gerarHMAC(chaveAES_str, ciphertext);

    if (hmacGerado !== hmac) {
      return res.status(403).json({ error: 'Operação Inválida' }); //HMAC inválido. Shares incorretos ou dados corrompidos.
    }

    // 3. Decifrar AES-128-CBC
    const plaintext = decifrarMensagem(ciphertext, iv, chaveAES);

    if (!plaintext) {
      throw new Error('Falha na decifração, texto vazio.');
    }

    return res.json({ resultado: plaintext });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/*
app.listen(PORT, () => {
  console.log(`Servidor a correr em http://localhost:${PORT}`);
});
*/
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }

    req.user = user;
    next();
  });
}

https.createServer(options, app).listen(3001, () => {
  console.log(`Servidor HTTPS a correr https://localhost:3001`);
});
