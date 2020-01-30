import { interval, Timestamp, ConnectableObservable } from 'rxjs'
import { map, publish } from 'rxjs/operators'

//types and interfaces
type PriceOffer = {
    buyPrice: number
    sellPrice: number
}

type PricePoint = Timestamp<PriceOffer>

export interface PriceFeed extends ConnectableObservable<PricePoint> {
    /*
     * The ticker symbol or trading pair represented whose price feed this
     * instance represents.
     *
     * Examples: "BTC/USD", "EUR/USD", "TSLA", etc.
     */
    symbol: string;

    /*
     * A string identifying the provider (e.g. exchange, broker, etc.) of this
     * price feed.
     */
    providerName: string;

    /*
     * Trade commission represented as percentage of trade position size (e.g.
     * `0.01` would be 1% of the position)
     */
    commission: number;
}

//hardcoded constants
const randomProviders = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
const randomSymbols = ['USD', 'BGN', 'GBR', 'YEN', 'Gold']

//factory to create random PriceOffer
const createRandomPriceOffer = (): PriceOffer => {
    return {
        buyPrice: Math.random() * (250 - 185) + 185,
        sellPrice: Math.random() * (250 - 185) + 185,
    }
}

//factory to create PricePoint from PriceOffer
const createRandomPricePoint = (x: PriceOffer): PricePoint => {
    return {
        value: x,
        timestamp: Date.now()
    }
}

//helper to get random array element
const getRandomElement = <T>(arr: T[]): T => {
    return arr[Math.floor((Math.random() * arr.length))];
}

//factory to create random PriceFeed
export const PriceFeedFactory = (dataInterval: number): PriceFeed => {
    //create random PriceOffer
    const priceOffer: PriceOffer = createRandomPriceOffer()
    //create PricePoint form the 
    const pricePoint: PricePoint = createRandomPricePoint(priceOffer)
    const pfObs = interval(dataInterval)
        .pipe(
            map(x => pricePoint),
            publish()
        ) as PriceFeed
    //add the PriceFeed extension class props - random
    pfObs.symbol = getRandomElement(randomSymbols)
    pfObs.providerName = getRandomElement(randomProviders)
    pfObs.commission = Math.random() * (0.1 - 0.03) + 0.03

    //return
    return pfObs
}