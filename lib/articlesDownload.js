"use strict";

var Q								= require('q');

var utilities	                    = require('./utilities.js');
var Constants                       = require('./Constants.js');
var cache	                    	= require('./cache.js');
var getData							= require('./getData.js');
var Sites							= require('./Sites.js');
var Config							= require('./Config.js');

var articlesFolders					= require('./articlesFolders.js');
var Articles						= require('./articlesArticles.js');
var fs								= require('fs-extra');

var download = {

	articlesDownloadAllFromServer: function () {

		utilities.writeToScreen('-', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));
		utilities.writeToScreen('Getting data from server', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));

		Q.resolve()
			.then(download.clearArticlesFolder)
			.then(download.getArticleFolders)
			.then(download.getArticles)
			.then(download.saveArticles)
			.then(function () {
				var router = require('./router.js');
				router(Constants.fetch('STEP_ARTICLES_JUST_DOWNLOADED'));
			});

	},
	
	clearArticlesFolder: function () {
		fs.removeSync(Config.fetch('articlesFolderFullPath'));
	},

	getArticleFolders: function () {
		utilities.writeToScreen('Downloading journal article folders', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));
		var deferred = Q.defer();
		articlesFolders.truncate();
		
		var payload = Sites.getListOfGroupIds().map(function (groupId) {
			return '{"/journalfolder/get-folders": {"groupId": ' + groupId + '}}';
		});
		
		getData('[' + payload.join() + ']').then(function (group) {
			group.forEach(function (folders) {
				folders.forEach(function (folder) {
					articlesFolders.add(folder);
				});
			});
			deferred.resolve();
		});

		return deferred.promise;

	},

	getArticles: function () {
		utilities.writeToScreen('Downloading articles', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));
		var deferred = Q.defer();

		// Create batched payload.
		var payload = Sites.getListOfGroupIds().map(function (groupId) {
			var foldersPayload = articlesFolders.getListOfFolderIdsByGroupId(groupId).map(function (folderId) {
				return '{"/journalarticle/get-articles": {"groupId": ' + groupId + ', "folderId": ' + folderId + '}}';
			});
			foldersPayload.push('{"/journalarticle/get-articles": {"groupId": ' + groupId + ', "folderId": 0}}');
			return foldersPayload.join();
		});
		
		getData('[' + payload.join() + ']').then(function (group) {
			group.forEach(function (folder) {
				folder.forEach(function (article) {
					Articles.add(article)
				});
			});

			deferred.resolve();
		});

		return deferred.promise;
	},

	getFullTreePath: function (startTreeSlug, folderId) {
		var folderSlug = startTreeSlug;
		if(folderId === 0) {
			return '/' + folderSlug;
		} else {
			folderSlug = articlesFolders.getSingleValue('folderId', folderId, 'name') + '/' + folderSlug;
			var parentFolderId = articlesFolders.getSingleValue('folderId', folderId, 'parentFolderId');
			return download.getFullTreePath(folderSlug, parentFolderId);
		}


	},

	saveArticlesToFile: function (rootPath) {
		utilities.writeToScreen('Saving articles', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));

		var numberOfArticles = 0;
		Articles.getAll().forEach(function (article, index) {

			var folderTreePath =  download.getFullTreePath('', article.folderId);
			var groupFriendlyUrl = Sites.getSingleValue('groupId', article.groupId, 'friendlyURL');
			var filePathAndName =  rootPath + groupFriendlyUrl + folderTreePath + article.articleId + '.json';

			fs.outputFileSync(filePathAndName, JSON.stringify(article));

			numberOfArticles = index;

		});

		utilities.writeToScreen(numberOfArticles + ' articles saved to ' + rootPath, Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_SAVE'));
	},

	saveArticles: function () {
		download.saveArticlesToFile(Config.fetch('articlesFolderFullPath'));
	}



};

module.exports = download;
