export default class UIButton {
    /**
     * Create a reusable button component
     * @param {Phaser.Scene} scene - The scene to add the button to
     * @param {object} config - Button configuration
     * @param {number} config.x - X position
     * @param {number} config.y - Y position
     * @param {string} config.text - Button text
     * @param {function} config.onClick - Click callback
     * @param {object} [config.style] - Text style options
     * @param {string} [config.style.fontFamily] - Font family (default: 'Arial')
     * @param {string} [config.style.fontSize] - Font size (default: '20px')
     * @param {string} [config.style.color] - Text color (default: '#ffffff' with bg, '#0066ff' without)
     * @param {object} [config.style.padding] - Text padding (default: { x: 20, y: 10 })
     * @param {number|number[]} [config.origin] - Origin (default: 0.5)
     * @param {object} [config.background] - Background configuration (optional)
     * @param {number} [config.background.width] - Background width (default: 180)
     * @param {number} [config.background.height] - Background height (default: 45)
     * @param {number} [config.background.color] - Background color (default: 0x3399ff)
     * @param {number} [config.background.hoverColor] - Background hover color (default: 0x0f5cad)
     * @param {number} [config.background.cornerRadius] - Corner radius (default: 10)
     * @param {object} [config.hover] - Hover configuration
     * @param {string} [config.hover.color] - Hover text color (default: '#0044cc')
     * @param {number} [config.depth] - Depth/z-index (optional)
     */
    constructor(scene, config) {
        this.scene = scene;
        this.config = config;

        // Default values
        const defaults = {
            style: {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: config.background ? '#ffffff' : '#0066ff',
                padding: { x: 20, y: 10 }
            },
            origin: 0.5,
            hover: {
                color: config.background ? null : '#0044cc'
            }
        };

        // Merge defaults with config
        this.style = { ...defaults.style, ...config.style };
        this.origin = config.origin !== undefined ? config.origin : defaults.origin;
        this.hoverColor = config.hover?.color !== undefined ? config.hover.color : defaults.hover.color;
        this.normalColor = this.style.color;

        this.create();
    }

    create() {
        const { x, y, text, onClick, background, depth } = this.config;

        // Create background if specified
        if (background) {
            const bgWidth = background.width || 180;
            const bgHeight = background.height || 45;
            const bgColor = background.color !== undefined ? background.color : 0x3399ff;
            const bgHoverColor = background.hoverColor !== undefined ? background.hoverColor : 0x0f5cad;
            const cornerRadius = background.cornerRadius !== undefined ? background.cornerRadius : 10;

            this.backgroundGraphics = this.scene.add.graphics();

            // Calculate background position based on text origin
            let bgX, bgY;
            if (Array.isArray(this.origin)) {
                bgX = x - bgWidth * this.origin[0];
                bgY = y - bgHeight * this.origin[1];
            } else {
                bgX = x - bgWidth * this.origin;
                bgY = y - bgHeight * this.origin;
            }

            this.drawBackground(bgX, bgY, bgWidth, bgHeight, bgColor, cornerRadius);

            // Store background properties for redrawing
            this.bgProps = { bgX, bgY, bgWidth, bgHeight, bgColor, bgHoverColor, cornerRadius };

            // Create an invisible interactive zone over the button background
            this.interactiveZone = this.scene.add.zone(x, y, bgWidth, bgHeight)
                .setOrigin(this.origin)
                .setInteractive({ useHandCursor: true });

            if (depth !== undefined) {
                this.backgroundGraphics.setDepth(depth - 1);
                this.interactiveZone.setDepth(depth);
            }

            // Add hover and click events to the zone
            this.interactiveZone.on('pointerover', () => {
                const { bgX, bgY, bgWidth, bgHeight, bgHoverColor, cornerRadius } = this.bgProps;
                this.drawBackground(bgX, bgY, bgWidth, bgHeight, bgHoverColor, cornerRadius);
                if (this.hoverColor && this.textObject) {
                    this.textObject.setStyle({ color: this.hoverColor });
                }
            });

            this.interactiveZone.on('pointerout', () => {
                const { bgX, bgY, bgWidth, bgHeight, bgColor, cornerRadius } = this.bgProps;
                this.drawBackground(bgX, bgY, bgWidth, bgHeight, bgColor, cornerRadius);
                if (this.textObject) {
                    this.textObject.setStyle({ color: this.normalColor });
                }
            });

            this.interactiveZone.on('pointerdown', onClick);
        }

        // Create text
        const originValue = Array.isArray(this.origin) ? this.origin : [this.origin, this.origin];

        this.textObject = this.scene.add.text(x, y, text, this.style)
            .setOrigin(...originValue);

        if (depth !== undefined) {
            this.textObject.setDepth(depth + 1);
        }

        // For text-only buttons (no background), make text interactive
        if (!background) {
            this.textObject.setInteractive({ useHandCursor: true });

            this.textObject.on('pointerover', () => {
                if (this.hoverColor) {
                    this.textObject.setStyle({ color: this.hoverColor });
                }
            });

            this.textObject.on('pointerout', () => {
                this.textObject.setStyle({ color: this.normalColor });
            });

            this.textObject.on('pointerdown', onClick);
        }
    }

    drawBackground(x, y, width, height, color, cornerRadius) {
        this.backgroundGraphics.clear();
        this.backgroundGraphics.fillStyle(color, 1);
        this.backgroundGraphics.fillRoundedRect(x, y, width, height, cornerRadius);
    }

    /**
     * Set button visibility
     */
    setVisible(visible) {
        this.textObject.setVisible(visible);
        if (this.backgroundGraphics) {
            this.backgroundGraphics.setVisible(visible);
        }
        if (this.interactiveZone) {
            this.interactiveZone.setVisible(visible);
        }
        return this;
    }

    /**
     * Set button depth
     */
    setDepth(depth) {
        this.textObject.setDepth(depth + 1);
        if (this.backgroundGraphics) {
            this.backgroundGraphics.setDepth(depth - 1);
        }
        if (this.interactiveZone) {
            this.interactiveZone.setDepth(depth);
        }
        return this;
    }

    /**
     * Update button text
     */
    setText(text) {
        this.textObject.setText(text);
        return this;
    }

    /**
     * Destroy the button
     */
    destroy() {
        this.textObject.destroy();
        if (this.backgroundGraphics) {
            this.backgroundGraphics.destroy();
        }
        if (this.interactiveZone) {
            this.interactiveZone.destroy();
        }
    }
}
