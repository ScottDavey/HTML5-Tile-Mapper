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
function Texture (pos, size, fillColor, lineWidth, lineColor, type)  {
	this.pos		= pos;
	this.size		= size;
	this.fillColor	= fillColor;
	this.lineWidth 	= lineWidth;
	this.lineColor	= lineColor;
	this.type 		= (typeof type === 'undefined') ? 'normal' : type;
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
		this.showGrid			= true;
		this.grid 				= [];
		this.tile_arr			= [];
		this.selected_tool		= 'normal';
		this.mouseDownButton	= -1;

		viewport = $('#viewport');

		// Event Handlers
		$(window).on('resize', main.buttons.apply);
		$('#apply_btn').on('click', main.buttons.apply);
		$('.tool').on('click', main.buttons.tools);
		$('.setting').on('click', main.buttons.settings);
		$('.action').on('click', main.buttons.actions.init);
		this.canvas.addEventListener('mouseover', function (e) { main.input.mouse.onCanvasHover(); }, false);
		this.canvas.addEventListener('mousemove', function (e) { main.input.mouse.onMouseMove(e); }, false);
		this.canvas.addEventListener('mousedown', function (e) { main.input.mouse.onMouseDown(e); }, false);
		this.canvas.addEventListener('mouseup', function (e) { main.input.mouse.onMouseUp(e); }, false);

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
				viewport.addClass(main.selected_tool);
			},
			onMouseMove: function (e) {
				var tool, mouseX, mouseY;

				mouseX = e.offsetX;
				mouseY = e.offsetY;

				if (main.mouseDownButton !== -1) {
					main.tiles.update(mouseX, mouseY);
				}
				
			},
			onMouseDown: function (e) {
				var mouseButton, mouseX, mouseY, x, y, tile_type;
				mouseButton = e.button;

				main.mouseDownButton = mouseButton;

				mouseX = e.offsetX;
				mouseY = e.offsetY;

				main.tiles.update(mouseX, mouseY);

			},
			onMouseUp: function (e) {
				main.mouseDownButton = -1;
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
	tiles: {
		reset: function () {
			var x, y;

			main.tile_arr = [];

			for (y = 0; y < main.WORLD_HEIGHT / main.SQUARE; y++) {
				main.tile_arr.push([]);
				for (x = 0; x < main.WORLD_WIDTH / main.SQUARE; x++) {
					main.tile_arr[y].push(new Texture(new Vector2(x * main.SQUARE, y * main.SQUARE), new Vector2(main.SQUARE, main.SQUARE), '#000000', 1, '#000000'));
				}
			}

			main.draw();

		},
		update: function (mouseX, mouseY) {
			var color, x, y, tile_type;

			x = (Math.floor(mouseX / main.SQUARE) * main.SQUARE / main.SQUARE);
			y = (Math.floor(mouseY / main.SQUARE) * main.SQUARE / main.SQUARE);

			if (main.mouseDownButton === 0) {
				if (main.selected_tool === 'normal') {
					tile_type = '#777777';
				} else if (main.selected_tool === 'start') {
					tile_type = '#14EB51';
				} else {
					tile_type = '#C51B20';
				}
			} else if (main.mouseDownButton === 2) {
				tile_type = '#000000';
			}

			main.tile_arr[y][x] = new Texture(new Vector2(x * main.SQUARE, y * main.SQUARE), new Vector2(main.SQUARE, main.SQUARE), tile_type, 0, tile_type);

			main.draw();
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
			main.showGrid = true;
			$('#toggle_grid').attr('checked', true);
			main.loadGrid();
			// Reset tiles
			main.tiles.reset();
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

			if (type === 'grid') {
				main.showGrid = (main.showGrid) ? false : true;
			}

			// Refresh Canvas
			main.draw();

		},
		actions: {
			init: function () {
				var that, type;
				that = $(this);
				type = that.data('action');

				if (type === 'load') {
					main.buttons.actions.load();
				} else if (type === 'export') {
					main.buttons.actions.export();
				} else if (type === 'reset') {
					main.buttons.actions.reset();
				}
			},
			load: function () {
				main.dialog.show({title: 'LOAD', showSave: true});
			},
			export: function () {
				var x, y, newarr = [], stringified = '';

				stringified = JSON.stringify(main.tile_arr, ['size', 'x', 'fillColor']);

				main.dialog.show({title: 'EXPORT', content: stringified, showSave: false});
			},
			reset: function () {
				main.tiles.reset();
			}

		}
	},
	dialog: {
		show: function (data) {
			var dialog, headerArea, contentArea, saveBtn, cancelBtn, overlay, title, content, showSaveBtn;

			dialog			= $('#dialog');
			headerArea		= $('#dialogHeader');
			contentArea		= $('#dialogTextarea');
			saveBtn			= $('#dialogSaveBtn');
			closeBtn		= $('#dialogCloseBtn');
			overlay			= $('#dialogOverlay');
			title			= (typeof data.title === 'undefined') ? 'DIALOG' : data.title;
			content			= (typeof data.content === 'undefined') ? '' : data.content;
			showSave		= (typeof data.showSave === 'undefined') ? false : data.showSave;

			if (showSave) {
				saveBtn.on('click', main.dialog.save);
				saveBtn.show();
			} else {
				saveBtn.hide();
			}

			headerArea.text(title);
			contentArea.val(content);

			closeBtn.on('click', main.dialog.close);
			dialog.fadeIn(200);
			overlay.fadeIn(200);
		},
		save: function () {
			var content, val, newarr, square, world_width, world_height, x, y, pos, size;
			content = $('#dialogTextarea');
			val = content.val();

			if (val.length > 0) {
				newarr = JSON.parse(val);
			} else {
				content.css('background-color', '#FF9999');
			}

			square 		= newarr[0][0].size.x;
			size 		= new Vector2(square, square);
			world_width = newarr[0].length * square;
			world_height = newarr.length * square;

			main.WORLD_WIDTH = world_width;
			main.WORLD_HEIGHT = world_height;
			main.SQUARE = square;
			$('#canvas_width').val(main.WORLD_WIDTH);
			$('#canvas_height').val(main.WORLD_HEIGHT);
			$('#square_size').val(main.SQUARE);
			main.buttons.apply();

			for (y = 0; y < newarr.length; y++) {
				for (x = 0; x < newarr[y].length; x++) {
					pos = new Vector2(square * x, square * y);
					main.tile_arr[y][x] = new Texture(pos, size, newarr[y][x].fillColor, 1, newarr[y][x].fillColor);
				}
			}

			main.draw();
			main.dialog.close();

		},
		close: function () {
			$('#dialog').fadeOut(200);
			$('#dialogOverlay').fadeOut(200);
		}
	},
	draw: function () {
		var g, x, y;

		main.context.clearRect(0, 0, main.VIEW_WIDTH, main.VIEW_HEIGHT);
		main.camera.begin();

		for (y = 0; y < main.tile_arr.length; y++) {
			for (x = 0; x < main.tile_arr[y].length; x++) {
				main.tile_arr[y][x].draw();
			}
		}
		
		if (main.showGrid) {
			for (g = 0; g < main.grid.length; g++) {
				main.grid[g].draw();
			}
		}


		main.camera.end();
	}


};