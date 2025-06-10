import { cores } from '../auxiliares/valores_estaticos.js';
import { imagens } from '../auxiliares/valores_estaticos.js';
import { useEffect, useState } from 'react';
import { IoIosExit } from "react-icons/io";
import { IoSettingsSharp } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import { get_lista_grupos_by_id_user, get_user_by_id, update_user_flag_presenca } from '../services/requests.js';
import { format_timestamp } from '../auxiliares/format_timestamp.js';
import { MdOutlineCheckBox } from "react-icons/md";
import { MdOutlineCheckBoxOutlineBlank } from "react-icons/md";
import { AuthContext } from '../authcontext/AuthProvider.js';
import { useContext } from 'react';
import { getISOWeek } from 'date-fns';

const Home = () => {

    const navigate = useNavigate();
    const { func_sign_out, user_info, flag_atualizar_info_user, func_set_flag_atualizar_info_user, func_set_user_info } = useContext(AuthContext);
    const [lista_grupos, set_lista_grupos] = useState([]);
    const [adminGrupos, setAdminGrupos] = useState([]);

    const handle_sair = () => {
        console.log('handle_sair')
        func_sign_out();
        navigate('/');
    }

    const handle_definicoes = () => {
        console.log('handle_definicoes')
    }
    const handle_entrar_novo_grupo = () => {
        navigate('/entrar_grupo');
        console.log('handle_entrar_novo_grupo')
    }
    const handle_criar_grupo = () => {

        navigate('/criargrupo');


        console.log('handle_criar_grupo1')
    }
    const handle_editar_grupo = () => {
        navigate('/editargrupo');

        console.log('handle_editar_grupo')
    }

    const get_info = async () => {
        try {

            const data = new Date();
            let semana_atual_aux = getISOWeek(data);
            if (flag_atualizar_info_user === true) {
                let new_user_info = await get_user_by_id(user_info._id)
                func_set_user_info(new_user_info)
                func_set_flag_atualizar_info_user()
                let lista_de_encontros_semana_atual = new_user_info.historico_presenca_encontros.find(el => el.semana === semana_atual_aux)

                if (lista_de_encontros_semana_atual !== undefined) {
                    set_lista_grupos(lista_de_encontros_semana_atual.lista_de_encontros_com_presenca)
                }
            } else {
                let lista_de_encontros_semana_atual = user_info.historico_presenca_encontros.find(el => el.semana === semana_atual_aux)

                if (lista_de_encontros_semana_atual !== undefined) {
                    set_lista_grupos(lista_de_encontros_semana_atual.lista_de_encontros_com_presenca)
                }
            }
            let grupos = await get_lista_grupos_by_id_user(user_info._id);
            if(!grupos){
                grupos = [];
            }
            setAdminGrupos(grupos);


        } catch (error) {
            console.error('Erro get_info:', error);
        }
    }

    const handle_change_flag_comparecer = async (obj) => {
        try {
            const data = new Date();
            let semana_atual = getISOWeek(data);
            let aux_user_info = user_info
            aux_user_info.historico_presenca_encontros = user_info.historico_presenca_encontros.map((el) => {
                if (el.semana === semana_atual) {
                    return {
                        semana: el.semana,
                        lista_de_encontros_com_presenca: el.lista_de_encontros_com_presenca.map((elem) => {
                            if (elem.id_grupo === obj.id_grupo) {
                                let obj_to_return = {
                                    id_grupo: obj.id_grupo,
                                    nome_grupo: obj.nome_grupo,
                                    dia_encontro_grupo: obj.dia_encontro_grupo,
                                    hora_encontro_grupo: obj.hora_encontro_grupo,
                                    flag_comparecer: !obj.flag_comparecer
                                }
                                return obj_to_return
                            } else {
                                return elem
                            }
                        })
                    }
                } else {
                    return el
                }
            })
            if (aux_user_info.historico_presenca_encontros !== undefined && aux_user_info.historico_presenca_encontros.length !== 0) {

                let user_atualizado = await update_user_flag_presenca(aux_user_info)
                func_set_user_info(user_atualizado)
                let lista_de_encontros_semana_atual = user_atualizado.historico_presenca_encontros.find(el => el.semana === semana_atual)

                if (lista_de_encontros_semana_atual !== undefined) {
                    set_lista_grupos(lista_de_encontros_semana_atual.lista_de_encontros_com_presenca)
                }
            }


        } catch (error) {
            console.error('Erro handle_change_flag_comparecer:', error);
        }

    }

    useEffect(() => {
        (async () => {
            if (user_info) {
                console.log('userInfo', user_info)
                await get_info();

            }


        })();
    }, []);

    return (
        <div style={{
            display: 'flex',
            flex: 1,
            width: '100vw',
            height: '100vh',
            flexDirection: 'column'

        }}>
            <div style={{
                display: 'flex',
                width: '100%',
                flex: 0.1,
                backgroundColor: cores.cor1,
                color: 'white',
                fontSize: 30,
                fontWeight: 'bold'
            }}>

                <div style={{
                    display: 'flex',
                    flex: 0.1,
                    justifyContent: 'center',
                }}>
                    <img height={70} src={imagens.logotipo} />

                </div>
                <div style={{
                    display: 'flex',
                    flex: 0.8,
                    alignItems: 'center',

                }}>
                    Bem vindo {user_info.email !== undefined ? user_info.email.split('@')[0] : ''}!
                </div>
                <div style={{
                    display: 'flex',
                    flex: 0.05,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <IoSettingsSharp onClick={handle_definicoes} />
                </div>
                <div style={{
                    display: 'flex',
                    flex: 0.05,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <IoIosExit onClick={handle_sair} />
                </div>

            </div>
            <div
                style={{
                    flex: 0.2,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifySelf: 'center',
                    alignSelf: 'center',
                    justifyContent: 'space-between',
                    display: 'flex',
                    width: '80%',
                }}
            >

                <button
                    style={{
                        backgroundColor: cores.cor1,
                        color: 'white',
                        borderRadius: 3,
                        border: '2px solid white', // define a borda
                        height: 50,
                        width: 250,
                    }}
                    onClick={handle_entrar_novo_grupo}
                >Entrar Num Grupo Novo</button>

                <button
                    style={{
                        backgroundColor: cores.cor1,
                        color: 'white',
                        borderRadius: 3,
                        border: '2px solid white', // define a borda
                        height: 50,
                        width: 250,
                    }}

                    onClick={handle_criar_grupo}

                >Criar Grupo</button>


            </div>

            <div style={{
                flex: 0.7,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '100%',

            }}>

                <div style={{
                    display: 'flex',
                    height: 50,
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '80%',
                }}>
                    <div style={{
                        flex: 0.2,
                        display: 'flex',
                        justifyContent: 'center',
                        backgroundColor: cores.cor2,
                        height: 50,
                        alignItems: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        marginRight: 2,
                        borderRadius: 3,


                    }}>
                        ID
                    </div>
                    <div style={{
                        flex: 0.3,
                        display: 'flex',
                        justifyContent: 'center',
                        backgroundColor: cores.cor2,
                        height: 50,
                        alignItems: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        marginLeft: 2,
                        marginRight: 2,
                        borderRadius: 3,

                    }}>
                        Nome
                    </div>
                    <div style={{
                        flex: 0.3,
                        display: 'flex',
                        justifyContent: 'center',
                        backgroundColor: cores.cor2,
                        height: 50,
                        alignItems: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        marginLeft: 2,
                        borderRadius: 3,

                    }}>
                        Data do encontro
                    </div>
                    <div style={{
                        flex: 0.2,
                        display: 'flex',
                        justifyContent: 'center',
                        backgroundColor: cores.cor2,
                        height: 50,
                        alignItems: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        marginLeft: 2,
                        borderRadius: 3,

                    }}>
                        Comparecer
                    </div>
                    <div style={{
                        flex: 0.2,
                        display: 'flex',
                        justifyContent: 'center',
                        backgroundColor: cores.cor2,
                        height: 50,
                        alignItems: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        marginLeft: 2,
                        borderRadius: 3,
                    }}>
                        Decifrar
                    </div>
                    <div style={{
                        flex: 0.15,
                        display: 'flex',
                        justifyContent: 'center',
                        backgroundColor: cores.cor2,
                        height: 50,
                        alignItems: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        marginLeft: 2,
                        borderRadius: 3,
                    }}>
                        Ações
                    </div>
                </div>

                {
                    lista_grupos.length === 0 ?

                        <div style={{
                            display: 'flex',
                            height: 50,
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '80%',
                            borderRadius: 3,
                            borderColor: cores.cor2,
                            borderWidth: 3,
                        }}>
                            Sem Informação
                        </div>
                        :
                        lista_grupos.map((el, key) => {
                            let isAdmin;
                            if(adminGrupos.length > 0){
                                const group = adminGrupos.find(g => g._id === el.id_grupo);
                                isAdmin = group && group.admin.id_user === user_info._id;
                            }
                            
                            return (
                                <div key={key} style={{
                                    marginTop: 3,
                                    display: 'flex',
                                    height: 50,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '80%',
                                }}>
                                    <div style={{
                                        flex: 0.2,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        backgroundColor: cores.cor2,
                                        height: 50,
                                        alignItems: 'center',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        marginRight: 2,
                                        borderRadius: 3,


                                    }}>
                                        {el.id_grupo}
                                    </div>
                                    <div style={{
                                        flex: 0.3,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        backgroundColor: cores.cor2,
                                        height: 50,
                                        alignItems: 'center',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        marginLeft: 2,
                                        marginRight: 2,
                                        borderRadius: 3,

                                    }}>
                                        {el.nome_grupo}
                                    </div>
                                    <div style={{
                                        flex: 0.3,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        backgroundColor: cores.cor2,
                                        height: 50,
                                        alignItems: 'center',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        marginLeft: 2,
                                        borderRadius: 3,

                                    }}>
                                        {el.dia_encontro_grupo} {el.hora_encontro_grupo}h
                                    </div>
                                    <div style={{
                                        flex: 0.2,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        backgroundColor: cores.cor2,
                                        height: 50,
                                        alignItems: 'center',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        marginLeft: 2,
                                        borderRadius: 3,

                                    }}>
                                        {
                                            el.flag_comparecer === true ?
                                                <MdOutlineCheckBox onClick={() => handle_change_flag_comparecer(el)} />
                                                :
                                                <MdOutlineCheckBoxOutlineBlank onClick={() => handle_change_flag_comparecer(el)} />

                                        }

                                    </div>
                                    <div style={{
                                        flex: 0.2,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginLeft: 2,
                                    }}>
                                        <button
                                            style={{
                                                backgroundColor: cores.cor2,
                                                border: 'none',
                                                borderRadius: 3,
                                                color: 'white',
                                                padding: '5px 10px',
                                                cursor: 'pointer',
                                            }}
                                            onClick={() => navigate('/decifrar_grupo', { state: { grupoId: el.id_grupo } })}
                                        >
                                            Decifrar
                                        </button>
                                    </div>
                                    <div style={{
                                        flex: 0.15,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginLeft: 2,
                                    }}>
                                        {isAdmin ? (
                                            <button
                                                style={{
                                                    backgroundColor: cores.cor2,
                                                    border: 'none',
                                                    borderRadius: 3,
                                                    color: 'white',
                                                    padding: '5px 10px',
                                                    cursor: 'pointer',
                                                }}
                                                onClick={() => navigate('/editargrupo', { state: { grupoId: el.id_grupo } })}
                                            >Editar</button>
                                        ) : (
                                            <span></span>
                                        )}
                                    </div>
                                </div>


                            )


                        })
                }



            </div>
        </div>
    );
}

export default Home;
