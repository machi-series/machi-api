'use strict'

const ValidationFormatter = use('ValidationFormatter')
const News = use('App/Models/News')
const { validateAll, sanitize, sanitizor } = use('Validator')
const statuses = ['draft', 'published', 'deleted', 'revision']

class NewsController {
  async index({ request, auth }) {
    const {
      page = 1,
      order = 'id',
      direction = 'asc',
      search,
      slug,
      limit = 10,
      priority,
    } = request.get()
    const query = News.query()
      .with('author')
      .with('author.avatar')
      .with('editedBy')
      .with('editedBy.avatar')
      .with('cover')

    if (slug) {
      query.where('slug', slug)
    }

    if (priority != null) {
      query.where('priority', priority === 'true')
    }

    const isCommonUser = !auth.user || auth.user.role === 'user'
    if (isCommonUser) {
      query.where('status', 'published')
    }

    if (search) {
      query.where('title', 'ilike', `%${search}%`)
    }

    const realLimit = Math.min(Number(limit), 10)

    return await query
      .orderBy(order, direction)
      .paginate(Number(page), realLimit)
  }

  async show({ params, auth, request }) {
    const found = await getById(params.id, auth)
    return found
  }

  async store({ request, response, auth }) {
    const rawData = request.only([
      'authorId',
      'title',
      'slug',
      'content',
      'status',
      'coverId',
      'priority',
    ])

    const validation = {
      title: 'required|string',
      slug: 'required|string|unique:news',
      authorId: 'required|exists:users,id',
      coverId: 'exists:images,id',
      content: 'required|string',
      status: `string|in:${statuses.join(',')}`,
      priority: 'boolean',
    }
    const satinization = {
      slug: 'slug',
    }
    const data = sanitize(rawData, satinization)

    if (!data.slug && data.title) {
      data.slug = sanitizor.slug(data.title)
    }
    if (!data.status) {
      data.status = 'draft'
    }

    const validated = await validateAll(
      data,
      validation,
      {},
      ValidationFormatter.formatter
    )
    if (validated.fails()) {
      return response.badRequest(validated.messages())
    }

    const news = await News.create(data)
    return getById(news.id, auth)
  }

  async update({ params, request, response, auth }) {
    const news = await News.findOrFail(params.id)
    const rawData = request.only([
      'revisionOfId',
      'authorId',
      'editedById',
      'title',
      'slug',
      'content',
      'status',
      'coverId',
      'priority',
    ])

    const validation = {
      title: 'string',
      slug: 'string|unique:series,slug,id,' + news.id,
      revisionOfId: 'exists:series,id',
      authorId: 'exists:users,id',
      coverId: 'exists:images,id',
      editedById: 'exists:users,id',
      content: 'string',
      status: `string|in:${statuses.join(',')}`,
      priority: 'boolean',
    }
    const satinization = {
      slug: 'slug',
    }
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

    news.merge(data)
    await news.save()
    return getById(news.id, auth)
  }

  async destroy({ params, response }) {
    const news = await News.findOrFail(params.id)
    await news.delete()
    response.noContent({})
  }
}

module.exports = NewsController

function baseQuery() {
  return News.query()
    .with('author')
    .with('author.avatar')
    .with('editedBy')
    .with('editedBy.avatar')
    .with('cover')
}

function getById(id, auth) {
  const query = baseQuery().where('id', id)

  if (!auth || !auth.user || auth.user.role === 'user') {
    query.where('status', 'published')
  }

  return query.firstOrFail()
}
