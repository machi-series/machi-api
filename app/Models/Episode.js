'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const Ws = use('Ws')

class Episode extends Model {
  static boot() {
    super.boot()
    this.addTrait('UtcDate')

    this.addHook('afterSave', async (instance) => {
      if (instance.status !== 'published') {
        return
      }
      const topic = Ws.getChannel('updates:*').topic('updates:episodes')
      if (topic) {
        const payload = Episode.protectModels(
          null,
          await Episode.getById(instance.id)
        )
        topic.broadcast('episode', payload)
      }
    })
  }

  series() {
    return this.hasOne('App/Models/Series', 'seriesId', 'id')
  }

  author() {
    return this.hasOne('App/Models/PublicUser', 'authorId', 'id')
  }

  editedBy() {
    return this.hasOne('App/Models/PublicUser', 'editedById', 'id')
  }

  cover() {
    return this.hasOne('App/Models/Image', 'coverId', 'id')
  }

  getLinks(links) {
    try {
      return JSON.parse(links)
    } catch (err) {
      return links
    }
  }

  setLinks(links) {
    return JSON.stringify(links)
  }

  static getById(id, auth) {
    const query = Episode.query()
      .with('author')
      .with('author.avatar')
      .with('editedBy')
      .with('editedBy.avatar')
      .with('series')
      .with('series.cover')
      .with('cover')
      .where('id', id)

    if (!auth || !auth.user || auth.user.role === 'user') {
      query.where('status', 'published')
    }

    return query.firstOrFail()
  }

  static protectModels(auth, modelOrModels) {
    if ((auth && auth.user && auth.user.role !== 'user') || !modelOrModels) {
      return modelOrModels
    }

    if (modelOrModels.toJSON) {
      return Episode.protectModels(auth, modelOrModels.toJSON())
    }

    if (modelOrModels.perPage) {
      return {
        ...modelOrModels,
        data: Episode.protectModels(auth, modelOrModels.data),
      }
    }

    if (Array.isArray(modelOrModels)) {
      return modelOrModels.map((x) => Episode.protectModels(auth, x))
    }

    return {
      ...modelOrModels,
      links: protectLinks(modelOrModels.links),
    }
  }
}

module.exports = Episode

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
