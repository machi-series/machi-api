'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class NewsSchema extends Schema {
  up() {
    this.create('news', (table) => {
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
      table.text('title').notNullable().defaultTo('')
      table.string('slug').notNullable().unique()
      table.text('content').notNullable().defaultTo('')
      table.boolean('priority').notNullable().defaultTo(false)
      table
        .enum('status', ['draft', 'published', 'deleted', 'revision'])
        .notNullable()
      table.timestamps()
    })
  }

  down() {
    this.drop('news')
  }
}

module.exports = NewsSchema
