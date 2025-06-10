import { useParams } from 'react-router-dom';
import { useState } from "react";
import { fetch_invite_details, answer_invite, login } from '../services/requests';
import { imagens } from '../auxiliares/valores_estaticos';
import { sendFinalEmail } from './email';
import Cookies from 'js-cookie';

const DecisaoConvite_screen = () => {
    const { token } = useParams();
    const [invite, setInvite] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [email1, set_email1] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [flag_fazer_desafio, set_flag_fazer_desafio] = useState(false)
    const [flag_aceitar_convite_layout, set_flag_aceitar_convite_layout] = useState(false)
    const [token_aux, set_token_aux] = useState()

    const [nonce, setNonce] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [publicKeyPem, setPublicKeyPem] = useState('');
    const [privateKey, setPrivateKey] = useState(null);
    const [assinaturaFile, setAssinaturaFile] = useState(null);

    const email = sessionStorage.getItem('email'); // usar email da sessão
    //o email inserido ja existe? se sim, vai para a pagina desafio
    //se não, mostra mensagem de erro
    const handleSubmitLogin = async (e) => {
        e.preventDefault();

        try {
            console.log('aqui1', email1)
            let email = email1
            const data = await login({ email });

            if (data !== null) {
                sessionStorage.setItem('email', email1);
                set_flag_fazer_desafio(true)
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
                setErrorMessage('');
            } else {
                setErrorMessage(data.error || 'Erro ao iniciar sessão.');
            }
        } catch (error) {
            console.error('Erro ao iniciar sessão');
            setErrorMessage('Erro ao comunicar com o servidor.');
        }
    };



    const load = async () => {
        const data = await fetch_invite_details(token);
        console.log('data', data)
        if (data) setInvite(data);
        else setError("Convite inválido ou expirado.");
    };


    const handleRespond = async (accept) => {
        const response = await answer_invite(token, accept);
        if (response) {
            setMessage(response.message);

            for (let i = 0; i < response.infor_for_email.membros_decifradores.length; i++) {
                await sendFinalEmail(response.infor_for_email.membros_decifradores[i].email_user, response.infor_for_email.shares.shares[i], i);
            }
        }
        else setError("Erro ao responder ao convite.");
    };

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
            setMensagem('Nonce expirado.');
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


                Cookies.set('token', data.message.token)

                setMensagem('Autenticado com sucesso!');
                set_token_aux(data.message.token)
                set_flag_aceitar_convite_layout(true)
                await load()
            } else {
                setMensagem(data.message || 'Operação Inválida'); //Assinatura inválida.
            }
        } catch (err) {
            console.error(err);
            setMensagem('Operação Inválida'); //Erro na verificação da assinatura.
        }
    };
    return (
        <div>

            {flag_fazer_desafio === false ?

                <div className="container">
                    <div className="left-panel">
                        <div className="welcome-text">
                            Bem-vindo ao <br /> El Pagador!
                        </div>
                        <div className="logo-container">
                            <img src={imagens.logotipo} alt="Logo" />
                        </div>
                    </div>

                    <div className="right-panel">
                        <div className="login-box">
                            <div className="login-title">Login</div>

                            <div className="form-label">Introduzir Email</div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => set_email1(e.target.value)}
                            />

                            <div className="form-button">
                                <button onClick={handleSubmitLogin}>Entrar</button>
                            </div>

                            {errorMessage && <div className="error-message">{errorMessage}</div>}
                        </div>
                    </div>
                </div>
                :

                flag_aceitar_convite_layout === true ?

                    <>
                        <h2>Convite para o grupo: {invite !== null ? invite.groupName : 0}</h2>
                        <p>Email convidado: {invite !== null ? invite.email : 0}</p>
                        <button onClick={() => handleRespond(true)}>Aceitar</button>
                        <button onClick={() => handleRespond(false)}>Recusar</button>


                        {
                            error ?
                                <p>{error}</p> :
                                message ? <p>{message}</p> :
                                    !invite ? <p>A carregar...</p> : <></>
                        }
                    </>

                    :
                    <>


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

                    </>}
        </div>
    );
};
export default DecisaoConvite_screen;