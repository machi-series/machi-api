'use strict'

const { ServiceProvider } = require('@adonisjs/fold')

class ValidationFormatterProvider extends ServiceProvider {
  boot() {
    this.app.singleton('ValidationFormatter', () => {
      const Config = this.app.use('Adonis/Src/Config')
      return new (require('.'))(Config)
    })
  }
}

module.exports = ValidationFormatterProvider
