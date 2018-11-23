let _ = require('underscore');
let WebClient = require('@slack/client').WebClient;

let robot;

const USERS = 'users';

let valid = {
  'ashley': ['josh', 'matt_damon', 'shane'],
  'savannah.altman': ['aekoh3', 'caaaaat', 'dkeller', 'josh', 'thebeef'],
  'logeybear': ['dkeller', 'josh', 'matt_damon', 'rayoken', 'shane'],
  'mchrism2': ['aekoh3', 'caaaaat', 'dkeller', 'josh', 'shane', 'thebeef'],
  'sonofputin': ['caaaaat', 'dkeller', 'josh', 'matt_damon', 'rayoken', 'shane', 'thebeef'],
  'aekoh3': ['caaaaat', 'dkeller', 'matt_damon', 'mchrism2', 'rayoken', 'savannah.altman', 'shane', 'thebeef'],
  'rayoken': ['aekoh3', 'caaaaat', 'dkeller', 'josh', 'logeybear', 'matt_damon', 'shane', 'sonofputin', 'thebeef'],
  'matt_damon': ['aekoh3', 'ashley', 'caaaaat', 'dkeller', 'josh', 'logeybear', 'rayoken', 'shane', 'sonofputin', 'thebeef'],
  'dkeller': ['aekoh3', 'josh', 'logeybear', 'matt_damon', 'mchrism2', 'rayoken', 'savannah.altman', 'shane', 'sonofputin', 'thebeef'],
  'caaaaat': ['aekoh3', 'josh', 'logeybear', 'matt_damon', 'mchrism2', 'rayoken', 'savannah.altman', 'shane', 'sonofputin', 'thebeef'],
  'josh': ['ashley', 'caaaaat', 'dkeller', 'logeybear', 'matt_damon', 'mchrism2', 'rayoken', 'savannah.altman', 'shane', 'sonofputin', 'thebeef'],
  'thebeef': ['aekoh3', 'caaaaat', 'dkeller', 'josh', 'logeybear', 'matt_damon', 'mchrism2', 'rayoken', 'savannah.altman', 'shane', 'sonofputin'],
  'shane': ['aekoh3', 'ashley', 'caaaaat', 'dkeller', 'josh', 'logeybear', 'matt_damon', 'mchrism2', 'rayoken', 'sonofputin', 'thebeef']
}

let invalid = {};
_.each(_.keys(valid), (name) => {
  invalid[name] = _.without(_.keys(valid), name, ...valid[name]).sort();;
});

let getMatch = (names, index) => {
  if (index >= names.length) {
    index = index % names.length;
  }

  return names[index];
};

let isValid = (santa, match) => santa !== match && _.contains(valid[santa], match);

let getMatches = () => {
  let names = _.keys(valid);

  let matches = {};
  let counts = {};

  for (var i = 0; i < names.length; i += 1) {
    let santa = names[i];

    let currentMatches = [];
    let numberOfMatches = 2;
    let validNames = valid[santa];
    validNames = _.reject(validNames, (match) => counts[match] >= numberOfMatches);

    if (validNames.length < numberOfMatches) {
      return getMatches();
    }

    let randomNames = _.take(_.shuffle(validNames), numberOfMatches);
    if (_.some(randomNames, (match) => !isValid(santa, match))) {
      return getMatches();
    }

    matches[santa] = randomNames.sort();
    counts = _.countBy(_.flatten(_.values(matches)), _.identity);

  }

  return matches;
};

let loadUsers = (response) => {
  let client = new WebClient(process.env.HUBOT_SLACK_TOKEN);

  client.users.list().then((response) => {
    let userData = response.members;
    userData = _.reject(userData, (m) => m.deleted);
    userData = _.reject(userData, (m) => m.is_bot);
    let users = _.map(userData, (user) => {
      return {
        id: user.id,
        username: user.name,
        name: user.real_name
      };
    });

    robot.brain.set(USERS, users);
  }, () => console.log('Failed to fetch users.'));
};

let userFor = (username) => {
  if (username === 'ashley') {
    return userFor('thebeef');
  }

  return _.find(robot.brain.get(USERS), (user) => user.username === username);
};

module.exports = (r) => {
  robot = r;

  loadUsers();

  robot.hear(/secret santa send/i, (res) => {
    let matches = getMatches();

    _.each(matches, (matches, santa) => {
      let santaUser = userFor(santa);
      let matchUsers = _.map(matches, (match) => userFor(match));

      let message = '';
      message += `:christmas_tree::santa::christmas_tree: Secret Santa 2k18 :christmas_tree::santa::christmas_tree:\n\n`;

      let santaName = santa === 'ashley' ? 'Ashley' : santaUser.name;
      let matchNames = _.map(matches, (match, index) => match === 'ashley' ? '*Ashley*' : `*${matchUsers[index].name}*`);
      message += `*${santaName}*, you are ${matchNames.join(' and ')}'s secret santa!\n`;
      message += 'Gifts should be around *$25* each.\n';

      message += 'A date hasn\'t been decided yet, but we will probably exchange gifts around the 15th. So try to have your gift ready by then!\n\n';

      if (_.contains(matches, 'aekoh3')) {
        message += '_Because Amy lives in New York, your gift will need to be shipped to her. Josh will pay for the shipping - just talk to him to get that organized._\n';
      }

      if (santa === 'dkeller') {
        robot.messageRoom(santaUser.id, 'test');
      }
    });
  });
};
