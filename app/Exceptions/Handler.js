'use strict'

const BaseExceptionHandler = use('BaseExceptionHandler')
const Logger = use('Logger')

/**
 * This class handles all exceptions thrown during
 * the HTTP request lifecycle.
 *
 * @class ExceptionHandler
 */
class ExceptionHandler extends BaseExceptionHandler {
  /**
   * Handle exception thrown during the HTTP lifecycle
   *
   * @method handle
   *
   * @param  {Object} error
   * @param  {Object} options.request
   * @param  {Object} options.response
   *
   * @return {void}
   */
  async handle(error, { request, response }) {
    response
      .status(error.status)
      .send(
        process.env.NODE_ENV === 'production' ? 'Internal error' : error.message
      )
  }

  /**
   * Report exception for logging or debugging.
   *
   * @method report
   *
   * @param  {Object} error
   * @param  {Object} options.request
   *
   * @return {void}
   */
  async report(error, { request }) {
    Logger.error(`Error at ${request.originalUrl()}`)
    Logger.error(error)
    Logger.error(error.stack)
  }
}

module.exports = ExceptionHandler
