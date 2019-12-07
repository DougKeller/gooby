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

let isValid = (santa, match) => santa !== match;

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
    let numberOfMatches = 2;
    let validNames = valid[santa];
    validNames = _.reject(validNames, (match) => counts[match] >= numberOfMatches);

    if (validNames.length < numberOfMatches) {
      return getMatches();
    }

    let matches = _.take(_.shuffle(validNames), numberOfMatches).sort();
    let bothMatchesAreSameCouple = _.some(couples, (couple) => _.intersection(couple, matches).length === 2);
    if (bothMatchesAreSameCouple) {
      return getMatches();
    }

    if (_.some(matches, (match) => !isValid(santa, match))) {
      return getMatches();
    }

    mappings[santa] = matches;

    let bothSantasAreSameCouple = (match) => {
      let santas = santasFor(match, mappings);
      if (santas.length < 2) {
        return false;
      }

      return _.some(couples, (couple) => _.some(couples, (couple) => _.intersection(couple, santas).length === 2));
    };

    if (_.some(matches, bothSantasAreSameCouple)) {
      return getMatches();
    }

    let totalNumberOfCircles = 0;
    _.each(_.keys(valid), (santa) => {
      let matches = mappings[santa] || [];
      _.each(matches, (match) => {
        let mappingB = mappings[match] || [];
        if (_.contains(mappingB, santa)) {
          totalNumberOfCircles += 1;
        }
      });
    });

    if (totalNumberOfCircles > _.keys(valid).length * 0.35) {
      return getMatches();
    }

    if (_.all(matches, (match) => _.contains(mappings[match], santa))) {
      return getMatches();
    }

    counts = _.countBy(_.flatten(_.values(mappings)), _.identity);
  }

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
