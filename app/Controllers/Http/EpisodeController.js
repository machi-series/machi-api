'use strict'

const Episode = use('App/Models/Episode')
const { validateAll, sanitize, sanitizor } = use('Validator')
const statuses = ['draft', 'published', 'deleted', 'revision']
const episodeTypes = ['episode', 'ova', 'movie', 'special']
const episodeQualities = ['bluray', 'hdtv']

class EpisodeController {
  index({ request }) {
    const page = Number(request.get('page')) || 1
    return Episode.query().paginate(page)
  }

  async show({ params }) {
    const episode = await Episode.findOrFail(params.id)
    return episode
  }

  async store({ request, response }) {
    const rawData = request.only([
      'authorId',
      'title',
      'slug',
      'synopsis',
      'status',
      'number',
      'links',
      'type',
      'quality',
    ])

    const validation = {
      title: 'required|string',
      slug: 'required|string|unique:episodes',
      authorId: 'required|exists:users,id',
      synopsis: 'required|string',
      status: `string|in:${statuses.join(',')}`,
      number: 'required|string',
      links: 'required|links',
      type: `required|string|in:${episodeTypes.join(',')}`,
      quality: `required|string|in:${episodeQualities.join(',')}`,
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

    const validated = await validateAll(data, validation)
    if (validated.fails()) {
      return response.badRequest(validated.messages())
    }

    return Episode.create(data)
  }

  async update({ params, request, response }) {
    const episode = await Episode.findOrFail(params.id)
    const rawData = request.only([
      'revisionOfId',
      'authorId',
      'editingById',
      'title',
      'slug',
      'synopsis',
      'status',
      'number',
      'links',
      'type',
      'quality',
    ])

    const validation = {
      title: 'string',
      slug: 'string|unique:episodes,id,' + episode.id,
      revisionOfId: 'exists:episodes,id',
      authorId: 'exists:users,id',
      editingById: 'exists:users,id',
      synopsis: 'string',
      status: `string|in:${statuses.join(',')}`,
      number: 'string',
      links: 'links',
      type: `string|in:${episodeTypes.join(',')}`,
      quality: `string|in:${episodeQualities.join(',')}`,
    }
    const satinization = {
      slug: 'slug',
    }
    const data = sanitize({ rawData }, satinization)

    const validated = await validateAll(data, validation)
    if (validated.fails()) {
      return response.badRequest(validated.messages())
    }

    episode.merge(data)
    await episode.save()
    return episode
  }

  async destroy({ params, response }) {
    const episode = await Episode.findOrFail(params.id)
    await episode.delete()
    response.noContent({})
  }
}

module.exports = EpisodeController
