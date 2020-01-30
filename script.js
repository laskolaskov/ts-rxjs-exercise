"use strict";
exports.__esModule = true;
//custom imports
var PriceAggregator_js_1 = require("./PriceAggregator.js");
var PriceFeedFactory_js_1 = require("./PriceFeedFactory.js");
var START = Date.now();
console.log("START TIME :: " + (Date.now() - START) + " ms");
var feedsCount = 1000;
var feedsArr = Array(feedsCount).fill(null).map(function () { return PriceFeedFactory_js_1.PriceFeedFactory(Math.floor(Math.random() * (500 - 300) + 300)); });
var feedsObj = (function (arr) {
    var result = {};
    arr.forEach(function (pf) {
        if (!result[pf.providerName]) {
            result[pf.providerName] = pf;
        }
    });
    return result;
})(feedsArr);
console.log('feeds obj :: ', feedsObj);
var aggr = new PriceAggregator_js_1.PriceAggregator(feedsArr);
console.log('initial feeds :: ', aggr.priceFeeds);
var feed = aggr.getFeedForTimeFrame(1 /* s1 */);
var feedCon = feed.connect();
var feedSub = feed.subscribe(function (x) {
    console.log('feed :: ', x);
    console.log("TIME :: " + (Date.now() - START) + " ms");
});
setTimeout(function () {
    feedSub.unsubscribe();
}, 10000);
setTimeout(function () {
    feedCon.unsubscribe();
    console.log("EXECUTION TIME :: " + (Date.now() - START) + " ms");
}, 15000);
