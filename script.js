const vertexShaderSource = `#version 300 es

in vec2 a_position;
in vec2 a_texcoord;

out vec2 v_texcoord;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform float u_rotation;
uniform float u_scale;
uniform vec2 u_shear;

void main() {
  float r_sin = sin(u_rotation);
  float r_cos = cos(u_rotation);

  // Create transformation matrices
  mat2 rotationMatrix = mat2(r_cos, -r_sin,
                             r_sin,  r_cos);

  mat2 shearMatrix = mat2(        1, u_shear.y,
                          u_shear.x,         1);

  // Calculate the effect of the transformations
  vec2 position = shearMatrix * (rotationMatrix * (a_position * u_scale)) + u_translation;

  gl_Position = vec4(position.x / (u_resolution.x / u_resolution.y), position.y, 0, 1);
  v_texcoord = a_texcoord;
}`;

const fragmentShaderSource = `#version 300 es

precision mediump float;

in vec2 v_texcoord;

uniform sampler2D u_texture;

out vec4 outColor;

void main() {
   outColor = texture(u_texture, v_texcoord);
}`;


function loadShader(gl, shaderSource, shaderType) {
  var shader = gl.createShader(shaderType);

  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);

  return shader;
}

function loadProgram(gl) {
  var program = gl.createProgram();

  var shader = loadShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
  gl.attachShader(program, shader);

  shader = loadShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
  gl.attachShader(program, shader);  

  gl.linkProgram(program);

  return program;
}

function main() {

  var canvas = document.getElementById("canvas");
  var gl = canvas.getContext("webgl2");

  if (!gl) {
    return;
  }

  var program = loadProgram(gl);

  var positionLocation = gl.getAttribLocation(program, "a_position");
  var texcoordLocation = gl.getAttribLocation(program, "a_texcoord");

  // Get uniforms
  var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  var textureLocation = gl.getUniformLocation(program, "u_texture");
  var translationLocation = gl.getUniformLocation(program, "u_translation");
  var rotationLocation = gl.getUniformLocation(program, "u_rotation");
  var scaleLocation = gl.getUniformLocation(program, "u_scale");
  var shearLocation = gl.getUniformLocation(program, "u_shear");

  var vao = gl.createVertexArray();

  gl.bindVertexArray(vao);

  var positions = [
    0, 0,
    0, 1,
    1, 0,
    1, 0,
    0, 1,
    1, 1,
  ];
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  gl.enableVertexAttribArray(positionLocation);

  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  var texcoords = [
    0, 0,
    0, 1,
    1, 0,
    1, 0,
    0, 1,
    1, 1,
  ];
  var texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);

  gl.enableVertexAttribArray(texcoordLocation);

  gl.vertexAttribPointer(
      texcoordLocation, 2, gl.FLOAT, true, 0, 0);

  function loadTexture(url) {
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                  new Uint8Array([255, 245, 157, 255]));

    var img = new Image();
    img.addEventListener("load", function() {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);
    });
    img.src = url;

    return tex;
  }

  var image = loadTexture("blaine.png");

  function draw() {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(program);
    gl.bindVertexArray(vao);

    // Apply uniforms to source
    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform1i(textureLocation, 0);

    // Transformation uniforms
    gl.uniform2f(translationLocation, translation.x, translation.y);
    gl.uniform1f(rotationLocation, rotation);
    gl.uniform1f(scaleLocation, scale);
    gl.uniform2f(shearLocation, shear.x, shear.y);

    // Apply image to texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, image);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

  }

  function render(time) {
    updateTransformations(); // Update transformation tracking variables

    draw();

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

}


function updateTransformations() {
  getPressedKeyBindings().forEach(action => action.execute());
}

function getPressedKeyBindings() {
  return keyBindings.filter(action =>
    action.keys.some(binding => keys[binding]));
}


const TRANSLATION_STEP = 0.015;
const ROTATION_STEP = 0.0175;
const SHEAR_STEP = 0.015;
const SCALE_STEP = 0.015;

var keys = {}; // Object of all keys currently pressed

// Transformation tracking variables
var translation = {
  x: 0.5,
  y: 0.5
};
var rotation = Math.PI;
var scale = 1.0;
var shear = {
  x: 0.0,
  y: 0.0
};

var keyBindings = [
  {
    descr: "Move left",
    keys: ["ArrowLeft", "KeyA"], // ArrowLeft || A
    execute: () => translation.x -= TRANSLATION_STEP
  }, {
    descr: "Move up",
    keys: ["ArrowUp", "KeyW"], // ArrowUp || W
    execute: () => translation.y += TRANSLATION_STEP
  }, {
    descr: "Move right",
    keys: ["ArrowRight", "KeyD"], // ArrowRight || D
    execute: () => translation.x += TRANSLATION_STEP
  }, {
    descr: "Move down",
    keys: ["ArrowDown", "KeyS"], // ArrowDown || S
    execute: () => translation.y -= TRANSLATION_STEP
  }, {
    descr: "Rotate clockwise",
    keys: ["KeyQ", "KeyU"], // Q || U
    execute: () => rotation -= ROTATION_STEP
  }, {
    descr: "Rotate counter-clockwise",
    keys: ["KeyE", "KeyO"], // E || O
    execute: () => rotation += ROTATION_STEP
  }, {
    descr: "Shear x (positive)",
    keys: ["KeyJ", "Numpad4"], // J || Numpad 4
    execute: () => shear.x += SHEAR_STEP
  }, {
    descr: "Shear y (negative)",
    keys: ["KeyI", "Numpad8"], // I || Numpad 8
    execute: () => shear.y -= SHEAR_STEP
  }, {
    descr: "Shear x (negative)",
    keys: ["KeyL", "Numpad6"], // L || Numpad 6
    execute: () => shear.x -= SHEAR_STEP
  }, {
    descr: "Shear y (positive)",
    keys: ["KeyK", "Numpad2"], // K || Numpad 2
    execute: () => shear.y += SHEAR_STEP
  }, {
    descr: "Scale up",
    keys: ["KeyR", "KeyP"], // R || P
    execute: () => scale += SCALE_STEP
  }, {
    descr: "Scale Down",
    keys: ["KeyF", "Semicolon"], // F || ;
    execute: () => scale -= SCALE_STEP
  }
]

// Add window event listeners to save keypresses
window.addEventListener("keydown", function(e) {
  keys[e.code] = true;

  // If we are executing an action, prevent default browser behavior
  if (getPressedKeyBindings().length)
    e.preventDefault();
});
window.addEventListener("keyup", function(e) {
  delete keys[e.code];
});

document.getElementById("js-keyBindings").innerHTML += keyBindings.map(action => `
    <div>
      ${action.descr} - <b>[${action.keys.join(", ")}]</b>
    </div>
  `).join("");

// Kick off the program
main();
