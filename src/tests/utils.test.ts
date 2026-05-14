import { describe, it, expect } from 'vitest'
import {
  cn, generateId, clamp, lerp, formatBytes, formatDuration,
  slugify, sanitizeFileName, getFileName, getFileExtension,
  removeFileExtension, truncate
} from '../lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
    expect(cn('foo', false && 'bar')).toBe('foo')
    expect(cn('foo', undefined, 'bar')).toBe('foo bar')
  })
})

describe('generateId', () => {
  it('generates unique ids', () => {
    const id1 = generateId()
    const id2 = generateId()
    expect(id1).not.toBe(id2)
    expect(typeof id1).toBe('string')
  })
})

describe('clamp', () => {
  it('clamps values within range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(15, 0, 10)).toBe(10)
  })
})

describe('lerp', () => {
  it('linearly interpolates', () => {
    expect(lerp(0, 10, 0)).toBe(0)
    expect(lerp(0, 10, 1)).toBe(10)
    expect(lerp(0, 10, 0.5)).toBe(5)
  })
})

describe('formatBytes', () => {
  it('formats byte values', () => {
    expect(formatBytes(0)).toBe('0 Bytes')
    expect(formatBytes(1024)).toBe('1 KB')
    expect(formatBytes(1048576)).toBe('1 MB')
    expect(formatBytes(1073741824)).toBe('1 GB')
  })
})

describe('formatDuration', () => {
  it('formats duration', () => {
    expect(formatDuration(5000)).toBe('5s')
    expect(formatDuration(65000)).toBe('1m 5s')
    expect(formatDuration(3661000)).toBe('1h 1m 1s')
  })
})

describe('slugify', () => {
  it('converts strings to slugs', () => {
    expect(slugify('Hello World')).toBe('hello_world')
    expect(slugify('  test  123  ')).toBe('test_123')
    expect(slugify('special!@#chars')).toBe('specialchars')
  })
})

describe('sanitizeFileName', () => {
  it('removes invalid characters', () => {
    expect(sanitizeFileName('file<>.txt')).toBe('file__.txt')
    expect(sanitizeFileName('normal.txt')).toBe('normal.txt')
    expect(sanitizeFileName('../etc')).toBe('__etc')
  })
})

describe('getFileName', () => {
  it('extracts file name from path', () => {
    expect(getFileName('/path/to/file.png')).toBe('file.png')
    expect(getFileName('C:\\path\\file.txt')).toBe('file.txt')
  })
})

describe('getFileExtension', () => {
  it('extracts file extension', () => {
    expect(getFileExtension('image.png')).toBe('png')
    expect(getFileExtension('archive.tar.gz')).toBe('gz')
  })
})

describe('removeFileExtension', () => {
  it('removes file extension', () => {
    expect(removeFileExtension('image.png')).toBe('image')
    expect(removeFileExtension('noext')).toBe('noext')
  })
})

describe('truncate', () => {
  it('truncates long strings', () => {
    expect(truncate('hello world', 5)).toBe('he...')
    expect(truncate('short', 10)).toBe('short')
  })
})
