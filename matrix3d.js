
var image = document.getElementById('full-image');
var canvas = document.getElementById('canvas')

var handleRadius = 10

var dragTL = dragBL = dragTR = dragBR = false;
var dragWholeRect = false;

var mouseX, mouseY
var startX, startY

var effective_image_width = 1600;
var effective_image_height = 900;

var ROICount = 0;
var activeROI = {width:32,height:32,rotation:0};
var activeTransfom = [];
var img_from = [{x:0,y:0},{x:0,y:31},{x:31,y:0},{x:31,y:31}];


function getTransform(from, to) {
  console.log(from, to);
  var A, H, b, h, i, k_i, lhs, rhs, _i, _j, _k, _ref;
  console.assert((from.length === (_ref = to.length) && _ref === 4));
  A = [];
  for (i = _i = 0; _i < 4; i = ++_i) {
    A.push([from[i].x, from[i].y, 1, 0, 0, 0, -from[i].x * to[i].x, -from[i].y * to[i].x]);
    A.push([0, 0, 0, from[i].x, from[i].y, 1, -from[i].x * to[i].y, -from[i].y * to[i].y]);
  }
  b = [];
  for (i = _j = 0; _j < 4; i = ++_j) {
    b.push(to[i].x);
    b.push(to[i].y);
  }
  h = numeric.solve(A, b);
  H = [[h[0], h[1], 0, h[2]], [h[3], h[4], 0, h[5]], [0, 0, 1, 0], [h[6], h[7], 0, 1]];
  for (i = _k = 0; _k < 4; i = ++_k) {
    lhs = numeric.dot(H, [from[i].x, from[i].y, 0, 1]);
    k_i = lhs[3];
    rhs = numeric.dot(k_i, [to[i].x, to[i].y, 0, 1]);
    console.assert(numeric.norm2(numeric.sub(lhs, rhs)) < 1e-9, "Not equal:", lhs, rhs);
  }
  // return H;
  var _i, _results;
  _results = [];
  for (i = _i = 0; _i < 4; i = ++_i) {
    _results.push((function() {
      var _j, _results1;
      _results1 = [];
      for (j = _j = 0; _j < 4; j = ++_j) {
        _results1.push(H[j][i].toFixed(20));
      }
      return _results1;
    })());
  }
  activeTransfom = _results;
  // console.log(_results);
  // getTransformedPosition({x:0,y:0});
  // getTransformedPosition({x:0,y:31});
  // getTransformedPosition({x:31,y:0});
  // getTransformedPosition({x:31,y:31});
};

function getRoundedTransform(){
  var result = ""
  for(i=0;i<4;i++)
  {
  for(j=0;j<4;j++) {
    result += (Math.round(activeTransfom[j][i] * 10000)/10000) + ", ";
    }
    result += "<br>";
  }
  return result;
}

function cleanActiveTransform(){
  for(i=2;i<4;i++)
  {
  for(j=0;j<4;j++) {
    activeTransfom[j][i] = Math.round(activeTransfom[j][i]);
    }
  }
}

function getTransformedPosition(untransformed){
  var Q = [];
  var P = [untransformed.x,untransformed.y,1,1];
  for(i=0;i<4;i++)
    {
    var temp = 0; 
    for(j=0;j<4;j++) {
      temp += P[j]*activeTransfom[j][i]; }
      Q[i] = temp; 
    }
  var transformed = {}
  transformed.x = Math.round(Q[0]);
  transformed.y = Math.round(Q[1]);
  // console.log(transformed);
  return transformed;
}

function addROI(){
  getTransform(img_from,[activeROI.tl,activeROI.bl,activeROI.tr,activeROI.br]);
  cleanActiveTransform();
  const matrix =  getRoundedTransform();
  console.log("add ROI with 3D transform");
  const roi = document.createElement("div");
  roi.className = "box roi";
  roi.id = "roi" + (ROICount + 1);
  roi.id = "roi" + (ROICount + 1);
  ROICount += 1;
  const t = document.createElement("p");
  const roi_size = " "+activeROI.width+"x"+activeROI.height+" ";
  t.innerHTML = roi.id + roi_size + "<hr>" + matrix;
  roi.appendChild(t);
  const i = document.createElement("canvas");
  i.id = roi.id + "_cv"
  i.width = activeROI.width*2;
  i.height = activeROI.height*2;
  var ctx = i.getContext("2d");
  ctx.scale(2, 2);
  var source_img = document.getElementById("full-image");
  for(_x=0;_x<activeROI.width;_x++)
    {
    var temp = 0; 
    for(_y=0;_y<activeROI.height;_y++) {
      var pixel = getTransformedPosition({x:_x,y:_y});
      ctx.drawImage(source_img,pixel.x,pixel.y, 1, 1, _x, _y, 1, 1);
    }
  }
  roi.appendChild(i);
  document.getElementById("app").appendChild(roi);
}

function drawCircle(x, y, radius) {
  var ctx = canvas.getContext("2d");
  ctx.fillStyle = "#757515";
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fill();
}

function drawHandles() {
  drawCircle(activeROI.tl.x, activeROI.tl.y, handleRadius);
  drawCircle(activeROI.bl.x, activeROI.bl.y, handleRadius);
  drawCircle(activeROI.br.x, activeROI.br.y, handleRadius);
  drawCircle(activeROI.tr.x, activeROI.tr.y, handleRadius);
}


function drawOverlayInCanvas()
{
  var ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.lineWidth = "6";
  ctx.fillStyle = "rgba(221, 221, 21, 0.2)";
  ctx.strokeStyle = "#757515";

  ctx.moveTo(activeROI.tl.x, activeROI.tl.y);
  ctx.lineTo(activeROI.bl.x, activeROI.bl.y);
  ctx.lineTo(activeROI.br.x, activeROI.br.y);
  ctx.lineTo(activeROI.tr.x, activeROI.tr.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(221, 21, 221, 0.8)";
  ctx.font = "50px Arial";
  ctx.fillText(activeROI.tl.x+","+activeROI.tl.y, activeROI.tl.x - 200, activeROI.tl.y - 30,140);
  ctx.fillText(activeROI.bl.x+","+activeROI.bl.y, activeROI.bl.x - 200, activeROI.bl.y + 30,140);
  ctx.fillText(activeROI.br.x+","+activeROI.br.y, activeROI.br.x + 50, activeROI.br.y + 30,140);
  ctx.fillText(activeROI.tr.x+","+activeROI.tr.y, activeROI.tr.x + 50, activeROI.tr.y - 30,140);
  drawHandles();

  var offset_y = activeROI.br.y > activeROI.bl.y ? activeROI.br.y + 20 :  activeROI.bl.y +20;
  if (offset_y>700){
    offset_y = activeROI.tr.y < activeROI.tl.y ? activeROI.tr.y - 60 :  activeROI.tl.y - 60;
  }
  getTransform(img_from,[activeROI.tl,activeROI.bl,activeROI.tr,activeROI.br]);
  var source_img = document.getElementById("full-image");
  for(_x=0;_x<activeROI.width;_x++)
    {
    var temp = 0; 
    for(_y=0;_y<activeROI.height;_y++) {
      var pixel = getTransformedPosition({x:_x,y:_y});
      ctx.drawImage(source_img,pixel.x,pixel.y, 1, 1, _x + activeROI.bl.x, offset_y + _y + 10, 1, 1);
    }
  }

}

function mouseUp(e) {
  dragTL = dragTR = dragBL = dragBR = false;
  dragWholeRect = false;
}

function checkCloseEnough(p1, p2) {
  return Math.abs(p1 - p2) < handleRadius;
}

function getMousePos(canvas, evt) {
  var clx, cly
  if (evt.type == "touchstart" || evt.type == "touchmove") {
    clx = evt.touches[0].clientX;
    cly = evt.touches[0].clientY;
  } else {
    clx = evt.clientX;
    cly = evt.clientY;
  }
  var boundingRect = canvas.getBoundingClientRect();
  return {
    x: clx - boundingRect.left,
    y: cly - boundingRect.top
  };
}

function mouseDown(e) {
  var pos = getMousePos(this,e);
  mouseX = pos.x;
  mouseY = pos.y;
  // 0. inside movable rectangle
  // if (checkInRect(mouseX, mouseY, rect)){
  //     dragWholeRect=true;
  //     startX = mouseX;
  //     startY = mouseY;
  // }
  // 1. top left
  if (checkCloseEnough(mouseX, activeROI.tl.x) && checkCloseEnough(mouseY, activeROI.tl.y)) {
      dragTL = true;
  }
  // 2. top right
  else if (checkCloseEnough(mouseX, activeROI.tr.x) && checkCloseEnough(mouseY, activeROI.tr.y)) {
      dragTR = true;
  }
  // 3. bottom left
  else if (checkCloseEnough(mouseX, activeROI.bl.x) && checkCloseEnough(mouseY, activeROI.bl.y)) {
      dragBL = true;
  }
  // 4. bottom right
  else if (checkCloseEnough(mouseX, activeROI.br.x) && checkCloseEnough(mouseY, activeROI.br.y)) {
      dragBR = true;
  }
  // (5.) none of them
  else {
    const dx = activeROI.tl.x - mouseX;
    const dy = activeROI.tl.y - mouseY;
    activeROI.tl.x -= dx;
    activeROI.tl.y -= dy;
    activeROI.bl.x -= dx;
    activeROI.bl.y -= dy;
    activeROI.br.x -= dx;
    activeROI.br.y -= dy;
    activeROI.tr.x -= dx;
    activeROI.tr.y -= dy;
  }
  drawOverlayInCanvas();
}


function mouseMove(e) {
  var pos = getMousePos(this,e);
  mouseX = pos.x;
  mouseY = pos.y;
  if (dragWholeRect) {
      e.preventDefault();
      e.stopPropagation();
      dx = mouseX - startX;
      dy = mouseY - startY;
      if ((rect.left+dx)>0 && (rect.left+dx+rect.width)<canvas.width){
        rect.left += dx;
      }
      if ((rect.top+dy)>0 && (rect.top+dy+rect.height)<canvas.height){
        rect.top += dy;
      }
      startX = mouseX;
      startY = mouseY;
  } else if (dragTL) {
      e.preventDefault();
      e.stopPropagation();
      activeROI.tl.x = mouseX;
      activeROI.tl.y = mouseY;
  } else if (dragTR) {
      e.preventDefault();
      e.stopPropagation();
      activeROI.tr.x = mouseX;
      activeROI.tr.y = mouseY;
  } else if (dragBL) {
      e.preventDefault();
      e.stopPropagation();
      activeROI.bl.x = mouseX;
      activeROI.bl.y = mouseY;
  } else if (dragBR) {
      e.preventDefault();
      e.stopPropagation();
      activeROI.br.x = mouseX;
      activeROI.br.y = mouseY;
  }
  drawOverlayInCanvas();
}

function initCanvas(){
  canvas.height = image.height;
  canvas.width = image.width;
  canvas.style.top = image.offsetTop + "px";;
  canvas.style.left = image.offsetLeft + "px";
  // updateCurrentCanvasRect();
}

function initRect(){
  activeROI.tl = {x:0,y:0};
  activeROI.bl = {x:0,y:activeROI.height-1};
  activeROI.br = {x:activeROI.width-1,y:activeROI.height-1};
  activeROI.tr = {x:activeROI.width-1,y:0};
}

function getKeypress(e) {
  // console.l og(e.code);
  if(e.code == "KeyR"){
    console.log(activeTransfom);
    activeROI.rotation += 0.1;
    if(e.shiftKey){
      activeROI.rotation -= 0.2;
    }
    activeTransfom[0][0] = (Math.cos(activeROI.rotation)).toString();
    activeTransfom[0][1] = (Math.sin(activeROI.rotation)).toString();
    activeTransfom[1][0] = (-1 * Math.sin(activeROI.rotation)).toString();
    activeTransfom[1][1] = (Math.cos(activeROI.rotation)).toString();
    activeROI.tl =  getTransformedPosition({x:0,y:0});
    activeROI.bl =  getTransformedPosition({x:0,y:activeROI.height-1});
    activeROI.br =  getTransformedPosition({x:activeROI.width-1,y:activeROI.height-1});
    activeROI.tr =  getTransformedPosition({x:activeROI.width-1,y:0});
    drawOverlayInCanvas();
    console.log(activeTransfom);
  }
}

function resetTransformInPosition(){
  // console.log(activeTransfom);
  activeTransfom[0][0] = "1";
  activeTransfom[0][1] = "0";
  activeTransfom[1][0] = "0";
  activeTransfom[1][1] = "1";
  const x = Number(activeTransfom[3][0]);
  const y = Number(activeTransfom[3][1]);
  activeROI.tl.x = x;
  activeROI.tl.y = y;
  activeROI.bl.x = x;
  activeROI.bl.y = y + activeROI.height;
  activeROI.br.x = x + activeROI.width;
  activeROI.br.y = y + activeROI.height;
  activeROI.tr.x = x + activeROI.width;
  activeROI.tr.y = y;
  // console.log(activeTransfom);
  drawOverlayInCanvas();
}

function changeROIw(sender){
  activeROI.width = Number(document.getElementById("roi_w").value);
  updateAddROI_btn();
}

function changeROIh(sender){
  activeROI.height = Number(document.getElementById("roi_h").value);
  updateAddROI_btn();
}

function updateAddROI_btn(){
  img_from = [{x:0,y:0},{x:0,y:activeROI.height-1},{x:activeROI.width-1,y:0},{x:activeROI.width-1,y:activeROI.height-1}];
  document.getElementById("addROI_btn").innerHTML = "Add ROI " + activeROI.width + "x" + activeROI.height;
  resetTransformInPosition();
}

function init(){
  canvas.addEventListener('mousedown', mouseDown, false);
  canvas.addEventListener('mouseup', mouseUp, false);
  canvas.addEventListener('mousemove', mouseMove, false);
  canvas.addEventListener('touchstart', mouseDown);
  canvas.addEventListener('touchmove', mouseMove);
  canvas.addEventListener('touchend', mouseUp);
  window.addEventListener("keydown", getKeypress);
  initCanvas();
  initRect();
  drawOverlayInCanvas();
  document.getElementById('image-size').innerHTML = "Image: "+image.width+"x"+image.height;
}

window.addEventListener('load',init)
