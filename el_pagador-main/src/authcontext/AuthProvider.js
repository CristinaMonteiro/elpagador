import React, { useContext, createContext, useState } from 'react';
import Cookies from 'js-cookie';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [flag_sign, set_flag_sign] = useState(false);
    const [flag_user_pode_ver_desafio, set_flag_user_pode_ver_desafio] = useState(false)
    const [user_token, set_user_token] = useState()
    const [user_info, set_user_info] = useState()
    const [flag_registo, set_flag_registo] = useState(false);
    const [flag_atualizar_info_user, set_flag_atualizar_info_user] = useState(false);

    const func_set_user_token = (token) => {
        Cookies.set('token', token)
    }

    const func_sign_in = (user = undefined) => {

        set_flag_sign(true);
        set_user_info(user);
    };

    const func_set_user_info = (user) => {
        set_user_info(user);

    }
    const func_set_flag_atualizar_info_user = () => {
        set_flag_atualizar_info_user(!flag_atualizar_info_user)
    }

    const func_user_pode_ver_desafio = () => {
        set_flag_user_pode_ver_desafio(true);
    };

    const func_user_pode_registar = () => set_flag_registo(true);
    const func_reset_flags = () => {
        set_flag_sign(false);
        set_flag_user_pode_ver_desafio(false);
        set_flag_registo(false);
    };

    const func_sign_out = () => {
        set_flag_sign(false);
        set_flag_user_pode_ver_desafio(false);
        set_flag_registo(false);
        set_user_token(null);
        set_user_info(null);
        sessionStorage.clear();// serve para limpar o sessionStorage (email)
    }

    return (
        <AuthContext.Provider value={{ func_set_user_token, flag_atualizar_info_user, func_set_flag_atualizar_info_user, func_set_user_info, flag_sign, func_sign_in, func_sign_out, user_token, user_info, set_user_info, flag_user_pode_ver_desafio, func_user_pode_ver_desafio, func_user_pode_registar, func_reset_flags, flag_registo }}>
            {children}
        </AuthContext.Provider>
    );
};


