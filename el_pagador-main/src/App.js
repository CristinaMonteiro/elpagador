import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from './login/login';
import Home from "./home/home";
import Registo from './registo/registo';
import Desafio from './login/desafio';

import CriarGrupo_screen from "./grupos/criarGrupo";
import EditarGrupo_screen from "./grupos/editarGrupo";

import JoinGroup from "./grupos/entrar_grupo";
import DecifrarGrupo from "./grupos/decifrarGrupo";

import { AuthContext, useAuth } from "./authcontext/AuthProvider";
import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DecisaoConvite_screen from "./grupos/decisaoConvite";



function App() {
  const { flag_sign, flag_user_pode_ver_desafio } = useContext(AuthContext)

  useEffect(() => {
    console.log('aqui')


  }, [flag_sign, flag_user_pode_ver_desafio]);


  return (
    <BrowserRouter>
      {
        flag_sign ? (
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/criargrupo" element={<CriarGrupo_screen />} />
            <Route path="/editargrupo" element={<EditarGrupo_screen />} />

            <Route path="/entrar_grupo" element={<JoinGroup />} />
            <Route path="/decifrar_grupo" element={<DecifrarGrupo />} />

          </Routes>
        ) : flag_user_pode_ver_desafio ? (
          <Routes>
            <Route path="/" element={<Desafio />} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/registo" element={<Registo />} />
            <Route path="/decisaoconvite/:token" element={<DecisaoConvite_screen />} />
          </Routes>
        )
      }
    </BrowserRouter>
  );

}

export default App;