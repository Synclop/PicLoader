(function (globalName,root,factory){
	if (typeof define === 'function' && define.amd) {define(factory);}
	else if (typeof exports === 'object') {module.exports = factory();}
	else {root[globalName] = factory(root);}
}('PicLoader',this,function(){

	var Events = {
		LOADED:'loaded'
	,	LOADING:'loading'
	,	COMPLETE:'complete'
	,	ERROR:'error'
	}
	
	var Loader = function(images,n_parallel){
		if(!(this instanceof Loader)){return new Loader(images,n_parallel);}
		this.reset(n_parallel);
		if(images && images.length){this.add(images);}
	}

	var p = Loader.prototype;

	p.reset = function(n_parallel){
		this.loaded = {};
		this._loaded = [];
		this._loading = [];
		this._events = {};
		this._parallel = n_parallel || 1;
		this._slots = this._parallel;
		this._queue = [];
		this._errors = [];
		this._complete = false;
		this._paused = true;
		this._previousOneWasAFunction = false;
	}

	p.parallel = p.limit = function(n){
		if(arguments.length){
			var slots = this._parallel - n;
			this._parallel = n;
			this._slots+=slots;
			this.next();
			return this;
		}
		return this._parallel;
	}

	p.start = function(fn){
		this._paused = false;
		if(fn){this.on(Events.COMPLETE,fn);}
		this.next();
		return this;
	}

	p.stop = function(){
		this._paused = true;
		return this;
	}

	p.add = function(){
		var l = arguments.length - 1,i = -1, src;
		for(l;l>i;--l){
			src = arguments[l];
			if(Object.prototype.toString.call(src) === '[object Array]'){
				this._previousOneWasAFunction = false;
				this.add.apply(this,src);
			}
			else if(typeof src === 'string'){
				if(this.getIndex(src)<0){
					this._queue.unshift(src);
					if(this._previousOneWasAFunction){
						this.once(src,this._previousOneWasAFunction);
					}
				}else{
					this.promote(src);
				}
				this._previousOneWasAFunction = false;
			}
			else if(src.constructor && src.call && src.apply){
				this._previousOneWasAFunction = src;
			}
		}
    	return this;
	}

	p.getIndex = function(src){
		var q = this._queue, l = q.length, i = 0;
		for(i;i<l;++i){
			if(q[i] === src){return i;}
		}
		return -1;
	}

	p.next = function(){

		if(this._paused == true){return this;}

		if(!this._queue.length){
			if(!this._complete){
				this._complete = true;
				this._paused = true;
				this.dispatch(Events.COMPLETE);
			}
			return;
		}

		while(this._loading.length < this._parallel && this._queue.length){
			this._load(this._queue.shift());
		}
		
		return this;
	}

	var makeDone = function(self,src){
		return function done(image,err){
			image.onerror = image.onabort = image.onload = null;
			self._slots++;
			if(self._slots>self._parallel){
				self._slots = self._parallel;
			}
			var loading = self._loading, l = loading.length, i = 0;
			for(i;i<l;++i){
				if(loading[i] == src){loading.splice(i,1);}
			}
			if(err){
				self._errors.push(src);
				self.dispatch(Events.ERROR,src);
				self.dispatch(src,null);
			}else{
				self._loaded.push(src);
				self.loaded[src] = image;
				self.dispatch(Events.LOADED,image);
				self.dispatch(src,image);
			}
			self.next();
		};
	}

	p._load = function(src){
		var image = new Image()
		,	self = this
		,	done = makeDone(this,src)
		;
		this._loading.push(src);
		this.dispatch(Events.LOADING,src);
		image.onerror = image.onabort = function(){done(this,true);}
		image.onload = function(){done(this);}
		image.src = src;
		return this;
	}

	p.promote = function(src){
		var index = this.getIndex(src);
		if(index<=0){return this;}
		return this.promoteByIndex(index);
	}

	p.promoteByIndex = function(index){
		if(this._queue.length>index){
			if(index>0){
				this._queue.unshift(this._queue.splice(index,1)[0]);
			}else{
				//force download here
			}
		}
		return this;
	}

	p.on = p.addEventListener = function(evt,fn){
		(this._events[evt] = this._events[evt] || []).push(fn);
		return this;
	}

	p.off = p.removeEventListener = function(evt,fn){
		if(this._events[evt]){
			if(fn){
				var evts = this._events[evt], l = evts.length, i = 0;
				for(i;i<l;++i){
					if(evts[i] == fn){
						evts.splice(i,1);
						break;
					}
				}
			}else{this._events[evt] = [];}
			return this;
		}
	}

	p.once = function(evt,fn){
		var self = this;
		var wrapper = function(){
			//https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#3-managing-arguments
			var args = new Array(arguments.length), l = args.length, i = 0;
			for(i;i<l;++i){args[i] = arguments[i];}
			self.off(evt,wrapper);
			return fn.apply(this,args);
		}
		self.on(evt,wrapper);
		return this;
	}

	p.dispatch = function(evt,args){
		var l = this._events[evt] && this._events[evt].length, i = 0;
		if(l){
			for(i;i<l;++i){
				this._events[evt][i].call(this,args);
			}
		}
		return this;
	}

	Loader.events = Events;

	return Loader;

}));