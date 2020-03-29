'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class EpisodesSchema extends Schema {
  up() {
    this.create('episodes', (table) => {
      table.increments()
      table
        .integer('revisionOfId')
        .unsigned()
        .nullable()
        .references('episodes.id')
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
        .integer('seriesId')
        .unsigned()
        .notNullable()
        .references('series.id')
        .onUpdate('CASCADE')
        .onDelete('CASCADE')
      table
        .integer('coverId')
        .unsigned()
        .nullable()
        .references('images.id')
        .onUpdate('SET NULL')
        .onDelete('SET NULL')
      table.string('title').notNullable()
      table.string('slug').notNullable().unique()
      table.string('number').notNullable()
      table.string('source').nullable()
      table.integer('priority').notNullable().defaultTo(0)
      table
        .jsonb('links')
        .notNullable()
        .defaultTo(
          JSON.stringify({
            low: [],
            medium: [],
            high: [],
            online: [],
          })
        )
      table.enum('type', ['episode', 'ova', 'movie', 'special']).notNullable()
      table.enum('quality', ['bluray', 'hdtv', 'dvd']).notNullable()
      table
        .enum('status', ['draft', 'published', 'deleted', 'revision'])
        .notNullable()
      table.timestamps()
    })
  }

  down() {
    this.drop('episodes')
  }
}

module.exports = EpisodesSchema
