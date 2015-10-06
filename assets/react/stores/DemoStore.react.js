"use strict";
/**
 * This file is provided by Facebook for testing and evaluation purposes
 * only. Facebook reserves all rights not expressly granted.
 *
 */

var AppDispatcher = require("../dispatcher/AppDispatcher"),
    Constants = require("../constants/AppConstants"),
    EventEmitter = require("events").EventEmitter,
    assign = require("object-assign"),

    ActionTypes = Constants.ActionTypes,
    CHANGE_EVENT = "change";

var _mapData = {};


var demoStore = assign({}, EventEmitter.prototype, {

  emitChange() {
    // console.log("DEMOSTORE EMITTING EVENT");
    this.emit(CHANGE_EVENT);
  },

  /**
   * @param {function} callback
   */

  addChangeListener(callback) {
    this.on(CHANGE_EVENT, callback);
  },

  removeChangeListener(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  },

  getMapData(type) {
    // console.log("_mapData, type", _mapData, type)
    return _mapData[type];
  }
});

demoStore.dispatchToken = AppDispatcher.register(function(payload) {
  var action = payload.action;

  switch(action.type) {

    /*case ActionTypes.RECEIVE_ZIPCODES:
      _zipcodeList = action.zipcodes.data;
      demoStore.emitChange();
    break;
    */
    case ActionTypes.RECEIVE_MAP_DATA:
        _mapData[action.geoType] = action.mapData;
        // console.log("received mapdata!", action.geoType, action.mapData); // work
        demoStore.emitChange();
    break;

    default:
      // do nothing
  }

});

module.exports = demoStore;
