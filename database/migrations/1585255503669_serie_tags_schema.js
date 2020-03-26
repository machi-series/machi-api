'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SerieTagsSchema extends Schema {
  up() {
    this.create('serie_tags', (table) => {
      table.increments()
      table
        .integer('series_id')
        .unsigned()
        .notNullable()
        .references('series.id')
      table.integer('tag_id').unsigned().notNullable().references('tags.id')
      table.timestamps()
    })
  }

  down() {
    this.drop('serie_tags')
  }
}

module.exports = SerieTagsSchema
