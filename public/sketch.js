const { Engine, World, Bodies, Composite, Constraint, Mouse, MouseConstraint } =
  Matter;

let engine;
let world;
let boundaries = [];
let mConstraint;

var bkgdColor = "#ffffff";
var strokeColor = "#0000ff";
var fillColor = "#000000";

var pg = [];
var pgTextSize = 100;

var tFont = null;
var pgTextFactor = null;
var leading = 0;
var textScaler = 0.35;

var starterText =
  " What comes to \n your mind when \n you think of \n Chinese \n culture? ";

var constrainMode = 1;

var typeCoreW, typeCoreH;
var borderWeight = 1;

var inputText;
var widgetOn = true;

var padFactor = 0;

var gravityAng = 1.5708;
var gravityStrength = 0; // 0.0001

var unitCore = [];
var lineWidths = [];

var dropGroup;
var debrisGroup = [];
var debrisData = [];

var pgImage = [];

var refreshNewText = 5;
var debrisCap = 12;

const frate = 30;

let textBodies = [];

var originalGraphic;
var graphic;
var answerList = []; // 回答
var chatMatterMgr;

function preload() {
  tFont = loadFont("resources/WontonByDaFontMafia-x378V.ttf");
  pgTextFactor = 0.69;

  pgImage[0] = loadImage("resources/images/chopsticks.png");
  pgImage[1] = loadImage("resources/images/cookie.png");
  pgImage[2] = loadImage("resources/images/dragon.png");
  pgImage[3] = loadImage("resources/images/dragon2.png");
  pgImage[4] = loadImage("resources/images/dumpling.png");
  pgImage[5] = loadImage("resources/images/mahjong.png");
  pgImage[6] = loadImage("resources/images/mooncake.png");
  pgImage[7] = loadImage("resources/images/rice.png");
  pgImage[8] = loadImage("resources/images/stew.png");
  pgImage[9] = loadImage("resources/images/takeout.png");
  pgImage[10] = loadImage("resources/images/tanabata.png");
  pgImage[11] = loadImage("resources/images/yue.png");

  // Shuffle Algorithm
  for (let i = pgImage.length - 1; i > 0; i--) {
    let j = floor(random(i + 1));
    [pgImage[i], pgImage[j]] = [pgImage[j], pgImage[i]];
  }
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  originalGraphic = createGraphics(windowWidth, windowHeight);
  graphic = createGraphics(windowWidth, windowHeight);

  var engineOptions = {};
  engine = Engine.create(engineOptions);
  world = engine.world;

  textFont(tFont);
  textSize(pgTextSize);
  strokeJoin(ROUND);

  setText();
  findMaxSize();

  dropGroup = new DropAll();

  for (var m = 0; m < 4; m++) {
    boundaries.push(new Boundary(0, 0, height + width, 400, 0));
  }
  positionBoundaries();

  let canvasMouse = Mouse.create(canvas.elt);
  let options = { mouse: canvasMouse };
  canvasMouse.pixelRatio = pixelDensity();
  mConstraint = MouseConstraint.create(engine, options);
  World.add(world, mConstraint);

  for (let i = 0; i < 12; i++) {
    setTimeout(() => {
      addDebris(i, map(i, 0, 12, 0, 36));
    }, 1);
  }

  chatMatterMgr = new ChatMatterMgr(graphic, canvas);
  chatMatterMgr.setup();

  let click = false;
  canvas.elt.addEventListener(
    "click",
    async function () {
      if (click) {
        return;
      }

      click = true;
      gravityStrength = 0.0001;
      const msgList = localStorage.getItem("MSG_LIST");
      if (msgList) {
        const _msgList = JSON.parse(msgList);
        localStorage.setItem("MSG_LIST", null);
        for (let i = 0; i < _msgList.length; i++) {
          chatMatterMgr.add(_msgList[i]);

          await (() => {
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve();
              }, 1000);
            });
          })();
        }
      }
    },
    false
  );
}

function draw() {
  world.gravity.x = cos(gravityAng);
  world.gravity.y = sin(gravityAng);

  world.gravity.scale = gravityStrength;

  Engine.update(engine);

  if (borderWeight > 0) {
    borderWeight -= 0.05;
    stroke("#5080bf");
    strokeWeight(borderWeight);
    noFill();
    rectMode(CENTER);
    rect(
      width / 2,
      height / 2,
      width - (width - typeCoreW) * padFactor,
      height - (height - typeCoreH) * padFactor
    );
  }
  if (borderWeight < 0.1) {
    borderWeight = 0;
  }

  if (refreshNewText < 4) {
    newText();
    refreshNewText++;
  }

  background(255);
  dropGroup.run();
  chatMatterMgr.draw();
  image(originalGraphic, 0, 0);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  newText();
}

function positionBoundaries() {
  var vertPad = ((height - typeCoreH) / 2) * padFactor;
  var horzPad = ((width - typeCoreW) / 2) * padFactor;

  Matter.Body.setPosition(boundaries[0].body, {
    x: width / 2,
    y: height + 200 - vertPad,
  });
  Matter.Body.setAngle(boundaries[0].body, 0);

  Matter.Body.setPosition(boundaries[1].body, {
    x: width / 2,
    y: -200 + vertPad,
  });
  Matter.Body.setAngle(boundaries[1].body, PI);

  Matter.Body.setPosition(boundaries[2].body, {
    x: -200 + horzPad,
    y: height / 2,
  });
  Matter.Body.setAngle(boundaries[2].body, PI / 2);

  Matter.Body.setPosition(boundaries[3].body, {
    x: width + 200 - horzPad,
    y: height / 2,
  });
  Matter.Body.setAngle(boundaries[3].body, (PI * 3) / 2);

  borderWeight = 2;
}

// 边界对象
class Boundary {
  constructor(x, y, w, h, a) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.a = a;

    let options = {
      friction: 0,
      restitution: 0.6,
      angle: a,
      isStatic: true,
    };
    this.body = Bodies.rectangle(this.x, this.y, this.w, this.h, options);
    Composite.add(world, this.body);
  }

  show() {
    stroke(0, 0, 255);
    noFill();
    ellipse(this.x, this.y, 20, 20);

    let pos = this.body.position;
    let angle = this.body.angle;
    push();
    translate(pos.x, pos.y);
    rotate(angle);
    rectMode(CENTER);

    rect(0, 0, this.w, this.h);
    pop();
  }
}

class DropAll {
  constructor() {
    this.dropLines = [];

    for (var m = 0; m < inputText.length; m++) {
      this.dropLines[m] = new DropLine(m);
    }
  }

  run() {
    for (var m = 0; m < inputText.length; m++) {
      this.dropLines[m].run();
    }

    for (var m = 0; m < debrisGroup.length; m++) {
      debrisGroup[m].run();
    }
  }

  refresh() {
    for (var m = 0; m < inputText.length; m++) {
      this.dropLines[m].refresh();
    }
  }

  resetPos() {
    for (var m = 0; m < inputText.length; m++) {
      this.dropLines[m].resetPos();
    }

    for (var m = 0; m < debrisGroup.length; m++) {
      debrisGroup[m].resetPos();
    }
  }

  removeIt() {
    for (var m = inputText.length - 1; m >= 0; m--) {
      this.dropLines[m].removeIt();
    }

    for (var m = debrisGroup.length - 1; m >= 0; m--) {
      debrisGroup[m].removeIt();
    }
  }

  removeConstraint() {
    for (var m = inputText.length - 1; m >= 0; m--) {
      this.dropLines[m].removeConstraint();
    }
  }
}

class DropLine {
  constructor(lineIndex) {
    this.lineIndex = lineIndex;
    this.lineLength = inputText[this.lineIndex].length;

    this.letterCounter = 0;
    this.dropLetters = [];
    this.dropConstraints = [];
    this.dropDebris = [];

    this.setUnits();
  }

  run() {
    this.dropLetters.forEach((letter) => letter.run());
  }

  setUnits() {
    textFont(tFont);
    textSize(pgTextSize);

    const thisY =
      height / 2 -
      ((inputText.length - 2) * (pgTextSize * pgTextFactor + leading)) / 2 +
      (pgTextSize * pgTextFactor + leading) * this.lineIndex -
      leading / 2;

    let xCulm = 0;

    unitCore[this.lineIndex].forEach((unit) => {
      const thisX = width / 2 + xCulm - lineWidths[this.lineIndex] / 2;

      switch (unit.mode) {
        case 0:
          this.addLetters(unit.content, thisX, thisY);
          xCulm += textWidth(unit.content + " ");
          break;
        case 1:
          this.addDebris(unit.content.index, thisX, thisY);
          xCulm += debrisGroup.at(-1).w + textWidth(" ");
          break;
        case 2:
          this.addWord(unit.content, thisX, thisY);
          xCulm += debrisGroup.at(-1).w + textWidth(" ");
          break;
      }
    });
  }

  addLetters(word, baseX, baseY) {
    for (let n = 0; n < word.length; n++) {
      const thisLetter = word.charAt(n);
      const thisX =
        baseX +
        (n > 0
          ? textWidth(word.substring(0, n + 1)) - textWidth(thisLetter)
          : 0);

      this.dropLetters.push(new DropLetter(thisLetter, thisX, baseY));
      if (n > 0 && constrainMode !== 0) {
        this.configureConstraint(this.letterCounter);
      }
      this.letterCounter++;
    }
  }

  addDebris(index, baseX, baseY) {
    debrisGroup.push(new DropDebris(index, baseX, baseY));
  }

  addWord(word, baseX, baseY) {
    const wordWidth = textWidth(word);
    debrisGroup.push(new DropWord(word, wordWidth, baseX, baseY));
  }

  configureConstraint(index) {
    const current = this.dropLetters[index];
    const previous = this.dropLetters[index - 1];

    if (current.thisLetter !== " " && previous.thisLetter !== " ") {
      const points = [
        { x: 0, y: -(pgTextSize * pgTextFactor) / 2 },
        { x: 0, y: 0 },
        { x: 0, y: (pgTextSize * pgTextFactor) / 2 },
      ];

      points.forEach((point) => {
        const options = {
          bodyA: current.bodyLetter,
          bodyB: previous.bodyLetter,
          pointA: point,
          pointB: point,
          stiffness: 0.1,
          damping: 0.05,
        };
        const constraint = Constraint.create(options);
        this.dropConstraints.push(constraint);
        World.add(world, constraint);
      });
    }
  }

  refresh() {
    this.dropLetters.forEach((letter) => letter.refresh());
    this.setOriginalOrder();
  }

  resetPos() {
    this.dropLetters.forEach((letter) => letter.resetPos());
  }

  removeIt() {
    while (this.dropLetters.length) {
      this.dropLetters.pop().removeIt();
    }
  }

  removeConstraint() {
    while (this.dropConstraints.length) {
      Composite.remove(world, this.dropConstraints.pop());
    }
  }
}

class DropDebris {
  constructor(m, x, y) {
    this.m = m;

    this.hr = pgImage[this.m].width / pgImage[this.m].height;

    this.w = this.hr * pgTextSize * pgTextFactor;
    this.h = pgTextSize * pgTextFactor;

    this.x = x + this.w / 2;
    this.y = y - this.h / 2;

    let options = {
      friction: 0,
      restitution: 0.6,
    };

    this.body = Bodies.rectangle(this.x, this.y, this.w, this.h, options);
    Composite.add(world, this.body);
  }

  run() {
    this.update();
    this.display();
  }

  update() {}

  display() {
    if (debrisData[this.m].mode == 0) {
      this.displayFrame();
    } else if (debrisData[this.m].mode == 1) {
      this.displayImage();
    }
  }

  displayFrame() {
    strokeWeight(1);
    stroke(strokeColor);
    noFill();

    let pos = this.body.position;
    let angle = this.body.angle;
    push();
    translate(pos.x, pos.y);
    rotate(angle);
    rectMode(CENTER);
    rect(0, 0, this.w, this.h);
    line(-this.w / 2, -this.h / 2, this.w / 2, this.h / 2);
    line(-this.w / 2, this.h / 2, this.w / 2, -this.h / 2);
    pop();
  }

  displayImage() {
    let pos = this.body.position;
    let angle = this.body.angle;
    push();
    translate(pos.x, pos.y);
    rotate(angle);

    imageMode(CENTER);
    image(pgImage[this.m], 0, 0, this.w, this.h);

    pop();
  }

  resetPos() {
    Matter.Body.setPosition(this.body, { x: this.x, y: this.y });
    Matter.Body.setAngle(this.body, 0);
    Matter.Body.setAngularSpeed(this.body, 0);
    Matter.Body.setAngularVelocity(this.body, 0);
    Matter.Body.setSpeed(this.body, 0);
  }

  removeIt() {
    Composite.remove(world, this.body);
  }
}
class DropLetter {
  constructor(thisLetter, thisX, thisY, thisW) {
    this.thisLetter = thisLetter;

    this.orgX = thisX;
    this.orgY = thisY;

    this.coreOrg;

    this.minPoint;
    this.maxPoint;
    this.diff;

    this.points;
    this.bodyLetter;

    if (this.thisLetter != " ") {
      this.textPointMaker();
      this.physicsPointMaker();
    }
  }

  textPointMaker() {
    this.points = tFont.textToPoints(
      this.thisLetter,
      this.orgX,
      this.orgY,
      pgTextSize,
      {
        sampleFactor: 0.1,
        simplifyThreshold: 0,
      }
    );
  }

  physicsPointMaker() {
    var newX = this.orgX + textWidth(this.thisLetter) / 2;
    var newY = this.orgY - (pgTextSize * pgTextFactor) / 2;

    this.bodyLetter = Bodies.fromVertices(newX, newY, this.points);
    Composite.add(world, this.bodyLetter);

    this.minPoint = createVector(
      this.bodyLetter.bounds.min.x,
      this.bodyLetter.bounds.min.y
    );
    this.maxPoint = createVector(
      this.bodyLetter.bounds.max.x,
      this.bodyLetter.bounds.max.y
    );

    var pos = this.bodyLetter.position;
    this.diff = createVector(
      -(pos.x - this.minPoint.x),
      -(pos.y - this.maxPoint.y)
    );

    Matter.Body.setPosition(this.bodyLetter, {
      x: pos.x,
      y: this.orgY - this.diff.y,
    });

    this.coreOrg = createVector(pos.x, this.orgY - this.diff.y);
  }

  run() {
    this.update();
    this.display();
  }

  update() {}

  display() {
    var pos = this.bodyLetter.position;
    var ang = this.bodyLetter.angle;

    noStroke();

    push();
    translate(pos.x, pos.y);
    rotate(ang);
    translate(0, this.diff.y);

    fill(fillColor);
    textAlign(CENTER);
    text(this.thisLetter, 0, 0);
    pop();
  }

  resetPos() {
    if (this.thisLetter != " ") {
      Matter.Body.setPosition(this.bodyLetter, {
        x: this.coreOrg.x,
        y: this.coreOrg.y,
      });
      Matter.Body.setAngle(this.bodyLetter, 0);
      Matter.Body.setAngularSpeed(this.bodyLetter, 0);
      Matter.Body.setAngularVelocity(this.bodyLetter, 0);
      Matter.Body.setSpeed(this.bodyLetter, 0);
    }
  }

  removeIt() {
    if (this.thisLetter != " ") {
      Composite.remove(world, this.bodyLetter);
    }
  }
}

class DropWord {
  constructor(word, wordWidth, x, y) {
    this.word = word;

    this.w = wordWidth;
    this.h = pgTextSize * pgTextFactor;

    this.x = x + this.w / 2;
    this.y = y - this.h / 2;

    let options = {
      friction: 1,
      restitution: 0.6,
    };

    this.body = Bodies.rectangle(this.x, this.y, this.w, this.h, options);

    Composite.add(world, this.body);
  }

  run() {
    this.update();
    this.display();
  }

  update() {}

  display() {
    this.displayWord();
  }

  displayFrame() {
    strokeWeight(1);
    stroke(strokeColor);
    noFill();

    let pos = this.body.position;
    let angle = this.body.angle;
    push();
    translate(pos.x, pos.y);
    rotate(angle);
    rectMode(CENTER);
    rect(0, 0, this.w, this.h);
    line(-this.w / 2, -this.h / 2, this.w / 2, this.h / 2);
    line(-this.w / 2, this.h / 2, this.w / 2, -this.h / 2);
    pop();
  }

  displayWord() {
    fill(fillColor);
    noStroke();

    let pos = this.body.position;
    let angle = this.body.angle;
    push();
    translate(pos.x, pos.y);
    rotate(angle);

    textAlign(CENTER);
    text(this.word, 0, this.h / 2);
    pop();
  }

  resetPos() {
    Matter.Body.setPosition(this.body, { x: this.x, y: this.y });
    Matter.Body.setAngle(this.body, 0);
    Matter.Body.setAngularSpeed(this.body, 0);
    Matter.Body.setAngularVelocity(this.body, 0);
    Matter.Body.setSpeed(this.body, 0);
  }

  removeIt() {
    Composite.remove(world, this.body);
  }
}

function setText() {
  var enteredText = starterText;

  inputText = enteredText.match(/[^\r\n]+/g);

  if (enteredText == "") {
    inputText = [];
    inputText[0] = " ";
  }

  debrisGroup = [];
  unitCore = [];
  for (var m = 0; m < inputText.length; m++) {
    var thisLine = inputText[m].split(" ");

    unitCore[m] = [];

    for (var n = 0; n < thisLine.length; n++) {
      var thisMode = 0;
      if (constrainMode == 0) {
        thisMode = 0;
      } else if (constrainMode == 2) {
        thisMode = 2;
      } else if (constrainMode == 3) {
        var rs0 = random(10);
        if (rs0 < 5) {
          thisMode = 0;
        } else {
          thisMode = 2;
        }
      }

      unitCore[m][n] = {
        mode: thisMode,
        content: thisLine[n],
      };
    }
  }

  for (var i = 0; i < debrisData.length; i++) {
    var culmBot = 0;
    var culmTop = 0;
    for (var m = 0; m < unitCore.length; m++) {
      culmTop += unitCore[m].length + 1;

      if (
        debrisData[i].position >= culmBot &&
        debrisData[i].position < culmTop
      ) {
        var newUnit = {
          mode: 1,
          content: debrisData[i],
        };
        unitCore[m].splice(debrisData[i].position - culmBot, 0, newUnit);
      }
      culmBot = culmTop;
    }

    if (debrisData[i].position >= culmTop) {
      var newUnit = {
        mode: 1,
        content: debrisData[i],
      };
      unitCore[unitCore.length - 1].splice(
        unitCore[unitCore.length - 1].length,
        0,
        newUnit
      );
    }
  }

  findMaxSize();
}

function findMaxSize() {
  var testerSize = 100;
  textSize(testerSize);
  textFont(tFont);

  var longestLine = 0;
  var measurer = 0;

  for (var m = 0; m < unitCore.length; m++) {
    var tapeMeasurer = 0;
    for (var n = 0; n < unitCore[m].length; n++) {
      if (unitCore[m][n].mode == 0) {
        tapeMeasurer += textWidth(unitCore[m][n].content + " ");
      } else if (unitCore[m][n].mode == 1) {
        var thisImage = unitCore[m][n].content.index;
        var thisHR = pgImage[thisImage].width / pgImage[thisImage].height;
        tapeMeasurer += thisHR * testerSize * pgTextFactor;
      } else if (unitCore[m][n].mode == 2) {
        tapeMeasurer += textWidth(unitCore[m][n].content + " ");
      }
    }

    if (tapeMeasurer > measurer) {
      longestLine = m;
      measurer = tapeMeasurer;
    }
  }

  var widthTest = width - 30;

  let sizeHolder = 2;
  textSize(sizeHolder);
  let holdW = 0;

  while (holdW < widthTest) {
    holdW = 0;
    if (unitCore && unitCore.length <= 0) {
      break;
    }
    for (var n = 0; n < unitCore[longestLine].length; n++) {
      if (unitCore[longestLine][n].mode == 0) {
        textSize(sizeHolder);
        holdW += textWidth(unitCore[longestLine][n].content + " ");
      } else if (unitCore[longestLine][n].mode == 1) {
        var thisImage = unitCore[longestLine][n].content.index;
        var thisHR = pgImage[thisImage].width / pgImage[thisImage].height;
        holdW += thisHR * sizeHolder * pgTextFactor;
      } else if (unitCore[longestLine][n].mode == 2) {
        textSize(sizeHolder);
        holdW += textWidth(unitCore[longestLine][n].content + " ");
      }
    }

    sizeHolder += 2;
  }

  var heightTest = height - 30 - inputText.length * leading;
  let holdH = inputText.length * sizeHolder * pgTextFactor;
  while (holdH > heightTest) {
    holdH = inputText.length * sizeHolder * pgTextFactor;
    sizeHolder -= 2;
  }

  pgTextSize = constrain(sizeHolder * textScaler, 12, 1000);

  textSize(pgTextSize);

  lineWidths = [];
  for (var m = 0; m < unitCore.length; m++) {
    lineWidths[m] = 0;
    for (var n = 0; n < unitCore[m].length; n++) {
      if (unitCore[m][n].mode == 0) {
        lineWidths[m] += textWidth(unitCore[m][n].content + " ");
      } else if (unitCore[m][n].mode == 1) {
        var thisImage = unitCore[m][n].content.index;
        var thisHR = pgImage[thisImage].width / pgImage[thisImage].height;
        lineWidths[m] += thisHR * pgTextSize * pgTextFactor;
      } else if (unitCore[m][n].mode == 2) {
        lineWidths[m] += textWidth(unitCore[m][n].content + " ");
      }
    }
  }

  typeCoreW = lineWidths[longestLine];
  typeCoreH =
    inputText.length * pgTextSize * pgTextFactor +
    (inputText.length - 1) * leading;
}

function newText() {
  dropGroup.removeIt();

  setText();

  dropGroup = new DropAll();

  positionBoundaries();
}

function resetPos() {
  dropGroup.resetPos();
}

function addDebris(index, pos) {
  if (debrisData.length < debrisCap) {
    var positionCount = 0;
    for (var m = 0; m < unitCore.length; m++) {
      for (var n = 0; n < unitCore[n].length; n++) {
        positionCount++;
      }
      positionCount++;
    }
    positionCount++;

    debrisData[index] = {
      index: index,
      mode: 1,
      position: pos,
    };

    newText();
  }
}

class ChatMatterMgr {
  constructor(graphic, canvas) {
    this.graphic = graphic;
    this.canvas = canvas;
    this.boundaries = [];

    this.unitCoreList = [];

    this.dropGroupList = [];
  }

  setup() {
    var engineOptions = {};
    this.engine = Engine.create(engineOptions);
    this.world = engine.world;

    let canvasMouse = Mouse.create(this.canvas.elt);
    let options = { mouse: canvasMouse };
    canvasMouse.pixelRatio = pixelDensity();
    let mConstraint = MouseConstraint.create(engine, options);
    World.add(world, mConstraint);

    strokeJoin(ROUND);
  }

  add(msg) {
    const { inputText, unitCore } = this.trsTextToUnitcore(msg);
    const dropGroup = new DropAll2(this.graphic, inputText, unitCore);
    this.dropGroupList.push(dropGroup);

    const msgList = localStorage.getItem("MSG_LIST");
    if (msgList != "null" && msgList != null) {
      const _msgList = JSON.parse(msgList);
      _msgList.push(msg);
      localStorage.setItem("MSG_LIST", JSON.stringify(_msgList));
    } else {
      localStorage.setItem("MSG_LIST", JSON.stringify([msg]));
    }
  }

  draw() {
    // let gravityAng = PI / 2;
    // this.world.gravity.x = cos(gravityAng);
    // this.world.gravity.y = sin(gravityAng);
    // this.world.gravity.scale = gravityStrength;

    // Engine.update(this.engine);

    this.dropGroupList.forEach((item) => {
      item.run();
    });
  }

  positionBoundaries() {
    var vertPad = ((height - typeCoreH) / 2) * padFactor;
    var horzPad = ((width - typeCoreW) / 2) * padFactor;

    Matter.Body.setPosition(boundaries[0].body, {
      x: width / 2,
      y: height + 200 - vertPad,
    });
    Matter.Body.setAngle(boundaries[0].body, 0);

    Matter.Body.setPosition(boundaries[1].body, {
      x: width / 2,
      y: -200 + vertPad,
    });
    Matter.Body.setAngle(boundaries[1].body, PI);

    Matter.Body.setPosition(boundaries[2].body, {
      x: -200 + horzPad,
      y: height / 2,
    });
    Matter.Body.setAngle(boundaries[2].body, PI / 2);

    Matter.Body.setPosition(boundaries[3].body, {
      x: width + 200 - horzPad,
      y: height / 2,
    });
    Matter.Body.setAngle(boundaries[3].body, (PI * 3) / 2);

    borderWeight = 2;
  }

  /**
   * 转换字符
   * @param {*} enteredText
   */
  trsTextToUnitcore(enteredText) {
    let inputText = enteredText.match(/[^\r\n]+/g);

    if (enteredText == "") {
      inputText = [];
      inputText[0] = " ";
    }

    let unitCore = [];
    for (var m = 0; m < inputText.length; m++) {
      var thisLine = inputText[m].split(" ");

      unitCore[m] = [];

      for (var n = 0; n < thisLine.length; n++) {
        var thisMode = 0;
        if (constrainMode == 0) {
          thisMode = 0;
        } else if (constrainMode == 2) {
          thisMode = 2;
        } else if (constrainMode == 3) {
          var rs0 = random(10);
          if (rs0 < 5) {
            thisMode = 0;
          } else {
            thisMode = 2;
          }
        }

        unitCore[m][n] = {
          mode: thisMode,
          content: thisLine[n],
        };
      }
    }

    return { inputText, unitCore };
  }
}

class DropAll2 {
  constructor(graphic, inputText, unitCore) {
    this.graphic = graphic;
    this.inputText = inputText;
    this.dropLines = [];

    for (var m = 0; m < inputText.length; m++) {
      this.dropLines[m] = new DropLine2(graphic, m, unitCore);
    }
  }

  run() {
    for (var m = 0; m < this.inputText.length; m++) {
      this.dropLines[m].run();
    }

    // for (var m = 0; m < debrisGroup.length; m++) {
    //   debrisGroup[m].run();
    // }
  }

  refresh() {
    for (var m = 0; m < this.inputText.length; m++) {
      this.dropLines[m].refresh();
    }
  }

  resetPos() {
    for (var m = 0; m < this.inputText.length; m++) {
      this.dropLines[m].resetPos();
    }

    // for (var m = 0; m < debrisGroup.length; m++) {
    //   debrisGroup[m].resetPos();
    // }
  }

  removeIt() {
    for (var m = this.inputText.length - 1; m >= 0; m--) {
      this.dropLines[m].removeIt();
    }

    // for (var m = debrisGroup.length - 1; m >= 0; m--) {
    //   debrisGroup[m].removeIt();
    // }
  }

  removeConstraint() {
    for (var m = this.inputText.length - 1; m >= 0; m--) {
      this.dropLines[m].removeConstraint();
    }
  }
}

class DropLine2 {
  constructor(graphic, lineIndex, unitCore) {
    this.graphic = graphic;

    this.lineIndex = lineIndex;
    this.lineLength = inputText[this.lineIndex].length;

    this.letterCounter = 0;
    this.dropLetters = [];
    this.dropConstraints = [];
    this.dropDebris = [];

    this.unitCore = unitCore;

    this.setUnits();
  }

  run() {
    this.dropLetters.forEach((letter) => letter.run());
  }

  setUnits() {
    textFont(tFont);
    textSize(pgTextSize * 0.8);

    const thisY = 50;

    let xCulm = random(0, 100);

    this.unitCore[this.lineIndex].forEach((unit) => {
      const thisX = width / 2 + xCulm - lineWidths[this.lineIndex] / 2;

      switch (unit.mode) {
        case 0:
          this.addLetters(unit.content, thisX, thisY);
          xCulm += textWidth(unit.content + " ");
          break;
        case 1:
          this.addDebris(unit.content.index, thisX, thisY);
          xCulm += debrisGroup.at(-1).w + textWidth(" ");
          break;
      }
    });
  }

  addLetters(word, baseX, baseY) {
    for (let n = 0; n < word.length; n++) {
      const thisLetter = word.charAt(n);
      const thisX =
        baseX +
        (n > 0
          ? textWidth(word.substring(0, n + 1)) - textWidth(thisLetter)
          : 0);

      this.dropLetters.push(
        new DropLetter2(this.graphic, thisLetter, thisX, baseY)
      );
      if (n > 0 && constrainMode !== 0) {
        this.configureConstraint(this.letterCounter);
      }
      this.letterCounter++;
    }
  }

  configureConstraint(index) {
    const current = this.dropLetters[index];
    const previous = this.dropLetters[index - 1];

    if (current.thisLetter !== " " && previous.thisLetter !== " ") {
      const points = [
        { x: 0, y: -(pgTextSize * 0.8 * pgTextFactor) / 2 },
        { x: 0, y: 0 },
        { x: 0, y: (pgTextSize * 0.8 * pgTextFactor) / 2 },
      ];

      points.forEach((point) => {
        const options = {
          bodyA: current.bodyLetter,
          bodyB: previous.bodyLetter,
          pointA: point,
          pointB: point,
          stiffness: 0.1,
          damping: 0.05,
        };
        const constraint = Constraint.create(options);
        this.dropConstraints.push(constraint);
        World.add(world, constraint);
      });
    }
  }

  refresh() {
    this.dropLetters.forEach((letter) => letter.refresh());
    this.setOriginalOrder();
  }

  resetPos() {
    this.dropLetters.forEach((letter) => letter.resetPos());
  }

  removeIt() {
    while (this.dropLetters.length) {
      this.dropLetters.pop().removeIt();
    }
  }

  removeConstraint() {
    while (this.dropConstraints.length) {
      Composite.remove(world, this.dropConstraints.pop());
    }
  }
}

class DropLetter2 {
  constructor(graphic, thisLetter, thisX, thisY, thisW) {
    this.graphic = graphic;

    this.thisLetter = thisLetter;

    this.orgX = thisX;
    this.orgY = thisY;

    this.coreOrg;

    this.minPoint;
    this.maxPoint;
    this.diff;

    this.points;
    this.bodyLetter;

    if (this.thisLetter != " ") {
      this.textPointMaker();
      this.physicsPointMaker();
    }
  }

  textPointMaker() {
    this.points = tFont.textToPoints(
      this.thisLetter,
      this.orgX,
      this.orgY,
      pgTextSize * 0.8,
      {
        sampleFactor: 0.1,
        simplifyThreshold: 0,
      }
    );
  }

  physicsPointMaker() {
    var newX = this.orgX + textWidth(this.thisLetter) / 2;
    var newY = this.orgY - (pgTextSize * 0.8 * pgTextFactor) / 2;

    this.bodyLetter = Bodies.fromVertices(newX, newY, this.points);
    Composite.add(world, this.bodyLetter);

    this.minPoint = createVector(
      this.bodyLetter.bounds.min.x,
      this.bodyLetter.bounds.min.y
    );
    this.maxPoint = createVector(
      this.bodyLetter.bounds.max.x,
      this.bodyLetter.bounds.max.y
    );

    var pos = this.bodyLetter.position;
    this.diff = createVector(
      -(pos.x - this.minPoint.x),
      -(pos.y - this.maxPoint.y)
    );

    Matter.Body.setPosition(this.bodyLetter, {
      x: pos.x,
      y: this.orgY - this.diff.y,
    });

    this.coreOrg = createVector(pos.x, this.orgY - this.diff.y);
  }

  run() {
    this.update();
    this.display();
  }

  update() {}

  display() {
    var pos = this.bodyLetter.position;
    var ang = this.bodyLetter.angle;

    noStroke();

    push();
    translate(pos.x, pos.y);
    rotate(ang);
    translate(0, this.diff.y);

    fill(fillColor);
    textAlign(CENTER);
    text(this.thisLetter, 0, 0);
    pop();
  }

  resetPos() {
    if (this.thisLetter != " ") {
      Matter.Body.setPosition(this.bodyLetter, {
        x: this.coreOrg.x,
        y: this.coreOrg.y,
      });
      Matter.Body.setAngle(this.bodyLetter, 0);
      Matter.Body.setAngularSpeed(this.bodyLetter, 0);
      Matter.Body.setAngularVelocity(this.bodyLetter, 0);
      Matter.Body.setSpeed(this.bodyLetter, 0);
    }
  }

  removeIt() {
    if (this.thisLetter != " ") {
      Composite.remove(world, this.bodyLetter);
    }
  }
}
