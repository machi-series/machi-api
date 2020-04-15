'use strict'

const User = use('App/Models/User')

class PublicUser extends User {
  static get table() {
    return 'users'
  }

  static get hidden() {
    return super.hidden.concat(['email'])
  }
}

module.exports = PublicUser
