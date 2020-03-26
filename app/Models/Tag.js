'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Tag extends Model {
  series() {
    return this.belongsToMany('App/Models/Series').pivotModel(
      'App/Models/SeriesTag'
    )
  }
}

module.exports = Tag
