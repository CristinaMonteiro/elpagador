const { getISOWeek } = require('date-fns');


const add_lista_historico_presenca_encontros = async (User, grupo, conviteUser = undefined) => {
    try {

        const data = new Date();
        let semana_atual = getISOWeek(data);
        let obj_historico_aux = {
            id_grupo: grupo._id,
            nome_grupo: grupo.nome,
            dia_encontro_grupo: grupo.dia_encontro,
            hora_encontro_grupo: grupo.hora_encontro,
            flag_comparecer: false,
        }
        let user;
        if (conviteUser === undefined) {
            user = await User.findById(grupo.admin.id_user);
        } else {
            user = conviteUser;
        }

        const semanaExiste = user.historico_presenca_encontros.find(
            s => s.semana === semana_atual
        );

        if (semanaExiste) {
            await User.updateOne(
                { _id: user._id, "historico_presenca_encontros.semana": semana_atual },
                {
                    $addToSet: {
                        "historico_presenca_encontros.$.lista_de_encontros_com_presenca": obj_historico_aux
                    }
                }
            );
        } else {
            await User.updateOne(
                { _id: user._id },
                {
                    $push: {
                        historico_presenca_encontros: {
                            semana: semana_atual,
                            lista_de_encontros_com_presenca: [obj_historico_aux]
                        }
                    }
                }
            );
        }
    } catch (error) {
        console.log('error escolher_membros_pagadores :', error);
    }
}

const update_lista_historico_presenca_encontros = async (User, Grupo, grupo) => {
    try {
        const data = new Date();
        let semana_atual = getISOWeek(data);

        const grupoData = await Grupo.findById(grupo._id).select('membros');
        const membrosIds = grupoData.membros.map(m => m.id_user);
        const users = await User.find({ _id: { $in: membrosIds } });

        let obj_historico_aux = {
            id_grupo: grupo._id,
            nome_grupo: grupo.nome,
            dia_encontro_grupo: grupo.dia_encontro,
            hora_encontro_grupo: grupo.hora_encontro,
            flag_comparecer: false,
        };

        for(const user of users){
            const semanaExiste = user.historico_presenca_encontros.find(
                s => s.semana === semana_atual
            );

            if (semanaExiste) {
                const encontroExiste = semanaExiste.lista_de_encontros_com_presenca.some(
                    encontro => encontro.id_grupo === grupo._id
                );

                if (encontroExiste) {
                    await User.updateOne(
                        { _id: user._id },
                        {
                            $set: {
                            "historico_presenca_encontros.$[semanaElem].lista_de_encontros_com_presenca.$[encontroElem]": obj_historico_aux
                            }
                        },
                        {
                            arrayFilters: [
                            { "semanaElem.semana": semana_atual },
                            { "encontroElem.id_grupo": grupo._id }
                            ]
                        }
                    );
                }
            }
        }
        
    } catch (error) {
        console.log('error escolher_membros_pagadores :', error);
    }
}
module.exports = { add_lista_historico_presenca_encontros, update_lista_historico_presenca_encontros };