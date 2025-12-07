import { Component } from "./component";
import { ComponentDirection } from "./ComponentDirection.js";

class Switch extends Component {
    static count = 0;
    static prefix = "S";

    constructor(id, start, end, is_on = false, componentObject = null) {
        const img = is_on
            ? "src/components/switch-on.png"
            : "src/components/switch-off.png";
        super(
            id,
            "switch",
            start,
            end,
            img,
            componentObject,
            ComponentDirection.HORIZONTAL,
            false
        );
        this.is_on = is_on;
        this.values.name = Switch.prefix + ++Switch.count;
    }
    switchToggle() {
        console.log("TOGGLE");
        this.is_on = !this.is_on;
        if (this.componentObject) {
            const newTexture = this.is_on ? "stikalo-on" : "stikalo-off";
            const imageChild = this.componentObject.list.find(
                (child) => child.type === "Image"
            );
            if (imageChild) {
                console.log("setexture");
                imageChild.setTexture(newTexture);
            }
        }
    }
}

export { Switch };
