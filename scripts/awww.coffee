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

subreddits = ['aww', 'rabbits', 'foxes', 'rarepuppers', 'pigs', 'cats', 'batty', 'corgigifs']
counts = [0, 25, 50, 75]

get_random_subreddit_url = () ->
  uri = 'https://www.reddit.com/r/'
  subreddit = _.sample subreddits
  count = _.sample counts
  uri += "#{subreddit}/top/.json?sort=top&t=all&count=#{count}"
  uri

get_image_uri = (posts) ->
  posts = _.reject posts, (post) ->
    post.data.stickied

  post = _.sample posts
  "https://reddit.com#{post.data.permalink}"


module.exports = (robot) ->
  robot.respond /aw{2,}/i, (msg) ->
    uri = get_random_subreddit_url()

    on_success = (response) ->
      posts = response.data.children
      uri = get_image_uri posts
      msg.send uri

    on_failure = (error) ->
      console.log(error)

    http.get(uri).then on_success, on_failure
