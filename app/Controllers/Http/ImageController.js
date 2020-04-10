'use strict'

const Image = use('App/Models/Image')
const Drive = use('Drive')
const path = require('path')
const jimp = require('jimp')
const imagemin = require('imagemin')
const imageminJpegtran = require('imagemin-jpegtran')

class ImageController {
  async show({ params }) {
    return Drive.get(params.name)
  }

  async upload({ request, response }) {
    const { width, height } = request.get()

    const needsThumbnail = width || height

    await request.multipart.file('image', {}, async (file) => {
      const extension = path.extname(file.clientName)
      const fileName = path.basename(file.clientName, extension)
      const time = new Date().getTime()
      const originalName = `${time}-${fileName}.jpg`
      const thumbnailName = `${time}-${fileName}-thumbnail.jpg`

      const original = await jimp.read(await streamToBuffer(file.stream))
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
            .quality(75)
            .getBufferAsync(jimp.MIME_JPEG)
            .then((buffer) =>
              imagemin.buffer(buffer, {
                plugins: [imageminJpegtran({ progressive: true })],
              })
            )
            .then((data) => Drive.put(thumbnailName, data))
        )
      }

      await Promise.all(tasks)

      response.json(
        await Image.create({
          originalName,
          thumbnailName: needsThumbnail ? thumbnailName : null,
        })
      )
    })

    await request.multipart.process()
  }
}

module.exports = ImageController

async function streamToBuffer(stream) {
  const chunks = []
  for await (let chunk of stream) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}
