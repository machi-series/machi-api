'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AccessSchema extends Schema {
  up() {
    this.create('hits', (table) => {
      table.increments()
      table
        .integer('seriesId')
        .unsigned()
        .notNullable()
        .references('series.id')
        .onUpdate('CASCADE')
        .onDelete('CASCADE')
      table.string('ip').nullable()
      table.timestamps()
    })
  }

  down() {
    this.drop('hits')
  }
}

module.exports = AccessSchema
