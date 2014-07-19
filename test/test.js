var expect = chai.expect
var imagesContainer = document.getElementById('images');

var refreshImage = function(src){return (src + '?=' + Math.random());}

var removeLocalHost = function(src){return src.replace('http://localhost:7357','').replace('http://127.0.0.1:7357','');}

function getRandomSubarray(arr, size) {
	var shuffled = arr.slice(0), i = arr.length, temp, index;
	while (i--) {
		index = Math.floor((i + 1) * Math.random());
		temp = shuffled[index];
		shuffled[index] = shuffled[i];
		shuffled[i] = temp;
	}
	return shuffled.slice(0, size);
}

var refreshImagesArray = function(images,n){
	var arr = n ? getRandomSubarray(images,n) : images.slice(0);
	for(var i = 0; i<arr.length; i++){
		arr[i] = refreshImage(arr[i]);
	}
	return arr;
}

describe('PicLoader',function(){
	describe('#constructor()',function(){
		it('should create a new instance of PicLoader when called with the "new" operator',function(){
			var ld = new PicLoader();
			expect(ld).to.be.instanceOf(PicLoader);
		})
		it('should create a new instance of PicLoader when called without the "new" operator',function(){
			var ld = PicLoader();
			expect(ld).to.be.instanceOf(PicLoader);
		})
		it('should append to it\'s queue if passed an array',function(){
			var ld = PicLoader();
			expect(ld).to.be.instanceOf(PicLoader);
		})
	});
	describe('#add()',function(){
		it('should add as many items as passed in arguments',function(){
			var ld = PicLoader();
			ld.add('a','b','c','d');
			expect(ld._queue).to.eql(['a','b','c','d']);
		})
		it('should add a new item on top',function(){
			var ld = PicLoader();
			ld.add('a','b','c','d');
			ld.add('e');
			expect(ld._queue).to.eql(['e','a','b','c','d']);
		})
		it('should flatten passed arrays',function(){
			var ld = PicLoader();
			ld.add(['a','b','c','d'],'e',['f','g']);
			expect(ld._queue).to.eql(['a','b','c','d','e','f','g']);
		})
		it('should move an item added twice to the top of the queue',function(){
			var ld = PicLoader();
			ld.add(['a','b','c','d'],'e',['f','g']);
			ld.add('f');
			expect(ld._queue).to.eql(['f','a','b','c','d','e','g']);
		})
		it('should add an event listener for the previous item if the item is a function',function(){
			var ld = PicLoader();
			var A = function ExampleA(){return 'example A'};
			var B = function ExampleB(){return 'example B'};
			var C = function ExampleC(){return 'example C'};
			var D = function ExampleD(){return 'example D'};
			ld.add('a',A);
			ld.add(['b',B]);
			ld.add('c',C,'d',D)
			expect(ld._events['b'][0]()).to.be.equal(B());
			expect(ld._events['d'][0]()).to.be.equal(D());
		})
		it('should fire those events listeners when images load',function(done){
			var arr = refreshImagesArray(images,4);
			var ld = new PicLoader();
			var i = 0;
			var loaded = 0;
			var length = arr.length
			var incFunction = function IncFunction(image){
				imagesContainer.appendChild(image);
				loaded++;
			}
			for(i;i<length;i++){
				ld.add(arr[i],incFunction)
			}
			ld.start(function(){
				expect(loaded).to.be.equal(4);
				done();
			})
		});
		it('should accept objects as inputs',function(done){
			var arr = refreshImagesArray(images,4);
			var ld = new PicLoader();
			var i = 0;
			var loaded = 0;
			var length = arr.length
			for(i=0;i<length;i++){
				arr[i] = {src:arr[i],name:'object-'+i,number:i}
			}
			var incFunction = function IncFunction(image,src){
				imagesContainer.appendChild(image);
				expect(src).to.have.property('name');
				expect(src).to.have.property('number');
				expect(src.name).to.be.equal(arr[src.number].name);
				loaded++;
			}
			for(i=0;i<length;i++){
				ld.add(arr[i],incFunction)
			}
			ld.start(function(){
				expect(loaded).to.be.equal(4);
				done();
			})
		});
	});
	describe('#start()',function(){
		it('should load images one by one',function(done){
			var arr = refreshImagesArray(images,3);
			var ld = new PicLoader(arr);
			ld.start();
			setTimeout(function(){
				imagesContainer.appendChild(ld.loaded[arr[2]])
				expect(ld.loaded[arr[2]].width).to.be.above(0)
				done();
			},500)
		});
		it('should fire a callback when all images have loaded',function(done){
			var arr = refreshImagesArray(images,3);
			var ld = new PicLoader(arr);
			ld.start(function(){
				var n = 0;
				for(var i in ld.loaded){n++;}
				expect(n).to.be.equal(3)
				done();
			});
		});
	});
	describe('#promote()',function(){
		this.timeout(15000);
		it('should change the order of the loading queue',function(){
			var ld = PicLoader();
			ld.add('a','b','c','d');
			ld.promote('c');
			expect(ld._queue).to.eql(['c','a','b','d']);
		});
		it('should do nothing if the promoted object does not exist',function(){
			var ld = PicLoader();
			ld.add('a','b','c','d');
			ld.promote('e');
			expect(ld._queue).to.eql(['a','b','c','d']);
		});
		it('should load in the promoted order',function(done){
			var length = 15;
			var last = length -1;
			var arr = refreshImagesArray(images,length);
			var ld = new PicLoader(arr);
			var lastImageIsLoaded = false;
			ld
				.on(arr[last],function(image){
					lastImageIsLoaded = true;
					imagesContainer.appendChild(image);
				})
				.on(arr[2],function(image){
					imagesContainer.appendChild(image);
					var previous = ld._queue[ld._queue.length-1];
					ld.promote(arr[14]);
					expect(previous).to.be.equal(ld._queue[0]);
				})
				.on(arr[9],function(image){
					imagesContainer.appendChild(image);
					expect(lastImageIsLoaded).to.be.equal(true);
				})
				.start(done)
			;
		});
	});
	describe('#limit()',function(){
		it('should set the maximum number of concurrent downloads',function(done){
			var arr = refreshImagesArray(images,10);
			var ld = new PicLoader(arr);
			var max = 0;
			ld
				.limit(5)
				.on(PicLoader.events.LOADING,function(){
					if(ld._loading.length>max){max = ld._loading.length;}
				})
				.start(function(){
					expect(max).to.be.equal(5);
					done();
				})
			;
		})
	});
	describe('Events',function(){
		it('should launch a "loaded" event when an image loads',function(done){
			var arr = refreshImagesArray(images,1);
			var ld = new PicLoader(arr);
			var orig_src = arr[0];
			ld.on(PicLoader.events.LOADED,function(image,src){
				expect(removeLocalHost(image.src)).to.be.equal(src)
				expect(src).to.be.equal(orig_src);
				done();
			}).start();
		});
		it('should launch a "promoted" event when an image is promoted',function(done){
			var arr = refreshImagesArray(images,3);
			var ld = new PicLoader(arr);
			var orig_src = arr[2];
			ld.on(PicLoader.events.PROMOTED,function(src){
				expect(src).to.be.equal(orig_src);
				done();
			})
			.add(arr[2]);
		});
		it('should fire a "complete" event when all images have loaded',function(done){
			var arr = refreshImagesArray(images,3);
			var ld = new PicLoader(arr);
			ld.on(PicLoader.events.COMPLETE,function(){
				var n = 0;
				for(var i in ld.loaded){n++;}
				expect(n).to.be.equal(3)
				done();
			})
			ld.start();
		});
		it('should fire a "loaded" event after each image',function(done){
			var arr = refreshImagesArray(images,3);
			var ld = new PicLoader(arr);
			var callbacks = 0
			ld.on(PicLoader.events.LOADED,function(image){
				imagesContainer.appendChild(image);
				callbacks++;
			}).start(function(){
				expect(callbacks).to.be.equal(arr.length);
				done();
			});
		});
		it('should fire an event named like the image',function(done){
			var arr = refreshImagesArray(images,3);
			var ld = new PicLoader(arr);
			ld.on(arr[1],function(image,src){
				imagesContainer.appendChild(image);
				expect(removeLocalHost(image.src)).to.be.equal(arr[1]);
				expect(src).to.be.equal(arr[1]);
			}).start(function(){
				done();
			});
		});
		it('should still fire the event in case of error, but image should be null',function(done){
			var ld = new PicLoader(['a']);
			ld
				.on('a',function(image,src){
					expect(image).to.be.equal(null);
					expect(src).to.be.equal('a')
				})
				.on(PicLoader.events.ERROR,function(src){
					expect(src).to.be.equal('a');
				})
				.start(done);
			;
		});
	});
})