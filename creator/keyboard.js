define([ 'jquery', 'misc' ], function($) {
	var Keyboard = function(proto) {
		this.handlers = [ ];

		this.codes = this._getCodes();

		this.keys = [];
		this.keys.indexOf = function(value) {
			for(var i = 0; i < this.length; i++) {
				if(this[i].key == value) return i;
			}

			return -1;
		};
		this.keys.push = function(value) {
			Array.prototype.push.call(this, { key: value, timestamp: 0, down: 0, handlers: [] });

			return this.length;
		};

		this.current = [ ];
			this.current.toString = function() {
			return this.join("");
		};

		if(proto) this.init.call(this, proto);
	};

	Keyboard.prototype = {
		minTimeGap: 50,
		init: function(proto) {
			proto = proto || { };

			this.codes = (proto.codes ? proto.codes : this.codes);
			
			this.assignElement(proto.element);

			if(proto.handlers) this.addHandlers(proto.handlers);

			this.enable();

			return true;
		},
		assignElement: function(element) {
			if(element && (element !== this.element)) {

				if(this.element) {
					this.disable(true);
				}

				this.element = element;
				
				this.enable(true);
			}

			return true;
		},
		addHandlers: function(handlers) {
			if(!$.isArray(handlers)) return false;

			this.handlers = this.handlers.concat(handlers.map(function(el) {
				var obj = {
					pattern: ((el.pt !== undefined) && ($.isString(el.pt)) ? el.pt.split("+", 3) : ((el.pattern !== undefined) && ($.isString(el.pattern)) ? el.pattern.split("+", 3) : ((el[0] !== undefined) && ($.isString(el[0])) ? el[0].split("+", 3) : null))),
					fn: (el.fn && ($.isFunction(el.fn)) ? el.fn : (el[1] && ($.isFunction(el[1])) ? el[1] : null)),
					context: (el.fc ? el.fc : (el.context ? el.context : (el[2] ? el[2] : null))),
					preventDefault : (el.pd !== undefined ? !!el.pd : (el.preventDefault !== undefined ? !!el.preventDefault : (el[3] !== undefined ? el[3] : false))),
					onPress: (el.op !== undefined ? !!el.op : (el.onPress !== undefined ? !!el.onPress : (el[4] !== undefined ? el[4] : true))),
					repeat: (el.rp !== undefined ? !!el.rp : (el.repeat !== undefined ? !!el.repeat : (el[5] !== undefined ? el[5] : false)))
				};

				if((obj.pattern === null) || ((obj.fn === null) && (obj.preventDefault === null))) return null;
				else return obj;
			}));

			this.handlers = Array.clear(this.handlers);
			if(this.handlers.length == 0) return false;

			this._buildKeys();

			return true;
		},
		enable: function(force) {
			if((this._active !== true) || force) {
				this._active = true;

				if(this.element) {
					this.element.on('keydown', $.proxy(this._keydownHandler, this));
					this.element.on('keyup', $.proxy(this._keyupHandler, this));
				}
			}

			return true;
		},
		disable: function(force) {
			if((this._active !== false) || force) {
				this._active = false;

				if(this.element) {
					this.element.off('keydown', this._keydownHandler);
					this.element.off('keyup', this._keyupHandler);
				}
			}

			return true;
		},
		_buildKeys: function() {
			this.handlers.forEach(function(el) {
				el.pattern.toString = this.current.toString;

				for(var i = 0; i < el.pattern.length; i++)
				{
					var index = this.keys.indexOf(el.pattern[i]);

					if(index == -1) {
						index = this.keys.push(el.pattern[i]) - 1;
					}

					this.keys[index].handlers.push(el);
				}
			}, this);

			return true;
		},
		_keydownHandler: function(e) {
			if(!this._active) return false;

			if(this.current.length == 3) return false;

			var name = '';
			var code = e.which;
			if(((code < 91) && (code > 64)) || ((code < 123) && (code > 96))) {
				name = String.fromCharCode(code).toUpperCase();
			} else {
				name = this.codes[code];
			}

			if(name && (this.current.indexOf(name) == -1)) {
				this.current.push(name);
			}

			var index = this.keys.indexOf(name);
			if(index != -1) {
				var now = Date.now();

				if(this.keys[index].handlers.length) {
					if(verbose) {
						console.log('Keyboard.prototype._keyupHandler_NOTICE: keys ' + this.current.toString() + ' catched');
					}

					this.keys[index].handlers.forEach(function(handler) {
						if(!handler.onPress) {
							handler.pattern.sort();
							this.current.sort();

							if(handler.pattern.toString() == this.current.toString()) {
								if(handler.preventDefault) {
									e.preventDefault();
								}

								if(!handler.repeat) {
									if((parseInt0(now - this.keys[index].timestamp) < this.minTimeGap) || !this.keys[index].down) {
										this.keys[index].timestamp = now;

										return true;
									}
								}

								this.keys[index].timestamp = now;
								this.keys[index].down = true;

								if(handler.fn) {
									handler.fn.call(handler.context, e);
								}
							}
						}
					}, this);
				}
			}
			
			return true;
		},
		_keyupHandler: function(e) {
			if(!this._active) return false;

			var name = '';
			var code = e.which;
			if(((code < 91) && (code > 64)) || ((code < 123) && (code > 96))) {
				name = String.fromCharCode(code);
			} else {
				name = this.codes[code];
			}

			var index = this.keys.indexOf(name);
			if(index != -1) {
				var now = Date.now();

				if(this.keys[index].handlers.length) {
					if(verbose) {
						console.log('Keyboard.prototype._keyupHandler_NOTICE: keys ' + this.current.toString() + ' catched');
					}

					this.keys[index].handlers.forEach(function (handler) {
						if(handler.onPress) {
							handler.pattern.sort();
							this.current.sort();

							if(handler.pattern.toString() == this.current.toString()) {
								if(handler.preventDefault) {
									e.preventDefault();
								}

								if(handler.repeat || (parseInt0(now - this.keys[index].timestamp) > this.minTimeGap) || !this.keys[index].down) {
									if(handler.fn) {
										handler.fn.call(handler.context, e);
									}
								}
							}
						}
					}, this);
				}

				this.keys[index].timestamp = now;
				this.keys[index].down = false;
			}

			var i = this.current.indexOf(name);
			if(i != -1) {
				this.current.splice(i, 1);
			}

			return false;
		},
		_getCodes: function() {
			var codes = [];

			codes[32] = "Space";
			codes[13] = "Enter";
			codes[9] = "Tab";
			codes[27] = "Esc"; // Escape
			codes[8] = "Back"; // Backspace
			codes[16] = "Shift";
			codes[17] = "Ctrl"; // Control
			codes[18] = "Alt";
			codes[20] = "Caps"; // Caps Lock
			codes[144] = "Num"; // Num Lock
			codes[37] = "LeftArrow";
			codes[38] = "UpArrow";
			codes[39] = "RightArrow";
			codes[40] = "DownArrow";

			return codes;
			}
	};

	return Keyboard;
});