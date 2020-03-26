'use strict'

const Series = use('App/Models/Series')
const { validateAll, sanitize, sanitizor } = use('Validator')
const statuses = ['draft', 'published', 'deleted', 'revision']

class SeriesController {
  index({ request }) {
    const page = Number(request.get('page')) || 1
    return Series.query().paginate(page)
  }

  async show({ params }) {
    const series = await Series.findOrFail(params.id)
    return series
  }

  async store({ request, response }) {
    const rawData = request.only([
      'authorId',
      'title',
      'slug',
      'synopsis',
      'status',
    ])
    const { tags = [] } = request.only(['tags'])

    const validation = {
      title: 'required|string',
      slug: 'required|string|unique:series',
      authorId: 'required|exists:users,id',
      synopsis: 'required|string',
      status: `string|in:${statuses.join(',')}`,
      tags: 'array|existsAll:tags,id',
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

    const validated = await validateAll({ ...data, tags }, validation)
    if (validated.fails()) {
      return response.badRequest(validated.messages())
    }

    const series = await Series.create(data)
    await series.tags().sync(tags.map((t) => +t))

    return Series.query().where('id', series.id).with('tags').first()
  }

  async update({ params, request, response }) {
    const series = await Series.findOrFail(params.id)
    const rawData = request.only([
      'revisionOfId',
      'authorId',
      'editingById',
      'title',
      'slug',
      'synopsis',
      'status',
    ])
    const { tags = [] } = request.only(['tags'])

    const validation = {
      title: 'string',
      slug: 'string|unique:series,id,' + series.id,
      revisionOfId: 'exists:series,id',
      authorId: 'exists:users,id',
      editingById: 'exists:users,id',
      synopsis: 'string',
      status: `string|in:${statuses.join(',')}`,
      tags: 'array|existsAll:tags,id',
    }
    const satinization = {
      slug: 'slug',
    }
    const data = sanitize(rawData, satinization)

    const validated = await validateAll({ ...rawData, tags }, validation)
    if (validated.fails()) {
      return response.badRequest(validated.messages())
    }

    series.merge(data)
    await series.save()
    await series.tags().sync(tags.map((t) => +t))

    return Series.query().where('id', series.id).with('tags').first()
  }

  async destroy({ params, response }) {
    const series = await Series.findOrFail(params.id)
    await series.delete()
    response.noContent({})
  }
}

module.exports = SeriesController
