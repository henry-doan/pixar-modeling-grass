/**************************************
 * Create a blade of grass
 *   Drag the control points (circle) to change its orientation
 *   Use the slider to change the resolution of the model
 *   Drag the skeleton view to change the outline of the grass
***************************************/
// Size of control points
var CONTROL_POINT_SIZE = 15;
// Maximum width of grass
var MAX_WIDTH = 40;
var MAX_RESOLUTION = 20;
var GRASS_BASE = height * 0.95;
var GRASS_TIP = 120;

// Colours
var BACKGROUND = color(250, 250, 250);
var BACKGROUND = color(240, 250, 255);
var GREY = color(100, 100, 100);
var BLUE = color(64, 95, 237);
var PINK = color(255, 0, 175);
var GREEN = color(28, 173, 123);
var ORANGE = color(255, 165, 0);
var GRIDGREY = color(230, 240, 230);
var TEXTCOL = color(20, 20, 20);
var TOOLBAR = color(230, 230, 230, 200);
var MESSAGEBLUE = color(20, 60, 160);
var TOOLBARCOL = color(225, 225, 225, 180);

var SKIN_COL = color(40, 180, 10);
var SKELETON_COL = color(120, 210, 40);
var BACKBONE_COL = color(0, 140, 0);

var sansFont = createFont("sans", 15);

// What to draw
var selectedPoint = false;
var showing = {
    Construction: true,
    Skeleton: false,
    Fill: false
};

var tooltips = {
    "Num of strings": true,
    model: true,
    Width: true,
    Fill: true,
    Color: true,
    Skeleton: true,
};

var myCurve, widthControl;
var sliders = [];
var buttons = [];

var toolbarX = width * 0.01;
var toolbarY = width * 0.01;
var toolbarWidth = 128;
var toolbarHeight = 110;

// Given the end points of two lines (x1, y1) to (x2, y2) and (x3, y3) to (x4, y4),
// return the point where they intersect
// Assume lines do intersect (i.e. are not parallel and are not segments)
var findIntersection = function(x1, y1, x2, y2, x3, y3, x4, y4) {
    var dx1 = (x1 - x2);
    var dx2 = (x3 - x4);
    var dy1 = (y1 - y2);
    var dy2 = (y3 - y4);
    var d = dx1 * dy2 - dy1 * dx2;
    return [(dx2 * (x1 * y2 - y1 * x2) - dx1 * (x3 * y4 - y3 * x4)) / d,
            (dy2 * (x1 * y2 - y1 * x2) - dy1 * (x3 * y4 - y3 * x4)) / d];
};

/**************************************
 *  Generic GUI component from which
 * other elements inherit
 * 
 * The default object is basically a
 * button
***************************************/
{
var GUI_Component = function(x, y, w, h, name, updateFunction) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    
    this.name = name;
    this.updateFunction = updateFunction;
    
    this.showing = true;
    this.selected = false;
    this.disabled = false;
};

GUI_Component.prototype.draw = function() {
    if (!this.showing) { return; }
    
    if (this.mouseOver()) {
        fill(100);
    } else {
        fill(200);
    }
    
    noStroke();
    rect(this.x, this.y, this.w, this.h, 12);
    
    fill(TEXTCOL);
    textFont(sansFont, 15);
    textAlign(CENTER, CENTER);
    text(this.name, this.x + this.w / 2, this.y + this.h/2 + 1);
};

GUI_Component.prototype.mouseOver = function() {
    return (mouseX >= this.x && mouseX <= this.x + this.w &&
            mouseY >= this.y && mouseY <= this.y + this.h);
};

GUI_Component.prototype.mousePressed = function() {
    this.selected = this.mouseOver();
};

GUI_Component.prototype.mouseDragged = function() {};

GUI_Component.prototype.mouseReleased = function() {
    if (this.selected && this.showing && !this.deactivated && this.mouseOver()) {
        this.trigger();
    }
    this.selected = false;
};

GUI_Component.prototype.trigger = function() {
    if (this.updateFunction) {
        this.updateFunction();
    }
};
}
/**************************************
 *  GUI Button
***************************************/
{
var Button = function(x, y, w, h, name, updateFunction) {
    GUI_Component.call(this, x, y, w, h, name, updateFunction);

    this.defaultCol = TOOLBAR;
    this.highlightCol = color(210, 210, 210, 250);
    this.transition = 0;
};
Button.prototype = Object.create(GUI_Component.prototype);

Button.prototype.draw = function() {
    if (!this.showing) { return; }
    
    this.fade();
    
    if (this.deactivated) {
        fill(180);
        noStroke();
    } else {
        fill(lerpColor(this.defaultCol, this.highlightCol, this.transition / 10));
        strokeWeight(1);
        stroke(200);
    }
    
    rect(this.x, this.y - 1, this.w, this.h + 3, 12);
    
    if (this.deactivated) {
        fill(120);
    } else {
        fill(TEXTCOL);
    }
    
    textFont(sansFont, 15);
    textAlign(CENTER, CENTER);
    text(this.name, this.x + this.w / 2, this.y + this.h/2 + 1);
};

Button.prototype.fade = function() {
    if (this.mouseOver() || this.selected) {
        this.transition = min(10, this.transition + 1);
    } else {
        this.transition = max(0, this.transition - 1);
    }
};

var CheckBox = function(x, y, w, h, name) {
    Button.call(this, x, y, w, h, name);
    this.box = this.h - 6;
    this.bx = this.x + 5;
    this.by = this.y + 3;
};
CheckBox.prototype = Object.create(Button.prototype);

CheckBox.prototype.trigger = function() {
    showing[this.name] = !showing[this.name];  
};

CheckBox.prototype.draw = function() {
    if (!this.showing) { return; }
    
    this.fade();
    
    if (this.transition) {
        noStroke();
        fill(lerpColor(this.defaultCol, this.highlightCol, this.transition / 10));
        rect(this.x, this.y, this.w, this.h + 1, 4);
    }
    
    fill(TEXTCOL);
    textFont(sansFont, 15);
    textAlign(LEFT, CENTER);
    text(this.name, this.x + this.box + 9, this.y + this.h/2 + 1);
    
    noFill();
    stroke(10);
    strokeWeight(1);
    rect(this.bx, this.y + 3, this.box, this.box);
    
    if (showing[this.name]) {
        line(this.bx + 1, this.by + 1, this.bx + this.box, this.by + this.box);
        line(this.bx + this.box, this.by + 1, this.bx + 1, this.by + this.box);
    }
};
}
/**************************************
 * GUI Slider to vary parameters
***************************************/
{
var Slider = function(x, y, w, minValue, maxValue, nowValue, name, updateFunction) {
    GUI_Component.call(this, x, y, w, 12, name, updateFunction);
    
    this.x2 = x + w;
    this.ballR = 8;
    this.ballD = this.ballR * 2;
    
    this.min = minValue;
    this.max = maxValue;
    this.val = nowValue || minValue;
    this.setValue(this.val);
    
    this.held = false;
};
Slider.prototype = Object.create(GUI_Component.prototype);

Slider.prototype.draw = function() {
    if (!this.showing) { return; }
    
    if (this.name) {
        fill(TEXTCOL);
        textSize(15);
        textAlign(CENTER, BASELINE);
        text(this.name + ": " + this.val,  this.x + this.w / 2, this.y - 13);
    }
    
    noStroke();
    fill(180);
    rect(this.x - 8, this.y - this.h/2, this.w + 16, this.h, 8);

    strokeWeight(1);
    stroke(0, 0, 0, 120);
    fill(180, 180, 250);
    ellipse(this.bx, this.y, this.ballD, this.ballD);
    noStroke();
    fill(255, 255, 255, 150);
    ellipse(this.bx - this.ballR * 0.3, this.y - this.ballR * 0.3, 5, 5);

};

Slider.prototype.mouseOver = function() {
    return dist(mouseX, mouseY, this.bx, this.y) < this.ballR;
};

Slider.prototype.mouseDragged = function() {
    if (this.selected) {
        this.bx = constrain(mouseX, this.x, this.x2);
        this.val = round(map(this.bx, this.x, this.x2, this.min, this.max));
        this.trigger();
        return true;
    }
};

Slider.prototype.trigger = function() {
    if (this.updateFunction) {
        this.updateFunction(this.val);
    }
};

Slider.prototype.setValue = function(v) {
    this.val = constrain(v, this.min, this.max);
    this.bx = map(this.val, this.min, this.max, this.x, this.x2);
};
}
/**************************************
 * DraggablePoint
 * A freely draggable point with a position and colour.
***************************************/
{
var DraggablePoint = function(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color || ORANGE;
    this.animation = 0;
};

DraggablePoint.prototype.draw = function() {
    if (this.dragging || this.mouseOver()) {
        if (this.animation < 5) {
            this.animation++;
        }
    } else {
        this.animation = 0;
    }

    strokeWeight(1);
    stroke(BACKGROUND);
    if (this.selected) {
        fill(PINK);
    } else {
        fill(this.color);
    }
    
    var r = CONTROL_POINT_SIZE + this.animation;
    ellipse(this.x, this.y, r, r);
};

DraggablePoint.prototype.mouseOver = function() {
    return dist(mouseX, mouseY, this.x, this.y) <= CONTROL_POINT_SIZE / 2;
};

DraggablePoint.prototype.move = function(dx, dy) {
    this.x += dx;
    this.y += dy;
};
}
/**************************************
 * A curve fixed at point (x1, y2) and curving
 * towards (x2, y2)
 * The degree of curve depends on the length to
 * the third control point
***************************************/
{
var Curve = function(x1, y1, x2, y2, length) {
    this.length = length;
    this.p1 = new DraggablePoint(x1, y1);
    this.p2 = new DraggablePoint(x2, y2);
    this.p3 = new DraggablePoint(0, 0);
    this.controlPoints = [this.p2, this.p3];
    
    this.directAngle = 0;   // Angle between ends p1 and p2
    this.apexAngle = 0;     // Angle between base, p1, and apex, p3
    
    this.color = 80;
    
    this.splinePoints = [];
    this.outlinePoints = [];
    
    this.findApexPoint();
    this.update();
};

// Find the angle from p1 to p3 relative to the line between p1 and p2
Curve.prototype.findApexPoint = function() {
    this.directAngle = atan2(this.p2.y - this.p1.y, this.p2.x - this.p1.x);
    var midLength = dist(this.p1.x, this.p1.y, this.p2.x, this.p2.y) * 0.5;
    var midX = (this.p1.x + this.p2.x) * 0.5;
    var midY = (this.p1.y + this.p2.y) * 0.5;
    
    // Points stretched in a line
    if (midLength > this.length) { this.length = midLength; }
    
    var d = sqrt(this.length * this.length - midLength * midLength);
    var angle = this.apexAngle < 0 ? this.directAngle - 90 : this.directAngle + 90;
    
    this.p3.x = midX + d * cos(angle);
    this.p3.y = midY + d * sin(angle);
    this.apexAngle = atan2(this.p3.y - this.p1.y, this.p3.x - this.p1.x) - this.directAngle;
};

// Fill splinePoints array with points along the curve
Curve.prototype.createSpline = function() {
    var n = sliders[0].val;
    var x1 = this.p1.x;
    var y1 = this.p1.y;
    var x2 = this.p3.x;
    var y2 = this.p3.y;
    var d = 1 / (n + 1);
    
    this.splinePoints = [];
    
    for (var i = 0; i <= n; i++) {
        var r = i * d;
        var x3 = lerp(this.p1.x, this.p3.x, r);
        var y3 = lerp(this.p1.y, this.p3.y, r);
        var x4 = lerp(this.p3.x, this.p2.x, r + d);
        var y4 = lerp(this.p3.y, this.p2.y, r + d);
        var coord = findIntersection(x1, y1, x2, y2, x3, y3, x4, y4);
        this.splinePoints.push([coord[0], coord[1]]);
        x1 = x3;
        y1 = y3;
        x2 = x4;
        y2 = y4;
    }
    
    this.splinePoints.push([this.p2.x, this.p2.y]);
};

// Set heights to a sine wave
Curve.prototype.findWidths = function() {
    var n = sliders[0].val;
    
    var width = sliders[1].showing ? sliders[1].val : 20;
    
    this.widths = [];
    
    for (var i = 0; i <= n; i++) {
        var proportion = i / (n + 1);
        var vertebrae = width * sin(proportion * 180);
        if (i * 2 < n) {
            vertebrae = (width + vertebrae) * 0.5;
        }
        this.widths.push(vertebrae);
    }
    
    this.findOutline();
};

Curve.prototype.findOutline = function() {
    this.outlinePoints = [];
    
    var p1 = this.splinePoints[0];
    for (var i = 0; i < this.splinePoints.length - 1; i++) {
        var p2 = this.splinePoints[i + 1];
        var angle = atan2(p1[1] - p2[1], p1[0] - p2[0]) + 90;
        var vertebrae = this.widths[i];
        var dx = vertebrae * cos(angle);
        var dy = vertebrae * sin(angle);
        this.outlinePoints.push([p1[0] + dx, p1[1] + dy]);
        this.outlinePoints.push([p1[0] - dx, p1[1] - dy]);
        p1 = p2;
        //println(angle + " " + dx + " " + dy);
    }
};

// Move tip
Curve.prototype.updatePoint = function() {
    this.p2.x += mouseX - pmouseX;
    this.p2.y += mouseY - pmouseY;
    
    this.directAngle = atan2(this.p2.y - this.p1.y, this.p2.x - this.p1.x);
    var midLength = dist(this.p1.x, this.p1.y, this.p2.x, this.p2.y) * 0.5;
    
    // Points stretched in a line
    if (midLength >= this.length) {
        this.p2.x = this.p1.x + (2 * this.length - 1) * cos(this.directAngle);
        this.p2.y = this.p1.y + (2 * this.length - 1) * sin(this.directAngle);
    }
    
    this.findApexPoint();
    this.update();
};

// Find angle between the end points and the apex point
Curve.prototype.update = function() {
    // Set position p3
    this.p3.x = this.p1.x + this.length * cos(this.apexAngle + this.directAngle);
    this.p3.y = this.p1.y + this.length * sin(this.apexAngle + this.directAngle);

    this.createSpline();
    this.findWidths();
};

// Main Curve draw function
Curve.prototype.draw = function() {
    if (showing.Fill) { this.drawOutline(); }
    if (showing.Skeleton) { this.drawSkeleton(); }
    
    this.drawParabola();
    
    if (showing.Construction) { this.drawConstruction(); }

    for (var i = 0; i < this.controlPoints.length; i++) {
        this.controlPoints[i].draw();
    }
};

Curve.prototype.drawConstruction = function() {
    strokeWeight(1);
    stroke(GREY);
    
    var n = sliders[0].val;
    var d = 1 / (n + 1);
    
    for (var i = 0; i <= n; i++) {
        var r = i * d;
        var x1 = lerp(this.p1.x, this.p3.x, r);
        var y1 = lerp(this.p1.y, this.p3.y, r);
        var x2 = lerp(this.p3.x, this.p2.x, r + d);
        var y2 = lerp(this.p3.y, this.p2.y, r + d);
        line(x1, y1, x2, y2);
    }

    strokeWeight(2);
    stroke(BLUE);
    line(this.p1.x, this.p1.y, this.p3.x, this.p3.y);
    line(this.p2.x, this.p2.y, this.p3.x, this.p3.y);
};

Curve.prototype.drawParabola = function() {
    strokeWeight(5);
    stroke(BACKBONE_COL);
    noFill();
    
    beginShape();
    for (var i = 0; i < this.splinePoints.length; i++) {
        vertex(this.splinePoints[i][0], this.splinePoints[i][1]);
    }
    endShape();
};

Curve.prototype.drawSkeleton = function() {
    strokeWeight(1);
    stroke(SKELETON_COL);
    for (var i = 0; i < this.outlinePoints.length; i += 2) {
        var p1 = this.outlinePoints[i];
        var p2 = this.outlinePoints[i + 1];
        line(p1[0], p1[1], p2[0], p2[1]);
    }
};

Curve.prototype.getColor = function() {
    if (sliders[2].showing) {
        this.color = sliders[2].val;
    }
    return color(this.color * 0.5, 80 + this.color, this.color / 8);
};

Curve.prototype.drawOutline = function() {
    noStroke();
    fill(this.getColor());
    beginShape();
        for (var i = 0; i < this.outlinePoints.length; i += 2) {
            var p = this.outlinePoints[i];
            vertex(p[0], p[1]);
        }
        vertex(this.p2.x, this.p2.y);
        for (var i = 1; i < this.outlinePoints.length; i += 2) {
            var p = this.outlinePoints[this.outlinePoints.length - i];
            vertex(p[0], p[1]);
        }
    endShape();
};

Curve.prototype.selectPoint = function() {
    for (var i = 0; i < this.controlPoints.length; i++) {
        if (this.controlPoints[i].mouseOver()) {
            selectedPoint = i;
        }
    }
};

Curve.prototype.mouseDrag = function() {
    if (selectedPoint !== false) {
        if (selectedPoint === 0) {
            this.updatePoint();
        } else {
            this.apexAngle = atan2(mouseY - this.p1.y, mouseX - this.p1.x) - this.directAngle;
            var d = 2 * this.length * cos(this.apexAngle);
            this.p2.x = this.p1.x + d * cos(this.directAngle);
            this.p2.y = this.p1.y + d * sin(this.directAngle);
            this.update();
        }
    }
};
}
/**************************************
 * Creation of objects
***************************************/

// Clicking the Model button reveals the modelling options
var startModelling = function() {
    sliders[1].showing = true;
    sliders[2].showing = true;
    buttons[1].showing = true;
    buttons[2].showing = true;
    buttons[3].showing = false;
    showing.Construction = false;
    showing.Skeleton = true;
    
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].y += 85;
        buttons[i].by = buttons[i].y + 3;
    }
    
    toolbarHeight = 214;
    tooltips.model = false;
};

var createButtons = function() {
    var buttons = [];
    
    var x = toolbarX + 10;
    var y = toolbarY + 48;
    var w = 110;
    var h = 22;
    
    for (var opt in showing) {
        buttons.push(new CheckBox(x, y, w, h, opt));
        y += 27;
    }
    buttons[1].showing = false;
    buttons[2].showing = false;
    
    buttons.push(new Button(x, buttons[1].y, w, h, "Model", startModelling));
    
    return buttons;
};

var createSliders = function() {
    var sliders = [];
    var x = toolbarX + 20;
    var y = toolbarY + 32;
    var w = 88;
    
    var maxes = [MAX_RESOLUTION, MAX_WIDTH, 100];
    var starting = [1, 20, 80];
    var names = ["Num of strings", "Width", ""];
    var funcs = [
        function (n) {
            if (n > 1) { tooltips["Num of strings"] = false; }
        },
        function (n) {
            if (n > 20) { tooltips.Width = false; }
        },
        function (n) {
            tooltips.Color = false;
        }
    ];
    
    for (var i = 0; i < maxes.length; i++) {
        sliders.push(new Slider(x, y, w, 0, maxes[i], starting[i], names[i], funcs[i]));
        if (i > 0) {
            sliders[i].showing = false;
        }
        y += 40;
    }
    
    return sliders;
};

sliders = createSliders();
var buttons = createButtons();
var gui = buttons.concat(sliders);

var midW = width / 2;
myCurve = new Curve(midW, GRASS_BASE, midW + 20, GRASS_TIP, dist(midW, GRASS_BASE, midW + 20, GRASS_TIP) * 0.6);

/**************************************
 * Draw functions
***************************************/

var drawGUI = function() {
    stroke(200, 200, 200);
    strokeWeight(1);
    fill(TOOLBARCOL);
    rect(toolbarX, toolbarY, toolbarWidth, toolbarHeight, 8);
    
    textAlign(CENTER, CENTER);
    textSize(13);
    
    for (var i = 0; i < sliders.length; i++) {
        var s = sliders[i];
        if (i === 2 && s.showing) {
            var t =  "Color:   ";
            fill(myCurve.getColor());
            strokeWeight(1);
            stroke(10);
            rect(s.x + (s.w + textWidth(t)) / 2 - 6, s.y - 26, 14, 14);
        
            fill(10);
            text(t, s.x + s.w / 2, s.y - 14);
        }
        s.draw();
    }
    
    textAlign(LEFT, CENTER);
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].draw();
    }
};

/**************************************
 *  Draw tooltip
***************************************/

var drawArrow = function(x1, y1, x2, y2) {
    var angle = atan2(y2 - y1, x2 - x1);
    var d = dist(x1, y1, x2, y2) * 0.3;
    
    var cx1 = x1;
    var cy1 = y1;
    var cx2 = x2;
    var cy2 = y2;
    var angle2 = angle + 20;
    
    if (angle > 45 && angle < 135) {
        cx1 += d * cos(angle + 40);
        cy1 += d * sin(angle + 40);
        cx2 -= d * cos(angle - 40);
        cy2 -= d * sin(angle - 40);
        angle2 = angle - 40;
    } else {
        cx1 += d * cos(angle - 20);
        cy1 += d * sin(angle - 20);
        cx2 -= d * cos(angle + 20);
        cy2 -= d * sin(angle + 20);
    }
    
    //ellipse(cx1, cy1, 8, 8);ellipse(cx2, cy2, 8, 8);
    
    noFill();
    strokeWeight(3);
    stroke(MESSAGEBLUE);
    bezier(x1, y1, cx1, cy1, cx2, cy2, x2, y2);
    
    noStroke();
    fill(MESSAGEBLUE);
    pushMatrix();
    translate(x2, y2);
    rotate(angle2);
    triangle(8, 0, -5, 4, -5, -4);
    popMatrix();
};

var drawMessage = function(message, x, y, x1, y1) {
    textFont(sansFont, 15);
    textLeading(20);
    
    var nLines = message.split("\n").length;
    var w = textWidth(message) + 20;
    var h = nLines * 22 + 3;
    
    strokeWeight(3);
    stroke(MESSAGEBLUE);
    fill(255);
    rect(x - w / 2, y, w, h, 20);
    
    textAlign(CENTER, CENTER);
    fill(20);
    text(message, x, y + h / 2);
    
    if (x1) {
        //drawArrow(x - w / 2, y + h / 2, x1, y1);
        drawArrow(x, y + h + 1, x1, y1);
    }
};

var drawToolTips = function() {
    var message, y1;
    var x1 = 140;
    
    if (showing.Fill) { tooltips.Fill = false; }
    if (showing.Skeleton) { tooltips.Skeleton = false; }
    
    if (tooltips["Num of strings"]) {
        message = "Add more strings to the construction.";
        y1 = sliders[0].y + 3;
    } else if (tooltips.model) {
        message = "Click model when you are\nhappy with the grass shape.";
        y1 = buttons[buttons.length - 1].y + 13;
    } else if (tooltips.Width) {
        message = "Add width to your blade of grass.";
        y1 = sliders[1].y + 3;
    } else if (tooltips.Fill) {
        message = "Click to show the full blade.";
        y1 = buttons[2].y + buttons[2].h/2;
    } else if (tooltips.Color) {
        message = "Fine tune the fill color.";
        y1 = sliders[2].y + 3;
    } else if (tooltips.Skeleton) {
        message = "Hide the skeleton lines.";
        y1 = buttons[2].y + buttons[2].h / 2;
    } else {
        x1 = false;
        message = "Congratulations! You have modeled a blade of grass.\nYou can continue to change your design\nor move on to the next video.";
    }
    
    drawMessage(message, 265, toolbarY, x1, y1);
};

/**************************************
 *  Main loop
***************************************/

var draw = function() {
    background(BACKGROUND);
    myCurve.draw();
    drawGUI();
    drawToolTips();
};

/**************************************
 * Event handling
***************************************/

mousePressed = function() {
    myCurve.selectPoint();
    
    for (var i = 0; i < gui.length; i++) {
        gui[i].mousePressed();
    }
};

mouseReleased = function() {
    selectedPoint = false;
    for (var i = 0; i < gui.length; i++) {
        gui[i].mouseReleased();
    }
};

mouseDragged = function() {
    myCurve.mouseDrag();
    for (var i = 0; i < sliders.length; i++) {
        if (sliders[i].mouseDragged()) {
            myCurve.createSpline();
            myCurve.findWidths();
        }
    }
};

mouseOut = function() {
    mouseReleased();
};

