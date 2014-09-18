"use strict";

var parseString = require('xml2js').parseString;
var clc			= require('cli-color');
var Q           = require('q');

var Constants                       = require('./SingleConstants.js');
var Config							= require('./SingleConfig.js');

var lrException                     = require('./error-exception.js');


var utilities = {
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

		if (str === '-') {
			str = '\n--------------------------------------------------------------------------------\n';
		}

        if (severity >= Constants.fetch('debugLevel')) {
            if (type == Constants.fetch('SCREEN_PRINT_INFO')) {
                console.log(str);
            } else if (type == Constants.fetch('SCREEN_PRINT_SAVE')) {
                console.log(clc.green(str));
            } else if (type == Constants.fetch('SCREEN_PRINT_HEADING')) {
                console.log(clc.blue(str));
            } else if (type == Constants.fetch('SCREEN_PRINT_FILE')) {
                console.log(clc.yellow(str));
            } else if (type == Constants.fetch('SCREEN_PRINT_ERROR')) {
                console.log(clc.red(str));
            } else {
                console.log(str);
            }
        }
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
                        val = result.root[type][i]['_'];
                        val = val.replace(/[^a-zA-Z0-9 \.-]/g, "");
                        prop = result.root[type][i]['$']['language-id'];
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
	}
};

module.exports = utilities;