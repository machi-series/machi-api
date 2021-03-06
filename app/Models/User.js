'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

/** @type {import('@adonisjs/framework/src/Hash')} */
const Hash = use('Hash')

class User extends Model {
  static boot() {
    super.boot()
    this.addTrait('UtcDate')

    /**
     * A hook to hash the user password before saving
     * it to the database.
     */
    this.addHook('beforeSave', async (userInstance) => {
      if (userInstance.dirty.password) {
        userInstance.password = await Hash.make(userInstance.password)
      }
    })
  }

  static get hidden() {
    return ['password']
  }

  /**
   * A relationship on tokens is required for auth to
   * work. Since features like `refreshTokens` or
   * `rememberToken` will be saved inside the
   * tokens table.
   *
   * @method tokens
   *
   * @return {Object}
   */
  tokens() {
    return this.hasMany('App/Models/Token')
  }

  avatar() {
    return this.hasOne('App/Models/Image', 'avatarId', 'id')
  }

  authoredSeries() {
    return this.hasMany('App/Models/Series', 'id', 'authorId')
  }

  editingSeries() {
    return this.hasMany('App/Models/Series', 'id', 'editedById')
  }

  authoredEpisodes() {
    return this.hasMany('App/Models/Episode', 'id', 'authorId')
  }

  editingEpisodes() {
    return this.hasMany('App/Models/Episode', 'id', 'editedById')
  }
}

module.exports = User
