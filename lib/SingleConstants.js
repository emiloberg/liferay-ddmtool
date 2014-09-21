"use strict";

var constants = {

	settingsFolder:						'config',
	projectsFolder:						'projects',

	customClassNameConfig:				'customClassNameConfig.json',

	cacheFolder:						'cache',
	cacheSitesFilename:					'Sites.json',
	cacheStructuresFilename:			'Structures.json',
	cacheTemplatesFilename:				'Templates.json',
	cacheClassNameConfig:				'ClassNameConfig.json',

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
	],

	debugLevel:							0,

    SEVERITY_DEBUG:						-1,
    SEVERITY_NORMAL:					0,
    SCREEN_PRINT_INFO:					0,
    SCREEN_PRINT_SAVE:					1,
    SCREEN_PRINT_ERROR:					2,
    SCREEN_PRINT_HEADING:				3,
    SCREEN_PRINT_FILE:					4,

    STEP_START:							1,
    STEP_JUST_LOADED_CONFIG:			2,
    STEP_JUST_READ_ALL_FROM_SERVER:		3,
    STEP_JUST_SAVED_ALL_FILES_TO_DISK:	4,
    STEP_JUST_UPLOADED_DDMS:			5,
	STEP_JUST_CREATED_PROJECT:			6
};

function fetch(prop) {
	if (typeof prop === 'undefined') {
		return constants;
	} else {
		return constants[prop];
	}
}

module.exports.fetch = fetch;
