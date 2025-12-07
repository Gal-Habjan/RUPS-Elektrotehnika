import Phaser from 'phaser';
import LabScene from './labScene';
import { Battery } from '../components/battery';
import { Bulb } from '../components/bulb';
import { Wire } from '../components/wire';
import { CircuitGraph } from '../logic/circuit_graph';
import { Node } from '../logic/node';
import { Switch } from '../components/switch';
import { Resistor } from '../components/resistor';
import UIButton from '../ui/UIButton';
import Oscilloscope from '../ui/Oscilloscope';
import { createComponent,openComponentContextMenu } from "../components/ComponentHelper";
import { CircuitSim } from "../logic/circuit_sim.js";

export default class WorkspaceScene extends Phaser.Scene {
    constructor() {
        super("WorkspaceScene");
        this.sim = new CircuitSim();
    }

    init() {
        const savedIndex = localStorage.getItem("currentChallengeIndex");
        this.currentChallengeIndex =
            savedIndex !== null ? parseInt(savedIndex) : 0;
    }

    preload() {
        this.graph = new CircuitGraph();
        this.load.image("baterija", "src/components/battery.svg");
        this.load.image("upor", "src/components/resistor1.svg");
        this.load.image("svetilka", "src/components/diode.svg");
        this.load.image("stikalo-on", "src/components/switch-on.svg");
        this.load.image("stikalo-off", "src/components/switch-off.svg");
        this.load.image("žica", "src/components/wire.png");
        this.load.image("ampermeter", "src/components/ampermeter.svg");
        this.load.image("voltmeter", "src/components/voltmeter.svg");
    }

    create() {
        const { width, height } = this.cameras.main;

        // površje mize
        const desk = this.add
            .rectangle(0, 0, width, height, 0xe0c9a6)
            .setOrigin(0);

        const gridGraphics = this.add.graphics();
        gridGraphics.lineStyle(1, 0x8b7355, 0.35);
        const gridSize = 40;
        for (let x = 0; x < width; x += gridSize) {
            gridGraphics.beginPath();
            gridGraphics.moveTo(x, 0);
            gridGraphics.lineTo(x, height);
            gridGraphics.strokePath();
        }
        for (let y = 0; y < height; y += gridSize) {
            gridGraphics.beginPath();
            gridGraphics.moveTo(0, y);
            gridGraphics.lineTo(width, y);
            gridGraphics.strokePath();
        }

        this.infoWindow = this.add.container(0, 0);
        this.infoWindow.setDepth(1000);
        this.infoWindow.setVisible(false);
        // ozadje info okna
        const infoBox = this.add.rectangle(0, 0, 200, 80, 0x2c2c2c, 0.95);
        infoBox.setStrokeStyle(2, 0xffffff);
        const infoText = this.add
            .text(0, 0, "", {
                fontSize: "14px",
                color: "#ffffff",
                align: "left",
                wordWrap: { width: 180 },
            })
            .setOrigin(0.5);

        this.infoWindow.add([infoBox, infoText]);
        this.infoText = infoText;

        this.challenges = [
            {
                prompt: "Sestavi preprosti električni krog z baterijo in svetilko.",
                requiredComponents: [
                    "baterija",
                    "svetilka",
                    "žica",
                    "žica",
                    "žica",
                    "žica",
                    "žica",
                    "žica",
                ],
                theory: [
                    "Osnovni električni krog potrebuje vir, to je v našem primeru baterija. Potrebuje tudi porabnike, to je svetilka. Električni krog je v našem primeru sklenjen, kar je nujno potrebno, da električni tok teče preko prevodnikov oziroma žic.",
                ],
            },
            {
                prompt: "Sestavi preprosti nesklenjeni električni krog z baterijo, svetilko in stikalom.",
                requiredComponents: [
                    "baterija",
                    "svetilka",
                    "žica",
                    "stikalo-off",
                ],
                theory: [
                    "V nesklenjenem krogu je stikalo odprto, kar pomeni, da je električni tok prekinjen. Svetilka posledično zato ne sveti.",
                ],
            },
            {
                prompt: "Sestavi preprosti sklenjeni električni krog z baterijo, svetilko in stikalom.",
                requiredComponents: [
                    "baterija",
                    "svetilka",
                    "žica",
                    "stikalo-on",
                ],
                theory: [
                    "V sklenjenem krogu je stikalo zaprto, kar pomeni, da lahko električni tok teče neovirano. Torej v tem primeru so vrata zaprta.",
                ],
            },
            {
                prompt: "Sestavi električni krog z baterijo, svetilko in stikalom, ki ga lahko ugašaš in prižigaš.",
                requiredComponents: [
                    "baterija",
                    "svetilka",
                    "žica",
                    "stikalo-on",
                    "stikalo-off",
                ],
                theory: [
                    "Stikalo nam omogoča nadzor nad pretokom električnega toka. Ko je stikalo zaprto, tok teče in posledično svetilka sveti. Kadar pa je stikalo odprto, tok ne teče in se svetilka ugasne. To lahko primerjamo z vklapljanjem in izklapljanjem električnih naprav v naših domovih.",
                ],
            },
            {
                prompt: "Sestavi krog z dvema baterijama in svetilko. ",
                requiredComponents: [
                    "baterija",
                    "baterija",
                    "svetilka",
                    "žica",
                ],
                theory: [
                    "Kadar vežemo dve ali več baterij zaporedno, se napetosti seštevajo. Večja je napetost, večji je električni tok. V našem primeru zato svetilka sveti močneje.",
                ],
            },
            {
                prompt: "V električni krog zaporedno poveži dve svetilki, ki ju priključiš na baterijo. ",
                requiredComponents: [
                    "baterija",
                    "svetilka",
                    "svetilka",
                    "žica",
                ],
                theory: [
                    "V zaporedni vezavi teče isti električni tok skozi vse svetilke. Napetost baterije se porazdeli. Če imamo primer, da ena svetilka preneha delovati, bo ta prekinila tok skozi drugo svetilko.",
                ],
            },

            {
                prompt: "V električni krog vzporedno poveži dve svetilki, ki ju priključiš na baterijo. ",
                requiredComponents: [
                    "baterija",
                    "svetilka",
                    "svetilka",
                    "žica",
                ],
                theory: [
                    "V vzporedni vezavi ima vsaka svetilka enako napetost kot baterija. Eletrični tok se porazdeli med svetilkami. Če ena svetilka preneha delovati, bo druga še vedno delovala.",
                ],
            },
            {
                prompt: "Sestavi električni krog s svetilko in uporom. ",
                requiredComponents: ["baterija", "svetilka", "žica", "upor"],
                theory: [
                    "Upor omejuje tok v krogu. Večji kot je upor, manjši je tok. Spoznajmo Ohmov zakon: tok (I) = napetost (U) / upornost (R). Svetilka bo svetila manj intenzivno, saj skozi njo teče manjši tok.",
                ],
            },
        ];

        // this.currentChallengeIndex = 0;

        this.promptText = this.add
            .text(
                width / 1.8,
                height - 30,
                this.challenges[this.currentChallengeIndex].prompt,
                {
                    fontSize: "20px",
                    color: "#333",
                    fontStyle: "bold",
                    backgroundColor: "#ffffff88",
                    padding: { x: 15, y: 8 },
                }
            )
            .setOrigin(0.5);

        this.checkText = this.add
            .text(width / 2, height - 70, "", {
                fontSize: "18px",
                color: "#cc0000",
                fontStyle: "bold",
                padding: { x: 15, y: 8 },
            })
            .setOrigin(0.5);

    // Action buttons
    new UIButton(this, {
      x: width - 140,
      y: 75,
      text: 'Lestvica',
      onClick: () => this.scene.start('ScoreboardScene', { cameFromScene: 'WorkspaceScene' }),
      background: {
        width: 180,
        height: 45
      }
    });

    new UIButton(this, {
      x: width - 140,
      y: 125,
      text: 'Preveri krog',
      onClick: () => this.checkCircuit(),
      background: {
        width: 180,
        height: 45
      }
    });

    new UIButton(this, {
      x: width - 140,
      y: 175,
      text: 'Simulacija',
      onClick: () => {
        this.connected = this.graph.simulate()
        if (this.connected == 1) {
          this.checkText.setStyle({ color: '#00aa00' });
          this.checkText.setText('Električni tok je sklenjen');
          this.sim = true;
          return;
        }
        this.checkText.setStyle({ color: '#cc0000' });
        if (this.connected == -1) {
          this.checkText.setText('Manjka ti baterija');
        }
        else if (this.connected == -2) {
          this.checkText.setText('Stikalo je izklopljeno');
        }
        else if (this.connected == 0) {
          this.checkText.setText('Električni tok ni sklenjen');
        }
        this.sim = false;
      },
      background: {
        width: 180,
        height: 45
      }
    });

    new UIButton(this, {
      x: width - 140,
      y: 225,
      text: 'new_sim',
      onClick: () => this.sim.generate_tree(),
      background: {
        width: 180,
        height: 45
      }
    });
    window.sim = this.sim; // DEBUGGING PURPOSES

    new UIButton(this, {
      x: width - 140,
      y: 275,
      text: 'Formule',
      onClick: () => this.showCalculationFormulas(),
      background: {
        width: 180,
        height: 45
      }
    });

    new UIButton(this, {
      x: width - 140,
      y: 325,
      text: 'Export',
      onClick: () => this.exportComponents(),
      background: {
        width: 180,
        height: 45
      }
    });

    new UIButton(this, {
      x: width - 140,
      y: 375,
      text: 'Import',
      onClick: () => this.importComponents(),
      background: {
        width: 180,
        height: 45
      }
    });

        // stranska vrstica na levi
        const panelWidth = 150;
        this.add.rectangle(0, 0, panelWidth, height, 0xc0c0c0).setOrigin(0);
        this.add
            .rectangle(0, 0, panelWidth, height, 0x000000, 0.2)
            .setOrigin(0);

        this.add
            .text(panelWidth / 2, 60, "Komponente", {
                fontSize: "18px",
                color: "#ffffff",
                fontStyle: "bold",
            })
            .setOrigin(0.5);

        // komponente v stranski vrstici
        this.createNewComponent(panelWidth / 2, 100, "baterija", 0xffcc00);
        this.createNewComponent(panelWidth / 2, 180, "upor", 0xff6600);
        this.createNewComponent(panelWidth / 2, 260, "svetilka", 0xff0000);
        this.createNewComponent(panelWidth / 2, 340, "stikalo-on", 0x666666);
        // this.createNewComponent(panelWidth / 2, 420, "stikalo-off", 0x666666);
        // this.createNewComponent(panelWidth / 2, 500, "žica", 0x0066cc);
        this.createNewComponent(panelWidth / 2, 580, "ampermeter", 0x00cc66);
        this.createNewComponent(panelWidth / 2, 660, "voltmeter", 0x00cc66);

    new UIButton(this, {
      x: 12,
      y: 10,
      text: '↩ Nazaj',
      onClick: () => {
        this.cameras.main.fade(300, 0, 0, 0);
        this.time.delayedCall(300, () => {
          this.scene.start('LabScene');
        });
      },
      origin: [0, 0],
      style: {
        fontSize: '20px',
        color: '#387affff',
        padding: { x: 20, y: 10 }
      },
      hover: {
        color: '#0054fdff'
      }
    });


    this.oscilloscope = new Oscilloscope(this, {
      x: 400,
      y: 300,
      width: 300,
      height: 200,
      maxMeasurements: 10,
      minVoltage: -5,
      maxVoltage: 5
    });

        this.add
            .text(
                width / 2 + 50,
                30,
                "Povleci komponente na mizo in zgradi svoj električni krog!",
                {
                    fontSize: "20px",
                    color: "#333",
                    fontStyle: "bold",
                    align: "center",
                    backgroundColor: "#ffffff88",
                    padding: { x: 15, y: 8 },
                }
            )
            .setOrigin(0.5);

        // shrani komponente na mizi
        this.placedComponents = [];
        this.gridSize = 40;

        // Listen for right-clicks on the scene and open menu when a component is under pointer
        this.input.on("pointerdown", (pointer) => {
            const isRightClick =
                (pointer.event && pointer.event.button === 2) ||
                (pointer.rightButtonDown && pointer.rightButtonDown()) ||
                (typeof pointer.buttons !== "undefined" &&
                    pointer.buttons === 2);

            if (!isRightClick) return;

            const objects = this.input.hitTestPointer(pointer);
            const target = objects.find(
                (o) => o && o.getData && o.getData("logicComponent")
            );
            if (target) {
                openComponentContextMenu(
                    this,
                    target,
                    pointer.worldX,
                    pointer.worldY
                );
                try {
                    if (
                        pointer.event &&
                        typeof pointer.event.preventDefault === "function"
                    )
                        pointer.event.preventDefault();
                } catch (e) {}
            }
        });

        // const scoreButton = this.add.text(this.scale.width / 1.1, 25, 'Lestvica', {
        //   fontFamily: 'Arial',
        //   fontSize: '18px',
        //   color: '#0066ff',
        //   backgroundColor: '#e1e9ff',
        //   padding: { x: 20, y: 10 }
        // })
        //   .setOrigin(0.5)
        //   .setInteractive({ useHandCursor: true })
        //   .on('pointerover', () => scoreButton.setStyle({ color: '#0044cc' }))
        //   .on('pointerout', () => scoreButton.setStyle({ color: '#0066ff' }))
        //   .on('pointerdown', () => {
        //     this.scene.start('ScoreboardScene');
        //   });

        // const simulate = this.add.text(this.scale.width / 1.1, 25, 'Simulacija', {
        //   fontFamily: 'Arial',
        //   fontSize: '18px',
        //   color: '#0066ff',
        //   backgroundColor: '#e1e9ff',
        //   padding: { x: 20, y: 10 }
        // })
        //   .setOrigin(0.5, -1)
        //   .setInteractive({ useHandCursor: true })
        //   .on('pointerover', () => simulate.setStyle({ color: '#0044cc' }))
        //   .on('pointerout', () => simulate.setStyle({ color: '#0066ff' }))
        //   .on('pointerdown', () => {
        //     console.log(this.graph);
        //     this.graph.simulate();
        //   });

    console.log(JSON.parse(localStorage.getItem('users')));

    this.testOscilloscopeSineWave();
  }

  getComponentDetails(type) {
    const details = {
      'baterija': 'Napetost: 3.3 V\nVir električne energije',
      'upor': 'Uporabnost: omejuje tok\nMeri se v ohmih (Ω)',
      'svetilka': 'Pretvarja električno energijo v svetlobo',
      'stikalo-on': 'Dovoljuje pretok toka',
      'stikalo-off': 'Prepreči pretok toka',
      'žica': 'Povezuje komponente\nKlikni za obračanje',
      'ampermeter': 'Meri električni tok\nEnota: amperi (A)',
      'voltmeter': 'Meri električno napetost\nEnota: volti (V)'
    };
    return details[type] || 'Komponenta';
  }

    createGrid() {
        const { width, height } = this.cameras.main;
        const gridGraphics = this.add.graphics();
        gridGraphics.lineStyle(2, 0x8b7355, 0.4);

        const gridSize = 40;
        const startX = 200;

        // vertikalne črte
        for (let x = startX; x < width; x += gridSize) {
            gridGraphics.beginPath();
            gridGraphics.moveTo(x, 0);
            gridGraphics.lineTo(x, height);
            gridGraphics.strokePath();
        }

        // horizontalne črte
        for (let y = 0; y < height; y += gridSize) {
            gridGraphics.beginPath();
            gridGraphics.moveTo(startX, y);
            gridGraphics.lineTo(width, y);
            gridGraphics.strokePath();
        }
    }

    snapToGrid(x, y) {
        const gridSize = this.gridSize;
        const startX = 200;

        // komponeta se postavi na presečišče
        const snappedX =
            Math.round((x - startX) / gridSize) * gridSize + startX;
        const snappedY = Math.round(y / gridSize) * gridSize;

        return { x: snappedX, y: snappedY };
    }

    getRandomInt(min, max) {
        const minCeiled = Math.ceil(min);
        const maxFloored = Math.floor(max);
        return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
    }

    updateLogicNodePositions(component) {
        const comp = component.getData("logicComponent");
        if (!comp) return;
        console.log("Updating logic node positions for", comp.id);
        // derive local offsets: prefer comp-local offsets, else use half display
        const halfW = 40;
        const halfH = 40;

        const localStart = comp.localStart || { x: -halfW, y: 0 };
        const localEnd = comp.localEnd || { x: halfW, y: 0 };

        // get container angle in radians (Phaser keeps both .angle and .rotation)
        const theta =
            typeof component.rotation === "number" && component.rotation
                ? component.rotation
                : Phaser.Math.DegToRad(component.angle || 0);

        const cos = Math.cos(theta);
        const sin = Math.sin(theta);
        const rotate = (p) => ({
            x: Math.round(p.x * cos - p.y * sin),
            y: Math.round(p.x * sin + p.y * cos),
        });

        const rStart = rotate(localStart);
        const rEnd = rotate(localEnd);

        const worldStart = {
            x: component.x + rStart.x,
            y: component.y + rStart.y,
        };
        const worldEnd = { x: component.x + rEnd.x, y: component.y + rEnd.y };

        const snappedStart = this.snapToGrid(worldStart.x, worldStart.y);
        const snappedEnd = this.snapToGrid(worldEnd.x, worldEnd.y);

        if (comp.start) {
            comp.start.x = snappedStart.x;
            comp.start.y = snappedStart.y;
            if (!comp.start.connected) comp.start.connected = new Set();
            this.graph.addNode(comp.start);
        }
        if (comp.end) {
            comp.end.x = snappedEnd.x;
            comp.end.y = snappedEnd.y;
            if (!comp.end.connected) comp.end.connected = new Set();
            this.graph.addNode(comp.end);
        }

        // debug dots are top-level objects (not children). update their positions
        const startDot = component.getData("startDot");
        const endDot = component.getData("endDot");
        if (startDot && comp.start) {
            startDot.x = comp.start.x;
            startDot.y = comp.start.y;
        }
        if (endDot && comp.end) {
            endDot.x = comp.end.x;
            endDot.y = comp.end.y;
        }
    }

    createNewComponent(x, y, type, color) {
        const component = createComponent(
            this,
            x,
            y,
            type,
            color,
            this.wireGraphics
        );
        if (!window.components) window.components = [];
        console.log("Created component:", component);
        window.components.push(component.getData("logicComponent"));
    }

    checkCircuit() {
        const currentChallenge = this.challenges[this.currentChallengeIndex];
        const placedTypes = this.placedComponents.map((comp) =>
            comp.getData("type")
        );
        console.log("components", placedTypes);
        this.checkText.setStyle({ color: "#cc0000" });
        // preverjas ce so vse komponente na mizi
        if (
            !currentChallenge.requiredComponents.every((req) =>
                placedTypes.includes(req)
            )
        ) {
            this.checkText.setText("Manjkajo komponente za krog.");
            return;
        }

        // je pravilna simulacija
        if (this.sim == undefined) {
            this.checkText.setText("Zaženi simlacijo");
            return;
        }

        if (this.sim == false) {
            this.checkText.setText(
                "Električni krog ni sklenjen. Preveri kako si ga sestavil"
            );
            return;
        }

        // je zaprt krog

        this.checkText.setStyle({ color: "#00aa00" });
        this.checkText.setText("Čestitke! Krog je pravilen.");
        this.addPoints(10);

        if (currentChallenge.theory) {
            this.showTheory(currentChallenge.theory);
        } else {
            this.checkText.setStyle({ color: "#00aa00" });
            this.checkText.setText("Čestitke! Krog je pravilen.");
            this.addPoints(10);
            this.time.delayedCall(2000, () => this.nextChallenge());
        }
        // this.placedComponents.forEach(comp => comp.destroy());
        // this.placedComponents = [];
        // this.time.delayedCall(2000, () => this.nextChallenge());
        // const isCorrect = currentChallenge.requiredComponents.every(req => placedTypes.includes(req));
        // if (isCorrect) {
        //   this.checkText.setText('Čestitke! Krog je pravilen.');
        //   this.addPoints(10);
        //   this.time.delayedCall(2000, () => this.nextChallenge());
        // }
        // else {
        //   this.checkText.setText('Krog ni pravilen. Poskusi znova.');
        // }
    }

    showCalculationFormulas() {
        // Create modal background
        if (this.calculationModal) {
            this.calculationModal.destroy();
            this.calculationModal = null;
            return;
        }

        const width = this.scale.width;
        const height = this.scale.height;

        this.calculationModal = this.add.container(0, 0);

        // Semi-transparent background
        const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
        bg.setInteractive();
        bg.on('pointerdown', () => {
            this.calculationModal.destroy();
            this.calculationModal = null;
        });

        // Modal panel
        const panelWidth = 700;
        const panelHeight = 550;
        const panel = this.add.rectangle(width / 2, height / 2, panelWidth, panelHeight, 0xffffff);
        panel.setStrokeStyle(3, 0x333333);

        // Title
        const title = this.add.text(width / 2, height / 2 - panelHeight / 2 + 30, 'Formule za Izračune', {
            fontSize: '28px',
            fontStyle: 'bold',
            color: '#333333'
        });
        title.setOrigin(0.5);

        // Create scrollable content area
        const contentX = width / 2 - panelWidth / 2 + 40;
        const contentStartY = height / 2 - panelHeight / 2 + 80;
        const contentAreaHeight = panelHeight - 150; // Space for title and close button
        const lineHeight = 35;

        // Create a container for scrollable content
        const scrollContainer = this.add.container(0, 0);
        let currentY = 0;

        const formulas = [
            { section: 'Ohmov zakon:', style: { fontSize: '20px', fontStyle: 'bold', color: '#0066cc' } },
            { text: 'U = I × R    (Napetost = Tok × Upor)', style: { fontSize: '16px', color: '#333333' } },
            { text: 'I = U / R     (Tok = Napetost / Upor)', style: { fontSize: '16px', color: '#333333' } },
            { text: 'R = U / I     (Upor = Napetost / Tok)', style: { fontSize: '16px', color: '#333333' } },
            { text: '', style: {} },
            
            { section: 'Zaporedna vezava (serijska):', style: { fontSize: '20px', fontStyle: 'bold', color: '#0066cc' } },
            { text: 'R_skupni = R₁ + R₂ + R₃ + ...', style: { fontSize: '16px', color: '#333333' } },
            { text: 'I_skupni = I₁ = I₂ = I₃ = ... (enak tok)', style: { fontSize: '16px', color: '#333333' } },
            { text: 'U_skupni = U₁ + U₂ + U₃ + ...', style: { fontSize: '16px', color: '#333333' } },
            { text: '', style: {} },
            
            { section: 'Vzporedna vezava (paralelna):', style: { fontSize: '20px', fontStyle: 'bold', color: '#0066cc' } },
            { text: '1/R_skupni = 1/R₁ + 1/R₂ + 1/R₃ + ...', style: { fontSize: '16px', color: '#333333' } },
            { text: 'U_skupni = U₁ = U₂ = U₃ = ...(enaka napetost)', style: { fontSize: '16px', color: '#333333' } },
            { text: 'I_skupni = I₁ + I₂ + I₃ + ...', style: { fontSize: '16px', color: '#333333' } },
            { text: '', style: {} },
            
            { section: 'Moč:', style: { fontSize: '20px', fontStyle: 'bold', color: '#0066cc' } },
            { text: 'P = U × I    (Moč = Napetost × Tok)', style: { fontSize: '16px', color: '#333333' } },
            { text: 'P = I² × R   (Moč = Tok² × Upor)', style: { fontSize: '16px', color: '#333333' } },
            { text: 'P = U² / R   (Moč = Napetost² / Upor)', style: { fontSize: '16px', color: '#333333' } }
        ];

        formulas.forEach((formula) => {
            if (formula.section) {
                const sectionText = this.add.text(0, currentY, formula.section, formula.style);
                scrollContainer.add(sectionText);
                currentY += lineHeight;
            } else if (formula.text === '') {
                currentY += 15;
            } else {
                const formulaText = this.add.text(20, currentY, formula.text, formula.style);
                scrollContainer.add(formulaText);
                currentY += lineHeight - 5;
            }
        });

        const totalContentHeight = currentY;

        // Set initial position of scroll container
        scrollContainer.x = contentX;
        scrollContainer.y = contentStartY;
        
        // Create mask for scrollable area
        const maskShape = this.make.graphics();
        maskShape.fillStyle(0xffffff);
        maskShape.fillRect(
            contentX,
            contentStartY,
            panelWidth - 80,
            contentAreaHeight
        );
        const mask = maskShape.createGeometryMask();
        scrollContainer.setMask(mask);
        
        let scrollOffset = 0;

        // Scroll zone (invisible interactive area)
        const scrollZone = this.add.rectangle(
            width / 2,
            contentStartY + contentAreaHeight / 2,
            panelWidth - 40,
            contentAreaHeight,
            0xffffff,
            0
        );
        scrollZone.setInteractive();

        // Mouse wheel scrolling
        scrollZone.on('wheel', (pointer, deltaX, deltaY) => {
            scrollOffset += deltaY * 0.5;
            const maxScroll = Math.max(0, totalContentHeight - contentAreaHeight);
            scrollOffset = Phaser.Math.Clamp(scrollOffset, 0, maxScroll);
            scrollContainer.y = contentStartY - scrollOffset;
        });

        // Drag scrolling
        let isDragging = false;
        let dragStartY = 0;
        let dragStartScroll = 0;

        scrollZone.on('pointerdown', (pointer) => {
            isDragging = true;
            dragStartY = pointer.y;
            dragStartScroll = scrollOffset;
        });

        this.input.on('pointermove', (pointer) => {
            if (isDragging) {
                const deltaY = dragStartY - pointer.y;
                scrollOffset = dragStartScroll + deltaY;
                const maxScroll = Math.max(0, totalContentHeight - contentAreaHeight);
                scrollOffset = Phaser.Math.Clamp(scrollOffset, 0, maxScroll);
                scrollContainer.y = contentStartY - scrollOffset;
            }
        });

        this.input.on('pointerup', () => {
            isDragging = false;
        });

        // Close button
        const closeButton = this.add.rectangle(width / 2, height / 2 + panelHeight / 2 - 30, 120, 40, 0x0066cc);
        closeButton.setInteractive({ useHandCursor: true });
        closeButton.on('pointerdown', () => {
            this.calculationModal.destroy();
            this.calculationModal = null;
        });
        closeButton.on('pointerover', () => closeButton.setFillStyle(0x0088ee));
        closeButton.on('pointerout', () => closeButton.setFillStyle(0x0066cc));

        const closeText = this.add.text(width / 2, height / 2 + panelHeight / 2 - 30, 'Zapri', {
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#ffffff'
        });
        closeText.setOrigin(0.5);

        // Add all elements to container (note: maskShape should NOT be added to avoid covering text)
        this.calculationModal.add([bg, panel, title, scrollContainer, scrollZone, closeButton, closeText]);
    }

    nextChallenge() {
        this.currentChallengeIndex++;
        localStorage.setItem(
            "currentChallengeIndex",
            this.currentChallengeIndex.toString()
        );
        this.checkText.setText("");

        if (this.currentChallengeIndex < this.challenges.length) {
            this.promptText.setText(
                this.challenges[this.currentChallengeIndex].prompt
            );
        } else {
            this.promptText.setText(
                "Vse naloge so uspešno opravljene! Čestitke!"
            );
            localStorage.removeItem("currentChallengeIndex");
        }
    }

    addPoints(points) {
        const user = localStorage.getItem("username");
        const users = JSON.parse(localStorage.getItem("users")) || [];
        const userData = users.find((u) => u.username === user);
        if (userData) {
            userData.score = (userData.score || 0) + points;
        }
        localStorage.setItem("users", JSON.stringify(users));
    }

    showTheory(theoryText) {
        const { width, height } = this.cameras.main;

        this.theoryBack = this.add
            .rectangle(width / 2, height / 2, width - 100, 150, 0x000000, 0.8)
            .setOrigin(0.5)
            .setDepth(10);

        this.theoryText = this.add
            .text(width / 2, height / 2, theoryText, {
                fontSize: "16px",
                color: "#ffffff",
                fontStyle: "bold",
                align: "center",
                wordWrap: { width: width - 150 },
            })
            .setOrigin(0.5)
            .setDepth(11);

    this.continueButton = new UIButton(this, {
      x: width / 2,
      y: height / 2 + 70,
      text: 'Nadaljuj',
      onClick: () => {
        this.hideTheory();
        this.placedComponents.forEach(comp => comp.destroy());
        this.placedComponents = [];
        this.nextChallenge();
      },
      style: {
        fontSize: '18px',
        color: '#0066ff',
        backgroundColor: '#ffffff',
        padding: { x: 20, y: 10 }
      },
      hover: {
        color: '#0044cc'
      },
      depth: 11
    });


  }

  hideTheory() {
    if (this.theoryBack) {
      this.theoryBack.destroy();
      this.theoryBack = null;
    }
    if (this.theoryText) {
      this.theoryText.destroy();
      this.theoryText = null;
    }
    if (this.continueButton) {
      this.continueButton.destroy();
      this.continueButton = null;
    }
  }

  /**
   * Test function to demonstrate oscilloscope with a sine wave
   */
  testOscilloscopeSineWave() {
    // Initialize test parameters
    let time = 0;
    const frequency = 0.1; // Hz (10 second period, so we see variation across 10 measurements)
    const amplitude = 4; // Volts (range -4 to +4, fits within -5 to +5)
    
    // Create a timer that measures voltage once per second
    this.oscilloscopeTimer = this.time.addEvent({
      delay: 1000, // 1 second
      callback: () => {
        // Calculate sine wave voltage: V = amplitude * sin(2π * frequency * time)
        const voltage = amplitude * Math.sin(2 * Math.PI * frequency * time);
        // console.logtime:", time, "voltage:", voltage.toFixed(3));
        
        // Measure the voltage with the oscilloscope
        if (this.oscilloscope) {
          this.oscilloscope.measure(voltage);
        }else{
          console.log("no osciloscope found")
        }
        
        time += 1; // Increment time by 1 second
      },
      loop: true
    });
  }

  /**
   * Stop the oscilloscope test
   */
  stopOscilloscopeTest() {
    if (this.oscilloscopeTimer) {
      this.oscilloscopeTimer.remove();
      this.oscilloscopeTimer = null;
    }
    if (this.oscilloscope) {
      this.oscilloscope.clear();
    }
  }

  /**
   * Export components to JSON format and download as file
   */
  exportComponents() {
    console.log('🔽 Exporting components...');
    
    // Only export placed components (not source components in sidebar)
    if (!this.placedComponents || this.placedComponents.length === 0) {
      console.warn('No placed components to export');
      alert('Ni komponent za izvoz!');
      return;
    }

    // Create export data structure
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      components: []
    };

    // Export only placed components (those on the workspace, not in panel)
    this.placedComponents.forEach(visualContainer => {
      const comp = visualContainer.getData('logicComponent');
      if (!comp) return;
      
      // Skip if component is in panel (source component)
      if (visualContainer.getData('isInPanel')) {
        console.log(`Skipping panel component: ${comp.id}`);
        return;
      }
      
      const x = visualContainer.x;
      const y = visualContainer.y;
      const rotation = visualContainer.rotation || 0;
      
      const componentData = {
        id: comp.id,
        type: comp.type,
        name: comp.name,
        x: x,
        y: y,
        rotation: rotation,
        start: {
          id: comp.start.id,
          x: comp.start.x,
          y: comp.start.y,
          wireId: comp.start.wire ? comp.start.wire.id : null
        },
        end: {
          id: comp.end.id,
          x: comp.end.x,
          y: comp.end.y,
          wireId: comp.end.wire ? comp.end.wire.id : null
        }
      };

      // Add component-specific properties
      if (comp.type === 'battery') {
        componentData.voltage = comp.voltage || 9;
      } else if (comp.type === 'resistor') {
        componentData.resistance = comp.resistance || 100;
      }

      exportData.components.push(componentData);
    });

    // Convert to JSON
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Create download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `circuit_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('✅ Export successful:', exportData.components.length, 'components');
    alert(`Izvoženo ${exportData.components.length} komponent!`);
  }

  /**
   * Import components from JSON file
   */
  importComponents() {
    console.log('🔼 Importing components...');
    
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importData = JSON.parse(event.target.result);
          
          if (!importData.components || !Array.isArray(importData.components)) {
            throw new Error('Invalid file format');
          }

          console.log('📦 Import data:', importData);
          console.log('📦 Components to import:', importData.components.length);
          
          // Clear existing components
          this.clearAllComponents();
          
          // Maps to track created objects
          const nodeMap = new Map(); // oldNodeId -> new Node object
          const wireMap = new Map(); // oldWireId -> new Wire object
          const componentMap = new Map(); // oldCompId -> new visual component container
          
          // Step 1: Create all components with their visual containers
          importData.components.forEach(compData => {
            console.log(`📦 Creating component: ${compData.type} at (${compData.x}, ${compData.y})`);
            
            // Map component type to the visual type expected by createComponent
            let visualType;
            if (compData.type === 'battery') visualType = 'baterija';
            else if (compData.type === 'resistor') visualType = 'upor';
            else if (compData.type === 'bulb') visualType = 'svetilka';
            else if (compData.type === 'switch') visualType = 'stikalo-on';
            else if (compData.type === 'ammeter' || compData.type === 'ampermeter') visualType = 'ampermeter';
            else if (compData.type === 'voltmeter') visualType = 'voltmeter';
            else {
              console.warn(`Unknown component type: ${compData.type}`);
              return;
            }
            
            // Create the visual component using the helper
            const visualComponent = createComponent(this, compData.x, compData.y, visualType, 0xffffff);
            const logicComponent = visualComponent.getData('logicComponent');
            
            // IMPORTANT: Mark as placed component (not source component in sidebar)
            visualComponent.setData('isInPanel', false);
            
            // Add to window.components if createComponent didn't do it
            if (!window.components) window.components = [];
            if (!window.components.includes(logicComponent)) {
              window.components.push(logicComponent);
            }
            
            // Add to placedComponents array
            this.placedComponents.push(visualComponent);
            
            // Add logic component to graph
            this.graph.addComponent(logicComponent);
            if (logicComponent.start) this.graph.addNode(logicComponent.start);
            if (logicComponent.end) this.graph.addNode(logicComponent.end);
            
            // Set rotation if it exists
            if (compData.rotation) {
              visualComponent.setRotation(compData.rotation);
            }
            
            // CRITICAL: Update logic node positions to world coordinates
            // This ensures nodes are at correct positions for wiring
            this.updateLogicNodePositions(visualComponent);
            
            // Update component-specific properties
            if (compData.type === 'battery' && compData.voltage) {
              logicComponent.voltage = compData.voltage;
            } else if (compData.type === 'resistor' && compData.resistance) {
              logicComponent.resistance = compData.resistance;
            }
            
            // Update the display label with the component name
            const label = visualComponent.getData('displayLabel');
            if (label && logicComponent.values && logicComponent.values.name) {
              label.setText(logicComponent.values.name);
            }
            
            // Store mappings
            nodeMap.set(compData.start.id, logicComponent.start);
            nodeMap.set(compData.end.id, logicComponent.end);
            componentMap.set(compData.id, visualComponent);
          });
          
          // Step 2: Group nodes by wireId and create wires
          const wireGroups = new Map(); // wireId -> array of nodes
          
          console.log('📦 Processing wire connections...');
          importData.components.forEach(compData => {
            const startNode = nodeMap.get(compData.start.id);
            const endNode = nodeMap.get(compData.end.id);
            
            console.log(`  Component ${compData.id}: start.wireId=${compData.start.wireId}, end.wireId=${compData.end.wireId}`);
            
            // Group start nodes by wireId
            if (compData.start.wireId && startNode) {
              if (!wireGroups.has(compData.start.wireId)) {
                wireGroups.set(compData.start.wireId, []);
              }
              wireGroups.get(compData.start.wireId).push(startNode);
              console.log(`    Added start node to wire group ${compData.start.wireId}`);
            }
            
            // Group end nodes by wireId
            if (compData.end.wireId && endNode) {
              if (!wireGroups.has(compData.end.wireId)) {
                wireGroups.set(compData.end.wireId, []);
              }
              wireGroups.get(compData.end.wireId).push(endNode);
              console.log(`    Added end node to wire group ${compData.end.wireId}`);
            }
          });
          
          // Create wires and connect all nodes that share the same wireId
          console.log(`📦 Creating ${wireGroups.size} wires...`);
          wireGroups.forEach((nodes, wireId) => {
            if (nodes.length < 2) {
              console.warn(`Wire ${wireId} has less than 2 nodes, skipping`);
              return;
            }
            
            // Wire constructor expects: (startNode, endNode, workspace)
            // Use first two nodes to initialize the wire
            const firstNode = nodes[0];
            const secondNode = nodes[1];
            
            console.log(`  Creating wire ${wireId} with ${nodes.length} nodes`);
            const wire = new Wire(firstNode, secondNode, this);
            
            // If there are more than 2 nodes, add them to the wire
            if (nodes.length > 2) {
              for (let i = 2; i < nodes.length; i++) {
                if (!nodes[i].wire) {
                  console.log(`  Adding additional node ${nodes[i].id} to wire ${wireId}`);
                  wire.addNode(nodes[i]);
                }
              }
            }
            
            wireMap.set(wireId, wire);
          });
          
          console.log('✅ Import successful!');
          console.log('   Components created:', window.components.length);
          console.log('   Wires created:', wireMap.size);
          alert(`Uvoženo ${importData.components.length} komponent!`);
          
        } catch (error) {
          console.error('❌ Import failed:', error);
          alert('Napaka pri uvozu datoteke!');
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  }

  /**
   * Clear all placed components from the workspace (keeps panel components)
   */
  clearAllComponents() {
    console.log('🗑️ Clearing placed components and wires...');
    
    // Collect all unique wires from placed components before destroying them
    const wiresToDestroy = new Set();
    
    // Only destroy placed components, not panel (source) components
    if (this.placedComponents && this.placedComponents.length > 0) {
      // Clone the array to avoid modification during iteration
      const componentsToDestroy = [...this.placedComponents];
      
      componentsToDestroy.forEach(visualContainer => {
        const comp = visualContainer.getData('logicComponent');
        if (!comp) return;
        
        // Only destroy if NOT in panel (skip source components)
        if (visualContainer.getData('isInPanel')) {
          console.log(`Skipping panel component: ${comp.id}`);
          return;
        }
        
        console.log(`Destroying placed component: ${comp.id}`);
        
        // Collect wires for destruction
        if (comp.start && comp.start.wire) {
          wiresToDestroy.add(comp.start.wire);
        }
        if (comp.end && comp.end.wire) {
          wiresToDestroy.add(comp.end.wire);
        }
        
        // Destroy start/end node visual dots if they exist
        if (comp.start && comp.start.graphics) {
          comp.start.graphics.destroy();
        }
        
        if (comp.end && comp.end.graphics) {
          comp.end.graphics.destroy();
        }
        
        // Remove from graph
        if (this.graph) {
          if (comp.start) this.graph.nodes.delete(comp.start);
          if (comp.end) this.graph.nodes.delete(comp.end);
          if (this.graph.components) {
            const compIndex = this.graph.components.indexOf(comp);
            if (compIndex > -1) this.graph.components.splice(compIndex, 1);
          }
        }
        
        // Destroy the visual Phaser container
        visualContainer.destroy();
        
        // Call destroy on the logic component itself
        if (comp.destroy) {
          comp.destroy();
        }
      });
    }
    
    // Destroy all collected wires
    console.log(`🗑️ Destroying ${wiresToDestroy.size} wires...`);
    wiresToDestroy.forEach(wire => {
      if (wire && wire.deleteWire) {
        wire.deleteWire();
      }
    });
    
    // Clear the placedComponents array
    this.placedComponents = [];
    
    // Clean up window.components array - remove only non-panel components
    if (window.components) {
      window.components = window.components.filter(comp => {
        const visualContainer = comp.componentObject;
        return visualContainer && visualContainer.getData('isInPanel');
      });
    }
    
    console.log('✅ All placed components and wires cleared');
  }

}

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: "game-container",
    backgroundColor: "#f0f0f0",
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [LabScene, WorkspaceScene],
    physics: {
        default: "arcade",
        arcade: {
            debug: false,
        },
    },
};
