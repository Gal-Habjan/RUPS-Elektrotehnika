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
        const y = 4 + idx * itemHeight;
        const itemBg = scene.add
            .rectangle(0, y, menuWidth, itemHeight, 0x000000, 0)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true });

        const txt = scene.add
            .text(8, y, it.label, {
                fontSize: "14px",
                color: "#ffffff",
            })
            .setOrigin(0, 0);

        itemBg.on("pointerup", (pointer) => {
            try {
                if (typeof it.onClick === "function") it.onClick(pointer);
            } catch (e) {
                console.error("ContextMenu item callback error", e);
            }
            destroy();
        });

        itemBg.on("pointerover", () => itemBg.setFillStyle(0xffffff, 0.06));
        itemBg.on("pointerout", () => itemBg.setFillStyle(0x000000, 0));

        container.add(itemBg);
        container.add(txt);
    });

    const outsideListener = (pointer) => {
        try {
            const hits = scene.input.hitTestPointer(pointer) || [];
            for (const h of hits) {
                if (!h) continue;
                if (h === container) return;
                if (container.list && container.list.includes(h)) return;
                if (h.parentContainer && h.parentContainer === container)
                    return;
            }
            destroy();
        } catch (e) {
            destroy();
        }
    };

    scene.input.on("pointerdown", outsideListener);

    function destroy() {
        if (scene.input && typeof outsideListener === "function") {
            scene.input.off("pointerdown", outsideListener);
        }
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
