"use strict";

var constants   					= require('./SingleConstants.js');

var lrException = function (e) {


	var errStr = '';
    var errCode = "";
    if(typeof e === 'object') {
        try {
            errCode = e.code;
        } catch(thisErr) {;
            errStr = JSON.stringify(e);
        }
    } else {
        errStr = e;
    }

    if (errCode === 'ENOENT') {
		errStr = 'No such file or folder';
	} else {
		errStr = e;
	}

	var utilities = require('./utilities.js');
	utilities.writeToScreen('Error', constants.SEVERITY_NORMAL, constants.SCREEN_PRINT_ERROR);
	utilities.writeToScreen(errStr, constants.SEVERITY_NORMAL, constants.SCREEN_PRINT_ERROR);


    process.exit();
};

module.exports = lrException;