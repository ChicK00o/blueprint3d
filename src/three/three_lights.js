var THREE = require('three');

var ThreeLights = function(scene, floorplan) {

  var scope = this;
  var scene = scene;
  var floorplan = floorplan;

  var tol = 1;
  var height = 300; // TODO: share with Blueprint.Wall

  var dirLight;

  this.getDirLight = function() {
    return dirLight;
  }

  function init() {
    var light = new THREE.HemisphereLight( 0xffffff, 0x888888, 1.1 );
    light.position.set(0, height, 0);
    scene.add(light);

    dirLight = new THREE.DirectionalLight( 0xffffff, 0 );
    dirLight.color.setHSL( 1, 1, 0.1 );

    dirLight.castShadow = true;

    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;

    dirLight.shadow.camera.far = height + tol;
    dirLight.shadow.bias = -0.0001;
    // dirLight.shadowDarkness = 0.2; // removed
    dirLight.visible = true;
    // dirLight.shadowCameraVisible = false; // removed. Use new THREE.CameraHelper( light.shadow.camera ) instead.

    scene.add(dirLight);
    scene.add(dirLight.target);

    floorplan.fireOnUpdatedRooms(updateShadowCamera);
  }

  function updateShadowCamera() {

    var size = floorplan.getSize();
    d = (Math.max(size.z, size.x) + tol) / 2.0;

    var center = floorplan.getCenter();
    var pos = new THREE.Vector3(
      center.x, height, center.z);
    dirLight.position.copy(pos);
    dirLight.target.position.copy(center);
    //dirLight.updateMatrix();
    //dirLight.updateWorldMatrix()
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    // this is necessary for updates
    if (dirLight.shadow.camera) {
      dirLight.shadow.camera.left = dirLight.shadow.camera.left;
      dirLight.shadow.camera.right = dirLight.shadow.camera.right;
      dirLight.shadow.camera.top = dirLight.shadow.camera.top;
      dirLight.shadow.camera.bottom = dirLight.shadow.camera.bottom;
      dirLight.shadow.camera.updateProjectionMatrix();
    }
  }

  init();
}

module.exports = ThreeLights;
