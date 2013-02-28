define([ 'drawer', 'jquery', 'creator/keyboard', 'jqueryui', 'colorpicker', 'misc' ], function(Drawer, $, Keyboard) {
	LiveBackgroundCreator = function(pr) {
		var def = {
			canvasHeight: 30,
			canvasWidth: 30
		};

		var proto = this.proto = (pr ? {
			canvasHeight: pr.canvasHeight !== undefined ? parseInt0(pr.canvasHeight) : def.canvasHeight,
			canvasWidth: pr.canvasWidth !== undefined ? parseInt0(pr.canvasWidth) : def.canvasWidth
		} : def);

		this._createCanvas(proto.canvasHeight, proto.canvasWidth);
		this._createUI();

		var els = $();
		els = els.add(this.canvas.container);
		els = els.add(this.ui.container);

		this._elements = els;

		this._keyboard = new Keyboard({
			element: this.canvas.container,
			handlers: [
				{
					pt: 'LeftArrow',
					fn: $.proxy(this._leftArrowPressHandler, this),
					rp: true,
					op: false
				},
				{
					pt: 'UpArrow',
					fn: $.proxy(this._upArrowPressHandler, this),
					rp: true,
					op: false
				},
				{
					pt: 'RightArrow',
					fn: $.proxy(this._rightArrowPressHandler, this),
					rp: true,
					op: false
				},
				{
					pt: 'DownArrow',
					fn: $.proxy(this._downArrowPressHandler, this),
					rp: true,
					op: false
				},
				{
					pt: 'Enter',
					fn: $.proxy(this._enterPressHandler, this),
					rp: true,
					op: false
				}
			]
		});
	};

	LiveBackgroundCreator.prototype = {
		toString: function() { return '[object LiveBackgroundCreator]'; },
		ids: {
			canvas: 'canvas',
			ui: 'ui',
			uiPoint: 'point_settings',
			uiShape: 'shape_settings',
			uiPointStrokeColorInput: 'point_stroke_color',
			uiPointFillColorInput: 'point_fill_color',
			uiPointShowTimeInput: 'point_show_time',
			uiPointShowDelayInput: 'point_show_delay',
			uiPointHideTimeInput: 'point_hide_time',
			uiPointHideDelayInput: 'point_hide_delay',
			uiShapeStrokeColorInput: 'shape_stroke_color',
			uiShapeFillColorInput: 'shape_fill_color',
			uiShapeShowTimeInput: 'shape_show_time',
			uiShapeShowDelayInput: 'shape_show_delay',
			uiShapeHideTimeInput: 'shape_hide_time',
			uiShapeHideDelayInput: 'shape_hide_delay',
			uiColorpicker: 'colorpicker'
		},
		classNames: {
			checkedPoint: 'checked',
			hoverPoint: 'hover'
		},
		init: function(parent) {
			parent = $(parent);
			if(parent.length) {
				parent.append(this._elements);

				var point = this._currentPoint = this.canvas.points[0][0];
				this._markPoint(point);
				this._adjustUI(point);

				return true;
			} else {
				return false;
			}
		},
		togglePoint: function(point) {
			if(point.checked) {
				point.checked = false;

				point.element.removeClass(this.classNames.checkedPoint);
			} else {
				point.checked = true;

				point.element.addClass(this.classNames.checkedPoint);
			}

			return true;
		},
	// internal >>
		_createCanvas: function(h, w) {
			if(h && w) {
				var canvas = this.canvas = {
					container: $('<div id=' + this.ids.canvas + '></div>'),
					height: h,
					width: w,
					points: Array.dim(h, w)
				};

				for(var i = 0, maxi = h*w; i < maxi; i++) {
					var iX = i - (Math.floor(i / h) * w),
						iY = Math.floor(i / h),
						point = canvas.points[iY][iX] = this._createPoint(iX, iY);

					canvas.container.append(point.element);
				}

				return true;
			} else {
				return true;
			}
		},
		_createPoint: function(x, y) {
			var point = {
				element: $('<span><span><span><span></span></span></span></span>'),
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
				set: function(prop, val) {
					this[prop] = val;

					switch(prop) {
						case 'strokeColor': 
							this.bullet.css('border-color', val);
						break;
						case 'fillColor': 
							this.bullet.css('background-color', val);
						break;
						default: break;
					}

					return true;
				}
			};

			point.bullet = point.element.find('span span span');
			point.element.on('click', $.proxy(this._pointClickHandler, this, point));

			return point;
		},
		_createUI: function() {
			var ui = this.ui = {
				container: $(
// ui html >>
	'<form id="' + this.ids.ui + '">' + 
		'<fieldset id="' + this.ids.uiPoint + '">' +
			'<legend>Point settings</legend>' +
			'<fieldset>' +
				'<legend>Colors</legend>' +
				'<div>' +
					'<label for="' + this.ids.uiPointStrokeColorInput + '">Stroke</label>' +
					'<input id="' + this.ids.uiPointStrokeColorInput + '" type="text" value="default"></input>' +
				'</div>' + 
				'<div>' +
					'<label for="' + this.ids.uiPointFillColorInput + '">Fill</label>' +
					'<input id="' + this.ids.uiPointFillColorInput + '" type="text" value="default"></input>' + 
				'</div>' +
			'</fieldset>' +
			'<fieldset>' +
				'<legend>Showing</legend>' + 
				'<div>' +
					'<label for="' + this.ids.uiPointShowTimeInput + '">Time</label>' +
					'<input id="' + this.ids.uiPointShowTimeInput + '" type="text" value="default"></input>' +
				'</div>' +
				'<div>' +
					'<label for="' + this.ids.uiPointShowDelayInput + '">Delay</label>' +
					'<input id="' + this.ids.uiPointShowDelayInput + '" type="text" value="default"></input>' +
				'</div>' +
			'</fieldset>' +
			'<fieldset>' +
				'<legend>Hiding</legend>' + 
				'<div>' +
					'<label for="' + this.ids.uiPointHideTimeInput + '">Time</label>' +
					'<input id="' + this.ids.uiPointHideTimeInput + '" type="text" value="default"></input>' +
				'</div>' +
				'<div>' +
					'<label for="' + this.ids.uiPointHideDelayInput + '">Delay</label>' +
					'<input id="' + this.ids.uiPointHideDelayInput + '" type="text" value="default"></input>' +
				'</div>' +
			'</fieldset>' +
		'</fieldset>' +
		'<fieldset id="' + this.ids.uiShape + '">' +
			'<legend>Shape settings</legend>' +
			'<fieldset>' +
				'<legend>Colors</legend>' +
				'<div>' +
					'<label for="' + this.ids.uiShapeStrokeColorInput + '">Stroke</label>' +
					'<input id="' + this.ids.uiShapeStrokeColorInput + '" type="text" type="text" value="default"></input>' +
				'</div>' + 
				'<div>' +
					'<label for="' + this.ids.uiShapeFillColorInput + '">Fill</label>' +
					'<input id="' + this.ids.uiShapeFillColorInput + '" type="text" type="text" value="default"></input>' + 
				'</div>' +
			'</fieldset>' +
			'<fieldset>' +
				'<legend>Showing</legend>' + 
				'<div>' +
					'<label for="' + this.ids.uiShapeShowTimeInput + '">Time</label>' +
					'<input id="' + this.ids.uiShapeShowTimeInput + '" type="text" value="default"></input>' +
				'</div>' +
				'<div>' +
					'<label for="' + this.ids.uiShapeShowDelayInput + '">Delay</label>' +
					'<input id="' + this.ids.uiShapeShowDelayInput + '" type="text" value="default"></input>' +
				'</div>' +
			'</fieldset>' +
			'<fieldset>' +
				'<legend>Hiding</legend>' + 
				'<div>' +
					'<label for="' + this.ids.uiShapeHideTimeInput + '">Time</label>' +
					'<input id="' + this.ids.uiShapeHideTimeInput + '" type="text" value="default"></input>' +
				'</div>' +
				'<div>' +
					'<label for="' + this.ids.uiShapeHideDelayInput + '">Delay</label>' +
					'<input id="' + this.ids.uiShapeHideDelayInput + '" type="text" value="default"></input>' +
				'</div>' +
			'</fieldset>' +
		'</fieldset>' +
		'<fieldset id="' + this.ids.uiColorpicker + '">' +
		'</fieldset>' +
	'</form>'
// << ui html
				)
			};

			var cont = this.ui.container;

			this.ui.point = {
				colors: {
					stroke: cont.find('#' + this.ids.uiPointStrokeColorInput).prop('referenceProperty', 'strokeColor'),
					fill: cont.find('#' + this.ids.uiPointFillColorInput).prop('referenceProperty', 'fillColor')
				},
				showing: {
					time: cont.find('#' + this.ids.uiPointShowTimeInput).spinner().prop('referenceProperty', 'showTime'),
					delay: cont.find('#' + this.ids.uiPointShowDelayInput).spinner().prop('referenceProperty', 'showDelay')
				},
				hiding: {
					time: cont.find('#' + this.ids.uiPointHideTimeInput).spinner().prop('referenceProperty', 'hideTime'),
					delay: cont.find('#' + this.ids.uiPointHideDelayInput).spinner().prop('referenceProperty', 'hideDelay')
				},
				inputs: cont.find('#' + this.ids.uiPoint + ' input[type="text"]')
			};

			this.ui.shape = {
				colors: {
					stroke: cont.find('#' + this.ids.uiShapeStrokeColorInput).prop('referenceProperty', 'strokeColor'),
					fill: cont.find('#' + this.ids.uiShapeFillColorInput).prop('referenceProperty', 'fillColor')
				},
				showing: {
					time: cont.find('#' + this.ids.uiShapeShowTimeInput).spinner().prop('referenceProperty', 'showTime'),
					delay: cont.find('#' + this.ids.uiShapeShowDelayInput).spinner().prop('referenceProperty', 'showDelay')
				},
				hiding: {
					time: cont.find('#' + this.ids.uiShapeHideTimeInput).spinner().prop('referenceProperty', 'hideTime'),
					delay: cont.find('#' + this.ids.uiShapeHideDelayInput).spinner().prop('referenceProperty', 'hideDelay')
				},
				inputs: cont.find('#' + this.ids.uiShape + ' input[type="text"]')
			};

			this.ui.inputs = cont.find('input[type="text"]');
			this.ui.inputs.on('change', $.proxy(this._inputValueChangeHandler, this));
			
			this.ui.point.inputs.prop('referenceObject', 'point');
			this.ui.shape.inputs.prop('referenceObject', 'shape');

			///this.ui.colorpicker = cont.find(this.uiColorpicker).colorpicker();

			return true;
		},
		_adjustUI: function(point) {
			var ui = this.ui.point;
				
			ui.colors.stroke.prop('value', (point.strokeColor || 'default'));
			ui.colors.fill.prop('value', (point.fillColor || 'default'));

			ui.showing.time.prop('value', (point.showTime || 'default'));
			ui.showing.delay.prop('value', (point.showDelay || 'default'));

			ui.hiding.time.prop('value', (point.hideTime || 'default'));
			ui.hiding.delay.prop('value', (point.hideDelay || 'default'));			
			return true;
		},
		_setCurrentPoint: function(point, noCheck) {
			if(this._currentPoint) {
				this._savePoint(this._currentPoint);

				this._unmarkPoint(this._currentPoint);
			}

			if(!(noCheck || point.checked) || (point === this._currentPoint)) {
				this.togglePoint(point);
			}

			this._markPoint(point);

			this._adjustUI(point);

			this._currentPoint = point;

			return true;
		},
		_savePoint: function(point) {
			this.ui.point.inputs.each(function() {
				input = $(this);
				point.set(input.prop('referenceProperty'), input.prop('value'));
			});

			return true;
		},
		_markPoint: function(point) {
			point.element.addClass(this.classNames.hoverPoint);

			return true;
		},
		_unmarkPoint: function(point) {
			point.element.removeClass(this.classNames.hoverPoint);

			return true;
		},
		_pointClickHandler: function(point) {
			
			return this._setCurrentPoint(point);
		},
		_leftArrowPressHandler: function() {
			var nextX = this._currentPoint.x - 1,
				nextY = this._currentPoint.y,
				nextPoint = (nextX >= 0 ? this.canvas.points[nextY][nextX] : null);

			if(nextPoint) {
				return this._setCurrentPoint(nextPoint, true);
			} else {
				return false;
			}
		},
		_upArrowPressHandler: function() {
			var nextX = this._currentPoint.x,
				nextY = this._currentPoint.y - 1,
				nextPoint = (nextY >= 0 ? this.canvas.points[nextY][nextX] : null);

			if(nextPoint) {
				return this._setCurrentPoint(nextPoint, true);
			} else {
				return false;
			}
		},
		_rightArrowPressHandler: function() {
			var nextX = this._currentPoint.x + 1,
				nextY = this._currentPoint.y,
				nextPoint = (nextX < this.canvas.points[nextY].length ? this.canvas.points[nextY][nextX] : null);

			if(nextPoint) {
				return this._setCurrentPoint(nextPoint, true);
			} else {
				return false;
			}
		},
		_downArrowPressHandler: function() {
			var nextX = this._currentPoint.x,
				nextY = this._currentPoint.y + 1,
				nextPoint = (nextY < this.canvas.points.length ? this.canvas.points[nextY][nextX] : null);

			if(nextPoint) {
				return this._setCurrentPoint(nextPoint, true);
			} else {
				return false;
			}
		},
		_enterPressHandler: function() {
			if(this._currentPoint) {
				this.togglePoint(this._currentPoint);

				return true;
			} else {
				return false;
			}
		},
		_inputValueChangeHandler: function(e) {
			var input = $(e.delegateTarget);

			if((input.prop('referenceObject') == 'point') && this._currentPoint) {
				this._currentPoint.set(input.prop('referenceProperty'), input.attr('value'));
			}
		}
	// << internal
	};

	return LiveBackgroundCreator;
});