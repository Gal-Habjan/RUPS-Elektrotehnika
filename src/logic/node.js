class Node {
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.initX = x;
        this.initY = y;
        this.connected = new Set();
        this.bit_value = 0;
        this.wire = null;
        this.component = null;
    }
    setup(component) {
        this.component = component;
    }
    move() {
        if (this.wire) this.wire.draw();
    }
    destroyNode() {
        if (this.wire) this.wire.removeNode(this);
    }

    // addConnection(node, wire) {
    //     this.connected.set(node.id, { node: node, wire: wire });
    //     node.connected.set(this.id, { node: this, wire: wire });
    // }

    // removeConnection(node) {
    //     this.connected.delete(node.id);
    //     node.connected.delete(this.id);
    // }
}

export { Node };
