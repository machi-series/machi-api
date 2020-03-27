'use strict'

class UserController {
  async login({ auth, request }) {
    const { email, password } = request.all()
    return await auth.attempt(email, password)
  }

  me({ auth, params }) {
    return auth.user
  }
}

module.exports = UserController
