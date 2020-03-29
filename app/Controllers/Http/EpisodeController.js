'use strict'

const ValidationFormatter = use('ValidationFormatter')
const Episode = use('App/Models/Episode')
const { validateAll, sanitize, sanitizor } = use('Validator')
const statuses = ['draft', 'published', 'deleted', 'revision']
const episodeTypes = ['episode', 'ova', 'movie', 'special']
const episodeQualities = ['bluray', 'hdtv', 'dvd']

class EpisodeController {
  index({ request }) {
    const {
      page = 1,
      order = 'id',
      direction = 'asc',
      seriesId,
      search,
    } = request.get()
    const query = Episode.query()
      .with('author')
      .with('editedBy')
      .with('series')
      .with('cover')

    if (seriesId) {
      query.where('seriesId', Number(seriesId))
    }

    if (search) {
      query.where('title', 'ilike', `%${search}%`)
    }

    return query.orderBy(order, direction).paginate(Number(page))
  }

  async show({ params }) {
    return getById(params.id)
  }

  async store({ request, response }) {
    const rawData = request.only([
      'seriesId',
      'authorId',
      'title',
      'slug',
      'status',
      'number',
      'links',
      'type',
      'quality',
      'coverId',
      'source',
    ])

    const validation = {
      title: 'required|string',
      slug: 'required|string|unique:episodes',
      seriesId: 'required|exists:series,id',
      authorId: 'required|exists:users,id',
      coverId: 'required|exists:images,id',
      status: `string|in:${statuses.join(',')}`,
      number: 'required|string',
      links: 'required|object|links',
      type: `required|string|in:${episodeTypes.join(',')}`,
      quality: `required|string|in:${episodeQualities.join(',')}`,
      source: 'string',
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

    const episode = await Episode.create(data)
    return getById(episode.id)
  }

  async update({ params, request, response }) {
    const episode = await Episode.findOrFail(params.id)
    const rawData = request.only([
      'revisionOfId',
      'authorId',
      'editedById',
      'title',
      'slug',
      'status',
      'number',
      'links',
      'type',
      'quality',
      'coverId',
      'source',
    ])

    const validation = {
      title: 'string',
      slug: 'string|unique:episodes,id,' + episode.id,
      revisionOfId: 'exists:episodes,id',
      authorId: 'exists:users,id',
      coverId: 'exists:images,id',
      editedById: 'exists:users,id',
      status: `string|in:${statuses.join(',')}`,
      number: 'string',
      links: 'object|links',
      type: `string|in:${episodeTypes.join(',')}`,
      quality: `string|in:${episodeQualities.join(',')}`,
      source: 'string',
    }
    const satinization = {
      slug: 'slug',
    }
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

    episode.merge(data)
    await episode.save()
    return getById(episode.id)
  }

  async destroy({ params, response }) {
    const episode = await Episode.findOrFail(params.id)
    await episode.delete()
    response.noContent({})
  }
}

module.exports = EpisodeController

function getById(id) {
  return Episode.query()
    .with('author')
    .with('editedBy')
    .with('series')
    .with('cover')
    .where('id', id)
    .firstOrFail()
}
