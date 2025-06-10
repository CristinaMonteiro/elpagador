import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './registo.css';

const Registo = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const generateKeyPair = async () => {
    return await window.crypto.subtle.generateKey(
      {
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['sign', 'verify']
    );
  };

  const exportPublicKeyPEM = async (publicKey) => {
    const spki = await window.crypto.subtle.exportKey('spki', publicKey);
    const b64 = btoa(String.fromCharCode(...new Uint8Array(spki)));
    return `-----BEGIN PUBLIC KEY-----\n${b64.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----`;
  };

  const exportPrivateKeyPEM = async (privateKey) => {
    const pkcs8 = await window.crypto.subtle.exportKey('pkcs8', privateKey);
    const b64 = btoa(String.fromCharCode(...new Uint8Array(pkcs8)));
    return `-----BEGIN PRIVATE KEY-----\n${b64.match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setErrorMessage('Email é obrigatório');
      return;
    }

    try {
      const { publicKey, privateKey } = await generateKeyPair();
      const publicKeyPEM = await exportPublicKeyPEM(publicKey);
      const privateKeyPEM = await exportPrivateKeyPEM(privateKey);

      // Criar ficheiro PEM
      const blob = new Blob(
        [`${privateKeyPEM}\n\n${publicKeyPEM}`],
        { type: 'application/x-pem-file' }
      );

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'keys.pem';
      link.click();

      // Enviar email + chave pública para o backend
      const response = await fetch('https://localhost:3001/registo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, publicKey: publicKeyPEM }),
        credentials: 'include'

      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Registo efetuado com sucesso!');
        setErrorMessage('');
        navigate('/');
      } else {
        setErrorMessage(data.error || 'Erro ao registar utilizador.');
        setSuccessMessage('');
      }
    } catch (error) {
      console.error('Erro ao handleSubmit utilizador:', error);
      setErrorMessage('Erro ao comunicar com o servidor.');
      setSuccessMessage('');
    }
  };

  return (
    <div className="form-container">
      <h2>Registo</h2>
      <form className="registration-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <p className="info-message">
          Ao clicar em Registar será gerado o ficheiro <code>keys.pem</code>, com as suas chaves privada e pública.
          <br></br>
          <b>Guarde este ficheiro em segurança </b> pois precisará dele para fazer login na sua conta.
        </p>

        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}

        <button type="submit" className="submit-button">Registar</button>
      </form>
    </div>
  );
};
export default Registo;