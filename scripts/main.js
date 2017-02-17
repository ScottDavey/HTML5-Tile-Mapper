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
	this.lineWidth 	= (typeof lineWidth === 'undefined') ? 1 : lineWidth;
	this.lineColor	= (typeof lineColor === 'undefined') ? '#111111' : lineColor;
	this.type 		= (typeof type === 'undefined') ? 'normal' : type;
}

Texture.prototype.update = function (fillColor, type) {
	this.fillColor = fillColor;
	this.type = type;
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
		main.draw.all();
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
		this.jCanvas			= $('#viewport');
		this.context 			= this.canvas.getContext('2d');
		this.camera 			= new Camera();
		main.cameraPos			= new Vector2(0, 0);
		this.showGrid			= true;
		this.grid 				= [];
		this.tile_arr			= [];
		this.selected_tool		= 'normal';
		this.mouseDownButton	= -1;
		this.isSpaceDown		= false;
		this.previousMousePos	= new Vector2(0, 0);

		// Event Handlers
		$(window).on('resize', main.buttons.apply);
		$('#apply_btn').on('click', main.buttons.apply);
		$('.tool').on('click', main.buttons.tools);
		$('.action').on('click', main.buttons.actions.init);
		this.canvas.addEventListener('mousemove', function (e) { main.input.mouse.onMouseMove(e); }, false);
		this.canvas.addEventListener('mousedown', function (e) { main.input.mouse.onMouseDown(e); }, false);
		this.canvas.addEventListener('mouseup', function (e) { main.input.mouse.onMouseUp(e); }, false);
		document.addEventListener('keydown', function (e) { main.input.key.onKeyDown(e); }, false);
		document.addEventListener('keyup', function (e) { main.input.key.onKeyUp(e); }, false);

		main.initialize();
	},
	initialize: function () {
		main.buttons.apply();
		main.camera.moveTo(main.cameraPos.x, main.cameraPos.y);
	},
	input: {
		key: {
			onKeyDown: function (e) {
				if (e.code === 'Space') {
					main.isSpaceDown = true;
					main.jCanvas.addClass('move');
				}
			},
			onKeyUp: function (e) {
				if (e.code === 'Space') {
					main.isSpaceDown = false;
					main.jCanvas.removeClass('move');
				}
			}
		},
		mouse: {
			onMouseMove: function (e) {
				var tool, mouseX, mouseY, mouseXDiff, mouseYDiff;

				mouseX = e.offsetX;
				mouseY = e.offsetY;

				// If space bar is pressed and left mouse button is being clicked, pan the canvas
				// else if any mouse button is pushed, update tiles
				if (main.isSpaceDown && main.mouseDownButton === 0) {
					
					// Get the difference between current mouse position and previous
					mouseXDiff = mouseX - main.previousMousePos.x;
					mouseYDiff = mouseY - main.previousMousePos.y;
					// apply the difference to the camera position variable
					main.cameraPos.x -= mouseXDiff;
					main.cameraPos.y -= mouseYDiff;
					
					// Ensure camera panning doesn't go past world bounds
					if (main.cameraPos.x <= 0)
						main.cameraPos.x = 0;
					else if ((main.cameraPos.x + main.VIEW_WIDTH) > main.WORLD_WIDTH)
						main.cameraPos.x = main.WORLD_WIDTH - main.VIEW_WIDTH;

					if (main.cameraPos.y <= 0)
						main.cameraPos.y = 0;
					else if ((main.cameraPos.y + main.VIEW_HEIGHT) > main.WORLD_HEIGHT)
						main.cameraPos.y = main.WORLD_HEIGHT - main.VIEW_HEIGHT;

					// update the camera (the Camera.moveTo function calls Camera.updateViewport where main.draw() is called)
					main.camera.moveTo(main.cameraPos.x, main.cameraPos.y);

				} else if (main.mouseDownButton !== -1) {
					main.tiles.update(mouseX, mouseY);
				}

				// Capture the current mouse coordinates
				main.previousMousePos = new Vector2(mouseX, mouseY);
				
			},
			onMouseDown: function (e) {
				var mouseButton, mouseX, mouseY, x, y, tile_type;
				mouseButton = e.button;

				// Capture which mouse button is being pressed
				main.mouseDownButton = mouseButton;

				// Capture mouse x/y coordinates
				mouseX = e.offsetX;
				mouseY = e.offsetY;

				// Update tiles as long as the space bar isn't also being pressed
				if (!main.isSpaceDown) {
					main.tiles.update(mouseX, mouseY);
				}

			},
			onMouseUp: function (e) {
				// The mouse button has been released
				main.mouseDownButton = -1;
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
					main.tile_arr[y].push(new Texture(new Vector2(x * main.SQUARE, y * main.SQUARE), new Vector2(main.SQUARE, main.SQUARE), '#000000', 1, '#111111', 'wall'));
				}
			}

			main.draw.all();

		},
		update: function (mouseX, mouseY) {
			var x, y, fillColor, type;

			// Correct the mouse positioning if the canvas has been panned
			x = (mouseX + main.cameraPos.x);
			y = (mouseY + main.cameraPos.y);
			// Get the tile index for x and y
			x = Math.floor(x / main.SQUARE);
			y = Math.floor(y / main.SQUARE);

			// If the left mouse button is pressed, we're adding a tile. Else If the right mouse button, we're erasing
			if (main.mouseDownButton === 0) {
				// Check what type of tile we're adding
				if (main.selected_tool === 'normal') {
					fillColor = '#777777';
					type = 'normal';
				} else if (main.selected_tool === 'start') {
					fillColor = '#14EB51';
					type = 'start';
				} else {
					fillColor = '#C51B20';
					type = 'exit';
				}
			} else if (main.mouseDownButton === 2) {
				fillColor = '#000000';
				type = 'wall';
			}

			main.tile_arr[y][x].update(fillColor, type);
			main.draw.tile(x, y, main.SQUARE, main.SQUARE);
		}
	},
	buttons: {
		apply: function () {
			var docWidth, docHeight, square;
			docWidth  			= $(document).width() - 220;
			docHeight 			= $(document).height() - 20;
			// Reset dimensions
			main.WORLD_WIDTH		= $('#canvas_width').val();
			main.WORLD_HEIGHT		= $('#canvas_height').val();
			main.VIEW_WIDTH 		= (main.WORLD_WIDTH > docWidth) ? docWidth : main.WORLD_WIDTH;
			main.VIEW_HEIGHT 		= (main.WORLD_HEIGHT > docHeight) ? docHeight : main.WORLD_HEIGHT;
			main.SQUARE 			= $('#square_size').val();
			// Apply dimensions
			main.canvas.width 		= main.VIEW_WIDTH;
			main.canvas.height 		= main.VIEW_HEIGHT;
			// Reset tiles
			main.tiles.reset();
			// Update Viewport
			main.camera.updateViewport();
			main.draw.all();
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
				} else if (type === 'instructions') {
					main.buttons.actions.instructions.init();
				}
			},
			load: function () {
				main.dialog.show({title: 'LOAD', showSave: true});
			},
			export: function () {
				var x, y, newarr = [], stringified = '';

				for (y = 0; y < main.tile_arr.length; y++) {
					newarr.push([]);
					for (x = 0; x < main.tile_arr[y].length; x++) {
						newarr[y].push({s: main.tile_arr[y][x].size.x, t: main.tile_arr[y][x].type});
					}
				}

				stringified = JSON.stringify(newarr);

				main.dialog.show({title: 'EXPORT', content: stringified, showSave: false});
			},
			reset: function () {
				main.tiles.reset();
			},
			instructions: {
				init: function () {
					var instructionsDialog, overlay, closeBtn;

					instructionsDialog 	= $('#instructionsDialog');
					overlay 			= $('#dialogOverlay');
					closeBtn 			= $('#instructionsClose');
					
					closeBtn.on('click', main.buttons.actions.instructions.close);

					instructionsDialog.fadeIn(200);
					overlay.fadeIn(200);
				},
				close: function () {
					$('#instructionsDialog').fadeOut(200);
					$('#dialogOverlay').fadeOut(200);
				}
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
			var content, val, newarr, square, world_width, world_height, x, y, pos, size, fillColor;
			content = $('#dialogTextarea');
			val = content.val();

			if (val.length === 0) {
				content.css('background-color', '#FF9999');
			} else {
				newarr = JSON.parse(val);

				square 		 		= newarr[0][0].s;
				size 		 		= new Vector2(square, square);
				world_width  		= newarr[0].length * square;
				world_height 		= newarr.length * square;

				main.WORLD_WIDTH 	= world_width;
				main.WORLD_HEIGHT 	= world_height;
				main.SQUARE = square;
				$('#canvas_width').val(main.WORLD_WIDTH);
				$('#canvas_height').val(main.WORLD_HEIGHT);
				$('#square_size').val(main.SQUARE);
				main.buttons.apply();

				for (y = 0; y < newarr.length; y++) {
					for (x = 0; x < newarr[y].length; x++) {
						pos = new Vector2(square * x, square * y);
						if (newarr[y][x].t === 'normal') {
							fillColor = '#777777';
						} else if (newarr[y][x].t === 'start') {
							fillColor = '#14EB51';
						} else if (newarr[y][x].t === 'exit') {
							fillColor = '#C51B20';
						} else {
							fillColor = '#000000';
						}
						main.tile_arr[y][x] = new Texture(pos, size, fillColor, 1, '#111111', newarr[y][x].t);
					}
				}

				main.draw.all();
				main.dialog.close();

			}

		},
		close: function () {
			$('#dialog').fadeOut(200);
			$('#dialogOverlay').fadeOut(200);
		}
	},
	draw: {
		all: function () {
			var g, x, y, cTop, cLeft, cBottom, cRight;

			// Calculate how much of the canvas is showing and only draw what we see.
			cTop	= Math.floor(main.cameraPos.y / main.SQUARE);
			cLeft	= Math.floor(main.cameraPos.x  / main.SQUARE);
			cBottom = Math.floor((main.cameraPos.y + main.VIEW_HEIGHT) / main.SQUARE);
			cRight	= Math.floor((main.cameraPos.x + main.VIEW_WIDTH) / main.SQUARE);
			// Make sure we stay within the tile array bounds
			cTop	= (cTop < 0) ? 0 : cTop;
			cLeft	= (cLeft < 0) ? 0 : cLeft;
			cBottom = (cBottom > (main.tile_arr.length - 1)) ? main.tile_arr.length - 1 : cBottom;
			cRight	= (cRight > (main.tile_arr[0].length - 1)) ? main.tile_arr[0].length - 1 : cRight;

			main.context.clearRect(0, 0, main.VIEW_WIDTH, main.VIEW_HEIGHT);
			main.camera.begin();

			// Draw Tiles
			for (y = cTop; y <= cBottom; y++) {
				for (x = cLeft; x <= cRight; x++) {
					main.tile_arr[y][x].draw();
				}
			}

			main.camera.end();
		},
		tile: function (x, y, width, height) {
			var xa, ya;
			xa = x * main.SQUARE;
			ya = y * main.SQUARE;

			main.camera.begin();

			main.context.clearRect(xa, ya, width, height);
			// Draw Tile
			main.tile_arr[y][x].draw();

			main.camera.end();
		}
	}


};