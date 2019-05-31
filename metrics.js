const R = require('ramda');

const data = {
    "220669480": {
        "Id": 220669480,
        "location": "Bridgewatch",
        "type": "Sell",
        "anotherId": 636937175370274700,
        "rest": {
            "2": [
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0
            ],
            "3": true,
            "4": [
                55,
                31,
                -5,
                -39,
                111,
                -35,
                44,
                66,
                -114,
                -23,
                -55,
                -51,
                123,
                -51,
                52,
                74
            ],
            "6": 3
        },
        "BuyerName": "Phosphene",
        "ItemTypeId": "T2_MOUNT_MULE",
        "Amount": 1,
        "UnitPriceSilver": 5175,
        "TotalAfterTaxes": 5071.5,
        "itemName": "Novice's Mule"
    },
    "220678527": {
        "Id": 220678527,
        "location": "Steppe Cross",
        "type": "Buy",
        "anotherId": 636937178098108200,
        "rest": {
            "2": [
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0
            ],
            "3": true,
            "4": [
                55,
                31,
                -5,
                -39,
                111,
                -35,
                44,
                66,
                -114,
                -23,
                -55,
                -51,
                123,
                -51,
                52,
                74
            ],
            "6": 3
        },
        "BuyerName": "Keema",
        "ItemTypeId": "T2_MOUNT_MULE",
        "Amount": 1,
        "UnitPriceSilver": 2500,
        "TotalAfterTaxes": 2450,
        "itemName": "Novice's Mule"
    },
    "220687438": {
        "Id": 220687438,
        "location": "Bridgewatch",
        "type": "Sell",
        "anotherId": 636937180708290400,
        "rest": {
            "2": [
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0
            ],
            "3": true,
            "4": [
                55,
                31,
                -5,
                -39,
                111,
                -35,
                44,
                66,
                -114,
                -23,
                -55,
                -51,
                123,
                -51,
                52,
                74
            ],
            "6": 3
        },
        "BuyerName": "Lithis",
        "ItemTypeId": "T2_MOUNT_MULE",
        "Amount": 1,
        "UnitPriceSilver": 5100,
        "TotalAfterTaxes": 4998,
        "itemName": "Novice's Mule"
    }
}

const filterProps = [
    "location",
    "type",
    "BuyerName",
    // "ItemTypeId",
    "Amount",
    // "UnitPriceSilver",
    // "TotalAfterTaxes",
    "itemName",
];

// R.pipe(
//     R.values,
//     R.map(R.pipe(
//         ({ type, Amount, UnitPriceSilver }) => 
//         tyqa
//     )),
//     console.log,
// )(data)
const filters = {
    // itemName: "Novice's Mule",
    // type: "Sell",
    // BuyerName: ""
};

// filterName = "Adept\'s Bag";
// filterProp = "itemName";
const makeFilter = (filterProp, filterName) => R.pipe(
    R.values,
    R.filter(R.propEq(filterProp, filterName)),
)

const itemsFiltered = R.reduce(
    (p, filter) => makeFilter(...filter)(p),
    data, R.toPairs(filters)
)

const items = filterProp => R.pipe(
    R.values,
    R.map(R.propOr("", filterProp)),
    R.uniq,
    R.sortBy(R.identity),
    R.drop(1),
)(data)

console.log(
    itemsFiltered
)
