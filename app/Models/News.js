'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class News extends Model {
  static boot() {
    super.boot()
    this.addTrait('UtcDate')
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
}

module.exports = News
