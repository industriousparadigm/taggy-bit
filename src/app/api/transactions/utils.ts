import bs58check from 'bs58check'

/**
 * Converts a zpub (native segwit extended public key) to an xpub (legacy extended public key).
 * If the provided key does not start with the zpub version bytes, returns it unchanged.
 *
 * @param pubkey - The extended public key (xpub or zpub)
 * @returns The xpub version of the key.
 */
export function convertZpubToXpub(pubkey: string): string {
    try {
        // Decode the provided extended public key.
        const data = bs58check.decode(pubkey)
        // Ensure we have a Buffer.
        const bufferData = Buffer.from(data)

        // Get the first 4 bytes (version prefix) as a hex string.
        const prefixHex = bufferData.slice(0, 4).toString('hex')

        // Define the zpub prefix in hex.
        const zpubPrefixHex = '04b24746'
        // Define the xpub prefix as a Buffer.
        const xpubPrefix = Buffer.from([0x04, 0x88, 0xb2, 0x1e])

        // If the prefix matches a zpub, convert it.
        if (prefixHex === zpubPrefixHex) {
            const newData = Buffer.concat([xpubPrefix, bufferData.slice(4)])
            return bs58check.encode(newData)
        }

        // If it's already an xpub (or some other format), return it unchanged.
        return pubkey
    } catch (error) {
        console.error('Error converting pubkey:', error)
        return pubkey
    }
}
