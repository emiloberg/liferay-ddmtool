"use strict";

var Articles = [];

function add(entry) {
	Articles.push(entry);
}

function getAll(){
	return Articles;
}

module.exports.add = add;
module.exports.getAll = getAll;
