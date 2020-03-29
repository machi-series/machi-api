const Antl = use('Antl')

class ValidationFormatter {
  constructor() {}

  get formatter() {
    return Formatter
  }
}

class Formatter {
  constructor() {
    this.errors = []
  }

  addError(error, field, validation, args) {
    let message = error

    const hasError = error instanceof Error

    if (hasError) {
      validation = 'ENGINE_EXCEPTION'
      message = error.message
    }

    this.errors.push({
      field,
      validation,
      message: hasError
        ? message
        : Antl.formatMessage('validation.' + validation, {
            field,
            argument: args,
            ...args.reduce((acc, value, i) => {
              acc[`argument${i}`] = value
              return acc
            }, {}),
          }),
    })
  }

  toJSON() {
    return this.errors.length ? mapErrors(this.errors) : null
  }
}

function mapErrors(errors) {
  const mapped = errors.reduce((acc, { field, validation, message }) => {
    if (acc[field] == null) {
      acc[field] = []
    }
    acc[field].push({ validation, message })
    return acc
  }, {})

  mapped._validation = true
  return mapped
}

module.exports = ValidationFormatter
