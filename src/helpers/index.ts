import {GLTF} from "three/examples/jsm/loaders/GLTFLoader.js";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {Material, Mesh, MeshStandardMaterial, Object3D, PerspectiveCamera} from "three";
import TWEEN from "@tweenjs/tween.js";

export function moveCameraTo(camera: PerspectiveCamera, targetX: number, targetY: number, targetZ: number, duration = 1000) {
    const targetPosition = { x: targetX, y: targetY, z: targetZ };

    new TWEEN.Tween(camera.position)
        .to(targetPosition, duration)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(() => {
            camera.lookAt(0, 0, 0);
        })
        .start();
}

export function colorObject(object: Object3D, color: string): void {
    object.traverse((child: Object3D) => {
        if ((child as Mesh).isMesh) {
            const mesh = child as Mesh;

            // Clone the material to ensure each mesh has its own material instance
            if (Array.isArray(mesh.material)) {
                mesh.material = mesh.material.map((material: Material) => material.clone());
            } else {
                mesh.material = mesh.material.clone();
            }

            // Apply the color
            const material = mesh.material as MeshStandardMaterial; // Ensure the material supports color
            if (material.color) {
                material.color.set(color);
                material.needsUpdate = true;  // Mark the material for update
            }
        }
    });
}

export function setCastShadow(object: Object3D, shadowEnabled: boolean): void {
    object.traverse((child: Object3D) => {
        if ((child as Mesh).isMesh) {
            const mesh = child as Mesh;
            mesh.castShadow = shadowEnabled;
        }
    });
}

export function setReceiveShadow(object: Object3D, shadowEnabled: boolean): void {
    object.traverse((child: Object3D) => {
        if ((child as Mesh).isMesh) {
            const mesh = child as Mesh;
            mesh.receiveShadow = shadowEnabled;
        }
    });
}

export async function loader(path: string): Promise<GLTF> {
    const gltfLoader = new GLTFLoader()
    return await gltfLoader.loadAsync(path)
}

