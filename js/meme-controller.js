'use strict'

var gCanvas;
var gCtx;
var gIsMouseDown = false;
var gIsMouseOnTxt = false;
var gCurrLineIdx;


function onInit() {
    gCanvas = document.querySelector('#my-canvas');
    gCtx = gCanvas.getContext('2d');
    initMemesServices();
    renderImgs();
    addDragAndDrop();
}
/// Editor Section
// Add new line
function onAddLine() {
    document.querySelector('input[name=txt-input]').value = ''
    addLine();
    drawCanvas();
}

// Remove line
function onRemoveLine() {
    document.querySelector('input[name=txt-input]').value = ''
    removeLine();
    drawCanvas();
}

// Change font size
function onChangeFontSize(num) {
    changeFontSize(num);
    drawCanvas()
}
// Change font familly
function onChangeFontFamily(elSelect) {
    changeFontFamily(elSelect.value);
    drawCanvas();
}
// Change alignment of the text
function onChangeTxtAlign(align) {
    changeTxtAlign(align);
    drawCanvas();
}

function onChangeLinePos(num) {
    changeLinePos('y', num);
    drawCanvas()
}

// Change the stroke/fill colors
function onChangeFocusedLine(idx) {
    changeFocusedLine(idx);
    const line = getFocusedLine();
    document.querySelector('input[name=txt-input]').value = line.txt;
    document.querySelector('input[name=stroke-color-input]').value = line.strokeColor;
    document.querySelector('input[name=fill-color-input]').value = line.fillColor;
}

// Add text to img canvas
function onAddTxt() {
    const txt = document.querySelector('input[name=txt-input]').value
    addTxt(txt);
    drawCanvas();
}

// Change the stroke of font
function onChangeStrokeColor(elColor) {
    changeStrokeColor(elColor.value);
    drawCanvas();
}

// Change the color of the font
function onChangeFillColor(elColor) {
    changeFillColor(elColor.value);
    drawCanvas();
}

// Draw the text on the image canvas
function drawTxt() {
    const lines = getLines();
    lines.forEach(function(line) {
        gCtx.font = `${line.size}px ${line.family}`;
        gCtx.lineWidth = line.lineWidth;
        gCtx.textAlign = line.textAlign;
        gCtx.textBaseline = line.textBaseline;
        gCtx.strokeStyle = line.strokeColor
        gCtx.fillStyle = line.fillColor
        gCtx.fillText(line.txt, line.pos.x, line.pos.y)
        gCtx.strokeText(line.txt, line.pos.x, line.pos.y)
    });
}

// Save meme on pc
function downloadCanvas(elLink) {
    const data = gCanvas.toDataURL()
    elLink.href = data
}

function uploadImg(elForm, ev) {
    ev.preventDefault();
    document.getElementById('imgData').value = gCanvas.toDataURL("image/jpeg");

    function onSuccess(uploadedImgUrl) {
        uploadedImgUrl = encodeURIComponent(uploadedImgUrl)
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${uploadedImgUrl}&t=${uploadedImgUrl}`)
    }

    doUploadImg(elForm, onSuccess);
}

// Share meme to fb
function doUploadImg(elForm, onSuccess) {
    var formData = new FormData(elForm);
    fetch('https://ca-upload.com/here/upload.php', {
            method: 'POST',
            body: formData
        })
        .then(function(res) {
            return res.text()
        })
        .then(onSuccess)
        .catch(function(err) {
            console.error(err)
        })
}

function drawCanvas() {
    const img = getCurrImg();
    var elImg = new Image();
    elImg.src = img.url;
    elImg.onload = () => {
        gCtx.drawImage(elImg, 0, 0, gCanvas.width, gCanvas.height)
        drawTxt();
    }
}

function resizeCanvas() {
    const elContainer = document.querySelector('.canvas-container');
    const canvasSize = (elContainer.offsetWidth > elContainer.offsetHeight) ? (elContainer.offsetHeight) : (elContainer.offsetWidth);
    gCanvas.width = canvasSize;
    gCanvas.height = canvasSize;
}

function onImgClicked(id) {
    showMemeEditor()
    resizeCanvas();
    createMeme(gCanvas.width, id);
    drawCanvas();
}

function showMemeEditor() {
    document.querySelector('input[name=txt-input]').value = ''
    document.querySelector('.img-gallery').classList.add('hide');
    document.querySelector('.meme-editor-container').classList.remove('hide');
    document.querySelector('.general-container').classList.add('screen-size');
    document.querySelector('.general-container').classList.remove('content-size');
}

function renderImgs() {
    const imgs = getImgs();
    var strHTML = imgs.reduce(function(str, img) {
        return str + `<img src="${img.url}" onclick="onImgClicked(${img.id})" alt="">`
    }, '')
    document.querySelector('.img-container').innerHTML = strHTML;

}

function toggleNav() {
    document.querySelector('nav ul').classList.toggle('open-nav');
    const elBtns = document.querySelectorAll('.btn-hamburger img');
    elBtns.forEach(btn => btn.classList.toggle('hide'));
}

function changeContainers(page) {
    const elContainers = document.querySelectorAll('.page-container');
    elContainers.forEach(function(elContainer) {
        if (elContainer.classList.contains(page)) {
            elContainer.classList.remove('hide');
            showActive(page);
        } else {
            elContainer.classList.add('hide');
        }
        if (elContainer.classList.contains('gallery-container')) onGalleryClicked();
    });
}

function showActive(page) {
    var elLis = document.querySelectorAll('nav ul li');
    elLis.forEach(function(elLi) {
        if (elLi.classList.contains(`go-to-${page}`)) {
            elLi.classList.add('active');
        } else {
            elLi.classList.remove('active');
        }
    });
}

function onGalleryClicked() {
    document.querySelector('.img-gallery').classList.remove('hide');
    document.querySelector('.meme-editor-container').classList.add('hide');
    document.querySelector('.general-container').classList.remove('screen-size');
    document.querySelector('.general-container').classList.add('content-size');
}

function isMousOnText(offsetX, offsetY) {
    const lines = getLines();
    gIsMouseOnTxt = false;
    document.querySelector('canvas').style.cursor = 'auto';
    lines.forEach(function(line, idx) {
        const width = (gCtx.measureText(line.txt).width) / 2
        const height = line.size / 2;
        const startX = line.pos.x - width;
        const endX = line.pos.x + width;
        const startY = line.pos.y - height * 2;
        const endY = line.pos.y + height;
        if ((offsetX > startX) && (offsetX < endX) && ((offsetY > startY) && (offsetY < endY))) {
            gIsMouseOnTxt = true;
            gCurrLineIdx = idx;
            document.querySelector('canvas').style.cursor = 'pointer'
        }
    })
}

function addDragAndDrop() {
    var offsetX;
    var offsetY;
    var diffX;
    var diffY;
    var clientX;
    var clientY;

    gCanvas.addEventListener('mousedown', ev => {
        offsetX = ev.offsetX;
        offsetY = ev.offsetY;
        gIsMouseDown = true;
        if (gIsMouseOnTxt) {
            onChangeFocusedLine(gCurrLineIdx);
        }
    });

    gCanvas.addEventListener('mousemove', ev => {
        isMousOnText(ev.offsetX, ev.offsetY);
        if (gIsMouseDown) {
            diffX = ev.offsetX - offsetX;
            diffY = ev.offsetY - offsetY;
            changeLinePos('x', diffX);
            changeLinePos('y', diffY);
            offsetX = ev.offsetX;
            offsetY = ev.offsetY;
            drawCanvas();
        }
    });

    gCanvas.addEventListener('mouseup', ev => {
        if (gIsMouseDown === true) {
            gIsMouseDown = false;
        }
    });
    gCanvas.addEventListener('touchstart', ev => {
        clientX = ev.targetTouches[0].clientX;
        clientY = ev.targetTouches[0].clientY;
        gIsMouseDown = true;
        const elCanvasLeft = document.querySelector('canvas').getBoundingClientRect().left
        const elCanvasTop = document.querySelector('canvas').getBoundingClientRect().top
        console.log(elCanvasLeft, elCanvasTop);
        isMousOnText(clientX - elCanvasLeft, clientY - elCanvasTop);
        if (gIsMouseOnTxt) {
            onChangeFocusedLine(gCurrLineIdx);
        }

    });

    gCanvas.addEventListener('touchmove', ev => {
        ev.preventDefault();
        if (gIsMouseDown && gIsMouseOnTxt) {
            diffX = ev.targetTouches[0].clientX - clientX;
            diffY = ev.targetTouches[0].clientY - clientY;
            changeLinePos('x', diffX);
            changeLinePos('y', diffY);
            clientX = ev.targetTouches[0].clientX;
            clientY = ev.targetTouches[0].clientY;
            drawCanvas();
        }
    });

    gCanvas.addEventListener('touchend', ev => {
        if (gIsMouseDown === true) {
            gIsMouseDown = false;
        }
    });
}

function onSaveMeme() {
    const memeImg = gCanvas.toDataURL()
    saveMeme(memeImg);
    document.querySelector('.btn-save').classList.add('saved');
    setTimeout(setTimeout(function() {
        document.querySelector('.btn-save').classList.remove('saved');
    }, 3000))
}