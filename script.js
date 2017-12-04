const vertexShaderSource = `#version 300 es

in vec4 a_position;
in vec2 a_texcoord;

out vec2 v_texcoord;

uniform vec4 u_translation;
uniform float u_rotation;
uniform float u_scale;
uniform vec2 u_shear;

mat4 rotationMatrix() {
  float s = sin(u_rotation);
  float c = cos(u_rotation);

  return mat4(c,    -s, 0.0, 0.0,
              s,     c, 0.0, 0.0,
              1.0, 1.0, 1.0, 1.0,
              0.0, 0.0, 0.0, 1.0);
}

mat4 shearMatrix() {
  return mat4(      1.0, u_shear.y, 0.0, 0.0,
              u_shear.x,       1.0, 0.0, 0.0,
                    1.0,       1.0, 1.0, 1.0,
                    0.0,       0.0, 0.0, 1.0);
}

void main() {
  gl_Position = shearMatrix()*(rotationMatrix()*a_position) + u_translation;
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

  var shader = loadShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
  gl.attachShader(program, shader);

  shader = loadShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
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
                  new Uint8Array([0, 0, 255, 255]));

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



    // Apply transformations to source
    gl.uniform4f(translationLocation, translation.x, translation.y, 0.0, 0.0);
    gl.uniform1f(rotationLocation, rotation);
    gl.uniform1f(scaleLocation, scale);
    gl.uniform2f(shearLocation, shear.x, shear.y);




    gl.bindVertexArray(vao);

    gl.uniform1i(textureLocation, 0);

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
    action.keys.some(binding =>
      binding.length ? binding.every(key => keys[key]) : keys[binding])
    );
}


const TRANSLATION_STEP = 0.015;
const ROTATION_STEP = 0.0175;
const SHEAR_STEP = 0.015;

var keys = {}; // Object of all keys currently pressed

// Transformation tracking variables
var translation = {
  x: 0,
  y: 0
};
var rotation = Math.PI;
var scale = 2.0;
var shear = {
  x: 0,
  y: 0
};

var keyBindings = [
  { // Translate negative x
    keys: [37, 65], // ArrowLeft || A
    execute: () => translation.x -= TRANSLATION_STEP
  }, { // Translate positive y
    keys: [38, 87], // ArrowUp || W
    execute: () => translation.y += TRANSLATION_STEP
  }, { // Translate positive x
    keys: [39, 68], // ArrowRight || D
    execute: () => translation.x += TRANSLATION_STEP
  }, { // Translate positive x
    keys: [40, 83], // ArrowDown || S
    execute: () => translation.y -= TRANSLATION_STEP
  }, { // Rotation negative
    keys: [81, [16, 37], [16, 65]], // Q || (Shift && (ArrowLeft || A))
    execute: () => rotation -= ROTATION_STEP
  }, { // Rotation positive
    keys: [69, [16, 39], [16, 68]], // E || (Shift && (ArrowRight || D))
    execute: () => rotation += ROTATION_STEP
  }, { // Shear positive x
    keys: [[17, 37], [17, 65]], // Ctrl && (ArrowLeft || A)
    execute: () => shear.x += SHEAR_STEP
  }, { // Shear negative y
    keys: [[17, 38], [17, 87]], // Ctrl && (ArrowUp || W)
    execute: () => shear.y -= SHEAR_STEP
  }, { // Shear negative x
    keys: [[17, 39], [17, 68]], // Ctrl && (ArrowRight || D)
    execute: () => shear.x -= SHEAR_STEP
  }, { // Shear positive y
    keys: [[17, 40], [17, 83]], // Ctrl && (ArrowDown || S)
    execute: () => shear.y += SHEAR_STEP
  }
]

// Add window event listeners to save keypresses
window.addEventListener("keydown", function(e) {
  keys[e.which] = true;

  // If we are executing an action, prevent default browser behavior
  if (getPressedKeyBindings().length)
    e.preventDefault();
});
window.addEventListener("keyup", function(e) {
  delete keys[e.which];
});

// Kick off the program
main();
