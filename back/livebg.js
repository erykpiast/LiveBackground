define([ 'drawer', 'shape', 'misc' ], function(Drawer, Shape) {
	function intersectionRect(r1, r2) {
		if (r1.x1 <= r2.x2 &&
			r2.x1 <= r1.x2 &&
			r1.y1 <= r2.y2 &&
			r2.y1 <= r1.y2) {
			return {
				x1: Math.max(r1.x1, r2.x1),
				y1: Math.max(r1.y1, r2.y1),
				x2: Math.min(r1.x2, r2.x2),
				y2: Math.min(r1.y2, r2.y2)
			};
		} else {
			return null;
		}
	}

	LiveBackground = function(pr) {
		var def = { // all optional
			colors: {
				foreground: {
					stroke: 'rgba(170, 170, 170, 1)',
					fill: 'transparent'
				},
				background: {
					stroke: 'rgba(238, 238, 238, 1)',
					fill: 'transparent'
				}
			},
			radius: {
				foreground: 3,
				background: 0
			},
			strokeWidth: {
				foreground: 1.2,
				background: 1
			},
			show: {
				time: 0,
				delay: 0,
				easing: 'linear'
			},
			hide: {
				time: 1000,
				delay: 0,
				easing: 'easeOutSine'
			},
			followMouse: true,
			shapes: [ /* shape objects */ ],
			preventShapeRepeat: false,
			// ^ if `true`, prevents drawing the same shape twice over
			defaultShapeTime: 2000,
			defaultShapeInterval: 1000
		}; // << def

		// combine default prototype with user prototype
		var proto = this.proto = (pr ? {
			colors: pr.colors ? {
				foreground: pr.colors.foreground ? {
					stroke: pr.colors.foreground.stroke || def.colors.foreground.stroke,
					fill: pr.colors.foreground.fill || def.colors.foreground.fill,
				} : def.colors.foreground,
				background: pr.colors.background ? {
					stroke: pr.colors.background.stroke || def.colors.background.stroke,
					fill: pr.colors.background.fill || def.colors.background.fill,
				} : def.colors.background
			} : def.colors,
			radius: pr.radius ? {
				foreground: pr.radius.foreground !== undefined ? parseFloat0(pr.radius.foreground) : def.radius.foreground,
				background: pr.radius.background !== undefined ? parseFloat0(pr.radius.background) : def.radius.background
			} : def.radius,
			strokeWidth: pr.strokeWidth ? {
				foreground: pr.strokeWidth.foreground !== undefined ? parseFloat0(pr.strokeWidth.foreground) : def.strokeWidth.foreground,
				background: pr.strokeWidth.background !== undefined ? parseFloat0(pr.strokeWidth.background) : def.strokeWidth.background
			} : def.strokeWidth,
			show: pr.show ? {
				time: pr.show.time !== undefined ? parseInt0(pr.show.time) : def.show.time,
				delay: pr.show.delay !== undefined ? parseInt0(pr.show.delay) : def.show.delay,
				easing: pr.show.easing || def.show.easing
			} : def.show,
			hide: pr.hide ? {
				time: pr.hide.time !== undefined ? parseInt0(pr.hide.time) : def.hide.time,
				delay: pr.hide.delay !== undefined ? parseInt0(pr.hide.delay) : def.hide.delay,
				easing: pr.hide.easing || def.hide.easing
			} : def.hide,
			followMouse: pr.followMouse !== undefined ? !!pr.followMouse : def.followMouse,
			shapes: pr.shapes && pr.shapes.length ? pr.shapes : def.shapes,
			preventShapeRepeat: pr.preventShapeRepeat !== undefined ? !!pr.preventShapeRepeat : def.preventShapeRepeat,
			defaultShapeTime: pr.defaultShapeTime !== undefined ? parseInt0(pr.defaultShapeTime) : def.defaultShapeTime,
			defaultShapeInterval: pr.defaultShapeInterval !== undefined ? parseInt0(pr.defaultShapeInterval) : def.defaultShapeInterval
		} : def); // << proto

	// short parameters >>
		this._fgSC = proto.colors.foreground.stroke;
		this._fgFC = proto.colors.foreground.fill;
		
		this._bgSC = proto.colors.background.stroke;
		this._bgFC = proto.colors.background.fill;


		this._fgSW = proto.strokeWidth.foreground;
		this._bgSW = proto.strokeWidth.background;	

		this._shT = proto.show.time;
		this._shD = proto.show.delay;
		this._shE = proto.show.easing;

		this._hiT = proto.hide.time;
		this._hiD = proto.hide.delay;
		this._hiE = proto.hide.easing;


		this._fgR = proto.radius.foreground;
		this._bgR = proto.radius.background;


		this._fM = proto.followMouse;
	// << short parameters

	// shapes initialization >>
		this.shapes = proto.shapes;
		var prSum = 0;
		for(var i = 0, maxi = this.shapes.length; i < maxi; i++) {
			var sp = this.shapes[i];
		
			sp._i = i;

			sp._shF = sp.getShowFinishingPoint(this._shT, this._shD);
			sp._hiF = sp.getShowFinishingPoint(this._hiT, this._hiD);

			sp.priority = (sp.priority || 1);

			prSum += sp.priority;
		}

		for(var i = 0, maxi = this.shapes.length; i < maxi; i++) {
			var sp = this.shapes[i];
		
			sp._probability = (sp.priority / prSum);
		}

		this._hiddenShapes = this.shapes.slice();
		this._visibleShapes = [];
	// << shapes initialization
	}

	LiveBackground.prototype = {
		toString: function() { return '[object LiveBackground]'; },
		init: function(canvas) {
			if(!canvas || (canvas.tagName != 'CANVAS')) {
				canvas = document.createElement('CANVAS');
			}

			this.canvas = canvas;

			if (canvas.parentNode &&
				this._debug &&
				!this._outlinesContainer.parentNode) {
				canvas.parentNode.appendChild(this._outlinesContainer);
			}

			this.drawer = new Drawer(this.canvas);

			this._initGrid();
			this._drawGrid();

			if(this._fM) {
				this._pC = null;
				this._cC = this.grid[0][0];
			
				var that = this;
				canvas.addEventListener('mousemove', function(e) {
					that._mousemoveHandler(e);
				}, false);
				canvas.addEventListener('mouseout', function(e) {
					that._mouseoutHandler(e);
				}, false);
			}
		},
		displayShapes: function(/* time, interval */) {
			if(this._spD || !this.shapes.length) return false;
			else this._spD = true;

			var ar = arguments;

			this._spT = (ar[0] !== undefined ? parseInt0(ar[0]) : this.defaultShapeTime);
			var it = this._spI = (ar[1] !== undefined ? parseInt0(ar[1]) : this.defaultShapeInterval);

			var that = this;
			(function showNextShape() {
				var sp = that._randomShape();

				if(sp) {
					that._showShape(sp);
				}

				that._spD = setTimeout(showNextShape, that._spI);
			})();

			return true;
		},
		stopShapes: function() {
			if(!this._spD) return false;

			clearTimeout(this._spD);

			this._spD = null;

			return true;
		},
		debug: function(off) {

			return (!!off ? this._offDebugMode() : this._onDebugMode());
		},
	// internal >>
		_initGrid: function() {
			var fgR = this._fgR;
			var fgD = this._fgD = fgR*2;
			var cols = this._cols = Math.ceil(this.canvas.offsetWidth/this._fgD);
			var rows = this._rows = Math.ceil(this.canvas.offsetHeight/this._fgD);

			var g = this.grid = [ ];
			for(var i = 0; i < cols; i++) {
				g[i] = [ ];
				for(var j = 0; j < rows; j++) {
					var a = g[i][j] = {
						x1: i*fgD,
						x2: i*fgD+fgD-1,
						y1: j*fgD,
						y2: j*fgD+fgD-1,
						cX: i*fgD+fgR,
						cY: j*fgD+fgR
					};
				}
			}

			return true;
		},
		_drawGrid: function() {
			var gr = this.grid;
			var dr = this.drawer;

			var bgFC = this._bgFC;
			var bgSC = this._bgSC;
			var bgSW = this._bgSW;
			var fgR = this._fgR;
			var bgR = this._bgR;

			for(var i = 0; i < gr.length; i++) {
				for(var j = 0; j < gr[i].length; j++) {
					var c = gr[i][j];

					dr.circle(c.x1+fgR, c.y1+fgR, bgR, (bgFC == 'transparent' ? null : bgFC), bgSC, bgSW);
				}
			}

			return true;
		},
		_show: function(c /* fgFC, fgSC, fgSW, t, d, e, scB, ecB */) {
			var ar = arguments;

			var fgFC = (ar[1] !== undefined ? ar[1] : this._fgFC);
			var fgSC = (ar[2] || this._fgSC);
			var fgSW = (ar[3] !== undefined ? ar[3] : this._fgSW);
			var fgR = this._fgR;

			var shT = (ar[4] !== undefined ? ar[4] : this._shT);
			var shD = (ar[5] !== undefined ? ar[5] : this._shD);
			var shE = (ar[6] || this._shE);

			var scB = (ar[7] || null);
			var ecB = (ar[8] || null);

			var dr = this.drawer;

			var sr, sbW, sbC;
			var a = c.animation;
			if(a && !a.fin) {
				dr.cancelAnimation(a);

				sfC = a.cfC;
				sbC = a.cbC;
				sr = a.cr;
				sbW = a.cbW;
			} else {
				sfC = this._bgFC;
				sbC = this._bgSC;
				sbW = this._bgSW;
				sr = this._bgR;
			}
			
			c.animation = dr.animate([ c.cX, c.cY ], [ sr, fgR ], [ sfC, fgFC ], [ sbC, fgSC ], [ sbW, fgSW ], shT, shD, shE, [ scB, ecB ]);

			return true;
		},
		_hide: function(c /* fgFC, fgSC, fgSW, t, d, e, scB, ecB */) {
			var ar = arguments;

			var bgFC = this._bgFC;
			var bgSC = this._bgSC;
			var bgSW = this._bgSW;
			var bgR = this._bgR;

			var fgFC = (ar[1] !== undefined ? ar[1] : this._fgFC);
			var fgSC = (ar[2] || this._fgSC);
			var fgSW = (ar[3] !== undefined ? ar[3] : this._fgSW);
			var fgR = this._fgR;

			var hiT = (ar[4] !== undefined ? ar[4] : this._hiT);
			var hiD = (ar[5] !== undefined ? ar[5] : this._hiD);
			var hiE = (ar[6] || this._hiE);

			var scB = (ar[7] || null);
			var ecB = (ar[8] || null);

			var dr = this.drawer;

			var sr, sbW, sbC;
			var a = c.animation;
			if(a && !a.fin) {
				dr.cancelAnimation(a);

				sfC = a.cfC;
				sbC = a.cbC;
				sr = a.cr;
				sbW = a.cbW;
			} else {
				sfC = fgFC;
				sbC = fgSC;
				
				sr = fgR;
				sbW = fgSW;
			}

			c.animation = dr.animate([ c.cX, c.cY ], [ sr, bgR ], [ sfC, bgFC ], [ sbC, bgSC ], [ sbW, bgSW ], hiT, hiD, hiE, [ scB, ecB ]);

			return true;
		},
		_showShape: function(sp) {
			if(sp._v) return false;
			else sp._v = true;

			var x, y;
			if((sp.x !== undefined) && (sp.y !== undefined)) {
				sp._cx = x = sp.x; // current x
				sp._cy = y = sp.y; // current y
			} else {
				var rp = this._randomPosition(sp);

				if(rp) {
					sp._cx = x = sp.x || rp.x;
					sp._cy = y = sp.y || rp.y;
				} else { // is no free palce for the shape
					return false;
				}
			}

			this._visibleShapes.push(
				this._hiddenShapes.splice(this._hiddenShapes.indexOf(sp), 1)[0]
			);

			var ps = sp.points;
			var gr = this.grid;
			var dr = this.drawer;

			dr.pauseAnimations();
			for(var i = 0, maxi = ps.length; i < maxi; i++) {
				var p = ps[i];
			
				var cl = gr[x+p.x][y+p.y];
				cl._sp = sp;

				var shF = (p === sp._shF) ? this._preShowShapeHandler.bind(this, sp) : null;
				var shE = (p === sp._shF) ? (function(sp) {
						setTimeout(this._hideShape.bind(this, sp), this._spT);
					}).bind(this, sp) : null;

				this._show(cl, p.fillColor, p.strokeColor, p.strokeWidth, p.showTime, p.showDelay, p.showEasing, shF, shE);
			}
			dr.playAnimations();

			return true;
		},
		_hideShape: function(sp) {
			if(!sp._v) return false;

			var ps = sp.points;
			var gr = this.grid;
			var dr = this.drawer;

			var x = sp._cx;
			var y = sp._cy;

			dr.pauseAnimations();
			for(var i = 0, maxi = ps.length; i < maxi; i++) {
				var p = ps[i];
			
				var cl = gr[x+p.x][y+p.y];
				cl._sp = null;

				var hiF = (p === sp._hiF) ? (function(sp) { // hiding finisher
					sp._v = false;
					
					this._hiddenShapes.push(
						this._visibleShapes.splice(this._visibleShapes.indexOf(sp), 1)[0]
					);

					this._postHideShapeHandler(sp);
				}).bind(this, sp): null;

				this._hide(cl, p.fillColor, p.strokeColor, p.strokeWidth, p.hideTime, p.hideDelay, p.hideEasing, null, hiF);
			}
			dr.playAnimations();

			return true;
		},
		_randomShape: function() {
			if(!this.shapes.length) return null;

			var psp = this._psp;

			var csp = null;
			var hsps = this._hiddenShapes;
			if(hsps.length) {
				if(hsps.length == 1) csp = hsps[0];
				else {
					do {
						var accum = 0,
							rand = Math.random();
						for(var i = 0, maxi = hsps.length; i < maxi; i++) {
							csp = hsps[i];

							var	prob = csp._probability;
						
							if((accum <= rand) && (rand < (accum + prob))) {
								break;
							} else {
								accum += prob;
							}
						}
					} while(this.preventShapeRepeat && (csp === psp));
				}
			}

			if(this._debug) {
				console.log('   Drawn shape: ' + (csp ? csp.name : csp));
				console.log('----------------------------------------------');
			}

			this._psp = csp;

			return csp;
		},
		_randomPosition: function(sp) {
			var st = performance.now();

			var area = this._randomArea(sp);

			if(area) {
				var rX = Math.randomInt(area.x1 + sp.margin, area.x2 - sp.width - sp.margin);
				var rY = Math.randomInt(area.y1 + sp.margin, area.y2 - sp.height - sp.margin);

				if(this._debug) {
					this._higlightOutline(area);

					console.log('    Drawn area: x1: ' + area.x1 + ', y1: ' + area.y1 + ', x2: ' + area.x2 + ', y2: ' + area.y2);
					console.log('Drawn position: x: ' + rX + ', y: ' + rY);
					console.log('    Drawn time: ' + Math.round(performance.now() - st, 3)  +' ms');
					console.log('----------------------------------------------');
				}
				
				return { x: rX, y: rY };
			} else {
				return null;
			}
		},
		_randomArea: function(sp) {
			var areas = [ ],
				spWidth = sp.width,
				spHeight = sp.height,
				spMargin = sp.margin,
				rows = this._rows,
				cols = this._cols,
				shapes = this._visibleShapes;

			if(shapes.length) {
				for(var i = 0, maxi = shapes.length; i < maxi; i++) {
					var currSp = shapes[i],
						newAreas = [],
						memory = [],
						currAreas = [
							{ x1: 0, y1: 0, x2: cols, y2: currSp._cy },
							{ x1: currSp._cx + currSp.width, y1: 0, x2: cols, y2: rows },
							{ x1: 0, y1: currSp._cy + currSp.height, x2: cols, y2: rows },
							{ x1: 0, y1: 0, x2: currSp._cx, y2: rows }
						];

					for(var j = 0, maxj = currAreas.length; j < maxj; j++) {
						var currArea = currAreas[j];
					
						for(var k = 0, maxk = areas.length; k < maxk; k++) {
							var area = areas[k];
						
							var inter = intersectionRect(area, currArea);
							if(inter) {
								currArea.inter = true;
								if(!this._inMem(memory, inter)) {
	 								newAreas.push(inter);
	 								this._toMem(memory, inter);
	 							}
							}
						}

						if(!currArea.inter && !this._inMem(memory, currArea)) {
							newAreas.push(currArea);
	 						this._toMem(memory, currArea);

	 						delete currArea.inter;
						}
					}

					if(newAreas.length) {
						areas = newAreas;
					} else {
						areas = currAreas;
					}
				}

				newAreas = currAreas = currSp = memory = null;
			}

			if(!areas.length) {
				areas.push({ x1: 0, y1: 0, x2: cols, y2: rows });
			} else {
				if(this._debug) {
					this._clearOutlinesContainer();
				}

				for(var i = 0; i < areas.length; i++) {
					var area = areas[i];
				
					if ((area.x2 - area.x1) < (spWidth + (2 * spMargin)) ||
						(area.y2 - area.y1) < (spHeight + (2 * spMargin))) {
						areas.splice(i, 1);
						i--;
					}

					if(this._debug) {
						this._addOutline(area);
					}
				}
			}

			if(areas.length) {
				return areas[Math.randomInt(0, areas.length-1)];
			} else {
				return null;
			}
		},
		_mousemoveHandler: function(e) {
			var x = e.layerX || e.x;
			var y = e.layerY || e.y;

			var pX = Math.floor(x/this._fgD);
			if(pX >= this._cols) pX =  this._cols-1;

			var pY = Math.floor(y/this._fgD);
			if(pY >= this._rows) pY =  this._rows-1;

			var cC = this._cC = this.grid[pX][pY];
			var pC = this._pC;
			this._pC = cC;

			if(cC !== pC) {
				if(pC && !pC._sp) {
					this._hide(pC);
				}

				if(!cC._sp) {
					this._show(cC);
				}

				this.drawer.playAnimations();
			}

			return true;
		},
		_mouseoutHandler: function() {
			this._hide(this._cC);

			this.drawer.playAnimations();

			this._cC = this._pC = null;

			return true;
		},
		_preShowShapeHandler: function(sp) {
			if(this._debug) {
				sp._sshT = performance.now();
			}

			return true;
		},
		_postHideShapeHandler: function(sp) {
			if(this._debug) {
				sp._eshT = performance.now();

				var dshT = Math.round(sp._eshT - sp._sshT);

				console.log(sp.name + ' lifetime: ' + dshT);
			}

			sp._sshT = sp._eshT = null;

			return true;
		},
		_inMem: function(mem, rect) {
			if (!mem[rect.x1] ||
				!mem[rect.x1][rect.y1] ||
				!mem[rect.x1][rect.y1][rect.x2] ||
				!mem[rect.x1][rect.y1][rect.x2][rect.y2]) {
				return false;
			} else {
				return true;
			}
		},
		_toMem: function(mem, rect) {
			if(!mem[rect.x1]) {
				mem[rect.x1] = [ ];
			}

			if(!mem[rect.x1][rect.y1]) {
				mem[rect.x1][rect.y1] = [ ];
			}

			if(!mem[rect.x1][rect.y1][rect.x2]) {
				mem[rect.x1][rect.y1][rect.x2] = [ ];
			}

			if(!mem[rect.x1][rect.y1][rect.x2][rect.y2]) {
				mem[rect.x1][rect.y1][rect.x2][rect.y2] = rect;
			}

			return rect;
		},
		// debug >>
		_onDebugMode: function() {
			if(this._debug) return false;
			else this._debug = true;

			if(!this._outlinesContainer) {
				var cont = this._outlinesContainer = document.createElement('DIV');
				cont.className = 'outlines';
			}
			
			if(this.canvas && this.canvas.parentNode) {
				this.canvas.parentNode.appendChild(cont);
			}

			return true;
		},
		_offDebugMode: function() {
			if(!this._debug) return false;
			else this._debug = false;

			var cont = this._outlinesContainer;

			if(cont.parentNode) {
				cont.parentNode.removeChild(cont);
			}

			return true;
		},
		_clearOutlinesContainer: function() {
			var cont = this._outlinesContainer;

			while(cont.firstChild) {
				cont.removeChild(cont.firstChild);
			}

			return true;
		},
		_addOutline: function(area) {
			var fgD = this._fgD;
			var cont = this._outlinesContainer;

			var d = area.outline = cont.appendChild(document.createElement('DIV'));
			d.style.top = area.y1*fgD + 'px';
			d.style.left = area.x1*fgD + 'px';
			d.style.height = (area.y2 - area.y1)*fgD + 'px';
			d.style.width = (area.x2 - area.x1)*fgD + 'px';

			return true;
		},
		_higlightOutline: function(area) {
			var out = area.outline;

			if(out) {
				out.style.outline = '2px solid green';
				out.style.zIndex = 1;

				return true;
			} else {
				return false;
			}
		}
		// << debug
	// << internal
	}

	return LiveBackground;
});