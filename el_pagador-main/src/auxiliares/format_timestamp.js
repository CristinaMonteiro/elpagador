import moment from "moment"

export const format_timestamp = (timestamp) => {
    let dia = moment(timestamp).format('DD-MM-YYYY')
    let hora = moment(timestamp).format('HH:mm')

    return 'Dia: ' + dia + '\nHora: ' + hora

}