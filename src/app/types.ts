/* eslint-disable @typescript-eslint/no-explicit-any */
export interface BlockchairTransaction {
    block_id: number
    hash: string
    time: string // e.g., "2024-12-01 13:55:41"
    balance_change: number // in satoshis
    address: string
}

export interface BlockchairPubkeyData {
    xpub: {
        address_count: number
        balance: number
        balance_usd: number
        received: number
        spent: number
        output_count: number
        unspent_output_count: number
        first_seen_receiving: string
        last_seen_receiving: string
        first_seen_spending: string
        last_seen_spending: string
        transaction_count: number
    }
    addresses: Record<string, any>
    transactions: BlockchairTransaction[]
    utxo: any[]
}

export interface BlockchairResponse {
    data: Record<string, BlockchairPubkeyData>
    context: {
        code: number
        source: string
        limit: string
        offset: string
        results: number
        checked: string[]
        state: number
        market_price_usd: number
        cache: any
        api: any
        servers: string
        time: number
        render_time: number
        full_time: number
        request_cost: number
    }
}
