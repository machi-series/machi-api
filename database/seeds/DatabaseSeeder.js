'use strict'

/*
|--------------------------------------------------------------------------
| DatabaseSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Env = use('Env')
const Database = use('Database')
const request = require('request').defaults({ encoding: null })
const Tag = use('App/Models/Tag')
const Series = use('App/Models/Series')
const Episode = use('App/Models/Episode')
const SeriesTag = use('App/Models/SeriesTag')
const User = use('App/Models/User')
const Image = use('App/Models/Image')
const Drive = use('Drive')
const jimp = require('jimp')
const path = require('path')
const os = require('os')
const fs = require('fs').promises

const oldTags = require('./atc-api/oldTags.json')
const oldUsers = require('./atc-api/oldUsers.json')
const oldStudios = require('./atc-api/oldStudios.json')
const transmissions = require('./atc-api/transmissions.json')
const oldSeries = require('./atc-api/oldSeries.json')
const online = require('./atc-api/online.json')
let oldEpisodes = require('./atc-api/oldEpisodes.json')
const uploadsFolder = '/Users/lubien/Downloads/uploads'

// only related to animes
oldEpisodes = oldEpisodes
  .filter((e) => e.number && oldSeries.find((s) => s.id === +e.belongsTo))
  .map((e) => ({
    ...(online.find((o) => e.id === +o.belongsToEpisodeId) || null),
    ...e,
  }))

// console.log(oldEpisodes.filter((e) => !e.number && e.authorId === 21).length)
// process.exit(0)

console.log('users:', oldUsers.length)
console.log('tags:', oldTags.length)
console.log('series:', oldSeries.length)
console.log('episodes:', oldEpisodes.length)

class DatabaseSeeder {
  async run() {
    const tags = await Tag.createMany(oldTags.map(prepareTag))
    const reTags = oldTags.reduce((acc, old, i) => {
      acc[old.term_id] = tags[i] && tags[i].id
      return acc
    }, {})
    console.log('more tags', tags.length)

    const users = await User.createMany(
      await Promise.all(oldUsers.map(prepareUser))
    )
    console.log('more users', users.length)
    const reUsers = oldUsers.reduce((acc, old, i) => {
      acc[old.ID] = users[i] && users[i].id
      return acc
    }, {})

    const reStudio = oldStudios.reduce((acc, old, i) => {
      acc[old.term_id] = old.name
      return acc
    }, {})

    const mergedOldSeries = oldSeries.map((old) => ({
      ...(transmissions.find((t) => +t.belongsToPostId === old.id) || null),
      ...old,
    }))
    // .slice(0, 25) // TEST ONLY

    console.log(mergedOldSeries.length)

    let series = []
    for (let chunk of chunks(mergedOldSeries, 500)) {
      let more
      try {
        const trx = await Database.beginTransaction()
        more = await Series.createMany(
          await Promise.all(
            chunk.map((x) => prepareSeries(x, reUsers, reTags, reStudio))
          ),
          trx
        )
        console.log('commit')
        await trx.commit()
        console.log('more series', series.length)
      } catch (err) {
        console.log(chunk)
        throw err
      }
      series = series.concat(more)
      // console.log(more)
    }
    const reSeries = mergedOldSeries.reduce((acc, old, i) => {
      acc[old.id] = series[i].id
      return acc
    }, {})

    const seriesTags = series
      .map((s, i) =>
        Array.isArray(mergedOldSeries[i].tags)
          ? mergedOldSeries[i].tags.map((t) => ({
              tag_id: reTags[t.id],
              series_id: s.id,
            }))
          : []
      )
      .reduce((acc, x) => acc.concat(x), [])

    let seriesTagsCount = 0
    for (let chunk of chunks(seriesTags, 1000)) {
      try {
        await SeriesTag.createMany(chunk)
        seriesTagsCount += chunk.length
        console.log('more series tags', seriesTagsCount)
      } catch (err) {
        console.log(chunk)
        throw err
      }
    }

    let episodesCount = 0
    for (let chunk of chunks(
      oldEpisodes.filter((e) =>
        mergedOldSeries.find((s) => s.id === +e.belongsTo)
      ),
      50
    )) {
      try {
        const trx = await Database.beginTransaction()
        // await Episode.createMany(
        //   await Promise.all(
        //     chunk.map((x) => prepareEpisode(x, reUsers, reSeries))
        //   ),
        //   trx
        // )
        await Promise.all(
          chunk.map((x) =>
            prepareEpisode(x, reUsers, reSeries).then((data) =>
              trx.insert(data).into('episodes')
            )
          )
        )
        console.log('commit')
        await trx.commit()
        episodesCount += chunk.length
        console.log('more episodes', episodesCount)
      } catch (err) {
        console.log(chunk)
        throw err
      }
      // console.log(more)
    }

    // const series = await sequential(
    //   (x) => prepareSeries(x, reUsers, reTags, reStudio),
    //   mergedOldSeries
    // )
    // await User.createMany(users)
  }
}

function prepareTag(tag) {
  const data = {
    name: tag.name,
    slug: tag.slug,
  }

  return data
}

async function prepareUser(user) {
  const image = await tryToGetImage(user.image, { width: 200, height: 200 })

  const json = {
    created_at: user.user_registered,
    avatarId: image ? image.id : null,
    email: user.user_email,
    username: user.user_login,
    role: ['gabrielsanbs', 'lubien'].includes(user.user_nicename)
      ? 'admin'
      : 'user',
    password: 'LFx!j%k7JlgW7%xIEP^E',
    // avatarId: user.user_email,
  }
  return json
}

async function prepareSeries(series, reUsers, reTags, reStudio) {
  const image = await tryToGetImage(series.image, { width: 220, height: 320 })

  const json = {
    created_at: series.created_at,
    updated_at: series.updated_at,
    coverId: (image && image.id) || null,
    authorId: reUsers[series.authorId],
    classification: mapClassification(series.classification),
    episodeCount: +series.episodeCount || null,
    // type: mapSeriesType(series.postType),
    releaseDate: mapDate(series.releaseDate),
    releaseStatus: mapReleaseStatus(series.releaseStatus),
    weekDay: mapWeekDay(series.weekDay),
    slug: series.slug,
    producer:
      series.studios && series.studios.length
        ? reStudio[series.studios[0].id]
        : null, // TODO
    synopsis: series.synopsis,
    // tags:
    //   series.tags && series.tags.length
    //     ? series.tags.map((t) => reTags[t.id])
    //     : [],
    title: series.title,
    trailer:
      series.trailer && series.trailer.includes('http')
        ? series.trailer.slice(0, 250)
        : null,
    type: mapSeriesType(series.type),
    year: +series.year || null,
    status: 'published',
    episodeDuration: +series.episodeDuration || 30,
    releaseTime: series.releaseTime,
    // avatarId: user.user_email,
  }

  return json
}

function mapClassification(x) {
  return {
    1: 'open',
    2: '10',
    3: '12',
    4: '14',
    5: '16',
    6: '18',
  }[x]
}

function mapDate(d) {
  if (!d || !/^(\d|\/)+$/.test(d) || d.length !== 10) {
    return null
  }
  return d.split('/').reverse().join('-')
}

function mapReleaseStatus(s) {
  return (
    {
      1: 'complete',
      2: 'airing',
      3: 'onhold',
      4: 'canceled',
      5: 'tba',
    }[s] || 'complete'
  )
}

function mapWeekDay(s) {
  const n = Number(s)

  if (!Number.isFinite(n) || n < 0 || n > 6) {
    return null
  }

  return n
}

function mapSeriesType(t) {
  return (
    {
      1: 'series',
      2: 'ova',
      3: 'special',
      4: 'movie',
    }[t] || 'series'
  )
}

async function prepareEpisode(episode, reUsers, reSeries) {
  const image = await tryToGetImage(episode.image, { width: 320, height: 190 })

  console.log(episode.created_at)
  const json = {
    created_at: episode.created_at,
    updated_at: episode.updated_at,
    coverId: (image && image.id) || null,
    seriesId: reSeries[episode.belongsTo],
    authorId: reUsers[episode.authorId],
    title: episode.title,
    slug: episode.slug,
    number: episode.number,
    source: episode.source,
    priority: episode.priority,
    type: mapEpisodeType(episode.type),
    quality: mapEpisodeQuality(episode.quality),
    status: 'published',
    links: mapEpisodeLinks(episode),
    // avatarId: user.user_email,
  }

  return json
}

function mapEpisodeType(t) {
  return (
    {
      Episódio: 'episode',
      OVA: 'ova',
      Especial: 'special',
      Filme: 'movie',
    }[t] || 'episode'
  )
}

function mapEpisodeQuality(q) {
  return (
    {
      1: 'hdtv',
      2: 'dvd',
      3: 'bluray',
    }[q] || 'hdtv'
  )
}

function mapEpisodeLinks(episode) {
  const links = {
    low: parseLinks(episode.lowLinks),
    medium: parseLinks(episode.mediumLinks),
    high: parseLinks(episode.highLinks),
    online: parseLinks(episode.onlineUrl),
  }

  return links
}

function parseLinks(str) {
  if (!str || typeof str !== 'string') {
    return []
  }

  return str.split(/\s+/).filter((s) => s && s.trim().startsWith('http'))
}
console.log(os.tmpdir())
async function tryToGetImage(image, params = {}) {
  if (!image) {
    return
  }

  const localImage = image.includes('/uploads/')
    ? image.slice(image.indexOf('/uploads/') + '/uploads/'.length)
    : image

  const { width, height } = params || {}
  const needsThumbnail = width || height

  const extension = path.extname(image)
  const fileName = path.basename(image, extension)
  const prefix = `migrated`
  const originalName = `${prefix}-${fileName}${extension}`
  const thumbnailName = `${prefix}-${fileName}-thumbnail${extension}`

  const exists = (file) =>
    fs
      .access(path.join(Env.get('IMAGE_STORAGE'), file))
      .then(() => true)
      .catch(() => false)
  const processed = (
    await Promise.all([originalName, thumbnailName].map(exists))
  ).every((x) => x)

  if (!processed) {
    const tempname = path.join(uploadsFolder, localImage)
    // console.log(image, tempname)

    let imageStream
    try {
      imageStream = await new Promise(async (resolve, reject) => {
        try {
          const file = await fs.readFile(tempname)
          resolve(file)
        } catch (err) {
          console.log('not found locally', image)
          request.get(image, async (err, res, body) => {
            if (err) {
              return reject(err)
            }
            let buffer
            try {
              buffer = await streamToBuffer(body)
            } catch (err) {
              return reject(err)
            }
            await fs.writeFile(tempname, buffer, { encoding: 'utf8' })
            resolve(buffer)
          })
        }
      })
    } catch (err) {
      return
    }

    const original = await jimp.read(imageStream)
    const thumbnail = original.clone()

    const thumnailDimensions = {
      width: width ? +width : jimp.AUTO,
      height: height ? +height : jimp.AUTO,
    }

    const tasks = [
      original
        .getBufferAsync(jimp.MIME_JPEG)
        .then((data) => Drive.put(originalName, data)),
    ]

    if (needsThumbnail) {
      tasks.push(
        thumbnail
          .resize(thumnailDimensions.width, thumnailDimensions.height)
          .getBufferAsync(jimp.MIME_JPEG)
          .then((data) => Drive.put(thumbnailName, data))
      )
    }

    await Promise.all(tasks)
  }

  return await Image.create({
    originalName,
    thumbnailName: needsThumbnail ? thumbnailName : null,
  })

  // c

  // return resolveOrTimeout(p, 30000)
  // .catch(() => false)
}

function resolveOrTimeout(p, time) {
  return new Promise((resolve) => {
    p.then(resolve)
    setTimeout(() => {
      resolve(false)
    }, time)
  })
}

async function streamToBuffer(stream) {
  const chunks = []
  for await (let chunk of stream) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

function chunks(xs, size) {
  const sectors = Math.ceil(xs.length / size)
  return Array.from({ length: sectors }, (_, i) =>
    xs.slice(i * size, size + i * size)
  )
}

module.exports = DatabaseSeeder
