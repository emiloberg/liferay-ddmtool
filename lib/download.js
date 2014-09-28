"use strict";

var Q								= require('q');
var _								= require('underscore');

var utilities	                    = require('./utilities.js');
var Constants                       = require('./Constants.js');
var lrException                     = require('./errorException.js');
var cache	                    	= require('./cache.js');
var getData							= require('./getData.js');
var LrClassNameConfig	    		= require('./SingleLrClassNameConfig.js');
var Sites							= require('./Sites.js');
var Structures						= require('./Structures.js');
var Templates						= require('./Templates.js');
var Config							= require('./Config.js');

var CompanyId						= 0;

var download = {
	downloadAllFromServer: function () {
		
		utilities.writeToScreen('Getting data from server', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));

		Q.resolve()
			.then(cache.clearCache)
			.then(download.getClassNameIds)
			.then(download.getUserSites)
			.then(download.getCompanyGroup)
			.then(download.getUserId)
			.then(download.getStructures)
			.then(download.getTemplates)
			.then(function () {

			})
			.done(function () {
				var router = require('./router.js');
				router(Constants.fetch('STEP_JUST_READ_ALL_FROM_SERVER'));
			}, function (e) {
				lrException(e);
			});
	},



	getUserId: function() {
		utilities.writeToScreen('Downloading user info', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));
		return getData('{"/user/get-user-id-by-email-address": {companyId: ' + CompanyId + ', emailAddress: ' + Config.fetch('email') + '}}').then(
			function (e) {
				if(e.length === 0) {
					throw Error('Could not find UserID');
				} else {
					Config.set('email', e);
				}
			});
	},


	getClassNameIds: function () {
		utilities.writeToScreen('Downloading id\'s', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));

		var payload = [];
		for (var i = 0; i < LrClassNameConfig.fetch().length; i++) {
			payload.push('{"/classname/fetch-class-name-id": {"value": ' + LrClassNameConfig.fetch(i, 'clazz') + '}}');
		}

		return getData('[' + payload.join() + ']').then(
			function (e) {
				for (var i = 0; i < LrClassNameConfig.fetch().length; i++) {
					LrClassNameConfig.addToEntry(i, 'id', e[i]);
				}
				cache.saveToCache(LrClassNameConfig.fetch(), Constants.fetch('cacheClassNameConfig'));
			});
	},


	getUserSites: function() {
		utilities.writeToScreen('Downloading list of sites', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));
		return getData('{"/group/get-user-sites": {}}').then(
			function (e) {
				if(e.length === 0) {
					throw Error('Could not find any sites');
				} else {
					e.forEach(function(entry) {
						Sites.add(entry);
					});
					CompanyId = e[0].companyId;
				}
			});
	},


	getCompanyGroup: function () {
	utilities.writeToScreen('Downloading company site', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));
	return getData('{"/group/get-company-group": {"companyId": "' + CompanyId + '"}}').then(
		function (e) {
			// Dirty way of adding the global site to the list of sites.
			Sites.setAll(JSON.parse('[' + JSON.stringify(Sites.fetch()).substr(1).slice(0, -1) + ',' + JSON.stringify(e) + ']'));
			cache.saveToCache(Sites.fetch(), Constants.fetch('cacheSitesFilename'));
		});
	},


	getStructures: function () {
		utilities.writeToScreen('Downloading structures', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));

		var sitesList = [];
		var i;
		for (i = 0; i < Sites.fetch().length; ++i) {
			sitesList.push(Sites.fetch(i, 'groupId'));
		}

		return getData('{"/ddmstructure/get-structures": {"groupIds": [' + sitesList.join() + ']}}').then(
			function (e) {


				// Make sure we have all the structures in our LrClassNameConfig
				// If not, warn the user about it!
				for (var i = 0; i < e.length; ++i) {
					if (!LrClassNameConfig.checkExist('id', e[i].classNameId)) {
						var newLrClassNameObj = {
							filesPath: 'unknown/' + e[i].classNameId,
							friendlyName: 'Unknown with classNameId: ' + e[i].classNameId,
							clazz: 'Unknown with classNameId: ' + e[i].classNameId,
							type: 'structure',
							containsDDMs: true,
							id: e[i].classNameId,
							isUnknown: true,
							getTemplate: false
						};
						utilities.writeToScreen(
								'\nFound a (custom?) structure I don\'t know about\n' +
								'It\'ll be saved in \'' + newLrClassNameObj.filesPath + '\' but I won\'t be able to manage it.\n\n' +
								'To be able to handle unknown structures:\n' +
								'1) Search you database: \'select value from classname_ where classNameId = ' + e[i].classNameId + '\' to get className\n' +
								'2) Create an entry in \'' + Constants.fetch('settingsFolder') + '/' + Constants.fetch('customClassNameConfig') + '\' (please read README)\n'
							, Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_ERROR'));
						LrClassNameConfig.add(newLrClassNameObj);
					}
				}


				// Remove every entry (therer is only 1) with className 'PortletDocumentlibraryUtilRawMetadataProcessor'.
				// This is a Liferay internal structure which is used to parse
				// document metadata and display it in the Document and Media Portlet.
				var idRawMetaDataProcessor = LrClassNameConfig.getSingleValue('clazz', 'com.liferay.portlet.documentlibrary.util.RawMetadataProcessor', 'id');
				e = e.filter(function(entry) {
					return entry.classNameId != idRawMetaDataProcessor;
				});

				// Check if there's a DDM we should ignore
				e = e.filter(function(entry) {
					if(_.contains(Config.fetch('ignoreDDMs'), entry.structureKey)) {
						return false;
					} else {
						return true;
					}
				});

				e.forEach(function(entry) {
					Structures.add(entry);
				});

				cache.saveToCache(Structures.fetch(), Constants.fetch('cacheStructuresFilename'));
				
			});
	},


	getTemplates: function () {

		utilities.writeToScreen('Downloading templates', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));
		var payload = [];

		for (var i = 0; i < Sites.fetch().length; ++i) {
			for (var ii = 0; ii < LrClassNameConfig.fetch().length; ii++) {
				if (LrClassNameConfig.fetch(ii, 'getTemplate')) {
					payload.push('{"/ddmtemplate/get-templates": {"groupId": ' + Sites.fetch(i, 'groupId') + ', "classNameId": ' + LrClassNameConfig.fetch(ii, 'id') + '}}');
				}
			}
		}

		return getData('[' + payload.join() + ']').then(
			function (e) {
				for (var y = 0; y < e.length; ++y) {
					for (i = 0; i < e[y].length; ++i) {
						// Check if there's a DDM we should ignore
						if(!_.contains(Config.fetch('ignoreDDMs'), e[y][i].templateKey)) {
//							Templates.push(e[y][i]);
							Templates.add(e[y][i])
						}
					}
				}
				cache.saveToCache(Templates.fetch(), Constants.fetch('cacheTemplatesFilename'));

			});
	}



};

module.exports = download;