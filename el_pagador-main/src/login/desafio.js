import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../authcontext/AuthProvider';
import { get_users_by_emails } from '../services/requests';

const Desafio = () => {
  const navigate = useNavigate();
  const [nonce, setNonce] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [publicKeyPem, setPublicKeyPem] = useState('');
  const [privateKey, setPrivateKey] = useState(null);
  const [assinaturaFile, setAssinaturaFile] = useState(null);
  const { func_sign_in, func_set_user_token } = useContext(AuthContext)

  const email = sessionStorage.getItem('email'); // usar email da sessão

  useEffect(() => {
    fetch('https://localhost:3001/gerar-nonce', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        setNonce(data.nonce);
        sessionStorage.setItem('nonceExpiration', Date.now() + 60000);
      })
      .catch(() => {
        setMensagem('Erro ao obter desafio');
      });
  }, []);

  const isNonceValid = () => {
    const expiration = sessionStorage.getItem('nonceExpiration');
    return expiration && Date.now() < Number(expiration);
  };

  const pemToArrayBuffer = (pem, type) => {
    try {
      const match = pem.match(new RegExp(`-----BEGIN ${type}-----([^-]+)-----END ${type}-----`, 's'));
      if (!match) throw new Error(`Chave do tipo ${type} não encontrada`);
      const base64 = match[1].replace(/\s+/g, '');
      const binary = atob(base64);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
      return array.buffer;
    } catch (err) {
      setMensagem('Erro ao ler chave .pem');
      return null;
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !file.name.endsWith('.pem')) {
      setMensagem('Ficheiro inválido. Apenas .pem permitido.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const pem = reader.result;

        const privKey = await window.crypto.subtle.importKey(
          'pkcs8',
          pemToArrayBuffer(pem, 'PRIVATE KEY'),
          { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
          true,
          ['sign']
        );
        setPrivateKey(privKey);

        const pubKeyPem = pem.match(/-----BEGIN PUBLIC KEY-----(.*?)-----END PUBLIC KEY-----/s)?.[0];
        if (!pubKeyPem) throw new Error('Chave pública não encontrada');
        setPublicKeyPem(pubKeyPem);
      } catch (err) {
        console.error(err);
        setMensagem('Erro ao processar ficheiro .pem');
      }
    };
    reader.readAsText(file);
  };

  const assinarNonce = async () => {
    if (!privateKey || !nonce) {
      setMensagem('Operação Inválida'); //Falta chave privada ou nonce.
      return;
    }

    try {
      const encoder = new TextEncoder();
      const assinatura = await window.crypto.subtle.sign(
        { name: 'RSASSA-PKCS1-v1_5' },
        privateKey,
        encoder.encode(nonce)
      );

      const assinaturaBase64 = btoa(String.fromCharCode(...new Uint8Array(assinatura)));
      const blob = new Blob([assinaturaBase64], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'digitalSignature.pem';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMensagem('Operação Inválida'); //Erro ao assinar o nonce.
    }
  };

  // irá limitar o tamanho e tipo de ficheiros inseridos

 const handleAssinaturaUpload = (e) => {
  const file = e.target.files[0];
  if (!file || !file.name.endsWith('.pem')) {
    setMensagem('Apenas ficheiros .pem são permitidos.');
    return;
  }

  const MAX_SIG_FILE_SIZE = 0.344 * 1024;
  if (file.size > MAX_SIG_FILE_SIZE) {
    setMensagem('Operação Inválida'); //Ficheiro .pem demasiado grande
    return;
  }

  const reader = new FileReader();
  reader.onload = () => setAssinaturaFile(reader.result.trim());
  reader.readAsText(file);
};



  const handleSubmitDesafio = async (e) => {
    e.preventDefault();

    if (!isNonceValid()) {
      setMensagem('Nonce expirado. Faça login novamente.');
      navigate('/');
      return;
    }

    try {
      const res = await fetch('https://localhost:3001/verificar-assinatura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          assinatura: assinaturaFile,
          publicKey: publicKeyPem,
          email: email
        })
      });

      const data = await res.json();

      if (data.ok) {

        setMensagem('Autenticado com sucesso!');
        func_sign_in(data.message.user);
        func_set_user_token(data.message.token)
      } else {
        setMensagem(data.message || 'Operação Inválida'); //Assinatura inválida.
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setMensagem('Operação Inválida'); //Erro na verificação da assinatura.
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '40px' }}>
      <h2>Desafio de Autenticação</h2>

      <p>1. Carregue seu ficheiro <strong>keys.pem</strong>:</p>
      <input type="file" accept=".pem" onChange={handleFileUpload} />
      <br /><br />

      <p>2. Assine este nonce com a sua chave privada:</p>
      <code>{nonce}</code>
      <br /><br />
      <button onClick={assinarNonce}>Assinar</button>
      <br /><br />

      <p>3. Envie o ficheiro <strong>digitalSignature.pem</strong>:</p>
      <input type="file" accept=".pem" onChange={handleAssinaturaUpload} />
      <br /><br />

      <form onSubmit={handleSubmitDesafio}>
        <button type="submit">Verificar Assinatura</button>
      </form>

      {mensagem && <p style={{ color: 'red' }}>{mensagem}</p>}
    </div>
  );
};

export default Desafio;
