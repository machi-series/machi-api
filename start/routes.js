'use strict'

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URLs and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')

const defaultCrudMiddlewares = new Map([
  [
    ['store', 'update'],
    ['auth', 'staff'],
  ],
  [['destroy'], ['auth', 'manager']],
])

Route.resource('series', 'SeriesController')
  .apiOnly()
  .middleware(defaultCrudMiddlewares)
Route.get('/series/:id/related', 'SeriesController.related')
Route.resource('tags', 'TagController')
  .apiOnly()
  .middleware(defaultCrudMiddlewares)
Route.resource('episodes', 'EpisodeController')
  .apiOnly()
  .middleware(defaultCrudMiddlewares)
Route.get('/links/:episodeId/:quality/:index', 'EpisodeController.requestLink')
Route.get('/links/:id', 'EpisodeController.retreiveLink')
Route.resource('users', 'UserController')
  .apiOnly()
  .middleware(
    new Map([
      [
        ['index', 'show', 'store', 'delete'],
        ['auth', 'admin'],
      ],
      [['update'], ['auth', 'staff']],
    ])
  )
Route.get('/images/:name', 'ImageController.show')
Route.post('/upload', 'ImageController.upload')

Route.get('me', 'UserController.me').middleware('auth')
Route.post('login', 'UserController.login').middleware('guest')
Route.post('forgot', 'UserController.forgot')
Route.get('recover', 'UserController.recover').middleware('auth')
Route.get('/site/sitemapData', 'SiteController.sitemapData')
