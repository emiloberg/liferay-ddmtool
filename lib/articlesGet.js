"use strict";


var articlesDownload = function () {

	var download							= require('./articlesDownload.js');

	download.articlesDownloadAllFromServer();
};

module.exports = articlesDownload;
