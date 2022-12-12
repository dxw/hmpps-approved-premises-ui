import type { ErrorMessages, RadioItem, CheckBoxItem, SelectOption } from '@approved-premises/ui'

export const dateFieldValues = (fieldName: string, context: Record<string, unknown>, errors: ErrorMessages = {}) => {
  const errorClass = errors[fieldName] ? 'govuk-input--error' : ''
  return [
    {
      classes: `govuk-input--width-2 ${errorClass}`,
      name: 'day',
      value: context[`${fieldName}-day`],
    },
    {
      classes: `govuk-input--width-2 ${errorClass}`,
      name: 'month',
      value: context[`${fieldName}-month`],
    },
    {
      classes: `govuk-input--width-4 ${errorClass}`,
      name: 'year',
      value: context[`${fieldName}-year`],
    },
  ]
}

export const convertObjectsToRadioItems = (
  items: Array<Record<string, string>>,
  textKey: string,
  valueKey: string,
  fieldName: string,
  context: Record<string, unknown>,
): Array<RadioItem> => {
  return items.map(item => {
    return {
      text: item[textKey],
      value: item[valueKey],
      checked: context[fieldName] === item[valueKey],
    }
  })
}

export const convertObjectsToSelectOptions = (
  items: Array<Record<string, string>>,
  prompt: string,
  textKey: string,
  valueKey: string,
  fieldName: string,
  context: Record<string, unknown>,
): Array<SelectOption> => {
  const options = [
    {
      value: '',
      text: prompt,
      selected: !context[fieldName] || context[fieldName] === '',
    },
  ]

  items.forEach(item => {
    options.push({
      text: item[textKey],
      value: item[valueKey],
      selected: context[fieldName] === item[valueKey],
    })
  })

  return options
}

export function convertKeyValuePairToRadioItems<T>(object: T, checkedItem: string): Array<RadioItem> {
  return Object.keys(object).map(key => {
    return {
      value: key,
      text: object[key],
      checked: checkedItem === key,
    }
  })
}

export function convertKeyValuePairToCheckBoxItems<T>(
  object: T,
  checkedItems: Array<string> = [],
): Array<CheckBoxItem> {
  return Object.keys(object).map(key => {
    return {
      value: key,
      text: object[key],
      checked: checkedItems.includes(key),
    }
  })
}

/**
 * Performs validation on the area of a postcode (IE the first three characters)
 * @param string string to be validated.
 * @returns true if the string is valid, false otherwise.
 */
export function validPostcodeArea(potentialPostcode: string) {
  return /[A-Z][0-9]{1,2}|[A-Z][A-HJ-Y][0-9]{1,2}|[A-Z][0-9][A-Z]|[A-Z][A-HJ-Y][0-9]?[A-Z]/.test(potentialPostcode)
}

/**
 * Returns the input if it is an array other.
 * If the input is truthy and not an array it returns the input in an array
 * Useful for checkboxes where if a single value is returned it is string but when multiple values are selected they are an array of strings.
 * @param input input to be put into a flat array.
 * @returns a flat array or an empty array.
 */
export function flattenCheckboxInput<T extends string | Array<T>>(input: T | Array<T>) {
  if (Array.isArray(input)) return input
  if (input) return [input].flat()
  return []
}

/**
 * @param input any
 * @returns true if the input is an empty array, an array of strings or a string otherwise false
 */
export function isStringOrArrayOfStrings(input: unknown) {
  return (
    (Array.isArray(input) && input.every((element: unknown) => typeof element === 'string')) ||
    typeof input === 'string'
  )
}
