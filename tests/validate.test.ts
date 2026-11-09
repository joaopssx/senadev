import { describe, expect, it } from 'vitest'
import { validateEntry } from '../api/_lib/validate'

const valid = { name: 'Ana', message: 'Nice site', token: 'abc', website: '' }

describe('validateEntry', () => {
  it('accepts a normal entry', () => {
    expect(validateEntry(valid)).toEqual({
      ok: true,
      name: 'Ana',
      message: 'Nice site',
      token: 'abc',
    })
  })

  it('trims and collapses whitespace, including line breaks', () => {
    expect(
      validateEntry({ ...valid, name: '  Ana   Maria ', message: 'one\n\n two\tthree' }),
    ).toEqual({
      ok: true,
      name: 'Ana Maria',
      message: 'one two three',
      token: 'abc',
    })
  })

  it('accepts text at the exact limits and a single link', () => {
    expect(validateEntry({ ...valid, name: 'a'.repeat(30) }).ok).toBe(true)
    expect(validateEntry({ ...valid, message: 'b'.repeat(200) }).ok).toBe(true)
    expect(validateEntry({ ...valid, message: 'see https://senadev.com.br' }).ok).toBe(true)
  })

  it.each([
    ['empty name', { ...valid, name: '   ' }, 'invalid_name'],
    ['long name', { ...valid, name: 'a'.repeat(31) }, 'invalid_name'],
    ['control character in name', { ...valid, name: 'An\u0000a' }, 'invalid_name'],
    ['empty message', { ...valid, message: '\n \t' }, 'invalid_message'],
    ['long message', { ...valid, message: 'b'.repeat(201) }, 'invalid_message'],
    ['control character in message', { ...valid, message: 'a\u0007b' }, 'invalid_message'],
    ['bidi override', { ...valid, message: 'a\u202Eb' }, 'invalid_message'],
    ['two links', { ...valid, message: 'http://a.com www.b.com' }, 'too_many_links'],
    ['filled honeypot', { ...valid, website: 'spam' }, 'invalid_request'],
    ['missing token', { name: 'Ana', message: 'Hi' }, 'invalid_request'],
    ['wrong field type', { ...valid, name: 42 }, 'invalid_request'],
    ['null body', null, 'invalid_request'],
    ['array body', [], 'invalid_request'],
  ])('rejects %s', (_label, body, error) => {
    expect(validateEntry(body)).toEqual({ ok: false, error })
  })
})
