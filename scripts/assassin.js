let _ = require('underscore');

// robot.brain.data.users
let participants = {
  U7ZEWDA2X: 'Amy',
  U3M7Y1KJS: 'Cat',
  U0P4WAAF4: 'Doug',
  U0P5HEP8B: 'Josh',
  U0P74QCQH: 'Matt',
  U7EEH7849: 'Matti',
  U0P5N1VSN: 'Shane',
  U3M8K91FZ: 'John'
};

let buildMessageFor = (targetType, userName) => {
  let message = "```\n" +
                "CONFIDENTIAL - FOR YOUR EYES ONLY\n" +
                "---------------------------------\n" +
                " Your " + targetType + " is: " + userName + "\n" +
                "```";

  return message;
};

module.exports = (robot) => {
  robot.respond(/give us a (.*)!/i, (res) => {
    let targetType = res.match[1];
    let userIds = _.shuffle(_.keys(participants));
    _.each(userIds, (assassinId, index) => {
      let targetIndex = index + 1;
      if (targetIndex >= userIds.length) {
        targetIndex = 0;
      }

      let targetId = userIds[targetIndex];
      let message = buildMessageFor(targetType, participants[targetId]);
      robot.messageRoom(assassinId, message);
    });
  });
};
