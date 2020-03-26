'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Series extends Model {
  author() {
    return this.hasOne('App/Models/User', 'userId')
  }

  editingBy() {
    return this.hasOne('App/Models/User', 'editingById')
  }

  revisionOf() {
    return this.hasOne('App/Models/Series', 'revisionOfId')
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
