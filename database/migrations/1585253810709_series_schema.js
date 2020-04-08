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
      table.text('title').notNullable()
      table.string('slug').notNullable().unique()
      table.text('synopsis').notNullable().defaultTo('')
      table.integer('episodeCount').nullable()
      table.integer('year').nullable()
      table.string('releaseDate').nullable()
      table.string('releaseTime').nullable()
      table.integer('episodeDuration').nullable()
      table.integer('weekDay').nullable()
      table.text('trailer').nullable()
      table.string('producer').nullable()
      table.enum('type', ['series', 'ova', 'movie', 'special']).notNullable()
      table
        .enum('classification', ['open', '10', '12', '14', '16', '18'])
        .notNullable()
        .defaultTo('open')
      table
        .enum('releaseStatus', [
          'tba',
          'airing',
          'complete',
          'onhold',
          'canceled',
        ])
        .notNullable()
        .defaultTo('tba')
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
