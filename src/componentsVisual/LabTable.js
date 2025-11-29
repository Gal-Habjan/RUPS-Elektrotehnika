export class LabTable {
    constructor(scene, x, y, width = 500, height = 250) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.elements = [];
    }

    create() {
        // zgornja ploskev mize
        const tableTop = this.scene.add.rectangle(
            this.x, 
            this.y, 
            this.width, 
            30, 
            0x8b4513
        ).setOrigin(0.5);
        this.elements.push(tableTop);

        // površina mize z mrežo
        const surface = this.scene.add.rectangle(
            this.x, 
            this.y + 15, 
            this.width - 30, 
            this.height - 30, 
            0xa0826d
        ).setOrigin(0.5, 0);
        this.elements.push(surface);

        // mreža
        const grid = this.scene.add.graphics();
        grid.lineStyle(1, 0x8b7355, 0.3);
        const gridSize = 30;
        const gridStartX = this.x - (this.width - 30) / 2;
        const gridStartY = this.y + 15;
        const gridEndX = this.x + (this.width - 30) / 2;
        const gridEndY = this.y + 15 + (this.height - 30);

        for (let x = gridStartX; x <= gridEndX; x += gridSize) {
            grid.beginPath();
            grid.moveTo(x, gridStartY);
            grid.lineTo(x, gridEndY);
            grid.strokePath();
        }
        for (let y = gridStartY; y <= gridEndY; y += gridSize) {
            grid.beginPath();
            grid.moveTo(gridStartX, y);
            grid.lineTo(gridEndX, y);
            grid.strokePath();
        }
        this.elements.push(grid);

        // nogice mize
        // const legWidth = 20;
        // const legHeight = 150;
        // const leftLeg = this.scene.add.rectangle(
        //     this.x - this.width / 2 + 40, 
        //     this.y + this.height / 2 + 20, 
        //     legWidth, 
        //     legHeight, 
        //     0x654321
        // );
        // this.elements.push(leftLeg);

        // const rightLeg = this.scene.add.rectangle(
        //     this.x + this.width / 2 - 40, 
        //     this.y + this.height / 2 + 20, 
        //     legWidth, 
        //     legHeight, 
        //     0x654321
        // );
        // this.elements.push(rightLeg);

        return {
            tableTop,
            surface,
            grid,
            // leftLeg,
            // rightLeg
        };
    }

    destroy() {
        this.elements.forEach(element => element.destroy());
        this.elements = [];
    }
}
