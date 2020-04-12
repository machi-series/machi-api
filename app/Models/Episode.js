'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('App/Models/BaseModel')

class Episode extends Model {
  series() {
    return this.hasOne('App/Models/Series', 'seriesId', 'id')
  }

  author() {
    return this.hasOne('App/Models/User', 'authorId', 'id')
  }

  editedBy() {
    return this.hasOne('App/Models/User', 'editedById', 'id')
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
