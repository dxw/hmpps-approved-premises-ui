import { convertToTitleCase, initialiseName, convertDateInputsToDateObj } from './utils'

describe('convert to title case', () => {
  it.each([
    [null, null, ''],
    ['empty string', '', ''],
    ['Lower case', 'robert', 'Robert'],
    ['Upper case', 'ROBERT', 'Robert'],
    ['Mixed case', 'RoBErT', 'Robert'],
    ['Multiple words', 'RobeRT SMiTH', 'Robert Smith'],
    ['Leading spaces', '  RobeRT', '  Robert'],
    ['Trailing spaces', 'RobeRT  ', 'Robert  '],
    ['Hyphenated', 'Robert-John SmiTH-jONes-WILSON', 'Robert-John Smith-Jones-Wilson'],
  ])('%s convertToTitleCase(%s, %s)', (_: string, a: string, expected: string) => {
    expect(convertToTitleCase(a)).toEqual(expected)
  })
})

describe('initialise name', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['One word', 'robert', 'r. robert'],
    ['Two words', 'Robert James', 'R. James'],
    ['Three words', 'Robert James Smith', 'R. Smith'],
    ['Double barrelled', 'Robert-John Smith-Jones-Wilson', 'R. Smith-Jones-Wilson'],
  ])('%s initialiseName(%s, %s)', (_: string, a: string, expected: string) => {
    expect(initialiseName(a)).toEqual(expected)
  })
})

describe('convertDate', () => {
  it('converts a date object', () => {
    interface MyObjectWithADate {
      date?: Date
      ['date-year']: string
      ['date-month']: string
      ['date-day']: string
    }
    const obj: MyObjectWithADate = {
      'date-year': '2022',
      'date-month': '12',
      'date-day': '11',
    }

    const result = convertDateInputsToDateObj(obj, 'date')

    expect(result.date.toString()).toMatch('Dec 11 2022')
  })

  it('returns a date object when given empty strings as input', () => {
    interface MyObjectWithADate {
      date?: Date
      ['date-year']: string
      ['date-month']: string
      ['date-day']: string
    }
    const obj: MyObjectWithADate = {
      'date-year': '',
      'date-month': '',
      'date-day': '',
    }

    const result = convertDateInputsToDateObj(obj, 'date')

    expect(result.date.toString()).toMatch('Dec 31 1899')
  })

  it('returns a date object when given invalid strings as input', () => {
    interface MyObjectWithADate {
      date?: Date
      ['date-year']: string
      ['date-month']: string
      ['date-day']: string
    }
    const obj: MyObjectWithADate = {
      'date-year': 'twothousandtwentytwo',
      'date-month': '20',
      'date-day': 'foo',
    }

    const result = convertDateInputsToDateObj(obj, 'date')

    expect(result.date.toString()).toMatch('Dec 31 1899')
  })
})
