https = require 'https'

base_url = "https://api.scryfall.com/cards/search?order=set&q="

get_summary = (card, summaries) ->
  summary = "*#{card.name}* (#{card.set.toUpperCase()})"
  summary += " - _$#{card.usd}_" if card.usd
  return summary

get_image_uris = (card) ->
  image_uris = []

  add_image_uri = (obj) ->
    image_uris.unshift obj.image_uris.normal

  if card.card_faces
    add_image_uri(card_face) for card_face in card.card_faces.reverse()
  else
    add_image_uri(card)

  return image_uris

find_all = (card_names, callback) ->
  card_name = card_names.pop()
  encoded_name = encodeURIComponent card_name
  url = base_url + encoded_name

  https.get url, (request) ->
    full_data = ""
    request.on 'data', (data) ->
      full_data += data

    request.on 'end', () ->
      response = JSON.parse full_data

      if response.data
        card =  response.data[0]
        summary = get_summary(card)
        image_uris = get_image_uris(card)
      else
        summary = "No card found for \"#{card_name}\"."
        image_uris = []

      if card_names.length > 0
        find_all card_names, (uris, summaries) ->
          uris = uris.concat(image_uris)
          summaries.push(summary)
          callback(uris, summaries)
      else
        callback(image_uris, [summary])

card_name_regex = /\[\[([^\[\]]+)\]\]/
parse_card_name = (card_name) ->
  return card_name.match(card_name_regex)[1]

all_cards_matcher = /\[\[[^\[\]]+\]\]/g
module.exports = (robot) ->
  robot.hear all_cards_matcher, (request) ->
    card_names = request.match.map parse_card_name

    find_all card_names, (uris, summaries) ->
      all_uris = uris.join('\n')
      all_summaries = summaries.join('\n')

      prices_only = /^price/i.test request.message.rawText
      if prices_only
        request.send all_summaries
      else
        request.send "#{all_uris}\n\n#{all_summaries}"
