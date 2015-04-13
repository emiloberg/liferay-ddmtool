"use strict";

var Q								= require('q');
var fs								= require('fs-extra');

var utilities	                    = require('./utilities.js');
var Constants                       = require('./Constants.js');
var cache	                    	= require('./cache.js');
var getData							= require('./getData.js');
var Sites							= require('./Sites.js');
var Config							= require('./Config.js');
var Templates						= require('./Templates.js');
var Structures						= require('./Structures.js');
var ArticlesJournalFolders			= require('./articlesJournalFolders.js');
var Articles						= require('./articlesArticles.js');


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

	/*
	 * Removes all _folders_ (and subsequent files) inside the article folder.
	 * By keeping the files (in the root of the article folder) we may
	 * create a README.md or such
	 *
	 * Also keep .-files (to be able to add the folder to git, which will add a
	 * ".git" folder)
	 * */
	clearArticlesFolder: function () {
		var deferred = Q.defer();
		fs.readdir(Config.fetch('articlesFolderFullPath'), function(err, files) {
			if (err) {
				deferred.resolve();
				return deferred.promise;
			}
			files.forEach(function (slug) {
				if (slug.substr(0, 1) !== '.') {
					var currentPath = Config.fetch('articlesFolderFullPath') + '/' + slug;
					var stat = fs.statSync(currentPath);
					if (stat.isDirectory()) {
						fs.removeSync(currentPath);
					}
				}
			});
			deferred.resolve();
		});
		return deferred.promise;
	},

	getArticleFolders: function () {
		utilities.writeToScreen('Downloading journal article folders', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));
		var deferred = Q.defer();
		ArticlesJournalFolders.truncate();
		
		var payload = Sites.getListOfGroupIds().map(function (groupId) {
			return '{"/journalfolder/get-folders": {"groupId": ' + groupId + '}}';
		});
		
		getData('[' + payload.join() + ']').then(function (group) {
			group.forEach(function (folders) {
				folders.forEach(function (folder) {
					ArticlesJournalFolders.add(folder);
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
			var foldersPayload = ArticlesJournalFolders.getListOfFolderIdsByGroupId(groupId).map(function (folderId) {
				return '{"/journalarticle/get-articles": {"groupId": ' + groupId + ', "folderId": ' + folderId + '}}';
			});
			foldersPayload.push('{"/journalarticle/get-articles": {"groupId": ' + groupId + ', "folderId": 0}}');
			return foldersPayload.join();
		});

		getData('[' + payload.join() + ']').then(function (group) {
			group.forEach(function (folder) {
				folder.forEach(function (article) {
					// Adding data about the structure and template to the article object
					// so that we can match that when uploading

					// These functions are called looking for 'structureKey' = 'article.structureId'. This is correct!
					// Liferay responds with templateId which in fact is the templateKey.
					article.ddmToolStructureNameCurrentValue = Structures.getSingleValue('structureKey', article.structureId, 'nameCurrentValue');
					article.ddmToolTemplateNameCurrentValue = Templates.getSingleValue('templateKey', article.templateId, 'nameCurrentValue');
					Articles.add(article);
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
			folderSlug = ArticlesJournalFolders.getSingleValue('folderId', folderId, 'name') + '/' + folderSlug;
			var parentFolderId = ArticlesJournalFolders.getSingleValue('folderId', folderId, 'parentFolderId');
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
