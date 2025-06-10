//requests.js
import Cookies from 'js-cookie';


export const url = 'https://localhost:3001/'

export const header_config = {
    'Content-Type': 'application/json',
    'withCredentials': true,
    'Authorization': `Bearer ${Cookies.get('token')}`,
}

export const login = async (payload) => {
    try {
        const response = await fetch(url + 'login', {
            method: 'POST',
            headers: header_config,
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        const data = await response.json();
        if (response.ok) {
            return data
        } else {
            return null
        }
    } catch (error) {
        console.error('Erro ao login utilizador:', error);
        return null

    }
}

export const criar_utilizador = async (payload) => {
    try {
        const response = await fetch(url + 'registo', {
            method: 'POST',
            headers: header_config,
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        const data = await response.json();
        if (response.ok) {
            return data
        } else {
            return null
        }
    } catch (error) {
        console.error('Erro ao criar_utilizador utilizador:', error);
        return null

    }
}


export const get_user_by_id = async (id) => {
    try {
        const response = await fetch(url + 'get_user_by_id/' + id, {
            method: 'GET',
            headers: header_config,
            credentials: 'include'
        });
        const data = await response.json();
        if (response.ok) {
            return data
        } else {
            return null
        }
    } catch (error) {
        console.error('Erro get_user_by_id:', error);
        return null;
    }
}
export const update_user_flag_presenca = async (payload) => {
    try {
        const response = await fetch(url + 'update_user_flag_presenca', {
            method: 'POST',
            headers: header_config,
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        const data = await response.json();
        if (response.ok) {
            return data
        } else {
            return null
        }
    } catch (error) {
        console.error('Operação Inválida'); //'Erro update_user_flag_presenca:', error
        return null

    }
}

export const criar_grupo = async (payload) => {
    try {
        const response = await fetch(url + 'create_grupo', {
            method: 'POST',
            headers: header_config,
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        const data = await response.json();
        if (response.ok) {
            return data
        } else {
            return null
        }
    } catch (error) {
        console.error('Erro ao registar grupo');
        return null

    }
}

export const update_grupo = async (payload) => {
    try {
        const response = await fetch(url + 'update_grupo', {
            method: 'POST',
            headers: header_config,
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        const data = await response.json();
        if (response.ok) {
            return data
        } else {
            return null
        }
    } catch (error) {
        console.error('Erro ao registar grupo');
        return null

    }
}

export const get_lista_grupos_by_id_user = async (id) => {
    try {

        console.log('Cookies.get()', Cookies.get('token'))

        const response = await fetch(url + 'get_lista_grupos_by_id_user/' + id, {
            method: 'GET',
            headers: header_config,
            credentials: 'include'
        });
        const data = await response.json();
        if (response.ok) {
            return data
        } else {
            return null
        }
    } catch (error) {
        console.error('Erro ao registar grupo');
        return null;
    }
}

export const get_users_by_emails = async (emails) => {
    try {
        const response = await fetch(url + 'get_users_by_emails', {
            method: 'POST',
            headers: header_config,
            body: JSON.stringify({ emails }),
            credentials: 'include'
        });

        const data = await response.json();
        return response.ok ? data : null;
    } catch (error) {
        console.error('Erro ao obter utilizadores por email'); //
        return null;
    }
};

export const get_grupo_by_id = async (id) => {
    try {
        const response = await fetch(url + 'get_grupo_by_id/' + id, {
            method: 'GET',
            headers: header_config,
            credentials: 'include'
        });

        const data = await response.json();
        return response.ok ? data : null;
    } catch (error) {
        console.error('Erro ao obter grupo por ID');
        return null;
    }
};

export const criar_convite = async (payload) => {
    try {
        const response = await fetch(url + 'create_convite', {
            method: 'POST',
            headers: header_config,
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        const data = await response.json();
        if (response.ok) {
            return data
        } else {
            return null
        }
    } catch (error) {
        console.error('Erro ao criar convite');
        return null

    }
}

export const fetch_invite_details = async (token) => {
    try {
        const response = await fetch(url + 'invite/' + token, {
            method: 'GET',
            headers: header_config,
            credentials: 'include'
        });

        const data = await response.json();
        return response.ok ? data : null;
    } catch (error) {
        console.error('Erro ao obter convite');
        return null;
    }
};

export const answer_invite = async (token, answer) => {
    try {
        console.log('idhfjsdknfksdjncksdc', Cookies.get('token'))
        const response = await fetch(url + 'invite/' + token + '/respond', {
            method: 'POST',
            headers: header_config,
            body: JSON.stringify({ answer }),
            credentials: 'include'
        });

        const data = await response.json();
        return response.ok ? data : null;
    } catch (error) {
        console.error('Erro na resposta do convite');
        return null;
    }
};

export const get_shares = async (id) => {
    try {
        const response = await fetch(url + 'shares/' + id, {
            method: 'GET',
            headers: header_config,
            credentials: 'include'
        });

        const data = await response.json();
        return response.ok ? data : null;
    } catch (error) {
        console.error('Erro ao obter shares');
        return null;
    }
}