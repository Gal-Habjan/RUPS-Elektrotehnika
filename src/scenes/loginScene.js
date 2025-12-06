import Phaser from 'phaser';
import { LabTable } from '../componentsVisual/LabTable';
import UIButton from '../ui/UIButton';
import bcrypt from 'bcryptjs';

export default class LoginScene extends Phaser.Scene {
    constructor() {
        super('LoginScene');
    }

    create() {
        var users = JSON.parse(localStorage.getItem('users')) || [];

        // this.add.text(200, 100, 'Vnesi svoje uporabniško ime in geslo!', {
        //     fontFamily: 'Arial',
        //     fontSize: '20px',
        //     color: '#222'
        // });

        const { width, height } = this.scale;

        // --- 1️⃣ Ozadje laboratorija (enako kot v LabScene) ---
        // svetla stena
        this.add.rectangle(0, 0, width, height - 150, 0xe8e8e8).setOrigin(0);
        // tla
        this.add.rectangle(0, height - 150, width, 150, 0xd4c4a8).setOrigin(0);

        // miza
        const tableX = width / 2;
        const tableY = height / 2 + 50;
        const tableWidth = 500;
        const tableHeight = 250;

        const labTable = new LabTable(this, tableX, tableY, tableWidth, tableHeight);
        labTable.create();

        // okvir
        const panelWidth = 450;
        const panelHeight = 380;
        const panelX = width / 2 - panelWidth / 2;
        const panelY = height / 2 - panelHeight / 2 - 200;

        const panel = this.add.graphics();
        panel.fillStyle(0xffffff, 0.95);
        panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 20);
        panel.lineStyle(2, 0xdddddd, 1);
        panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 20);

        // naslov
        this.add.text(width / 2, panelY + 50, 'PRIJAVA', {
            fontFamily: 'Arial',
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#333'
        }).setOrigin(0.5);

        // Create RexUI text input fields
        const createInput = (scene, x, y, placeholder, type = 'text') => {
            const background = scene.add.graphics();
            background.fillStyle(0xfafafa, 1);
            background.lineStyle(2, 0xe0e0e0, 1);
            background.fillRoundedRect(0, 0, 360, 50, 12);
            background.strokeRoundedRect(0, 0, 360, 50, 12);
            background.setPosition(x - 180, y - 25);

            const textObject = scene.add.dom(x, y).createFromHTML(`
                <div style="pointer-events: none;">
                    <input type="${type}" 
                           placeholder="${placeholder}"
                           style="
                               width: 360px;
                               height: 50px;
                               border: none;
                               background: transparent;
                               font-size: 16px;
                               font-family: Arial;
                               padding: 0 -30px;
                               padding-left: 20px;
                               outline: none;
                               text-align: left;
                               color: #333;
                               cursor: text;
                               pointer-events: auto;
                           "
                    />
                </div>
            `);

            const inputElement = textObject.node.querySelector('input');
            
            inputElement.addEventListener('focus', () => {
                background.clear();
                background.fillStyle(0xffffff, 1);
                background.lineStyle(2, 0x3399ff, 1);
                background.fillRoundedRect(0, 0, 360, 50, 12);
                background.strokeRoundedRect(0, 0, 360, 50, 12);
            });
            
            inputElement.addEventListener('blur', () => {
                background.clear();
                background.fillStyle(0xfafafa, 1);
                background.lineStyle(2, 0xe0e0e0, 1);
                background.fillRoundedRect(0, 0, 360, 50, 12);
                background.strokeRoundedRect(0, 0, 360, 50, 12);
            });

            return { dom: textObject, input: inputElement, background };
        };

        const usernameInput = createInput(this, width / 2, panelY + 125, 'Uporabniško ime', 'text');
        const passwordInput = createInput(this, width / 2, panelY + 195, 'Geslo', 'password');

        // const profilePic = document.createElement('input');
        // profilePic.type = 'file';
        // profilePic.accept = 'image/*';
        // profilePic.style.position = 'absolute';
        // profilePic.style.width = '400px';
        // profilePic.style.left = '400px';
        // profilePic.style.top = '290px';
        // document.body.appendChild(profilePic);

        //console.log(profilePic);

        const buttonY = panelY + 290;
        const rectX = width / 2;

        new UIButton(this, {
            x: rectX,
            y: buttonY,
            text: '▶ Prijavi se',
            onClick: () => {
                const usernameTrim = usernameInput.input.value.trim();
                const passwordTrim = passwordInput.input.value.trim();
                const pfps = ['avatar1','avatar2','avatar3','avatar4','avatar5','avatar6','avatar7','avatar8','avatar9','avatar10','avatar11'];
                const pfpKey = pfps[Math.floor(Math.random() * pfps.length)];

                if (usernameTrim && passwordTrim) {
                    const existingUser = users.find(u => u.username == usernameTrim);
                    if (existingUser) {
                        // Compare the entered password with stored hash using bcrypt
                        const isPasswordCorrect = bcrypt.compareSync(passwordTrim, existingUser.password);
                        if (!isPasswordCorrect) {
                            alert('Napačno geslo!');
                            return;
                        }
                    } else {
                        // Hash the password with bcrypt before storing (salt rounds: 10)
                        const hashedPassword = bcrypt.hashSync(passwordTrim, 10);
                        users.push({ username: usernameTrim, password: hashedPassword, score: 0, profilePic: pfpKey });
                        localStorage.setItem('users', JSON.stringify(users));
                    }

                    localStorage.setItem('username', usernameTrim);
                    localStorage.setItem('profilePic', pfpKey);

                    usernameInput.dom.destroy();
                    passwordInput.dom.destroy();

                    this.scene.start('LabScene');
                } else {
                    alert('Vnesi uporabniško ime in geslo!');
                }
            },
            style: {
                fontSize: '24px'
            },
            background: {
                width: 200,
                height: 50,
                cornerRadius: 12
            },
            depth: 11
        });

        // počisti inpute ob izhodu
        this.events.once('shutdown', () => {
            usernameInput.dom.destroy();
            passwordInput.dom.destroy();
        });

        new UIButton(this, {
            x: 40,
            y: 30,
            text: '↩ Nazaj v meni',
            onClick: () => {
                usernameInput.dom.destroy();
                passwordInput.dom.destroy();
                this.scene.start('MenuScene');
            },
            origin: [0, 0],
            style: {
                fontSize: '20px',
                color: '#0066ff',
                padding: { x: 20, y: 10 }
            },
            hover: {
                color: '#0044cc'
            }
        });

        //localStorage.clear();

        // this.input.keyboard.on('keydown-ESC', () => {
        //     this.scene.start('MenuScene');
        // });
    }
}
