String categories[] = {
"angry",
"depressed",
"formal",
"honest",
"talkative",
"pausing"
};
float scalePower = 2, minHeightScale = 1, maxHeightScale = 50;
PFont font;

String getSuggestion(int category, float balance) {
  boolean needLess = balance > .5;
  switch(category) {
    case 0: return needLess ? "Try being more calm." : "Get angrier.";
    case 1: return needLess ? "Try being more upbeat." : "Don't act so upbeat.";
    case 2: return needLess ? "Don't be so formal." : "Try being more formal.";
    case 3: return needLess ? "Don't be so honest." : "Try being more honest.";
    case 4: return needLess ? "Try talking less." : "Try talking more.";
    case 5: return needLess ? "Try pausing more." : "Try pausing less.";
    default: return "";
  }
}

float scoresa[] = new float[categories.length];
float scoresb[] = new float[categories.length];

void setup() {
  size(1280, 720);
  strokeWeight(3);
  font = createFont("Arial", 32);
  textFont(font);
  smooth();
}

void draw() {
  background(255);
  
  //fakeData();
  
  float totalScale = 0;
  float maxScale = 0;
  int maxScaleIndex = 0;
  float balances[] = new float[categories.length];
  float scales[] = new float[categories.length];
  for(int i = 0; i < categories.length; i++) {
    float totalScore = scoresa[i] + scoresb[i];
    balances[i] = scoresa[i] / totalScore;
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
      text(getSuggestion(i, balances[i]), width / 2, y + curHeight / 2);
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

void fakeData() {
  float t = (millis() / 30000.);
  for(int i = 0; i < categories.length; i++) {
    scoresa[i] = noise(0, i, t);
    scoresb[i] = noise(1, i, t);
  }
  // scoresa[0] = map(mouseX, 0, width, 0, 10); // manual override first score
}

socket.on('status', function (data) {
  
});
