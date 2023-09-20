'use strict'

const ValidationFormatter = use('ValidationFormatter')
const Tag = use('App/Models/Tag')
const { validateAll, sanitize, sanitizor } = use('Validator')

class TagController {
  index({ request }) {
    const { page = 1, limit = 20, order = 'id', direction = 'asc', search, seriesType, } = request.get()
    const query = Tag.query()

    if (search) {
      query.where('name', 'ilike', `%${search}%`)
    }

    if(seriesType) {
      query.whereRaw('id in (select "tag_id" from "serie_tags" ' +
        'where "series_id" in (select "id" from "series" where "type" = ?))', [seriesType]);
    }

    return query.orderBy(order, direction).paginate(Number(page), limit)
  }

  async show({ params }) {
    const tag = await Tag.findOrFail(params.id)
    return tag
  }

  async store({ request, response }) {
    const rawData = request.only(['name', 'slug'])

    const validation = {
      name: 'required|string',
      slug: 'required|string|unique:tags',
    }
    const satinization = {
      slug: 'slug',
    }
    const data = sanitize(rawData, satinization)

    if (!data.slug && data.name) {
      data.slug = sanitizor.slug(data.name)
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

    return Tag.create(data)
  }

  async update({ params, request, response }) {
    const tag = await Tag.findOrFail(params.id)
    const rawData = request.only(['name', 'slug'])

    const validation = {
      name: 'string',
      slug: 'string|unique:tags',
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

    tag.merge(data)
    await tag.save()
    return tag
  }

  async destroy({ params, response }) {
    const tag = await Tag.findOrFail(params.id)
    await tag.delete()
    response.noContent({})
  }
}

module.exports = TagController
