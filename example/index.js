var sceneGraph = require("@nathanfaucett/scene_graph"),
    sceneRenderer = require("@nathanfaucett/scene_renderer"),
    cameraComponent = require("@nathanfaucett/camera_component"),
    transformComponents = require("@nathanfaucett/transform_components"),
    meshComponent = require("@nathanfaucett/mesh_component"),
    Shader = require("@nathanfaucett/shader"),
    Material = require("@nathanfaucett/material"),
    Geometry = require("@nathanfaucett/geometry"),
    WebGLPlugin = require("@nathanfaucett/webgl_plugin"),
    MeshRenderer = require("@nathanfaucett/mesh_renderer"),
    Input = require("@nathanfaucett/input"),
    OrbitControl = require("..");


var Scene = sceneGraph.Scene,
    Entity = sceneGraph.Entity,

    SceneRenderer = sceneRenderer.SceneRenderer,

    Camera = cameraComponent.Camera,
    Mesh = meshComponent.Mesh,
    Transform3D = transformComponents.Transform3D;


var scene = global.scene = Scene.create(),
    input = Input.create(),

    shader = Shader.create({
        name: "shader_simple",
        src: null,
        vertex: [
            "varying vec3 vNormal;",

            "void main(void) {",
            "   vNormal = getNormal();",
            "   gl_Position = perspectiveMatrix * modelViewMatrix * getPosition();",
            "}"
        ].join("\n"),
        fragment: [
            "varying vec3 vNormal;",

            "void main(void) {",
            "    gl_FragColor = vec4(vNormal, 1.0);",
            "}"
        ].join("\n")
    }),

    material = Material.create({
        name: "material_simple",
        src: null,
        shader: shader,
        wireframe: false,
        wireframeLineWidth: 1
    }),

    geometry = Geometry.create({name: "geometry", src: "geometry.json"});


scene.application = {
    input: input
};


var camera = Camera.create(),
    cameraTransform = Transform3D.create(),
    control = OrbitControl.create();

camera.set(512, 512);

cameraTransform.setPosition([10, 10, 5]);
cameraTransform.lookAt([0, 0, 0]);

scene.addEntity(Entity.create().addComponent(cameraTransform, camera, control));

geometry.load(function onLoad(error) {
    var canvas = document.getElementById("canvas"),
        meshTransform = Transform3D.create();

    scene.addEntity(
        Entity.create().addComponent(meshTransform, Mesh.create({
            material: material,
            geometry: geometry
        }))
    );

    scene.init();

    var renderer = SceneRenderer.create(scene),
        webglPlugin = WebGLPlugin.create();

    webglPlugin.setCanvas(canvas);
    renderer.addPlugin(webglPlugin);
    renderer.addRenderer(new MeshRenderer());

    renderer.init();

    input.setElement(canvas);

    (function render() {
        var time = scene.time;

        input.update(time.current, time.frame);
        scene.update();
        renderer.render();

        setTimeout(render, 16);
    }());
});
