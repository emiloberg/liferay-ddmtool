"use strict";

var parseString 					= require('xml2js').parseString;
var clc								= require('cli-color');
var Q           					= require('q');

var Constants                       = require('./Constants.js');
var Config							= require('./Config.js');
var lrException                     = require('./errorException.js');


var utilities = {
	filenameAndPathToPath: function (path) {
		path = path.substr(0, path.lastIndexOf('/'));
		return path;
	},
    filenameAndPathToFilename: function (path, showExtension) {
        showExtension = typeof showExtension !== 'undefined' ? showExtension : false;
        path = path.substr(path.lastIndexOf('/')+1);
        if (!showExtension && path.indexOf('.') > 0) {
            path = path.substr(0, path.lastIndexOf('.'));
        }
        return path;
    },
    filenameToLanguageType: function (filename) {
        if (filename.indexOf('.') > 0) {
            var languageType = filename.substr(filename.indexOf('.')+1).toLowerCase();
            if (languageType === 'ftl') {
                return 'ftl';
            } else if (languageType === 'vm') {
                return 'vm';
			} else if (languageType === 'xml') {
				return 'xml';
            } else {
                lrException('Could not extract Language Type from filename \'' + filename + '\'');
            }
        } else {
            lrException('Could not extract Language Type from filename \'' + filename + '\'');
        }
    },
    writeToScreen: function (str, severity, type) {

		var outStr = '';
		var printSeverity = 0;

		if (str === '-') {
			str = '\n--------------------------------------------------------------------------------\n';
		}

		if (Config.fetch('logMode') === 'sparse') {
			printSeverity = 1;
		}


        if (severity >= printSeverity) {
            if (type == Constants.fetch('SCREEN_PRINT_INFO')) {
                outStr = str;
            } else if (type == Constants.fetch('SCREEN_PRINT_SAVE')) {
                outStr = clc.green(str);
            } else if (type == Constants.fetch('SCREEN_PRINT_HEADING')) {
                outStr = clc.blue(str);
            } else if (type == Constants.fetch('SCREEN_PRINT_FILE')) {
                outStr = clc.yellow(str);
            } else if (type == Constants.fetch('SCREEN_PRINT_ERROR')) {
                outStr = clc.red(str);
            } else {
                outStr = str;
            }

			if (Config.fetch('logTimestamp')) {
				var currentdate = new Date();
				var timestamp = "[" +
					currentdate.getFullYear() + '-' +
					utilities.padLeft((currentdate.getMonth()+1), 2) + '-' +
					utilities.padLeft(currentdate.getDate(), 2) + " " +
					utilities.padLeft(currentdate.getHours(), 2) + ":" +
					utilities.padLeft(currentdate.getMinutes(), 2) + ":" +
					utilities.padLeft(currentdate.getSeconds(), 2) +
					"] ";

				outStr = timestamp + outStr;
			}

			console.log(outStr);
        }
    },
	padLeft: function (str, width, padCharacter) {
		padCharacter = padCharacter || '0';
		str = str + '';
		return str.length >= width ? str : new Array(width - str.length + 1).join(padCharacter) + str;
	},
	pad: function (str, len, dir, pad) {
		if (typeof(len) == "undefined") { len = 0; }
		if (typeof(pad) == "undefined") { pad = ' '; }
		if (typeof(dir) == "undefined") { dir = 'right'; }
		str = '' + str;

		if (len + 1 >= str.length) {

			switch (dir){

				case 'left':
					str = new Array(len + 1 - str.length).join(pad) + str;
					break;
				default:
					str = str + new Array(len + 1 - str.length).join(pad);
					break;
			}
		}

		return str;

	},
    strToJsonMap: function (str) {
        var ret = {};
        str = str.trim();
        if (str.length > 0) {
            ret[Config.fetch('defaultLocale')] = str;
        } else {
            ret = {};
        }
        return ret;
    },
    xmlMapToObj: function (xml, type){
        var deferred = Q.defer();
        if (xml.length > 0) {
            parseString(xml, function (err, result) {
                if (err) {
                    lrException('Could not parse XML for ' + type);
                }

                var out = {};
                var prop = '';
                var val = '';

                if(result.root[type] === undefined) {
                    deferred.resolve(null);
                } else {
                    for (var i = 0; i < result.root[type].length; i++) {
                        val = result.root[type][i]._;
                        val = val.replace(/[^a-zA-Z0-9 \.-]/g, "");
                        prop = result.root[type][i].$['language-id'];
                        out[prop] = val;
                    }
                    deferred.resolve(out);
                }
            });
        } else {
            deferred.resolve(null);
        }
        return deferred.promise;
    },
	removeTrailingSlash: function (str) {
		if (str.charAt(str.length - 1) == "/") str = str.substr(0, str.length - 1);
		return str;
	},
	isJson: function (text) {
		if (/^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, '@').
			replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
			replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
			return true;
		}else{
			return false;
		}
	},
	stringifyNumber: function (n) {
		var special = ['zeroth','first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelvth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth'];
		var deca = ['twent', 'thirt', 'fourt', 'fift', 'sixt', 'sevent', 'eight', 'ninet'];
		if (n < 20) return special[n];
		if (n%10 === 0) return deca[Math.floor(n/10)-2] + 'ieth';
		return deca[Math.floor(n/10)-2] + 'y-' + special[n%10];
	},
	getUserHome: function() {
		return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
	}

};

module.exports = utilities;