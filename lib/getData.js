"use strict";

var request							= require('superagent');
var Q								= require('q');
var clc								= require('cli-color');
var _								= require('underscore');
var cli								= require('cli');

var Constants                       = require('./Constants.js');
var Config							= require('./Config.js');
var utilities	                    = require('./utilities.js');


var getData = function (api, showSpinner, lrHost, lrUser, lrPass){

	var deferred = Q.defer();
	var errStr;

	showSpinner = typeof showSpinner !== 'undefined' ? showSpinner : true;
	lrHost = typeof lrHost !== 'undefined' ? lrHost : Config.fetch('host');
	lrUser = typeof lrUser !== 'undefined' ? lrUser : Config.fetch('username');
	lrPass = typeof lrPass !== 'undefined' ? lrPass : Config.fetch('password');

	lrHost = lrHost + Constants.fetch('apiPath');

	if (showSpinner) {
		cli.spinner(clc.blue('Working...'));
	}

	utilities.writeToScreen('Requesting data (from server ' + lrHost + '):\n' + api , Constants.fetch('SEVERITY_DEBUG'), Constants.fetch('SCREEN_PRINT_INFO'));

	request
		.post(lrHost)
		.set('Content-Type', 'application/json')
		.auth(lrUser, lrPass)
		.send(api)
		.end(function(err, res){

			if (showSpinner) {
				cli.spinner('', true);
			}

			if (err) {
				if (err.code === 'ENOTFOUND') { errStr = 'Host not found'; }
				else if (err.code === 'ECONNREFUSED') { errStr = 'Connection refused'; }
				else if (err.code === 'EHOSTUNREACH') { errStr = 'No route to host'; }
				else { errStr = 'Unknown error: ' + JSON.stringify(err); }
				return deferred.reject(errStr);
			}

			if (res.ok) {
				if(utilities.isJson(res.text)) {
					if(res.body.hasOwnProperty('exception')){
						if(res.body.exception === 'Authenticated access required') {
							deferred.reject('Could not authenticate (check username/password)');
						} else {
							deferred.reject(res.body.exception);
						}

					} else {
						deferred.resolve(res.body);
					}
				} else {
					deferred.reject('Connected to server but response is not JSON');
				}
			} else {

				if(res.statusCode == '404') { errStr = '(Not Found)'; }
				else { errStr =''; }

				errStr = 'Error ' + res.statusCode + ' ' + errStr;

				deferred.reject(errStr);
			}
		});
	return deferred.promise;

};

module.exports = getData;