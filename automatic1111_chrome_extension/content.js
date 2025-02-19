chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "applySettings") {
        console.log("[content.js] Received applySettings message:", message);
        const s = message.settings;

        // Helper function: set a field’s value, simulate events, and log the action.
        function setFieldValue(selector, value) {
            const elem = document.querySelector(selector);
            if (elem) {
                console.log(`[content.js] Setting "${selector}" to:`, value);
                try {
                    elem.focus();
                    elem.value = value;
                    elem.dispatchEvent(new Event("input", {
                        bubbles: true
                    }));
                    elem.dispatchEvent(new Event("change", {
                        bubbles: true
                    }));
                    elem.blur();
                    console.log(`[content.js] Successfully updated "${selector}"`);
                } catch (error) {
                    console.error(`[content.js] Error updating "${selector}":`, error);
                }
            } else {
                console.warn(`[content.js] Element not found for selector: "${selector}"`);
            }
        }

        // Log out settings for debugging
        console.log("[content.js] Applying settings:", s);

        // Set Prompt and Negative Prompt (assumed to be textareas)
        setFieldValue("#img2img_prompt textarea", s.prompt);
        setFieldValue("#img2img_neg_prompt textarea", s.negativePrompt);

        // Set the model using the AUTOMATIC1111 HTML element:
        setFieldValue("#setting_sd_model_checkpoint input", s.model);

        // If using Refiner, set the refiner model (assumed to be a <select>)
        if (s.useRefiner) {
            setFieldValue("#img2img_checkpoint select", s.refinerModel);
        } else {
            console.log("[content.js] Refiner not enabled.");
        }

        // Sampling Method – target inner <input> if that works better.
        setFieldValue("#img2img_sampling input", s.samplingMethod);

        // Schedule Type – using the inner input element.
        setFieldValue("#img2img_scheduler input", s.scheduleType);

        // Steps (assumed to be controlled by an <input> inside #img2img_steps)
        setFieldValue("#img2img_steps input", s.steps);

        // Guidance Scale (CFG) – assumed to be controlled by an <input>
        setFieldValue("#img2img_cfg_scale input", s.guidance);

        // Denoising Strength – send s.strength directly (adjust if conversion is needed)
        setFieldValue("#img2img_denoising_strength input", s.strength);

        // Seed
        setFieldValue("#img2img_seed input", s.seed);

        // Image Width & Height
        setFieldValue("#img2img_width input", s.width);
        setFieldValue("#img2img_height input", s.height);

        console.log("[content.js] Finished applying settings.");
        sendResponse({
            status: "Settings applied in content script"
        });
    }
});