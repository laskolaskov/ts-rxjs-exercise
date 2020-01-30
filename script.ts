//custom imports
import { PriceAggregator, PriceFeedSet, TimeFrame } from './PriceAggregator.js'
import { PriceFeedFactory, PriceFeed } from './PriceFeedFactory.js'

const START = Date.now()
console.log(`START TIME :: ${Date.now() - START} ms`)

const feedsCount: number = 1000
const feedsArr: PriceFeed[] = Array(feedsCount).fill(null).map(() => PriceFeedFactory(Math.floor(Math.random() * (500 - 300) + 300)))

const feedsObj = ((arr: PriceFeed[]): PriceFeedSet => {
    const result = {}
    arr.forEach((pf: PriceFeed) => {
        if(!result[pf.providerName]) {
            result[pf.providerName] = pf
        } 
    })
    return result
}) (feedsArr)

console.log('feeds obj :: ', feedsObj)
const aggr = new PriceAggregator(feedsArr)
console.log('initial feeds :: ', aggr.priceFeeds)

const feed = aggr.getFeedForTimeFrame(TimeFrame.s1)
const feedCon = feed.connect()
const feedSub = feed.subscribe(x => {
    console.log('feed :: ', x)
    console.log(`TIME :: ${Date.now() - START} ms`)
});

setTimeout(() => {
    feedSub.unsubscribe()
}, 10000)

setTimeout(() => {
    feedCon.unsubscribe()
    console.log(`EXECUTION TIME :: ${Date.now() - START} ms`)
}, 15000)