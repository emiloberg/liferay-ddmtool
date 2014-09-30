"use strict";

var clc								= require('cli-color');

var constants   					= require('./Constants.js');

var lrException = function (e) {

	var errStr = '';
    var errCode = "";
    if(typeof e === 'object') {
        try {
            errCode = e.code;
        } catch(thisErr) {
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
	


	console.log(clc.red('Error'));
	console.log(clc.red(errStr));
    process.exit();
};

module.exports = lrException;