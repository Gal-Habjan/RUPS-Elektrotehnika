export function openPropertiesPanel(
    scene,

    fields,
    initialValues = {},
    onSave,
    onCancel
) {
    // Create a centered DOM modal panel (ignore worldX/worldY).
    const canvas = scene.game && scene.game.canvas ? scene.game.canvas : null;
    if (!canvas) {
        console.warn("No canvas found for properties panel");
        // still create centered panel relative to viewport
    }

    const panel = document.createElement("div");
    panel.style.position = "fixed";
    panel.style.left = "50%";
    panel.style.top = "50%";
    panel.style.transform = "translate(-50%, -50%)";
    panel.style.width = "45vw"; // 40% of viewport width
    panel.style.minWidth = "220px";
    panel.style.maxWidth = "900px";
    panel.style.maxHeight = "80vh"; // keep within viewport
    panel.style.overflowY = "auto";
    panel.style.padding = "12px";
    panel.style.background = "rgba(30,30,30,0.95)";
    panel.style.color = "#fff";
    panel.style.border = "1px solid #444";
    panel.style.borderRadius = "6px";
    panel.style.zIndex = 9999;
    panel.style.fontFamily = "Arial, sans-serif";

    const title = document.createElement("div");
    title.textContent = "Properties";
    title.style.fontWeight = "bold";
    title.style.marginBottom = "8px";
    panel.appendChild(title);

    const inputs = {};

    // Helper: derive a key from a label if `field.key` is not provided.
    // E.g. "Voltage Drop (V)" -> "voltageDrop"
    function labelToKey(label) {
        if (!label || typeof label !== "string") return "";
        const cleaned = label.replace(/[^a-zA-Z0-9 ]+/g, "").trim();
        if (!cleaned) return "";
        const parts = cleaned.split(/\s+/);
        return parts
            .map((p, i) =>
                i === 0 ? p.toLowerCase() : p[0].toUpperCase() + p.slice(1)
            )
            .join("");
    }

    fields.forEach((field) => {
        const row = document.createElement("div");
        row.style.marginBottom = "8px";

        const label = document.createElement("label");
        label.textContent = field.label || field.key;
        label.style.display = "block";
        label.style.fontSize = "13px";
        label.style.marginBottom = "4px";
        row.appendChild(label);

        const key = field.key || labelToKey(field.label || "");

        if (field.type === "number" || field.type === "text") {
            const input = document.createElement("input");
            input.type = field.type === "number" ? "number" : "text";

            // Support initialValues that are either plain value or { value, automatic }
            let initial =
                typeof initialValues[key] !== "undefined"
                    ? initialValues[key]
                    : field.default || "";
            let initialAutomatic = false;
            if (initial && typeof initial === "object" && "value" in initial) {
                // support both legacy `pivot` and new `automatic` flags for compatibility
                initialAutomatic = !!initial.automatic || !!initial.pivot;
                initial = initial.value;
            }

            input.value = initial;
            input.style.width = "98%";
            input.style.padding = "6px";
            input.style.border = "1px solid #666";
            input.style.borderRadius = "4px";
            input.style.background = "#222";
            input.style.color = "#fff";
            row.appendChild(input);

            // If this field supports automatic mode, add a checkbox that toggles the input
            if (field.automatic) {
                const automaticWrap = document.createElement("div");
                automaticWrap.style.marginTop = "6px";
                const automaticLabel = document.createElement("label");
                automaticLabel.style.fontSize = "12px";
                automaticLabel.style.display = "inline-flex";
                automaticLabel.style.alignItems = "center";

                const automaticCheckbox = document.createElement("input");
                automaticCheckbox.type = "checkbox";
                automaticCheckbox.checked = !!initialAutomatic;
                automaticCheckbox.style.marginRight = "6px";
                automaticCheckbox.onchange = () => {
                    input.disabled = automaticCheckbox.checked;
                    input.style.opacity = automaticCheckbox.checked
                        ? "0.6"
                        : "1";
                };

                // apply initial disabled state
                input.disabled = automaticCheckbox.checked;
                input.style.opacity = automaticCheckbox.checked ? "0.6" : "1";

                automaticLabel.appendChild(automaticCheckbox);
                automaticLabel.appendChild(
                    document.createTextNode("Automatic")
                );
                automaticWrap.appendChild(automaticLabel);
                row.appendChild(automaticWrap);

                inputs[key] = { input: input, automatic: automaticCheckbox };
            } else {
                inputs[key] = input;
            }
        } else if (field.type === "select" || field.type === "radio") {
            const opts = field.options || [];
            const wrap = document.createElement("div");
            opts.forEach((opt) => {
                const id = `prop_${key}_${opt}`;
                const labelEl = document.createElement("label");
                labelEl.style.marginRight = "8px";
                labelEl.style.fontSize = "13px";

                const input = document.createElement("input");
                input.type = field.type === "select" ? "select" : "radio";
                input.name = `prop_${key}`;
                input.value = opt;
                input.id = id;
                input.style.marginRight = "4px";

                if (typeof initialValues[key] !== "undefined") {
                    if (initialValues[key] === opt) input.checked = true;
                } else if (field.default === opt) {
                    input.checked = true;
                }

                labelEl.appendChild(input);
                labelEl.appendChild(document.createTextNode(opt));
                wrap.appendChild(labelEl);
            });
            row.appendChild(wrap);
            inputs[key] = wrap; // we'll read radio by name
        }

        panel.appendChild(row);
    });

    const buttons = document.createElement("div");
    buttons.style.display = "flex";
    buttons.style.justifyContent = "flex-end";
    buttons.style.gap = "8px";

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.padding = "6px 10px";
    cancelBtn.style.border = "1px solid #666";
    cancelBtn.style.background = "#444";
    cancelBtn.style.color = "#fff";
    cancelBtn.style.borderRadius = "4px";
    cancelBtn.onclick = () => {
        cleanup();
        if (typeof onCancel === "function") onCancel();
    };

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.style.padding = "6px 10px";
    saveBtn.style.border = "1px solid #0a84ff";
    saveBtn.style.background = "#0a84ff";
    saveBtn.style.color = "#fff";
    saveBtn.style.borderRadius = "4px";
    saveBtn.onclick = () => {
        const result = {};
        fields.forEach((field) => {
            const key = field.key || labelToKey(field.label || "");
            if (field.type === "number") {
                const entry = inputs[key];
                if (entry && entry.input && entry.automatic) {
                    const val = entry.input.value;
                    const num = parseFloat(val);
                    result[key] = {
                        value: isNaN(num) ? null : num,
                        automatic: !!entry.automatic.checked,
                    };
                } else {
                    const val = inputs[key] ? inputs[key].value : null;
                    const num = parseFloat(val);
                    result[key] = isNaN(num) ? null : num;
                }
            } else if (field.type === "text") {
                const entry = inputs[key];
                if (entry && entry.input && entry.automatic) {
                    result[key] = {
                        value: entry.input.value,
                        automatic: !!entry.automatic.checked,
                    };
                } else {
                    result[key] = inputs[key] ? inputs[key].value : "";
                }
            } else if (field.type === "radio") {
                const radios = panel.querySelectorAll(
                    `input[name=prop_${key}]`
                );
                let found = null;
                radios.forEach((r) => {
                    if (r.checked) found = r.value;
                });
                result[key] = found;
            } else if (field.type === "select") {
                const radios = panel.querySelectorAll(
                    `input[name=prop_${key}]`
                );
                let found = null;
                radios.forEach((r) => {
                    if (r.checked) found = r.value;
                });
                result[key] = found;
            }
        });
        cleanup();
        if (typeof onSave === "function") onSave(result);
    };

    buttons.appendChild(cancelBtn);
    buttons.appendChild(saveBtn);
    panel.appendChild(buttons);

    document.body.appendChild(panel);

    function cleanup() {
        if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
    }

    return { destroy: cleanup };
}
