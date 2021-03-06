$(function() {
  var Q = window.Q = Quintus({ audioSupported: ['mp3', 'wav'] })
                     .include('Input,Sprites,Scenes,UI,Touch,Audio')
                     .setup().touch().enableSound();

  Q.input.mouseControls();
  Q.input.keyboardControls();

  Q.Sprite.extend("Paddle", {     // extend Sprite class to create Q.Paddle subclass
    init: function(p) {
      this._super(p, {
        sheet: 'paddle',
        speed: 200,
        x: 0,
      });
      this.p.x = Q.width/2 - this.p.w/2;
      this.p.y = Q.height - this.p.h;
    },

    step: function(dt) {
      if(Q.inputs['left']) {
        this.p.x -= dt * this.p.speed;
        Q.inputs['mouseX'] = this.p.x;
      } 
      else if(Q.inputs['right']) {
        this.p.x += dt * this.p.speed;
        Q.inputs['mouseX'] = this.p.x;
      }
      else {
        this.p.x = Q.inputs['mouseX'];
      }
      
      /*this.p.x = Q.inputs['mouseX'];
      if(this.p.x < this.p.w/2) { 
        this.p.x = this.p.w/2;
      } else if(this.p.x > Q.width - this.p.w/2) { 
        this.p.x = Q.width - this.p.w/2;
      }*/
//      this._super(dt);	      // no need for this call anymore
    }
  });

  Q.Sprite.extend("Ball", {
    init: function() {
      this._super({
        sheet: 'ball',
        speed: 200,
        dx: 1,
        dy: -1,
      });
      this.p.y = Q.height / 2 - this.p.h;
      this.p.x = Q.width / 2 + this.p.w / 2;
	  
	  this.on('hit', this, 'collision');  // Listen for hit event and call the collision method
	  
	  this.on('step', function(dt) {      // On every step, call this anonymous function
		  var p = this.p;
		  Q.stage().collide(this);   // tell stage to run collisions on this sprite

		  p.x += p.dx * p.speed * dt;
		  p.y += p.dy * p.speed * dt;

		  if(p.x < 5) { 
		  	Q.audio.play('wall.mp3');
			p.x = 5;
			p.dx = 1;
		  } else if(p.x > Q.width - 10) { 
		  	Q.audio.play('wall.mp3');
			p.dx = -1;
			p.x = Q.width - 10;
		  }

		  if(p.y < 10) {
		  	Q.audio.play('wall.mp3');
			p.y = 10;
			p.dy = 1;
		  } else if(p.y > Q.height) { 
		  	if (Q.state.get("lives") == 0) {
				Q.stageScene('loseGame');
			}
			else {
				Q.state.dec("lives", 1);
				p.y = Q.height / 2 - this.p.h;
				p.x = Q.width / 2 + this.p.w / 2
				p.dx = 1;
				p.dy = -1;
			}
  		    }
	  });
    },
	
	collision: function(col) {                // collision method
		if (col.obj.isA("Paddle")) {
//			alert("collision with paddle");
			Q.audio.play('paddle.mp3');
			this.p.dy = -1;
		} else if (col.obj.isA("Block")) {
//			alert("collision with block");
			Q.audio.play('block.mp3');
			Q.state.inc('score', 100);
			col.obj.destroy();
			this.p.dy *= -1;
			Q.stage().trigger('removeBlock');
		}
	}
  });

  Q.Sprite.extend("Block", {
    init: function(props) {
      this._super(_(props).extend({ sheet: 'block'}));
      this.on('collision',function(ball) { 
        this.destroy();
        ball.p.dy *= -1;
        Q.stage().trigger('removeBlock');
      });
    }
  });
  
  Q.Sprite.extend("Pointer", {     // extend Sprite class to create Q.Paddle subclass
    init: function(p) {
      this._super(p, {
        sheet: 'pointer',
        x: 0
      });
      this.p.x = -20;
      this.p.y = 0;
    },

    step: function(dt) {
      this.p.x = Q.inputs['mouseX'];
      this.p.y = Q.inputs['mouseY'];
      if(Q.inputs['mouseX'] < this.p.w/2 + 5) { 
        this.p.x = -20;
      } else if(Q.inputs['mouseX'] > Q.width - this.p.w/2 - 5) { 
        this.p.x = -20;
      }
      
      if(Q.inputs['mouseY'] < 10) { 
        this.p.x = -20;
      } else if(Q.inputs['mouseY'] > Q.height - 10) { 
        this.p.x = -20;
      }
    }
  });
  
  Q.UI.Text.extend("Score",{ 
  init: function(p) {
    this._super({
      label: "Score: 0",
      x: 55,
      y: 10,
      color: "white",
      size:16
    });

    Q.state.on("change.score",this,"score");
  },

  score: function(score) {
    this.p.label = "Score: " + score;
  }
  });
  
  Q.UI.Text.extend("Lives",{ 
  init: function(p) {
    this._super({
      label: "Lives Remaining: 2",
      x: Q.width - 85,
      y: 10,
      color: "white",
      size:16
    });

    Q.state.on("change.lives",this,"lives");
  },

  lives: function(lives) {
    this.p.label = "Lives Remaining: " + lives;
  }
  });

//  Q.load(['blockbreak.png','blockbreak.json'], function() {
  Q.load(['blockbreak.png', 'block.mp3', 'paddle.mp3', 'wall.mp3'], function() {
    // Q.compileSheets('blockbreak.png','blockbreak.json');  
	Q.sheet("ball", "blockbreak.png", { tilew: 20, tileh: 20, sy: 0, sx: 0 });
	Q.sheet("block", "blockbreak.png", { tilew: 40, tileh: 20, sy: 20, sx: 0 });
	Q.sheet("paddle", "blockbreak.png", { tilew: 60, tileh: 20, sy: 40, sx: 0 });
	Q.sheet("pointer", "blockbreak.png", {tilew: 14, tileh: 24, sy: 0, sx: 106});
	Q.state.set("score", 0);
	Q.state.set("lives", 3);
				 		 
    Q.scene('game',new Q.Scene(function(stage) {
      Q.state.reset({ score: 0, lives: 2 });
      stage.insert(new Q.Paddle());
      stage.insert(new Q.Ball());
      stage.insert(new Q.Score());
      stage.insert(new Q.Lives());

      var blockCount=0;
      for(var x=0;x<6;x++) {
        for(var y=0;y<5;y++) {
          stage.insert(new Q.Block({ x: x*50+35, y: y*30+30 }));
          blockCount++;
        }
      }
      stage.on('removeBlock',function() {
        blockCount--;
        if(blockCount == 0) {
          Q.stageScene('winGame');
        }
      });

    }));
	
	Q.scene('title',function(stage) {
  		var container = stage.insert(new Q.UI.Container({
   				 x: Q.width/2, y: 0, fill: "rgba(0,0,0,0.5)"
  		}));

  		var button = container.insert(new Q.UI.Button({ x: 0, y: 320, fill: "#FFFFFF",
                                                  label: "Play" },function() {
    	Q.clearStages();
   		Q.stageScene('game');
  		}));  
         
  		var label = container.insert(new Q.UI.Text({x: -10, y: 45, color: "white",
                            label: " Block Break", size: 48 }));
        var label1 = container.insert(new Q.UI.Text({x: -10, y: 210, color: "white",
                            label: "  Controls", size: 32 }));
        var label2 = container.insert(new Q.UI.Text({x: -10, y: 245, color: "white",
                            label: " Move Mouse or Arrow Keys", size: 18 }));
        var label3 = container.insert(new Q.UI.Text({x: -10, y: 265, color: "white",
                            label: "   Mobile: Touch Screen", size:18 }));

		stage.insert(new Q.Pointer());
  		container.fit(20);
  	});
	
	Q.scene('loseGame',function(stage) {
  		var container = stage.insert(new Q.UI.Container({
   				 x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"
  		}));

  		var button = container.insert(new Q.UI.Button({ x: 0, y: 40, fill: "#FFFFFF",
                                                  label: "Play Again" },function() {
    	Q.clearStages();
   		Q.stageScene('game');
  		}));  
         
  		var label = container.insert(new Q.UI.Text({x: 0, y: -40, color: "white",
                            label: "You Lose!" }));

		stage.insert(new Q.Pointer());
  		container.fit(20);
  	});
	
	Q.scene('winGame',function(stage) {
  		var container = stage.insert(new Q.UI.Container({
   				 x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"
  		}));

  		var button = container.insert(new Q.UI.Button({ x: 0, y: 40, fill: "#FFFFFF",
                                                  label: "Play Again" },function() {
    	Q.clearStages();
   		Q.stageScene('game');
  		}));  
         
  		var label = container.insert(new Q.UI.Text({x: 0, y: -40, color: "white",
                            label: "You Win!" }));

		stage.insert(new Q.Pointer());
  		container.fit(20);
  	});
	
    Q.stageScene('title');
  });  
});
