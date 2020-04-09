'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Series extends Model {
  getRelatedSeries(value) {
    try {
      return typeof value === 'string' ? JSON.parse(value) : value
    } catch (err) {
      return value
    }
  }

  setRelatedSeries(value) {
    return typeof value === 'string' ? JSON.stringify(value) : value
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

  revisionOf() {
    return this.hasOne('App/Models/Series', 'revisionOfId', 'id')
  }

  revisions() {
    return this.hasMany('App/Models/Series', 'id', 'revisionOfId')
  }

  tags() {
    return this.belongsToMany('App/Models/Tag').pivotModel(
      'App/Models/SeriesTag'
    )
  }
}

module.exports = Series
