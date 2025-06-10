const lodash = require('lodash');
const { CifrarAES_128_CBC } = require('./aes_128_cbc');
const crypto = require('crypto');
const secrets = require('secrets.js-grempe');
const GrupoSegredo = require('../segredoGrupo');

const gerarIdNumerico = () => Math.floor(Math.random() * 9_000_000_000) + 1_000_000_000;

const escolher_membros_pagadores = async (lista_de_todos_os_membros, numero_de_membros_pagadores, lista_membros_decifradores, grupo_id) => {
    try {
        const lista_to_return = lodash.sampleSize(lista_de_todos_os_membros, numero_de_membros_pagadores);

        const numero_membros_decifradores = lista_membros_decifradores.length;

        // GERAR AES-128-CBC
        const cifrarAES_128_CBC = CifrarAES_128_CBC(lista_to_return);

        const hmac = crypto.createHmac('sha512', cifrarAES_128_CBC.keyHex).update(cifrarAES_128_CBC.ciphertext).digest('hex');

        // Gerar shares a partir da chave hexadecimal
        const shares = secrets.share(cifrarAES_128_CBC.keyHex, numero_membros_decifradores, numero_membros_decifradores);

        const existente = await GrupoSegredo.findById(grupo_id);

        if (existente) {
            existente.ciphertext = cifrarAES_128_CBC.ciphertext
            existente.chaveAES = cifrarAES_128_CBC.keyHex;
            existente.iv = cifrarAES_128_CBC.ivHex;
            existente.hmac = hmac;
            existente.shares = shares;

            await existente.save();
        } else {
            // Criar novo registo na base de dados
            const DadosCifrados = new GrupoSegredo({
                _id: grupo_id,
                ciphertext: cifrarAES_128_CBC.ciphertext,
                chaveAES: cifrarAES_128_CBC.keyHex,
                iv: cifrarAES_128_CBC.ivHex,
                hmac: hmac,
                shares: shares
            });

            await DadosCifrados.save();
        }

        // Retorna o objeto guardado
        return {
            _id: grupo_id,
            ciphertext: cifrarAES_128_CBC.ciphertext,
            iv: cifrarAES_128_CBC.ivHex,
            hmac,
            shares
        };

    } catch (error) {
        console.error('Erro em escolher_membros_pagadores:', error);
        return {};
    }
};
module.exports = { escolher_membros_pagadores};