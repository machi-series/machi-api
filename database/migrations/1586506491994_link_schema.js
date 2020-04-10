'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class LinkSchema extends Schema {
  up() {
    this.create('links', (table) => {
      table.increments()
      table.text('link').notNullable()
      table.timestamps()
    })
  }

  down() {
    this.drop('links')
  }
}

module.exports = LinkSchema
