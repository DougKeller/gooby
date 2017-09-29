# Description:
#   Check out the top posts on /r/aww
#
# Commands:
#   hubot awww - Check out the top posts on /r/aww
#
# Author:
#   DougKeller

http = require('../lib/http.js')
_ = require('underscore')

get_image_uris = (posts, num_images) ->
  posts = _.reject posts, (post) ->
    post.data.stickied

  posts = _.first posts, num_images
  _.map posts, (post) ->
    "https://reddit.com#{post.data.permalink}"

module.exports = (robot) ->
  robot.respond /a(w*)/, (msg) ->
    uri = 'https://www.reddit.com/r/aww.json'
    num_images = Math.floor(msg.match[1].length / 2)
    num_images = 5 if num_images > 5

    on_success = (response) ->
      posts = response.data.children
      uris = get_image_uris posts, num_images
      msg.send uris.join('\n')

    on_failure = (error) ->
      console.log(error)

    http.get(uri).then on_success, on_failure
