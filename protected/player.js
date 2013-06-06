/**
 * Define models
 *
 * @param config
 * @param helpers
 */

Player = function(name, id, isServer) {
	this.name 	= name;
	this.id 	= id.toString();
	this.units = {};
	this.towers = {};
	this.projectiles = new Array();
	this.totalUnits = 0;
	this.totalTowers = 0;
	this.isServer = isServer;
	
	this.addUnit = function(unit) {
		if (!this.isServer)
			mainScene.getStage().append(unit.mapResource);
		console.log("add new unit " + unit.id);
		this.units[unit.id] = unit;
		this.totalUnits++;
	};

	this.addTower = function(tower) {
		if (!this.isServer)
			mainScene.getStage().append(tower.mapResource);
		console.log("add new tower " + tower.id);
		this.towers[tower.id] = tower;
		this.totalTowers++;
	};

	this.towersOnBoard = function() {
		return this.totalTowers;
	};
	
	this.getUnits = function() {
		return this.units;
	};
	
	this.unitsOnBoard = function() {
		return this.totalUnits;
	};
	
	this.updatePosition = function(states) {
		// $.each(states, function(index, state) {
		// for(i = 0; i < states.length; i++) {
			// state = states[i];
			var state = states;
			for(var key in state.units) {
				if (key != 'undefined') {
					if (null == this.units[key]) {
						// console.log("unit is null " + key);
						// console.log("position " + JSON.stringify(state.units[key]));
						var unit = new Unit(key, {code: "001", position: state.units[key].position}, this.isServer, false);
						//this.addUnit(unit);
					}
					else {
						// console.log("unit is NOT null " + this.id);
						// console.log("position " + JSON.stringify(state.units[key]));
						if (this.isServer || me.id != state.id) {
							this.units[key].updateUnit(state.units[key]);
						}
					}
				}
			}
		// }
	};
	this.update = function() {
		for(var key in this.units) {
			if (key != 'undefined') {
				this.units[key].update();

			}

		}
		for(var key in this.towers) {
			if (key != 'undefined')
				this.towers[key].update();
		}
		for(var i = this.projectiles.length - 1; i >= 0; i--) {
			if(this.projectiles[i].update() == false) {
				this.projectiles.splice(i,1);
			}
		}
	};
	
	this.getState = function() {
		unitPositions = {};
		for(var key in this.units) {
			if (key != 'undefined') {
				unitPositions[key] = this.units[key].getState();
			}
		}
		return {name : this.name, id : this.id, units : unitPositions}
	};
	
	this.leaveRoom = function() {
		this.units = {};
		this.towers = {};
	}
};

Projectile = function(startPosition, targetPosition, imgObject, speed) {
	var projectileObj =  mainScene.createElement(20,20);
    projectileObj.drawImage(imgObject);
    projectileObj.x = startPosition.x;
    projectileObj.y = startPosition.y;
    var diffX = startPosition.x - targetPosition.x;
    var diffY = startPosition.y - targetPosition.y;
    var angle = 0;
    if(diffX < 0) {
    	angle -= Math.PI/2;
    	if(diffY < 0) {
    		angle += Math.atan(diffY / diffX);
    	} else {
    		angle -= Math.atan(diffY / diffX);
    	}
    } else {
    	angle += Math.PI/2;
    	if(diffY < 0) {
    		angle -= Math.atan(diffY / diffX);
    	} else {
    		angle += Math.atan(diffY / diffX);
    	}
    }
    console.log("Rotating by... " + (57.2957795 * angle));
    projectileObj.rotate(57.2957795 * angle);

    this.mapResource = projectileObj;
    this.targetPosition = targetPosition;
    this.speed = speed;

	if (!this.isServer)
		mainScene.getStage().append(this.mapResource);
	console.log("add new projectile ");
	me.projectiles.push(this);

	this.update = function() {
		if(this && this.mapResource ) {
			var remX = (this.targetPosition.x - (this.mapResource.x / canvasDoc.width));
			var remY = (this.targetPosition.y - (this.mapResource.y / canvasDoc.height));
			if(remX != 0) this.mapResource.rotation = (Math.PI/2 + Math.atan(remY / remX));
			var totalDist = Math.sqrt(Math.pow(remX, 2) + Math.pow(remY, 2));
			if(totalDist < 0.05) {
				this.mapResource.remove();
				return false;
			} else if(this.speed < totalDist) {
				this.mapResource.x += canvasDoc.width * remX * (this.speed /  totalDist);
				this.mapResource.y += canvasDoc.height * remY * (this.speed /  totalDist);	
				return true;
			} else {
				this.mapResource.x += canvasDoc.width * remX;
				this.mapResource.y += canvasDoc.height * remY;
				return true;
			}
		}
		return true;
	}
}

Tower = function(id, tower, isServer, isOwner) {
	this.isOwner = isOwner;
	if(this.isOwner) {
		this.owner = me.id;
	}
    if (!isServer) {
	    var imgObject = new Image();
	    imgObject.dparent = this;
	    imgObject.onload = function() {
			var towerObj =  mainScene.createElement(100,100);
		    towerObj.drawImage(imgObject);
		    towerObj.x = tower.position.x;
		    towerObj.y = tower.position.y;
		    this.dparent.mapResource = towerObj;
		    this.dparent.mapResource.cparent = this.dparent;
		    me.addTower(this.dparent);
    		// check if it is my unit only then add mouse listener
			if (this.dparent.isOwner) {
				this.dparent.mapResource.on("mousedown", function(e) {
					this.cparent.mouseDown(e);
				});
			}
	    }
	    imgObject.src = tower_data[tower.code].image;

	    this.proImgObject = new Image();
	    this.proImgObject.onload = function() {

	    }
	    this.proImgObject.src = tower_data[tower.code].projectileImage;
	    this.proSpeed = tower_data[tower.code].projectileSpeed;
	    this.health = tower_data[tower.code].health;
	}

    this.currentPosition = tower.position;
    this.targetPosition = tower.position;
    this.isTower = 1;
    this.id = id;
    


    this.mouseDown = function(event) {
		currentSelectedUnit = this;
		this.mapResource.opacity = this.mapResource.opacity < 1 ? 1 : 0.5 ;
		//start a random projectile...

		this.fireProjectile({x: Math.random(), y: Math.random()});
		//var relX = event.offsetX / canvasDoc.width;
		//var relY = event.offsetY / canvasDoc.height;
		//this.updateTarget({x : relX, y : relY});
	}
    
	this.updatePosition = function(position) {
		this.currentPosition = position;
	};
	this.updateTarget = function(position) {
		this.targetPosition = position;
	};



	this.update = function() {
		if(this && this.mapResource ) {
			this.mapResource.x = this.targetPosition.x;
			this.mapResource.y = this.targetPosition.y;
			this.currentPosition = this.targetPosition;
			var unitToAttack = this.getUnitInRange();
			if(unitToAttack != null) {
				unitToAttack.health = unitToAttack.health - 10;
			}
		}
	};

	this.getState = function() {
		return {id : this.id, position : this.currentPosition, target : this.targetPosition, attacker : false};
	};

	this.fireProjectile = function(target) {
		var projectile = new Projectile(this.currentPosition, target, this.proImgObject, this.proSpeed);
	}

	this.getUnitInRange = function() {
		var opponent = null;
		for (var key in playersOnBoard) {
			if(key != me.id) {
				opponent = playersOnBoard[key];
				break;
			}
        }
        if(opponent == null) {
        	//return null;
        }
        for(var key in me.units ) {////hack due to stupid logic of units and towers storage.change to opponent tower when fixed
        	var tower = me.units[key];
        	var x = tower.mapResource.x;
        	var y = tower.mapResource.y;
        	var remX = x  - this.currentPosition.x;
			var remY = y - this.currentPosition.y;
			var dist = Math.sqrt(Math.pow(remX, 2) + Math.pow(remY, 2));
			if(dist < 100) {
				return tower;
			}
        }
        return null;
	};
};

Unit = function(id, unit, isServer, isOwner) {
	this.id = id;
	this.isAttacker = true;
	this.isOwner = isOwner;
	this.currentPosition = unit.position;
	this.isTower = 0;
	this.targetPosition = {x : 0, y : 0};
	if (!isServer) {
		this.mapResource = null;
	    var imgObject = new Image();
	    imgObject.dparent = this;
	    imgObject.onload = function() {
			var unitObj =  mainScene.createElement(64,64);
		    unitObj.drawImage(imgObject);
		    this.dparent.mapResource = unitObj;
		    this.dparent.mapResource.cparent = this.dparent;
		    me.addUnit(this.dparent);
    		// check if it is my unit only then add mouse listener
			if (this.dparent.isOwner) {
				this.dparent.mapResource.on("mousedown", function(e) {
					this.cparent.mouseDown(e);
				});
			}
	    }
	    imgObject.src = unit_data[unit.code].image;
	    this.health = unit_data[unit.code].health;
	}
	
	this.updateUnit = function(state) {
		this.updatePosition(state.position);
		if (this.isAttacker) {
			this.updateTarget(state.target);
		}
		// update health and stuff
	};
	this.updatePosition = function(position) {
		this.currentPosition = position;
	};
	this.updateTarget = function(position) {
		this.targetPosition = position;
	};
	this.update = function() {
		if (this.isAttacker) {
 
			var remX = (this.targetPosition.x * canvasDoc.width) - this.currentPosition.x;
			var remY = (this.targetPosition.y * canvasDoc.height)- this.currentPosition.y;
			var dist = Math.sqrt(Math.pow(remX, 2) + Math.pow(remY, 2));
			if(dist != 0) {
				this.currentPosition.x += (remX / dist);
				this.currentPosition.y += (remY / dist);
			}
			/*
			if( Math.abs((currentPosition.x / canvasDoc.width) - currentServertargetPosition.x) > 0.005 ) {
				currentPosition.x = currentServertargetPosition.x * canvasDoc.width;
			}

			if( Math.abs((currentPosition.y / canvasDoc.height) - currentServertargetPosition.y) > 0.005 ) {
				currentPosition.y = currentServertargetPosition.y * canvasDoc.height;
			}
			*/
		}
		else {
		
		}
		this.mapResource.x = this.currentPosition.x;
		this.mapResource.y = this.currentPosition.y;
		var towerToAttack = this.getTowerInRange() ;
		if(towerToAttack != null) {
			//fire
			towerToAttack.health = towerToAttack.health - 5;
		}
	};

	this.getTowerInRange = function() {
		var opponent = null;
		for (var key in playersOnBoard) {
			if(key != me.id) {
				opponent = playersOnBoard[key];
				break;
			}
        }
        if(opponent == null) {
        	//return null;
        }
        for(var key in me.towers ) { //hack due to stupid logic of units and towers storage.change to opponent tower when fixed
        	var tower = me.towers[key];
        	var x = tower.mapResource.x;
        	var y = tower.mapResource.y;
        	var remX = x  - this.currentPosition.x;
			var remY = y - this.currentPosition.y;
			var dist = Math.sqrt(Math.pow(remX, 2) + Math.pow(remY, 2));
			if(dist < 100) {
				return tower;
			}
        }
        return null;
	};

	this.getState = function() {
		return {id : this.id, position : this.currentPosition, target : this.targetPosition, attacker : this.isAttacker};
	};
	
	this.mouseDown = function(event) {
		currentSelectedUnit = this;
		this.mapResource.opacity = this.mapResource.opacity < 1 ? 1 : 0.5 ;
		//var relX = event.offsetX / canvasDoc.width;
		//var relY = event.offsetY / canvasDoc.height;
		//this.updateTarget({x : relX, y : relY});
	}
};
