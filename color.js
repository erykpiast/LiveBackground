define([ 'misc' ], function() {
	Color = function(proto) {
		if(!proto) proto = '';
		else proto = proto.toString();

		if(proto == 'transparent') {
			this.channels = [ 0, 0, 0, 0 ];
		} else {
			var chs = this._rgbaPattern.exec(proto), base = 10;
			if(!chs) {
				chs = this._hexPattern.exec(proto);
				base = 16;
			}

			if(chs) {
				this.channels = [ ];

				for(var i = 1, maxi = chs.length; i < maxi; i++) {
					var ch = chs[i];
				
					if((ch !== undefined) && (ch !== '')) {
						var val = (i != 4 ? parseInt0(ch, base) : parseFloat0(ch));

						this.channels.push(val);
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
		_rgbaPattern: /^(?:rgba?\()(\d{1,3})(?:,\s*)(\d{1,3})(?:,\s*)(\d{1,3})(?:,?\s*)([\d\.]{0,3})(?:\))$/,
		_hexPattern: /^(?:#?)([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})$/,
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