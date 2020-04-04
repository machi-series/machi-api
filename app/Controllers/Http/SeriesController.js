'use strict'

const ValidationFormatter = use('ValidationFormatter')
const Series = use('App/Models/Series')
const { validateAll, sanitize, sanitizor } = use('Validator')
const statuses = ['draft', 'published', 'deleted', 'revision']
const classification = ['open', '10', '12', '14', '16', '18']
const releaseStatus = ['tba', 'airing', 'complete', 'onhold', 'canceled']
const types = ['series', 'ova', 'movie', 'special']

class SeriesController {
  index({ request }) {
    const {
      page = 1,
      order = 'id',
      direction = 'asc',
      search,
      transmissions = false,
      limit = 20,
    } = request.get()
    const query = Series.query()
      .with('author')
      .with('editedBy')
      .with('tags')
      .with('cover')

    if (Boolean(transmissions)) {
      return query
        .where('releaseStatus', 'airing')
        .whereNotNull('weekDay')
        .whereNotNull('releaseTime')
        .whereNotNull('episodeDuration')
        .orderBy('weekDay', 'asc')
        .orderBy('releaseTime', 'asc')
        .paginate(1, 500)
    }

    if (search) {
      query.where('title', 'ilike', `%${search}%`)
    }

    return query
      .orderBy(order, direction)
      .paginate(Number(page), Math.min(Number(limit), 20))
  }

  async show({ params }) {
    return getById(params.id)
  }

  async store({ request, response }) {
    const rawData = request.only([
      'authorId',
      'title',
      'slug',
      'synopsis',
      'status',
      'coverId',
      'episodeCount',
      'year',
      'releaseDate',
      'releaseTime',
      'episodeDuration',
      'trailer',
      'producer',
      'classification',
      'releaseStatus',
      'type',
    ])
    const { tags = [] } = request.only(['tags'])

    const validation = {
      title: 'required|string',
      slug: 'required|string|unique:series',
      authorId: 'required|exists:users,id',
      coverId: 'required|exists:images,id',
      synopsis: 'required|string',
      status: `string|in:${statuses.join(',')}`,
      tags: 'array|existsAll:tags,id',
      episodeCount: 'number|above:0',
      year: 'number|above:1900',
      releaseDate: 'string|brazilianDate',
      releaseTime: 'string|brazilianTime',
      episodeDuration: 'number|above:0',
      trailer: 'url',
      producer: 'string',
      classification: `string|in:${classification.join(',')}`,
      releaseStatus: `string|in:${releaseStatus.join(',')}`,
      type: `required|string|in:${types.join(',')}`,
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
      { ...data, tags },
      validation,
      {},
      ValidationFormatter.formatter
    )
    if (validated.fails()) {
      return response.badRequest(validated.messages())
    }

    const series = await Series.create(data)
    await series.tags().sync(tags.map((t) => +t))

    return getById(series.id)
  }

  async update({ params, request, response }) {
    const series = await Series.findOrFail(params.id)
    const rawData = request.only([
      'revisionOfId',
      'authorId',
      'editedById',
      'title',
      'slug',
      'synopsis',
      'status',
      'coverId',
      'episodeCount',
      'year',
      'releaseDate',
      'releaseTime',
      'episodeDuration',
      'trailer',
      'producer',
      'classification',
      'releaseStatus',
      'type',
    ])
    const { tags = [] } = request.only(['tags'])

    const validation = {
      title: 'string',
      slug: 'string|unique:series,slug,id,' + series.id,
      revisionOfId: 'exists:series,id',
      authorId: 'exists:users,id',
      coverId: 'exists:images,id',
      editedById: 'exists:users,id',
      synopsis: 'string',
      status: `string|in:${statuses.join(',')}`,
      tags: 'array|existsAll:tags,id',
      episodeCount: 'number|above:0',
      year: 'number|above:1900',
      releaseDate: 'string|brazilianDate',
      releaseTime: 'string|brazilianTime',
      episodeDuration: 'number|above:0',
      trailer: 'url',
      producer: 'string',
      classification: `string|in:${classification.join(',')}`,
      releaseStatus: `string|in:${releaseStatus.join(',')}`,
      type: `string|in:${types.join(',')}`,
    }
    const satinization = {
      slug: 'slug',
    }
    const data = sanitize(rawData, satinization)

    const validated = await validateAll(
      { ...rawData, tags },
      validation,
      {},
      ValidationFormatter.formatter
    )
    if (validated.fails()) {
      return response.badRequest(validated.messages())
    }

    series.merge(data)
    await series.save()
    await series.tags().sync(tags.map((t) => +t))

    return getById(series.id)
  }

  async destroy({ params, response }) {
    const series = await Series.findOrFail(params.id)
    await series.delete()
    response.noContent({})
  }
}

module.exports = SeriesController

function getById(id) {
  return Series.query()
    .with('author')
    .with('editedBy')
    .with('tags')
    .with('cover')
    .where('id', id)
    .firstOrFail()
}
