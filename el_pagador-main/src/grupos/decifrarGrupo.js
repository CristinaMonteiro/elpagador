import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../authcontext/AuthProvider.js';
import { cores, imagens } from '../auxiliares/valores_estaticos.js';
import { IoIosExit } from "react-icons/io";
import { IoSettingsSharp } from "react-icons/io5";
import CryptoJS from 'crypto-js';
import Cookies from 'js-cookie';

const DecifrarGrupo = () => {
  const navigate = useNavigate();
  const { func_sign_out, user_info } = useContext(AuthContext);
  const location = useLocation();
  const grupoId = location.state?.grupoId;

  const [grupoInfo, setGrupoInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [inputShares, setInputShares] = useState('');
  const [decifrarLoading, setDecifrarLoading] = useState(false);
  const [decifrarError, setDecifrarError] = useState(null);
  const [decifradoResultado, setDecifradoResultado] = useState(null);

  useEffect(() => {
    if (!grupoId) return;

    const fetchGrupo = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`https://localhost:3001/decifrar/${grupoId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Cookies.get('token')}`,
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Erro ao buscar grupo: Não foi encontrado o grupo...`);
        }

        const data = await response.json();
        setGrupoInfo(data);
        console.log("data:", data);
        console.log("response:", response);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    (async () => {

      await fetchGrupo();
    })();

  }, [grupoId]);

  const handle_sair = () => {
    func_sign_out();
    navigate('/');
  };

  const handle_definicoes = () => {
    console.log('Definições clicadas');
  };

  const handleDecifrar = async (e) => {
    e.preventDefault();
    setDecifrarLoading(true);
    setDecifrarError(null);
    setDecifradoResultado(null);

    const sharesArray = inputShares
      .split(/[\n, ]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (!grupoInfo) {
      setDecifrarError('Informação do grupo ainda não carregada.');
      setDecifrarLoading(false);
      return;
    }

    if (sharesArray.length < grupoInfo.shares.length) {
      setDecifrarError(`São necessários pelo menos ${grupoInfo.shares.length} shares. Foram fornecidos apenas ${sharesArray.length}.`);
      setDecifrarLoading(false);
      return;
    }

    try {
      const response = await fetch(`https://localhost:3001/decifrar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('token')}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          shares: sharesArray,
          iv: grupoInfo.iv,
          hmac: grupoInfo.hmac,
          ciphertext: grupoInfo.ciphertext
        }),
      });

      console.log(response);
      if (!response.ok) {
        throw new Error(`Erro na resposta do servidor: ${response.statusText}`);
      }

      const data = await response.json();
      setDecifradoResultado(data.resultado || "Grupo decifrado com sucesso!");
    } catch (err) {
      setDecifrarError(err.message);
    } finally {
      setDecifrarLoading(false);
    }
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Cabeçalho */}
      <div style={{
        display: 'flex',
        width: '100%',
        flex: 0.1,
        backgroundColor: cores.cor1,
        color: 'white',
        fontSize: 30,
        fontWeight: 'bold'
      }}>
        <div style={{ display: 'flex', flex: 0.1, justifyContent: 'center' }}>
          <img height={70} src={imagens.logotipo} alt="Logo" />
        </div>
        <div style={{ display: 'flex', flex: 0.8, alignItems: 'center', paddingRight: 210 }}>
          Bem vindo {user_info.email.split('@')[0]}!
        </div>
        <div style={{ display: 'flex', flex: 0.05, alignItems: 'center', justifyContent: 'center' }}>
          <IoSettingsSharp onClick={handle_definicoes} />
        </div>
        <div style={{ display: 'flex', flex: 0.05, justifyContent: 'center', alignItems: 'center' }}>
          <IoIosExit onClick={handle_sair} />
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-start px-4 py-4" style={{ overflowY: 'auto' }}>
        {!grupoId && <p>Nenhum ID de grupo fornecido.</p>}
        {loading && <p>A carregar informação do grupo...</p>}
        {error && <p style={{ color: 'red' }}>Erro: {error}</p>}

        <h3>Decifrar Grupo Pagador</h3>
        <form onSubmit={handleDecifrar} style={{ maxWidth: '600px', width: '100%' }}>
          <div className="mb-3">
            <textarea
              id="sharesInput"
              className="form-control"
              rows={6}
              value={inputShares}
              onChange={e => {
                setInputShares(e.target.value);
                setDecifrarError(null);
                setDecifradoResultado(null);
              }}
              placeholder="Insira os shares aqui (um por linha ou separados por espaço)"
              required
            />
          </div>

          <div className="d-flex justify-content-center mb-3">
            <button type="submit" className="btn btn-primary" disabled={decifrarLoading}>
              {decifrarLoading ? 'A decifrar...' : 'Decifrar'}
            </button>
          </div>

          {decifrarError && <div className="alert alert-danger">{decifrarError}</div>}
          {decifradoResultado && (
            <div className="card border-success mb-4" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div className="card-body text-success">
                <h5 className="card-title">Lista de Pagadores:</h5>
                <pre className="card-text" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                  {decifradoResultado}
                </pre>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default DecifrarGrupo;