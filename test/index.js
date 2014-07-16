var http = require('http')
,	fs = require('fs')
,	rootDir = __dirname + '/../'
,	port = 7357
,	path = require('path')
,	files = {
	'/mocha.css':{
		header:'text/css'
	,	path: 'node_modules/mocha/mocha.css'
	}
,	'/mocha.js':{
		header:'application/javascript'
	,	path:'node_modules/mocha/mocha.js'
	}
,	'/chai.js':{
		header:'application/javascript'
	,	path:'node_modules/chai/chai.js'	
	}
,	'/test.js':{
		header:'application/javascript'
	,	path:'test/test.js'
	}
,	'/loader.js':{
		header:'application/javascript'
	,	path:'index.js'
	}
,	'/images.js':{
		header:'application/javascript'
	,	path:'test/images/index.js'
	}
,	'/':{
		header:'text/html'
	,	path:'test/index.html'
	}
}

for(var n in files){
	files[n].text = fs.readFileSync(rootDir +files[n].path,{encoding:'utf8'})
}

http
	.createServer(function (req, res) {
		var url = req.url.replace(/\?.*$/,'')
		var notExists = function(err){
			res.writeHead(404, {'Content-Type': 'text/plain'});
			res.end(err || 'Could not find '+req.url);
		};
		if(url.match(/images\//)){
			url = path.resolve(rootDir+'test'+url.replace('%20',' '));
			fs.exists(url,function(exists){
				if(!exists){return notExists();}
				fs.readFile(url,function(err,data){
					if(err){return notExists(err);}
					var extension = path.extname(url).toLowerCase();
					var contentType = 'image/'+(extension == '.jpg'? 'jpeg':extension.replace('.',''));
					res.writeHead(200, {'Content-Type': contentType });
					res.end(data, 'binary');
				})
			})
		}
		else if(files[url]){
			res.writeHead(200, {'Content-Type' : files[url].header});
			res.end(files[url].text);
		}else{		
			notExists();
		}
	})
	.listen(port, '127.0.0.1');

console.log('Test server running at http://127.0.0.1:'+port+'/');