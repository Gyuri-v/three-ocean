import '../scss/style.scss';

import gsap from 'gsap';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { GUI } from 'dat.gui';

import Floater from './floater.js'
import GerstnerWater from './gerstnerWater.js'


function main () {
  // DOM
  const $container = document.querySelector('.container');
  let $canvas;

  // WORLD
  let renderer, scene, camera, light, controls, gui;
  let water, sun;

  // VALUE
  let areaWidth, areaHeight;

  function init () {
    // renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor('#000', 1.0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setSize(areaWidth, areaHeight);
    $canvas = renderer.domElement;
    $container.append($canvas);

    // scene
    scene = new THREE.Scene();

    // camera
    camera = new THREE.PerspectiveCamera(60, areaWidth/areaHeight, 1, 1000);
    camera.position.set(50, 50, -150);
    camera.lookAt(0, 0, 0);
    scene.add(camera);

    // light
    light = new THREE.AmbientLight('#fff', 1);
    scene.add(light);

    // controls
    controls = new OrbitControls( camera, renderer.domElement );

    // gui
    gui = new GUI()

    // setting
    setEnvironment();

    // render
    gsap.ticker.add(render);
  }

  // OCEAN
  function setEnvironment () {
    // temp box
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 'red', side: THREE.DoubleSide })
    );
    mesh.position.set(0, 0, 0);
    scene.add(mesh);

    // fog
    // scene.fog = new THREE.FogExp2(0x909497, 0.05);

    // water
    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
    water = new Water(
      waterGeometry,
      {
        time: 5,
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: new THREE.TextureLoader().load('resources/textures/waternormals.jpg', (texture) => {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }),
        sunDirection: new THREE.Vector3(),
        sunColor: '#ff3636',
        waterColor: '#070e4c',
        distortionScale: 3.7,
        fog: scene.fog !== undefined,
      }
    );
    water.material.side = THREE.DoubleSide;
    water.rotation.x = -Math.PI / 2;
    scene.add(water);

    // sky
    const sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);
    
    const skyUniforms = sky.material.uniforms;

    skyUniforms['turbidity'].value = 10;
    skyUniforms[ 'rayleigh' ].value = 2;
    skyUniforms[ 'mieCoefficient' ].value = 0.005;
    skyUniforms[ 'mieDirectionalG' ].value = 0.8;

    const parameters = {
      elevation: 1,
      azimuth: 180
    };
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const sceneEnv = new THREE.Scene();

    let renderTarget;
    
    // sun
    sun = new THREE.Vector3();
    function updateSun() {
      const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
      const theta = THREE.MathUtils.degToRad(parameters.azimuth);
      
      sun.setFromSphericalCoords(1, phi, theta); // setFromSphericalCoords(radius, phi, theta) 구형좌표 반경 설정. phi 및 theta에서 이 벡터를 설정

      sky.material.uniforms['sunPosition'].value.copy(sun);
      water.material.uniforms['sunDirection'].value.copy(sun).normalize();
      
      if ( renderTarget !== undefined ) renderTarget.dispose();
      
      sceneEnv.add(sky);
      renderTarget = pmremGenerator.fromScene(sceneEnv);
      scene.add(sky);

      scene.environment = renderTarget.texture;
    }
    updateSun();
  }

  // RENDER
  function render (time, deltaTime) {
    water.material.uniforms[ 'time' ].value += 1.0 / 60.0;

    controls.update();
      
    renderer.setSize(areaWidth, areaHeight);
    renderer.render(scene, camera);
  }
  

  // RESIZE
  function resize () {
    areaWidth = window.innerWidth;
    areaHeight = window.innerHeight;
  }

  resize();
  window.addEventListener('load', init);
  window.addEventListener('resize', resize);
}
main();
