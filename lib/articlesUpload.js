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

			// Split the file path into an array. The first entity is the group name.
			var localPathArr = articlePath.split('/');
			var groupFriendlyUrl = localPathArr[0];
			var groupId = Sites.getSingleValue('friendlyURL', '/' + groupFriendlyUrl, 'groupId');

			// If array of file paths is only 1 entity long, it's because the article is in the root
			// folder. The root folder always exists so we don't need to check that.
			if(localPathArr.length > 1) {
				var pathSlugs = localPathArr;
				pathSlugs.shift();

				// Loop all parts of the folder structure, and check each folder one by one.
				for (var i = 0; i < pathSlugs.length; i++) {

					// Construct the full path.
					var fullPath = groupFriendlyUrl;
					for (var x = 0; x < i; x++) {
						fullPath = fullPath + '/' + pathSlugs[x];
					}
					fullPath = fullPath + '/' + pathSlugs[i];

					// Only check if folder exists if we havn't checked it already.
					if(folderNameIdMapping.hasOwnProperty(fullPath) === false) {
						// If this is the first slug, it means it's parent folder it's the root folder.
						// If not, we need to get the id of the parent folder.
						var parentFolderId = 0;
						if (i > 0) {
							var parentFullPath = groupFriendlyUrl;
							for (var y = 0; y < i; y++) {
								parentFullPath = parentFullPath + '/' + pathSlugs[y];
							}
							parentFolderId = folderNameIdMapping[parentFullPath];
						}

						// Check if folder exist on server, and save the results.
						folderNameIdMapping[fullPath] = articlesFolders.getFolderId(groupId, pathSlugs[i], parentFolderId);
					}

				}
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
