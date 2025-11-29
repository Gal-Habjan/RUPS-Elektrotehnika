import Phaser from 'phaser';
import { LabTable } from '../componentsVisual/LabTable';

export default class ScoreboardScene extends Phaser.Scene {
    constructor() {
        super('ScoreboardScene');
    }

    init(data) {
        this.cameFromMenu = data.cameFromMenu || false;
    }

    preload() {
        // avatarji
        for (let i = 1; i <= 14; i++) {
            this.load.image(`avatar${i}`, `src/avatars/avatar${i}.png`);
        }
    }

    create() {
        const { width, height } = this.scale;

        // ozadje
        // svetla stena
        this.add.rectangle(0, 0, width, height - 150, 0xe8e8e8).setOrigin(0);
        // tla
        this.add.rectangle(0, height - 150, width, 150, 0xd4c4a8).setOrigin(0);

        // miza
        const labTable = new LabTable(this, width / 2, height / 2 + 50, 600, 280);
        labTable.create();

        // okvir
        const panelWidth = 600;
        const panelHeight = 400;
        const panelX = width / 2 - panelWidth / 2;
        const panelY = height / 2 - panelHeight / 2 - 30;

        const panel = this.add.graphics();
        panel.fillStyle(0xffffff, 0.92);
        panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 25);
        panel.lineStyle(3, 0xcccccc, 1);
        panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 25);

        // naslov
        this.add.text(width / 2, panelY + 35, 'LESTVICA', {
            fontFamily: 'Arial',
            fontSize: '36px',
            fontStyle: 'bold',
            color: '#222'
        }).setOrigin(0.5);

        // lestvica
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const userLoged = localStorage.getItem('username');

        // HARDCODED TESTIRANJE
        const userToUpdate = users.find(u => u.username === 'enej');
        if (userToUpdate) {
            userToUpdate.score = 130;
            localStorage.setItem('users', JSON.stringify(users));
        }

        users.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

        users.forEach((user, index) => {
            const y = panelY + 90 + index * 35;
            const rank = index + 1;

            // avatar
            if (user.profilePic) {
                this.add.image(panelX + 60, y + 15, user.profilePic)
                    .setDisplaySize(40, 40)
                    .setOrigin(0.5);
            }

            // mesto
            this.add.text(panelX + 100, y + 5, `${rank}.`, { fontSize: '22px', color: '#444' });

            // ime
            const style = (user.username === userLoged)
                ? { fontSize: '22px', color: '#0f5cad', fontStyle: 'bold' }
                : { fontSize: '22px', color: '#222' };
            this.add.text(panelX + 140, y + 5, user.username, style);

            // točke
            this.add.text(panelX + panelWidth - 100, y + 5, `${user.score ?? 0}`, {
                fontSize: '22px',
                color: '#0044cc'
            }).setOrigin(1, 0);
        });

        // ESC tipka
        this.input.keyboard.on('keydown-ESC', () => {
            if (this.cameFromMenu) {
                this.scene.start('LabScene');
            }
            else {
                this.scene.start('LabScene');
            }
        });

        // gumb
        if (this.cameFromMenu === false) {
            const backButton = this.add.text(width / 2, panelY + panelHeight - 40, '↩ Nazaj', {
                fontFamily: 'Arial',
                fontSize: '22px',
                color: '#0066ff',
                padding: { x: 20, y: 10 }
            })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerover', () => backButton.setStyle({ color: '#0044cc' }))
                .on('pointerout', () => backButton.setStyle({ color: '#0066ff' }))
                .on('pointerdown', () => {
                    this.scene.start('WorkspaceScene');
                });
        }

    }
}
