import emailjs from 'emailjs-com';

export const sendInviteEmail = async (toEmail, groupName, adminEmail, inviteLink) => {

    try {
        let response = await emailjs.send(
            'service_gormoir',
            'template_bf8jun8',
            {
                to_email: toEmail,
                email_admin: adminEmail,
                group_name: groupName,
                invite_link: inviteLink,
            },
            'VdojIDY5fDIBorMO9'
        )
        console.log('SUCCESS!', response.status, response.text);

    } catch (err) {
        console.log('FAILED...', err);

    }

};

export const sendFinalEmail = async (toEmail, share, ordem) => {
    try {
        console.log('sendFinalEmail_________________________-')
        let response = await emailjs.send(
            'service_gormoir',
            'template_nmqsyzq',
            {
                to_email: toEmail,
                share: share,
                ordem:ordem
            },
            'VdojIDY5fDIBorMO9'
        );
        console.log('SUCCESS!'); //, response.status, response.text
    } catch (err) {
        console.log('FAILED...'); //, err
    }
};