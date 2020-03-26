'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class SerieTag extends Model {
  series() {
    return this.hasOne('App/Models/Series', 'serieId')
  }

  tag() {
    return this.hasOne('App/Models/Tag', 'tagId')
  }
}

module.exports = SerieTag
