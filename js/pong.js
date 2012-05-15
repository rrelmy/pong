var Chars = {
	0: '111101101101111',
	1: '010010010010010',
	2: '111001111100111',
	3: '111001011001111',
	4: '101101111001001',
	5: '111100111001111',
	6: '111100111101111',
	7: '111001001001001',
	8: '111101111101111',
	9: '111101111001111',

	a: '111001111101111',
	A: '111101111101101',
	b: '100100111101111',
	B: '111101111101111',
	c: '000000111100111',
	C: '111100100100111',
	d: '001001111101111',
	D: '110101110101110',
	e: '010101111100011',
	E: '111100111100111',
	d: '001001111101111',
	D: '110101101101111',
	f: '001010111010010',
	F: '111100111100100',
	g: '010101011001011';
	G: '011100111101011',
	h: '100100111101101',
	H: '101101111101101',
	i: '000010000010010',
	I: '010010010010010',
	j: '000010010010100',
	J: '001001001001110',
	k: '100101110101101',
	K: '101110110101101',
	l: '000010010010001',
	L: '100100100100111',
	m: '000000101111101',
	M: '000101111101101',
	n: '000000111101101',
	N: '101111111101101',
	o: '000000111101111',
	O: '111101101101111',
	p: '000110101110100',
	P: '111101111100100',
	q: '010101011001001',
	Q: '111101111001001',
	r: '000000011010010',
	R: '111101111101101',
	s: '000011110001110',
	S: '111100111001111',
	t: '010111010010011',
	T: '111010010010010',
	u: '000000101101010',
	U: '101101101101010',
	v: '000000000101010',
	V: '101101101101010',
	w: '000000101111010',
	W: '101101111111010',
	x: '000000101010101',
	X: '101101010101101',
	y: '000101011001110',
	Y: '101101010010010',
	z: '000000111010111',
	Z: '111011010100111',
};

var Player = {
	ACTION: {
		UP: 'up',
		DOWN: 'down',
	},
	make: function(left) {
		return {
			left: left,
			score: 0,
			rect: {
				origin: {x: 0, y: 0},
				size: {width: 0, height: 0},
			},
			keyCodes: {
				up: left ? 87 : 38,
				down: left ? 83 : 40,
			}
		};
	}
};

var Ball = {
	make: function() {
		return {
			speed: 5,
			direction: 1,
			angle: 10,
			rect: {
				origin: {
					x: 0,
					y: 0,
				},
				size: {
					width: 20,
					height: 20,
				},
			},
		};
	}
};

var Pong = {
	canvas: null,
	context: null,
	
	// game size
	size: null,

	// state
	paused: false,

	options: {
		lineWidth: 10,
		playerHeight: 50,
		playerStep: 5,
		score: {
			y: 10,
			size: 20,
		},
		fps: 30,
	},

	balls: [],

	keys: {},
	players: [],
	frameId: null,

	init: function() {
		this.canvas = document.createElement('canvas');
		this.context = this.canvas.getContext('2d');

		// events
		window.addEventListener('resize', this.resize.bind(this));
		//window.addEventListener('keydown', this.keyboardInput.bind(this));
		window.addEventListener('keydown', this.keyInput.bind(this));
		window.addEventListener('keyup', this.keyInput.bind(this));

		// append canvas
		document.body.appendChild(this.canvas);

		// players
		this.players.push(Player.make(true));
		this.players.push(Player.make(false));

		// balls
		this.balls.push(Ball.make());
		//this.balls.push(Ball.make());

		// resize & draw
		this.resize();

		// reset the ball
		this.balls.forEach(function(ball) {
			this.resetBall(ball);
		}.bind(this));

		// init player position
		var playerY = ((this.size.height / 2) - (this.options.playerHeight / 2)) | 1;
		this.players.forEach(function(player) {
			player.rect.origin = {
				x: !player.left ? this.size.width - (this.options.lineWidth * 2) : this.options.lineWidth,
				y: playerY,
			};
		}.bind(this));

		// redraw
		this.draw();

		// start gameloop
		this.startLoop();
	},

	startLoop: function() {
		this.frameId = window.requestAnimationFrame(this.loop.bind(this), this.canvas);		
	},

	loop: function() {
		//console.info('loop');

		// player move
		this.players.forEach(function(player) {
			var movement = this.playerMovement(player);
			player.rect.origin.y += movement * this.options.playerStep;

			this.checkPlayerPosition(player);
		}.bind(this));

		// ball movement
		this.detectPlayerHits();

		this.balls.forEach(function (ball) {
			var move = {
				x: ball.speed * Math.cos(this.deg2rad(ball.angle)),
				y: ball.speed * Math.sin(this.deg2rad(ball.angle)),
			};

			ball.rect.origin.x += move.x * ball.direction;
			ball.rect.origin.y += move.y * ball.direction;

			// detect top and bottom border hits
			if (
				(ball.rect.origin.y <= 0) || // collision top
				(ball.rect.origin.y + ball.rect.size.height >= this.size.height) // collision bottom
			) {
				// collision top border
				ball.angle *= -1;
			}

			if (ball.rect.origin.x >= this.size.width) {
				++this.players[0].score;
				this.resetBall(ball);
			} else if (ball.rect.origin.x <= 0 - ball.rect.size.width) {
				++this.players[1].score;
				this.resetBall(ball);
			}
		}.bind(this));

		// output
		this.draw();

		if (!this.paused) {
			// restart loop
			this.startLoop();
		}
	},

	rectSize: function(rect) {
		return {
			top: rect.origin.y,
			right: rect.origin.x + rect.size.width,
			bottom: rect.origin.y + rect.size.height,
			left: rect.origin.x,
		};
	},

	intersects: function(rect1, rect2) {
		var r1 = this.rectSize(rect1);
		var r2 = this.rectSize(rect2);

		return !(
			r1.right < r2.left ||
			r1.left > r2.right ||
			r1.top > r2.bottom ||
			r1.bottom < r2.top
		);
	},

	detectPlayerHits: function() {
		this.balls.forEach(function(ball) {
			this.players.forEach(function(player) {
				if (this.intersects(ball.rect, player.rect)) {
					// collision detected
					//console.info((player.left ? 'left' : 'right') + ' collision detected');
					ball.direction *= -1;

					// todo player movement changes angle
					var movement = this.playerMovement(player);
					//console.info('move: ' + (movement < 0 ? 'up' : (movement > 1 ? 'down' : 'no')));
					var angleDirection = ball.angle < 0 ? -1 : (ball.angle > 0 ? 1 : 0);
					//console.info('angle: ' + (angleDirection < 0 ? 'up' : (angleDirection > 1 ? 'down' : 'no')));
					if (movement != 0 && (angleDirection == 0 || angleDirection * movement > 0)) {
						angleDirection = angleDirection == 0 ? movement * -1 : angleDirection * movement;
						ball.angle += (angleDirection * 10);
						ball.angle = Math.max(-45, Math.min(45, ball.angle));
					} else {
						// player does not move
						//console.info('angle *= -1');
						ball.angle *= -1;
					}
					//console.info('angle: ' + ball.angle);
				}
			}.bind(this));
		}.bind(this));
	},

	playerMovement: function(player) {
		return player.keyCodes.up in this.keys ? -1 : (player.keyCodes.down in this.keys ? 1 : 0);
	},

	keyInput: function(event) {
		if (event.type == 'keydown') {
			this.keys[event.keyCode] = true;
		} else if (event.type == 'keyup') {
			delete this.keys[event.keyCode];

			// pause on p
			switch (event.keyCode) {
				case 27: // esc
				case 82: // r
					this.resetGame();
					break;
				case 19: // pause
				case 80: // p
					this.paused = !this.paused;
					if (!this.paused) {
						this.startLoop();
					}
					break;
			}
		}
	},

	checkPlayerPosition: function(player) {
		player.rect.origin.y = 
			Math.max(
				this.options.lineWidth,
				Math.min(
					this.size.height - this.options.playerHeight - (this.options.lineWidth * 2),
					player.rect.origin.y
				)
			)
		;
	},

	resize: function() {
		this.size = {
			width: document.body.parentElement.clientWidth,
			height: document.body.parentElement.clientHeight,
		};

		this.canvas.width = this.size.width;
		this.canvas.height = this.size.height;

		var playerHeight = (this.size.height / 8) | 1;

		this.players.forEach(function(player) {
			player.rect.size.width = this.options.lineWidth;
			player.rect.size.height = playerHeight;
			// TODO: position if outside viewport

			if (!player.left) {
				player.rect.origin.x = this.size.width - player.rect.size.width - this.options.lineWidth;
			}
		}.bind(this));
		this.options.playerHeight = (this.size.height / 8) | 1;

		// redraw
		this.draw();
	},

	draw: function() {
		//console.info('draw');

		// background
		this.context.fillStyle = 'rgb(0, 0, 0)';
		this.context.fillRect(0, 0, this.size.width, this.size.height);

		// line
		this.context.fillStyle = 'rgb(255, 255, 255)';
		this.context.fillRect(
			(this.size.width / 2) - (this.options.lineWidth / 2) | 1,
			0,
			this.options.lineWidth,
			this.size.height
		);

		// players
		this.players.forEach(this.drawPlayer.bind(this));

		// ball
		this.context.fillStyle = 'rgb(255, 255, 255)';
		this.balls.forEach(function (ball) {
			this.context.fillRect(
				ball.rect.origin.x,
				ball.rect.origin.y,
				ball.rect.size.width,
				ball.rect.size.height
			);
		}.bind(this));
	},

	drawPlayer: function(player, index) {
		// paddle
		this.context.fillStyle = 'rgb(255, 255, 255)';
		this.context.fillRect(
			player.rect.origin.x,
			player.rect.origin.y,
			player.rect.size.width,
			player.rect.size.height);

		//console.info(this.options.playerHeight);

		// score
		this.drawString(
			player.score,
			{
				x: ((index * (this.size.width / 2)) + (this.size.width / 4)) | 1,
				y: this.options.score.y
			}
		);

		/*this.context.font = '' + this.options.score.size + 'pt monospace bold';
		var size = this.context.measureText(player.score);
		this.context.fillText(
			player.score,
			((index * (this.size.width / 2)) + (this.size.width / 4) - (size.width / 2)) | 1,
			(this.options.score.size + this.options.score.y) | 1
		);*/
	},

	resetGame: function() {
		var playerY = ((this.size.height - this.options.playerHeight) / 2) | 1;
		this.players.forEach(function(player) {
			player.score = 0;
			player.rect.origin.y = playerY;
		}.bind(this));
		this.balls.forEach(function(ball) {
			this.resetBall(this.ball);
		}.bind(this));

		this.draw();
	},

	resetBall: function(ball) {
		ball.rect.origin = {
			x: (this.size.width - ball.rect.size.width) / 2 | 1,
			y: (this.size.height - ball.rect.size.height) / 2 | 1,
		};
		ball.angle = 0;
		ball.direction = 1;
	},

	deg2rad: function(angle) {
		return (angle / 180) * Math.PI;
	},

	// TODO char size in options
	drawString: function(string, origin) {
		string = '' + string;
		for (var i = 0; i < string.length; ++i) {
			this.drawChar(string[i], origin);
			origin.x += 20;
		}
	},

	drawChar: function(char, origin) {
		if (!(char in Chars)) {
			throw 'char «' + char + '» not available';
		}

		this.context.save();
		this.context.translate(origin.x, origin.y);
		var layout = Chars[char];
		var pSize = 5;
		var pPadding = 1;

		for (var i = 0; i < layout.length; ++i) {
			if (layout[i] == 0) {
				continue;
			}

			var x = i % 3;
			var y = Math.floor(i / 3);
			this.context.fillRect(
				x * (pSize + pPadding),
				y * (pSize + pPadding),
				pSize,
				pSize
			);
		}

		this.context.restore();
	},
};
document.addEventListener('DOMContentLoaded', Pong.init.bind(Pong));
