'use strict'

const Image = use('App/Models/Image')
const Drive = use('Drive')
const sharp = require('sharp')
const path = require('path')

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
      const originalName = `${time}-${fileName}${extension}`
      const thumbnailName = `${time}-${fileName}-thumbnail${extension}`

      const original = sharp(await streamToBuffer(file.stream))
      const thumbnail = original.clone()

      const thumnailDimensions = {
        width: width ? +width : undefined,
        height: height ? +height : undefined,
      }

      const tasks = [
        original
          .toFormat('jpeg')
          .toBuffer()
          .then((data) => Drive.put(originalName, data)),
      ]

      if (needsThumbnail) {
        tasks.push(
          thumbnail
            .resize(thumnailDimensions)
            .toFormat('jpeg')
            .toBuffer()
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
