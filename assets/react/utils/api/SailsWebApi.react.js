"use strict";
/*
 * This file is provided by Facebook for testing and evaluation purposes
 * only. Facebook reserves all rights not expressly granted.
 *
 *.
 */

// var io = require("./sails.io.js")();
var sailsIO = require("sails.io.js"),
    socketClient = require("socket.io-client");
var ServerActionCreator = require("../../actions/ServerActionsCreator");

var io = sailsIO(socketClient);

io.sails.url = 'http://bds.availabs.org'; // for API

module.exports = {
    init() {
        this.mapData("msa", ["job_creation", "job_destruction", "net_job_creation"]);
        this.mapData("st", ["job_creation", "job_destruction", "net_job_creation"]);
    },

    // type: msa or st
    mapData(type, fields) {
        let fStr = "?" + fields.map((row) => "fields=" + row).join("&");
        io.socket.get("/firm/" + type + "/yr" + fStr, (resData) => {
            // console.log(resData);
            ServerActionCreator.receiveMapData(type, resData);
        });
    }
};
