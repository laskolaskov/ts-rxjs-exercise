"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var PriceAggregator = /** @class */ (function () {
    function PriceAggregator(initialPriceFeeds) {
        var _this = this;
        this.priceFeeds = {};
        var feeds;
        if (Array.isArray(initialPriceFeeds)) {
            feeds = initialPriceFeeds;
        }
        else {
            console.log('PriceFeedSet received');
            feeds = Object.values(initialPriceFeeds);
        }
        //set and connect all feeds
        feeds.forEach(function (pf) {
            if (!_this.priceFeeds[pf.providerName]) {
                _this.priceFeeds[pf.providerName] = {
                    feed: pf,
                    connection: pf.connect()
                };
            }
        });
    }
    PriceAggregator.prototype.getFeedForTimeFrame = function (timeFrame) {
        var _this = this;
        //get all feeds
        var feeds = Object.values(this.priceFeeds).map(function (feedInfo) { return feedInfo.feed; });
        //timer ticking every 'timeFrame' seconds
        var timer = rxjs_1.interval(timeFrame * 1000);
        //create the aggregated feed
        var feed = rxjs_1.merge.apply(void 0, feeds.map(function (pf) { return pf.pipe(operators_1.map(function (val) { return (__assign({ symbol: pf.symbol, providerName: pf.providerName, commission: pf.commission }, val)); })); })).pipe(
        //buffer output between timer ticks
        operators_1.buffer(timer), 
        //aggregate the buffered output
        //uses custom aggregator function
        operators_1.map(function (x) { return _this.aggregator(x); }), 
        //publish as ConnectableObservable
        operators_1.publish());
        console.log('FEED :: ', feed);
        return feed;
    };
    PriceAggregator.prototype.addPriceFeed = function (priceFeed) {
        if (!this.priceFeeds[priceFeed.providerName]) {
            this.priceFeeds[priceFeed.providerName] = {
                feed: priceFeed,
                connection: priceFeed.connect()
            };
            return true;
        }
        else {
            return false;
        }
    };
    PriceAggregator.prototype.removePriceFeed = function (providerName) {
        if (!this.priceFeeds[providerName]) {
            return false;
        }
        else {
            this.priceFeeds[providerName].connection.unsubscribe();
            console.log("Disconnected feed : " + providerName, this.priceFeeds[providerName].feed);
            delete this.priceFeeds[providerName];
            return true;
        }
    };
    PriceAggregator.prototype.aggregator = function (input) {
        var _this = this;
        console.log('input :: ', input);
        var reduced = input.reduce(function (result, pf) {
            if (!result[pf.providerName + "-" + pf.symbol]) {
                result[pf.providerName + "-" + pf.symbol] = pf;
            }
            else if (result[pf.providerName + "-" + pf.symbol].timestamp < pf.timestamp) {
                result[pf.providerName + "-" + pf.symbol] = pf;
            }
            return result;
        }, {});
        console.log('reduced :: ', reduced);
        console.log('count :: ', Object.values(reduced).length);
        var priceSummary = Object.values(reduced).reduce(function (summary, pf) {
            //does symbol exists as key ?
            if (!summary[pf.symbol]) {
                summary[pf.symbol] = _this.initPriceSummary(pf);
            }
            else {
                if (pf.value.buyPrice > summary[pf.symbol].bestBuyPrice.value) {
                    summary[pf.symbol].bestBuyPrice = {
                        value: pf.value.buyPrice,
                        spread: pf.value.buyPrice - pf.value.sellPrice,
                        provider: pf.providerName
                    };
                }
                if (pf.value.sellPrice < summary[pf.symbol].bestSellPrice.value) {
                    summary[pf.symbol].bestSellPrice = {
                        value: pf.value.sellPrice,
                        spread: pf.value.sellPrice - pf.value.buyPrice,
                        provider: pf.providerName
                    };
                }
            }
            return summary;
        }, {});
        return Object.values(priceSummary);
    };
    PriceAggregator.prototype.initPriceSummary = function (pf) {
        return {
            symbol: pf.symbol,
            timestamp: Date.now(),
            bestBuyPrice: {
                value: pf.value.buyPrice,
                spread: pf.value.buyPrice - pf.value.sellPrice,
                provider: pf.providerName
            },
            bestSellPrice: {
                value: pf.value.sellPrice,
                spread: pf.value.sellPrice - pf.value.buyPrice,
                provider: pf.providerName
            }
        };
    };
    return PriceAggregator;
}());
exports.PriceAggregator = PriceAggregator;
