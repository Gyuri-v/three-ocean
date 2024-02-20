
import '../scss/style.scss';

import * as THREE from 'three'
import { OrbitControls } from './OrbitControls';
import Stats from './stats.module.js'
import { Sky } from './Sky.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import GerstnerWater from './gerstnerWater.js'
import Floater from './floater.js'
import { GUI } from 'dat.gui'


const scene = new THREE.Scene()

const earth = new THREE.Group()
scene.add(earth)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
document.querySelector('.container').appendChild(renderer.domElement)

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50000)

let cameraLerp = false
let controlsChanging = false
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.maxDistance = 100
controls.addEventListener('start', () => {
    controlsChanging = true
    cameraLerp = false
})
controls.addEventListener('end', () => {
    controlsChanging = false
})

const sun = new THREE.Vector3()

const gui = new GUI()

const gerstnerWater = new GerstnerWater(gui)
earth.add(gerstnerWater.water)

const sky = new Sky()
sky.scale.setScalar(10000)
scene.add(sky)

const skyUniforms = sky.material.uniforms

skyUniforms['turbidity'].value = 10
skyUniforms['rayleigh'].value = 2
skyUniforms['mieCoefficient'].value = 0.005
skyUniforms['mieDirectionalG'].value = 0.8

const parameters = {
    elevation: 2,
    azimuth: 180,
}

const pmremGenerator = new THREE.PMREMGenerator(renderer)

function updateSun() {
    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation)
    const theta = THREE.MathUtils.degToRad(parameters.azimuth)

    sun.setFromSphericalCoords(1, phi, theta)

    sky.material.uniforms['sunPosition'].value.copy(sun)
    gerstnerWater.water.material.uniforms['sunDirection'].value.copy(sun)

    scene.environment = pmremGenerator.fromScene(sky).texture
}

updateSun()

const divisor = -46080
const divisorMultiplier = 1.40625

const planes = {}
let visibleId = ''
let locationDataText = ''
const locationDataElem = document.getElementById('locationData')
const textureLoader = new THREE.TextureLoader()

function makeVisible(layerId, divisor) {
    const tileX = Math.floor(-earth.position.x / divisor)
    const tileY = Math.floor(-earth.position.z / divisor)
    let adjacentX = 0
    let adjacentY = 0
    if (tileX === Math.round(-earth.position.x / divisor)) {
        adjacentX = tileX - 1
    } else {
        adjacentX = tileX + 1
    }
    if (tileY === Math.round(-earth.position.z / divisor)) {
        adjacentY = tileY - 1
    } else {
        adjacentY = tileY + 1
    }
    visibleId = layerId + ',' + tileX + ',' + tileY
    if (!planes[visibleId]) {
        createPlane(layerId, tileX, tileY, divisor)
    }
    planes[visibleId].visible = true
    visibleId = layerId + ',' + adjacentX + ',' + tileY
    if (!planes[visibleId]) {
        createPlane(layerId, adjacentX, tileY, divisor)
    }
    planes[visibleId].visible = true
    visibleId = layerId + ',' + adjacentX + ',' + adjacentY
    if (!planes[visibleId]) {
        createPlane(layerId, adjacentX, adjacentY, divisor)
    }
    planes[visibleId].visible = true
    visibleId = layerId + ',' + tileX + ',' + adjacentY
    if (!planes[visibleId]) {
        createPlane(layerId, tileX, adjacentY, divisor)
    }
    planes[visibleId].visible = true
}

function createPlane(layerId, x, y, divisor) {
    const id = layerId + ',' + x.toString() + ',' + y.toString()
    planes[id] = new THREE.Mesh(
        new THREE.PlaneGeometry(divisor, divisor, 107, 107),
        new THREE.MeshPhysicalMaterial() //wireframe: true })
    )
    planes[id].rotateX(-Math.PI / 2)
    planes[id].position.x = x * divisor + divisor / 2
    planes[id].position.z = y * divisor + divisor / 2
    earth.add(planes[id])
    let offsetX = 128
    let offsetY = 64
    const hgtImage = new Image()
    hgtImage.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 108
        canvas.height = 108
        const context = canvas.getContext('2d')
        context.drawImage(hgtImage, 0, 0)
        const data = context.getImageData(0, 0, 108, 108)
        let dataOffset = 0
        let ele = 0
        for (let i = 2; i < planes[id].geometry.attributes.position.array.length; i = i + 3) {
            let b0 = data.data[dataOffset + 0]
            let b1 = data.data[dataOffset + 1]
            ele = ((b1 << 8) | b0) - 32767
            planes[id].geometry.attributes.position.array[i] = ele
            dataOffset += 4
        }
        planes[id].geometry.computeVertexNormals()
        planes[id].geometry.attributes.position.needsUpdate = true
    }
    hgtImage.src = 'resources/tiles_hgt/' + layerId + '_' + (y + offsetY) + '_' + (x + offsetX) + '.png'
    const tileUrl = 'resources/tiles/' + layerId + '_' + (y + offsetY) + '_' + (x + offsetX) + '.jpg'
    textureLoader.load(tileUrl, (t) => {
        planes[id].material.map = t
        planes[id].material.needsUpdate = true;

        console.log('1', planes[id].material);
    })
}

//boat
let controlledBoatId = 0
const followCamPivot = new THREE.Object3D()
const lat = 15.0302
const lon = -24.4485
let boatDataText = ''
const boatDataElem = document.getElementById('boatData')
const startX = (lon * divisor) / divisorMultiplier
const startZ = -(lat * divisor) / divisorMultiplier

let floaters = []

// main user boat
const loader = new GLTFLoader()
loader.load(
    'resources/models/boat.glb',
    function (gltf) {
        gltf.scene.traverse(function (child) {
            if (child.isMesh) {
                child.material = new THREE.MeshStandardMaterial({ roughness: 0 })
            }
        })
        const group = new THREE.Group()
        group.add(gltf.scene)
        const floater = new Floater(earth, group, gerstnerWater, true)
        floaters.push(floater)
        controlledBoatId = floaters.length - 1

        gltf.scene.add(followCamPivot)
        followCamPivot.position.set(0, 5, -7.5)

        group.position.x = startX
        group.position.z = startZ

        camera.position.set(group.position.x, 100, group.position.z - 100)

        earth.add(group)

        cameraLerp = true

        loadTestBoxes()
        loadTestBoat1()
        loadTestBoat2()

        camera.position.set(0, 100, -100)
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
    },
    (error) => {
        console.log(error)
    }
)

// floating boxes
function loadTestBoxes() {
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1)

    for (let i = 0; i < 10; i++) {
        const box = new THREE.Mesh(
            boxGeometry.clone(),
            new THREE.MeshStandardMaterial({ roughness: 0 })
        )
        const group = new THREE.Group()
        group.position.set(startX + (i * 10 - 30), 0, startZ + (i * 10 - 50))
        group.add(box.clone())
        const floater = new Floater(earth, group, gerstnerWater)
        floaters.push(floater)
        earth.add(group)
    }
}

function loadTestBoat1() {
    loader.load(
        'resources/models/boat2.glb',
        function (gltf) {
            for (let i = 0; i < 1; i++) {
                const group = new THREE.Group()
                group.position.set(startX + 20, 0, startZ + 20)
                group.add(gltf.scene)
                const floater = new Floater(earth, group, gerstnerWater)
                floaters.push(floater)
                earth.add(group)
            }
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
        },
        (error) => {
            console.log(error)
        }
    )
}

function loadTestBoat2() {
    loader.load(
        'resources/models/boat3.glb',
        function (gltf) {
            for (let i = 0; i < 1; i++) {
                const group = new THREE.Group()
                group.position.set(startX - 40, 0, startZ + 40)
                group.add(gltf.scene)
                const floater = new Floater(earth, group, gerstnerWater)
                floaters.push(floater)
                earth.add(group)
            }
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
        },
        (error) => {
            console.log(error)
        }
    )
}

const stats = new Stats()
document.body.appendChild(stats.dom)

const folderSky = gui.addFolder('Sky')
folderSky.add(parameters, 'elevation', 0, 90, 0.1).onChange(updateSun)
folderSky.add(parameters, 'azimuth', -180, 180, 0.1).onChange(updateSun)
//folderSky.open()

window.addEventListener('resize', onWindowResize)

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()

    renderer.setSize(window.innerWidth, window.innerHeight)
}

const onKeyDown = function (event) {
    switch (event.code) {
        case 'KeyW':
            if (!controlsChanging) {
                cameraLerp = true
            }
            if (floaters[controlledBoatId].power < 1) {
                floaters[controlledBoatId].power += 0.01
            }
            break
        case 'KeyA':
            if (!controlsChanging) {
                cameraLerp = true
            }
            floaters[controlledBoatId].heading += 0.05
            break
        case 'KeyS':
            if (!controlsChanging) {
                cameraLerp = true
            }
            if (floaters[controlledBoatId].power > -1) {
                floaters[controlledBoatId].power -= 0.01
            }
            break
        case 'KeyD':
            if (!controlsChanging) {
                cameraLerp = true
            }
            floaters[controlledBoatId].heading -= 0.05
            break
    }
}
document.addEventListener('keydown', onKeyDown, false)

const clock = new THREE.Clock()
let delta = 0

function animate() {
    requestAnimationFrame(animate)
    delta = clock.getDelta()

    floaters.forEach((f) => {
        f.update(delta)
        // f.sphereMesh.visible = false
        // floaters.forEach((f2) => {
        //     if (f !== f2 && f.collisionSphere.intersectsSphere(f2.collisionSphere)) {
        //         f.sphereMesh.visible = true
        //     }
        // })
    })

    if (floaters[controlledBoatId]) {
        earth.position.x = -floaters[controlledBoatId].object.position.x
        earth.position.z = -floaters[controlledBoatId].object.position.z

        boatDataText =
            'pwr:' +
            floaters[controlledBoatId].power.toFixed(2) +
            ' ms:' +
            floaters[controlledBoatId].ms.toFixed(2) +
            ` kts:` +
            (floaters[controlledBoatId].ms * 1.94384).toFixed(2) +
            ' hdg:' +
            -((floaters[controlledBoatId].heading / Math.PI) * 180).toFixed(2)
        boatDataElem.innerText = boatDataText

        if (cameraLerp) {
            const v = new THREE.Vector3()
            followCamPivot.getWorldPosition(v)
            camera.position.lerp(v, 0.025)
            controls.target.y = floaters[controlledBoatId].object.position.y + 2
        }
    }

    controls.update()

    gerstnerWater.update(delta)

    render()

    makeVisible(7, divisor)
    locationDataText =
        ((earth.position.z / divisor) * divisorMultiplier).toFixed(6) +
        ' ' +
        ((-earth.position.x / divisor) * divisorMultiplier).toFixed(6)
    locationDataElem.innerText = locationDataText

    stats.update()
}

function render() {
    renderer.render(scene, camera)
}

animate()