# picLoader

ImageQueueLoader is a little module for creating a queue of images to pre-load, and be able to switch order of images fast.
It is not dependant on any library and should work in all browsers (esoteric IE7 not tested).

Here is an example of usage (it uses jQuery for convenience):

```html
	<html><head><title>Testing</title></head><body>
	<div id="Images">
		<div data-src="some-image.jpg" class="image"></div>
		<div data-src="some-image2.jpg" class="image"></div>
	</div>
	</body></html>
```

```js

	var images = [];

	//collecting all the images
	var $images = $('.image').each(function(){
		images.push($(this).data('src'));
	});

	var loader = new PicLoader(images)
		.limit(3) //3 concurrent images will be downloaded
		.on(PicLoader.events.LOADED,function(image){
			if(!image){return false;}
			var src = image.src.replace('http://localhost/','')
			$('data-src="'+src+'"').addClass('loaded').css('image-background','url('+image.src+')');
		})
	;

	//bump images that are in view
	$images.inView(function(){ //(using an hypothetical inView plugin...)
		loader.add($(this).data('src'))
	});

	loader.start();

```

or, if you want more callbacks:
```js

	var images = [];
	var loader = new PicLoader().limit(3);

	//collecting all the images
	var $images = $('.image').each(function(){
		var $el = $(this);
		images.push($el.data('src'),function(image){
			if(image){
				$el.addClass('loaded').css('image-background','url('+src+')')
			}else{
				$el.addClass('error')
			}
		});
	});

	//bump images that are in view
	$images.inView(function(){ //(using an hypothetical inView plugin...)
		loader.add($(this).data('src'))
	});

	loader.start();

```

## Install

PicLoader exposes an UMD interface, so it should work with require(), define(), or whatever.
It exposes the global PicLoader when used as a regular javascript file.
So use bower, use npm, use browserify, or include the js file...Feel free.


# API

You will find more info in the test suite (/test/test.js), but here below are the important points

## METHODS

### start([fn])

starts the queue. Optionally calls the passed callback.

### add(source,[source,...])

adds one or more items to the queue. "source" can be an array or a string.

```js
	loader.add('source','source',['source','source'])
```

It can also be used to add a source to load and fire a function when loaded. You can pass multiple couples:

```js
	loader.add('source',fn,'source',fn)
	//or
	loader.add(['source',fn],['source',fn])
	//or a mix
	loader.add(['source',fn,'source',fn],'source',fn,'source',fn)
```

finally, it can be used to bump an image to top

```js
	loader.add('a.jpg','b.jpg','c.jpg','d.jpg')
	loader.add('c.jpg') //c will now load before everything else
```

### limit()

Sets the maximum number of concurrent downloads. Defaults to 1.

### on(event,func)

(aliased to addEventListener)
Run the given function when event is triggered

### once(event,func)

runs the function once then removes it

### off(event,[func])

Stops listening to the event. If you do not pass the function that was used when on() was called, all listeners for a given event are removed.


## EVENTS

	* Loader.events.LOADED = 'loaded' 
		called after each image load. Receives the DOM img element that has loaded
	* Loader.events.LOADING = 'loading'
		called before loading an image. Receives the source
	* Loader.events.COMPLETE = 'complete'
		called when all images in queue have been loaded.
	* Loader.events.ERROR = 'error'
		called when an image fails to load

## TESTING

Run

```
node test
```

which will open a server on port 7357
Open http://localhost:7357 in your browser to run the tests.


## LICENSE

MIT

## DISCLAIMER

Some random images have been included in the repo for testing. They have not been verified as royalty-free. If there is any problem on copyright, leave an issue and we'll remove the image presto.