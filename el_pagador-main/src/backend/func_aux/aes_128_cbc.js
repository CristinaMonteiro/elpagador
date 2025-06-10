const CryptoJS = require('crypto-js');
const crypto = require('crypto');

const CifrarAES_128_CBC = (lista_to_return) => {
    const keyListaPagadores = crypto.randomBytes(16).toString('hex');
    const ivListaPagadores = crypto.randomBytes(16).toString('hex');

    console.log('Valor random (por cifrar):', keyListaPagadores);

    const key = CryptoJS.enc.Hex.parse(keyListaPagadores);
    const iv = CryptoJS.enc.Hex.parse(ivListaPagadores);

    const stringParaCifrar = JSON.stringify(lista_to_return);

    const cifrarListaAES_128_CBC = CryptoJS.AES.encrypt(stringParaCifrar, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    return {
        keyHex: keyListaPagadores,
        ivHex: ivListaPagadores,
        ciphertext: cifrarListaAES_128_CBC.toString(), 
    };

};

const DecryptAES_128_CBC = (ciphertext, keyHex, ivHex) => {
    try {
        const key = CryptoJS.enc.Hex.parse(keyHex);
        const iv = CryptoJS.enc.Hex.parse(ivHex);

        const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
        console.log('Valor decifrado:', decryptedText);
        return JSON.parse(decryptedText);
    } catch (error) {
        console.error('Erro ao decifrar:', error);
        return null;
    }
};


module.exports = { CifrarAES_128_CBC, DecryptAES_128_CBC };
