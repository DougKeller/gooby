let _ = require('underscore');
let WebClient = require('@slack/client').WebClient;

let robot;

const USERS = 'users';

let valid = {
  'ashley': ['josh', 'matt_damon', 'shane'],
  'logeybear': ['dkeller', 'josh', 'matt_damon', 'rayoken', 'shane'],
  'savannah.altman': ['aekoh3', 'caaaaat', 'dkeller', 'josh', 'thebeef'],
  'mchrism2': ['aekoh3', 'caaaaat', 'dkeller', 'josh', 'shane', 'thebeef'],
  'sonofputin': ['caaaaat', 'dkeller', 'josh', 'matt_damon', 'rayoken', 'shane', 'thebeef'],
  'mmolexa919': ['sonofputin', 'dkeller', 'caaaaat', 'josh', 'thebeef', 'shane', 'matt_damon'],
  'mcolclough5': ['sonofputin', 'dkeller', 'caaaaat', 'josh', 'thebeef', 'shane', 'matt_damon'],
  'aekoh3': ['caaaaat', 'dkeller', 'matt_damon', 'mchrism2', 'rayoken', 'savannah.altman', 'shane', 'thebeef'],
  'rayoken': ['aekoh3', 'caaaaat', 'dkeller', 'josh', 'logeybear', 'matt_damon', 'shane', 'sonofputin', 'thebeef'],
  'matt_damon': ['aekoh3', 'ashley', 'caaaaat', 'dkeller', 'josh', 'logeybear', 'rayoken', 'shane', 'sonofputin', 'thebeef'],
  'shane': ['aekoh3', 'ashley', 'caaaaat', 'dkeller', 'josh', 'logeybear', 'matt_damon', 'mchrism2', 'rayoken', 'sonofputin', 'thebeef'],
  'dkeller': ['aekoh3', 'josh', 'logeybear', 'matt_damon', 'mchrism2', 'rayoken', 'savannah.altman', 'shane', 'sonofputin', 'thebeef', 'mmolexa919', 'mcolclough5'],
  'caaaaat': ['aekoh3', 'josh', 'logeybear', 'matt_damon', 'mchrism2', 'rayoken', 'savannah.altman', 'shane', 'sonofputin', 'thebeef', 'mmolexa919', 'mcolclough5'],
  'josh': ['ashley', 'caaaaat', 'dkeller', 'logeybear', 'matt_damon', 'mchrism2', 'rayoken', 'savannah.altman', 'shane', 'sonofputin', 'thebeef', 'mmolexa919', 'mcolclough5'],
  'thebeef': ['aekoh3', 'caaaaat', 'dkeller', 'josh', 'logeybear', 'matt_damon', 'mchrism2', 'rayoken', 'savannah.altman', 'shane', 'sonofputin', 'mmolexa919', 'mcolclough5']
}

let couples = [
  ['ashley', 'thebeef'],
  ['savannah.altman', 'sonofputin'],
  ['mchrism2', 'matt_damon'],
  ['dkeller', 'caaaaat'],
  ['josh', 'aekoh3'],
  ['mmolexa919', 'mcolclough5']
];

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
  let names = _.keys(valid);

  let mappings = {};
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

  // robot.hear(/secret santa send/i, (res) => {
  //   let matches = getMatches();

  //   _.each(matches, (matches, santa) => {
  //     let santaUser = userFor(santa);
  //     let matchUsers = _.map(matches, (match) => userFor(match));

  //     let message = '';
  //     message += `:christmas_tree::santa::christmas_tree: THIS IS THE REAL ONE!!!! IGNORE THE OTHERS :christmas_tree::santa::christmas_tree:\n\n`;

  //     let santaName = santa === 'ashley' ? 'Ashley' : santaUser.name;
  //     let matchNames = _.map(matches, (match, index) => match === 'ashley' ? '*Ashley*' : `*${matchUsers[index].name}*`);
  //     message += `*${santaName}*, you are ${matchNames.join(' and ')}'s secret santa!\n`;
  //     message += 'Gifts should be around *$25* each.\n';

  //     message += 'A date hasn\'t been decided yet, but we will probably exchange gifts around the 15th. So try to have your gift ready by then!\n\n';

  //     if (_.contains(matches, 'aekoh3')) {
  //       message += '_Because Amy lives in New York, your gift will need to be shipped to her. Josh will pay for the shipping - just talk to him to get that organized._\n';
  //     }

  //     robot.messageRoom(santaUser.id, message);
  //   });
  // });
};
