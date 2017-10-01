# Description:
#   Check out the top posts on /r/aww
#
# Commands:
#   hubot awww - Check out the top posts on /r/aww
#
# Author:
#   DougKeller

_ = require('underscore')
Subreddit = require('../lib/subreddit.js');
CronJob = require('cron').CronJob

subreddit_names = ['aww', 'rabbits', 'foxes', 'rarepuppers', 'pigs', 'cats', 'batty', 'corgigifs']
counts = [0, 25, 50, 75]


get_random_subreddit = () ->
  subreddit_name = _.sample subreddit_names
  subreddit = new Subreddit(subreddit_name)

get_random_post = (callback) ->
  subreddit = get_random_subreddit()

  on_success = (post) ->
    callback("#{post.url}\n*#{post.title}*")

  on_failure = (error) ->
    console.log error

  subreddit.getRandomPost().then(on_success, on_failure)

set_up_cron_job = (robot) ->
  job_callback = () ->
    get_random_post (url) ->
      robot.messageRoom 'awww', url

  every_weekday_at_7_am = '00 00 7 * * 1-5'
  every_weekend_at_10_am = '00 00 10 * * 0,6'

  intervals = [
    every_weekday_at_7_am,
    every_weekend_at_10_am
  ]

  schedule_job = (crontab) ->
    job = new CronJob(crontab, job_callback)
    job.start()

  _.each(intervals, schedule_job)

module.exports = (robot) ->
  set_up_cron_job(robot)

  robot.respond /aw{2,}/i, (msg) ->
    get_random_post (url) ->
      msg.send url
