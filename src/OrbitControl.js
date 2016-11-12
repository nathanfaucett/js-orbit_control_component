var environment = require("@nathanfaucett/environment"),
    mathf = require("@nathanfaucett/mathf"),
    vec3 = require("@nathanfaucett/vec3"),
    isNullOrUndefined = require("@nathanfaucett/is_null_or_undefined"),
    sceneGraph = require("@nathanfaucett/scene_graph");


var Component = sceneGraph.Component,
    ComponentPrototype = Component.prototype,

    MIN_POLOR = 0,
    MAX_POLOR = mathf.PI,

    NONE = 1,
    ROTATE = 2,
    PAN = 3,

    OrbitControlPrototype;


module.exports = OrbitControl;


function OrbitControl() {
    var _this = this;

    Component.call(this);

    this.speed = null;
    this.zoomSpeed = null;

    this.allowZoom = null;
    this.allowPan = null;
    this.allowRotate = null;

    this.target = vec3.create();

    this._offset = vec3.create();
    this._pan = vec3.create();
    this._scale = null;
    this._thetaDelta = null;
    this._phiDelta = null;
    this._state = null;

    this.onTouchStart = function(e, touch, touches) {
        OrbitControl_onTouchStart(_this, e, touch, touches);
    };
    this.onTouchEnd = function() {
        OrbitControl_onTouchEnd(_this);
    };
    this.onTouchMove = function(e, touch, touches) {
        OrbitControl_onTouchMove(_this, e, touch, touches);
    };

    this.onMouseUp = function() {
        OrbitControl_onMouseUp(_this);
    };
    this.onMouseDown = function(e, button, mouse) {
        OrbitControl_onMouseDown(_this, e, button, mouse);
    };
    this.onMouseMove = function(e, mouse) {
        OrbitControl_onMouseMove(_this, e, mouse);
    };
    this.onMouseWheel = function(e, wheel) {
        OrbitControl_onMouseWheel(_this, e, wheel);
    };
}
Component.extend(OrbitControl, "openuni.OrbitControl");
OrbitControlPrototype = OrbitControl.prototype;

OrbitControlPrototype.construct = function(options) {

    ComponentPrototype.construct.call(this);

    options = options || {};

    this.speed = options.speed > mathf.EPSILON ? options.speed : 1;
    this.zoomSpeed = options.zoomSpeed > mathf.EPSILON ? options.zoomSpeed : 2;

    this.allowZoom = isNullOrUndefined(options.allowZoom) ? true : !!options.allowZoom;
    this.allowPan = isNullOrUndefined(options.allowPan) ? true : !!options.allowPan;
    this.allowRotate = isNullOrUndefined(options.allowRotate) ? true : !!options.allowRotate;

    if (options.target) {
        vec3.copy(this.target, options.target);
    }

    this._scale = 1;
    this._thetaDelta = 0;
    this._phiDelta = 0;
    this._state = NONE;

    return this;
};

OrbitControlPrototype.destructor = function() {

    ComponentPrototype.destructor.call(this);

    this.speed = null;
    this.zoomSpeed = null;

    this.allowZoom = null;
    this.allowPan = null;
    this.allowRotate = null;

    vec3.set(this.target, 0, 0, 0);

    vec3.set(this._offset, 0, 0, 0);
    vec3.set(this._pan, 0, 0, 0);

    this._scale = null;
    this._thetaDelta = null;
    this._phiDelta = null;
    this._state = null;

    return this;
};

OrbitControlPrototype.init = function() {
    var entity = this.entity,
        scene = entity.scene,
        input = scene.application.input;

    ComponentPrototype.init.call(this);

    if (environment.mobile) {
        input.on("touchstart", this.onTouchStart);
        input.on("touchend", this.onTouchEnd);
        input.on("touchmove", this.onTouchMove);
    } else {
        input.on("mouseup", this.onMouseUp);
        input.on("mousedown", this.onMouseDown);
        input.on("mousemove", this.onMouseMove);
        input.on("wheel", this.onMouseWheel);
    }

    return this;
};

OrbitControlPrototype.clear = function(emitEvent) {
    var entity = this.entity,
        scene = entity.scene,
        input = scene.input;

    ComponentPrototype.clear.call(this, emitEvent);

    if (environment.mobile) {
        input.off("touchstart", this.onTouchStart);
        input.off("touchend", this.onTouchEnd);
        input.off("touchmove", this.onTouchMove);
    } else {
        input.off("mouseup", this.onMouseUp);
        input.off("mousedown", this.onMouseDown);
        input.off("mousemove", this.onMouseMove);
        input.off("wheel", this.onMouseWheel);
    }

    return this;
};

OrbitControlPrototype.toJSON = function(json) {

    json = ComponentPrototype.toJSON.call(this, json);

    json.speed = this.speed;
    json.zoomSpeed = this.zoomSpeed;

    json.allowZoom = this.allowZoom;
    json.allowPan = this.allowPan;
    json.allowRotate = this.allowRotate;

    json.target = this.target;

    json._scale = this._scale;
    json._thetaDelta = this._thetaDelta;
    json._phiDelta = this._phiDelta;
    json._state = this._state;

    return this;
};

OrbitControlPrototype.fromJSON = function(json) {

    ComponentPrototype.fromJSON.call(this, json);

    this.speed = json.speed;
    this.zoomSpeed = json.zoomSpeed;

    this.allowZoom = json.allowZoom;
    this.allowPan = json.allowPan;
    this.allowRotate = json.allowRotate;

    vec3.copy(this.target, json.target);
    vec3.set(this._offset, 0, 0, 0);
    vec3.set(this._pan, 0, 0, 0);

    this._scale = json._scale;
    this._thetaDelta = json._thetaDelta;
    this._phiDelta = json._phiDelta;
    this._state = json._state;

    return this;
};

OrbitControlPrototype.setTarget = function(target) {
    vec3.copy(this.target, target);
    return this;
};

function OrbitControl_update(_this) {
    var entity = _this.entity,
        camera = entity.getComponent("camera.Camera"),
        transform = entity.getComponent("transform.Transform3D"),
        position = transform.getPosition(),
        target = _this.target,
        offset = _this._offset,
        pan = _this._pan,
        theta, phi, radius;


    vec3.sub(offset, position, target);
    theta = mathf.atan2(offset[0], offset[1]);
    phi = mathf.atan2(mathf.sqrt(offset[0] * offset[0] + offset[1] * offset[1]), offset[2]);

    theta += _this._thetaDelta;
    phi += _this._phiDelta;

    phi = mathf.max(MIN_POLOR, mathf.min(MAX_POLOR, phi));
    phi = mathf.max(mathf.EPSILON, mathf.min(mathf.PI - mathf.EPSILON, phi));

    radius = vec3.length(offset) * _this._scale;

    if (camera.orthographic) {
        camera.setOrthographicSize(camera.orthographicSize * _this._scale);
    }

    vec3.add(target, target, pan);

    offset[0] = radius * mathf.sin(phi) * mathf.sin(theta);
    offset[1] = radius * mathf.sin(phi) * mathf.cos(theta);
    offset[2] = radius * mathf.cos(phi);

    vec3.add(transform.getLocalPosition(), target, offset);
    transform.setNeedsUpdate();

    transform.lookAt(target);

    _this._scale = 1;
    _this._thetaDelta = 0;
    _this._phiDelta = 0;
    vec3.set(pan, 0, 0, 0);
}

var OrbitControl_pan_panOffset = vec3.create();

function OrbitControl_pan(_this, delta) {
    var panOffset = OrbitControl_pan_panOffset,
        pan = _this._pan,
        entity = _this.entity,
        camera = entity.getComponent("camera.Camera"),
        transform = entity.getComponent("transform.Transform3D"),
        worldMatrix = transform.getWorldMatrix(),
        position = transform.getLocalPosition(),
        targetDistance;

    vec3.sub(panOffset, position, _this.target);
    targetDistance = vec3.length(panOffset);

    if (!camera.orthographic) {
        targetDistance *= mathf.tan(mathf.degsToRads(camera.fov * 0.5));

        vec3.set(panOffset, worldMatrix[0], worldMatrix[1], worldMatrix[2]);
        vec3.smul(panOffset, panOffset, -2 * delta[0] * targetDistance * camera.invWidth);
        vec3.add(pan, pan, panOffset);

        vec3.set(panOffset, worldMatrix[4], worldMatrix[5], worldMatrix[6]);
        vec3.smul(panOffset, panOffset, 2 * delta[1] * targetDistance * camera.invHeight);
        vec3.add(pan, pan, panOffset);
    } else {
        targetDistance *= camera.orthographicSize * 0.5;

        vec3.set(panOffset, worldMatrix[0], worldMatrix[1], worldMatrix[2]);
        vec3.smul(panOffset, panOffset, -2 * delta[0] * targetDistance * camera.invWidth);
        vec3.add(pan, pan, panOffset);

        vec3.set(panOffset, worldMatrix[4], worldMatrix[5], worldMatrix[6]);
        vec3.smul(panOffset, panOffset, 2 * delta[1] * targetDistance * camera.invHeight);
        vec3.add(pan, pan, panOffset);
    }
}

function OrbitControl_onTouchStart(_this, e, touch, touches) {
    var length = touches._array.length;

    if (length === 1) {
        _this._state = ROTATE;
    } else if (length === 2 && _this.allowPan) {
        _this._state = PAN;
    } else {
        _this._state = NONE;
    }
}

function OrbitControl_onTouchEnd(_this) {
    _this._state = NONE;
}

function OrbitControl_onTouchMove(_this, e, touch) {
    var delta = touch.delta,
        camera = _this.entity.getComponent("camera.Camera");

    if (_this._state === ROTATE) {
        _this._thetaDelta += 2 * mathf.PI * delta[0] * camera.invWidth * _this.speed;
        _this._phiDelta -= 2 * mathf.PI * delta[1] * camera.invHeight * _this.speed;
        OrbitControl_update(_this);
    } else if (_this._state === PAN) {
        OrbitControl_pan(_this, delta);
        OrbitControl_update(_this);
    }
}

function OrbitControl_onMouseUp(_this) {
    _this._state = NONE;
}

var LEFT_MOUSE = "mouse0",
    MIDDLE_MOUSE = "mouse1";

function OrbitControl_onMouseDown(_this, e, button) {
    if (button.name === LEFT_MOUSE && _this.allowRotate) {
        _this._state = ROTATE;
    } else if (button.name === MIDDLE_MOUSE && _this.allowPan) {
        _this._state = PAN;
    } else {
        _this._state = NONE;
    }
}

function OrbitControl_onMouseMove(_this, e, mouse) {
    var delta = mouse.delta,
        camera = _this.entity.getComponent("camera.Camera");

    if (_this._state === ROTATE) {
        _this._thetaDelta += 2 * mathf.PI * delta[0] * camera.invWidth * _this.speed;
        _this._phiDelta -= 2 * mathf.PI * delta[1] * camera.invHeight * _this.speed;
        OrbitControl_update(_this);
    } else if (_this._state === PAN) {
        OrbitControl_pan(_this, delta);
        OrbitControl_update(_this);
    }
}

function OrbitControl_onMouseWheel(_this, e, wheel) {
    if (_this.allowZoom) {
        if (wheel < 0) {
            _this._scale *= mathf.pow(0.95, _this.zoomSpeed);
            OrbitControl_update(_this);
        } else {
            _this._scale /= mathf.pow(0.95, _this.zoomSpeed);
            OrbitControl_update(_this);
        }
    }
}