'use strict'

const ValidationFormatter = use('ValidationFormatter')
const Database = use('Database')
const Series = use('App/Models/Series')
const Hit = use('App/Models/Hit')
const { validateAll, sanitize, sanitizor } = use('Validator')
const statuses = ['draft', 'published', 'deleted', 'revision']
const classification = ['open', '10', '12', '14', '16', '18']
const releaseStatus = ['tba', 'airing', 'complete', 'onhold', 'canceled']
const types = ['series', 'ova', 'movie', 'special']

function hit(seriesId, ip) {
  return Hit.create({ seriesId, ip }) //.catch(() => {})
}
class SeriesController {
  async index({ request, auth }) {
    const {
      page = 1,
      order = 'id',
      direction = 'asc',
      search,
      year,
      releaseStatus,
      tag,
      slug,
      transmissions = false,
      limit = 30,
      type,
      top = false,
      allYears = false,
    } = request.get()
    const query = Series.query()
      .with('author')
      .with('author.avatar')
      .with('editedBy')
      .with('editedBy.avatar')
      .with('tags')
      .with('cover')

    if (Boolean(top)) {
      const result = await Series.topSeries()
      const ids = result.rows.map((r) => r.seriesId)
      const counts = result.rows.map((r) => +r.episodes)
      const series = await query.whereIn('id', ids).fetch()
      return ids.map((id, i) => {
        const row = series.rows.find((s) => s.id === id)
        if (!row) {
          return row
        }
        row.episodeCount = counts[i]
        return row
      })
    }

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

    if (Boolean(allYears)) {
      return Database.raw('SELECT distinct year FROM series ' +
        'WHERE type = ? order by year asc', [type])
    }

    if (slug) {
      query.where('slug', slug)
    }

    if (type) {
      query.where('type', type)
    }

    const isCommonUser = !auth.user || auth.user.role === 'user'
    if (isCommonUser) {
      query.where('status', 'published')
    }

    if (search) {
      query.where('title', 'ilike', `%${search}%`)
    }

    if (year) {
      query.where('year', year)
    }

    if (releaseStatus) {
      query.where('releaseStatus', releaseStatus)
    }

    if (tag) {
      query.whereRaw('id in (select "series_id" from "serie_tags" ' +
        'where "tag_id" in (select "id" from "tags" where "slug" = ?))', [tag]);
    }

    const realLimit = Math.min(Number(limit), 30)

    const result = await query
      .orderBy(order, direction)
      .paginate(Number(page), realLimit)

    const countHit =
      (!auth.user || auth.user.role === 'user') &&
      slug &&
      result.rows.length === 1

    if (countHit) {
      hit(
        result.rows[0].id,
        request.ips()[0] || request.header('x-real-ip') || request.ip()
      )
    }

    return result
  }

  async show({ params, auth, request }) {
    const found = await getById(params.id, auth)

    const countHit = !auth.user || auth.user.role === 'user'
    if (countHit) {
      hit(
        found.id,
        request.ips()[0] || request.header('x-real-ip') || request.ip()
      )
    }

    return found
  }

  async related({ params, auth }) {
    const found = (await getById(params.id, auth)).toJSON()

    const relatedSeries = await baseQuery()
      .whereIn(
        'id',
        Object.keys(found.relatedSeries).map((k) => +k)
      )
      .fetch()

    return Object.entries(found.relatedSeries).map(([key, label]) => ({
      series: relatedSeries.rows.find((s) => s.id === +key),
      label,
    }))
  }

  async store({ request, response, auth }) {
    const rawData = request.only([
      'authorId',
      'title',
      'slug',
      'synopsis',
      'status',
      'coverId',
      'episodeCount',
      'year',
      'weekDay',
      'releaseDate',
      'releaseTime',
      'episodeDuration',
      'trailer',
      'producer',
      'classification',
      'releaseStatus',
      'type',
      'relatedSeries',
    ])
    const { tags = [] } = request.only(['tags'])

    const validation = {
      title: 'required|string',
      slug: 'required|string|unique:series',
      authorId: 'required|exists:users,id',
      coverId: 'exists:images,id',
      synopsis: 'required|string',
      status: `string|in:${statuses.join(',')}`,
      tags: 'array|existsAll:tags,id',
      episodeCount: 'number|above:0',
      year: 'number|above:1900',
      releaseDate: 'string|brazilianDate',
      releaseTime: 'string|brazilianTime',
      episodeDuration: 'number|above:0',
      weekDay: 'integer|under:7|above:0',
      trailer: 'includes:http',
      producer: 'string',
      classification: `string|in:${classification.join(',')}`,
      releaseStatus: `string|in:${releaseStatus.join(',')}`,
      type: `required|string|in:${types.join(',')}`,
      relatedSeries: 'object|relatedSeries',
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
    if (!data.relatedSeries) {
      data.relatedSeries = {}
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

    return getById(series.id, auth)
  }

  async update({ params, request, response, auth }) {
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
      'weekDay',
      'releaseDate',
      'releaseTime',
      'episodeDuration',
      'trailer',
      'producer',
      'classification',
      'releaseStatus',
      'type',
      'relatedSeries',
    ])
    const { tags } = request.only(['tags'])

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
      weekDay: 'integer|under:7|above:-1',
      releaseDate: 'string|brazilianDate',
      releaseTime: 'string|brazilianTime',
      episodeDuration: 'number|above:0',
      trailer: 'includes:http',
      producer: 'string',
      classification: `string|in:${classification.join(',')}`,
      releaseStatus: `string|in:${releaseStatus.join(',')}`,
      type: `string|in:${types.join(',')}`,
      relatedSeries: 'object|relatedSeries',
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
    if (tags != null) {
      await series.tags().sync(tags.map((t) => +t))
    }

    return getById(series.id, auth)
  }

  async destroy({ params, response }) {
    const series = await Series.findOrFail(params.id)
    await series.delete()
    response.noContent({})
  }
}

module.exports = SeriesController

function baseQuery() {
  return Series.query()
    .with('author')
    .with('editedBy')
    .with('tags')
    .with('cover')
}

function getById(id, auth) {
  const query = Series.query()
    .with('author')
    .with('editedBy')
    .with('tags')
    .with('cover')
    .where('id', id)

  if (!auth || !auth.user || auth.user.role === 'user') {
    query.where('status', 'published')
  }

  return query.firstOrFail()
}
