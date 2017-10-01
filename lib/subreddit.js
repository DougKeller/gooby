var http = require('./http.js');
var _ = require('underscore');

class Post {
  constructor(data) {
    _.extend(this, data);
  }

  getUrl() {
    return this.url
  }
}

class Subreddit {
  constructor(name) {
    this.name = name;
  }

  uri() {
    return `https://www.reddit.com/r/${this.name}`;
  }

  queryTop(options) {
    options = _.defaults(options || {}, {
      sort: 'top',
      t: 'all',
      count: 0
    });

    let fullUrl = `${this.uri()}/top.json?sort=${options.sort}&t=${options.t}&count=${options.count}`;
    return http.get(fullUrl).then((response) => {
      let posts = response.data.children
      let nonStickiedPosts = _.reject(posts, post => post.data.stickied || !post.data.url);
      this.posts = _.map(nonStickiedPosts, post => new Post(post.data));
      return this.posts;
    });
  }

  getRandomPost() {
    let counts = [0, 25, 50, 75];
    let options = { count: _.sample(counts) }
    return this.queryTop(options).then((posts) => {
      return _.sample(posts);
    });
  }
}

module.exports = Subreddit;
