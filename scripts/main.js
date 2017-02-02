/**********************
*****  ULILITIES  *****
**********************/

var Vector2 = function(x, y) {
    this.x = x;
    this.y = y;
};

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function SecondsToTime (s) {
	var h, m, s;
	s = Number(s);
	h = Math.floor(s / 3600);
	m = Math.floor(s % 3600 / 60);
	s = Math.floor(s % 3600 % 60);
	return ((h > 0 ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (s < 10 ? "0" : "") + s);
}

/****************************
*****  RECTANGLE CLASS  *****
****************************/
function Rectangle (x, y, width, height) {
	this.x		= x;
	this.y		= y;
	this.width	= width;
	this.height	= height;
	this.left	= this.x;
	this.top	= this.y;
	this.right	= this.x + this.width;
	this.bottom	= this.y + this.height;
	this.center	= new Vector2((this.x + (this.width/2)), (this.y + (this.height/2)));
}

/***********************
*****  LINE CLASS  *****
***********************/
function Line (startPos, endPos, color, collision, normal, sound) {
	this.startPos	= startPos;
	this.endPos		= endPos;
	this.color		= color;
	this.collision	= collision;
	this.normal		= normal;
	this.sound		= sound;
};

Line.prototype.draw = function () {
	main.context.save();
	main.context.lineWidth = 2;
	main.context.strokeStyle = (typeof this.color === 'undefined') ? '#00FF88' : this.color;
	main.context.beginPath();
	main.context.moveTo(this.startPos.x, this.startPos.y);
	main.context.lineTo(this.endPos.x, this.endPos.y);
	main.context.stroke();
	main.context.closePath();
	main.context.restore();
};

/**************************
*****  TEXTURE CLASS  *****
**************************/
function Texture (pos, size, fillColor, lineWidth, lineColor)  {
	this.pos		= pos;
	this.size		= size;
	this.fillColor	= fillColor;
	this.lineColor	= lineColor;
}

Texture.prototype.update = function (pos) {
	this.pos = pos;
};

Texture.prototype.setSize = function (size) {
	this.size = size;
};

Texture.prototype.draw = function () {
	main.context.save();
	main.context.beginPath();
	main.context.rect(this.pos.x, this.pos.y, this.size.x, this.size.y);
	main.context.fillStyle = this.fillColor;
	main.context.fill();
	main.context.lineWidth = this.lineWidth;
	main.context.strokeStyle = this.lineColor;
	main.context.stroke();
	main.context.closePath();
	main.context.restore();
};

/*************************
*****  SPRITE CLASS  *****
*************************/
function Sprite (path, pos, size) {
	this.pos	= pos;
	this.size	= size;
	this.img	= document.createElement('img');
	this.img.setAttribute('src', path);
}

Sprite.prototype.SetImage = function (path) {
	this.img.setAttribute('src', path);
};

Sprite.prototype.update = function (pos) {
	this.pos	= pos;
};

Sprite.prototype.draw = function () {
	main.context.drawImage(this.img, this.pos.x, this.pos.y);
};

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
		this.helper_block		= new Texture(new Vector2(0, 0), new Vector2(main.SQUARE, main.SQUARE), '#444444', 1, '#333333');
		this.show_helper_block	= false;

		viewport = $('#viewport');

		// Event Handlers
		$(window).on('resize', main.buttons.apply);
		$('#apply_btn').on('click', main.buttons.apply);
		$('.tool').on('click', main.buttons.tools);
		$('.setting').on('click', main.buttons.settings);
		$('.action').on('click', main.buttons.actions);
		this.canvas.addEventListener('mouseover', function (e) { main.input.mouse.onCanvasHover(); }, false);
		this.canvas.addEventListener('mousemove', function (e) { main.input.mouse.onMouseMove(e); }, false);
		//this.canvas.addEventListener('mouseover', function (e) { main.input.mouse.onCanvasHover }, false);

		main.initialize();
	},
	initialize: function () {
		main.buttons.apply();
	},
	input: {
		mouse: {
			onCanvasHover: function () {
				var viewport;
				viewport = $('#viewport');
				viewport.removeClass('draw').removeClass('erase').removeClass('move');
				viewport.addClass(main.selected_tool.toLowerCase());
			},
			onMouseMove: function (e) {
				var tool, mouseX, mouseY;
				// mouseX = e.
				console.log(e);
			}
		}
	},
	loadGrid: function () {
		var x, y;

		// RESET
		main.grid = [];
		// BUILD
		for (y = 0; y < Math.ceil(main.WORLD_HEIGHT / main.SQUARE); y++) {
			for (x = 0; x < Math.ceil(main.WORLD_WIDTH / main.SQUARE); x++) {
				this.grid.push(new Texture(new Vector2(x * main.SQUARE, y * main.SQUARE), new Vector2(main.SQUARE, main.SQUARE), 'transparent', 1, '#111111'));
			}

		}
	},
	buttons: {
		apply: function () {
			var docWidth, docHeight, viewport, square;
			docWidth  			= $(document).width() - 220;
			docHeight 			= $(document).height() - 20;
			viewport 			= $('#viewport');
			// Reset dimensions
			main.WORLD_WIDTH		= $('#canvas_width').val();
			main.WORLD_HEIGHT		= $('#canvas_height').val();
			main.VIEW_WIDTH 		= (main.WORLD_WIDTH > docWidth) ? docWidth : main.WORLD_WIDTH;
			main.VIEW_HEIGHT 		= (main.WORLD_HEIGHT > docHeight) ? docHeight : main.WORLD_HEIGHT;
			main.SQUARE 			= $('#square_size').val();
			// Apply dimensions
			main.canvas.width 		= main.VIEW_WIDTH;
			main.canvas.height 		= main.VIEW_HEIGHT;
			// Reset Grid Settings
			main.showGrid = false;
			$('#toggle_grid').attr('checked', false);
			main.loadGrid();
			// Update Helper Block
			main.helper_block.setSize(new Vector2(main.SQUARE, main.SQUARE));
			// Update Viewport
			main.camera.updateViewport();
			main.draw();
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
		settings: function () {
			var that, type;
			that = $(this);
			type = that.val();

			if (type === 'GRID') {
				main.showGrid = (main.showGrid) ? false : true;
			}

			// Refresh Canvas
			main.draw();

		},
		actions: function () {
			console.log($(this));	
		}
	},
	draw: function () {
		var g;

		main.context.clearRect(0, 0, main.VIEW_WIDTH, main.VIEW_HEIGHT);
		main.camera.begin();

		if (main.showGrid) {
			for (g = 0; g < main.grid.length; g++) {
				main.grid[g].draw();
			}
		}

		if (main.show_helper_block)
			main.helper_block.draw();

		main.camera.end();
	}


};