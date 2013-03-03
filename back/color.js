define([ 'misc' ], function() {
	Color = function(proto) {
		if(!proto) proto = '';
		else proto = proto.toString();

		if(proto == 'transparent') {
			this.channels = [ 0, 0, 0, 0 ];
		} else {
			var chs = this._pattern.exec(proto);
			if(chs) {
				this.channels = [ ];

				for(var i = 1, maxi = chs.length; i < maxi; i++) {
					var ch = chs[i];
				
					if((ch !== undefined) && (ch !== '')) {
						this.channels.push(i != 4 ? parseInt0(ch) : parseFloat0(ch));
					} else {
						this.channels.push(i != 4 ? 0 : 1);
					}
				}
			} else {
				this.channels = [ 0, 0, 0, 1 ];
			}
		}
	} // << Color

	Color.prototype = {
		toString: function() { return this.rgba(); },
		_pattern: /^(?:rgba?\()(\d{0,3})(?:,\s?)(\d{0,3})(?:,\s?)(\d{0,3})(?:,?\s?)([\d\.]{0,3})(?:\))$/,
		rgba: function() {

			return 'rgba(' + this.channels + ')';
		},
		sub: function(sb) {
			return this.channels.map(function(ch, i) {
				return ch-sb.channels[i];
			});
		}
	} // << Color.prototype

	return Color;
});