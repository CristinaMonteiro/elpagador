//criarGrupo.js
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { criar_convite, criar_grupo, get_users_by_emails } from "../services/requests";
import { imagens } from "../auxiliares/valores_estaticos";
import { IoHomeSharp, IoSettingsSharp } from "react-icons/io5";
import { IoIosExit } from "react-icons/io";
import ReactTagInput from "@pathofdev/react-tag-input";
import "@pathofdev/react-tag-input/build/index.css";
//nao remover isto (pq é necessário para a flag de sign out):
import { AuthContext } from '../authcontext/AuthProvider.js';
import { useContext } from 'react';
import { sendInviteEmail } from "./email.js";
import TimePicker from 'react-time-picker';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';
const CriarGrupo_screen = () => {
    const navigate = useNavigate();
    const { func_sign_out, user_info, func_set_flag_atualizar_info_user } = useContext(AuthContext); //flag sign out

    const [groupName, setGroupName] = useState('');
    const [members, setMembers] = useState([]);
    const [decipherMembers, setDecipherMembers] = useState([]);
    const [data, setData] = useState('');
    const [hora, set_hora] = useState('10:00')

    const lista_dias_semana = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo']

    const handle_sair = () => {
        console.log('handle_sair')
        func_sign_out(); //chamar a funcao de sign out
        navigate('/');
    };

    const handle_definicoes = () => {
        console.log('handle_definicoes')
    };

    const handle_home = () => {
        navigate('/');
        console.log('handle_home')
    };

    const generateToken = () => {
        const array = new Uint8Array(20);
        window.crypto.getRandomValues(array);
        return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    };

    const guardar_na_base_de_dados = async () => {
        if (hora.length === 0) {
            alert("Por favor escolha a data e hora!");
            return;
        }
        let aux_numeroPagadores = members.length - decipherMembers.length

        if (members.length === 0 || decipherMembers.length === 0 || !aux_numeroPagadores) {
            alert("Preencha ambos os campos de emails.");
            return;
        }


        try {



            const membros_pendentes = await get_users_by_emails(members);
            const membros_decifradores = await get_users_by_emails(decipherMembers);

            if (membros_pendentes.length === 0 || membros_decifradores.length === 0) {
                alert("Erro ao obter utilizadores. Verique os emails inseridos.");
                return;
            }

            let payload = {
                payload: {
                    membros_pendentes,
                    membros_decifradores,
                    admin: {
                        id_user: user_info._id,
                        email_user: user_info.email,
                    },
                    dia_encontro: data.length === 0 ? lista_dias_semana[0] : lista_dias_semana[data],
                    hora_encontro: hora,
                    nome: groupName,
                    numero_de_pagadores: aux_numeroPagadores === 1 ? 2 : aux_numeroPagadores
                }
            };

            const grupo_criado = await criar_grupo(payload);

            if (!grupo_criado) {
                alert("Erro ao criar grupo.");
                return;
            }

            for (const membro of membros_pendentes) {

                if (membro.email_user !== user_info.email) {

                    const token = generateToken();
                    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

                    const novoConvite = {
                        payload: {
                            email: membro.email_user,
                            group_id: grupo_criado._id,
                            token,
                            expires_at: expiresAt
                        }
                    };

                    const convite_criado = await criar_convite(novoConvite);

                    if (!convite_criado) {
                        alert(`Erro ao criar convite para ${membro.email_user}`);
                        return;
                    }

                    const inviteLink = `https://localhost:3000/decisaoconvite/${token}`;

                    await sendInviteEmail(membro.email_user, grupo_criado.nome, grupo_criado.admin.email_user, inviteLink);
                }

                // setTimeout(() => { }, 1000);
            }
            func_set_flag_atualizar_info_user()


            alert("Grupo criado com sucesso!");
            navigate("/");

        } catch (error) {
            console.error('Erro guardar_na_base_de_dados:', error);
            alert("Erro interno ao criar grupo.");
        }
    }
    const on_change_decifradores = (el) => {
        if (decipherMembers.includes(el)) {
            let new_lista = decipherMembers.filter(elem => el !== elem)
            setDecipherMembers(new_lista)
        } else {
            setDecipherMembers((old) => [...old, el])
        }
    }

    useEffect(() => {
        setMembers([user_info.email])
    }, []);

    return (
        <div className="d-flex flex-column vh-100 w-100" style={{ minWidth: "900px" }}>
            <div className="d-flex w-100 flex-shrink-0 fw-bold fs-3" style={{ color: 'white', height: '80px' }}>
                <div className="p-2" style={{ flex: 0.1 }}>
                    <img height={100} src={imagens.logotipo} alt="Logo" />
                </div>
                <div className="p-2" style={{ flex: 0.75 }}>
                    Bem vindo!
                </div>
                <div className="p-2" style={{ flex: 0.05 }} onClick={handle_home}>
                    <IoHomeSharp style={{ cursor: "pointer", color: "white" }} />
                </div>
                <div className="p-2" style={{ flex: 0.05 }} onClick={handle_definicoes}>
                    <IoSettingsSharp style={{ cursor: "pointer", color: "white" }} />
                </div>
                <div className="p-2" style={{ flex: 0.05 }} onClick={handle_sair}>
                    <IoIosExit style={{ cursor: "pointer", color: "white" }} />
                </div>
            </div>
            <div className="flex-grow-1 d-flex justify-content-center align-items-start" style={{ overflowY: 'auto' }}>
                <div className="px-4 py-5" style={{ maxWidth: "600px", width: "100%" }}>
                    <h3 className="mb-4">Criar Grupo</h3>
                    <form onSubmit={(e) => { e.preventDefault(); guardar_na_base_de_dados(); }}>
                        <div className="mb-3">
                            <label className="form-label">Nome do Grupo</label>
                            <input
                                type="text"
                                className="form-control"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Membros (Emails)</label>
                            <ReactTagInput
                                tags={members}
                                onChange={setMembers}
                                placeholder="Digite e pressione Enter"
                                validator={(value) => /\S+@\S+\.\S+/.test(value)}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Membros Decifradores (Emails)</label>

                            {members.length === 0 ? <></> : members.map((el, key) => (
                                <div key={key}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            value={el}
                                            checked={decipherMembers.includes(el)}
                                            onChange={() => on_change_decifradores(el)}
                                        />
                                        {el}
                                    </label>
                                </div>
                            ))}
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Data de Encontro</label>
                            <select
                                className="form-control"
                                value={data === undefined ? 0 : data}
                                onChange={(e) => setData(Number(e.target.value))}
                                required

                            >
                                {
                                    lista_dias_semana.map((el, key) => {
                                        return (
                                            <option key={key} value={key}>{el}</option>
                                        )
                                    })
                                }
                            </select>
                        </div>
                        <div className="mb-3">
                            <TimePicker disableClock={true} locale={'pt'} clearIcon onChange={set_hora} value={hora === undefined ? '10:00' : hora} />
                        </div>

                        <div className="d-flex justify-content-center">
                            <button type="submit" className="btn btn-primary">Criar Grupo</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
export default CriarGrupo_screen;