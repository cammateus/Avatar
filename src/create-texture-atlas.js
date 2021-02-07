import * as THREE from "three";

export const createTextureAtlas = (function () {
  const ATLAS_SIZE_PX = 2048;
  const ATLAS_SQRT = 4;
  const IMAGE_SIZE = ATLAS_SIZE_PX / ATLAS_SQRT;
  const MAP_NAMES = [
    "map",
    "aoMap",
    "roughnessMap",
    "metalnessMap",
    // "lightMap",
    // "emissiveMap",
    // "bumpMap",
    // "displacementMap",
    // "alphaMap",
    // "envMap",
  ];
  const VALID_IMAGE_TYPES = [
    CSSImageValue,
    HTMLImageElement,
    SVGImageElement,
    HTMLVideoElement,
    HTMLCanvasElement,
    ImageBitmap,
    OffscreenCanvas,
  ];
  const ctx = Object.fromEntries(
    MAP_NAMES.map((name) => {
      const canvas = document.createElement("canvas");
      canvas.width = ATLAS_SIZE_PX;
      canvas.height = ATLAS_SIZE_PX;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "gray";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add canvases to document for debugging
      // document.body.append(name);
      // document.body.append(canvas);
      return [name, ctx];
    })
  );

  return async function createTextureAtlas({ meshes }) {
    const uvs = new Map(
      meshes.map((mesh, i) => {
        const uv = new THREE.Vector2(i % ATLAS_SQRT, Math.floor(i / ATLAS_SQRT)).multiplyScalar(1 / ATLAS_SQRT);

        MAP_NAMES.forEach((name) => {
          const image = mesh.material && mesh.material[name] && mesh.material[name].image;
          if (image && VALID_IMAGE_TYPES.some((type) => image instanceof type)) {
            ctx[name].drawImage(image, uv.x * ATLAS_SIZE_PX, uv.y * ATLAS_SIZE_PX, IMAGE_SIZE, IMAGE_SIZE);
          }
        });

        return [mesh, uv];
      })
    );

    const images = await Promise.all(
      MAP_NAMES.map(async (name) => {
        const url = await new Promise((resolve) => {
          ctx[name].canvas.toBlob((blob) => {
            resolve(URL.createObjectURL(blob));
          });
        });

        const img = document.createElement("img");
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = url;
        });
        // Add image to document for debugging
        document.body.append(img);
        return img;
      })
    );

    return { images, uvs };
  };
})();
