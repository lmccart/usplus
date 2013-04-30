function hysteresis() {
	var lastTime = 0;
	var lastValue = false, curValue = false;

	this.risingDelay = 0;
	this.fallingDelay = 0;
	this.ontrigger = function(){};
	this.onuntrigger = function(){};


	this.update = function(value) {
		var curTime = Date.now();
		if(value != curValue) {
			if(value != lastValue) {
				lastTime = curTime;
			}
			var delay = value ? this.risingDelay : this.fallingDelay;
			if(curTime - lastTime >= delay) {
				if(value) {
					this.ontrigger();
				} else {
					this.onuntrigger();
				}
				curValue = value;
			}
		}
		lastValue = value;
	}
}