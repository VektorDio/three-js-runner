import * as THREE from 'three';
import {loader, moveCameraTo, colorObject, setCastShadow, setReceiveShadow} from '../helpers';
import {AnimationClip} from "three";
import TWEEN, { Tween } from "@tweenjs/tween.js";

enum PLAYER_ANIMATIONS {
    WIN = 0,
    SMASH_HEAD = 1,
    FALL = 2,
    IDLE = 3,
    RUN = 4,
}

enum COLORS {
    BLUE = 'blue',
    ORANGE = '#ed7811',
    PURPLE = 'purple',
}

const minBrains = 2
const maxBrains = 8
const brainChance = 0.7

export class GameScene extends THREE.Scene {
    isGameStarted = false;
    paused = false;
    score = 0;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    playerAnimation: THREE.AnimationMixer | null = null;
    playerAnimations: AnimationClip[] = []
    clock = new THREE.Clock();
    track: THREE.Object3D[] = [];
    trackSegment: THREE.Object3D | null = null;
    brainModel: THREE.Object3D | null = null;
    player: THREE.Object3D | null = null;

    constructor(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
        super();
        this.camera = camera;
        this.renderer = renderer;

        this.setupInitialScene();
    }

    async setupInitialScene() {
        // Starting camera position
        this.camera.position.set(3, 6, 10);
        this.camera.lookAt(0, 0, 0);

        // Adding lights and shadows
        this.setupLights()

        // Fog and background
        this.background = new THREE.Color('#508ef2');
        this.fog = new THREE.Fog( 'white', 20, 120 );

        // Load and set all assets
        const [playerData, brainData, trackSegmentData] = await Promise.all([
            loader('./assets/Stickman.glb'),
            loader('./assets/Brain.glb'),
            loader('./assets/TrackFloor.glb'),
        ]);

        this.player = playerData.scene;
        this.brainModel = brainData.scene;
        this.trackSegment = trackSegmentData.scene;

        // Extracting animations
        this.playerAnimations = playerData.animations

        // Enabling shadows on assets
        setCastShadow(this.player, true)
        setCastShadow(this.brainModel, true)
        setReceiveShadow(this.trackSegment, true)

        // Configuring player
        // Disable plane behind the head
        this.player.children[0].children[0].visible = false;
        colorObject(this.player, COLORS.ORANGE);
        this.player.rotation.y = Math.PI;
        this.add(this.player);

        // Animating player
        this.playerAnimation = new THREE.AnimationMixer(this.player);
        this.playerAnimation.clipAction(this.playerAnimations[PLAYER_ANIMATIONS.IDLE]).play();

        // Load and spawn track
        this.trackSegment!.position.z = 10
        for (let i = 0; i < 15; i++) {
            const newTrack = new THREE.Object3D();
            newTrack.copy(this.trackSegment!, true);
            newTrack.translateZ(i * -25);

            if (i % 2) {
                this.generateBrains(newTrack);
            }
            this.track[i] = newTrack;
            this.add(newTrack);
        }

        // Add controls
        this.detectControls()
    }

    setupLights() {
        const directionalLight = new THREE.DirectionalLight( 0xffffff, 4 );

        directionalLight.position.set( 3, 10, 10 );
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024 * 6;
        directionalLight.shadow.mapSize.height = 1024 * 6;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 100;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;

        this.add( directionalLight );

        // this.add( new THREE.CameraHelper( directionalLight.shadow.camera ) );

        const ambientLight = new THREE.AmbientLight(0xffffff);
        this.add( ambientLight );
    }

    detectControls() {
        let touchstartX = 0
        let touchendX = 0

        const checkDirection = () => {
            if (touchendX < touchstartX) {
                this.moveLeft()
            }
            if (touchendX > touchstartX) {
                this.moveRight()
            }
        }

        document.addEventListener('touchstart', e => {
            touchstartX = e.changedTouches[0].screenX
        })

        document.addEventListener('touchend', e => {
            touchendX = e.changedTouches[0].screenX
            if (!this.isGameStarted) {
                this.startGame();
            } else if (!this.paused) {
                checkDirection()
            }
        })

        // Add event listeners
        window.onblur = () => {
            this.handlePause(true)
        }

        // Game start on mouse start
        document.addEventListener("mousedown", () => {
            this.startGame()
        })

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                this.handlePause(!this.paused)
            }
            if (!this.paused) {
                if (e.code === 'ArrowLeft') {
                    this.moveLeft()
                }
                if (e.code === 'ArrowRight') {
                    this.moveRight()
                }
            }
        })

        document.getElementById('play')!.addEventListener('mousedown', () => {
            this.handlePause(true)
        })

        document.getElementById('pause')!.addEventListener('mousedown', () => {
            this.handlePause(false)
        })
    }

    handlePause(pause: boolean) {
        if (!this.isGameStarted) return

        this.paused = pause

        if (this.paused) {
            document.getElementById('play')!.style.visibility = 'hidden';
            document.getElementById('pause')!.style.visibility = 'visible';
        } else {
            document.getElementById('play')!.style.visibility = 'visible';
            document.getElementById('pause')!.style.visibility = 'hidden';
        }
    }

    moveLeft() {
        if (!this.player) return

        if (this.player.position.x !== -3) {
            const tweenLeft = new TWEEN.Tween(this.player.position)
                .to({ x: this.player.position.x - 3 }, 200)
                .easing(TWEEN.Easing.Quadratic.Out)
                .onUpdate(() => {
                    if (this.player!.position.x <= -3) {
                        this.player!.position.x = -3;
                    }
                })
            tweenLeft.start();
        }
    }

    moveRight() {
        if (!this.player) return

        if (this.player.position.x !== 3) {
            const tweenRight = new Tween(this.player.position)
                .to({ x: this.player.position.x + 3 }, 200)
                .easing(TWEEN.Easing.Quadratic.Out)
                .onUpdate(() => {
                    if (this.player!.position.x >= 3) {
                        this.player!.position.x = 3;
                    }
                })
            tweenRight.start();
        }
    }

    generateBrains(track: THREE.Object3D) {
        // Brains have 70% chance to generate
        if (Math.random() <= brainChance) return;

        const numberOfBrains = Math.floor(Math.random() * (maxBrains - minBrains) + minBrains);

        const laneXPositions = [-3, 0, 3];
        const colorValues = [COLORS.BLUE, COLORS.ORANGE, COLORS.PURPLE];
        let colorIndex = 0;

        for (let i = 0; i < numberOfBrains; i++) {
            const brain = new THREE.Object3D();
            brain.copy(this.brainModel!, true);

            brain.scale.set(2, 2, 2);
            brain.position.set(laneXPositions[Math.floor(Math.random() * laneXPositions.length)], 1, -i * 5);

            // Coloring brain
            colorObject(brain, colorValues[colorIndex]);

            // Adding some metadata
            brain.userData.color = colorValues[colorIndex];
            brain.name = 'Brain'

            // Cycling through colors
            colorIndex = (colorIndex + 1) % colorValues.length;

            track.add(brain);
        }
    }

    update() {
        const delta = this.clock.getDelta();

        if (!this.paused) {
            this.playerAnimation?.update(delta);

            if (this.isGameStarted) {
                this.updateTracks(delta);
                this.detectCollisions();
                document.getElementById('scoreBoard')!.innerHTML = `Score: ` + this.score
            }

            TWEEN.update();
        }
    }

    updateTracks(delta: number) {
        this.track.forEach((track) => {
            track.position.z += 15 * delta;

            // Respawn track if it`s not visible anymore
            if (track.position.z > 50) {
                track.position.z -= 250;

                // All brains are connected to track segments, so when track disappear we clear all brains and generate new
                const brains = track.children.filter((child) => child.name === 'Brain');
                track.remove(...brains);
                this.generateBrains(track);
            }
        });
    }

    detectCollisions() {
        if (!this.player) return
        const scaledPlayer = this.player.clone(true)
        scaledPlayer.scale.set(0.6, 0.6, 0.6);
        const playerBox = new THREE.Box3().setFromObject(scaledPlayer);


        this.track.forEach((track) => {
            track.children.forEach((child) => {
                if (child.name === 'Brain' && child.visible) {
                    const brainBox = new THREE.Box3().setFromObject(child);

                    // Hide brain and recolor player
                    if (playerBox.intersectsBox(brainBox)) {
                        child.visible = false;
                        colorObject(this.player!, child.userData.color);
                        this.score += 1
                    }
                }
            });
        });
    }

    startGame() {
        if (!this.isGameStarted) {
            this.isGameStarted = true;
            this.playerAnimation?.clipAction(this.playerAnimations[PLAYER_ANIMATIONS.RUN]).play();
            moveCameraTo(this.camera, 0, 6, 10);
            document.getElementById('startingMenu')!.style.display = 'none';
            document.getElementById('play')!.style.visibility = 'visible';
            document.getElementById('scoreBoard')!.style.visibility = 'visible'
        }
    }
}

