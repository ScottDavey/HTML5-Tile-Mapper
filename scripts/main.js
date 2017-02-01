/*******************************************
**************  CAMERA CLASS  **************
*******************************************/
function Camera () {
	this.distance 		= 0.0;
	this.lookat 		= [0, 0];
	this.fieldOfView	= Math.PI / 4.0;
	this.viewport 		= {
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
		width: 0,
		height: 0,
		scale: [1.0, 1.0]
	};
	this.updateViewport();
}

Camera.prototype = {
	begin: function () {
		main.context.save();
		this.applyScale();
		this.applyTranslation();
	},
	end: function () {
		main.context.restore();
	},
	applyScale: function () {
		main.context.scale(this.viewport.scale[0],this.viewport.scale[1]);
	},
	applyTranslation: function () {
		main.context.translate(-this.viewport.left, -this.viewport.top);
	},
	updateViewport: function () {
		this.aspectRatio		= main.VIEW_WIDTH / main.VIEW_HEIGHT;
		this.viewport.width 	= this.distance * Math.tan(this.fieldOfView);
		this.viewport.height 	= this.viewport.width / this.aspectRatio;
		this.viewport.left 		= this.lookat[0] - (this.viewport.width / 2.0);
		this.viewport.top 		= this.lookat[1] - (this.viewport.height / 2.0);
		this.viewport.right 	= this.viewport.left + this.viewport.width;
		this.viewport.bottom 	= this.viewport.top + this.viewport.height;
		this.viewport.scale[0]	= main.VIEW_WIDTH / this.viewport.width;
		this.viewport.scale[1]	= main.VIEW_HEIGHT / this.viewport.height;
	},
	zoomTo: function (z) {
		this.distance = z;
		this.updateViewport();
	},
	moveTo: function (x, y) {
		this.lookat[0] = x;
		this.lookat[1] = y;
		this.updateViewport();
	},
	screenToWorld: function (x, y, obj) {
		obj = obj || {};
		obj.x = (x / this.viewport.scale[0]) + this.viewport.left;
		obj.y = (y / this.viewport.scale[1]) + this.viewport.top;
		return obj;
	},
	worldToScreen: function (x, y, obj) {
		obj = obj || {};
		obj.x = (x - this.viewport.left) * (this.viewport.scale[0]);
     	obj.y = (y - this.viewport.top) * (this.viewport.scale[1]);
		return obj;
	}
};

var main = {
	init: function () {
		this.WORLD_WIDTH		= $('#canvas_width').val();
		this.WORLD_HEIGHT		= $('#canvas_height').val();
		this.VIEW_WIDTH			= 0;
		this.VIEW_HEIGHT		= 0;
		this.SQUARE				= $('#square_size').val();
		this.canvas 			= document.getElementById('viewport');
		this.context 			= this.canvas.getContext('2d');
		this.camera 			= new Camera();
		this.showGrid			= false;
		this.grid 				= [];
		this.tiles				= [];
		this.selected_tool		= 'DRAW';

		// Event Handlers
		$(window).on('resize', main.buttons.apply);
		$('#apply_btn').on('click', main.buttons.apply);
		$('.tool').on('click', main.buttons.tools);
		$('.action').on('click', main.buttons.actions);
		$('#viewport').on('mouseover', main.onCanvasHover);

		main.initialize();
	},
	initialize: function () {
		main.buttons.apply();
	},
	onCanvasHover: function () {
		$('#viewport').removeClass('draw').removeClass('erase');
		$('#viewport').addClass(main.selected_tool.toLowerCase());
	},
	buttons: {
		apply: function () {
			var docWidth, docHeight, viewport;
			docWidth  			= $(document).width() - 220;
			docHeight 			= $(document).height() - 20;
			viewport 			= $('#viewport');
			// Reset dimensions
			main.WORLD_WIDTH		= $('#canvas_width').val();
			main.WORLD_HEIGHT		= $('#canvas_height').val();
			main.VIEW_WIDTH 		= (main.WORLD_WIDTH > docWidth) ? docWidth : main.WORLD_WIDTH;
			main.VIEW_HEIGHT 		= (main.WORLD_HEIGHT > docHeight) ? docHeight : main.WORLD_HEIGHT;
			// Apply dimensions
			main.canvas.width 		= main.VIEW_WIDTH;
			main.canvas.height 		= main.VIEW_HEIGHT;
			// Update Viewport
			main.camera.updateViewport();
		},
		tools: function () {
			var that, type, tools;
			that = $(this);
			type = that.data('tooltype');
			tools = $('.tool');
			tools.removeClass('active');
			that.addClass('active');
			main.selected_tool = type;
		},
		actions: function () {
			console.log($(this));	
		}
	},
	draw: function () {

		main.context.clearRect(0, 0, main.VIEW_WIDTH, main.VIEW_HEIGHT);
		main.camera.begin();
		main.camera.end();
	}


};