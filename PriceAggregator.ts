//const { interval, of, merge } = require('rxjs');
//const { map, publish, zip, combineresult, takeUntil, buffer, window, scan, mergeAll } = require('rxjs/operators');

import { interval, merge, ConnectableObservable, Observable, Subscription } from 'rxjs'
import { map, publish, buffer } from 'rxjs/operators';

import { PriceFeed } from './PriceFeedFactory'

export const enum TimeFrame {
    s1 = 1,       // 1 second
    s5 = 5,       // 5 seconds
    s15 = 15,      // 15 seconds
    s30 = 30,      // 30 seconds
    m1 = 60,      // 1 minute
    m5 = 5 * m1,  // 5 minutes
    m15 = 15 * m1, // 15 minutes
    m30 = 30 * m1, // 30 minutes
    h1 = 60 * m1, // 1 hour
    h4 = 4 * h1,  // 4 hours
    d1 = 24 * h1, // 1 day
    w1 = 7 * d1,  // 1 week
    mn1 = 30 * d1, // 1 month
}

interface PriceSummary {
    symbol: string;
    timestamp: Date;
    bestBuyPrice: {
        value: number,
        spread: number; // the difference between `value` and the sell price @ provider
        provider: string;
    };
    bestSellPrice: {
        value: number,
        spread: number; // the difference between `value` and the buy price @ provider
        provider: string;
    };
}

export interface PriceFeedSet {
    [providerName: string]: PriceFeed;
}

export class PriceAggregator {
    priceFeeds: {
        [providerName: string]: {
            feed: PriceFeed,
            connection: Subscription
        }
    }
    constructor(initialPriceFeeds: (PriceFeed[] | PriceFeedSet)) {
        this.priceFeeds = {}
        let feeds
        if (Array.isArray(initialPriceFeeds)) {
            feeds = initialPriceFeeds           
        } else {
            console.log('PriceFeedSet received')
            feeds = Object.values(initialPriceFeeds)
        }
        //set and connect all feeds
        feeds.forEach(pf => {
            if (!this.priceFeeds[pf.providerName]) {
                this.priceFeeds[pf.providerName] = {
                    feed: pf,
                    connection: pf.connect()
                }
            }
        })
    }

    getFeedForTimeFrame(timeFrame: TimeFrame): ConnectableObservable<PriceSummary[]> {
        //get all feeds
        const feeds: PriceFeed[] =  Object.values(this.priceFeeds).map(feedInfo => feedInfo.feed)
        //timer ticking every 'timeFrame' seconds
        const timer: Observable<number> = interval(timeFrame * 1000)
        //create the aggregated feed
        const feed: ConnectableObservable<PriceSummary[]> = merge(
            //augment all feeds output to include their extended PriceFeed props
            ...feeds.map(
                pf => pf.pipe(
                    map(val => ({
                        symbol: pf.symbol,
                        providerName: pf.providerName,
                        commission: pf.commission,
                        ...val
                    }))
                )
            )).pipe(
                //buffer output between timer ticks
                buffer(timer),
                //aggregate the buffered output
                //uses custom aggregator function
                map(x => this.aggregator(x)),
                //publish as ConnectableObservable
                publish()
            ) as ConnectableObservable<PriceSummary[]>
        console.log('FEED :: ', feed)
        return feed
    }

    addPriceFeed(priceFeed: PriceFeed): boolean {
        if(!this.priceFeeds[priceFeed.providerName]) {
            this.priceFeeds[priceFeed.providerName] = {
                feed: priceFeed,
                connection: priceFeed.connect()
            }
            return true
        } else {
            return false
        }
    }

    removePriceFeed(providerName: string): boolean {
        if(!this.priceFeeds[providerName]) {
            return false
        } else {
            this.priceFeeds[providerName].connection.unsubscribe()
            console.log(`Disconnected feed : ${providerName}`, this.priceFeeds[providerName].feed)
            delete this.priceFeeds[providerName]
            return true
        }
    }

    aggregator(input) {
        console.log('input :: ', input);
        const reduced = input.reduce((result, pf) => {
            if (!result[`${pf.providerName}-${pf.symbol}`]) {
                result[`${pf.providerName}-${pf.symbol}`] = pf
            } else if (
                result[`${pf.providerName}-${pf.symbol}`].timestamp < pf.timestamp
            ) {
                result[`${pf.providerName}-${pf.symbol}`] = pf
            }
            return result
        }, {})
        console.log('reduced :: ', reduced)
        console.log('count :: ', Object.values(reduced).length)
        const priceSummary = Object.values(reduced).reduce((summary, pf: any) => {
            //does symbol exists as key ?
            if (!summary[pf.symbol]) {
                summary[pf.symbol] = this.initPriceSummary(pf)
            } else {
                if (pf.value.buyPrice > summary[pf.symbol].bestBuyPrice.value) {
                    summary[pf.symbol].bestBuyPrice = {
                        value: pf.value.buyPrice,
                        spread: pf.value.buyPrice - pf.value.sellPrice,
                        provider: pf.providerName,
                    }
                }
                if (pf.value.sellPrice < summary[pf.symbol].bestSellPrice.value) {
                    summary[pf.symbol].bestSellPrice = {
                        value: pf.value.sellPrice,
                        spread: pf.value.sellPrice - pf.value.buyPrice,
                        provider: pf.providerName
                    }
                }
            }
            return summary
        }, {})
        return Object.values(priceSummary)
    }

    /* getFeeds(): PriceFeed[] {
        const arr: PriceFeed[] = []
        for(let feed in this.priceFeeds) {
            console.log(feed)
            arr.push(feed.feed)
        }
        return arr
    } */

    initPriceSummary(pf) {
        return {
            symbol: pf.symbol,
            timestamp: Date.now(),
            bestBuyPrice: {
                value: pf.value.buyPrice,
                spread: pf.value.buyPrice - pf.value.sellPrice,
                provider: pf.providerName,
            },
            bestSellPrice: {
                value: pf.value.sellPrice,
                spread: pf.value.sellPrice - pf.value.buyPrice,
                provider: pf.providerName
            }
        }
    }
}

//module.exports = PriceAggregator