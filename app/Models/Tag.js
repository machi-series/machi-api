'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Tag extends Model {
  static boot() {
    super.boot()
    this.addTrait('UtcDate')
  }

  series() {
    return this.belongsToMany('App/Models/Series').pivotModel(
      'App/Models/SeriesTag'
    )
  }
}

module.exports = Tag
