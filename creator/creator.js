define([ 'text!creator/templates/ui.tpl', 'text!creator/templates/point.tpl', 'drawer', 'creator/keyboard', 'misc', 'jqueryUi', 'jqueryUiWidgets', 'colorpicker' ], function(TUi, TPoint, Drawer, Keyboard) {
	ShapeCreator = function(pr) {
		var def = {
			canvasHeight: 30,
			canvasWidth: 30
		},
		proto = this.proto = (pr ? {
			canvasHeight: pr.canvasHeight !== undefined ? parseInt0(pr.canvasHeight) : def.canvasHeight,
			canvasWidth: pr.canvasWidth !== undefined ? parseInt0(pr.canvasWidth) : def.canvasWidth
		} : def),
		els = $();

		this._createCanvas(proto.canvasHeight, proto.canvasWidth);
		this._createUI();

		els = els.add(this.canvas.container);
		els = els.add(this.ui.container);

		this._elements = els;

		this._shapeSettings = { };
		this._currentSettings = { };

		$(window).on('beforeunload', function() {
			return 'If you leave this page, you link loose unsaved work!';
		});

	// keys binding >>
		var leftArrowPressHandler = function(e) {
				if(e.target !== document.body) return false;

				var nextX = this._currentPoint.x - 1,
					nextY = this._currentPoint.y,
					nextPoint = (nextX >= 0 ? this.canvas.points[nextY][nextX] : null);

				if(nextPoint) {
					return this._setCurrentPoint(nextPoint, true);
				} else {
					return false;
				}
			},
			upArrowPressHandler = function(e) {
				if(e.target !== document.body) return false;

				var nextX = this._currentPoint.x,
					nextY = this._currentPoint.y - 1,
					nextPoint = (nextY >= 0 ? this.canvas.points[nextY][nextX] : null);

				if(nextPoint) {
					return this._setCurrentPoint(nextPoint, true);
				} else {
					return false;
				}
			},
			rightArrowPressHandler = function(e) {
				if(e.target !== document.body) return false;

				var nextX = this._currentPoint.x + 1,
					nextY = this._currentPoint.y,
					nextPoint = (nextX < this.canvas.points[nextY].length ? this.canvas.points[nextY][nextX] : null);

				if(nextPoint) {
					return this._setCurrentPoint(nextPoint, true);
				} else {
					return false;
				}
			},
			downArrowPressHandler = function(e) {
				if(e.target !== document.body) return false;

				var nextX = this._currentPoint.x,
					nextY = this._currentPoint.y + 1,
					nextPoint = (nextY < this.canvas.points.length ? this.canvas.points[nextY][nextX] : null);

				if(nextPoint) {
					return this._setCurrentPoint(nextPoint, true);
				} else {
					return false;
				}
			},
			enterPressHandler = function(e) {
				if(e.target !== document.body) return false;

				if(this._currentPoint) {
					this.togglePoint(this._currentPoint);

					return true;
				} else {
					return false;
				}
			};

		this._keyboard = new Keyboard({
			element: $(document.body),
			handlers: [
				{
					pt: 'LeftArrow',
					fn: $.proxy(leftArrowPressHandler, this),
					rp: true,
					op: false
				},
				{
					pt: 'UpArrow',
					fn: $.proxy(upArrowPressHandler, this),
					rp: true,
					op: false
				},
				{
					pt: 'RightArrow',
					fn: $.proxy(rightArrowPressHandler, this),
					rp: true,
					op: false
				},
				{
					pt: 'DownArrow',
					fn: $.proxy(downArrowPressHandler, this),
					rp: true,
					op: false
				},
				{
					pt: 'Enter',
					fn: $.proxy(enterPressHandler, this),
					rp: true,
					op: false
				}
			]
		});
	// << keys binding
	};

	ShapeCreator.prototype = {
		toString: function() { return '[object ShapeCreator]'; },
		ids: {
			canvas: 'canvas',
			ui: {
				self: 'ui',
				point: {
					self: 'point_settings',
					colors: {
						stroke: 'point_stroke_color',
						fill: 'point_fill_color'
					},
					showing: {
						time: 'point_show_time',
						delay: 'point_show_delay',
						easing: 'point_show_easing'
					},
					hiding: {
						time: 'point_hide_time',
						delay: 'point_hide_delay',
						easing: 'point_hide_easing'
					}
				},
				shape: {
					self: 'shape_settings',
					colors: {
						stroke: 'shape_stroke_color',
						fill: 'shape_fill_color'
					},
					showing: {
						time: 'shape_show_time',
						delay: 'shape_show_delay',
						easing: 'shape_show_easing'
					},
					hiding: {
						time: 'shape_hide_time',
						delay: 'shape_hide_delay',
						easing: 'shape_hide_easing'
					}
				},
				code: {
					self: 'shape_code',
					get: 'get_shape_code',
					load: 'load_shape',
					text: 'shape_code_text'
				},
				eraseConfirmation: 'erase_confirmation',
				overwriteConfirmation: 'overwrite_confirmation',
				extrapolate: {
					self: 'extrapolate_properties_toolbar',
					next: 'extrapolate_properties_to_next_points',
					all: 'extrapolate_properties_to_all_points'
				}
			}
		},
		classNames: {
			canvas: {
				point: {
					checked: 'checked',
					hover: 'hover'
				}
			},
			ui: {

			}
		},
		init: function(parent) {
			parent = $(parent);
			if(parent.length) {
				parent.append(this._elements);

				this._setCurrentPoint(this.canvas.points[0][0], true);

				return true;
			} else {
				return false;
			}
		},
		togglePoint: function(point) {
			if(point.checked) {
				this._uncheckPoint(point); 
			} else {
				this._checkPoint(point);
			}

			return true;
		},
		getShape: function() {
			if(this._currentPoint) {
				this._savePoint(this._currentPoint);
			}

			var spO = $.extend({ }, this._shapeSettings);

			this._getShapePoints(spO);

			return spO;
		},
		loadShape: function(spO) {
			var cvsPoints = this.canvas.points,
				spPoints = spO.points,
				offX = Math.floor((this.canvas.width - spO.width) / 2),
				offY = Math.floor((this.canvas.height - spO.height) / 2),
				shapeIterator = function(value, prop) {
					this._setShapeProperty(prop, value);
				},
				pointIterator = function(point) {
					return function(value, prop) {
						this._defaultSettings(point);
						this._setPointProperty(point, prop, value);
					};
				};

			this.clear();

			_.each(spO, shapeIterator, this);

			if(spPoints) {
				for(var i = 0, maxi = spPoints.length; i < maxi; i++) {
					var spPoint = spPoints[i],
						cvsPoint = cvsPoints[spPoint.y + offY][spPoint.x + offX];
				
					this._checkPoint(cvsPoint);
					_.each(spPoint, pointIterator.call(this, cvsPoint), this);
				}
			}

			this._adjustUI();
		},
		clear: function() {
			var cvsPoints = this.canvas.points,
				spSettings = this._shapeSettings,
				shapeIterator = function(value, prop) {
					this._setShapeProperty(prop, undefined);
				},
				pointIterator = function(point) {
					return function(value, prop) {
						this._setPointProperty(point, prop, undefined);
					};
				};

			_.each(spSettings, shapeIterator, this);

			for(var i = 0, maxi = cvsPoints.length; i < maxi; i++) {
				var row = cvsPoints[i];

				for(var j = 0, maxj = cvsPoints.length; j < maxi; j++) {
					var point = row[j];
				
					this._uncheckPoint(point);
					_.each(point, pointIterator.call(this, point), this);
				}
			}
		},
	// internal >>
		_createCanvas: function(h, w) {
			if(h && w) {
				var canvas = this.canvas = {
					container: $('<div id=' + this.ids.canvas + '></div>'),
					height: h,
					width: w,
					points: Array.dim(h, w),
					checkedPoints: [ ]
				},
				pointClickHandler = function(point) {
		
					return this._setCurrentPoint(point);
				};

				for(var i = 0, maxi = h*w; i < maxi; i++) {
					var iX = i - (Math.floor(i / h) * w),
						iY = Math.floor(i / h),
						point = canvas.points[iY][iX] = this._createPoint(iX, iY, pointClickHandler);

					canvas.container.append(point.element);
				}

				return true;
			} else {
				return true;
			}
		},
		_createPoint: function(x, y, clickHandler) {
			var pointTemplate = _.template(TPoint),
				point = {
				element: $(pointTemplate()),
				x: x,
				y: y,
				checked: false,
				strokeColor: undefined,
				fillColor: undefined,
				showTime: undefined,
				showDelay: undefined,
				showEasing: undefined,
				hideTime: undefined,
				hideDelay: undefined,
				hideEasing: undefined,
				set: this._setPointProperty
			};

			point.bullet = point.element.find('span span span');
			point.element.on('click', $.proxy(clickHandler, this, point));

			return point;
		},
		_createUI: function() {
			var ui, uiCont, uiTemplate,
				ids = this.ids.ui,
				classNames = this.classNames.ui,
				easingFunctions = {
					default: 'default',
					linear: 'linear',
					easeOut: 'ease-out',
					easeOutSine: 'ease-out sine',
					easeIn: 'ease-in',
					easeInSine: 'ease-in sine'
				},
			// event handlers >>
				inputValueChangeHandler = function(e) {
					var input = $(e.delegateTarget || e.target),
						obj = input.prop('referenceObject'),
						prop = input.prop('referenceProperty'),
						value = (input.val() != 'default' ? input.val() : undefined);

					if((obj == 'point') && this._currentPoint) {
						this._setPointProperty(this._currentPoint, prop, value);
					} else if(obj == 'shape') {
						this._setShapeProperty(prop, value);
					}
				},
				getCodeButtonClickHandler =  function() {
					var sp = this.getShape();

					this.ui.code.text.val(JSON.stringify(sp, $.proxy(this._jsonReplacer), "\t"));
				},
				loadShapeButtonClickHandler = function() {
					if(this.ui.code.text.val() != '') {
						if(this.canvas.checkedPoints.length) {
							this.ui.eraseConfirmationDialog.dialog('open');
						} else {
							loadShapeFromText();
						}
					}
				},
				extNextPointsButtonClickHandler = function(e) {
					e.preventDefault();

					this._saveToDefaults(this._currentField);
				},
				extAllPointsButtonClickHandler = function(e) {
					e.preventDefault();

					ui.overwriteConfirmationDialog.dialog('open');
				},
				inputFocusHandler = function(e) {
					var input = $(e.delegateTarget);

					this._currentField = input;
					
					if(input.prop('referenceObject') == 'point') {
						showToolbar(input);
					}
				},
				inputBlurHandler = function(e) {
					var input = $(e.delegateTarget);

					ui.extrapolate.hideTimeout = setTimeout(function() {
						this._currentField = null;

						if(input.prop('referenceObject') == 'point') {
							hideToolbar();
						}
					}, 200);
				},
			// << event handlers
				spinnerOptions = {
					min: -1,
					max: 99999,
					step: 1,
					page: 100,
					maskedValues: {
						'-1': 'default'
					}
				},
				extrapolateButtonOptions = {
					text: false,
					hint: true
				},
				colorpickerOptions = {

					select: $.proxy(inputValueChangeHandler, this)
				},
				easingListOptions = {
					options: easingFunctions,
					defaultSelected: 'default'
				},
				buildSegment = function(name, cont, model, inputs) {
					var segment = cont[name] = { };

					_.each(model[name], function(val, key) {
						if(_.isString(val)) {
							segment[key] = uiCont.find('#' + val);
						} else {
							buildSegment(key, segment, model[name]);
						}

						if((key == 'self') && inputs) {
							segment.inputs = segment.self.find('input[type="text"], select').prop('referenceObject', name);
						}
					});
				},
				assignProperties = function(cont) {
					cont.colors.stroke.prop('referenceProperty', 'strokeColor').colorpickerEnchanced(colorpickerOptions);
					cont.colors.fill.prop('referenceProperty', 'fillColor').colorpickerEnchanced(colorpickerOptions);

					_.each([ [ 'show', 'showing' ], [ 'hide', 'hiding' ] ], function(key) {
						cont[key[1]].time.prop('referenceProperty', key[0] + 'Time').spinnerEnchanced(spinnerOptions);
						cont[key[1]].delay.prop('referenceProperty', key[0] + 'Delay').spinnerEnchanced(spinnerOptions);

						cont[key[1]].easing.prop('referenceProperty', key[0] + 'Easing').optionsList(easingListOptions);
					});
				},
				buildOptionsList = function(list) {
					var options = $();

					_.each(list, function(value, key) {
						var option = $('<option value="' + key + '">' + value + '</option>');

						options = options.add(option);
					});

					$(options.get(0)).attr('selected', 'selected');

					return options;
				},
				loadShapeFromText = $.proxy(function() {

					this.loadShape(JSON.parse(ui.code.text.val()));
				}, this),
				showToolbar = function(relInput) {
					var parent = relInput.parent(),
						off = parent.offset();

					ui.extrapolate.self.floatingToolbar('position', off.left + parent.outerWidth(), off.top);
					clearTimeout(ui.extrapolate.hideTimeout);
					ui.extrapolate.self.floatingToolbar('show');
				},
				hideToolbar = function() {

					ui.extrapolate.self.floatingToolbar('hide');
				};

			uiTemplate = _.mustacheTemplate(TUi);
			uiCont = $(uiTemplate({ ids: ids, classNames: classNames }));

			ui = this.ui = {
				container: uiCont,
				inputs: uiCont.find('input[type="text"], select').on('change', $.proxy(inputValueChangeHandler, this)).on('focus', $.proxy(inputFocusHandler, this)).on('blur', $.proxy(inputBlurHandler, this))
			};

			buildSegment('point', ui, ids, true);
			assignProperties(ui.point);

			buildSegment('shape', ui, ids, true);
			assignProperties(ui.shape);

			buildSegment('code', ui, ids);
			ui.code.get.on('click', $.proxy(getCodeButtonClickHandler, this));
			ui.code.load.on('click', $.proxy(loadShapeButtonClickHandler, this));

			buildSegment('extrapolate', ui, ids);
			ui.extrapolate.self.floatingToolbar({ hidden: true });
			ui.extrapolate.next.buttonEnchanced($.extend({
				icons: { primary: 'ui-icon-arrowthick-1-e' },
				action: $.proxy(extNextPointsButtonClickHandler, this)
			}, extrapolateButtonOptions));
			ui.extrapolate.all.buttonEnchanced($.extend({
				icons: { primary: 'ui-icon-arrowthick-2-e-w' },
				action: $.proxy(extAllPointsButtonClickHandler, this)
			}, extrapolateButtonOptions));

			var creator = this,
				dialogCont = uiCont.find('#' + ids.eraseConfirmation);
			ui.eraseConfirmationDialog = dialogCont.find('p').dialog({
				resizable: false,
				dialogClass: 'no-close',
				minWidth: 500,
				modal: true,
				title: dialogCont.find('legend').text(),
				buttons: (function() {
					var buttons = { },
						yesLabel = dialogCont.find('input[type="button"][role="yes"]').val(),
						noLabel = dialogCont.find('input[type="button"][role="no"]').val();

					buttons[yesLabel] = function() {
						$(this).dialog('close');

						loadShapeFromText();
					};
				 	buttons[noLabel] = function() {

						$(this).dialog('close');
					};

					return buttons;
				})(),
				create: function() {
					dialogCont.remove();
				}
			}).dialog('close');

			dialogCont = uiCont.find('#' + ids.overwriteConfirmation);
			ui.overwriteConfirmationDialog = dialogCont.find('p').dialog({
				resizable: false,
				dialogClass: 'no-close',
				minWidth: 500,
				modal: true,
				title: dialogCont.find('legend').text(),
				buttons: (function() {
					var buttons = { },
						yesLabel = dialogCont.find('input[type="button"][role="yes"]').val(),
						noLabel = dialogCont.find('input[type="button"][role="no"]').val();

					buttons[yesLabel] = function() {
						$(this).dialog('close');

						creator._saveToDefaults(creator._currentField);
						creator._saveToAllPoints(creator._currentField);

					};
				 	buttons[noLabel] = function() {

						$(this).dialog('close');
					};

					return buttons;
				})(),
				create: function() {
					dialogCont.remove();
				}
			}).dialog('close');

			return true;
		},
		_adjustUI: function(point) {
			var ui = this.ui[point? 'point' : 'shape'],
				src = point || this._shapeSettings;
				
			ui.colors.stroke.prop('value', (src.strokeColor !== undefined ? src.strokeColor: 'default'));
			ui.colors.fill.prop('value', (src.fillColor !== undefined ? src.fillColor : 'default'));

			ui.showing.time.prop('value', (src.showTime !== undefined ? src.showTime : 'default'));
			ui.showing.delay.prop('value', (src.showDelay !== undefined ? src.showDelay : 'default'));
			ui.showing.easing.prop('value', (src.showEasing !== undefined ? src.showEasing : 'default'));

			ui.hiding.time.prop('value', (src.hideTime !== undefined ? src.hideTime : 'default'));
			ui.hiding.delay.prop('value', (src.hideDelay !== undefined ? src.hideDelay : 'default'));
			ui.hiding.easing.prop('value', (src.hideEasing !== undefined ? src.hideEasing : 'default'));		
			return true;
		},
		_setCurrentPoint: function(point, noCheck) {
			if(this._currentPoint !== point) {
				this._savePoint(this._currentPoint);

				this._unmarkPoint(this._currentPoint);
			}

			if(!(noCheck || point.checked) || (point === this._currentPoint)) {
				this.togglePoint(point);
			}

			this._defaultSettings(point);

			this._markPoint(point);

			if(!point.checked) {
				this._setPointProperty(point, 'strokeColor', undefined, true);
			}

			this._adjustUI(point);

			this._currentPoint = point;

			return true;
		},
		_defaultSettings: function(point) {
			if(!point) return false;

			_.each(point, function(value, prop) {
				if(point[prop] === undefined) {
					var newValue = typeof this._currentSettings[prop] != 'undefined' ? this._currentSettings[prop] : value;

					if(newValue != value) { // default point setting
						this._setPointProperty(point, prop, newValue);
					} else { // shape setting
						this._setPointProperty(point, prop, undefined, true);
					}
				}
			}, this);

			return true;
		},
		_saveToDefaults: function(input) {
			if(input && input.prop('referenceObject') == 'point') {
				var prop = input.prop('referenceProperty'),
					val = input.val();

				if(val != 'default') {
					this._currentSettings[prop] = val;
				} else {
					delete this._currentSettings[prop];
				}

				return true;
			} else {
				return false;
			}
		},
		_saveToAllPoints: function(input) {
			if(input && input.prop('referenceObject') == 'point') {
				var points = this.canvas.checkedPoints,
					prop = input.prop('referenceProperty'),
					val = (input.val() != 'default' ? input.val() : undefined);

				points.forEach(function(point) {
					this._setPointProperty(point, prop, val)
				}, this);

				return true;
			} else {
				return false;
			}
		},
		_savePoint: function(point) {
			if(!point) return false;

			this.ui.point.inputs.each($.proxy(function(index, input) {
				var input = $(input),
					val = input.prop('value');

				if(val != 'default') {
					this._setPointProperty(point, input.prop('referenceProperty'), val);
				} else {
					this._setPointProperty(point, input.prop('referenceProperty'), undefined);
				}
			}, this));

			return true;
		},
		_markPoint: function(point) {
			if(!point) return false;

			point.element.addClass(this.classNames.canvas.point.hover);

			return true;
		},
		_unmarkPoint: function(point) {
			if(!point) return false;

			point.element.removeClass(this.classNames.canvas.point.hover);

			if(!point.checked) { // clear properties
				_.each(point, function(value, prop) {
					this._setPointProperty(point, prop, undefined);
				}, this);
			}

			return true;
		},
		_checkPoint: function(point) {
			if(!point) return false;

			point.checked = true;

			point.element.addClass(this.classNames.canvas.point.checked);

			this._setPointProperty(point, 'strokeColor', point.strokeColor);

			this.canvas.checkedPoints.push(point);

			return true;
		},
		_uncheckPoint: function(point) {
			if(!point) return false;

			point.checked = false;

			point.element.removeClass(this.classNames.canvas.point.checked);

			this._setPointProperty(point, 'strokeColor', undefined, true);

			this.canvas.checkedPoints.splice(this.canvas.checkedPoints.indexOf(point), 1);

			return true;
		},
		_jsonReplacer: function(key, val) {
			if((key == 'set') && $.isFunction(val)
				|| ((key == 'element') || (key == 'bullet')) && (val.jquery)
				|| key == 'checked') {
				return undefined;
			} else {
				return val;
			}
		},
		_getShapePoints: function(spO) {
			var ps = this.canvas.points,
				minY = (this.canvas.height - 1), maxY = 0,
				minX = (this.canvas.width - 1), maxX = 0,
				points = spO.points = [ ];

			for(var i = 0, maxi = ps.length; i < maxi; i++) {
				var row = ps[i];

				for(var j = 0, maxj = ps.length; j < maxi; j++) {
					var p = row[j];

					if(p.checked) {
						points.push($.extend({ }, p));

						if(p.x > maxX) {
							maxX = p.x;
						}

						if(p.x < minX) {
							minX = p.x;
						}

						if(p.y > maxY) {
							maxY = p.y;
						}

						if(p.y < minY) {
							minY = p.y;
						}
					}
				}
			}

			spO.width = (maxX - minX) + 1;
			spO.height = (maxY - minY) + 1;

			for(var i = 0, maxi = points.length; i < maxi; i++) {
				var point = points[i];
			
				point.x -= minX;
				point.y -= minY;
			}

			return true;
		},
		_setPointProperty: function(point, prop, val, styleOnly) {
			if(!point || (prop == 'x') || (prop == 'y') || (prop == 'element') || (prop == 'bullet')) {
				return false;
			}

			if(val !== undefined) {
				if(!styleOnly) {
					if(!isNaN(parseInt(val))) {
						val = parseInt(val);
					}

					point[prop] = val;
				}
			} else {
				if(!styleOnly) {
					point[prop] = undefined;
				}

				var shapeSetting = this._shapeSettings[prop];
				val = (typeof shapeSetting != 'undefined') ? shapeSetting : '';
			}

			switch(prop) {
				case 'strokeColor': 
					point.bullet.css('border-color', val);
				break;
				case 'fillColor': 
					point.bullet.css('background-color', val);
				break;
				default: break;
			}

			return true;
		},
		_setShapeProperty: function(prop, val) {
			if((prop == 'points') || (prop == 'set')) {
				return false;
			}

			var spSettings = this._shapeSettings;

			if(val !== 'default') {
				var num = parseFloat(val);

				if(!isNaN(num)) {
					val = num;
				}

				spSettings[prop] = val;
			} else {
				delete spSettings[prop];
			}

			if(alt(prop, [ 'strokeColor', 'fillColor' ])) {
				this.canvas.checkedPoints.forEach(function(point) {
					if(point[prop] === undefined) {
						this._setPointProperty(point, prop, val, true);
					}
				}, this);
			}
			
			return true;
		}
	// << internal
	};

	return LiveBackgroundCreator;
});