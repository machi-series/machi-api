'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Hit extends Model {
  static boot() {
    super.boot()
    this.addTrait('UtcDate')
  }
}

module.exports = Hit
