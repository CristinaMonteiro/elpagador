import { useNavigate } from 'react-router-dom';
import { cores } from '../auxiliares/valores_estaticos.js';
import { imagens } from '../auxiliares/valores_estaticos.js';
import { useContext, useState } from 'react';
import './login.css';
import { login } from '../services/requests.js';
import { AuthContext } from '../authcontext/AuthProvider.js';

const Login = () => {
  const navigate = useNavigate();
  const { func_user_pode_ver_desafio, func_reset_flags } = useContext(AuthContext)
  const [email, set_email] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  //o email inserido ja existe? se sim, vai para a pagina desafio
  //se não, mostra mensagem de erro
  const handleSubmitLogin = async (e) => {
    e.preventDefault();

    try {
      console.log('aqui1')
      const data = await login({ email });

      if (data !== null) {
        sessionStorage.setItem('email', email);
        func_user_pode_ver_desafio()
        setErrorMessage('');
      } else {
        setErrorMessage(data.error || 'Erro ao iniciar sessão.');
      }
    } catch (error) {
      console.error('Erro ao iniciar sessão');
      setErrorMessage('Erro ao comunicar com o servidor.');
    }
  };

  const handle_registo = () => {
    //nao tem conta? Ir para pag registo
    navigate('/registo');
  }


  return (
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
            onChange={(e) => set_email(e.target.value)}
          />

          <div className="form-link">
            <button onClick={handle_registo}>Para criar conta clique aqui!</button>
          </div>

          <div className="form-button">
            <button onClick={handleSubmitLogin}>Entrar</button>
          </div>

          {errorMessage && <div className="error-message">{errorMessage}</div>}
        </div>
      </div>
    </div>
  );
};

export default Login;