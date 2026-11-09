import { MeshPhysicalMaterial } from 'three'
import { simplexNoise } from './noise'

export interface BlobUniforms {
  uTime: { value: number }
  uAmplitude: { value: number }
  uFrequency: { value: number }
  uSeed: { value: number }
}

const displacementShader = /* glsl */ `
uniform float uTime;
uniform float uAmplitude;
uniform float uFrequency;
uniform float uSeed;

${simplexNoise}

vec3 displaceOnSphere(vec3 direction) {
  vec3 point = direction * uFrequency + uSeed;
  float warp = snoise(point * 0.55 + uTime * 0.11);
  float folds = snoise(point + warp * 1.1 + uTime * 0.17);
  float ripples = snoise(point * 1.7 - uTime * 0.09) * 0.1;
  return direction * (1.0 + uAmplitude * (folds + ripples));
}
`

// Normals are rebuilt from two nearby displaced points so the lighting follows the moving surface.
const normalShader = /* glsl */ `
vec3 sphereDirection = normalize(position);
vec3 helper = abs(sphereDirection.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
vec3 tangentDirection = normalize(cross(sphereDirection, helper));
vec3 bitangentDirection = cross(sphereDirection, tangentDirection);
const float NORMAL_STEP = 0.012;
vec3 displaced = displaceOnSphere(sphereDirection);
vec3 towardTangent = displaceOnSphere(normalize(sphereDirection + tangentDirection * NORMAL_STEP));
vec3 towardBitangent = displaceOnSphere(normalize(sphereDirection + bitangentDirection * NORMAL_STEP));
vec3 objectNormal = normalize(cross(towardTangent - displaced, towardBitangent - displaced));
`

export function createBlobMaterial(uniforms: BlobUniforms): MeshPhysicalMaterial {
  const material = new MeshPhysicalMaterial({
    metalness: 0.1,
    roughness: 0.26,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    iridescence: 1,
    iridescenceIOR: 1.45,
    iridescenceThicknessRange: [180, 520],
    envMapIntensity: 0.35,
  })

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${displacementShader}`)
      .replace('#include <beginnormal_vertex>', normalShader)
      .replace('#include <begin_vertex>', 'vec3 transformed = displaced;')
  }
  return material
}
