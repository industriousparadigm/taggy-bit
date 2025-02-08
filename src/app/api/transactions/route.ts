import { NextResponse } from 'next/server'
import type { BlockchairResponse, BlockchairTransaction } from '@/app/types'

// Helper: Format a raw datetime string (e.g. "2024-12-01 13:55:41")
// to "DD-MM-YYYY" (e.g. "01-12-2024") for CoinGecko.
function formatDateForHistory(datetime: string): string {
    const d = new Date(datetime)
    if (isNaN(d.getTime())) {
        return 'Invalid Date'
    }
    const day = String(d.getUTCDate()).padStart(2, '0')
    const month = String(d.getUTCMonth() + 1).padStart(2, '0')
    const year = d.getUTCFullYear()
    return `${day}-${month}-${year}`
}

// Helper: Fetch historical price for Bitcoin (USD) on a given date (dd-mm-yyyy) using CoinGecko
async function getHistoricalPrice(dateStr: string): Promise<number> {
    const url = `https://api.coingecko.com/api/v3/coins/bitcoin/history?date=${dateStr}`
    const res = await fetch(url)
    if (!res.ok) {
        console.error(`Failed to fetch historical price for ${dateStr}`)
        return 0
    }
    const data = await res.json()
    return data?.market_data?.current_price?.usd || 0
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const pubkey = searchParams.get('pubkey') // Can be zpub (or xpub)
    if (!pubkey) {
        return NextResponse.json({ error: 'Missing pubkey parameter' }, { status: 400 })
    }

    // Build the Blockchair API URL using the provided pubkey directly.
    const apiUrl = `https://api.blockchair.com/bitcoin/dashboards/xpub/${pubkey}?transaction_details=true&limit=20`

    try {
        const res = await fetch(apiUrl)
        if (!res.ok) {
            const errorBody = await res.text()
            return NextResponse.json(
                { error: 'Error fetching data from Blockchair', details: errorBody },
                { status: res.status }
            )
        }

        const data: BlockchairResponse = await res.json()

        console.log()

        if (!data.data || !data.data[pubkey]) {
            return NextResponse.json({ error: 'No data for this pubkey' }, { status: 404 })
        }

        const pubkeyData = data.data[pubkey]
        console.log(pubkeyData)
        const txs: BlockchairTransaction[] = pubkeyData.transactions
        // Current market price from Blockchair context.
        const currentMarketPrice = data.context.market_price_usd

        // Extract unique dates (in dd-mm-yyyy format) from the raw transaction times.
        const uniqueDates = Array.from(new Set(txs.filter((tx) => tx.time).map((tx) => formatDateForHistory(tx.time))))

        // Fetch historical prices for each unique date.
        const pricePromises = uniqueDates.map(async (dateStr) => {
            const price = await getHistoricalPrice(dateStr)
            return { dateStr, price }
        })
        const pricesArr = await Promise.all(pricePromises)
        const historicalPrices: Record<string, number> = {}
        pricesArr.forEach(({ dateStr, price }) => {
            historicalPrices[dateStr] = price
        })

        // Map each transaction to a simplified object including:
        // - The full display time (formatted as "25 April 2025 22:48:21")
        // - Historical USD value (using the price on that day)
        // - Current USD value (using today's price)
        // - The USD difference.
        const transactions = txs.map((tx) => {
            const rawTime = tx.time || 'N/A'
            const displayTime =
                rawTime !== 'N/A'
                    ? new Date(rawTime).toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false
                      })
                    : 'N/A'
            const dateForPrice = rawTime !== 'N/A' ? formatDateForHistory(rawTime) : ''
            const histPrice = dateForPrice ? historicalPrices[dateForPrice] : 0
            const balanceChange = tx.balance_change || 0
            const amount = balanceChange / 1e8 // convert satoshis to BTC
            const usdAmount = amount * histPrice
            const currentUsdAmount = amount * currentMarketPrice
            const diffUsd = currentUsdAmount - usdAmount
            const type = balanceChange >= 0 ? 'receive' : 'send'
            return {
                txid: tx.hash,
                time: displayTime,
                amount,
                usdAmount,
                currentUsd: currentUsdAmount,
                diffUsd,
                type
            }
        })

        return NextResponse.json({ transactions })
    } catch (error) {
        console.error('Error in API route:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
