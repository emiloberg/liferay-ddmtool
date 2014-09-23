"use strict";

var Q           					= require('q');
var fs								= require('fs-extra');

var Constants   					= require('./SingleConstants.js');
var LrClassNameConfig	    		= require('./SingleLrClassNameConfig.js');
var globalStructures				= require('./SingleStructures.js');
var globalTemplates					= require('./SingleTemplates.js');

var utilities						= require('./utilities.js');

var createUploadObject = function (file) {

	var deferred = Q.defer();

    var currentDDMs = [];
    var thisDDM = [];
    var oldDDMObject = {};
	var newScript = '';
	var fileName = utilities.filenameAndPathToFilename(file);
	var fileClassObj = {};
	var returnObj = {
		fileLanguageType: utilities.filenameToLanguageType(file),
		exceptionFile: file,
		group: {}
	};
	var newObj = {
		isTemplate: false,
		isStructure: false,
		isNewDDM: false,
		isADT: false
	};


	// Figure out what kind of file it is based on it's path.
	var filePathSplit = file.split('/');

	
	if(filePathSplit[filePathSplit.length - 2] === 'templates') { // Is template
		var coTemplate = require('./upload--co-template.js');
		coTemplate(file).then(function (resp) {
			deferred.resolve(resp);
		},function (resp) {
			deferred.reject(resp);
		});
	} else if(filePathSplit[filePathSplit.length - 2] === 'structures') {
		var coStructure = require('./upload--co-structure.js');
		coStructure(file).then(function (resp) {
			deferred.resolve(resp);
		},function (resp) {
			deferred.reject(resp);
		});
	} else {
		returnObj.exception = 'File is not a structure nor a template';
		deferred.reject(returnObj);
		return deferred.promise;
	}







//
//
//	returnObj.exception = 'Temporary error';
//	deferred.reject(returnObj);
//	return deferred.promise;


/*
  ADD NEW TEMPLATE
	 payload = {
	 	groupId: answersSite.siteSelection.groupId,
	 	classNameId: returnObj.fileClassObj.id,
	 	classPK: 0,
	 nameMap: utilities.strToJsonMap(returnObj.fileName),
	 descriptionMap: {},
	 type: 'display',
	 mode: '',
	 language: returnObj.fileLanguageType,
	 script: newScript,
	 '+serviceContext': 'com.liferay.portal.service.ServiceContext',
	 'serviceContext.addGroupPermissions': true,
	 'serviceContext.addGuestPermissions': true,
	 	'serviceContext.attributes': { refererPortletName: PortletKeys.fetch('PORTLET_DISPLAY_TEMPLATES') }
	 };
 */

	/*
	 UPDATE TEMPLATE
	 payload = {
	 templateId: oldDDMObj.templateId,
	 classPK: oldDDMObj.classPK,
	 type: oldDDMObj.type,
	 mode: oldDDMObj.mode,
	 language: oldDDMObj.language,
	 cacheable: oldDDMObj.cacheable,
	 smallImage: oldDDMObj.smallImage,
	 smallImageURL: oldDDMObj.smallImageURL,
	 smallImageFile: null, // We don't support small images right now.
	 script: newScript
	 };

	 */

/*
  ADD NEW STRUCTURE
	userId long
	groupId long
	classNameId long
	nameMap java.util.Map
	descriptionMap java.util.Map
	xsd java.lang.String
	serviceContext com.liferay.portal.service.ServiceContext
*/



/*
  UPDATE STRUCTURE
	 structureId long
	 parentStructureId long
	 nameMap java.util.Map
	 descriptionMap java.util.Map
	 xsd java.lang.String
	 serviceContext com.liferay.portal.service.ServiceContext
 */



//	var classNameIds = LrClassNameConfig.fetch().filter(function(entry) {
//		return entry.filesPath === filesPath;
//	});
//
//	if(classNameIds.length === 1) {
//		fileClassObj = classNameIds[0];
//	} else {
//
//		var altFilesPath = fileArr[fileArr.length - 3];
//		classNameIds = LrClassNameConfig.fetch().filter(function(entry) {
//			return entry.filesPath === altFilesPath;
//		});
//
//
//
//
//		fileClassObj = undefined;
//		// TODO SOMETHING WENT WRONG!
//	}





//    // If file actually is a DDM
//    if (fileClassObj === 'undefined') {
//		returnObj.exception = 'File is not a DDM';
//		deferred.reject(returnObj);
//		return deferred.promise;
//	}
//
//	returnObj.fileClassObj = fileClassObj;
//	returnObj.fileName = fileName;
//
//	try {
//		newScript = fs.readFileSync(file, {encoding: Constants.fetch('filesEncoding')});
//	} catch(catchErr) {
//		returnObj.exception = 'Could not read file';
//		deferred.reject(returnObj);
//		return deferred.promise;
//	}
//
//	// DO MAGIC TO FIGURE OUT IF IT'S A NEW DDM OR AN OLD ONE WE WANT TO UPDATE
//
//	// Get list of templates or structures depending on what data we're dealing with.
//	if(fileClassObj.type === 'template') {
//		currentDDMs =  globalTemplates.fetch();
//	} else if (fileClassObj.type === 'journalStructure') {
//		currentDDMs = globalStructures.fetch();
//	} else {
//		returnObj.exception = 'Not a template nor a structure';
//		deferred.reject(returnObj);
//		return deferred.promise;
//	}
//
//	// Filter the array to only contain the structures/templates
//	// of the same type (classNameId) as the file we're uploading
//	currentDDMs = currentDDMs.filter(function(entry) {
//		return entry.classNameId === fileClassObj.id;
//	});
//
//	// Search the array by DDM name.
//	// If we find a match, we're *updating* that DDM. If we don't
//	// Find a match, we're *creating a new* DDM.
//	if (currentDDMs.length > 0) {
//		thisDDM = currentDDMs.filter(function(entry) {
//			return entry.nameCurrentValue === fileName;
//		});
//		if(thisDDM.length === 1) {
//			isNewDDM = false;
//			oldDDMObject = thisDDM[0];
//		} else if (thisDDM.length > 1) {
//			returnObj.exception = 'There are more than one structures/templates with the same name.\nName: ' + fileName + '\nDDM: ' + fileClassObj.friendlyName;
//			deferred.reject(returnObj);
//			return deferred.promise;
//		} else {
//			returnObj.status = 'create';
//			isNewDDM = true;
//		}
//	} else {
//		isNewDDM = true;
//	}
//
//
//	if (isNewDDM) {
//		if (returnObj.fileClassObj.clazz === 'com.liferay.portlet.dynamicdatamapping.model.DDMStructure') {
//			// New Journal Template
//			var createUploadObjectNewJournalTemplate = require('./upload--co-new-journal-template.js');
//			createUploadObjectNewJournalTemplate(newScript, returnObj).then(function (resp) {
//				deferred.resolve(resp);
//			}, function (er) {
//				deferred.reject(er);
//			});
//		} else if(fileClassObj.type === 'template') {
//			// New ADT Template
//			var createUploadObjectNewGenericTemplate = require('./upload--co-new-adt-template.js');
//			createUploadObjectNewGenericTemplate(newScript, returnObj).then(function (resp) {
//				deferred.resolve(resp);
//			}, function (er) {
//				deferred.reject(er);
//			});
//		} else if(fileClassObj.type === 'journalStructure') {
//			console.dir('New Journal Structure');
//			//TODO New Journal Structure
//		}
//		// TODO New other structure
//	} else {
//		if(fileClassObj.type === 'journalStructure') {
//			// Update journal structure
//			// Todo: Make this work with all structures.
//			var createUploadObjectUpdateStructure = require('./upload--co-structure-update.js');
//			createUploadObjectUpdateStructure(newScript, oldDDMObject, returnObj).then(function (resp) {
//				deferred.resolve(resp);
//			}, function (er) {
//				deferred.reject(er);
//			});
//		} else if(fileClassObj.type === 'template') {
//			// Update Journal and ADT Template
//			var createUploadObjectUpdateTemplate = require('./upload--co-template-update.js');
//			createUploadObjectUpdateTemplate(newScript, oldDDMObject, returnObj).then(function (resp) {
//				deferred.resolve(resp);
//			}, function (er) {
//				deferred.reject(er);
//			});
//		}
//		// TODO Update other structure
//
//	}

    return deferred.promise;

};

module.exports = createUploadObject;