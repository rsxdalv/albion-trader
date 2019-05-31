module.exports.parseReadMail = x => {
    const Id = x[0];
    const y = x[1].split('|');
    const length = y.length;
    if (length === 5) {
        return {
            Id,
            BuyerName: y[0],
            Amount: parseInt(y[1], 10),
            ItemTypeId: y[2],
            UnitPriceSilver: parseInt(y[3], 10) / 10000,
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
