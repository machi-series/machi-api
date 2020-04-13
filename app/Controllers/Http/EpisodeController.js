'use strict'

const ValidationFormatter = use('ValidationFormatter')
const Database = use('Database')
const Episode = use('App/Models/Episode')
const Link = use('App/Models/Link')
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
      ignoreIndex,
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

    if (ignoreIndex != null) {
      query.where('ignoreIndex', ignoreIndex === 'true')
    }

    if (search) {
      query.where(function () {
        this.where('title', 'ilike', `%${search}%`).orWhere(
          'number',
          'ilike',
          `%${search}%`
        )
      })
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
        return protectModels(
          auth,
          await query.clone().whereIn('id', ids).fetch()
        )
      }
    } else {
      query.orderBy(order, direction)
    }

    return protectModels(
      auth,
      await query.paginate(Number(page), Math.min(Number(limit), 30))
    )
  }

  async show({ params, auth }) {
    return protectModels(auth, await getById(params.id, auth))
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
      'ignoreIndex',
      'priority',
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
      ignoreIndex: 'boolean',
      priority: 'number',
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
      'ignoreIndex',
      'priority',
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
      ignoreIndex: 'boolean',
      priority: 'number',
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

  async requestLink({ response, params, auth }) {
    const { episodeId, quality, index } = params
    const episode = (await getById(episodeId, auth)).toJSON()

    if (!episode.links[quality] || !episode.links[quality][index]) {
      return response.badRequest()
    }

    const link = await Link.create({
      link: episode.links[quality][index],
    })

    return { id: link.id }
  }

  async retreiveLink({ params }) {
    const { id } = params
    const now = new Date(new Date().getTime() - 1000 * 5)
    const data = await Link.query()
      .whereRaw('created_at < ? AND id = ?', [now, id])
      .firstOrFail()
    return data
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

function protectModels(auth, modelOrModels) {
  if ((auth && auth.user && auth.user.role !== 'user') || !modelOrModels) {
    return modelOrModels
  }

  if (modelOrModels.toJSON) {
    return protectModels(auth, modelOrModels.toJSON())
  }

  if (modelOrModels.perPage) {
    return { ...modelOrModels, data: protectModels(auth, modelOrModels.data) }
  }

  if (Array.isArray(modelOrModels)) {
    return modelOrModels.map((x) => protectModels(auth, x))
  }

  return {
    ...modelOrModels,
    links: protectLinks(modelOrModels.links),
  }
}

function protectLinks(links) {
  if (!links) {
    return links
  }

  return Object.entries(links).reduce((acc, [quality, value]) => {
    acc[quality] =
      quality !== 'online'
        ? value.map((v, index) => protectLink(v, quality, index))
        : value
    return acc
  }, {})
}

function protectLink(link, quality, index) {
  const name = link
    .split('.')
    .find((part) => !part.includes('www'))
    .replace(/https?:\/\//, '')

  return {
    name,
    quality,
    index,
  }
}
