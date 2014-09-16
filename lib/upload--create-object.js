var Q           = require('q');
var fs			= require('fs-extra');
var inquirer	= require("inquirer");

var Constants   					= require('./SingleConstants.js');
var PortletKeys                     = require("./SinglePortletkeys.js");

var utilities						= require('./utilities.js');

var createUploadObject = function (file, listTemplates, listStructures, listSites) {

    var deferred = Q.defer();

    var fileClassObj = utilities.getClassNameIdFromFilePath(file);
    var fileName = utilities.filenameAndPathToFilename(file);
    var fileLanguageType = utilities.filenameToLanguageType(file);

    var newScript = '';
    var currentDDMs = [];
    var thisDDM = [];
    var isNewDDM = false;
    var hasAtLeastOneSiteWithStructures = false;
    var payload = {};
    var questionsSites = [];
    var oldDDMObject = {};
    var possibleStructures = [];
    var returnObj = {
        exceptionFile: file,
        group: {}
    };
    var journalStructureClassNameId = '';
    var questionStructures = [];

    // If file actually is a DDM
    if (fileClassObj != -1) {

        returnObj.fileClassObj = fileClassObj;
        returnObj.fileName = fileName;

        try {
            newScript = fs.readFileSync(file, {encoding: Constants.fetch('filesEncoding')});
        } catch(catchErr) {
            returnObj.exception = 'Could not read file';
            deferred.reject(returnObj);
            return deferred.promise;
        }

        // point listTemplates or listStructures to currentDDMs, depending
        // on if it's a template or structure we're dealing with.
        if(fileClassObj.type === 'template') {
            currentDDMs = listTemplates;
        } else if (fileClassObj.type === 'journalStructure') {
            currentDDMs = listStructures;
        } else {
            returnObj.exception = 'Not a template nor a structure';
            deferred.reject(returnObj);
            return deferred.promise;
        }

        // Filter the array to only contain the structures/templates
        // of the same type (classNameId) as the file we're uploading
        currentDDMs = currentDDMs.filter(function(entry) {
            return entry.classNameId === fileClassObj.id;
        });

        // Search the array by DDM name.
        // If we find a match, we're *updating* that DDM. If we don't
        // Find a match, we're *creating a new* DDM.
        if (currentDDMs.length > 0) {
            thisDDM = currentDDMs.filter(function(entry) {
                return entry.nameCurrentValue === fileName;
            });
            if(thisDDM.length === 1) {
                isNewDDM = false;
                oldDDMObject = thisDDM[0];
            } else if (thisDDM.length > 1) {
                returnObj.exception = 'There are more than one structures/templates with the same name.\nName: ' + fileName + '\nDDM: ' + fileClassObj.friendlyName;
                deferred.reject(returnObj);
                return deferred.promise;
            } else {
                isNewDDM = true;
            }
        } else {
            isNewDDM = true;
        }


        if (isNewDDM === true) {
            // NEW DDM

            returnObj.status = 'create';


            if (returnObj.fileClassObj.clazz === 'com.liferay.portlet.dynamicdatamapping.model.DDMStructure') {
                // The new file is a journal template which needs to be bound to a journal *structure*
                // Therefor we need to figure out which sites has journal article structures.

                journalStructureClassNameId = utilities.getSingleValueFromLrClassNameConfig('clazz', 'com.liferay.portlet.journal.model.JournalArticle', 'id');

                // Loop *every* site
                for (var i = 0; i < listSites.length; i++) {

                    // Only let sites which may contain DDMs through
                    // Like user sites we don't allow to contain DDMs and ar therefor ignoring them.
                    if(utilities.getSingleValueFromLrClassNameConfig('id', listSites[i].classNameId), 'containsDDMs') {

                        // Create an array with entries for each site which the user may
                        // upload the journal template to. To be able to upload a template
                        // that site needs to have at least 1 journal structure (to which
                        // we can bind the template).
                        possibleStructures[i] = listStructures.filter(function(entry) {
                            if(entry.groupId === listSites[i].groupId) {
                                if (entry.classNameId === journalStructureClassNameId) {
                                    return true;
                                } else {
                                    return false;
                                }
                            } else {
                                return false;
                            }
                        });

                        // If the site has at least one journal structure. Add the
                        // site to the list of sites the user is able to choose from
                        // when uploading the template.
                        if (possibleStructures[i].length > 0) {
                            hasAtLeastOneSiteWithStructures = true;
                            questionsSites.push({
                                name: listSites[i].name + ' [' + utilities.getSingleValueFromLrClassNameConfig('id', listSites[i].classNameId, 'friendlyName') + '] (' + possibleStructures[i].length + ')' ,
                                value: {
                                    groupId: listSites[i].groupId,
                                    possibleStructures: possibleStructures[i]
                                }
                            });
                        }
                    }
                }

            } else {
                // TODO: Do the same thing for all other (non-journal template) new templates/structures
            }


            // TODO: Om den nya journal templatens namn är det samma som en (1) giltig journal structures namn
            // så bind automagiskt till den utan att frågan användaren.

            // Check that we have at least one site with a journal structure,
            // to which we can bind the template.
            if (hasAtLeastOneSiteWithStructures) { // Should probably change this to handle non-journal template files.

                utilities.writeToScreen('', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_HEADING'));
                utilities.writeToScreen('"' + returnObj.fileName + '" (Type: ' + returnObj.fileClassObj.friendlyName + ')', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_FILE'));
                utilities.writeToScreen('', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_HEADING'));

                inquirer.prompt([
                        {
                            type: "list",
                            name: "siteSelection",
                            message: "Which site do you want to add the " + returnObj.fileClassObj.friendlyName + " to",
                            choices: questionsSites
                        }
                    ], function( answersSite ) {

                        for (var i = 0; i < answersSite.siteSelection.possibleStructures.length; i++) {
                            questionStructures.push({
                                name: answersSite.siteSelection.possibleStructures[i].nameCurrentValue,
                                value: answersSite.siteSelection.possibleStructures[i]
                            });
                        }

                        inquirer.prompt([
                                {
                                    type: "list",
                                    name: "structureSelection",
                                    message: "Which structure do you want to bind the template to",
                                    choices: questionStructures
                                }
                            ], function( answersStructure ) {



                                // Set some values in our return object to be able to do a nice print to the user.
                                returnObj.group.description		= utilities.getSingleValueFromSitesListByGroupId(listSites, answersSite.siteSelection.groupId, 'description');
                                returnObj.group.name			= utilities.getSingleValueFromSitesListByGroupId(listSites, answersSite.siteSelection.groupId, 'name');
                                returnObj.group.type			= utilities.getSingleValueFromLrClassNameConfig('id', utilities.getSingleValueFromSitesListByGroupId(listSites, answersSite.siteSelection.groupId, 'classNameId'), 'friendlyName');
                                returnObj.group.friendlyURL		= utilities.getSingleValueFromSitesListByGroupId(listSites, answersSite.siteSelection.groupId, 'friendlyURL');
                                returnObj.group.groupId			= answersSite.siteSelection.groupId;

                                payload = {
                                    groupId: answersSite.siteSelection.groupId,
                                    classNameId: utilities.getSingleValueFromLrClassNameConfig('clazz', 'com.liferay.portlet.dynamicdatamapping.model.DDMStructure', 'id'),
                                    classPK: answersStructure.structureSelection.structureId,
                                    nameMap: utilities.strToJsonMap(returnObj.fileName),
                                    descriptionMap: {},
                                    type: 'display',
                                    mode: '',
                                    language: fileLanguageType,
                                    script: newScript,
                                    '+serviceContext': 'com.liferay.portal.service.ServiceContext',
                                    'serviceContext.addGroupPermissions': true,
                                    'serviceContext.addGuestPermissions': true,
                                    'serviceContext.attributes': { refererPortletName: PortletKeys.JOURNAL }
                                    // 15 = journal
                                };

                                returnObj.payload = '{"/ddmtemplate/add-template": ' + JSON.stringify(payload) + '}';

                                deferred.resolve(returnObj);

                            }
                        );

                    }
                );
            } else {
                returnObj.exception = 'There are no sites with structures to which we can bind a template';
                deferred.reject(returnObj);
                return deferred.promise;
            }

        } else {
            // UPDATE DDM

            if(fileClassObj.type === 'template') {
                // UPDATE TEMPLATE

                // Check if the file already is up to date
                if(oldDDMObject.script === newScript) {
                    returnObj.status = 'uptodate';
                } else {
                    returnObj.status = 'update';
                }

                // Set some values in our return object to be able to do a nice print to the user.
                returnObj.group.description = utilities.getSingleValueFromSitesListByGroupId(listSites, oldDDMObject.groupId, 'description');
                returnObj.group.name = utilities.getSingleValueFromSitesListByGroupId(listSites, oldDDMObject.groupId, 'name');
                returnObj.group.type = utilities.getSingleValueFromLrClassNameConfig('id', utilities.getSingleValueFromSitesListByGroupId(listSites, oldDDMObject.groupId, 'classNameId'), 'friendlyName');
                returnObj.group.friendlyURL = utilities.getSingleValueFromSitesListByGroupId(listSites, oldDDMObject.groupId, 'friendlyURL');
                returnObj.group.groupId = oldDDMObject.groupId;

                // Populate payload with data from old template (things we aren't updating)
                payload = {
                    templateId: oldDDMObject.templateId,
                    classPK: oldDDMObject.classPK,
                    type: oldDDMObject.type,
                    mode: oldDDMObject.mode,
                    language: oldDDMObject.language,
                    cacheable: oldDDMObject.cacheable,
                    smallImage: oldDDMObject.smallImage,
                    smallImageURL: oldDDMObject.smallImageURL,
                    smallImageFile: null, // We don't support small images right now.
                    script: newScript
                };

                // Populate payload with data from old template (things we aren't updating)
                // but we need to make it into a Map which Liferay wants.
                utilities.xmlMapToObj(oldDDMObject.name, 'Name')
                    .then(function (resName) {
                        payload.nameMap = resName;
                    })
                    .then(utilities.xmlMapToObj(oldDDMObject.description, 'Description')
                        .then(function (resDesc) {
                            payload.descriptionMap = resDesc;
                        }))
                    .then(
                    function () {
                        returnObj.payload = '{"/ddmtemplate/update-template": ' + JSON.stringify(payload) + '}';
                        deferred.resolve(returnObj);
                    }
                );


            } else if (fileClassObj.type === 'journalStructure') {
                // UPDATE STRUCTURE

                // Check if the file already is up to date
                if(oldDDMObject.xsd === newScript) {
                    returnObj.status = 'uptodate';
                } else {
                    returnObj.status = 'update';
                }

                // Set some values in our return object to be able to do a nice print to the user.
                returnObj.group.description = utilities.getSingleValueFromSitesListByGroupId(listSites, oldDDMObject.groupId, 'description');
                returnObj.group.name = utilities.getSingleValueFromSitesListByGroupId(listSites, oldDDMObject.groupId, 'name');
                returnObj.group.type = utilities.getSingleValueFromLrClassNameConfig('id', utilities.getSingleValueFromSitesListByGroupId(listSites, oldDDMObject.groupId, 'classNameId'), 'friendlyName');
                returnObj.group.friendlyURL = utilities.getSingleValueFromSitesListByGroupId(listSites, oldDDMObject.groupId, 'friendlyURL');
                returnObj.group.groupId = oldDDMObject.groupId;

                // Populate payload with data from old structure (things we aren't updating)
                payload = {
                    structureId: oldDDMObject.structureId,
                    parentStructureId: oldDDMObject.parentStructureId,
                    xsd: newScript
                };

                // Populate payload with data from old template (things we aren't updating)
                // but we need to make it into a Map which Liferay wants.
                utilities.xmlMapToObj(oldDDMObject.name, 'Name')
                    .then(function (resName) {
                        payload.nameMap = resName;
                    })
                    .then(utilities.xmlMapToObj(oldDDMObject.description, 'Description')
                        .then(function (resDesc) {
                            payload.descriptionMap = resDesc;
                        }))
                    .then(
                    function () {
                        returnObj.payload = '{"/ddmstructure/update-structure": ' + JSON.stringify(payload) + '}';
                        deferred.resolve(returnObj);
                    }
                );


            }

        }


    }

    return deferred.promise;

};

module.exports = createUploadObject;