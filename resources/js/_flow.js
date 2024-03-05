import '../scss/style.scss';

import gsap from 'gsap';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader';
import { GUI } from 'dat.gui';
import { degToRad } from 'three/src/math/MathUtils.js';


function main () {
  // DOM
  const $container = document.querySelector('.container');
  let $canvas;

  // WORLD
  let renderer, scene, camera, light, controls, gui;
  let water, sun, boat;
  let gerstnerWater, floater;

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
    camera.position.set(10, 10, -20);
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
    const earth = new THREE.Group();
    scene.add(earth);

    // water
    water = new THREE.Mesh(
      new THREE.PlaneGeometry(10000, 10000),
      new THREE.MeshStandardMaterial({ color: 'blue', side: THREE.DoubleSide })
    );
    water.rotation.x = degToRad(90);
    earth.add(water);


    // boat
    const loader = new GLTFLoader()
    loader.load(
        'resources/models/boat.glb',
        function (gltf) {
            gltf.scene.traverse(function (child) {
                if (child.isMesh) {
                    child.material = new THREE.MeshStandardMaterial({ roughness: 0 })
                    boat = child;
                }
            });
            earth.add(gltf.scene);
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
        },
        (error) => {
            console.log(error)
        }
    )
    
  }

  // RENDER
  const clock = new THREE.Clock();
  let delta = 0;
  function render (time, deltaTime) {
    // delta = clock.getDelta();
    
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
