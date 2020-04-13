'use strict'

const moment = require('moment')
const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ssZZ'

class UtcDate {
  register(Model) {
    Model.formatDates = function formatDates(field, value) {
      return moment(value).utc().format(DATE_FORMAT)
    }
  }
}

module.exports = UtcDate
