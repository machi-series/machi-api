'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Episode extends Model {
  static boot() {
    super.boot()
    this.addTrait('UtcDate')
  }

  series() {
    return this.hasOne('App/Models/Series', 'seriesId', 'id')
  }

  author() {
    return this.hasOne('App/Models/PublicUser', 'authorId', 'id')
  }

  editedBy() {
    return this.hasOne('App/Models/PublicUser', 'editedById', 'id')
  }

  cover() {
    return this.hasOne('App/Models/Image', 'coverId', 'id')
  }

  getLinks(links) {
    try {
      return JSON.parse(links)
    } catch (err) {
      return links
    }
  }

  setLinks(links) {
    return JSON.stringify(links)
  }
}

module.exports = Episode
