module.exports = (robot) ->
  robot.respond /pls/, (res) ->
    res.send "no"

  robot.respond /am i (.*)/i, (res) ->
    res.send "no"
