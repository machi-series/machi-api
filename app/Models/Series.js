'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const Database = use('Database')

const topCache = {
  promise: null,
  data: null,
  lastRun: 0,
}

class Series extends Model {
  static boot() {
    super.boot()
    this.addTrait('UtcDate')
  }

  getRelatedSeries(value) {
    try {
      return typeof value === 'string' ? JSON.parse(value) : value
    } catch (err) {
      return value
    }
  }

  setRelatedSeries(value) {
    return typeof value === 'string' ? JSON.stringify(value) : value
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

  revisionOf() {
    return this.hasOne('App/Models/Series', 'revisionOfId', 'id')
  }

  revisions() {
    return this.hasMany('App/Models/Series', 'id', 'revisionOfId')
  }

  tags() {
    return this.belongsToMany('App/Models/Tag').pivotModel(
      'App/Models/SeriesTag'
    )
  }

  static async topSeries() {
    const q = `\
WITH tops AS (
  SELECT
  h."seriesId", count(h.id) AS n
  FROM
    hits h
  WHERE
    h.created_at > current_date - interval '7 days'
  GROUP BY
    h."seriesId"
  ORDER BY
    count(h.id) DESC
  LIMIT 5
)
SELECT
  t."seriesId", t.n, count(e.id) AS episodes
FROM
  tops t
LEFT JOIN
  episodes e ON e."seriesId" = t."seriesId"
WHERE
  e.status = 'published'
GROUP BY
  t."seriesId", t.n
  ORDER BY
    t.n DESC
  `

    const nextRun = new Date().getTime()

    const isFirstRun = topCache.lastRun === 0

    const thresholdMs = 15 * 60 * 1000 // 15 min
    const isTime = isFirstRun || nextRun - topCache.lastRun > thresholdMs

    // Should not refresh yet
    if (!isTime) {
      return topCache.data
    }

    if (!topCache.promise) {
      topCache.promise = Database.raw(q).then((data) => {
        topCache.lastRun = nextRun
        topCache.data = data
        topCache.promise = null
      })
    }

    if (isFirstRun) {
      await topCache.promise
    }

    return topCache.data
  }
}

module.exports = Series
