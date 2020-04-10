'use strict'

const Database = use('Database')

class SiteController {
  async sitemapData() {
    const seriesQuery = `\
    SELECT
      id, slug, title, type, updated_at, 'series' as source
    FROM
      series
    WHERE
      status = 'published'
    `
    const episodesQuery = `\
    SELECT
      id, slug, title, type, updated_at, 'episodes' as source
    FROM
      episodes
    WHERE
      status = 'published'
    `
    const results = await Database.raw(`\
    ${seriesQuery}

    UNION

    ${episodesQuery}
    `)

    return results.rows
  }
}

module.exports = SiteController
