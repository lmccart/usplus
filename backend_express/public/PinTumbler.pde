String categories[] = {
  "posemo",
  "negemo",
  "anger", 
  "complexity", 
  "status",
  "depression",
  "formality",
  "honesty"
};


String lessCommand[] = {
  "Dial down the sunshine!",
  "Look on the bright side!",
  "Calm down, don't be such a dick!", 
  "Can't you say it clearly?",
  "Speak for yourself!",
  "Pull yourself out of it already!",
  "You elitist asshole.",
  "Nobody wants to read your diary!"
};

String moreCommand[] = {
  "Look on the bright side!",
  "Dial down the sunshine!",
  "Grow a pair.", 
  "Thank you captain obvious.", 
  "It's not all about you all the time!",
  "You can't really be that happy.",
  "Who do you think you're talking to? Ever heard of manners?",
  "Be more honest! Fucking lying piece of shit!"
};

float baseScore = 1;
float scalePower = 2, minHeightScale = 1, maxHeightScale = 50;

float scoresa[] = new float[categories.length];
float scoresb[] = new float[categories.length];

void setup() {
  console.log('setup');
  size(300, 200);
  strokeWeight(3);
  smooth();

  for (int i=0; i<categories.length; i++) {
    scoresa[i] = 0;
    scoresb[i] = 0;
  }
}

void draw() {
  background(255, 0, 0);

    //fakeData();
  

  float totalScale = 0;
  float maxScale = 0;
  int maxScaleIndex = 0;
  float balances[] = new float[categories.length];
  float scales[] = new float[categories.length];
  for(int i = 0; i < categories.length; i++) {
    float totalScore = scoresa[i] + scoresb[i];
    if(totalScore > 0) {
      balances[i] = scoresa[i] / totalScore;
    } else {
      balances[i] = .5;
    }
    scales[i] = pow(2 * abs(balances[i] - .5), scalePower);
    scales[i] = map(scales[i], 0, 1, minHeightScale, maxHeightScale);
    totalScale += scales[i];
    if(scales[i] > maxScale) {
      maxScale = scales[i];
      maxScaleIndex = i;
    }
  }

  float y = 0;
  for(int i = 0; i < categories.length; i++) {
    float curHeight = height * (scales[i] / totalScale);
    float widtha = balances[i] * width;
    float widthb = width - widtha;
    noStroke();
    fill(230);
    rect(0, y, widtha, curHeight);
    fill(192);
    rect(widtha, y, widthb, curHeight);
    stroke(250);
    line(0, y, width, y);
    stroke(64);
    textAlign(LEFT, TOP);
    text(categories[i], 10, y + 10);
    if(i == maxScaleIndex) {
      textAlign(CENTER, CENTER);
      fill(0);
      text(getCommand(i, balances[i]), width / 2, y + curHeight / 2);
    }
    y += curHeight;
  }
  
  noStroke();
  fill(0, 128);
  textAlign(LEFT, BOTTOM);
  text("you", 10, height - 10); 
  textAlign(RIGHT, BOTTOM);
  text("them", width - 10, height - 10);
  
  stroke(128, 32);
  line(width / 2, 0, width / 2, height);
  
}

String getCommand(int category, float balance) {
  return (balance < .5 ? lessCommand : moreCommand)[category];
}


void fakeData() {
  float t = (millis() / 30000.);
  for(int i = 0; i < categories.length; i++) {
    //scoresa[i] = noise(0, i, t);
    scoresb[i] = baseScore + 2. * abs(noise(1, i, t) - .5);
  }
  // scoresa[0] = map(mouseX, 0, width, 0, 10); // manual override first score
}

socket.on('stats', function (data) {
  var flip = userGuid != data.users[0];
  var usera = flip ? 1 : 0;
  var userb = flip ? 0 : 1;
  console.log(data);
  //console.log("usera:"+usera+" userb:"+userb+" flip:"+flip+" userGuid:"+userGuid+" data.users[0]:"+data.users[0]);
  for(var i = 0; i < categories.length; i++) {
    scoresa[i] = (data.users[usera]) ? baseScore + data[categories[i]][usera] : baseScore;
    scoresb[i] = (data.users[userb]) ? baseScore + data[categories[i]][userb] : baseScore;
  }

  gapi.hangout.layout.displayNotice(flip, true);

  
  console.log(scoresa);
  console.log(scoresb);
});