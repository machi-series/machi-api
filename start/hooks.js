const { hooks } = require('@adonisjs/ignitor')

hooks.after.providersRegistered(() => {
  const Validator = use('Validator')
  const Database = use('Database')

  Validator.extend('exists', async function existsFn(
    data,
    field,
    message,
    args,
    get
  ) {
    const value = get(data, field)
    if (!value) {
      return
    }

    const [table, column] = args
    const row = await Database.table(table).where(column, value).first()

    if (!row) {
      throw message
    }
  })

  Validator.extend('existsAll', async function existsFn(
    data,
    field,
    message,
    args,
    get
  ) {
    const value = get(data, field)
    if (!value) {
      return
    }
    const ids = value.map((v) => Number(v))

    const [table] = args
    const [{ count }] = await Database.table(table).whereIn('id', ids).count()

    if (+count !== ids.length) {
      throw message
    }
  })
})
