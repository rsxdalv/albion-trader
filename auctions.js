/**
  * @typedef {Object} MyAuctionsModel
  * @property {Number} Amount
  * @property {String} AuctionType
  * @property {String} BuyerCharacterId
  * @property {String} BuyerName
  * @property {Number} EnchantmentLevel
  * @property {String} Expires
  * @property {Boolean} HasBuyerFetched
  * @property {Boolean} HasSellerFetched
  * @property {Number} Id
  * @property {Boolean} IsFinished
  * @property {String} ItemGroupTypeId
  * @property {String} ItemTypeId
  * @property {Number} QualityLevel
  * @property {String} SellerCharacterId
  * @property {String} SellerName
  * @property {Number} Tier
  * @property {Number} TotalPriceSilver
  * @property {Number} UnitPriceSilver
  */

const R = require('ramda');
const fs = require('fs');
const path = require('path');

let db = {};

/** @param {MyAuctionsModel} x */
const parseAuctions = x => R.pipe(
    R.nth(0),
    R.map(R.pipe(
        x => JSON.parse(x),
        R.evolve({
            UnitPriceSilver: R.multiply(1 / 10000),
            TotalPriceSilver: R.multiply(1 / 10000),
        })
    )),
    R.groupBy(R.prop("Id")),
    R.map(R.head),
    // R.tap(console.log),
)(x)

module.exports.readAuctions = x => {
    db = R.merge(db, parseAuctions(x))
}

const { itemNames } = require('./item-names')
const { titleCase } = require('change-case');

const clientView = R.pipe(
    R.map(R.pipe(
        R.converge(R.merge, [R.identity, R.applySpec({
            itemName: R.pipe(
                R.prop("ItemTypeId"),
                R.converge(R.propOr(R.__, R.__, itemNames), [R.unary(titleCase), R.identity]),
            ),
        })]),
    )),
    R.values,
    R.reverse,
)

const dataDir = process.cwd();

module.exports.saveAuctions = (then = () => { }, bak = false) => {
    fs.writeFile(path.join(dataDir, bak ? "./database.auctions.bak.json" : "./database.auctions.json"), JSON.stringify(db), (e) => {
        e ? console.error(e) : void 0;
        then()
    });
};

const autoSaveAuctions = () => {
    module.exports.saveAuctions(() => { }, true);
    setTimeout(() => {
        autoSaveAuctions();
    }, 2000);
}

module.exports.loadAuctions = () => {
    fs.readFile(path.join(dataDir, "./database.auctions.json"), (e, data) => e ?
        console.error(e) : (
            db = JSON.parse(data.toString()),
            // updateID = Math.random(),
            autoSaveAuctions()
        )
    );
}

module.exports.loadAuctions();

module.exports.auctionsTableView = R.pipe(
    clientView,
    R.values,
    R.map(R.pipe(
        R.omit([
            "HasBuyerFetched",
            "HasSellerFetched",
            "SellerCharacterId",
            "BuyerCharacterId",
            "ItemTypeId",
            "ItemGroupTypeId",
        ]),
        R.values
    )),
    R.concat([[
        "Id",
        "Unit Price Silver",
        "Total Price Silver",
        "Amount",
        "Tier",
        "Is Finished",
        "Auction Type",
        // "Has Buyer Fetched",
        // "Has Seller Fetched",
        // "Seller Character Id",
        "Seller Name",
        // "Buyer Character Id",
        "Buyer Name",
        // "Item Type Id",
        // "Item Group Type Id",
        "Enchantment Level",
        "Quality Level",
        "Expires",
        "Name",
    ]]),
    R.map(R.join("\t")),
    R.join("\n"),
)

module.exports.getAuctionsTableView = () => module.exports.auctionsTableView(db);

const test = false
if (test) {
    const opAuctionGetMyOpenOffersData = {
        '0':
            ['{"Id":561241621,"UnitPriceSilver":110000000,"TotalPriceSilver":220000000,"Amount":2,"Tier":2,"IsFinished":false,"AuctionType":"offer","HasBuyerFetched":false,"HasSellerFetched":false,"SellerCharacterId":"d9fb1f37-dd6f-422c-8ee9-c9cd7bcd344a","SellerName":"BasicAF","BuyerCharacterId":null,"BuyerName":null,"ItemTypeId":"T2_MOUNT_MULE","ItemGroupTypeId":"T2_MOUNT_MULE","EnchantmentLevel":0,"QualityLevel":1,"Expires":"2019-06-21T08:52:20.182744"}',
                '{"Id":566766215,"UnitPriceSilver":100000000,"TotalPriceSilver":700000000,"Amount":7,"Tier":2,"IsFinished":false,"AuctionType":"offer","HasBuyerFetched":false,"HasSellerFetched":false,"SellerCharacterId":"d9fb1f37-dd6f-422c-8ee9-c9cd7bcd344a","SellerName":"BasicAF","BuyerCharacterId":null,"BuyerName":null,"ItemTypeId":"T2_MOUNT_MULE","ItemGroupTypeId":"T2_MOUNT_MULE","EnchantmentLevel":0,"QualityLevel":1,"Expires":"2019-06-22T05:45:14.263714"}',
                '{"Id":570944612,"UnitPriceSilver":28800000,"TotalPriceSilver":28800000,"Amount":1,"Tier":5,"IsFinished":false,"AuctionType":"offer","HasBuyerFetched":false,"HasSellerFetched":false,"SellerCharacterId":"d9fb1f37-dd6f-422c-8ee9-c9cd7bcd344a","SellerName":"BasicAF","BuyerCharacterId":null,"BuyerName":null,"ItemTypeId":"T5_FISH_SALTWATER_ALL_RARE","ItemGroupTypeId":"T5_FISH_SALTWATER_ALL_RARE","EnchantmentLevel":0,"QualityLevel":1,"Expires":"2019-06-22T21:16:04.627177"}',
                '{"Id":570961155,"UnitPriceSilver":110000000,"TotalPriceSilver":1100000000,"Amount":10,"Tier":2,"IsFinished":false,"AuctionType":"offer","HasBuyerFetched":false,"HasSellerFetched":false,"SellerCharacterId":"d9fb1f37-dd6f-422c-8ee9-c9cd7bcd344a","SellerName":"BasicAF","BuyerCharacterId":null,"BuyerName":null,"ItemTypeId":"T2_MOUNT_MULE","ItemGroupTypeId":"T2_MOUNT_MULE","EnchantmentLevel":0,"QualityLevel":1,"Expires":"2019-06-22T21:18:32.546453"}',
                '{"Id":570963363,"UnitPriceSilver":120000000,"TotalPriceSilver":1200000000,"Amount":10,"Tier":2,"IsFinished":false,"AuctionType":"offer","HasBuyerFetched":false,"HasSellerFetched":false,"SellerCharacterId":"d9fb1f37-dd6f-422c-8ee9-c9cd7bcd344a","SellerName":"BasicAF","BuyerCharacterId":null,"BuyerName":null,"ItemTypeId":"T2_MOUNT_MULE","ItemGroupTypeId":"T2_MOUNT_MULE","EnchantmentLevel":0,"QualityLevel":1,"Expires":"2019-06-22T21:18:53.17029"}',
                '{"Id":570963674,"UnitPriceSilver":130000000,"TotalPriceSilver":1820000000,"Amount":14,"Tier":2,"IsFinished":false,"AuctionType":"offer","HasBuyerFetched":false,"HasSellerFetched":false,"SellerCharacterId":"d9fb1f37-dd6f-422c-8ee9-c9cd7bcd344a","SellerName":"BasicAF","BuyerCharacterId":null,"BuyerName":null,"ItemTypeId":"T2_MOUNT_MULE","ItemGroupTypeId":"T2_MOUNT_MULE","EnchantmentLevel":0,"QualityLevel":1,"Expires":"2019-06-22T21:19:02.736489"}',
                '{"Id":581110628,"UnitPriceSilver":109960000,"TotalPriceSilver":109960000,"Amount":1,"Tier":6,"IsFinished":false,"AuctionType":"offer","HasBuyerFetched":false,"HasSellerFetched":false,"SellerCharacterId":"d9fb1f37-dd6f-422c-8ee9-c9cd7bcd344a","SellerName":"BasicAF","BuyerCharacterId":null,"BuyerName":null,"ItemTypeId":"T6_POTION_HEAL","ItemGroupTypeId":"T6_POTION_HEAL","EnchantmentLevel":0,"QualityLevel":1,"Expires":"2019-06-24T12:18:36.308765"}'],
        '253': 'opAuctionGetMyOpenOffers',
        debugMessage: 'NumOfAuctions: 8'
    };

    const opAuctionGetFinishedAuctionsData = {
        '0':
            ['{"Id":593307628,"UnitPriceSilver":15870000,"TotalPriceSilver":15870000,"Amount":1,"Tier":4,"IsFinished":true,"AuctionType":"request","HasBuyerFetched":false,"HasSellerFetched":true,"SellerCharacterId":"cef180a3-8dd8-4ff9-89c9-f8a13d03d98c","SellerName":"jxlmane","BuyerCharacterId":"d9fb1f37-dd6f-422c-8ee9-c9cd7bcd344a","BuyerName":"BasicAF","ItemTypeId":"T4_CAPE","ItemGroupTypeId":"T4_CAPE","EnchantmentLevel":0,"QualityLevel":1,"Expires":"2019-06-27T08:44:12.142196"}',
                '{"Id":579402604,"UnitPriceSilver":5010000,"TotalPriceSilver":5010000,"Amount":1,"Tier":8,"IsFinished":true,"AuctionType":"request","HasBuyerFetched":false,"HasSellerFetched":true,"SellerCharacterId":"b00053b4-08b6-4302-a474-5aac27c8ffb7","SellerName":"Niv1ra","BuyerCharacterId":"d9fb1f37-dd6f-422c-8ee9-c9cd7bcd344a","BuyerName":"BasicAF","ItemTypeId":"T8_FISH_FRESHWATER_ALL_COMMON","ItemGroupTypeId":"T8_FISH_FRESHWATER_ALL_COMMON","EnchantmentLevel":0,"QualityLevel":1,"Expires":"2019-06-29T14:37:56.604184"}',
                '{"Id":581306430,"UnitPriceSilver":126290000,"TotalPriceSilver":126290000,"Amount":1,"Tier":4,"IsFinished":true,"AuctionType":"request","HasBuyerFetched":false,"HasSellerFetched":true,"SellerCharacterId":"7e739b8e-c5a9-49dd-8552-ff2e48d87a44","SellerName":"Vlodermark","BuyerCharacterId":"d9fb1f37-dd6f-422c-8ee9-c9cd7bcd344a","BuyerName":"BasicAF","ItemTypeId":"T4_MOUNT_OX","ItemGroupTypeId":"T4_MOUNT_OX","EnchantmentLevel":0,"QualityLevel":1,"Expires":"2019-06-26T10:00:52.282388"}',
                '{"Id":593438659,"UnitPriceSilver":15870000,"TotalPriceSilver":63480000,"Amount":4,"Tier":4,"IsFinished":true,"AuctionType":"request","HasBuyerFetched":false,"HasSellerFetched":true,"SellerCharacterId":"c7a5af35-5e4d-4d69-a73a-88d72024806c","SellerName":"AbigailNolan","BuyerCharacterId":"d9fb1f37-dd6f-422c-8ee9-c9cd7bcd344a","BuyerName":"BasicAF","ItemTypeId":"T4_CAPE","ItemGroupTypeId":"T4_CAPE","EnchantmentLevel":0,"QualityLevel":1,"Expires":"2019-06-26T11:05:00.986455"}',
                '{"Id":593307572,"UnitPriceSilver":15870000,"TotalPriceSilver":31740000,"Amount":2,"Tier":4,"IsFinished":true,"AuctionType":"request","HasBuyerFetched":false,"HasSellerFetched":true,"SellerCharacterId":"cef180a3-8dd8-4ff9-89c9-f8a13d03d98c","SellerName":"jxlmane","BuyerCharacterId":"d9fb1f37-dd6f-422c-8ee9-c9cd7bcd344a","BuyerName":"BasicAF","ItemTypeId":"T4_CAPE","ItemGroupTypeId":"T4_CAPE","EnchantmentLevel":0,"QualityLevel":1,"Expires":"2019-06-27T08:44:09.299463"}',
                '{"Id":593517326,"UnitPriceSilver":15870000,"TotalPriceSilver":15870000,"Amount":1,"Tier":4,"IsFinished":true,"AuctionType":"request","HasBuyerFetched":false,"HasSellerFetched":true,"SellerCharacterId":"3f9b97e3-bd98-4f33-af4a-87fb29bf8a54","SellerName":"vend2007","BuyerCharacterId":"d9fb1f37-dd6f-422c-8ee9-c9cd7bcd344a","BuyerName":"BasicAF","ItemTypeId":"T4_CAPE","ItemGroupTypeId":"T4_CAPE","EnchantmentLevel":0,"QualityLevel":1,"Expires":"2019-06-26T11:37:00.190815"}',
                '{"Id":593621517,"UnitPriceSilver":15870000,"TotalPriceSilver":15870000,"Amount":1,"Tier":4,"IsFinished":true,"AuctionType":"request","HasBuyerFetched":false,"HasSellerFetched":true,"SellerCharacterId":"0e1d8cec-cd81-4e1b-8490-cf53cd8e4aab","SellerName":"SaethZig","BuyerCharacterId":"d9fb1f37-dd6f-422c-8ee9-c9cd7bcd344a","BuyerName":"BasicAF","ItemTypeId":"T4_CAPE","ItemGroupTypeId":"T4_CAPE","EnchantmentLevel":0,"QualityLevel":1,"Expires":"2019-06-26T12:05:44.160491"}'],
        '253': 'opAuctionGetFinishedAuctions',
        debugMessage: 'NumOfAuctions: 7'
    }

    const opAuctionGetMyOpenRequestsData = {
        '0':
            ['{"Id":579403424,"UnitPriceSilver":4350000,"TotalPriceSilver":8700000,"Amount":2,"Tier":7,"IsFinished":false,"AuctionType":"request","HasBuyerFetched":false,"HasSellerFetched":false,"SellerCharacterId":null,"SellerName":null,"BuyerCharacterId":"d9fb1f37-dd6f-422c-8ee9-c9cd7bcd344a","BuyerName":"BasicAF","ItemTypeId":"T7_FISH_FRESHWATER_ALL_COMMON","ItemGroupTypeId":"T7_FISH_FRESHWATER_ALL_COMMON","EnchantmentLevel":0,"QualityLevel":1,"Expires":"2019-06-24T04:47:35.857469"}',
                '{"Id":579413608,"UnitPriceSilver":8120000,"TotalPriceSilver":8120000,"Amount":1,"Tier":5,"IsFinished":false,"AuctionType":"request","HasBuyerFetched":false,"HasSellerFetched":false,"SellerCharacterId":null,"SellerName":null,"BuyerCharacterId":"d9fb1f37-dd6f-422c-8ee9-c9cd7bcd344a","BuyerName":"BasicAF","ItemTypeId":"T5_FISH_FRESHWATER_FOREST_RARE","ItemGroupTypeId":"T5_FISH_FRESHWATER_FOREST_RARE","EnchantmentLevel":0,"QualityLevel":1,"Expires":"2019-06-24T04:49:54.360686"}',
                '{"Id":579480812,"UnitPriceSilver":185300000,"TotalPriceSilver":370600000,"Amount":2,"Tier":4,"IsFinished":false,"AuctionType":"request","HasBuyerFetched":false,"HasSellerFetched":false,"SellerCharacterId":null,"SellerName":null,"BuyerCharacterId":"d9fb1f37-dd6f-422c-8ee9-c9cd7bcd344a","BuyerName":"BasicAF","ItemTypeId":"T4_MOUNT_HORSE","ItemGroupTypeId":"T4_MOUNT_HORSE","EnchantmentLevel":0,"QualityLevel":1,"Expires":"2019-06-24T05:05:36.186779"}',
                '{"Id":579507147,"UnitPriceSilver":52240000,"TotalPriceSilver":52240000,"Amount":1,"Tier":6,"IsFinished":false,"AuctionType":"request","HasBuyerFetched":false,"HasSellerFetched":false,"SellerCharacterId":null,"SellerName":null,"BuyerCharacterId":"d9fb1f37-dd6f-422c-8ee9-c9cd7bcd344a","BuyerName":"BasicAF","ItemTypeId":"T6_POTION_HEAL","ItemGroupTypeId":"T6_POTION_HEAL","EnchantmentLevel":0,"QualityLevel":1,"Expires":"2019-06-24T05:12:01.869213"}',
                '{"Id":579539904,"UnitPriceSilver":185300000,"TotalPriceSilver":185300000,"Amount":1,"Tier":4,"IsFinished":false,"AuctionType":"request","HasBuyerFetched":false,"HasSellerFetched":false,"SellerCharacterId":null,"SellerName":null,"BuyerCharacterId":"d9fb1f37-dd6f-422c-8ee9-c9cd7bcd344a","BuyerName":"BasicAF","ItemTypeId":"T4_MOUNT_HORSE","ItemGroupTypeId":"T4_MOUNT_HORSE","EnchantmentLevel":0,"QualityLevel":1,"Expires":"2019-06-24T05:19:37.795648"}',
                '{"Id":579545389,"UnitPriceSilver":96220000,"TotalPriceSilver":96220000,"Amount":1,"Tier":3,"IsFinished":false,"AuctionType":"request","HasBuyerFetched":false,"HasSellerFetched":false,"SellerCharacterId":null,"SellerName":null,"BuyerCharacterId":"d9fb1f37-dd6f-422c-8ee9-c9cd7bcd344a","BuyerName":"BasicAF","ItemTypeId":"T3_MOUNT_HORSE","ItemGroupTypeId":"T3_MOUNT_HORSE","EnchantmentLevel":0,"QualityLevel":1,"Expires":"2019-06-24T05:21:18.283296"}',
                '{"Id":579618963,"UnitPriceSilver":4360000,"TotalPriceSilver":13080000,"Amount":3,"Tier":7,"IsFinished":false,"AuctionType":"request","HasBuyerFetched":false,"HasSellerFetched":false,"SellerCharacterId":null,"SellerName":null,"BuyerCharacterId":"d9fb1f37-dd6f-422c-8ee9-c9cd7bcd344a","BuyerName":"BasicAF","ItemTypeId":"T7_FISH_FRESHWATER_ALL_COMMON","ItemGroupTypeId":"T7_FISH_FRESHWATER_ALL_COMMON","EnchantmentLevel":0,"QualityLevel":1,"Expires":"2019-06-24T05:38:53.701658"}',
                '{"Id":579833423,"UnitPriceSilver":185360000,"TotalPriceSilver":370720000,"Amount":2,"Tier":4,"IsFinished":false,"AuctionType":"request","HasBuyerFetched":false,"HasSellerFetched":false,"SellerCharacterId":null,"SellerName":null,"BuyerCharacterId":"d9fb1f37-dd6f-422c-8ee9-c9cd7bcd344a","BuyerName":"BasicAF","ItemTypeId":"T4_MOUNT_HORSE","ItemGroupTypeId":"T4_MOUNT_HORSE","EnchantmentLevel":0,"QualityLevel":1,"Expires":"2019-06-24T06:29:44.867209"}',
                '{"Id":581110539,"UnitPriceSilver":52260000,"TotalPriceSilver":104520000,"Amount":2,"Tier":6,"IsFinished":false,"AuctionType":"request","HasBuyerFetched":false,"HasSellerFetched":false,"SellerCharacterId":null,"SellerName":null,"BuyerCharacterId":"d9fb1f37-dd6f-422c-8ee9-c9cd7bcd344a","BuyerName":"BasicAF","ItemTypeId":"T6_POTION_HEAL","ItemGroupTypeId":"T6_POTION_HEAL","EnchantmentLevel":0,"QualityLevel":1,"Expires":"2019-06-24T12:18:33.565126"}',
                '{"Id":581305458,"UnitPriceSilver":99020000,"TotalPriceSilver":99020000,"Amount":1,"Tier":3,"IsFinished":false,"AuctionType":"request","HasBuyerFetched":false,"HasSellerFetched":false,"SellerCharacterId":null,"SellerName":null,"BuyerCharacterId":"d9fb1f37-dd6f-422c-8ee9-c9cd7bcd344a","BuyerName":"BasicAF","ItemTypeId":"T3_MOUNT_HORSE","ItemGroupTypeId":"T3_MOUNT_HORSE","EnchantmentLevel":0,"QualityLevel":1,"Expires":"2019-06-24T12:56:59.685419"}',
                '{"Id":586873057,"UnitPriceSilver":40120000,"TotalPriceSilver":40120000,"Amount":1,"Tier":3,"IsFinished":false,"AuctionType":"request","HasBuyerFetched":false,"HasSellerFetched":false,"SellerCharacterId":null,"SellerName":null,"BuyerCharacterId":"d9fb1f37-dd6f-422c-8ee9-c9cd7bcd344a","BuyerName":"BasicAF","ItemTypeId":"T3_MOUNT_OX","ItemGroupTypeId":"T3_MOUNT_OX","EnchantmentLevel":0,"QualityLevel":1,"Expires":"2019-06-25T08:52:04.428544"}'],
        '253': 'opAuctionGetMyOpenRequests',
        debugMessage: 'NumOfAuctions: 11'
    };

    readAuctions(opAuctionGetMyOpenOffersData)
    readAuctions(opAuctionGetMyOpenRequestsData)
    readAuctions(opAuctionGetFinishedAuctionsData)
    // console.log(
    //     // db,
    //     auctionsTableView(db)
    // )
}
