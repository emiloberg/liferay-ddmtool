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


var Constants                       = require('./lib/SingleConstants.js');
var argv							= require('minimist')(process.argv.slice(2));
var saveArgs	             		= require('./lib/router--save-cli-arguments.js');
var router	             			= require('./lib/router.js');
var LrClassNameConfig	    		= require('./lib/SingleLrClassNameConfig.js');


saveArgs(argv);
LrClassNameConfig.loadCustomClassNames();
router(Constants.fetch('STEP_START'));
