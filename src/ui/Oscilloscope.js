export default class Oscilloscope {
    /**
     * Create an oscilloscope component for measuring and displaying voltage
     * @param {Phaser.Scene} scene - The scene to add the oscilloscope to
     * @param {object} config - Oscilloscope configuration
     * @param {number} config.x - X position
     * @param {number} config.y - Y position
     * @param {number} [config.width] - Oscilloscope width (default: 300)
     * @param {number} [config.height] - Oscilloscope height (default: 200)
     * @param {number} [config.maxMeasurements] - Number of measurements to keep (default: 10)
     * @param {number} [config.minVoltage] - Minimum voltage on Y-axis (default: -5)
     * @param {number} [config.maxVoltage] - Maximum voltage on Y-axis (default: 5)
     * @param {number} [config.depth] - Depth/z-index (optional)
     */
    constructor(scene, config) {
        this.scene = scene;
        this.config = config;
        
        // Configuration
        this.width = config.width || 300;
        this.height = config.height || 200;
        this.x = config.x;
        this.y = config.y;
        this.maxMeasurements = config.maxMeasurements || 10;
        this.minVoltage = config.minVoltage !== undefined ? config.minVoltage : -5;
        this.maxVoltage = config.maxVoltage !== undefined ? config.maxVoltage : 5;
        this.depth = config.depth;
        
        // Internal state
        this.measurements = [];
        
        // Visual elements
        this.container = null;
        this.background = null;
        this.screen = null;
        this.gridGraphics = null;
        this.waveformGraphics = null;
        this.displayText = null;
        
        this.create();
    }
    
    create() {
        // Create container for all oscilloscope elements
        this.container = this.scene.add.container(this.x, this.y);
        
        if (this.depth !== undefined) {
            this.container.setDepth(this.depth);
        }
        
        // Device background (beige/gray color for retro oscilloscope look)
        this.background = this.scene.add.rectangle(0, 0, this.width, this.height, 0x2d2d2d);
        this.background.setStrokeStyle(2, 0x1a1a1a);
        this.container.add(this.background);
        
        // Screen area (darker green/black for CRT look)
        const screenPadding = 20;
        const screenWidth = this.width - screenPadding * 2;
        const screenHeight = this.height - screenPadding * 2 - 30; // Leave space for text
        const screenX = -this.width / 2 + screenPadding;
        const screenY = -this.height / 2 + screenPadding;
        
        this.screen = this.scene.add.rectangle(
            screenX + screenWidth / 2,
            screenY + screenHeight / 2,
            screenWidth,
            screenHeight,
            0x001a00
        );
        this.screen.setOrigin(0.5);
        this.container.add(this.screen);
        
        // Grid graphics
        this.gridGraphics = this.scene.add.graphics();
        this.container.add(this.gridGraphics);
        this.drawGrid(screenX, screenY, screenWidth, screenHeight);
        
        // Waveform graphics
        this.waveformGraphics = this.scene.add.graphics();
        this.container.add(this.waveformGraphics);
        
        // Store screen dimensions for later use
        this.screenBounds = {
            x: screenX,
            y: screenY,
            width: screenWidth,
            height: screenHeight
        };
        
        // Display text for current voltage
        this.displayText = this.scene.add.text(
            0,
            this.height / 2 - 25,
            'V: 0.00 V',
            {
                fontSize: '14px',
                color: '#00ff00',
                fontFamily: 'Courier New, monospace',
                backgroundColor: '#000000',
                padding: { x: 8, y: 4 }
            }
        );
        this.displayText.setOrigin(0.5);
        this.container.add(this.displayText);
        
        // Title label
        const title = this.scene.add.text(
            0,
            -this.height / 2 - 20,
            'OSCILLOSCOPE',
            {
                fontSize: '12px',
                color: '#cccccc',
                fontFamily: 'Arial',
                fontStyle: 'bold'
            }
        );
        title.setOrigin(0.5);
        this.container.add(title);
    }
    
    drawGrid(x, y, width, height) {
        this.gridGraphics.clear();
        
        // Draw grid lines
        this.gridGraphics.lineStyle(1, 0x003300, 0.5);
        
        // Vertical grid lines
        const verticalLines = 10;
        for (let i = 0; i <= verticalLines; i++) {
            const lineX = x + (width / verticalLines) * i;
            this.gridGraphics.lineBetween(lineX, y, lineX, y + height);
        }
        
        // Horizontal grid lines
        const horizontalLines = 6;
        for (let i = 0; i <= horizontalLines; i++) {
            const lineY = y + (height / horizontalLines) * i;
            this.gridGraphics.lineBetween(x, lineY, x + width, lineY);
        }
        
        // Center line (0V reference)
        this.gridGraphics.lineStyle(1, 0x00ff00, 0.8);
        const centerY = y + height / 2;
        this.gridGraphics.lineBetween(x, centerY, x + width, centerY);
    }
    
    /**
     * Measure and record a voltage value
     * @param {number} voltage - The voltage to measure
     */
    measure(voltage) {
        console.log("measuring voltage ", voltage)
        // Add new measurement
        this.measurements.push(voltage);
        
        // Keep only the last N measurements
        if (this.measurements.length > this.maxMeasurements) {
            this.measurements.shift();
        }
        
        // Update display
        this.updateDisplay();
        this.drawWaveform();
    }
    
    updateDisplay() {
        if (this.measurements.length === 0) {
            this.displayText.setText('V: 0.00 V');
            return;
        }
        
        const currentVoltage = this.measurements[this.measurements.length - 1];
        this.displayText.setText(`V: ${currentVoltage.toFixed(2)} V`);
    }
    
    drawWaveform() {
        this.waveformGraphics.clear();
        
        if (this.measurements.length < 2) {
            return;
        }
        
        const { x, y, width, height } = this.screenBounds;
        
        // Calculate points for the waveform
        const points = [];
        const stepX = width / (this.maxMeasurements - 1);
        
        for (let i = 0; i < this.measurements.length; i++) {
            const voltage = this.measurements[i];
            
            // Clamp voltage to min/max range
            const clampedVoltage = Math.max(this.minVoltage, Math.min(this.maxVoltage, voltage));
            
            // Map voltage to Y position (inverted because Y increases downward)
            const normalizedVoltage = (clampedVoltage - this.minVoltage) / (this.maxVoltage - this.minVoltage);
            const pointX = x + stepX * i;
            const pointY = y + height - (normalizedVoltage * height);
            
            points.push({ x: pointX, y: pointY });
        }
        
        // Draw the waveform
        this.waveformGraphics.lineStyle(2, 0x00ff00, 1);
        
        if (points.length > 0) {
            this.waveformGraphics.beginPath();
            this.waveformGraphics.moveTo(points[0].x, points[0].y);
            
            for (let i = 1; i < points.length; i++) {
                this.waveformGraphics.lineTo(points[i].x, points[i].y);
            }
            
            this.waveformGraphics.strokePath();
        }
        
        // Draw dots at measurement points
        this.waveformGraphics.fillStyle(0x00ff00, 1);
        for (const point of points) {
            this.waveformGraphics.fillCircle(point.x, point.y, 2);
        }
    }
    
    /**
     * Clear all measurements
     */
    clear() {
        this.measurements = [];
        this.updateDisplay();
        this.drawWaveform();
    }
    
    /**
     * Set the position of the oscilloscope
     */
    setPosition(x, y) {
        this.container.setPosition(x, y);
        return this;
    }
    
    /**
     * Set visibility
     */
    setVisible(visible) {
        this.container.setVisible(visible);
        return this;
    }
    
    /**
     * Set depth
     */
    setDepth(depth) {
        this.container.setDepth(depth);
        return this;
    }
    
    /**
     * Get current voltage
     */
    getCurrentVoltage() {
        if (this.measurements.length === 0) return 0;
        return this.measurements[this.measurements.length - 1];
    }
    
    /**
     * Get all measurements
     */
    getMeasurements() {
        return [...this.measurements];
    }
    
    /**
     * Destroy the oscilloscope
     */
    destroy() {
        if (this.container) {
            this.container.destroy();
        }
    }
}
