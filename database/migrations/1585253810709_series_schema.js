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
        .onUpdate('CASCADE')
        .onDelete('CASCADE')
      table
        .integer('authorId')
        .unsigned()
        .notNullable()
        .references('users.id')
        .onUpdate('SET NULL')
        .onDelete('SET NULL')
      table
        .integer('editedById')
        .unsigned()
        .nullable()
        .references('users.id')
        .onUpdate('SET NULL')
        .onDelete('SET NULL')
      table
        .integer('coverId')
        .unsigned()
        .nullable()
        .references('images.id')
        .onUpdate('SET NULL')
        .onDelete('SET NULL')
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
