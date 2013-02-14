define(function() {
	window.parseInt0 = function(obj) {

		return (isNaN(parseInt(obj)) ? 0 : parseInt(obj));
	};

	window.parseFloat0 = function(obj) {

		return (isNaN(parseFloat(obj)) ? 0 : parseFloat(obj));
	};

	if(!Function.prototype.bind) {
	// @src: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function/bind
		Function.prototype.bind = function (oThis) {
		if (typeof this !== "function") {
			throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
		}

		var aArgs = Array.prototype.slice.call(arguments, 1), 
			fToBind = this,
			fNOP = function () {},
			fBound = function () {
				return fToBind.apply(this instanceof fNOP && oThis ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
			};

		fNOP.prototype = this.prototype;
		fBound.prototype = new fNOP();

		return fBound;
		};
	}

	Object.isFunction = function(obj) {

		return (obj && (typeof(obj) == "function") && (!Function.prototype.call || typeof(obj.call) == "function"));
	};

	var _Math_Round = Math.round;
	Math.round = function(n /*, [dec places]*/) {
		var dec = (arguments[1] !== undefined ? parseInt0(arguments[1]) : 0);

		return _Math_Round(n * Math.pow(10, dec)) / Math.pow(10, dec);
	};

	Math.rad = function(degrees) {

		return Math.PI*parseInt0(degrees)/180;
	};

	Math.randomInt = function(min, max) {
		if(min == max) return min;

		return Math.floor(Math.random() * (max - min + 1)) + min;
	};

	if(!Date.now) {
		Date.now = function() {
			var now = new Date();
			return Date.parse(now) + now.getMilliseconds();
		};
	}

	Array.prototype.indexOfObjectWith = function(searchElement /*, [from] */) {
		if(this === void 0 || this === null)
			throw new TypeError();

		var t = Object(this);
		var len = t.length >>> 0;

		if(len === 0)
		return -1;

		var n = 0;

		if(arguments.length > 0)
		{
			n = Number(arguments[1]);

			if (n !== n)
				n = 0;
			else if(n !== 0 && n !== (1 / 0) && n !== -(1 / 0))
				n = (n > 0 || -1) * Math.floor(Math.abs(n));
		}

		if (n >= len)
			return -1;

		var k = (n >= 0) ? n : Math.max(len - Math.abs(n), 0);

		for(;k < len; k++)
		{
			if (k in t)
			{
				var res = true;
				for(var prop in searchElement)
				{
					if(!searchElement.hasOwnProperty(prop)) { }
					else if(t[k].hasOwnProperty(prop))
					{
						if(t[k][prop] !== searchElement[prop])
						{
							res = false;
							break;
						}
					}
					else
					{
						res = false;
						break;
					}
				}

				if(!!res) return k;
				else continue;
			}
		}

		return -1;
	};

	Array.prototype.removeDuplicates = function() {
		var duplicates = [];

		for(var i = 0; i < this.length; i++)
		{
			var index = this[i] instanceof Object ? this.indexOfObjectWith(this[i]) : this.indexOf(this[i]);

			if(index != i)
			{
				duplicates.push(this.splice(index, 1));
				i--;
			}
		}

		return duplicates;
	};
});