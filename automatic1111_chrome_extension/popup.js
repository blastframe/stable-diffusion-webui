// Hardcoded model lists for demonstration.
const BASE_MODELS = [
  "juggernautXL_juggXILightningByRD.safetensors",
  "ponyDiffusionV6XL_v6StartWithThisOne.safetensors",
  "sd_xl_base_1.0_0.9vae.safetensors",
  "sd_xl_base_1.0.safetensors",
  "sdxl_vae.safetensors",
];

const REFINER_MODELS = [
  "sd_xl_refiner_1.0_0.9vae.safetensors [7440042bbd]",
  "sd_xl_refiner_1.0_0.9vae.safetensors [8d0ce6c016]"
];

// Define aspect ratio mapping: value => ratio (width/height)
const ASPECT_RATIOS = {
  "Custom": null,
  "1:1": 1,
  "16:9": 16 / 9,
  "4:3": 4 / 3,
  "3:2": 3 / 2,
  "21:9": 21 / 9
};

// Default settings with script field and variation fields
const DEFAULT_SETTINGS = {
  prompt: `A line art drawing of an old racecar with a driver. The car is seen from the rear and is in the middle of a race. The driver is wearing a helmet and goggles and is holding the steering wheel. The car has four large wheels and a long, sleek body. The drawing is done in black and white and is very detailed.`,
  negativePrompt: `blurry, noisy, low-resolution, distorted, disproportionate, unrealistic lighting, oversaturated, deformed, extra limbs, extra fingers, mutated hands, bad anatomy, low detail, poorly drawn, pixelated, bad composition, messy, rough sketch, overexposed, underexposed, washed out, unnatural shadows, bad perspective, low-quality render`,
  model: "sd_xl_base_1.0.safetensors [31e35c80fc]",
  useRefiner: false,
  refinerModel: "sd_xl_refiner_1.0_0.9vae.safetensors [7440042bbd]",
  samplingMethod: "DPM++ 2M SDE",
  scheduleType: "Karras",
  script: "None", // This field will be saved under "script"
  steps: 25,
  guidance: 10,
  strength: 0.1,
  seed: -1,
  width: 512,
  height: 512,
  aspectRatio: "1:1",
  // Variation fields
  useVariation: false,
  variationSeed: -1,
  variationStrength: 0,
  scriptName: "None" // (Optional: if you want to store this separately)
};

async function loadSettingsIntoUI() {
  const stored = await chrome.storage.local.get(["auto1111Settings"]);
  const s = stored.auto1111Settings || DEFAULT_SETTINGS;

  // Prompt & Negative Prompt
  document.getElementById("prompt").value = s.prompt;
  document.getElementById("negativePrompt").value = s.negativePrompt;

  // Model
  const modelSelect = document.getElementById("modelSelect");
  modelSelect.innerHTML = "";
  BASE_MODELS.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    modelSelect.appendChild(opt);
  });
  modelSelect.value = s.model;

  // Refiner
  document.getElementById("useRefiner").checked = s.useRefiner;
  const refinerSelect = document.getElementById("refinerSelect");
  refinerSelect.innerHTML = "";
  REFINER_MODELS.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    refinerSelect.appendChild(opt);
  });
  refinerSelect.value = s.refinerModel || REFINER_MODELS[0];
  refinerSelect.style.display = s.useRefiner ? "block" : "none";

  // Sampling method and schedule
  document.getElementById("samplingMethod").value = s.samplingMethod;
  document.getElementById("scheduleType").value = s.scheduleType;

  // Script
  document.getElementById("scriptSelect").value = s.script || "None";

  // Steps
  document.getElementById("stepsRange").value = s.steps;
  document.getElementById("stepsNumber").value = s.steps;

  // Guidance
  document.getElementById("guidanceRange").value = s.guidance;
  document.getElementById("guidanceNumber").value = s.guidance;

  // Denoising strength
  document.getElementById("strengthRange").value = s.strength;
  document.getElementById("strengthNumber").value = s.strength;

  // Seed
  document.getElementById("seedRange").value = s.seed;
  document.getElementById("seedNumber").value = s.seed;

  // Variation
  document.getElementById("useVariation").checked = s.useVariation;
  document.getElementById("variationContainer").style.display = s.useVariation ? "block" : "none";
  document.getElementById("variationSeedNumber").value = s.variationSeed;
  document.getElementById("variationStrengthRange").value = s.variationStrength;
  document.getElementById("variationStrengthNumber").value = s.variationStrength;

  // Aspect Ratio
  document.getElementById("aspectRatioSelect").value = s.aspectRatio || "Custom";

  // Width & Height
  document.getElementById("widthRange").value = s.width;
  document.getElementById("widthNumber").value = s.width;
  document.getElementById("heightRange").value = s.height;
  document.getElementById("heightNumber").value = s.height;

  // (Optional) Also set scriptName if using separate field
  document.getElementById("scriptSelect").value = s.scriptName || s.script || "None";
}

function attachSliderBinding(rangeId, numberId, dimensionUpdateCallback) {
  const rangeElem = document.getElementById(rangeId);
  const numberElem = document.getElementById(numberId);
  rangeElem.addEventListener("input", () => {
    numberElem.value = rangeElem.value;
    if (dimensionUpdateCallback) dimensionUpdateCallback();
  });
  numberElem.addEventListener("input", () => {
    rangeElem.value = numberElem.value;
    if (dimensionUpdateCallback) dimensionUpdateCallback();
  });
}

// Variation strength slider binding
function attachVariationSlider() {
  const rangeElem = document.getElementById("variationStrengthRange");
  const numberElem = document.getElementById("variationStrengthNumber");
  rangeElem.addEventListener("input", () => {
    numberElem.value = rangeElem.value;
  });
  numberElem.addEventListener("input", () => {
    rangeElem.value = numberElem.value;
  });
}

// Flag to avoid recursive dimension updates
let isUpdatingDimensions = false;

function updateDimensionsFromWidth() {
  const aspectRatio = document.getElementById("aspectRatioSelect").value;
  if (aspectRatio === "Custom") return;
  const ratio = ASPECT_RATIOS[aspectRatio];
  if (!ratio) return;
  if (isUpdatingDimensions) return;
  isUpdatingDimensions = true;
  const widthVal = parseInt(document.getElementById("widthNumber").value);
  if (!isNaN(widthVal)) {
    const newHeight = Math.round(widthVal / ratio);
    document.getElementById("heightNumber").value = newHeight;
    document.getElementById("heightRange").value = newHeight;
  }
  isUpdatingDimensions = false;
}

function updateDimensionsFromHeight() {
  const aspectRatio = document.getElementById("aspectRatioSelect").value;
  if (aspectRatio === "Custom") return;
  const ratio = ASPECT_RATIOS[aspectRatio];
  if (!ratio) return;
  if (isUpdatingDimensions) return;
  isUpdatingDimensions = true;
  const heightVal = parseInt(document.getElementById("heightNumber").value);
  if (!isNaN(heightVal)) {
    const newWidth = Math.round(heightVal * ratio);
    document.getElementById("widthNumber").value = newWidth;
    document.getElementById("widthRange").value = newWidth;
  }
  isUpdatingDimensions = false;
}

// Reset the UI to default values.
async function resetToDefaults() {
  await chrome.storage.local.set({
    auto1111Settings: DEFAULT_SETTINGS
  });
  loadSettingsIntoUI();
}

// Define the negative prompt strings for each category.
const negativePrompts = {
  universal: "worst quality, low quality, blurry, distortion, text, watermark, logo, extra digits, cropped, jpeg artifacts, signature, username, error, sketch, duplicate, ugly, monochrome, horror, mutation, disgusting, bad anatomy, bad proportions, deformed, disconnected limbs, out of frame, out of focus, disfigured, extra arms, extra limbs, extra hands, fused fingers, gross proportions, long neck, jpeg, malformed limbs, mutated, mutated hands, mutated limbs, missing arms, missing fingers, poorly drawn hands, poorly drawn face, collage, pixelated, grainy, color aberration, amputee, autograph, bad illustration, beyond the borders, blank background, body out of frame, boring background, branding, cut off, dismembered, disproportioned, distorted, draft, duplicated features, extra fingers, extra legs, fault, flaw, hazy, identifying mark, improper scale, incorrect physiology, incorrect ratio, indistinct, kitsch, low resolution, macabre, malformed, misshapen, missing hands, missing legs, mistake, morbid, mutilated, off-screen, outside the picture, poorly drawn feet, printed words, render, repellent, replicate, reproduce, script, shortened, sign, split image, squint, storyboard, tiling, trimmed, unfocused, unattractive, unnatural pose, unsightly, written language",
  backgrounds: "worst quality, low quality, low res, blurry, distortion, text, watermark, logo, banner, cropped, jpeg artifacts, error, sketch, duplicate, ugly, monochrome, horror, geometry, mutation, bad proportions, bad quality, deformed, out of frame, out of focus, pixel, pixelated, grainy, color aberration, blank background, boring background, branding, cut off, distorted, draft, duplicated features, fault, flaw, grains, hazy, improper scale, incorrect ratio, indistinct, kitsch, low resolution, macabre, malformed, mark, mistake, off",
  anime: "bad anatomy, bad hands, three hands, three legs, bad arms, missing legs, missing arms, poorly drawn face, bad face, fused face, cloned face, worst face, out of frame double, three crus, extra crus, fused crus, worst feet, three feet, fused feet, fused thigh, three thigh, extra thigh, worst thigh, missing fingers, extra fingers, ugly fingers, long fingers, horn, realistic photo, extra eyes, huge eyes, 2girl, 2boy, amputation, disconnected limbs",
  realistic: "bad anatomy, bad hands, three hands, three legs, bad arms, missing legs, missing arms, poorly drawn face, poorly rendered hands, bad face, fused face, cloned face, worst face, three crus, extra crus, fused crus, worst feet, three feet, fused feet, fused thigh, three thigh, extra thigh, worst thigh, missing fingers, extra fingers, ugly fingers, long fingers, bad composition, horn, extra eyes, huge eyes, 2girl, amputation, disconnected limbs, cartoon, cg, 3d, unreal, animate, cgi, render, artwork, illustration, 3d render, cinema 4d, artstation, octane render, mutated body parts, painting, oil painting, 2d, sketch, bad photography, bad photo, deviant art, aberrations, abstract, anime, black and white, collapsed, conjoined, creative, drawing, extra windows, harsh lighting, jpeg artifacts, low saturation, monochrome, multiple levels, overexposed, oversaturated, photoshop, rotten, surreal, twisted, UI, underexposed, unnatural, unreal engine, unrealistic, video game, deformed body features",
  face: "poorly drawn face, bad face, fused face, ugly face, worst face, asymmetrical, unrealistic skin texture, bad proportions, out of frame, poorly drawn hands, cloned face, double face",
  hands: "extra digits, extra arms, extra hands, fused fingers, malformed limbs, mutated hands, poorly drawn hands, extra fingers, missing hands, bad hands, three hands, fused hands, too many fingers, missing fingers, deformed hands",
  eyes: "extra eyes, huge eyes, bad eyes, ugly eyes, oversized eyes, imperfect eyes, deformed pupils, deformed iris, cross-eyed",
  portraits: "bad proportions, asymmetric ears, broken wrist, additional limbs, asymmetric, collapsed eyeshadow, altered appendages, broken finger, bad anatomy, elongated throat, double face, conjoined, bad face, broken hand, out of frame, disconnected limb, 3d, bad ears, amputee, cross-eyed, disfigured, cartoon, bad eyes, cloned face, combined appendages, broken leg, copied visage, absent limbs, childish, cropped head, cloned head, desiccated, duplicated features, dismembered, disproportionate, cripple",
  nsfw: "nsfw, nude, nudity, uncensored, explicit content, cleavage, nipples"
};

document.getElementById("negPromptCategory").addEventListener("change", async (e) => {
  const selectedCategory = e.target.value; // Use e.target.value, not this.value
  if (negativePrompts[selectedCategory]) {
    document.getElementById("negativePrompt").value = negativePrompts[selectedCategory];
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  // Bind basic sliders
  attachSliderBinding("stepsRange", "stepsNumber");
  attachSliderBinding("guidanceRange", "guidanceNumber");
  attachSliderBinding("strengthRange", "strengthNumber");
  attachSliderBinding("seedRange", "seedNumber");
  attachSliderBinding("widthRange", "widthNumber", updateDimensionsFromWidth);
  attachSliderBinding("heightRange", "heightNumber", updateDimensionsFromHeight);

  // Variation slider binding
  attachVariationSlider();
  document.getElementById("useVariation").addEventListener("change", (e) => {
    const container = document.getElementById("variationContainer");
    container.style.display = e.target.checked ? "block" : "none";
  });
  document.getElementById("variationSeedRandom").addEventListener("click", () => {
    document.getElementById("variationSeedNumber").value = -1;
  });
  document.getElementById("variationSeedReuse").addEventListener("click", () => {
    console.log("Reuse Variation Seed (placeholder).");
  });

  // Aspect ratio update
  document.getElementById("aspectRatioSelect").addEventListener("change", () => {
    if (document.getElementById("aspectRatioSelect").value !== "Custom") {
      updateDimensionsFromWidth();
    }
  });

  // Refiner toggle
  document.getElementById("useRefiner").addEventListener("change", (e) => {
    const refinerSelect = document.getElementById("refinerSelect");
    refinerSelect.style.display = e.target.checked ? "block" : "none";
  });

  // Load stored/default settings
  await loadSettingsIntoUI();

  // Apply button click
  document.getElementById("applyBtn").addEventListener("click", async () => {
    // First, simulate a click on the "img2img" button to switch tabs.
    const buttons = document.querySelectorAll("button");
    let found = false;
    buttons.forEach(btn => {
      if (btn.textContent.trim() === "img2img") {
        console.log("[popup.js] Found 'img2img' button. Clicking it.");
        btn.click();
        found = true;
      }
    });
    if (!found) {
      console.warn("[popup.js] 'img2img' button not found.");
    }

    const updatedSettings = {
      prompt: document.getElementById("prompt").value,
      negativePrompt: document.getElementById("negativePrompt").value,
      model: document.getElementById("modelSelect").value,
      useRefiner: document.getElementById("useRefiner").checked,
      refinerModel: document.getElementById("refinerSelect").value,
      samplingMethod: document.getElementById("samplingMethod").value,
      scheduleType: document.getElementById("scheduleType").value,
      script: document.getElementById("scriptSelect").value,
      steps: parseInt(document.getElementById("stepsNumber").value),
      guidance: parseFloat(document.getElementById("guidanceNumber").value),
      strength: parseFloat(document.getElementById("strengthNumber").value),
      seed: parseInt(document.getElementById("seedNumber").value),
      width: parseInt(document.getElementById("widthNumber").value),
      height: parseInt(document.getElementById("heightNumber").value),
      aspectRatio: document.getElementById("aspectRatioSelect").value,
      useVariation: document.getElementById("useVariation").checked,
      variationSeed: parseInt(document.getElementById("variationSeedNumber").value),
      variationStrength: parseFloat(document.getElementById("variationStrengthNumber").value)
    };

    await chrome.storage.local.set({
      auto1111Settings: updatedSettings
    });

    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "applySettings",
          settings: updatedSettings
        }, (response) => {
          if (response) {
            console.log("Content script response:", response.status);
          } else {
            console.warn("No response from content script.");
          }
        });
      }
    });
  });

  // Reset button click
  document.getElementById("resetBtn").addEventListener("click", async () => {
    console.log("Reset to Defaults clicked.");
    await resetToDefaults();
  });
});