'use strict'

const { validateAll, sanitize, sanitizor } = use('Validator')
const User = use('App/Model/User')
const roles = ['user', 'publisher', 'manager', 'admin']

class UserController {
  async login({ auth, request }) {
    const { email, password } = request.all()
    return await auth.attempt(email, password)
  }

  me({ auth, params }) {
    return auth.user
  }

  index({ request }) {
    const page = Number(request.get('page')) || 1
    return User.query().paginate(page)
  }

  async show({ params }) {
    const user = await User.findOrFail(params.id)
    return user
  }

  async store({ request, response }) {
    const rawData = request.only(['email', 'username', 'role', 'password'])

    const validation = {
      email: 'required|email|max:254|unique:users,email',
      username: 'required|string|max:80|unique:users,username',
      role: `required|string|in:${roles.join(',')}`,
      password: 'required|string|max:60',
    }
    const satinization = {}
    const data = sanitize(rawData, satinization)

    const validated = await validateAll(data, validation)
    if (validated.fails()) {
      return response.badRequest(validated.messages())
    }

    return await User.create(data)
  }

  async update({ params, request, response, auth }) {
    const isAdmin = auth.user.role === 'admin'
    const user = await User.findOrFail(params.id)

    if (!isAdmin && user.id !== auth.user.id) {
      return response.unauthorized()
    }

    const fields = ['email', 'username', 'password']
    if (isAdmin) {
      fields.push('role')
    }
    const rawData = request.only(fields)

    const validation = {
      email: 'email|max:254|unique:users,email,id,' + user.id,
      username: 'string|max:80|unique:users,username,id,' + user.id,
      role: `string|in:${roles.join(',')}`,
      password: 'string|max:60',
    }
    const satinization = {}
    const data = sanitize(rawData, satinization)

    const validated = await validateAll(rawData, validation)
    if (validated.fails()) {
      return response.badRequest(validated.messages())
    }

    user.merge(data)
    await user.save()
    return user
  }

  async destroy({ params, response }) {
    const user = await User.findOrFail(params.id)
    await user.delete()
    response.noContent({})
  }
}

module.exports = UserController
