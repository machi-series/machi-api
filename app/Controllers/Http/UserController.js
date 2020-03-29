'use strict'

const ValidationFormatter = use('ValidationFormatter')
const { validateAll, sanitize, sanitizor } = use('Validator')
const Mail = use('Mail')
const Env = use('Env')
const User = use('App/Models/User')
const roles = ['user', 'publisher', 'manager', 'admin']

class UserController {
  async login({ auth, request }) {
    const { email, password } = request.all()
    return await auth.attempt(email, password)
  }

  me({ auth, params }) {
    return getById(auth.user.id)
  }

  async forgot({ request, auth }) {
    const { email } = request.all()
    const user = await User.findByOrFail('email', email)
    const { token } = await auth.generate(
      user,
      {},
      {
        expiresIn: 60 * 60, // hour
      }
    )

    await Mail.send(
      'emails.forgot',
      { user: user.toJSON(), token, APP_URL: Env.get('APP_URL') },
      (message) => {
        message
          .to(user.email)
          .from('naoresponda@animestc.com')
          .subject('Recuperação de senha')
      }
    )
  }

  async recover({ auth, view }) {
    const randomPassword = Math.random().toString(16).slice(7)
    const user = await User.findOrFail(auth.user.id)
    user.password = randomPassword
    await user.save()
    return view.render('recover', { randomPassword })
  }

  index({ request }) {
    const { page = 1, order = 'id', direction = 'asc', search } = request.get()
    const query = User.query().with('avatar')

    if (search) {
      query.orWhere('username', 'ilike', `%${search}%`)
      query.orWhere('email', 'ilike', `%${search}%`)
    }

    return query.orderBy(order, direction).paginate(Number(page))
  }

  async show({ params }) {
    return getById(params.id)
  }

  async store({ request, response }) {
    const rawData = request.only([
      'email',
      'username',
      'role',
      'password',
      'avatarId',
    ])

    const validation = {
      email: 'required|email|max:254|unique:users,email',
      username: 'required|string|max:80|unique:users,username',
      role: `required|string|in:${roles.join(',')}`,
      password: 'required|string|max:60',
      avatarId: 'exists:images,id',
    }
    const satinization = {}
    const data = sanitize(rawData, satinization)

    const validated = await validateAll(
      data,
      validation,
      {},
      ValidationFormatter.formatter
    )
    if (validated.fails()) {
      return response.badRequest(validated.messages())
    }

    const user = await User.create(data)
    return getById(user.id)
  }

  async update({ params, request, response, auth }) {
    const isAdmin = auth.user.role === 'admin'
    const user = await User.findOrFail(params.id)

    if (!isAdmin && user.id !== auth.user.id) {
      return response.unauthorized()
    }

    const fields = ['email', 'username', 'password', 'avatarId']
    if (isAdmin) {
      fields.push('role')
    }
    const rawData = request.only(fields)

    const validation = {
      email: 'email|max:254|unique:users,email,id,' + user.id,
      username: 'string|max:80|unique:users,username,id,' + user.id,
      role: `string|in:${roles.join(',')}`,
      password: 'string|max:60',
      avatarId: 'exists:images,id',
    }
    const satinization = {}
    const data = sanitize(rawData, satinization)

    const validated = await validateAll(
      rawData,
      validation,
      {},
      ValidationFormatter.formatter
    )
    if (validated.fails()) {
      return response.badRequest(validated.messages())
    }

    user.merge(data)
    await user.save()
    return getById(user.id)
  }

  async destroy({ params, response }) {
    const user = await User.findOrFail(params.id)
    await user.delete()
    response.noContent({})
  }
}

module.exports = UserController

function getById(id) {
  return User.query().with('avatar').where('id', id).firstOrFail()
}
