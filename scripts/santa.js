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

  let isSameCouple = _.some(couples, c => _.contains(c, santa) && _.contains(c, match));
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

let getMatches = () => {
  let mappings = {};
  let counts = {};

  for (var i = 0; i < PARTICIPANTS.length; i += 1) {
    let santa = PARTICIPANTS[i];

    let currentMatches = [];
    let validNames = _.select(PARTICIPANTS, (match) => {
      return isValid(santa, match) && counts[match] < MATCHES_PER_SANTA;
    });

    if (validNames.length < MATCHES_PER_SANTA) {
      console.log('not enough valid matches');
      return getMatches();
    }

    let matches = _.take(_.shuffle(validNames), MATCHES_PER_SANTA).sort();
    if (_.some(matches, (match) => !isValid(santa, match))) {
      console.log('invalid match');
      return getMatches();
    }
    mappings[santa] = matches;

    let totalNumberOfCircles = 0;
    _.each(PARTICIPANTS, (santa) => {
      let matches = mappings[santa] || [];
      _.each(matches, (match) => {
        let mappingB = mappings[match] || [];
        if (_.contains(mappingB, santa)) {
          totalNumberOfCircles += 1;
        }
      });
    });

    if (totalNumberOfCircles > PARTICIPANTS.length * 0.35) {
      console.log('circles');
      return getMatches();
    }

    if (_.all(matches, (match) => _.contains(mappings[match], santa))) {
      console.log('contains self')
      return getMatches();
    }

    counts = _.countBy(_.flatten(_.values(mappings)), _.identity);
  }

  console.log(counts);

  return mappings;
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
