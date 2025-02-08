import { convertZpubToXpub } from './utils'

describe('convertZpubToXpub', () => {
    it('should convert a valid zpub to an xpub', () => {
        const zpub =
            'zpub6rptoNgQnWEwCjnEVQLh6Df6wqWf4ZEity4hrC1v68UhFnFnoyDbVKXyvGcYSJasViqUKJ5PLLp3Txe9PHZLAAVoj4NdxN9aVvUhBQoDYNm'
        const result = convertZpubToXpub(zpub)
        expect(result.startsWith('xpub')).toBe(true)
    })

    it('should return an xpub unchanged', () => {
        const xpub =
            'xpub661MyMwAqRbcF2T3P57PjAn7FqYFv6C2mAiR6ihM9E6Vv9gVce5iLSQuyHnFkZQ5t5GhsS8ZByaTHutX9yViUdfD42YbGb8DS8gHkXXx9nN'
        const result = convertZpubToXpub(xpub)
        expect(result).toBe(xpub)
    })

    it('should return the input unchanged if decoding fails', () => {
        const invalid = 'notavalidkey'
        const result = convertZpubToXpub(invalid)
        expect(result).toBe(invalid)
    })
})
