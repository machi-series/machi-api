'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SeriesSchema extends Schema {
  up() {
    this.create('series', (table) => {
      table.increments()
      table
        .integer('revisionOfId')
        .unsigned()
        .nullable()
        .references('series.id')
      table.integer('authorId').unsigned().notNullable().references('users.id')
      table.integer('editingById').unsigned().nullable().references('users.id')
      table.string('title').notNullable()
      table.string('slug').notNullable().unique()
      table.string('synopsis').notNullable().defaultTo('')
      table
        .enum('status', ['draft', 'published', 'deleted', 'revision'])
        .notNullable()
      table.timestamps()
    })
  }

  down() {
    this.drop('series')
  }
}

module.exports = SeriesSchema
