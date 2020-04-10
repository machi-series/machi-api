'use strict'

const ValidationFormatter = use('ValidationFormatter')
const Database = use('Database')
const Episode = use('App/Models/Episode')
const { validateAll, sanitize, sanitizor } = use('Validator')
const statuses = ['draft', 'published', 'deleted', 'revision']
const episodeTypes = ['episode', 'ova', 'movie', 'special']
const episodeQualities = ['bluray', 'hdtv', 'dvd']

class EpisodeController {
  async index({ request, auth }) {
    const {
      page = 1,
      order = 'id',
      direction = 'asc',
      forceAsc = false,
      seriesId,
      search,
      specialOrder,
      type,
      limit = 30,
      around = false,
      slug,
    } = request.get()
    const query = Episode.query()
      .with('author.avatar')
      .with('editedBy')
      .with('editedBy.avatar')
      .with('series')
      .with('cover')

    const isCommonUser = !auth.user || auth.user.role === 'user'
    if (isCommonUser) {
      query.where('status', 'published')
    }

    if (slug) {
      query.where('slug', slug)
    }

    if (seriesId) {
      query.where('seriesId', Number(seriesId))
    }

    if (type) {
      query.where('type', type)
    }

    if (search) {
      query.where('title', 'ilike', `%${search}%`)
    }

    const specialDirection = forceAsc ? 'ASC' : 'DESC'
    if (specialOrder) {
      const specialOrderby = `\
priority ${specialDirection},
(CASE
  WHEN type = 'episode' THEN 1
  WHEN type = 'ova' THEN 2
  WHEN type = 'movie' THEN 3
  ELSE 4
  END) ${specialDirection},
  number::FLOAT ${specialDirection}
`
      query.orderByRaw(specialOrderby)

      if (/\d+/.test(around)) {
        const rawAroundIds = await Database.raw(
          `\
WITH cte AS (
  SELECT
    s1.id, row_number() OVER (ORDER BY ${specialOrderby})
  FROM
    (${query.clone().toString()}) as s1
), current AS (
  SELECT
    row_number
  FROM
    cte
  WHERE
    id = ?
)

SELECT
  cte.id
FROM
  cte, current
WHERE
  ABS(cte.row_number - current.row_number) <= 4
ORDER BY
  cte.row_number;
`,
          around
        )

        const allIds = rawAroundIds.rows.map((r) => r.id)
        const centerIndex = allIds.indexOf(+around)
        const startSlicing = Math.max(0, centerIndex - 2)
        const endSlicing = startSlicing + 5
        const ids = allIds.slice(startSlicing, endSlicing)
        return query.clone().whereIn('id', ids).fetch()
      }
    } else {
      query.orderBy(order, direction)
    }

    return query.paginate(Number(page), Math.min(Number(limit), 30))
  }

  async show({ params, auth }) {
    return getById(params.id, auth)
  }

  async store({ request, response, auth }) {
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
      coverId: 'exists:images,id',
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
    return getById(episode.id, auth)
  }

  async update({ params, request, response, auth }) {
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
      slug: 'string|unique:episodes,slug,id,' + episode.id,
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
    return getById(episode.id, auth)
  }

  async destroy({ params, response }) {
    const episode = await Episode.findOrFail(params.id)
    await episode.delete()
    response.noContent({})
  }
}

module.exports = EpisodeController

function getById(id, auth) {
  const query = Episode.query()
    .with('author')
    .with('editedBy')
    .with('series')
    .with('cover')
    .where('id', id)

  if (!auth || !auth.user || auth.user.role === 'user') {
    query.where('status', 'published')
  }

  return query.firstOrFail()
}
