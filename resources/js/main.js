import '../scss/style.scss';

import gsap from 'gsap';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader';
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
    const earth = new THREE.Group();
    scene.add(earth);
    
    // fog
    // scene.fog = new THREE.FogExp2(0x909497, 0.05);

    // water
    // const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
    // water = new Water(
    //   waterGeometry,
    //   {
    //     time: 5,
    //     textureWidth: 512,
    //     textureHeight: 512,
    //     waterNormals: new THREE.TextureLoader().load('resources/textures/waternormals.jpg', (texture) => {
    //       texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    //     }),
    //     sunDirection: new THREE.Vector3(),
    //     sunColor: '#ff3636',
    //     waterColor: '#070e4c',
    //     distortionScale: 3.7,
    //     fog: scene.fog !== undefined,
    //   }
    // );
    // water.material.side = THREE.DoubleSide;
    // water.rotation.x = -Math.PI / 2;
    // scene.add(water);
    gerstnerWater = new GerstnerWater(gui);
    earth.add(gerstnerWater.water);

    // sky
    const sky = new Sky();
    sky.scale.setScalar(10000);
    earth.add(sky);
    
    const skyUniforms = sky.material.uniforms;

    skyUniforms[ 'turbidity' ].value = 10;
    skyUniforms[ 'rayleigh' ].value = 2;
    skyUniforms[ 'mieCoefficient' ].value = 0.005;
    skyUniforms[ 'mieDirectionalG' ].value = 2.53;

    gui.add(skyUniforms['turbidity'], 'value', -10, 20, 0.01).name('turbidity');
    gui.add(skyUniforms['rayleigh'], 'value', -10, 10, 0.001).name('rayleigh');
    gui.add(skyUniforms['mieCoefficient'], 'value', 0, 0.01, 0.0001).name('mieCoefficient');
    gui.add(skyUniforms['mieDirectionalG'], 'value', -10, 10, 0.0001).name('mieDirectionalG');

    const parameters = {
      // elevation: 8,
      // azimuth: 180,

      // turbidity: 20,
      // rayleigh: 0.558,
      // mieCoefficient: 0.009,
      // mieDirectionalG: -0.999998,
      // elevation: 14,
      // azimuth: -45,

      // turbidity: 10,
      // rayleigh: 2,
      // mieCoefficient: 0.005,
      // mieDirectionalG: 2.53,
      // elevation: 14,
      // azimuth: -45,


      turbidity: 10,
      rayleigh: 2,
      mieCoefficient: 0.005,
      mieDirectionalG: .8,
      elevation:0.28,
      azimuth: 0.25,
      // exposure: renderer.toneMappingExposure
    };
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const sceneEnv = new THREE.Scene();

    let renderTarget;


    gui.add(parameters, 'elevation', -10, 30, 0.01).name('elevation').onChange(() => {
      const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
      const theta = THREE.MathUtils.degToRad(parameters.azimuth);
      sun.setFromSphericalCoords(1, phi, theta);
      sky.material.uniforms['sunPosition'].value.copy(sun);
      // water.material.uniforms['sunDirection'].value.copy(sun).normalize();
      gerstnerWater.water.material.uniforms['sunDirection'].value.copy(sun);
    });
    gui.add(parameters, 'azimuth', -180, 180, 0.001).name('azimuth').onChange(() => {
      const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
      const theta = THREE.MathUtils.degToRad(parameters.azimuth);
      sun.setFromSphericalCoords(1, phi, theta);
      sky.material.uniforms['sunPosition'].value.copy(sun);
      // water.material.uniforms['sunDirection'].value.copy(sun).normalize();
      gerstnerWater.water.material.uniforms['sunDirection'].value.copy(sun);
    });
    
    // sun
    sun = new THREE.Vector3();
    function updateSun() {
      // console.log('updateSun');
      skyUniforms['turbidity'].value = parameters.turbidity;
      skyUniforms['rayleigh'].value = parameters.rayleigh;
      skyUniforms['mieCoefficient'].value = parameters.mieCoefficient;
      skyUniforms['mieDirectionalG'].value = parameters.mieDirectionalG;

      const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
      const theta = THREE.MathUtils.degToRad(parameters.azimuth);
      sun.setFromSphericalCoords(1, phi, theta); // setFromSphericalCoords(radius, phi, theta) 구형좌표 반경 설정. phi 및 theta에서 이 벡터를 설정

      sky.material.uniforms['sunPosition'].value.copy(sun);
      // water.material.uniforms['sunDirection'].value.copy(sun).normalize();
      gerstnerWater.water.material.uniforms['sunDirection'].value.copy(sun);
      
      if ( renderTarget !== undefined ) renderTarget.dispose();
      
      sceneEnv.add(sky);
      renderTarget = pmremGenerator.fromScene(sceneEnv);
      earth.add(sky);

      scene.environment = renderTarget.texture;
    }
    updateSun();


    // temp box
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(5, 5, 15),
      new THREE.MeshStandardMaterial({ color: 'red', side: THREE.DoubleSide })
    );
    mesh.position.set(0, 0, 0);
    earth.add(mesh);
    floater = new Floater(earth, mesh, gerstnerWater, true);

    // let floaters = []
    // const loader = new GLTFLoader()
    // loader.load(
    //     'resources/models/boat.glb',
    //     function (gltf) {
    //         gltf.scene.traverse(function (child) {
    //             if (child.isMesh) {
    //                 child.material = new THREE.MeshStandardMaterial({ roughness: 0 })
    //             }
    //         });
    //         console.log('--', gltf.scene);
    //         const group = new THREE.Group()
    //         group.add(gltf.scene)
    //         const floater = new Floater(earth, group, gerstnerWater, true)
    //         floaters.push(floater)
    //         // controlledBoatId = floaters.length - 1

    //         // gltf.scene.add(followCamPivot)
    //         // followCamPivot.position.set(0, 5, -7.5)

    //         group.position.x = startX
    //         group.position.z = startZ

    //         camera.position.set(group.position.x, 100, group.position.z - 100)

    //         earth.add(group)

    //         cameraLerp = true

    //         // loadTestBoxes()
    //         // loadTestBoat1()
    //         // loadTestBoat2()

    //         camera.position.set(0, 100, -100)
    //     },
    //     (xhr) => {
    //         console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
    //     },
    //     (error) => {
    //         console.log(error)
    //     }
    // )
    
  }

  // RENDER
  const clock = new THREE.Clock();
  let delta = 0;
  function render (time, deltaTime) {
    
    // water.material.uniforms[ 'time' ].value += 1.0 / 60.0;
    delta = clock.getDelta();
    gerstnerWater.water.material.uniforms['offsetX'] && floater && floater.update(delta)
    
    gerstnerWater && gerstnerWater.update(delta);
    
    // controls.target = floater.object.position;
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
