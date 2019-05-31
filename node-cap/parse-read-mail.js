module.exports.parseReadMail = x => {
    const Id = x[0];
    const body = x[1].split('|');
    const length = body.length;
    if (length === 5) {
        return {
            Id,
            BuyerName: body[0],
            ItemTypeId: body[2],
            Amount: parseInt(body[1], 10),
            UnitPriceSilver: parseInt(body[3], 10) / 10000,
        }
    }
    return;
}

const test = false
if (test) {
    const x = {
        '0': 244655358,
        '1': 'Niv1ra|1|T8_FISH_FRESHWATER_ALL_COMMON|5010000|5010000',
        '2': [],
        '3': [],
        '4': [],
        '5': [],
        '6': [[-1]],
        '7': [[-1]],
        '8': [],
        '253': 166,
        debugMessage: null
    };    
    parseReadMail(x); /*?*/
}
