export function createContextMenu(scene, worldX, worldY, items) {
    // items: [{ label: string, onClick: (pointer) => void }]
    // destroy any existing menu
    if (scene._contextMenu) {
        scene._contextMenu.destroy(true);
        scene._contextMenu = null;
    }

    const menuWidth = 160;
    const itemHeight = 26;
    const container = scene.add.container(worldX, worldY).setDepth(1001);

    const bg = scene.add
        .rectangle(
            0,
            0,
            menuWidth,
            items.length * itemHeight + 8,
            0x1e1e1e,
            0.95
        )
        .setOrigin(0, 0);
    container.add(bg);

    items.forEach((it, idx) => {
        const txt = scene.add
            .text(8, 4 + idx * itemHeight, it.label, {
                fontSize: "14px",
                color: "#ffffff",
            })
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true });

        txt.on("pointerup", (pointer) => {
            try {
                console.log("clicked");
                if (typeof it.onClick === "function") it.onClick(pointer);
            } catch (e) {
                console.error("ContextMenu item callback error", e);
            }
            destroy();
        });

        container.add(txt);
    });

    function destroy() {
        if (scene._contextMenu) {
            scene._contextMenu.destroy(true);
            scene._contextMenu = null;
        } else {
            container.destroy(true);
        }
    }

    // store and close on next click
    scene._contextMenu = container;

    return { destroy };
}
