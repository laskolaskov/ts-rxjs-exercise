"use strict";
exports.__esModule = true;
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
//hardcoded constants
var randomProviders = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
var randomSymbols = ['USD', 'BGN', 'GBR', 'YEN', 'Gold'];
//factory to create random PriceOffer
var createRandomPriceOffer = function () {
    return {
        buyPrice: Math.random() * (250 - 185) + 185,
        sellPrice: Math.random() * (250 - 185) + 185
    };
};
//factory to create PricePoint from PriceOffer
var createRandomPricePoint = function (x) {
    return {
        value: x,
        timestamp: Date.now()
    };
};
//helper to get random array element
var getRandomElement = function (arr) {
    return arr[Math.floor((Math.random() * arr.length))];
};
//factory to create random PriceFeed
exports.PriceFeedFactory = function (dataInterval) {
    //create random PriceOffer
    var priceOffer = createRandomPriceOffer();
    //create PricePoint form the 
    var pricePoint = createRandomPricePoint(priceOffer);
    var pfObs = rxjs_1.interval(dataInterval)
        .pipe(operators_1.map(function (x) { return pricePoint; }), operators_1.publish());
    //add the PriceFeed extension class props - random
    pfObs.symbol = getRandomElement(randomSymbols);
    pfObs.providerName = getRandomElement(randomProviders);
    pfObs.commission = Math.random() * (0.1 - 0.03) + 0.03;
    //return
    return pfObs;
};
