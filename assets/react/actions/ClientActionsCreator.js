/**
 * This file is provided by Facebook for testing and evaluation purposes
 * only. Facebook reserves all rights not expressly granted.
 *
 */

var AppDispatcher = require('../dispatcher/AppDispatcher');
var Constants = require('../constants/AppConstants');
var ServerActionsCreator = require('./ServerActionsCreator');
var SailsWebApi = require('../utils/api/SailsWebApi');
var ActionTypes = Constants.ActionTypes;

module.exports = {

  /*setCurrentZipcode: function(data) {
    // console.log("Setting current zipcode to", data)
    AppDispatcher.handleViewAction({
      type: ActionTypes.SET_CURRENT_ZIPCODE,
      zipcode: data
    });
    SailsWebApi.updateZip(data);
  },
  setCurrentNaics: function(data) {
    // console.log("Setting current naics to ", data);
  	AppDispatcher.handleViewAction({
  		type:ActionTypes.SET_CURRENT_NAICS,
  		naics: data
  	});
  	SailsWebApi.updateNaics(data);
  },
  setCurrentVariable: function(data) {
    AppDispatcher.handleViewAction({
      type:ActionTypes.SET_CURRENT_VAR,
      variable: data
    });
  },
  setCurrentFips: function(type, code) {
    AppDispatcher.handleViewAction({
      type: ActionTypes.SET_CURRENT_FIPS,
      fipsType: type,
      code: code
    });
    SailsWebApi.updateFips(type, code);
  },
  initFips: function(type) {
    SailsWebApi.initFips(type);
  },
  initZip: function(type) {
    SailsWebApi.initZip();
  }*/

};
