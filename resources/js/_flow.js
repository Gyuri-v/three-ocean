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
  let boatSize = { size: null, width: 0, height: 0, depth: 0 }
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
    camera.position.set(30, 30, -60);
    camera.lookAt(0, 0, 0);
    scene.add(camera);

    // light
    light = new THREE.AmbientLight('#fff', 1);
    scene.add(light);

    // controls
    controls = new OrbitControls( camera, renderer.domElement );

    // helper
    const axesHelper = new THREE.AxesHelper(3);
    scene.add(axesHelper);

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
    // boat = new THREE.Group();
    const loader = new GLTFLoader()
    loader.load(
        'resources/models/cargo_ship/boat.glb',
        function (gltf) {
            // gltf.scene.traverse(function (child) {
            //   if (child.isMesh) {
            //     console.log(child);
            //     // child.material = new THREE.MeshStandardMaterial({ roughness: 0 })
            //     boat.add(child);
            //   }
            // });
            boat = gltf.scene;
            boat.scale.set(0.5, 0.5, 0.5);
            boat.position.y = -2;
            boat.position.x = -6;
            
            const size = new THREE.Box3().setFromObject(boat);
            boatSize.size = size;
            boatSize.width = size.max.x - size.min.x
            boatSize.height = size.max.y - size.min.y
            boatSize.depth = size.max.z - size.min.z

            
            const float = new THREE.Mesh(
              new THREE.PlaneGeometry(boatSize.width, boatSize.depth),
              new THREE.MeshStandardMaterial({ color: 'pink', side: THREE.DoubleSide })
            );
            float.position.y = 0.1;
            float.rotation.x = degToRad(-90);
            
            earth.add(float, boat);
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
