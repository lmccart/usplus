function hysteresis() {
	var lastTime = 0;
	var lastValue = false, curValue = false;
	var risingDelay = 0, fallingDelay = 0;
	var triggered = false, untriggered = false;

	this.setDelay = function(risingDelay, fallingDelay) {
		this.risingDelay = 1000 * risingDelay;
		this.fallingDelay = 1000 * fallingDelay;
	}
	this.setDelay = function(delay) {
		setDelay(delay, delay);
	}
	this.update = function(value) {
		var curTime = Date.now();
		if(value != curValue) {
			if(value != lastValue) {
				lastTime = curTime;
			}
			var delay = value ? risingDelay : fallingDelay;
			if(curTime - lastTime > delay) {
				curValue = value;
				if(value) {
					triggered = true;
				} else {
					untriggered = true;
				}
			}
		}
		lastValue = value;
	}
	this.get = function() {
		return curValue;
	}
	this.wasTriggered = function() {
		if(triggered) {
			triggered = false;
			return true;
		}
		return false;
	}
	this.wasUntriggered = function() {
		if(untriggered) {
			untriggered = false;
			return true;
		}
		return false;
	}
	this.length = function() {
		return lengthMillis() / 1000.;
	}
	this.lengthMillis = function() {
		return Date.now() - lastTime;
	}
}