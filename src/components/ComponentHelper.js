import { Battery } from "../components/battery";
import { Bulb } from "../components/bulb";
import { Wire } from "../components/wire";
import { Ampermeter } from "../components/ampermeter";
import { Voltmeter } from "../components/voltmeter";
import { CircuitGraph } from "../logic/circuit_graph";
import { Node } from "../logic/node";
import { Switch } from "../components/switch";
import { Resistor } from "../components/resistor";
import { ComponentDirection } from "./ComponentDirection.js";
import { createContextMenu } from "../ui/ContextMenu.js";
import { openPropertiesPanel } from "../ui/PropertiesPanel.js";
export function createComponent(workspace, x, y, type, color, wireGraphics) {
    const component = workspace.add.container(x, y);

    // Ensure the browser context menu is disabled for the workspace so
    // right-click can be handled by Phaser. Do this once per workspace.
    if (!workspace._contextMenuDisabled) {
        try {
            if (
                workspace.input &&
                workspace.input.mouse &&
                typeof workspace.input.mouse.disableContextMenu === "function"
            ) {
                workspace.input.mouse.disableContextMenu();
            }
        } catch (e) {
            // ignore
        }

        // Fallback: prevent default on the canvas element if accessible
        try {
            const canvas =
                workspace.game && workspace.game.canvas
                    ? workspace.game.canvas
                    : null;
            if (canvas && !canvas._rupsContextMenuListenerAdded) {
                canvas.addEventListener("contextmenu", (ev) =>
                    ev.preventDefault()
                );
                canvas._rupsContextMenuListenerAdded = true;
            }
        } catch (e) {
            // ignore
        }

        workspace._contextMenuDisabled = true;
    }

    let comp = null;
    let componentImage;
    let id;

    switch (type) {
        case "baterija":
            id = "bat_" + workspace.getRandomInt(1000, 9999);
            comp = new Battery(
                id,
                new Node(id + "_start", -40, 0),
                new Node(id + "_end", 40, 0),
                3.3,
                component
            );
            comp.type = "battery";
            comp.localStart = { x: -40, y: 0 };
            comp.localEnd = { x: 40, y: 0 };
            componentImage = workspace.add
                .image(0, 0, "baterija")
                .setOrigin(0.5)
                .setDisplaySize(100, 100);
            component.add(componentImage);
            component.setData("logicComponent", comp);
            break;

        case "upor":
            id = "res_" + workspace.getRandomInt(1000, 9999);
            comp = new Resistor(
                id,
                new Node(id + "_start", -40, 0),
                new Node(id + "_end", 40, 0),
                1.5,
                component
            );
            comp.type = "resistor";
            comp.localStart = { x: -40, y: 0 };
            comp.localEnd = { x: 40, y: 0 };
            componentImage = workspace.add
                .image(0, 0, "upor")
                .setOrigin(0.5)
                .setDisplaySize(100, 100);
            component.add(componentImage);
            component.setData("logicComponent", comp);
            break;

        case "svetilka":
            id = "bulb_" + workspace.getRandomInt(1000, 9999);
            comp = new Bulb(
                id,
                new Node(id + "_start", -40, 0),
                new Node(id + "_end", 40, 0),
                component
            );
            comp.type = "bulb";
            comp.localStart = { x: -40, y: 0 };
            comp.localEnd = { x: 40, y: 0 };
            componentImage = workspace.add
                .image(0, 0, "svetilka")
                .setOrigin(0.5)
                .setDisplaySize(100, 100);
            component.add(componentImage);
            component.setData("logicComponent", comp);
            break;

        case "stikalo-on":
            id = "switch_" + workspace.getRandomInt(1000, 9999);
            comp = new Switch(
                id,
                new Node(id + "_start", -40, 0),
                new Node(id + "_end", 40, 0),
                true,
                component
            );
            comp.type = "switch";
            comp.localStart = { x: -40, y: 0 };
            comp.localEnd = { x: 40, y: 0 };
            componentImage = workspace.add
                .image(0, 0, "stikalo-on")
                .setOrigin(0.5)
                .setDisplaySize(100, 100);
            component.add(componentImage);
            component.setData("logicComponent", comp);
            break;

        case "stikalo-off":
            id = "switch_" + workspace.getRandomInt(1000, 9999);
            comp = new Switch(
                id,
                new Node(id + "_start", -40, 0),
                new Node(id + "_end", 40, 0),
                false,
                component
            );
            comp.type = "switch";
            comp.localStart = { x: -40, y: 0 };
            comp.localEnd = { x: 40, y: 0 };
            componentImage = workspace.add
                .image(0, 0, "stikalo-off")
                .setOrigin(0.5)
                .setDisplaySize(100, 100);
            component.add(componentImage);
            component.setData("logicComponent", comp);
            break;

        case "žica":
            id = "wire_" + workspace.getRandomInt(1000, 9999);
            // wire option removed; wires are created by dragging between node circles
            break;
        case "ampermeter":
            id = "ammeter_" + workspace.getRandomInt(1000, 9999);
            comp = new Ampermeter(
                id,
                new Node(id + "_start", -40, 0),
                new Node(id + "_end", 40, 0),
                component
            );
            comp.type = "ampermeter";
            comp.localStart = { x: -40, y: 0 };
            comp.localEnd = { x: 40, y: 0 };
            componentImage = workspace.add
                .image(0, 0, "ampermeter")
                .setOrigin(0.5)
                .setDisplaySize(100, 100);
            component.add(componentImage);
            component.setData("logicComponent", comp);
            break;
        case "voltmeter":
            id = "voltmeter_" + workspace.getRandomInt(1000, 9999);
            comp = new Voltmeter(
                id,
                new Node(id + "_start", -40, 0),
                new Node(id + "_end", 40, 0),
                component
            );
            comp.type = "voltmeter";
            comp.localStart = { x: -40, y: 0 };
            comp.localEnd = { x: 40, y: 0 };
            componentImage = workspace.add
                .image(0, 0, "voltmeter")
                .setOrigin(0.5)
                .setDisplaySize(100, 100);
            component.add(componentImage);
            component.setData("logicComponent", comp);
            break;
    }

    component.on("pointerover", () => {
        console.log(
            "Pointer over component:",
            type,
            "at",
            component.x,
            component.y
        );
        if (component.getData("isInPanel")) {
            // prikaži info okno
            const details = workspace.getComponentDetails(type);
            workspace.infoText.setText(details);

            // zraven komponente
            workspace.infoWindow.x = x + 120;
            workspace.infoWindow.y = y;
            workspace.infoWindow.setVisible(true);
            component.setScale(1.1);
        }
    });

    component.on("pointerout", () => {
        if (component.getData("isInPanel")) {
            workspace.infoWindow.setVisible(false);
            component.setScale(1);
        }
    });

    // Label
    const label = workspace.add
        .text(0, 30, type, {
            fontSize: "11px",
            color: "#fff",
            backgroundColor: "#00000088",
            padding: { x: 4, y: 2 },
        })
        .setOrigin(0.5);
    component.add(label);
    component.setData("displayLabel", label);
    component.setSize(70, 70);
    component.setInteractive({ draggable: true, useHandCursor: true });

    // shrani originalno pozicijo in tip
    component.setData("originalX", x);
    component.setData("originalY", y);
    component.setData("type", type);
    component.setData("color", color);
    component.setData("isInPanel", true);
    component.setData("rotation", 0);
    if (comp) component.setData("logicComponent", comp);
    component.setData("isDragging", false);

    workspace.input.setDraggable(component);

    component.on("dragstart", () => {
        component.setData("isDragging", true);
    });

    component.on("drag", (pointer, dragX, dragY) => {
        component.x = dragX;
        component.y = dragY;
    });

    component.on("dragend", () => {
        const isInPanel = component.x < 200;

        if (isInPanel && !component.getData("isInPanel")) {
            // če je ob strani, se odstrani
            const comp = component.getData("logicComponent");
            comp.destroy();
            component.destroy();
        } else if (!isInPanel && component.getData("isInPanel")) {
            // s strani na mizo
            const snapped = workspace.snapToGrid(component.x, component.y);
            component.x = snapped.x;
            component.y = snapped.y;

            const comp = component.getData("logicComponent");
            if (comp) {
                console.log("Component: " + comp);
                workspace.graph.addComponent(comp);

                // Add start/end nodes to graph if they exist
                if (comp.start) workspace.graph.addNode(comp.start);
                if (comp.end) workspace.graph.addNode(comp.end);
            }

            workspace.updateLogicNodePositions(component);

            component.setData("isRotated", false);
            component.setData("isInPanel", false);

            // assign a display name based on the component class static counter
            if (comp && comp.constructor) {
                // update the label that was created for this visual component
                if (
                    typeof label !== "undefined" &&
                    label &&
                    typeof label.setText === "function"
                ) {
                    try {
                        label.setText(comp.values.name);
                    } catch (e) {
                        console.warn("Failed to set label text", e);
                    }
                } else {
                    console.warn(
                        "Label not found or not editable for component",
                        comp.id
                    );
                }
            }

            workspace.createNewComponent(
                component.getData("originalX"),
                component.getData("originalY"),
                component.getData("type"),
                component.getData("color")
            );

            workspace.placedComponents.push(component);
        } else if (!component.getData("isInPanel")) {
            // na mizi in se postavi na mrežo
            const snapped = workspace.snapToGrid(component.x, component.y);
            component.x = snapped.x;
            component.y = snapped.y;
            workspace.updateLogicNodePositions(component);
            const comp = component.getData("logicComponent");
            console.log("Updating logic node positions for component:", comp);
            if (comp) {
                comp.updateMove(workspace);
            }
        } else {
            // postavi se nazaj na originalno mesto
            component.x = component.getData("originalX");
            component.y = component.getData("originalY");

            workspace.updateLogicNodePositions(component);
        }

        workspace.time.delayedCall(500, () => {
            component.setData("isDragging", false);
        });
    });

    component.on("pointerdown", () => {
        if (!component.getData("isInPanel")) {
            // const currentRotation = component.getData("rotation");
            // const newRotation = (currentRotation + 90) % 360;
            // component.setData("rotation", newRotation);
            // component.setData("isRotated", !component.getData("isRotated"));
            // workspace.tweens.add({
            //     targets: component,
            //     angle: newRotation,
            //     duration: 150,
            //     ease: "Cubic.easeOut",
            // });
        }
    });

    // context menu actions are provided via openComponentContextMenu (top-level)

    // Add circles at start and end nodes
    console.log("Adding circles to component:", comp);
    const circleInitColor = 0x000000;
    const circleClickColor = 0x535353;
    const startCircle = workspace.add
        .circle(comp.localStart.x, comp.localStart.y, 5, circleInitColor)
        .setOrigin(0.1, 0.5);
    const endCircle = workspace.add
        .circle(comp.localEnd.x, comp.localEnd.y, 5, circleInitColor)
        .setOrigin(0.8, 0.5);

    // Add the circles to the component container
    component.add(startCircle);
    component.add(endCircle);

    // Add interactivity to the circles
    const addCircleInteractivity = (circle, nodeType) => {
        let line = null;
        let isDragging = false;

        circle.setInteractive({ useHandCursor: true });

        // Store which node this circle represents
        circle.setData("nodeType", nodeType); // "start" or "end"
        circle.setData("component", component);
        circle.setData(
            "logicNode",
            nodeType === "start" ? comp.start : comp.end
        );

        circle.on("pointerdown", (pointer) => {
            // Change circle color on click
            circle.setFillStyle(circleClickColor); // Red color
            isDragging = true;

            // Convert circle's local coordinates to global coordinates
            const transformMatrix = circle.getWorldTransformMatrix();
            const globalX = transformMatrix.tx;
            const globalY = transformMatrix.ty;

            // Create a temporary line

            // Remove the pointermove listener on pointerup
            workspace.input.once("pointerup", (pointer) => {
                isDragging = false;

                // Check if pointer is over another circle
                const pointerObjects = workspace.input.hitTestPointer(pointer);
                const targetCircle = pointerObjects.find(
                    (obj) =>
                        obj.getData &&
                        obj.getData("nodeType") &&
                        obj.getData("component") !== component
                );

                if (targetCircle) {
                    // Create a wire between the two nodes
                    const startNode = circle.getData("logicNode");
                    const endNode = targetCircle.getData("logicNode");
                    if (!startNode.wire && !endNode.wire) {
                        console.log("COMPONENT WIRE | new wire");
                        const wire = new Wire(startNode, endNode, workspace);
                        wire.type = "wire";

                        // Add wire to the graph
                        workspace.graph.addComponent(wire);
                    } else if (startNode.wire) {
                        startNode.wire.addNode(endNode);
                    } else {
                        endNode.wire.addNode(startNode);
                    }
                }

                // Reset circle color
                console.log("Pointer up, removing line");
                circle.setFillStyle(circleInitColor);
                line = null;
            });
        });
    };

    // Add interactivity to start and end circles
    addCircleInteractivity(startCircle, "start");
    addCircleInteractivity(endCircle, "end");

    // hover efekt
    // component.on("pointerover", () => {
    //     component.setScale(1.1);
    // });

    // component.on("pointerout", () => {
    //     component.setScale(1);
    // });
}

// Top-level helper: keep action logic here, UI rendering delegated to ui/ContextMenu
export function openComponentContextMenu(workspace, compObj, worldX, worldY) {
    const logic = compObj.getData("logicComponent");
    const items = [
        {
            label: "Properties",
            onClick: () => {
                console.log("changeValue");
                const logicComp = compObj.getData("logicComponent");
                const compType =
                    compObj.getData("type") ||
                    (logicComp && logicComp.type) ||
                    "";

                let properties = logicComp.properties;
                console.log("PROPERTIES |", properties);
                openPropertiesPanel(
                    workspace,

                    properties.fields,
                    logicComp.values,
                    (values) => {
                        const label = compObj.getData("displayLabel");
                        label.setText(values.name);
                        logicComp.values = values;
                    },
                    () => {
                        // cancelled
                        console.log("Properties cancelled");
                    }
                );
            },
        },
        {
            label: "rotate",
            onClick: () => {
                console.log("rotate");

                const logic = compObj.getData("logicComponent");
                if (logic && typeof logic.updateMove === "function")
                    logic.updateMove(workspace, true);
            },
        },
        {
            label: "remove wires",
            onClick: () => {
                console.log("removeWires");
                const logic = compObj.getData("logicComponent");
                if (logic) {
                    if (logic.start && logic.start.wire)
                        logic.start.wire.removeNode(logic.start);
                    if (logic.end && logic.end.wire)
                        logic.end.wire.removeNode(logic.end);
                }
            },
        },
    ];
    if (logic.type == "switch") {
        items.push({
            label: "Toggle",
            onClick: () => {
                logic.switchToggle();
            },
        });
    }
    createContextMenu(workspace, worldX, worldY, items);
}
