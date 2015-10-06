

var keyMirror = require('keymirror');

module.exports = {

  ActionTypes: keyMirror({
    
    RECEIVE_MAP_DATA: null

  }),

  PayloadSources: keyMirror({
    SERVER_ACTION: null,
    VIEW_ACTION: null
  })

};
