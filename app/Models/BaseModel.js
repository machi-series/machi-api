'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

const moment = require('moment')
const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ssZZ'

class BaseModel extends Model {
  static formatDates(field, value) {
    return moment(value).utc().format(DATE_FORMAT)
  }
}

module.exports = BaseModel
