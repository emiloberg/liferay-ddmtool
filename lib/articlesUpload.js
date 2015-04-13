"use strict";

var Q								= require('q');
var _								= require('underscore');
var inquirer						= require("inquirer");
var Table 							= require('cli-table');
var fs								= require('fs-extra');
var glob 							= require("glob");

var utilities	                    = require('./utilities.js');
var Constants                       = require('./Constants.js');
var getData							= require('./getData.js');
var Sites							= require('./Sites.js');
var Config							= require('./Config.js');
var ArticlesDownload				= require('./articlesDownload.js');
var ArticlesJournalFolders			= require('./articlesJournalFolders.js');
var Templates						= require('./Templates.js');
var Structures						= require('./Structures.js');
var lrException                     = require('./errorException.js');

var localGroupsFriendlyURL = {};
var localAllArticles = [];
var listOfArticleFiles = [];
var mapFolderNameToServerFolderId = {};

var upload = {
	
	uploadAllArticles: function() {

		utilities.writeToScreen('-', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));
		utilities.writeToScreen('Mangling articles to prepare for upload', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));

		Q.resolve()
			.then(upload.getAllArticlePaths)
			.then(upload.checkArticleGroupsMatchServerGroups)
			.then(upload.readAllArticles)
			.then(ArticlesDownload.getArticleFolders)
			.then(upload.doFolderIdMapping)
			.then(upload.doStructureTemplateGroupIdMapping)
			.then(upload.createNewArticleUploadPromise)
			.then(upload.sendToServer)
			.then(function () {
				var router = require('./router.js');
				router(Constants.fetch('STEP_ARTICLES_JUST_UPLOADED'));
			}, function (err) {
				lrException(err);
			});


	},
	
	sendToServer: function (payloadPromises) {

		var deferred = Q.defer();

		Q.all(payloadPromises).then(function (payloads) {

			// Print table for user to confirm that s/he wants to send this to the server.
			utilities.writeToScreen('-', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_NORMAL'));
			utilities.writeToScreen(utilities.pad(payloads.length, 3, 'left') + ' new articles will be created', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_SAVE'));
			var outputTable = new Table({
				head: ['Name', 'Group', 'Structure'],
				chars: {
					'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': '',
					'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': '',
					'left': '' , 'left-mid': '' , 'mid': '' , 'mid-mid': '',
					'right': '' , 'right-mid': '' , 'middle': ' '
				},
				style: {
					'padding-left': 2,
					'padding-right': 0,
					'head': ['magenta']
				},
				colWidths: [35, 25]
			});
			payloads.forEach(function (payload) {

				outputTable.push(
					[
						// TODO, Check that the below line does not return undefined,
						// if it does, it's most probably because the defaultLocale does not exist
						// in the article file (eg article file is in sv_SE instead of se_SE).
						// this check should probably be done at some other place in this object.
						payload['/journalarticle/add-article'].titleMap[Config.fetch('defaultLocale')],
						Sites.getSingleValue('groupId', payload['/journalarticle/add-article'].groupId, 'name'),
						Structures.getSingleValue('structureKey', payload['/journalarticle/add-article'].ddmStructureKey, 'nameCurrentValue')
					]
				);
			});
			
			utilities.writeToScreen(outputTable.toString(), Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));
			utilities.writeToScreen('\n', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));

			// Ask and send to server
			inquirer.prompt([
					{
						type: "list",
						name: "confirm",
						message: "Do you want to send this to the server?",
						choices: [
							{
								name: 'Send to server \'' + Config.fetch('hostFriendlyName').toUpperCase() + '\' (of project \'' + Config.fetch('projectName') + '\')',
								value: true
							},
							{
								name: 'Abort',
								value: false
							}
						]
					}
				], function (answers) {
					if (answers.confirm === true) {

						getData(JSON.stringify(payloads)).then(function (ret) {
							utilities.writeToScreen('-', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_NORMAL'));
							utilities.writeToScreen('Upload successful: ' + ret.length + ' articles uploaded to server!' , Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_SAVE'));
							deferred.resolve();
						}, function (err) {
							throw new Error('Could not upload articles to server. ' + err);
						});
					} else {
						deferred.resolve();
					}
				}
			);

		});

		return deferred.promise;

	},

	

	createNewArticleUploadPromise: function () {

		return localAllArticles.map(function (article) {

			var deferred = Q.defer();

			var uploadObj = {};

			var groupId = Sites.getSingleValue('friendlyURL', '/' + article.ddmToolFilePath.split('/').slice(0, 1), 'groupId');

			var titleMap = {};
			var descriptionMap = {};

			var displayDate = utilities.timestampToInt(article.displayDate);
			var expirationDate = utilities.timestampToInt(article.expirationDate);
			var reviewDate = utilities.timestampToInt(article.reviewDate);

			utilities.xmlMapToObj(article.title, 'Title', true)
				.then(function (resp) {
					titleMap = resp;
				})
				.then(utilities.xmlMapToObj(article.description, 'Description', true)
					.then(function (resp) {
						descriptionMap = resp;
					})
				)
				.then(function (){
					uploadObj.groupId = groupId;
					uploadObj.folderId = mapFolderNameToServerFolderId[article.ddmToolFilePath.split('/').slice(0, -1).join('/')];
					uploadObj.classNameId = 0; // TODO: Right now we don't support 'default' article
					uploadObj.classPK = 0; // neither do we here
					uploadObj.articleId = '';
					uploadObj.autoArticleId = true;
					uploadObj.titleMap = titleMap;
					uploadObj.descriptionMap = descriptionMap;
					uploadObj.content = article.content;
					uploadObj.type = article.type;
					uploadObj.ddmStructureKey = article.ddmToolServerStructureKey.toString();
					uploadObj.ddmTemplateKey = article.ddmToolServerTemplateKey.toString();
					uploadObj.layoutUuid = ''; // TODO: Right now we don't support display pages.

					uploadObj.displayDateMonth = displayDate.int.month;
					uploadObj.displayDateDay = displayDate.int.day;
					uploadObj.displayDateYear = displayDate.int.year;
					uploadObj.displayDateHour = displayDate.int.hour;
					uploadObj.displayDateMinute = displayDate.int.minute;

					uploadObj.expirationDateMonth = expirationDate.int.month;
					uploadObj.expirationDateDay = expirationDate.int.day;
					uploadObj.expirationDateYear = expirationDate.int.year;
					uploadObj.expirationDateHour = expirationDate.int.hour;
					uploadObj.expirationDateMinute = expirationDate.int.minute;
					uploadObj.neverExpire = expirationDate.izNull;

					uploadObj.reviewDateMonth = reviewDate.int.month;
					uploadObj.reviewDateDay = reviewDate.int.day;
					uploadObj.reviewDateYear = reviewDate.int.year;
					uploadObj.reviewDateHour = reviewDate.int.hour;
					uploadObj.reviewDateMinute = reviewDate.int.minute;
					uploadObj.neverReview = reviewDate.izNull;

					uploadObj.indexable = article.indexable;

					uploadObj.articleURL = article.urlTitle;

					uploadObj['+serviceContext'] = 'com.liferay.portal.service.ServiceContext';
					uploadObj['serviceContext.addGroupPermissions'] = true;
					uploadObj['serviceContext.addGuestPermissions'] = true;
					uploadObj['serviceContext.scopeGroupId'] = groupId;

					deferred.resolve({'/journalarticle/add-article': uploadObj });

				});

			return deferred.promise;
		});
		
	},

	doStructureTemplateGroupIdMapping: function () {

		// Match site/template/structure-name in article file with site/template/structure on server
		localAllArticles = localAllArticles.map(function (article) {
			article.ddmToolServerTemplateKey = Templates.getSingleValue('nameCurrentValue', article.ddmToolTemplateNameCurrentValue, 'templateKey');
			article.ddmToolServerStructureKey = Structures.getSingleValue('nameCurrentValue', article.ddmToolStructureNameCurrentValue, 'structureKey');
			return article;
		});

		// Check if we have any missing templates/structure and throw if so.
		var missingDDMs = [];
		localAllArticles.forEach(function (article) {
			if (article.ddmToolServerTemplateKey === undefined) {
				missingDDMs.push('Template:  ' + article.ddmToolTemplateNameCurrentValue + ' (missing for article id: ' + article.articleId + ')');
			}
			if (article.ddmToolServerStructureKey === undefined) {
				missingDDMs.push('Structure: ' + article.ddmToolStructureNameCurrentValue + ' (missing for article id: ' + article.articleId + ')');
			}
		});
		missingDDMs = missingDDMs.sort();
		if (missingDDMs.length > 0) {
			throw new Error(
				'Some structures and/or templates are missing on the server,\n' +
				'please upload them to the server before uploading the articles.\n\n   ' +
				missingDDMs.join('\n   ')
			);
		}
	},
	
	
	doFolderIdMapping: function () {
		
		// Create object of unique folders we need to check that they exist.
		var objListUniqueLocalFolders = {};
		listOfArticleFiles.forEach(function (articlePath) {
			var localPathArr = articlePath.split('/');
			localPathArr.pop(); // Remove last as it's the filename
			var localPath = localPathArr.join('/');

			if (localPathArr.length > 1) { // Ignore root folder
				objListUniqueLocalFolders[localPath] = true;
			}
		});

		// Create intermediate folders if missing. If folder a/b/c/d exist in list, so mush a/b/c, a/b and a.
		Object.keys(objListUniqueLocalFolders).forEach(function(articlePath) {
			var articlePathSlugs = articlePath.split('/');
			articlePathSlugs.pop();
			if (articlePathSlugs.length > 1) { // Ignore folders in the root.
				var couldBeMissingFolder = [];
				for (var i = 1; i < articlePathSlugs.length; i++) {
					couldBeMissingFolder = articlePathSlugs.slice(0, i+1);
					couldBeMissingFolder = couldBeMissingFolder.join('/');
					objListUniqueLocalFolders[couldBeMissingFolder] = true;
				}
			}
		});

		// Turn into array and sort, folder a/b/c must come a/b which must come after a.
		var listUniqueLocalFolders = [];
		Object.keys(objListUniqueLocalFolders).forEach(function(articlePath) {
			listUniqueLocalFolders.push(articlePath)

		});
		listUniqueLocalFolders = listUniqueLocalFolders.sort();

		// Check each folder, if it exists or not, and save the ID of the existing folders.
		listUniqueLocalFolders.forEach(function(articlePath) {
			var articlePathArr = articlePath.split('/');
			var groupFriendlyUrl = articlePathArr[0];
			var groupId = Sites.getSingleValue('friendlyURL', '/' + groupFriendlyUrl, 'groupId');
			var parentFolderId = 0;

			if(articlePathArr.length > 1) { // Don't check that root folder exist, it always does.
				if (articlePathArr.length > 2) { // If is subfolder.
					var parentPath = groupFriendlyUrl + '/' + articlePathArr.slice(1, -1).join('/');
					parentFolderId = mapFolderNameToServerFolderId[parentPath];
				}
				mapFolderNameToServerFolderId[articlePath] = ArticlesJournalFolders.getFolderId(groupId, articlePathArr[articlePathArr.length - 1], parentFolderId);
			}
			
		});

		// Check if we got any missing folders.
		var missingFolders = [];
		Object.keys(mapFolderNameToServerFolderId).forEach(function (folder) {
			if(mapFolderNameToServerFolderId[folder] === undefined) {
				missingFolders.push(folder);
			}
		});
		if (missingFolders.length > 0 ) {
			throw new Error(
				missingFolders.length + ' folder(s) which exist on the local file system was not found on the server:\n   ' +
					missingFolders.join('\n   ')
			);
		}

		return true;
	},


	readAllArticles: function () {
		localAllArticles = listOfArticleFiles.map(function(file) {
			var retObj = fs.readJsonSync(Config.fetch('articlesFolderFullPath') + '/' + file);
			retObj.ddmToolFilePath = file;
			return retObj;
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
						'  2) Create or update a group (on the server) to have the friendly URL \'/' + groupFriendlyUrl + '\'');
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
