/**
 * GOOD THINGS:
 *
 * Diff: https://www.npmjs.org/package/diff
 *
 * TODO:
 *
 * Change so that cache are saved in separate folders for separate projects.
 *
 *
 *
 * Add tab complete for shell
 *	https://github.com/hij1nx/complete
 *	https://www.npmjs.org/package/tabtab
 *
 *
 *
 * Add option to save files in a folder per group. E.g.
 *		/global/application_display_template/asset_publisher/file.ftl
 *		/my sub group/application_display_template/asset_publisher/file.ftl 
 *
 *
 *
 * Make an option to not save structures which are Liferay default (maybe blacklist some template keys)
 *
 *
 *
 *	Since it's important that no templates/structures have the same name, create a function to 
 *  warn the user if some of the entities have the same name. Also make sure that the name/desc of the DDMs 
 *  don't contain any non-safe characters (such as slashes).
 *
 *
 *
 *	Get all Workflows aswell.
 *
 *
 *
 *	Add support for not overwriting smallImageFile with null on update.
 *
 *
 *
 * Template/Structure Name and Description are stripped from all characters
 * but A-Z, a-z, 0-9, (period), and (hyphen). This is because the nameMap
 * and descriptionMap doesn't let us post "dangerous" characters.
 *
 * This cleaning is done in cleanXmlMapToObj.
 *
 * These characters can probably be escaped somehow (not to unicode since
 * backslash is one of those characters not allowed. HTML, like &#x72;, is not allowed either).
 *
 *
 * 
 *
 */


/**
 *	COLORS. Usage: clc.colorname('output')
 *	black		bgBlack		blackBright		bgBlackBright	
 *	red			bgRed		redBright		bgRedBright	
 *	green		bgGreen		greenBright		bgGreenBright	
 *	yellow		bgYellow	yellowBright	bgYellowBright	
 *	blue		bgBlue		blueBright		bgBlueBright	
 *	magenta		bgMagenta	magentaBright	bgMagentaBright	
 *	cyan		bgCyan		cyanBright		bgCyanBright	
 *	white		bgWhite		whiteBright		bgWhiteBright
 * 
 * bold
 * italic
 * underline
 * blink
 * inverse
 * strike
 *
 */


// Dependencies
var request		= require('superagent');
var Q			= require('q');
var fs			= require('fs-extra');
var glob		= require("glob");

var parseString = require('xml2js').parseString;

var clc			= require('cli-color');

var _			= require('underscore');

var argv		= require('minimist')(process.argv.slice(2));
var inquirer	= require("inquirer");

var cli			= require('cli');
var nprint		= require('node-print');
var Table		= require('cli-table');




// My
var PortletKeys = require("./lib/portletkeys.js");



var heading = clc.blue;

var config = {};

// Globals
var globalSites					= [];
var globalSitesWithStructure	= [];
var globalCompanyId				= 0;

var globalStructures			= [];
var globalTemplates				= [];


// Constansts
var fixed = {
	settingsFolder:						'settings',
	projectsFolder:						'projects',

	cacheFolder:						'cache',
	cacheSitesFilename:					'Sites.json',
	cacheSitesWithStructuresFilename:	'SitesWithStructures.json',
	cacheStructuresFilename:			'Structures.json',
	cacheTemplatesFilename:				'Templates.json',
	cacheClassNameIdsByName:			'ClassNameIDsByName.json',
	cacheClassNameIdsById:				'ClassNameIDsById.json',

	txtWorking:							'Working...',

	pathSlugDocumentTypes:				'document_types',
	pathSlugMetadataSets:				'metadata_sets',

	apiPath:							'/api/jsonws/invoke',

	filesEncoding:						'utf8',

	ignoreDDMs:							[
										'WIKI-SOCIAL-FTL',
										'ASSET-TAGS-NAVIGATION-COLOR-BY-POPULARITY-FTL',
										'SITE-MAP-MULTI-COLUMN-LAYOUT-FTL',
										'DOCUMENTLIBRARY-CAROUSEL-FTL',
										'ASSET-CATEGORIES-NAVIGATION-MULTI-COLUMN-LAYOUT-FTL',
										'BLOGS-BASIC-FTL',
										'ASSET-PUBLISHER-RICH-SUMMARY-FTL',
										'LEARNING MODULE METADATA',
										'MARKETING CAMPAIGN THEME METADATA',
										'MEETING METADATA',
										'AUTO_F89C99EC-74A2-4C54-AEB4-472015095F42',
										'AUTO_9AFF1B46-5A06-49B0-A98B-668BCD5DEBCF',
										'AUTO_FDFC496B-939A-42BA-8327-63B392D9CB06',
										'AUTO_B58424F3-CABF-469C-AF9C-6169ABFC39DF',
										'CONTACTS',
										'EVENTS',
										'INVENTORY',
										'ISSUES TRACKING',
										'MEETING MINUTES',
										'TO DO'
										]
};


var globalClassNameIdsByName = [
	{
		filesPath: 'application_display_template/asset_publisher',
		friendlyName: 'ADT - Asset Publisher',
		clazz: 'com.liferay.portlet.asset.model.AssetEntry',
		type: 'template',
		getTemplate: true
	},
	{
		filesPath: 'application_display_template/blogs',
		friendlyName: 'ADT - Blogs',
		clazz: 'com.liferay.portlet.blogs.model.BlogsEntry',
		type: 'template',
		getTemplate: true
	},
	{
		filesPath: 'application_display_template/categories_navigation',
		friendlyName: 'ADT - Categories Navigation',
		clazz: 'com.liferay.portlet.asset.model.AssetCategory',
		type: 'template',
		getTemplate: true
	},
	{
		filesPath: 'application_display_template/documents_and_media',
		friendlyName: 'ADT - Documents and Media',
		clazz: 'com.liferay.portal.kernel.repository.model.FileEntry',
		type: 'template',
		getTemplate: true
	},
	{
		filesPath: 'application_display_template/site_map',
		friendlyName: 'ADT - Site Map',
		clazz: 'com.liferay.portal.model.LayoutSet',
		type: 'template',
		getTemplate: true
	},
	{
		filesPath: 'application_display_template/tags_navigation',
		friendlyName: 'ADT - Tags Navigation',
		clazz: 'com.liferay.portlet.asset.model.AssetTag',
		type: 'template',
		getTemplate: true
	},
	{
		filesPath: 'application_display_template/wiki',
		friendlyName: 'ADT - Wiki',
		clazz: 'com.liferay.portlet.wiki.model.WikiPage',
		type: 'template',
		getTemplate: true
	},
	{
		filesPath: 'journal/templates',
		friendlyName: 'Journal Article Template',
		clazz: 'com.liferay.portlet.dynamicdatamapping.model.DDMStructure',
		type: 'template',
		getTemplate: true
	},
	{
		filesPath: 'journal/structures',
		friendlyName: 'Journal Article Structure',
		clazz: 'com.liferay.portlet.journal.model.JournalArticle',
		type: 'journalStructure'
	},
	{
		filesPath: 'document_and_media',
		friendlyName: 'Document Types',
		clazz: 'com.liferay.portlet.documentlibrary.model.DLFileEntryMetadata',
		type: 'documentAndMedia'
	},
	{
		filesPath: 'internal',
		friendlyName: 'Liferay Internal - RAW Metadata Processor',
		clazz: 'com.liferay.portlet.documentlibrary.util.RawMetadataProcessor'
	},
	{
		filesPath: 'dynamic_data_lists/structures',
		friendlyName: 'Dynamic Data List (DDL) Definition',
		clazz: 'com.liferay.portlet.dynamicdatalists.model.DDLRecordSet'
	},
	{
		friendlyName: 'User site',
		clazz: 'com.liferay.portal.model.User',
		type: 'group',
		containsDDMs: false
	},
	{
		friendlyName: 'Group',
		clazz: 'com.liferay.portal.model.Group',
		type: 'group',
		containsDDMs: true
	},
	{
		friendlyName: 'Organization',
		clazz: 'com.liferay.portal.model.Organization',
		type: 'group',
		containsDDMs: true
	},
	{
		friendlyName: 'Company/Global',
		clazz: 'com.liferay.portal.model.Company',
		type: 'group',
		containsDDMs: true
	}
];

var bolArgs = {
	doSilently: false,
	hasProject: false,
	hasServer: false,
	loadFromCache: false,
	doSaveAllFilesToDisk: false,
	doShowHelp: false,
	temp: true //Debug thing: remove temp
};

var helpArgs = {};


// Debug things
var debugLevel				= 0;

var SEVERITY_NORMAL			= 0;
var SEVERITY_DEBUG			= -1;
var SCREEN_PRINT_INFO		= 0;
var SCREEN_PRINT_SAVE		= 1;
var SCREEN_PRINT_ERROR		= 2;
var SCREEN_PRINT_HEADING	= 3;
var SCREEN_PRINT_FILE		= 4;

// Steps
var STEP_START							= 1;
var STEP_JUST_LOADED_CONFIG				= 2;
var STEP_JUST_READ_ALL_FROM_SERVER		= 3;
var STEP_JUST_SAVED_ALL_FILES_TO_DISK	= 4;
var STEP_JUST_UPLOADED_DDMS				= 5;

router(STEP_START);

/** ************************************************************************ *\
 * 
 * UPLOAD
 * 
\** ************************************************************************ */

function temp() {
	uploadFiles([
		// '/Users/emiloberg/code/test-wcm/journal/structures/Test Structure.xml'
		// '/Users/emiloberg/code/test-wcm/journal/templates/Test Structure.ftl',
		'/Users/emiloberg/code/test-wcm/journal/templates/APA2 Template.ftl',
		'/Users/emiloberg/code/test-wcm/journal/templates/APA3 Template.ftl',
		// '/Users/emiloberg/code/test-wcm/application_display_template/asset_publisher/My Asset Publisher.ftl',
		// '/Users/emiloberg/code/test-wcm/application_display_template/asset_publisher/Second Asset Publisher.ftl'
		// '/Users/emiloberg/code/test-wcm/application_display_template/asset_publisher/Global AP.ftl'
//		'/Users/emiloberg/code/test-wcm/application_display_template/asset_publisher/Rich Summary.ftl'
		]);
//	uploadFiles('/Users/emiloberg/code/test-wcm/application_display_template/asset_publisher/New Asset Publisher.ftl');

//	console.log(getSingleValueFromSitesListByGroupId(10182, 'name'));

}

function uploadSingleFileToServer() {
	console.log('Upload single file');

	var fileFolders = [];

	// TODO: Change so that only files that actually exists (and are changed) shows up.

	// TODO - Se till att vi får med *alla* saker vi kan ladda upp, t.ex. document/media osv.
	for (var i = 0; i < globalClassNameIdsByName.length; i++) {
		if (globalClassNameIdsByName[i].type === 'template' || globalClassNameIdsByName[i].type === 'journalStructure') {
			fileFolders.push({
				name: globalClassNameIdsByName[i].friendlyName,
				value: globalClassNameIdsByName[i].filesPath
				});
		}
	}

	inquirer.prompt([
		{
			type: "list",
			name: "folder",
			message: "What kind of file do you want to upload",
			choices: fileFolders
		}
		], function( typeAnswers ) {
			// TODO - check if folder actually exists.
			fs.readdir(config.filesFolder + '/' + typeAnswers.folder, function (err, files) {
				if (err) {
					throw Error(err);
				}

				inquirer.prompt([
					{
						type: "list",
						name: "file",
						message: "Which file do you want to upload",
						choices: files
					}
					], function( fileAnswers ) {
						uploadFiles([config.filesFolder + '/' + typeAnswers.folder + '/' + fileAnswers.file]);
					}
				);

			});
		}
	);
}

/**
 * Upload file by
 * Takes file as 
 * Based on the file path to the file - figure out what kind of file it is
 * TODO SKRIV HÄR
 *
 */

 /**
 * Upload a structure/template
 *
 * @param <String> path and filename.
 * @return <Object> success.
 */

function uploadFiles(files) {


	var fullPayload = [];

	var preparePayloadPromises = files.map(function(path) {
		return createUploadObject(path);
	});



// TODO: Se till att det här sker sekventiellt istället. Dvs typ typ:
// Testa genom att skicka in 2 st NYA journal templates så att 2 st input-rutan triggas.


// However, if you want to run a dynamically constructed sequence of functions, you'll want something like this:

// var funcs = [foo, bar, baz, qux];

// var result = Q(initialVal);
// funcs.forEach(function (f) {
//     result = result.then(f);
// });
// return result;	



	// TODO: Handle if we get rejects! E.g because there are no structures uploaded
	Q.all(preparePayloadPromises).then(function (uploadObjects) {

		var filteredUploadObjects = [];
		var states = [
			{
				status: 'uptodate',
				heading: 'Already up to date, will not update'
			},
			{
				status: 'update',
				heading: 'Update'
			},
			{
				status: 'create',
				heading: 'Create new'
			}
			];

		// Split the uploadObjects into 3, one with files that are already up to date,
		// one with files that needs updating and one with files that needs to be created,
		// to be able to present it to the user in a nice way (and avoid) updating things,
		// which does not need to be updated.
		for (var x = 0; x < states.length ; x++) {
			filteredUploadObjects = uploadObjects.filter(function(entry) {
				return entry.status == states[x].status;
			});

			states[x].table = new Table({
			head: ['Name', 'Type', 'GrpId', 'Group Name'],
			chars: {
				'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': '',
				'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': '',
				'left': '' , 'left-mid': '' , 'mid': '' , 'mid-mid': '',
				'right': '' , 'right-mid': '' , 'middle': ' '
				},
			style: {
				'padding-left': 2,
				'padding-right': 0,
				'head': ['yellow']
				},
			colWidths: [30, 35, 7]
		});

			for (var i = 0; i < filteredUploadObjects.length; i++) {
				states[x].table.push([
					filteredUploadObjects[i].fileName,
					filteredUploadObjects[i].fileClassObj.friendlyName,
					filteredUploadObjects[i].group.groupId,
					filteredUploadObjects[i].group.name + ' (' + filteredUploadObjects[i].group.type + ')'
				]);
			}

			if (states[x].table.length > 0) {
				writeToScreen('', SEVERITY_NORMAL, SCREEN_PRINT_HEADING);
				writeToScreen(states[x].heading + ' (' + states[x].table.length + ')', SEVERITY_NORMAL, SCREEN_PRINT_HEADING);
				writeToScreen('', SEVERITY_NORMAL, SCREEN_PRINT_HEADING);
				writeToScreen(states[x].table.toString(), SEVERITY_NORMAL, SCREEN_PRINT_INFO);
				writeToScreen('', SEVERITY_NORMAL, SCREEN_PRINT_HEADING);
			}

		}

		// Check to see that we actually have things which needs to be updated/created
		if (states[1].table.length > 0 || states[2].table.length > 0 ) {
			inquirer.prompt([
				{
					type: "list",
					name: "confirm",
					message: "Do you want to send this to the server?",
					choices: [
						{
							name: 'Send to server',
							value: true
						},
						{
							name: 'Abort',
							value: false
						}
					]
				}
				], function( answers ) {
					if (answers.confirm === true) {

						// Remove every file which is already to date.
						uploadObjects = uploadObjects.filter(function(entry) {
							return entry.status != 'uptodate';
						});
						
						// Create a batch of all payloads.
						for (var i = 0; i < uploadObjects.length; i++) {
							fullPayload.push(uploadObjects[i].payload);
						}

						getData('[' + fullPayload.join() + ']').then(function (resp) {
							updateGlobalStructureTemplateWithNew(resp);
							writeToScreen('', SEVERITY_NORMAL, SCREEN_PRINT_SAVE);
							writeToScreen('Files updated/created!', SEVERITY_NORMAL, SCREEN_PRINT_SAVE);
						}, function (e) {
							console.dir(e);
							lrException('Could not upload DDMs to server!\n');
						});

					} else {
						router(STEP_JUST_UPLOADED_DDMS);
					}
				}
			);


		} else {
			writeToScreen('Every file is already up to date\n', SEVERITY_NORMAL, SCREEN_PRINT_SAVE);
			router(STEP_JUST_UPLOADED_DDMS);
		}

	});
}

/**
 * Updates globalStructures and globalTemplates with the 
 * newly created or updated theme/structure, and save
 * to cache. 
 *
 */
function updateGlobalStructureTemplateWithNew(retObjs) {
	for (var i = 0; i < retObjs.length; i++) {
		if (retObjs[i].hasOwnProperty('templateKey')) {
			globalTemplates = globalTemplates.filter(function(entry) {
				return entry.templateKey != retObjs[i].templateKey;
			});
			globalTemplates.push(retObjs[i]);
			saveToCache(globalTemplates, fixed.cacheTemplatesFilename);
		} else if (retObjs[i].hasOwnProperty('structureKey')) {
			globalStructures = globalStructures.filter(function(entry) {
				return entry.structureKey != retObjs[i].structureKey;
			});
			globalStructures.push(retObjs[i]);
			saveToCache(globalStructures, fixed.cacheStructuresFilename);
		}
	}
}

function createUploadObject(file) {

	var deferred = Q.defer();

	var fileClassObj = getClassNameIdFromFilePath(file);
	var fileName = filenameAndPathToFilename(file);
	var fileLanguageType = filenameToLanguageType(file);

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

	var answersSite;
	var answersMetadata;
	var answersStructure;

	// If file actually is a DDM
	if (fileClassObj != -1) {

		returnObj.fileClassObj = fileClassObj;
		returnObj.fileName = fileName;

		try {
			newScript = fs.readFileSync(file, {encoding: fixed.filesEncoding});
		} catch(catchErr) {
			returnObj.exception = 'Could not read file';
			deferred.reject(returnObj);
			return deferred.promise;
		}

		// point globalTemplates or globalStructures to currentDDMs, depending
		// on if it's a template or structure we're dealing with.
		if(fileClassObj.type === 'template') {
			currentDDMs = globalTemplates;
		} else if (fileClassObj.type === 'journalStructure') {
			currentDDMs = globalStructures;
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

			// http://localhost:8080/api/jsonws?signature=%2Fjournaltemplate%2Fadd-template-11-groupId-templateId-autoTemplateId-structureId-nameMap-descriptionMap-xsl-formatXsl-langType-cacheable-serviceContext

			returnObj.status = 'create';


			if (returnObj.fileClassObj.clazz === 'com.liferay.portlet.dynamicdatamapping.model.DDMStructure') {
				// The new file is a journal template which needs to be bound to a journal *structure*
				// Therefor we need to figure out which sites has journal article structures.

				journalStructureClassNameId = getClassNameIdFromClazz('com.liferay.portlet.journal.model.JournalArticle');

				// Loop *every* site
				for (var i = 0; i < globalSites.length; i++) {

					// Only let sites which may contain DDMs through
					// Like user sites we don't allow to contain DDMs and ar therefor ignoring them.
					if(getContainsDDMsFromClassNameId(globalSites[i].classNameId)) {

						// Create an array with entries for each site which the user may
						// upload the journal template to. To be able to upload a template
						// that site needs to have at least 1 journal structure (to which
						// we can bind the template).
						possibleStructures[i] = globalStructures.filter(function(entry) {
							if(entry.groupId === globalSites[i].groupId) {
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
								name: globalSites[i].name + ' [' + getFriendlyNameFromClassNameId(globalSites[i].classNameId) + '] (' + possibleStructures[i].length + ')' ,
								value: {
									groupId: globalSites[i].groupId,
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

				writeToScreen('', SEVERITY_NORMAL, SCREEN_PRINT_HEADING);
				writeToScreen('"' + returnObj.fileName + '" (Type: ' + returnObj.fileClassObj.friendlyName + ')', SEVERITY_NORMAL, SCREEN_PRINT_FILE);
				writeToScreen('', SEVERITY_NORMAL, SCREEN_PRINT_HEADING);

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
										returnObj.group.description		= getSingleValueFromSitesListByGroupId(answersSite.siteSelection.groupId, 'description');
										returnObj.group.name			= getSingleValueFromSitesListByGroupId(answersSite.siteSelection.groupId, 'name');
										returnObj.group.type			= getFriendlyNameFromClassNameId(getSingleValueFromSitesListByGroupId(answersSite.siteSelection.groupId, 'classNameId'));
										returnObj.group.friendlyURL		= getSingleValueFromSitesListByGroupId(answersSite.siteSelection.groupId, 'friendlyURL');
										returnObj.group.groupId			= answersSite.siteSelection.groupId;

										payload = {
											groupId: answersSite.siteSelection.groupId,
											classNameId: getClassNameIdFromClazz('com.liferay.portlet.dynamicdatamapping.model.DDMStructure'),
											classPK: answersStructure.structureSelection.structureId,
											nameMap: strToJsonMap(returnObj.fileName),
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
				returnObj.group.description = getSingleValueFromSitesListByGroupId(oldDDMObject.groupId, 'description');
				returnObj.group.name = getSingleValueFromSitesListByGroupId(oldDDMObject.groupId, 'name');
				returnObj.group.type = getFriendlyNameFromClassNameId(getSingleValueFromSitesListByGroupId(oldDDMObject.groupId, 'classNameId'));
				returnObj.group.friendlyURL = getSingleValueFromSitesListByGroupId(oldDDMObject.groupId, 'friendlyURL');
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
				xmlMapToObj(oldDDMObject.name, 'Name')
				.then(function (resName) {
					payload.nameMap = resName;
				})
				.then(xmlMapToObj(oldDDMObject.description, 'Description')
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
				returnObj.group.description = getSingleValueFromSitesListByGroupId(oldDDMObject.groupId, 'description');
				returnObj.group.name = getSingleValueFromSitesListByGroupId(oldDDMObject.groupId, 'name');
				returnObj.group.type = getFriendlyNameFromClassNameId(getSingleValueFromSitesListByGroupId(oldDDMObject.groupId, 'classNameId'));
				returnObj.group.friendlyURL = getSingleValueFromSitesListByGroupId(oldDDMObject.groupId, 'friendlyURL');
				returnObj.group.groupId = oldDDMObject.groupId;

				// Populate payload with data from old structure (things we aren't updating)
				payload = {
					structureId: oldDDMObject.structureId,
					parentStructureId: oldDDMObject.parentStructureId,
					xsd: newScript
				};

				// Populate payload with data from old template (things we aren't updating)
				// but we need to make it into a Map which Liferay wants.
				xmlMapToObj(oldDDMObject.name, 'Name')
				.then(function (resName) {
					payload.nameMap = resName;
				})
				.then(xmlMapToObj(oldDDMObject.description, 'Description')
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

}

function strToJsonMap(str) {
	var ret = {};
	str = str.trim();
	if (str.length > 0) {
		ret[config.defaultLocale] = str;
	} else {
		ret = {};
	}
	return ret;
}

function cleanXmlMapToObj(str) {
	str = str.replace(/[^a-zA-Z0-9 \.-]/g, "");
	return str;
}

function xmlMapToObj(xml, type){


	var deferred = Q.defer();

	if (xml.length > 0) {
		parseString(xml, function (err, result) {
			if (err) {
				lrException('Could not parse XML for ' + type);
			}

			var out = {};
			var prop = '';
			var val = '';

			if(result.root[type] === undefined) {
				deferred.resolve(null);
			} else {
				for (var i = 0; i < result.root[type].length; i++) {
					val = result.root[type][i]['_'];
					val = cleanXmlMapToObj(val);
					prop = result.root[type][i]['$']['language-id'];
					out[prop] = val;
				}
				deferred.resolve(out);
			}
		});
	} else {
		deferred.resolve(null);
	}

	return deferred.promise;
}



function getClassNameIdFromFilePath(file) {
	// TODO - Se till att vi får med *alla* saker vi kan ladda upp, t.ex. document/media osv.
	file = file.split('/');
	var filesPath = file[file.length - 3] + '/' + file[file.length - 2];

	var classNameIds = globalClassNameIdsByName.filter(function(entry) {
		return entry.filesPath === filesPath;
	});

	if(classNameIds.length === 1) {
		return classNameIds[0];
	} else {
		return -1;
	}
}

/** ************************************************************************ *\
 * 
 * MAIN MENU
 * 
\** ************************************************************************ */


function showMainMenu() {

	// TODO, remove temp-if
	if (bolArgs.temp) {
		bolArgs.temp = false;
		temp();
	} else if (bolArgs.doSaveAllFilesToDisk) {
		saveEverythingToFile();
	} else {
		if (!bolArgs.doSilently) {
			console.log('');
			inquirer.prompt([
				{
					type: "list",
					name: "mainMenu",
					message: "What do you want to do?",
					choices: [
						{
							name: 'Watch (TODO)',
							value: ''
						},
						{
							name: 'Download All',
							value: 'saveAllFilesToDisk'
						},
						{
							name: 'Upload Single (TODO)',
							value: 'uploadSingleFileToServer'
						},
						{
							name: 'Upload All (TODO)',
							value: 'uploadAllFilesToServer'
						},
						{
							name: 'Create new project',
							value: 'createNewProject'
						},
						new inquirer.Separator(),
						{
							name: 'Quit',
							value: 'quit'
						}
					]
				}
				], function( answers ) {
					if (answers.mainMenu === 'uploadSingleFileToServer') {
						uploadSingleFileToServer();
					} else if (answers.mainMenu === 'saveAllFilesToDisk') {
						saveEverythingToFile();
					} else if (answers.mainMenu === 'createNewProject') {
						createProject();
					} else {
						console.log('Bye bye!');
					}
				}
			);
		}
	}
}


/** ************************************************************************ *\
 * 
 * CHAINS
 * 
\** ************************************************************************ */
function chainFetchAllFromServer() {
	writeToScreen('Getting data from server', SEVERITY_NORMAL, SCREEN_PRINT_INFO);
	Q.resolve()
	.then(clearCache)
	.then(getClassNameIds)
	.then(getUserSites)
	.then(getCompanyGroupFromCompanyId)
	.then(getStructuresFromListOfSites)
	.then(getTemplates)
	.done(function () {
		router(STEP_JUST_READ_ALL_FROM_SERVER);
	}, doneRejected);
}

function chainReadFromCache() {
	writeToScreen('Reading data from Cache', SEVERITY_NORMAL, SCREEN_PRINT_INFO);
	Q.resolve()
	.then(getAllCache)
	.done(function () {
		router(STEP_JUST_READ_ALL_FROM_SERVER);
	}, doneRejected);
}

function saveArgs() {

	// This does not need to be here. It's just here because it's easier to
	// update when arguments are updated.
	helpArgs = [
		{
			arg: '--project <project-name>',
			help: 'Load a project'
		},
		{
			arg: '--server <server-name>',
			help: 'Load a server in project'
		},
		{
			arg: '-c',
			help: 'Use data from cache (and don\'t download it from server)'
		},
		{ arg: '', help: '' },
		{
			arg: '-d',
			help: 'Save all files to disk'
		},
		{ arg: '', help: '' },
		{
			arg: '-h, --help',
			help: 'Show this help'
		}
	];

	if (argv.hasOwnProperty('project')) {
		if (argv.project.length > 0) { bolArgs.hasProject = true; }
	}

	if (argv.hasOwnProperty('server')) {
		if (argv.server.length > 0) { bolArgs.hasServer = true;}
	}

	if (argv.hasOwnProperty('c')) {
		bolArgs.loadFromCache = true;
	}

	if (argv.hasOwnProperty('d')) {
		bolArgs.doSaveAllFilesToDisk = true;
		bolArgs.doSilently = true;
	}

	if (argv.hasOwnProperty('h') || argv.hasOwnProperty('help')) {
		bolArgs.doShowHelp = true;
	}


}

/** ************************************************************************ *\
 * 
 * STEPPING THINGS
 * 
\** ************************************************************************ */

function showHelp() {
	// TODO - ADD HELP HERE
	console.log();
	console.log('This app may be runned with the following arguments:');
	console.log();

	for (var x = 0; x < helpArgs.length; ++x) {
		nprint.pf('%30s   %10s', helpArgs[x].arg, helpArgs[x].help);
	}

}

function router(step) {

	if (step === STEP_START) {
		saveArgs();
	}

	if (bolArgs.doShowHelp) {
		showHelp();
	} else {
		if (step === STEP_START) {
			Q.resolve()
			.then(selectProject);
		} else if (step === STEP_JUST_LOADED_CONFIG) {
			if (bolArgs.loadFromCache) {
				chainReadFromCache();
			} else {
				chainFetchAllFromServer();
			}
		} else if (step === STEP_JUST_READ_ALL_FROM_SERVER ) {
			showMainMenu();
		} else if (step === STEP_JUST_SAVED_ALL_FILES_TO_DISK ) {
			showMainMenu();
		} else if (step === STEP_JUST_UPLOADED_DDMS ) {
			showMainMenu();
		} else {
			lrException('Unknown next step!');
		}
	}
}


/** ************************************************************************ *\
 * 
 * CACHE
 * 
\** ************************************************************************ */
function getAllCache() {
	// Todo
	// Add error handling for missing files 

	globalSites					= readFromCache(fixed.cacheSitesFilename);
	globalSitesWithStructure	= readFromCache(fixed.cacheSitesWithStructuresFilename);
	globalStructures			= readFromCache(fixed.cacheStructuresFilename);
	globalTemplates				= readFromCache(fixed.cacheTemplatesFilename);
	globalClassNameIdsByName	= readFromCache(fixed.cacheClassNameIdsByName);
}

function readFromCache(filename) {
	// Todo
	// Add error handling for non json files
	return fs.readJsonSync(fixed.cacheFolder + '/' + filename);
}

function saveToCache(e, filename) {
	fs.outputFileSync(fixed.cacheFolder + '/' + filename, JSON.stringify(e));
}

/** ************************************************************************ *\
 * 
 * Save To File
 * 
\** ************************************************************************ */
function saveEverythingToFile() {
	writeToScreen('Saving everything to disk', SEVERITY_NORMAL, SCREEN_PRINT_INFO);
	saveStructuresAndTemplatesToFile(globalTemplates);
	saveStructuresAndTemplatesToFile(globalStructures);
	bolArgs.doSaveAllFilesToDisk = false;
	router(STEP_JUST_SAVED_ALL_FILES_TO_DISK);
}

function saveStructuresAndTemplatesToFile(e) {
	var filePath;
	var fileContent;
	var outCounter = {};

	var idDLFileEntryMetadata = getClassNameIdFromClazz('com.liferay.portlet.documentlibrary.model.DLFileEntryMetadata');
	var friendlyName;
	var filesPath;


	for (var i = 0; i < e.length; ++i) {
			filePath = config.filesFolder + '/' + getFilesPathFromClassNameId(e[i].classNameId);

			// Figure out what kind of data we're dealing with and get a filename/path and the content.
			if (e[i].hasOwnProperty('storageType') && e[i].hasOwnProperty('xsd')) {
				
				fileContent = e[i].xsd;

				// If the class is DLFileEntryMetadata, then check 'type'. 
				// Depending on type, set different save paths for 'Document Type' and 'Metadata Set'
				if (e[i].classNameId === idDLFileEntryMetadata) {
					if (e[i].type === 1) {
						filePath = filePath + '/' + fixed.pathSlugDocumentTypes + '/' + e[i].nameCurrentValue + '.' + e[i].storageType;
					} else {
						filePath = filePath + '/' + fixed.pathSlugMetadataSets + '/' + e[i].nameCurrentValue + '.' + e[i].storageType;
					}
				} else {
					filePath = filePath + '/' + e[i].nameCurrentValue + '.' + e[i].storageType;
				}


			} else if (e[i].hasOwnProperty('script') && e[i].hasOwnProperty('language')) {
				filePath = filePath + '/' + e[i].nameCurrentValue + '.' + e[i].language;
				fileContent = e[i].script;
			} else {
				throw Error('Could not find content in entity ' + e[i].classNameId + ' (Script needs to be updated with this classNameId)');
			}

			// Save file
			fs.outputFileSync(filePath, fileContent);

			//  Count the different files to be able to tell the user what's saved.

			friendlyName = getFriendlyNameFromClassNameId(e[i].classNameId);

			if (outCounter.hasOwnProperty(friendlyName)) {
				outCounter[friendlyName] = outCounter[friendlyName] + 1;
			} else {
				outCounter[friendlyName] = 1;
			}
	}

	// Echo what has been saved
	var outKeys = _.keys(outCounter);
	for (var x = 0; x < outKeys.length; ++x) {
		nprint.pf('%10s   %10s', outCounter[outKeys[x]], outKeys[x]);
	}
}


/** ************************************************************************ *\
 * 
 * Get Complete list of Sites 
 * 
\** ************************************************************************ */
function getUserSites() {
	writeToScreen('Downloading list of sites', SEVERITY_NORMAL, SCREEN_PRINT_INFO);
	return getData('{"/group/get-user-sites": {}}').then(
		function (e) {
			if(e.length === 0) {
				throw Error('Could not find any sites');
			} else {
				globalSites = e;
				globalCompanyId = e[0].companyId;
			}
		});
}

function getCompanyGroupFromCompanyId() {
	writeToScreen('Downloading company site', SEVERITY_NORMAL, SCREEN_PRINT_INFO);
	return getData('{"/group/get-company-group": {"companyId": "' + globalCompanyId + '"}}').then(
		function (e) {
			// Dirty way of adding the global site to the list of sites.
			globalSites = JSON.parse('[' + JSON.stringify(globalSites).substr(1).slice(0, -1) + ',' + JSON.stringify(e) + ']');
			saveToCache(globalSites, fixed.cacheSitesFilename);
		});
}


/** ************************************************************************ *\
 * 
 * TEMPLATES
 * 
\** ************************************************************************ */
function getTemplates() {
	writeToScreen('Downloading templates', SEVERITY_NORMAL, SCREEN_PRINT_INFO);
	var payload = [];

	//boll

	for (var i = 0; i < globalSites.length; ++i) {
		for (var ii = 0; ii < globalClassNameIdsByName.length; ii++) {
			if (globalClassNameIdsByName[ii].getTemplate) {
				payload.push('{"/ddmtemplate/get-templates": {"groupId": ' + globalSites[i].groupId + ', "classNameId": ' + globalClassNameIdsByName[ii].id + '}}');
			}
		}
	}

	return getData('[' + payload.join() + ']').then(
		function (e) {
			var curTemplate = [];
			for (var y = 0; y < e.length; ++y) {
				for (i = 0; i < e[y].length; ++i) {

					// Check if there's a DDM we should ignore
					if(!_.contains(config.ignoreDDMs, e[y][i].templateKey)) {
						globalTemplates.push(e[y][i]);
					}
				}
			}
			saveToCache(globalTemplates, fixed.cacheTemplatesFilename);
		});
}


/** ************************************************************************ *\
 * 
 * CLASS NAME IDS
 * 
\** ************************************************************************ */

function getClassNameIds() {
	writeToScreen('Downloading id\'s', SEVERITY_NORMAL, SCREEN_PRINT_INFO);

	var payload = [];
	for (var i = 0; i < globalClassNameIdsByName.length; i++) {
		payload.push('{"/classname/fetch-class-name-id": {"clazz": ' + globalClassNameIdsByName[i].clazz + '}}');
	}

	return getData('[' + payload.join() + ']').then(
			function (e) {

				for (var i = 0; i < globalClassNameIdsByName.length; i++) {
					globalClassNameIdsByName[i].id = e[i];
				}

				saveToCache(globalClassNameIdsByName, fixed.cacheClassNameIdsByName);
			});
}


/** ************************************************************************ *\
 * 
 * STRUCTURES
 * 
\** ************************************************************************ */
function getStructuresFromListOfSites() {
	writeToScreen('Downloading structures', SEVERITY_NORMAL, SCREEN_PRINT_INFO);

	var sitesList = [];
	var i;
	for (i = 0; i < globalSites.length; ++i) {
		sitesList.push(globalSites[i].groupId);
	}

	return getData('{"/ddmstructure/get-structures": {"groupIds": [' + sitesList.join() + ']}}').then(
		function (e) {
 
			// Remove every entry (therer is only 1) with className 
			// 'PortletDocumentlibraryUtilRawMetadataProcessor'. 
			// This is a Liferay internal structure which is used to parse 
			// document metadata and display it in the Document and Media Portlet.
			var idRawMetaDataProcessor = getClassNameIdFromClazz('com.liferay.portlet.documentlibrary.util.RawMetadataProcessor');
			e = e.filter(function(entry) {
				return entry.classNameId != idRawMetaDataProcessor;
			});
     
			// Check if there's a DDM we should ignore
			e = e.filter(function(entry) {
				if(_.contains(config.ignoreDDMs, entry.structureKey)) {
					return false;
				} else {
					return true;
				}
			});

			globalStructures = e;
			saveToCache(globalStructures, fixed.cacheStructuresFilename);

			// Save a list of all the sites which have Structures.
			for (i = 0; i < e.length; ++i) {
				if (globalSitesWithStructure.indexOf(e[i].groupId) < 0) {
					globalSitesWithStructure.push(e[i].groupId);
				}
			}
			saveToCache(globalSitesWithStructure, fixed.cacheSitesWithStructuresFilename);
		});
}


/** ************************************************************************ *\
 * 
 * CREATE / SELECT PROJECT
 * 
\** ************************************************************************ */

function selectProject() {

	if (bolArgs.hasProject) {
		// If project is supplied in arguments
		var projectSettingsPath = fixed.settingsFolder + '/' + fixed.projectsFolder + '/' + argv.project.toLowerCase() + '.json';
		if (fs.existsSync(projectSettingsPath)) {
			loadProject(argv.project.toLowerCase() + '.json');
		} else {
			lrException('Project \'' + argv.project + '\' does not exist.');
		}

	} else {
		// If project is not supploed in arguments
		var globOptions = {
			cwd: fixed.settingsFolder + '/' + fixed.projectsFolder
		};

		glob('*.json', globOptions, function (err, files) {
			if(err) {
				lrException(err);
			}

			if (files.length === 0) {
				console.log();
				console.log(heading('Looks like it\'s the first time you run this App'));
				console.log();

				inquirer.prompt([{
					type: "list",
					name: "proceed",
					message: "What do you want to do?",
					choices: [
						{
							name: 'Create a new project',
							value: 'new'
						},
						{
							name: 'Quit',
							value: 'quit'
						}
					]
				}
				], function( answers ) {
					if (answers.proceed === 'new') {
						createProject();
					}
				});


			} else {
				var projectName;
				var projects = [];
				for (var i = 0; i < files.length; ++i) {
					projectName = filenameAndPathToFilename(files[i]);
					projects.push({
						name: projectName,
						value: files[i]
					});
				}

				projects.push(new inquirer.Separator());
				projects.push({
					name: "Create new project",
					value: "new"
				});

				inquirer.prompt([{
					type: "list",
					name: "selectProject",
					message: "Which project do you want to work with?",
					choices: projects
				}
				], function(answers) {
					if (answers.selectProject === 'new') {
						createProject();
					} else {
						loadProject(answers.selectProject);
					}
				});

			}

		});

	}
		
}

function loadProject(projectJson) {
	fs.readJson(fixed.settingsFolder + '/' + fixed.projectsFolder + '/' + projectJson, function(er, project) {
		if(er) {
			lrException(er);
		}

		var hosts = [];

		config.defaultLocale = project.defaultLocale;
		config.filesFolder = project.filesPath;
		config.ignoreDDMs = project.ignoreDDMs;
		
		// Check if user supplied a project as an argument or if we should present a gui.
		if (bolArgs.hasProject) {
			if (project.hosts.length === 1) {
				// If user supplied a project and there's only one server in the config
				// load that config
				config.host			= project.hosts[0].host;
				config.username		= project.hosts[0].username;
				config.password		= project.hosts[0].password;
				router(STEP_JUST_LOADED_CONFIG);
			} else {
				// If the user supplied a project but there's more than one,
				// server in the config file, check if the user also supplied an
				// argument for which server to use.
				if (bolArgs.hasServer === true) {
					var currentServer = project.hosts.filter(function(server) {
						return server.name === argv.server;
					});

					if (currentServer.length > 0) {
						config.host			= currentServer[0].host;
						config.username		= currentServer[0].username;
						config.password		= currentServer[0].password;
						router(STEP_JUST_LOADED_CONFIG);
					} else {
						lrException('Server \'' + argv.server + '\' does not exist');
					}
				} else {
					lrException('If a project (--project) with more than one server is supplied\nyou need to supply a server (--server) as well');
				}

			}
		} else {
			if (project.hosts.length === 1) {
				config.host			= project.hosts[0].host;
				config.username		= project.hosts[0].username;
				config.password		= project.hosts[0].password;
				router(STEP_JUST_LOADED_CONFIG);
			} else {
				for (var i = 0; i < project.hosts.length; ++i) {
					hosts.push({
						name: project.hosts[i].name,
						value: {
							host: project.hosts[i].host,
							username: project.hosts[i].username,
							password: project.hosts[i].password
						}
					});
				}

				inquirer.prompt([{
					type: "list",
					name: "selectHosts",
					message: "Which host do you want to work with?",
					choices: hosts
				}
				], function(answers) {
					config.host			= answers.selectHosts.host;
					config.username		= answers.selectHosts.username;
					config.password		= answers.selectHosts.password;

					router(STEP_JUST_LOADED_CONFIG);
				});
			}
		}



	});
}

function createProject() {

	var hostsOut = [];
	var retValue = true;

	console.log();
	console.log(heading('Initializing a New Project'));
	console.log('    Need some data to set up the project:');
	console.log('    - Project Name. You\'ll use this every time you run the script. Pick something short.');
	console.log('    - The path to the DDM files (structures, templates, etc) on your local machine. ');
	console.log('      Folder will be created if path does not exist. ');
	console.log('      This is the folder you want to check-in to your version control system.');
	console.log('    - Whether we should upload/download Liferay default DDMs or not');
	console.log();
	console.log('      Settings will be saved to ' + clc.yellow(fixed.settingsFolder + '/' + fixed.projectsFolder + '/projectname.json'));
	console.log('      and may be edited at any time');
	console.log();

	// Define Project Questions
	var questionsProject = [
		{
			type: "input",
			name: "projectName",
			message: "Project Short Name",
			validate: function( value ) {
				var pass = value.match(/^[a-z0-9\-]{1,15}$/i);
				if (pass) {
					if (fs.existsSync(fixed.settingsFolder + '/' + fixed.projectsFolder + '/' + value.toLowerCase() + '.json')) {
						return "Project named '" + value + "' already exists";
					} else {
						return true;
					}
				} else {
					return "Project name must be maximum 15 characters and only contain alfanumeric characters and underscore";
				}
			},
			filter: function(value) {
				return value.trim();
			}
		},
		{
			type: "input",
			name: "filesPath",
			message: "Path to files on this machine",
			filter: function(value) {
				return removeTrailingSlash(value);
			}
		},
		{
			type: "input",
			name: "defaultLocale",
			message: "Default locale. Just press enter for",
			default: "en_US",
			validate: function( value ) {
				var pass = value.match(/^[a-z\_]{2}\_[A-Z]{2}$/);
				if (pass) {
					return true;
				} else {
					return "Locale must be by the standard \"en_US\"";
				}
			},
			filter: function(value) {
				return value.trim();
			}
		},
		{
			type: "list",
			name: "ignoreLRDefault",
			message: "Should I handle or ignore Liferay default templates/structures?",
			choices: [
				{
					name: 'Include Liferay Defaults',
					value: false
				},
				{
					name: 'Ignore Liferay Defaults',
					value: true
				}
			]
		}
	];

	// Ask Project Questions
	inquirer.prompt( questionsProject, function(answersProject) {

		console.log();
		console.log(heading('Add your first server'));
		console.log('    The URL, Username and Password to a Liferay Server (URL may be http://localhost)');
		console.log('    You may add more servers after this.');
		console.log();

		// Define Hosts Questions
		var questionsHosts = [
			{
				type: "input",
				name: "name",
				message: "Host Name (e.g 'prod1' or 'local-dev'):",
				validate: function( value ) {
					var pass = value.match(/^[a-z0-9\-]{1,15}$/i);
					if (pass) {
						retValue = true;
						for (var i = 0; i < hostsOut.length; i++) {
							if (hostsOut[i].name.toLowerCase() === value.toLowerCase()) {
								retValue = 'Host name already exists, choose another one';
							}
						}
						return retValue;
					} else {
						return "Host name must be maximum 15 characters and only contain alfanumeric characters and underscore";
					}
				},
				filter: function(value) {
					return value.trim();
				}
			},
			{
				type: "input",
				name: "host",
				message: "Liferay Host (URL):",
				filter: function(value) {
					return removeTrailingSlash(value.trim());
				}
			},
			{
				type: "input",
				name: "username",
				message: "Lifray Username",
				filter: function(value) {
					return value.trim();
				}
			},
			{
				type: "input",
				name: "password",
				message: "Liferay Password",
				filter: function(value) {
					return value.trim();
				}
			}
		];

		// Ask Hosts Questions
		function askForHosts() {
			inquirer.prompt(questionsHosts, function(answersHosts) {

				// Check if connection works
				var deferred = Q.defer();
				writeToScreen('Testing connection', SEVERITY_NORMAL, SCREEN_PRINT_INFO);
				getData('{"/portal/get-build-number": {}}', true, answersHosts.host, answersHosts.username, answersHosts.password)
				.then(function (e) {
					writeToScreen('Connection okay!', SEVERITY_NORMAL, SCREEN_PRINT_INFO);
					// Resolve Promise if connection Works
					deferred.resolve();
				}, function (e) {
					// If connection didn't work, ask if user want's to save it anyway.
					writeToScreen('Could not establish connection (' + e + ')', SEVERITY_NORMAL, SCREEN_PRINT_ERROR);

					inquirer.prompt([{
						type: "list",
						name: "proceed",
						message: "What do you want to do?",
						choices: [
							{
								name: 'Re-enter the server information',
								value: 'reenter'
							},
							{
								name: 'Save configuration, even though connection failed',
								value: 'save'
							}
						]
					}
					], function( answers ) {
						// Check if user wanted to re-enter the information of save it anyways
						if (answers.proceed === 'reenter') {
							// If the user wants to re-enter the information,
							// set the current answers as default answers for the new questions,
							// and then ask the new question.
							writeToScreen('', SEVERITY_NORMAL, SCREEN_PRINT_INFO);
							writeToScreen('Previously entered values within parentheses\nJust press <enter> if you want to leave the field unchanged', SEVERITY_NORMAL, SCREEN_PRINT_INFO);
							writeToScreen('', SEVERITY_NORMAL, SCREEN_PRINT_INFO);

							questionsHosts[0].default = answersHosts.name;
							questionsHosts[1].default = answersHosts.host;
							questionsHosts[2].default = answersHosts.username;
							questionsHosts[3].default = answersHosts.password;

							askForHosts();
						} else {
							// If the user wants to save the information, even though a connection
							// couldn't be made, just resolve this and go to next step.
							deferred.resolve();
						}
					});

					return deferred.promise;


				})
				.done(function (e) {
					// Ask if the user wants to add another server.
					inquirer.prompt([{
						type: "list",
						name: "askAgain",
						message: "Do you want to enter another server",
						choices: [
							{
								name: 'Yes',
								value: true
							},
							{
								name: 'No',
								value: false
							}
						]
					}
					], function(answersAskAgain) {
						// Save the just added server to array
						hostsOut.push(answersHosts);

						if (answersAskAgain.askAgain) {
							// If the user wants to add another server
							questionsHosts.forEach(function(obj){ delete obj.default; });
							console.log();
							console.log(heading('Add your ') + clc.yellow(stringifyNumber(hostsOut.length + 1)) + heading(' server') );
							console.log();
							askForHosts();
						} else {
							// If the user don't want to add another server, save the configuration to file
							// and send the user to the 'Select Projects' screen.

							// Append hosts
							answersProject.hosts = hostsOut;

							// Add templates to ignore.
							if (answersProject.ignoreLRDefault) {
								answersProject.ignoreDDMs = fixed.ignoreDDMs;
							} else {
								answersProject.DONTignoreDDMs = fixed.ignoreDDMs;
							}
							delete answersProject.ignoreLRDefault;

							fs.outputFileSync(fixed.settingsFolder + '/' + fixed.projectsFolder + '/' + answersProject.projectName.toLowerCase() + '.json', JSON.stringify(answersProject, null, "  "));
							writeToScreen('', SEVERITY_NORMAL, SCREEN_PRINT_SAVE);
							writeToScreen('Project created!', SEVERITY_NORMAL, SCREEN_PRINT_SAVE);
							writeToScreen('Settings saved to ' + fixed.settingsFolder + '/' + fixed.projectsFolder + '/' + answersProject.projectName.toLowerCase() + '.json', SEVERITY_NORMAL, SCREEN_PRINT_SAVE);
							writeToScreen('', SEVERITY_NORMAL, SCREEN_PRINT_SAVE);
							selectProject();
						}
					});
				});
			});
		}
		// ask for Hosts the first time.
		askForHosts();
	});
}

/** ************************************************************************ *\
 * 
 * Bits 'n' Pieces
 * 
\** ************************************************************************ */

function getSingleValueFromSitesListByGroupId(groupId, prop) {
	var ret = [];
	ret = globalSites.filter(function(entry) {
		return entry.groupId == groupId;
	});

	if (ret.length === 1) {
		return ret[0][prop];
	} else {
		return undefined;
	}
}

function getTemplatesSingleValueByPropValue(searchProperty, matchValue, returnProperty) {
	var ret = [];
	ret = globalSites.filter(function(entry) {
		return entry[searchProperty] == matchValue;
	});

	if (ret.length === 1) {
		return ret[0][returnProperty];
	} else {
		return undefined;
	}
}

function getClassNameIdFromClazz(clazz) {
	var ret = [];
	ret = globalClassNameIdsByName.filter(function(entry) {
		return entry.clazz == clazz;
	});

	if (ret.length === 1) {
		return ret[0].id;
	} else {
		return undefined;
	}
}

function getFilesPathFromClassNameId(classNameId) {
	var ret = [];
	ret = globalClassNameIdsByName.filter(function(entry) {
		return entry.id == classNameId;
	});

	if (ret.length === 1) {
		return ret[0].filesPath;
	} else {
		return undefined;
	}
}

function getFriendlyNameFromClassNameId(classNameId) {
	var ret = [];
	ret = globalClassNameIdsByName.filter(function(entry) {
		return entry.id == classNameId;
	});

	if (ret.length === 1) {
		return ret[0].friendlyName;
	} else {
		return undefined;
	}
}

function getContainsDDMsFromClassNameId(classNameId) {
	var ret = [];
	ret = globalClassNameIdsByName.filter(function(entry) {
		return entry.id == classNameId;
	});

	if (ret.length === 1) {
		return ret[0].containsDDMs;
	} else {
		return undefined;
	}
}


function removeTrailingSlash(str) {
	if (str.charAt(str.length - 1) == "/") str = str.substr(0, str.length - 1);
	return str;
}

function filenameAndPathToFilename(path, showExtension) {
	showExtension = typeof showExtension !== 'undefined' ? showExtension : false;
	path = path.substr(path.lastIndexOf('/')+1);
	if (!showExtension && path.indexOf('.') > 0) {
		path = path.substr(0, path.lastIndexOf('.'));
	}
	return path;
}

function filenameToLanguageType(filename) {
	if (filename.indexOf('.') > 0) {
		languageType = filename.substr(filename.indexOf('.')+1).toLowerCase();

		if (languageType === 'ftl') {
			return 'ftl';
		} else if (languageType === 'vm') {
			return 'vm';
		} else {
			lrException('Could not extract Language Type from filename \'' + filename + '\'');
		}
	} else {
		lrException('Could not extract Language Type from filename \'' + filename + '\'');
	}


}

function stringifyNumber(n) {
	var special = ['zeroth','first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelvth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth'];
	var deca = ['twent', 'thirt', 'fourt', 'fift', 'sixt', 'sevent', 'eight', 'ninet'];
	if (n < 20) return special[n];
	if (n%10 === 0) return deca[Math.floor(n/10)-2] + 'ieth';
	return deca[Math.floor(n/10)-2] + 'y-' + special[n%10];
}


function clearCache() {
	fs.removeSync(fixed.cacheFolder);
}

function writeToScreen(str, severity, type) {

	if (severity >= debugLevel) {
		if (type == SCREEN_PRINT_INFO) {
			console.log(str);
		} else if (type == SCREEN_PRINT_SAVE) {
			console.log(clc.green(str));
		} else if (type == SCREEN_PRINT_HEADING) {
			console.log(clc.blue(str));
		} else if (type == SCREEN_PRINT_FILE) {
			console.log(clc.yellow(str));
		} else if (type == SCREEN_PRINT_ERROR) {
			console.log(clc.red(str));
		} else {
			console.log(str);
		}
	}
}

function valueExistsInObj(haystack, needle) {
	if (haystack.indexOf(needle) > -1) {
		return true;
	} else {
		return false;
	}
}

function getData(api, showSpinner, lrHost, lrUser, lrPass){

	var deferred = Q.defer();
	var errStr;

	showSpinner = typeof showSpinner !== 'undefined' ? showSpinner : true;
	lrHost = typeof lrHost !== 'undefined' ? lrHost : config.host;
	lrUser = typeof lrUser !== 'undefined' ? lrUser : config.username;
	lrPass = typeof lrPass !== 'undefined' ? lrPass : config.password;

	lrHost = lrHost + fixed.apiPath;


	if (showSpinner) {
		cli.spinner(clc.blue(fixed.txtWorking));
	}

	writeToScreen('Requesting data (from server ' + lrHost + '):\n' + api , SEVERITY_DEBUG, SCREEN_PRINT_INFO);
	var lrResException;

	request
		.post(lrHost)
		.set('Content-Type', 'application/json')
		.auth(lrUser, lrPass)
		.send(api)
		.end(function(err, res){

			if (showSpinner) {
				cli.spinner('', true);
			}

			if (err) {
				if (err.code === 'ENOTFOUND') { errStr = 'Host not found'; }
				else if (err.code === 'ECONNREFUSED') { errStr = 'Connection refused'; }
				else if (err.code === 'EHOSTUNREACH') { errStr = 'No route to host'; }
				else { errStr = 'Unknown error: ' + JSON.stringify(err); }
				return deferred.reject(errStr);
			}

			if (res.ok) {
				if(isJson(res.text)) {
					if(res.body.hasOwnProperty('exception')){
						if(res.body.exception === 'Authenticated access required') {
							deferred.reject('Could not authenticate (check username/password)');
						} else {
							deferred.reject(res.body.exception);
						}

					} else {
						deferred.resolve(res.body);
					}
				} else {
					deferred.reject('Connected to server but response is not JSON');
				}
			} else {

				if(res.statusCode == '404') { errStr = '(Not Found)'; }
				else { errStr =''; }

				errStr = 'Error ' + res.statusCode + ' ' + errStr;

				deferred.reject(errStr);
			}
		});
	return deferred.promise;
}

function doneFulfilled() {
	writeToScreen('All done', SEVERITY_NORMAL, SCREEN_PRINT_INFO);
}

function doneRejected(e) {
	writeToScreen('Error', SEVERITY_NORMAL, SCREEN_PRINT_ERROR);
	writeToScreen(e, SEVERITY_NORMAL, SCREEN_PRINT_ERROR);
}

function lrException(e) {

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

	if (errCode === 'ENOENT') { errStr = 'No such file or folder'; }

	writeToScreen('Error', SEVERITY_NORMAL, SCREEN_PRINT_ERROR);
	writeToScreen(errStr, SEVERITY_NORMAL, SCREEN_PRINT_ERROR);
	process.exit();
}

function isJson(text) {
	if (/^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, '@').
	replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
	replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
		return true;
	}else{
		return false;
	}
}
