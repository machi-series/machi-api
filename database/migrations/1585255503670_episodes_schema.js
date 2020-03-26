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
      table.integer('authorId').unsigned().notNullable().references('users.id')
      table.integer('editingById').unsigned().nullable().references('users.id')
      table.integer('seriesId').unsigned().notNullable().references('series.id')
      table.string('title').notNullable()
      table.string('slug').notNullable().unique()
      table.string('number').notNullable()
      table
        .jsonb('links')
        .notNullable()
        .defaultTo(
          JSON.stringify({
            mp4: [],
            hd: [],
            fullHd: [],
          })
        )
      table.enum('type', ['episode', 'ova', 'movie', 'special']).notNullable()
      table.enum('quality', ['bluray', 'hdtv']).notNullable()
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
