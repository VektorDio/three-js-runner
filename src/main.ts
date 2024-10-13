import './style.css'
import * as THREE from 'three';
import {GameScene} from "./scenes/StartScene.ts";
// import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg') as HTMLCanvasElement,
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// const controls = new OrbitControls( camera, renderer.domElement );
// controls.update();

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize);

const gameScene = new GameScene(camera, renderer);

function animate() {
    requestAnimationFrame(animate);

    gameScene.update();

    //controls.update();
    renderer.render(gameScene, camera);
}

animate();



