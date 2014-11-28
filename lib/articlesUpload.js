"use strict";

var Q								= require('q');
//var _								= require('underscore');
//
var utilities	                    = require('./utilities.js');
var Constants                       = require('./Constants.js');
//var cache	                    	= require('./cache.js');
//var getData							= require('./getData.js');
var Sites							= require('./Sites.js');
var Config							= require('./Config.js');
//
//var articlesFolders					= require('./articlesFolders.js');
var ArticlesDownload				= require('./articlesDownload.js');
var articlesFolders					= require('./articlesFolders.js');
var fs								= require('fs-extra');

var glob 							= require("glob");
var lrException                     = require('./errorException.js');


var localGroupsFriendlyURL = {};
var serverGroupIds = [];
var localAllArticles = [];
var listOfArticleFiles = [];
var folderNameIdMapping = {};

var upload = {
	
	uploadAllArticles: function() {

		utilities.writeToScreen('-', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));
		utilities.writeToScreen('Mangling articles to prepare for upload', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));

		Q.resolve()
			.then(upload.getAllArticlePaths)
			.then(upload.checkArticleGroupsMatchServerGroups)
			.then(upload.readAllArticles)
			.then(ArticlesDownload.getArticleFolders)
			.then(upload.checkArticlesFoldersExistOnServer)
			.then(function () {
				console.log('End');
				var router = require('./router.js');
				//router(Constants.fetch('STEP_ARTICLES_JUST_DOWNLOADED'));
			}, function (err) {
				lrException(err);
			});


	},

	checkArticlesFoldersExistOnServer: function () {

		var listUniqueLocalFolders = {};
		listOfArticleFiles.forEach(function (articlePath) {
			var localPathArr = articlePath.split('/');
			localPathArr.pop(); // Remove last as it's the filename
			var localPath = localPathArr.join('/');
			listUniqueLocalFolders[localPath] = true;
		});


		// TODO, Add any missing intermediate folders if missing.
		// e.g. folder 'group/apa/boll' exists but 'group/apa' does not, if not, add it.
		// also make sure it's ordered so that 'group/apa' comes before 'group/apa/boll'.
		


		Object.keys(listUniqueLocalFolders).forEach(function(articlePath) {
			var articlePathArr = articlePath.split('/');
			var groupFriendlyUrl = articlePathArr[0];
			var groupId = Sites.getSingleValue('friendlyURL', '/' + groupFriendlyUrl, 'groupId');
			var parentFolderId = 0;

			if(articlePathArr.length > 1) { // Don't check that root folder exist, it always does.
				if (articlePathArr.length > 2) { // If is subfolder.
					var parentPath = groupFriendlyUrl + '/' + articlePathArr.slice(1, -1).join('/');
					parentFolderId = folderNameIdMapping[parentPath];
				}
				folderNameIdMapping[articlePath] = articlesFolders.getFolderId(groupId, articlePathArr[articlePathArr.length - 1], parentFolderId);
			}
		});

		// TODO: WORK HERE
		// Check the object folderNameIdMapping for undefined values. If such exists, we have folders which doesn't
		// exists and needs to be created.

		console.dir(folderNameIdMapping);
		
	},


	readAllArticles: function () {
		localAllArticles = listOfArticleFiles.map(function(file) {
			return fs.readJsonSync(Config.fetch('articlesFolderFullPath') + '/' + file);
			// TODO, Handle errors if not JSON.
		});
	},

	checkArticleGroupsMatchServerGroups: function () {
		Object.keys(localGroupsFriendlyURL).forEach(function (groupFriendlyUrl) {
			var groupId = Sites.getSingleValue('friendlyURL', '/' + groupFriendlyUrl, 'groupId');
			if (groupId === undefined) {
				throw new Error(
					'The folder \'' + groupFriendlyUrl + '\' (in ' + Config.fetch('articlesFolderFullPath') + ') did not match a group on the server.\n' +
						'Please either\n' +
						'  1) Remove the folder from your file system, or\n' +
						'  2) Create or update a group (on the server) to have the friendly URL \'/' + groupFriendlyUrl + '\'')
			} else {
				serverGroupIds.push(groupId);
			}
		});
		return true;
	},

	getAllArticlePaths: function() {
		var deferred = Q.defer();
		var globOptions = {
			cwd: Config.fetch('articlesFolderFullPath')
		};

		glob('**/*.json', globOptions, function (err, files) {
			if (err) {
				lrException(err);
			}
			files.forEach(function (file) {
				var groupName = file.split('/')[0];
				localGroupsFriendlyURL[groupName] = true;
				listOfArticleFiles.push(file);
			});
			deferred.resolve();
		});

		return deferred.promise;
	}
	
};

module.exports = upload;
