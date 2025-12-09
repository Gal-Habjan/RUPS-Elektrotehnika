import { Node } from "../logic/node.js";
import { Component } from "./component.js";
import { ComponentDirection } from "./ComponentDirection.js";

class Battery extends Component {
    static count = 0;
    static prefix = "B";

    constructor(id, start, end, voltage, componentObject = null) {
        super(
            id,
            "battery",
            start,
            end,
            "src/components/battery.png",
            componentObject,
            ComponentDirection.HORIZONTAL,
            true
        );

        this.isAC = false;
        this.debug_color = 0x00ff00;

        this.currentInterval = 0;
        this.intervalId = null;

        this.properties = {
            fields: [
                { label: "Name", type: "text", key: "name" },
                {
                    label: "Source",
                    key: "sourceType",
                    type: "radio",
                    options: ["DC", "AC"],
                },
                {
                    label: "Voltage (V)",
                    type: "number",
                    key: "maxVoltage",
                    automatic: false,
                },
                {
                    label: "Current (A)",
                    type: "number",
                    key: "maxCurrent",
                    automatic: false,
                },
                {
                    label: "Power (W)",
                    type: "number",
                    key: "power",
                    automatic: true,
                },
                {
                    label: "Clock Speed (Hz)",
                    type: "number",
                    key: "clockSpeed",
                    automatic: false,
                },

                {
                    label: "Period Time (s)",
                    type: "number",
                    key: "periodTime",
                    automatic: false,
                },
                {
                    label: "Seconds Shown (s)",
                    type: "number",
                    key: "shownTime",
                    automatic: false,
                },
            ],
        };
        this.values = {
            name: "Battery",
            sourceType: "DC",
            voltage: 3.3,
            current: 1,
            maxCurrent: 1,
            power: { value: 0, automatic: true },
            resistance: { value: 0, automatic: true },
            maxVoltage: 3.3,
            clockSpeed: 20,
            periodTime: 1,
            shownTime: 5,
        };
        this.startInterval();
    }
    startInterval() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        this.currentInterval = 0;
        const clockSpeed = this.values.clockSpeed || 1;
        this.intervalId = setInterval(() => {
            this.adjustVoltage();
        }, 1000 / clockSpeed);
    }
    adjustVoltage() {
        if (this.values.sourceType == "DC") {
            this.currentInterval = 0;
            this.values.voltage = this.values.maxVoltage;
            this.values.current = this.values.maxCurrent;
        } else {
            // console.log(
            //     this.values.maxVoltage,

            //     Math.PI * this.currentInterval,
            //     this.values.clockSpeed,
            //     this.values.periodTime
            // );
            this.values.voltage =
                this.values.maxVoltage *
                Math.sin(
                    (2 * Math.PI * this.currentInterval) /
                        (this.values.clockSpeed * this.values.periodTime)
                );
            this.values.current =
                this.values.maxCurrent *
                Math.sin(
                    (2 * Math.PI * this.currentInterval) /
                        (this.values.clockSpeed * this.values.periodTime)
                );
            this.currentInterval++;
        }

        if (this.voltmeter) this.voltmeter.measure(this.values.voltage);
        if (this.amperMeter) this.amperMeter.measure(this.values.current);
        if (this.wattMeter) this.wattMeter.measure(this.values.power.value);
    }
}

export { Battery };
