import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { criar_convite, get_users_by_emails, get_grupo_by_id, update_grupo, get_shares } from "../services/requests";
import { imagens } from "../auxiliares/valores_estaticos";
import { IoSettingsSharp, IoHomeSharp } from 'react-icons/io5';
import { IoIosExit } from 'react-icons/io';
import ReactTagInput from "@pathofdev/react-tag-input";
import "@pathofdev/react-tag-input/build/index.css";
//nao remover isto (pq é necessário para a flag de sign out):
import { AuthContext } from '../authcontext/AuthProvider.js';
import { useContext } from 'react';
import TimePicker from 'react-time-picker';
import { sendFinalEmail, sendInviteEmail } from "./email.js";

const EditarGrupo_screen = () => {
    const navigate = useNavigate();
    const { func_sign_out, user_info, func_set_flag_atualizar_info_user } = useContext(AuthContext); //flag sign out
    const location = useLocation();
    const grupoId = location.state?.grupoId;

    const lista_dias_semana = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo']

    const [group, setGroup] = useState({
        _id: null,
        membros: [],
        membros_decifradores: [],
        membros_pendentes: [],
        membros_pagadores: [],
        admin: {
            id_user: null,
            email_user: ""
        },
        dia_encontro: "",
        hora_encontro: "",
        nome: "Nome Grupo",
        numero_de_pagadores: 0
    });

    const [members, setMembers] = useState([]);
    const [decipherMembers, setDecipherMembers] = useState([]);
    const [pendingMembers, setPendingMembers] = useState([]);
    const [name, setName] = useState(group.nome);
    const [meetingDay, setMeetingDay] = useState(group.dia_encontro);
    const [meetingHour, setMeetingHour] = useState(group.hora_encontro);

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
    const fetchGrupo = async () => {
        const grupoData = await get_grupo_by_id(grupoId);
        if (grupoData) {
            setGroup(grupoData);
            setMembers(grupoData.membros.map(m => m.email_user));
            setDecipherMembers(grupoData.membros_decifradores.map(m => m.email_user));
            setPendingMembers(grupoData.membros_pendentes.map(m => m.email_user));
            setName(grupoData.nome);
            setMeetingDay(lista_dias_semana.indexOf(grupoData.dia_encontro));
            setMeetingHour(grupoData.hora_encontro);

        }
    };
    //TODO: Pass group id to this page, when trying to edit a group.
    useEffect(() => {
        (async () => {

            await fetchGrupo();
        })();

    }, []);

    const generateToken = () => {
        const array = new Uint8Array(20);
        window.crypto.getRandomValues(array);
        return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    };

    const handleSubmit = async () => {
        if (members.length + pendingMembers.length < 3) {
            alert("Um grupo não pode ter menos de 3 membros!");
            return;
        }
        if (decipherMembers.length < 2) {
            alert("Um grupo tem de ter pelo menos 2 membros decifradores!");
            return;
        }
        if (meetingHour.length === 0) {
            alert("Por favor escolha data e hora!");
            return;
        }

        const updatedGroup = {
            ...group,
            membros: members.map(email => ({ email_user: email })),
            membros_decifradores: decipherMembers.map(email => ({ email_user: email })),
            nome: name,
            dia_encontro: meetingDay,
            hora_encontro: meetingHour
        };


        const hasChanges =
            JSON.stringify(updatedGroup.membros) !== JSON.stringify(group.membros) ||
            JSON.stringify(updatedGroup.membros_decifradores) !== JSON.stringify(group.membros_decifradores) ||
            updatedGroup.nome !== group.nome ||
            updatedGroup.dia_encontro !== group.dia_encontro ||
            updatedGroup.hora_encontro !== group.hora_encontro;

        if (hasChanges) {
            try {
                const allEmails = [
                    ...members,
                    ...decipherMembers
                ];
                const uniqueEmails = [...new Set(allEmails)];
                const users = await get_users_by_emails(uniqueEmails);
                if (!users) {
                    console.error("Operação Inválida"); //Failed to fetch users
                    return;
                }
                const getUser = (email) => users.find(u => u.email_user === email);
                const updatedGroup = {
                    ...group,
                    membros: members.map(email => getUser(email)),
                    membros_decifradores: decipherMembers.map(email => getUser(email)),
                    nome: name,
                    dia_encontro: meetingDay.length === 0 ? group.dia_encontro : lista_dias_semana[meetingDay],
                    hora_encontro: meetingHour,
                };
                console.log('updatedGroup2222222', updatedGroup)

                const novosPendentes = updatedGroup.membros.filter(m1 =>
                    !group.membros.some(m2 => m2.id_user === m1.id_user)
                );

                updatedGroup.membros_pendentes.push(...novosPendentes);

                updatedGroup.membros = updatedGroup.membros.filter(m1 =>
                    group.membros.some(m2 => m2.id_user === m1.id_user)
                );
                console.log(updatedGroup);
                const response = await update_grupo(updatedGroup);
                if (response) {
                    setGroup(updatedGroup);
                } else {
                    alert('Erro ao atualizar grupo.');
                    return;
                }
                const lista_decifradores_pendentes = group.membros_decifradores.filter(el => group.membros_pendentes.includes(el))

                let limite = group.membros_decifradores.length - lista_decifradores_pendentes.length

                if (group.membros.length >= 3 && limite >= 1) {
                    const result = await get_shares(group._id);

                    console.log(result)
                    const decifradores = result.membros_decifradores;

                    const shares = result.shares;
                    const size = shares.length;

                    for (let i = 0; i < size; i++) {
                        await sendFinalEmail(decifradores[i].email_user, shares[i], i);
                    }
                }
                for (const pendente of novosPendentes) {
                    const token = generateToken();
                    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

                    const novoConvite = {
                        payload: {
                            email: pendente.email_user,
                            group_id: updatedGroup._id,
                            token,
                            expires_at: expiresAt
                        }
                    };

                    const convite_criado = await criar_convite(novoConvite);

                    if (!convite_criado) {
                        alert(`Erro ao criar convite para ${pendente.email_user}`);
                        return;
                    }

                    const inviteLink = `https://localhost:3000/decisaoconvite/${token}`;

                    await sendInviteEmail(pendente.email_user, updatedGroup.nome, updatedGroup.admin.email_user, inviteLink);
                }
                func_set_flag_atualizar_info_user()
                alert('Grupo atualizado com sucesso!');
                navigate("/");
            } catch (error) {
                console.error("Erro ao atualizar o grupo");
                alert("Erro interno ao atualizar grupo.");
            }
        } else {
            alert('Nenhuma alteração detectada.');
        }
    };

    const on_change_decifradores = (el) => {
        if (decipherMembers.includes(el)) {
            let new_lista = decipherMembers.filter(elem => el !== elem)
            setDecipherMembers(new_lista)
        } else if (decipherMembers.length === 0) {
            setDecipherMembers([el])
        } else {
            setDecipherMembers((old) => [...old, el])
        }
    }

    return (
        <div className="d-flex flex-column vh-100 w-100" style={{ minWidth: "900px" }}>
            <div className="d-flex w-100 flex-shrink-0 fw-bold fs-3" style={{ color: 'white', height: '80px' }}>
                <div className="p-2" style={{ flex: 0.1 }}>
                    <img height={100} src={imagens.logotipo} alt="Logo" />
                </div>
                <div className="p-2" style={{ flex: 0.8 }}>
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
                    <h3 className="mb-4">Editar Grupo</h3>
                    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                        <div className="mb-3">
                            <label className="form-label">Nome do Grupo</label>
                            <input
                                type="text"
                                className="form-control"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Membros (Emails)</label>
                            <ReactTagInput
                                tags={members}
                                onChange={(newTags) => setMembers(newTags)}
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
                                value={meetingDay === undefined ? 0 : meetingDay}
                                onChange={(e) => setMeetingDay(Number(e.target.value))}
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
                            <TimePicker disableClock={true} locale={'pt'} clearIcon onChange={setMeetingHour} value={meetingHour === undefined ? '10:00' : meetingHour} />
                        </div>


                        {pendingMembers.length === 0 ? <></> :
                            <div
                                style={{
                                    marginTop: 25,
                                    marginBottom: 25
                                }}
                            >
                                <div>Membros com o pedido pendente</div>
                                {pendingMembers.map((el, key) => {
                                    return (
                                        <div
                                            key={key}>
                                            {el}
                                        </div>
                                    )
                                })}
                            </div>}
                        <div className="d-flex justify-content-center">
                            <button type="submit" className="btn btn-primary">Guardar Alterações</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
export default EditarGrupo_screen;