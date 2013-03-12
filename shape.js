define([ 'misc', 'color' ], function() {
	Shape = function(pr) {
		/*pr = { // shape prototype
			// R - required
			// O - optional
			// def - default value for points
			width: 0, // R
			height: 0, // R
			x: undefined, // O, fixed position on grid
			y: undefined, // O, fixed position on grid
			margin: 5, // O, from canvas border and another shapes, only if random position
			priority: 1, // O, indicates frequency of drawing
			showTime: 0, // O, def
			showDelay: 0, // O, def
			showEasing: 'linear', // O, def
			hideTime: 1000, // O, def
			hideDelay: 0, // O, def
			hideEasing: 'easeOutSine', // O, def
			strokeColor: 'rgba(170, 170, 170, 1)', // O, def
			fillColor: 'transparent', // O, def
			points: [ // collection of points prototypes
				x: 0, // R, relative to top-left corner of shape
				y: 0, // R, relative to top-left corner of shape
				showTime: 0, // O
				showDelay: 0, // O, relative to shape showing start
				showEasing: 'linear', // O
				hideTime: 1000, // O
				hideDelay: 0, // O, relative to shape showing start
				hideEasing: 'easeOutSine', // O
				strokeColor: 'rgba(170, 170, 170, 1)', // O
				fillColor: 'transparent' // O
			} ]
		};*/

		this.points = (pr.points && pr.points.length ? pr.points : undefined);
		if(!this.points) return false;

		this.width = parseInt0(pr.width);
		this.height = parseInt0(pr.height);
		if(!this.width || !this.height) return false;

		this.x = (pr.x !== undefined ? parseInt0(pr.x) : undefined);
		this.y = (pr.y !== undefined ? parseInt0(pr.y) : undefined);

		this.margin = (pr.margin !== undefined ? parseInt0(margin) : 5);

		this.priority = (pr.priority !== undefined ? parseInt0(pr.priority) : 1);

		this.name = pr.name;

		this.pointsDefault = this._createPoint(pr);

		this.points = this.points.map(this._createPoint, this);
	} // << Shape

	Shape.prototype = {
		toString: function() { return '[object Shape]'; },
		getShowFinishingPoint: function(defShowTime, defShowDelay) {
			var max = null;
			var maxTime = 0;

			for(var i = 0; i < this.points.length; i++) {
				var cur = this.points[i];
				var curTime = (parseInt0(cur.showTime || defShowTime) + parseInt0(cur.showDelay || defShowDelay));

				if(curTime >= maxTime) {
					maxTime = curTime;
					max = cur;
				}
			}

			return max;
		},
		getHideFinishingPoint: function(defHideTime, defHideDelay) {
			var max = null;
			var maxTime = 0;

			for(var i = 0; i < this.points.length; i++) {
				var cur = this.points[i];
				var curTime = (parseInt0(cur.hideTime || defHideTime) + parseInt0(cur.hideDelay || defHideDelay));

				if(curTime >= maxTime) {
					maxTime = curTime;
					max = cur;
				}
			}

			return max;
		},
	// internal >>
		_createPoint: function(pr) {
			var point = this._createPointProto(pr, this.pointsDefault);
			point.x = (pr.x !== undefined ? parseInt0(pr.x) : undefined);
			point.y = (pr.y !== undefined ? parseInt0(pr.y) : undefined);

			return point;
		},
		_createPointProto: function(pr, def) {
			if(!def) def = { };

			return {
				showTime: (pr.showTime !== undefined ? parseInt0(pr.showTime) : def.showTime),
				showDelay: (pr.showDelay !== undefined ? parseInt0(pr.showDelay) : def.showDelay),
				showEasing: (pr.showEasing ? pr.showEasing.toString() : def.showEasing),
				hideTime: (pr.hideTime !== undefined ? parseInt0(pr.hideTime) : def.hideTime),
				hideDelay: (pr.hideDelay !== undefined ? parseInt0(pr.hideDelay) : def.hideDelay),
				hideEasing: (pr.hideEasing ? pr.hideEasing.toString() : def.hideEasing),
				strokeColor: (pr.strokeColor ? (new Color(pr.strokeColor.toString())).rgba() : def.strokeColor),
				fillColor: (pr.fillColor !== undefined ? (pr.fillColor !== null ? (new Color(pr.fillColor.toString())).rgba() : null) : def.fillColor)
			};
		}
	// << internal
	}

	return Shape;
});