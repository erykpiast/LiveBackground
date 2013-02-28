verbose = true;

requirejs.config({
	baseUrl: '/livebg',
	paths: {
		creator: 'creator',
		jquery: [ '//code.jquery.com/jquery-1.9.0',
			'//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min' ],
		jqueryui: [ '//code.jquery.com/ui/1.10.0/jquery-ui',
			'//ajax.googleapis.com/ajax/libs/jqueryui/1.10.0/jquery-ui.min' ],
		colorpicker: [ '//raw.github.com/vanderlee/colorpicker/master/jquery.colorpicker',
			'/lib/third/colorpicker/jquery.colorpicker'
		]
	},
	shim: {
		'jqueryui': {
			deps: [ 'jquery']
		},
		'colorpicker': {
			deps: [ 'jquery', 'jqueryui' ]
		}
	}
});

require([ 'jquery', 'creator/creator', '/domReady.js', 'jqueryui' ],
	function($, LiveBackgroundCreator, domReady) {
		var creator = new LiveBackgroundCreator();

		domReady(function init() {
			creator.init(document.getElementById('creator'));
		});
	}
);
