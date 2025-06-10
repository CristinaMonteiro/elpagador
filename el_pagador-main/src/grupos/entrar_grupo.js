import { cores, imagens } from '../auxiliares/valores_estaticos.js';
import { useContext, useState } from 'react';
import { IoHome, IoExit, IoSettingsSharp } from "react-icons/io5";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './entrar_grupo.css';
import { header_config } from '../services/requests.js';
import { AuthContext } from '../authcontext/AuthProvider.js';

function JoinGroup() {
  const { user_info, func_set_flag_atualizar_info_user } = useContext(AuthContext); //flag sign out

  const [_id, setGroupId] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handle_sair = () => console.log('handle_sair');
  const handle_definicoes = () => console.log('handle_definicoes');
  const handle_home = () => navigate('/');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!_id) {
      setMensagem("Preencha todos os campos.");
      return;
    }

    setLoading(true);
    setMensagem('');

    try {


      const response = await axios.post('https://localhost:3001/entrar_grupo', {
        id_grupo: _id,

        id_user: user_info._id,
      }, {
        headers: header_config
      });
      func_set_flag_atualizar_info_user()
      setMensagem(`Entraste no grupo com sucesso: ${response.data.nome}`);
      navigate(`/`);
    } catch (error) {
      setMensagem(error?.response?.data?.error || 'Erro ao tentar entrar no grupo.');
    } finally {
      setLoading(false);
      setGroupId('');
    }
  };

  return (
    <div className="entrar-group-main">
      {/* Header */}
      <div
        className="entrar-group-header"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100px',
          backgroundColor: cores.cor1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          zIndex: 1000,
          color: 'white'
        }}
      >
        {/* Logotipo à esquerda */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img height={80} src={imagens.logotipo} alt="Logo" />
        </div>

        {/* Título centrado usando posição absoluta */}
        <div style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 34,
          fontWeight: 'bold'
        }}>
          ElPagador
        </div>

        {/* Ícones à direita */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: 28, cursor: 'pointer' }}>
          <IoHome onClick={handle_home} />
          <IoSettingsSharp onClick={handle_definicoes} />
          <IoExit onClick={handle_sair} />
        </div>
      </div>



      {/* Formulário */}
      <div className="entrar-group-container">

        <h2>Entrar num Grupo</h2>
        <form className="entrar-group-form" onSubmit={handleSubmit}>
          <label>ID do Grupo:</label>
          <input type="text" value={_id} onChange={(e) => setGroupId(e.target.value)} required />

          <button className="entrar-group-button" type="submit" disabled={loading}>
            {loading ? 'A entrar...' : 'Entrar'}
          </button>
        </form>

        {mensagem && <p className={`entrar-group-message ${mensagem.includes('sucesso') ? 'success' : 'error'}`}>{mensagem}</p>}
      </div>
    </div>
  );
}

export default JoinGroup;
