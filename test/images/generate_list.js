#!/usr/bin/env node

var images = [];
var fs = require('fs');
var root = __dirname + '/';

fs.readdirSync(root).forEach(function(file) {
	if(file.match(/.+\.(jpg|jpeg|gif|png)/g) !== null){
		images.push('/images/'+file);
	}
});

var str = 'images=[\n\t"'+images.join('"\n,\t"')+'"\n];';

fs.writeFileSync(root+'index.js',str);
