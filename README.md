#Liferay DDM Tool
Command Line Tool for authoring, uploading, downloading and synchronizing Liferay DDM related stuff (Structures and Templates) across environments.

### Abilities

* **Upload** ddm stuff - structures and templates - from local (version controlled!) repository to server (localhost, live, dev and whatnot).
* **Download** ddm stuff from server to local repository.
* **Watch local repository for changes** and when changed immediately upload the file to server.
* **Show diffs** between server and local repository (files only available locally/on server)

### What is "DDM related stuff"?

* Journal Article Structures and Templates
* Application Display Templates (ADTs), including but not limited to all built-in portlets supporting ADTs, such as Asset Publisher, Blogs, Categories Navigation, Document and Media, Sitemap, Tags Navigation and Wiki.
* Dynamic Data List Definitions
* Document & Media; Metadata Set Definitions and Document Type Definitions
* All structures and templates for portlets you build yourself.

### Common use cases

* Putting structures and templates under **version control** (why this is a good thing needs no explanation).
* When developing templates, having the Liferay DDM Tool in "watch mode" which **automagically uploads all changes to the (localhost) development server** so that changes are going into effect immediately.
* **Settings up a new environment**, such as a new live server or a new development server.
* **Deploying all structures and templates** from repository to the live server as a part of the release process.
* Making sure that each environment has the same structures and templates with a little help from the diff function in the Liferay DDM Tool.

## Installation

1. Make sure [Node.js](http://nodejs.org/) is installed by running `node -v` in your command line. If not, [install Node](http://nodejs.org/).
2. Clone the repository to a directory of your choice.
3. cd into that directory and run `npm install` to install dependencies
4. run `node index.js` to run this App.

The App is (yet) not published to [NPM](https://www.npmjs.org/) and may therefor not be installed "globally". If you want easier access to the tool, add it as an alias in your shell configuration. E.g. edit `~/.bash_profile` (for bash) or `~/.zshrc` for Z shell and add the line `alias ddm="node /PATH/TO/liferay-ddmtool/index.js"` and then just run with `ddm` from your console.

## Running
Run Liferay DDM Tool as specified above.

First time you run the App, you'll be asked to define your first project. You'll always have the option to create new projects inside the App. If you want to edit an old project, do so by editing the configuration file(s) as specified in the section _Project Configuration Files_  below.

## Settings
All config files are saved as JSON in `$USERHOME/.ddmtool`.

### Project Configuration Files
For each project, there's a project configuration in `$USERHOME/.ddmtool/config/projects/project-name.json`.

#### Sample Project Setting File

```
{
  "projectName": "myproject",
  "filesPath": "/code/ddm-repo",
  "defaultLocale": "en_US",
  "externalDiff": "/usr/bin/opendiff %1 %2",
  "hosts": [
    {
      "name": "local",
      "host": "http://localhost:8080",
      "username": "test@liferay.com",
      "password": "test",
      "email": "test@liferay.com"
    },
    {
      "name": "prod1",
      "host": "http://123.123.123.123",
      "username": "admin",
      "password": "superstrongpassword",
      "email": "admin@company.com"
    }    
  ],
  "ignoreDDMs": [
    "EVENTS",
    "INVENTORY",
    "ISSUES TRACKING"
  ]
}
```

#### Project Settings
* `projectName`. Your project name. App may be called with command line argument `--project myproject` to skip the project selection menu.
* `filesPath`. Full path to where your DDMs are. This is typically the folder you want to have under versioning control.
* `defaultLocale`. New DDMs will be uploaded with the name/description in this locale.

##### Host(s)
* Array of Liferay servers, e.g your local development server, your test server, your production server etc.
	* `name`. Your name of the server. App may be called with command line argument `--server local` to skip the server selection menu. If `--server` is supplied, so must `--project`.
	* `host`. Host and port to the Liferay server.
	* `username` & `password`. The username and password with which you will log in to Liferay.
	* `email`. Often email is the same as username. However, if you're not using email to log in, change this to the email adress connected to your Liferay account. Email is only used to lookup your user id (For some reason, we can't ask Liferay for the user id for the current logged in user).


##### Optional

* `externalDiff`. Path to external diff tool. If externalDiff is supplied, you'll get a new choice to "open external diff tool" in the diff menu. Must have variables `%1` and `%2`. Like `/usr/bin/opendiff %1 %2`. `%1` will be replaced with "left" folder (local DDM repository) and `%2` will be replaced with "right" folder (server DDMs).
* `ignoreDDMs`. Array of structure/template ID:s to be ignored by the App. Typically Liferay default structures/templates (if you don't remove them from server).


### Custom Class Names Configuraiton
By default, the App will look for Liferay standard DDM entities (such as structures and templates for journal articles, ADTs, dynamic data lists, etc).

If you want the App to be able to handle custom structures and templates for custom DDM entities you may create a `customClassNameConfig.json` file in `$USERHOME/.ddmtool/config/`.

1. Figure out the className of the new structure/template by searching the querying for `select value from classname_ where classNameId = 12345`. If the App finds a structure/template it does not recognize, it will tell you. It'll also tell you the server classNameId of that structure/template which you use in the query.
2. Create/update the `customClassNameConfig.json` file, like below:

#### Sample Custom Class Name Configuration
```
[
    {
        "filesPath": "generic_record_set",
        "friendlyName": "Generic Record Set",
        "clazz": "com.monator.moh.genericddm.model.GenericRecordSet",
        "getTemplate": false,
        "mayHaveTemplates": true,
        "mayHaveStructures": true,
        "isNativeDDM": true
    }
]
```

* `filesPath` [string]. Subfolder (inside the folder you defined as filesPath for the project) the files will be saved in. No slashes anywhere please; no leading, no trailing and none inside.
* `friendlyName` [string]. Name as it will be displayed in the user interface
* `clazz` [string]. Class Name you got from your database query.
* `getTemplate` [boolean]. Whether or not the `clazz` should be used when asking Liferay for all Templates. If unsure, set this to `false`, run the App and download the structures/templates and check if you get the templates you want.
* `mayHaveTemplates` [boolean]. Within the folder defined in `filesPath`, may there be Templates? Typically this is true.
* `mayHaveStructures` [boolean]. Within the folder defined in `filesPath`, may there be Structures? Typically this is true
* `isNativeDDM` [optional boolean]. True if template's class name should be DDMStructure instead of the entity given by clazz. Typically this is false.