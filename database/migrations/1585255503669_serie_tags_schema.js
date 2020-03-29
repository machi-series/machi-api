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
        .onUpdate('CASCADE')
        .onDelete('CASCADE')
      table
        .integer('tag_id')
        .unsigned()
        .notNullable()
        .references('tags.id')
        .onUpdate('CASCADE')
        .onDelete('CASCADE')
      table.timestamps()
    })
  }

  down() {
    this.drop('serie_tags')
  }
}

module.exports = SerieTagsSchema
