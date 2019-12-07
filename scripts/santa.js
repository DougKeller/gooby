let _ = require('underscore');
let WebClient = require('@slack/client').WebClient;

let robot;

const USERS = 'users';

const PARTICIPANTS = [
  'dkeller',
  'josh',
  'matt_damon',
  'caaaaat',
  'thebeef',
  'rayoken',
  'logeybear',
  'aekoh3',
  'jakethompy',
  'a.mcknight1810'
];
const MATCHES_PER_SANTA = 2;

let couples = [
  ['a.mcknight1810', 'thebeef'],
  ['savannah.altman', 'sonofputin'],
  ['dkeller', 'caaaaat'],
  ['josh', 'aekoh3'],
  ['mmolexa919', 'mcolclough5']
];
let significantOthers = {};
_.each(couples, (couple) => {
  significantOthers[couple[0]] = couple[1];
  significantOthers[couple[1]] = couple[0];
});

let getMatch = (names, index) => {
  if (index >= names.length) {
    index = index % names.length;
  }

  return names[index];
};

let isValid = (santa, match) => {
  if (santa === match) {
    return false;
  }

  let isSameCouple = significantOthers[santa] === match;
  if (isSameCouple) {
    return false;
  }

  return true;
};

let santasFor = (match, matches) => {
  let santas = [];

  _.each(matches, (names, santa) => {
    if (_.contains(names, match)) {
      santas.push(santa);
    }
  });

  return santas;
};

let getTotalCyclicalMatches = (mappings) => {
  let totalNumberOfCircles = 0;

  _.each(mappings, (matches, santa) => {
    _.each(matches, (match) => {
      if (_.contains(mappings[match] || [], santa)) {
        totalNumberOfCircles += 1;
      }
    });
  });

  return totalNumberOfCircles;
};

let getMatches = () => {
  while (true) {
    let mappings = {};
    let counts = {};

    for (santa in PARTICIPANTS) {
      let validNames = _.select(PARTICIPANTS, (match) => {
        return isValid(santa, match) && (counts[match] || 0) < MATCHES_PER_SANTA;
      });

      if (validNames.length < MATCHES_PER_SANTA) {
        continue;
      }

      let matches = _.take(_.shuffle(validNames), MATCHES_PER_SANTA).sort();

      let matchesAreSameCouple = significantOthers[matches[0]] === matches[1];
      if (matchesAreSameCouple) {
        continue;
      }

      mappings[santa] = matches;

      let allMatchesAreAlsoGiftingSanta = _.all(matches, (match) => _.contains(mappings[match], santa));
      if (allMatchesAreAlsoGiftingSanta) {
        continue;
      }

      counts = _.countBy(_.flatten(_.values(mappings)), _.identity);
    }

    if (getTotalCyclicalMatches(mappings) > PARTICIPANTS.length * 0.35) {
      continue;
    }

    console.log(counts);

    return mappings;
  }
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

    PARTICIPANTS.forEach((participant) => {
      if (!_.some(users, u => u.username === participant)) {
        throw `Invalid user: ${participant}`;
      }
    });

    robot.brain.set(USERS, users);
  }, () => console.log('Failed to fetch users.'));
};

let userFor = (username) => {
  return _.find(robot.brain.get(USERS), (user) => user.username === username);
};

module.exports = (r) => {
  robot = r;

  loadUsers();

  robot.respond(/secret santa send/i, (res) => {
    let matches = getMatches();
    console.log(matches);

    // _.each(matches, (matches, santa) => {
    //   let santaUser = userFor(santa);
    //   let matchUsers = _.map(matches, (match) => userFor(match));

    //   let message = '';
    //   message += `:christmas_tree::santa::christmas_tree: Secret Santa 2019 :christmas_tree::santa::christmas_tree:\n\n`;

    //   let santaName = santaUser.name;
    //   let matchNames = _.map(matches, (match, index) => `*${matchUsers[index].name}*`);
    //   message += `*${santaName}*, you are ${matchNames.join(' and ')}'s secret santa!\n`;
    //   message += 'Gifts should be around *$25* each.\n';

    //   message += 'We will probably exchange gifts around the 20th. So try to have your gift ready by then!\n\n';

    //   robot.messageRoom(santaUser.id, message);
    // });
  });
};
