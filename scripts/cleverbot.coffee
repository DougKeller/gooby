Cleverbot = require('cleverbot-node')

module.exports = (robot) ->
  cleverbot = new Cleverbot
  cleverbot.configure(botapi: process.env.HUBOT_CLEVERBOT_API_KEY)

  robot.hear /hey gooby$/i, (msg) ->
    cleverbot.write('hey', (response) => msg.send(response.output))

  robot.hear /hey gooby (.*)/i, (msg) ->
    data = msg.match[1].trim() || 'hey'
    cleverbot.write(data, (response) => msg.send(response.output))
