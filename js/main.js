// zmienne globalne
let gl_canvas;
let gl_ctx;

let _position;
let _uv;
let _sampler;

let _triangleVertexBuffer;
let _triangleFacesBuffer;

let _PosMatrix;
let _MovMatrix;
let _ViewMatrix;
let _matrixProjection;
let _matrixMovement;
let _matrixView;
let _cubeTexture;

const rotationSpeed = 0.001;
const zoomRatio = -6;

let X, Y, Z;
let texture;
let animation;

// funkcja główna 
function runWebGL() {
    getRotation();
    getTexture();
    gl_canvas = document.getElementById("glcanvas");
    gl_ctx = gl_getContext(gl_canvas);
    gl_initShaders();
    gl_initBuffers();
    gl_setMatrix();
    _cubeTexture = gl_initTexture();
    gl_draw();
}

// osie obrotu
function getRotation() {
    X = document.getElementById('rotateX').checked;
    Y = document.getElementById('rotateY').checked;
    Z = document.getElementById('rotateZ').checked;
}

function getTexture() {
    texture = document.querySelector('input[name="texture"]:checked').value;
}

// pobranie kontekstu WebGL
function gl_getContext(canvas) {
    try {
        var ctx = canvas.getContext("webgl");
        ctx.viewportWidth = canvas.width;
        ctx.viewportHeight = canvas.height;
    } catch (e) {}
    if (!ctx) {
        document.write('Nieudana inicjalizacja kontekstu WebGL.')
    }
    return ctx;
}

// shadery
function gl_initShaders() {
    const vertexShader = `
        attribute vec3 position;
        uniform mat4 PosMatrix;
        uniform mat4 MovMatrix;
        uniform mat4 ViewMatrix;
        attribute vec2 uv;
        varying vec2 vUV;
        void main(void) {
        gl_Position = PosMatrix * ViewMatrix * MovMatrix * vec4(position, 1.);
        vUV = uv;
        }`;

    const fragmentShader = `
        precision mediump float;
        uniform sampler2D sampler;
        varying vec2 vUV;
        void main(void) {
           gl_FragColor = texture2D(sampler, vUV);
        }`;

    const getShader = function (source, type, typeString) {
        const shader = gl_ctx.createShader(type);
        gl_ctx.shaderSource(shader, source);
        gl_ctx.compileShader(shader);

        if (!gl_ctx.getShaderParameter(shader, gl_ctx.COMPILE_STATUS)) {
            alert('error in ' + typeString);
            return false;
        }
        return shader;
    };

    const shaderVertex = getShader(vertexShader, gl_ctx.VERTEX_SHADER, "VERTEX");
    const shaderFragment = getShader(fragmentShader, gl_ctx.FRAGMENT_SHADER, "FRAGMENT");

    const shaderProgram = gl_ctx.createProgram();
    gl_ctx.attachShader(shaderProgram, shaderVertex);
    gl_ctx.attachShader(shaderProgram, shaderFragment);

    gl_ctx.linkProgram(shaderProgram);

    _PosMatrix = gl_ctx.getUniformLocation(shaderProgram, "PosMatrix");
    _MovMatrix = gl_ctx.getUniformLocation(shaderProgram, "MovMatrix");
    _ViewMatrix = gl_ctx.getUniformLocation(shaderProgram, "ViewMatrix");

    _sampler = gl_ctx.getUniformLocation(shaderProgram, "sampler");
    _uv = gl_ctx.getAttribLocation(shaderProgram, "uv");

    _position = gl_ctx.getAttribLocation(shaderProgram, "position");
    _color = gl_ctx.getAttribLocation(shaderProgram, "color");
    gl_ctx.enableVertexAttribArray(_position);
    gl_ctx.enableVertexAttribArray(_uv);
    gl_ctx.useProgram(shaderProgram);
    gl_ctx.uniform1i(_sampler, 0);
}

// bufory
function gl_initBuffers() {
    const triangleVertices = [
        -1, -1, -1, 0, 0,
        1, -1, -1, 1, 0,
        1, 1, -1, 1, 1,
        -1, 1, -1, 0, 1,
        -1, -1, 1, 0, 0,
        1, -1, 1, 1, 0,
        1, 1, 1, 1, 1,
        -1, 1, 1, 0, 1,
        -1, -1, -1, 0, 0,
        -1, 1, -1, 1, 0,
        -1, 1, 1, 1, 1,
        -1, -1, 1, 0, 1,
        1, -1, -1, 0, 0,
        1, 1, -1, 1, 0,
        1, 1, 1, 1, 1,
        1, -1, 1, 0, 1,
        -1, -1, -1, 0, 0,
        -1, -1, 1, 1, 0,
        1, -1, 1, 1, 1,
        1, -1, -1, 0, 1,
        -1, 1, -1, 0, 0,
        -1, 1, 1, 1, 0,
        1, 1, 1, 1, 1,
        1, 1, -1, 0, 1
    ];

    _triangleVertexBuffer = gl_ctx.createBuffer();
    gl_ctx.bindBuffer(gl_ctx.ARRAY_BUFFER, _triangleVertexBuffer);
    gl_ctx.bufferData(gl_ctx.ARRAY_BUFFER,
        new Float32Array(triangleVertices),
        gl_ctx.STATIC_DRAW);

    const triangleFaces = [
        0, 1, 2,
        0, 2, 3,
        4, 5, 6,
        4, 6, 7,
        8, 9, 10,
        8, 10, 11,
        12, 13, 14,
        12, 14, 15,
        16, 17, 18,
        16, 18, 19,
        20, 21, 22,
        20, 22, 23
    ];

    _triangleFacesBuffer = gl_ctx.createBuffer();
    gl_ctx.bindBuffer(gl_ctx.ELEMENT_ARRAY_BUFFER, _triangleFacesBuffer);
    gl_ctx.bufferData(gl_ctx.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(triangleFaces),
        gl_ctx.STATIC_DRAW);
}


// macierz 
function gl_setMatrix() {
    _matrixProjection = MATRIX.getProjection(40,
        gl_canvas.width / gl_canvas.height, 1, 100);
    _matrixMovement = MATRIX.getIdentityMatrix();
    _matrixView = MATRIX.getIdentityMatrix();
    MATRIX.translateZ(_matrixView, zoomRatio);
}

// tekstura

function gl_initTexture() {
    const img = new Image();
    if (texture === '1') {
        img.src = 'textures/cubeTexture1.png';
    } else if (texture === '2'){
        img.src = 'textures/cubeTexture2.png';
    } else {
        img.src = 'textures/cubeTexture3.png';
    }
    img.webglTexture = false;

    img.onload = function (e) {
        const texture = gl_ctx.createTexture();

        gl_ctx.pixelStorei(gl_ctx.UNPACK_FLIP_Y_WEBGL, true);
        gl_ctx.bindTexture(gl_ctx.TEXTURE_2D, texture);
        gl_ctx.texParameteri(gl_ctx.TEXTURE_2D, gl_ctx.TEXTURE_MIN_FILTER, gl_ctx.LINEAR);
        gl_ctx.texParameteri(gl_ctx.TEXTURE_2D, gl_ctx.TEXTURE_MAG_FILTER, gl_ctx.LINEAR);

        gl_ctx.texParameteri(gl_ctx.TEXTURE_2D, gl_ctx.TEXTURE_WRAP_S, gl_ctx.CLAMP_TO_EDGE);
        gl_ctx.texParameteri(gl_ctx.TEXTURE_2D, gl_ctx.TEXTURE_WRAP_T, gl_ctx.CLAMP_TO_EDGE);

        gl_ctx.texImage2D(gl_ctx.TEXTURE_2D, 0, gl_ctx.RGBA, gl_ctx.RGBA,
            gl_ctx.UNSIGNED_BYTE, img);
        gl_ctx.bindTexture(gl_ctx.TEXTURE_2D, null);
        img.webglTexture = texture;
    };
    return img;
}

// rysowanie 
function gl_draw() {
    if (animation) {
        window.cancelAnimationFrame(animation)
    }

    gl_ctx.clearColor(0.0, 0.0, 0.0, 0.0);
    gl_ctx.enable(gl_ctx.DEPTH_TEST);
    gl_ctx.depthFunc(gl_ctx.LEQUAL);
    gl_ctx.clearDepth(1.0);
    let timeOld = 0;

    const animate = function (time) {
        const dAngle = rotationSpeed * (time - timeOld);
        if (X) {
            MATRIX.rotateX(_matrixMovement, dAngle);
        }
        if (Y) {
            MATRIX.rotateY(_matrixMovement, dAngle);
        }
        if (Z) {
            MATRIX.rotateZ(_matrixMovement, dAngle);
        }

        timeOld = time;

        gl_ctx.viewport(0.0, 0.0, gl_canvas.width, gl_canvas.height);
        gl_ctx.clear(gl_ctx.COLOR_BUFFER_BIT | gl_ctx.DEPTH_BUFFER_BIT);

        gl_ctx.uniformMatrix4fv(_PosMatrix, false, _matrixProjection);
        gl_ctx.uniformMatrix4fv(_MovMatrix, false, _matrixMovement);
        gl_ctx.uniformMatrix4fv(_ViewMatrix, false, _matrixView);

        if (_cubeTexture.webglTexture) {
            gl_ctx.activeTexture(gl_ctx.TEXTURE0);
            gl_ctx.bindTexture(gl_ctx.TEXTURE_2D, _cubeTexture.webglTexture);
        }

        gl_ctx.vertexAttribPointer(_position, 3, gl_ctx.FLOAT, false, 4 * (3 + 2), 0);
        gl_ctx.vertexAttribPointer(_uv, 2, gl_ctx.FLOAT, false, 4 * (3 + 2), 3 * 4);

        gl_ctx.bindBuffer(gl_ctx.ARRAY_BUFFER, _triangleVertexBuffer);
        gl_ctx.bindBuffer(gl_ctx.ELEMENT_ARRAY_BUFFER, _triangleFacesBuffer);
        gl_ctx.drawElements(gl_ctx.TRIANGLES, 5*2*3, gl_ctx.UNSIGNED_SHORT, 0);
        gl_ctx.flush();

        animation = window.requestAnimationFrame(animate);
    };
    animate(0);
}