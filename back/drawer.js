define([ 'color', 'misc' ], function(Color) {
	// Bézier >>
	// @src: http://blog.greweb.fr/2012/02/bezier-curve-based-easing-functions-from-concept-to-implementation/
	function KeySpline(mX1, mY1, mX2, mY2) {
		this.get = function(aX) {
			if (mX1 == mY1 && mX2 == mY2) return aX; // linear
			return CalcBezier(GetTForX(aX), mY1, mY2);
		}
	 
		function A(aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
		function B(aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; }
		function C(aA1)      { return 3.0 * aA1; }
	 
		// Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
		function CalcBezier(aT, aA1, aA2) {
			return ((A(aA1, aA2)*aT + B(aA1, aA2))*aT + C(aA1))*aT;
		}
	 
		// Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
		function GetSlope(aT, aA1, aA2) {
			return 3.0 * A(aA1, aA2)*aT*aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
		}
	 
		function GetTForX(aX) {
			// Newton raphson iteration
			var aGuessT = aX;
			for (var i = 0; i < 4; ++i) {
				var currentSlope = GetSlope(aGuessT, mX1, mX2);
				if (currentSlope == 0.0) return aGuessT;
				var currentX = CalcBezier(aGuessT, mX1, mX2) - aX;
				aGuessT -= currentX / currentSlope;
			}
			return aGuessT;
		}
	}
	// << Bézier

	function requestAnimationFramePolyfill() {
		var lastTime = 0;
		var vendors = [ 'ms', 'moz', 'webkit', 'o' ];
		for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
			window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
			window.cancelAnimationFrame = 
				window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
		}

		if(!window.requestAnimationFrame) {
			window.requestAnimationFrame = function(callback, element) {
				var currTime = Date.now();
				var timeToCall = Math.max(0, 16 - (currTime - lastTime));
				var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
					timeToCall);
				lastTime = currTime + timeToCall;
				return id;
			};
		}
	 
		if(!window.cancelAnimationFrame) {
			window.cancelAnimationFrame = function(id) {
				clearTimeout(id);
			};
		}
	}; requestAnimationFramePolyfill();

	Drawer = function(cnv) {
		if(!cnv || !cnv.getContext) cnv = document.createElement('CANVAS');

		this._canvas = cnv;
		this._2d = cnv.getContext('2d');
		this._animations = [ ];

		// easing init >>
			for(var e in this.easing) {
				if((e[0] == '_') && this.easing.hasOwnProperty(e)) {
					this.easing[e.slice(1)] = new this.easing[e];
				}
			}
			this.easing.default = this.easing.linear;
		// << easing init
	} // << Drawer

	Drawer.prototype = {
		toString: function() { return '[object Drawer]'},
		easing: {
			_linear: function() {
				this.y = function(t, b, c, d) {
					return b + c*(t/d);
				}
			},
			_easeOut: function() {
				var bzr = new KeySpline(0.42, 0, 0.58, 1);

				this.y = function(t, b, c, d) {
					return b + c*bzr.get(t/d);
				}
			},
			_easeOutSine: function() {
				this.y = function(t, b, c, d) {
					return b + c*Math.sin(t/d * (Math.PI/2));
				};
			},
			_easeIn: function() {
				var bzr = new KeySpline(0.42, 0, 1, 1);

				this.y = function(t, b, c, d) {
					return b + c*bzr.get(t/d);
				}
			},
			_easeInSine: function() {
				this.y = function(t, b, c, d) {
					return b - c*Math.cos(t/d * (Math.PI/2)) + c;
				};
			},
		},
		interval: 1,
		circle: function(cX, cY, r, fC, bC, bW) {
			bW = (bW || 1.0);

			var c = this._2d;
			c.save();
			c.translate(cX, cY);

			if(bC) c.fillStyle = bC;
			c.beginPath();
			c.arc(0, 0, (r < 1 ? Math.max(bW/2, 1) : r), 0, Math.rad(360));
			c.fill();

			var cut = false;
			if(!fC) {
				if(r >= 1) {
					c.globalCompositeOperation = 'destination-out';
					cut = true;
				}
			} else if(fC != bC) {
				c.fillStyle = fC;
				cut = true;
			}

			if(cut) {
				c.beginPath();
				c.arc(0, 0, Math.abs(r-bW), 0, Math.rad(360));
				c.fill();
			}

			c.restore();

			return true;
		},
		clear: function(x1, y1, x2, y2) {
			this._2d.clearRect(x1, y1, x2-x1, y2-y1);

			return true;
		},
		animate: function(cP, r, fC, bC, bW, t, d, eF, cb) {
			var cX = cP[0]; // center position x
			var cY = cP[1]; // center position y

			var sr = (r ? r[0] : null); // start radius
			var er = (r ? r[1] : null); // end radius

			var sbW = (bW ? bW[0] : null); // start border width
			var ebW = (bW ? bW[1] : null); // end border width

			var sbC = (bC ? new Color(bC[0]) : null); // start border color
			var ebC = (bC ? new Color(bC[1]) : null); // end border color

			var sfC = (fC ? new Color(fC[0]) : null); // start fill color
			var efC = (fC ? new Color(fC[1]) : null); // end fill color

			// callbacks
			var scb = (cb && Object.isFunction(cb[0]) ? cb[0] : null);
			var ecb = (cb && Object.isFunction(cb[1]) ? cb[1] : null);

			var o = {
				cX: cX,
				cY: cY,
				sr: sr,
				cr: sr,
				er: er,
				dr: er-sr,
				clr: Math.max(sr, er),
				sbW: sbW,
				cbW: sbW,
				ebW: ebW,
				dbW: ebW-sbW,
				sbC: sbC,
				cbC: (bC ? new Color(bC[0]) : null),
				ebC: ebC,
				dbC: ebC.sub(sbC),
				sfC: sfC,
				cfC: (fC ? new Color(fC[0]) : null),
				efC: efC,
				dfC: efC.sub(sfC),
				t: Math.abs(t),
				d: d || 0,
				eF: this.easing[eF] || this.easing.default,
				st: 0,
				ct: 0,
				et: 0,
				scb: scb,
				ecb: ecb
			};

			this._animations.push(o);

			return o;
		},
		cancelAnimation: function(aO) {
			var i = this._animations.indexOf(aO);

			if(i != -1) {
				if(aO.ecb) {
					setTimeout(aO.ecb, 0);
					aO.ecb = null;
				}

				return this._animations.splice(i, 1);
			} else {
				return null;
			}
		},
		playAnimations: function() {
			var now = performance.now();

			for(var i = 0, maxi = this._animations.length; i < maxi; i++) {
				var a = this._animations[i];
			
				if(!a.st) {
					a.st = now + a.d;
					a.ct = a.st;
					a.et = a.st + a.t;

					if(a.scb) {
						a.scb();
					}
				}
			}

			if(!this._render) {
				var dr = this;

				(function renderFrame(cT) {
					dr._render = requestAnimationFrame(renderFrame);

					dr._play(performance.now()); // can't use cT because of FF bug
				})(now);
			}

			return true;
		},
		pauseAnimations: function() {
			cancelAnimationFrame(this._render);
			this._render = null;

			return true;
		},
	// internal >>
		_play: function(n) {
			if(!this._animations.length) return this.pauseAnimations();

			for(var i = 0, maxi = this._animations.length; i < maxi; i++) {
				var a = this._animations[i];
			
				if(a && a.st && !a.fin) {
					if(a.st <= n) {
						var rd = false; // redraw?
						var dl = false; // dl?

						if(a.t && (a.ct <= a.et)) {
							a.ct = n-a.st;
							if(a.ct/a.t > 1) {
								a.ct = a.t;
							}

							if(a.cr != a.er) {
								a.cr = Math.round(a.eF.y(a.ct, a.sr, a.dr, a.t), 1);
								rd = true;
							}

							if(a.cbW != a.ebW) {
								a.cbW = Math.round(a.eF.y(a.ct, a.sbW, a.dbW, a.t), 1);
								rd = true;
							}

							if(a.cbC.toString() != a.ebC.toString()) {
								a.cbC.channels = (a.sbC.channels.map(function(ch, i) {
									var nch = Math.round(a.eF.y(a.ct, ch, a.dbC[i], a.t), (i == 3 ? 1 : 0));

									if(nch < 0) nch = 0;
									else if(nch > 255) nch = 255;

									return nch;
								}));
								rd = true;
							}

							if(a.cfC.toString() != a.efC.toString()) {
								a.cfC.channels = (a.sfC.channels.map(function(ch, i) {
									var nch = Math.round(a.eF.y(a.ct, ch, a.dfC[i], a.t), (i == 3 ? 1 : 0));

									if(nch < 0) nch = 0;
									else if(nch > 255) nch = 255;

									return nch;
								}));
								rd = true;
							}
						} else {
							a.cr = a.er;
							a.cbW = a.ebW;
							a.cbC = a.ebC;
							a.cfC = a.efC;

							rd = true;
							dl = true;
						}

						if(rd) {
							this.clear(a.cX-a.clr, a.cY-a.clr, a.cX+a.clr, a.cY+a.clr);
							this.circle(a.cX, a.cY, a.cr, (a.cfC.channels[3] ? a.cfC.rgba() : null), (a.cbC.channels[3] ? a.cbC.rgba() : null), a.cbW);
						} else {
							dl = true;
						}

						if(dl) {
							a.fin = true;
							this.cancelAnimation(a);
						}
					}
				}
			}

			return true;
		}
	// << internal
	}

	return Drawer;
});