/*
 * Camera Buttons
 */

var CameraButtons = function(blueprint3d) {

  var orbitControls = blueprint3d.three.controls;
  var three = blueprint3d.three;

  var panSpeed = 30;
  var directions = {
    UP: 1,
    DOWN: 2,
    LEFT: 3,
    RIGHT: 4
  }

  function init() {
    // Camera controls
    $("#zoom-in").click(zoomIn);
    $("#zoom-out").click(zoomOut);
    $("#zoom-in").dblclick(preventDefault);
    $("#zoom-out").dblclick(preventDefault);

    $("#reset-view").click(three.centerCamera)

    $("#move-left").click(function(){
      pan(directions.LEFT)
    })
    $("#move-right").click(function(){
      pan(directions.RIGHT)
    })
    $("#move-up").click(function(){
      pan(directions.UP)
    })
    $("#move-down").click(function(){
      pan(directions.DOWN)
    })

    $("#move-left").dblclick(preventDefault);
    $("#move-right").dblclick(preventDefault);
    $("#move-up").dblclick(preventDefault);
    $("#move-down").dblclick(preventDefault);
  }

  function preventDefault(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function pan(direction) {
    switch (direction) {
      case directions.UP:
        orbitControls.panXY(0, panSpeed);
        break;
      case directions.DOWN:
        orbitControls.panXY(0, -panSpeed);
        break;
      case directions.LEFT:
        orbitControls.panXY(panSpeed, 0);
        break;
      case directions.RIGHT:
        orbitControls.panXY(-panSpeed, 0);
        break;
    }
  }

  function zoomIn(e) {
    e.preventDefault();
    orbitControls.dollyIn(1.1);
    orbitControls.update();
  }

  function zoomOut(e) {
    e.preventDefault;
    orbitControls.dollyOut(1.1);
    orbitControls.update();
  }

  init();
}

/*
 * Context menu for selected item
 */

var ContextMenu = function(blueprint3d) {

  var scope = this;
  var selectedItem;
  var three = blueprint3d.three;

  function init() {
    $("#context-menu-delete").click(function(event) {
        selectedItem.remove();
    });

    three.itemSelectedCallbacks.add(itemSelected);
    three.itemUnselectedCallbacks.add(itemUnselected);

    initResize();

    $("#fixed").click(function() {
        var checked = $(this).prop('checked');
        selectedItem.setFixed(checked);
    });
  }

  function cmToIn(cm) {
    return cm / 2.54;
  }

  function inToCm(inches) {
    return inches * 2.54;
  }

  function itemSelected(item) {
    selectedItem = item;

    $("#context-menu-name").text(item.metadata.itemName);

    $("#item-width").val(cmToIn(selectedItem.getWidth()).toFixed(0));
    $("#item-height").val(cmToIn(selectedItem.getHeight()).toFixed(0));
    $("#item-depth").val(cmToIn(selectedItem.getDepth()).toFixed(0));

    $("#context-menu").show();

    $("#fixed").prop('checked', item.fixed);
  }

  function resize() {
    selectedItem.resize(
      inToCm($("#item-height").val()),
      inToCm($("#item-width").val()),
      inToCm($("#item-depth").val())
    );
  }

  function initResize() {
    $("#item-height").change(resize);
    $("#item-width").change(resize);
    $("#item-depth").change(resize);
  }

  function itemUnselected() {
    selectedItem = null;
    $("#context-menu").hide();
  }

  init();
}

/*
 * Loading modal for items
 */

var ModalEffects = function(blueprint3d) {

  var scope = this;
  var blueprint3d = blueprint3d;
  var itemsLoading = 0;

  this.setActiveItem = function(active) {
    itemSelected = active;
    update();
  }

  function update() {
    if (itemsLoading > 0) {
      $("#loading-modal").show();
    } else {
      $("#loading-modal").hide();
    }
  }

  function init() {
    blueprint3d.model.scene.itemLoadingCallbacks.add(function() {
      itemsLoading += 1;
      update();
    });

     blueprint3d.model.scene.itemLoadedCallbacks.add(function() {
      itemsLoading -= 1;
      update();
    });

    update();
  }

  init();
}

/*
 * Side menu
 */

var SideMenu = function(blueprint3d, floorplanControls, modalEffects) {
  var blueprint3d = blueprint3d;
  var floorplanControls = floorplanControls;
  var modalEffects = modalEffects;

  var ACTIVE_CLASS = "active";

  var tabs = {
    "DETAILS" : $("#details_tab"),
    "FLOORPLAN" : $("#floorplan_tab"),
    "SHOP" : $("#items_tab"),
    "DESIGN" : $("#design_tab")
  }

  var scope = this;
  this.stateChangeCallbacks = $.Callbacks();

  this.states = {
    "DEFAULT" : {
      "div" : $("#viewer"),
      "tab" : tabs.DESIGN
    },
    "DETAILS" : {
      "div" : $("#details"),
      "tab" : tabs.DETAILS
    },
    "FLOORPLAN" : {
      "div" : $("#floorplanner"),
      "tab" : tabs.FLOORPLAN
    },
    "SHOP" : {
      "div" : $("#add-items"),
      "tab" : tabs.SHOP
    }
  }

  // sidebar state
  var currentState = scope.states.FLOORPLAN;

  function init() {
    for (var tab in tabs) {
      var elem = tabs[tab];
      elem.click(tabClicked(elem));
    }

    $("#update-floorplan").click(floorplanUpdate);

    $("#saveDetails").click(floorplanUpdate);

    initLeftMenu();

    blueprint3d.three.updateWindowSize();
    handleWindowResize();

    initItems();

    setCurrentState(scope.states.DEFAULT);
  }

  function floorplanUpdate() {
    setCurrentState(scope.states.DEFAULT);
  }

  function tabClicked(tab) {
    return function() {
      // Stop three from spinning
      blueprint3d.three.stopSpin();

      // Selected a new tab
      for (var key in scope.states) {
        var state = scope.states[key];
        if (state.tab == tab) {
          setCurrentState(state);
          break;
        }
      }
    }
  }

  function setCurrentState(newState) {

    if (currentState == newState) {
      return;
    }

    // show the right tab as active
    if (currentState.tab !== newState.tab) {
      if (currentState.tab != null) {
        currentState.tab.removeClass(ACTIVE_CLASS);
      }
      if (newState.tab != null) {
        newState.tab.addClass(ACTIVE_CLASS);
      }
    }

    // set item unselected
    blueprint3d.three.getController().setSelectedObject(null);

    // show and hide the right divs
    currentState.div.hide()
    newState.div.show()

    // custom actions
    if (newState == scope.states.FLOORPLAN) {
      floorplanControls.updateFloorplanView();
      floorplanControls.handleWindowResize();
    }

    if (currentState == scope.states.FLOORPLAN) {
      blueprint3d.model.floorplan.update();
    }

    if (newState == scope.states.DEFAULT) {
      blueprint3d.three.redrawWallItems();
      blueprint3d.three.updateWindowSize();
    }

    // set new state
    handleWindowResize();
    currentState = newState;

    scope.stateChangeCallbacks.fire(newState);
  }

  function initLeftMenu() {
    $( window ).resize( handleWindowResize );
    handleWindowResize();
  }

  function handleWindowResize() {
    $(".sidebar").height(window.innerHeight);
    $("#add-items").height(window.innerHeight);

  };

  // TODO: this doesn't really belong here
  function initItems() {
    $("#add-items").find(".add-item").mousedown(function(e) {
      var modelUrl = $(this).attr("model-url");
      var itemType = parseInt($(this).attr("model-type"));
      var metadata = {
        itemName: $(this).attr("model-name"),
        resizable: true,
        modelUrl: modelUrl,
        itemType: itemType
      }

      blueprint3d.model.scene.addItem(itemType, modelUrl, metadata);
      setCurrentState(scope.states.DEFAULT);
    });
  }

  init();

}

/*
 * Change floor and wall textures
 */

var TextureSelector = function (blueprint3d, sideMenu) {

  var scope = this;
  var three = blueprint3d.three;
  var isAdmin = isAdmin;

  var currentTarget = null;

  function initTextureSelectors() {
    $(".texture-select-thumbnail").click(function(e) {
      var textureUrl = $(this).attr("texture-url");
      var textureStretch = ($(this).attr("texture-stretch") == "true");
      var textureScale = parseInt($(this).attr("texture-scale"));
      currentTarget.setTexture(textureUrl, textureStretch, textureScale);

      e.preventDefault();
    });
  }

  function init() {
    three.wallClicked.add(wallClicked);
    three.floorClicked.add(floorClicked);
    three.itemSelectedCallbacks.add(reset);
    three.nothingClicked.add(reset);
    sideMenu.stateChangeCallbacks.add(reset);
    initTextureSelectors();
  }

  function wallClicked(halfEdge) {
    currentTarget = halfEdge;
    $("#floorTexturesDiv").hide();
    $("#wallTextures").show();
  }

  function floorClicked(room) {
    currentTarget = room;
    $("#wallTextures").hide();
    $("#floorTexturesDiv").show();
  }

  function reset() {
    $("#wallTextures").hide();
    $("#floorTexturesDiv").hide();
  }

  init();
}

/*
 * Floorplanner controls
 */

var ViewerFloorplanner = function(blueprint3d) {

  var canvasWrapper = '#floorplanner';

  // buttons
  var move = '#move';
  var remove = '#delete';
  var draw = '#draw';

  var activeStlye = 'btn-primary disabled';

  this.floorplanner = blueprint3d.floorplanner;

  var scope = this;

  function init() {

    $( window ).resize( scope.handleWindowResize );
    scope.handleWindowResize();

    // mode buttons
    scope.floorplanner.modeResetCallbacks.add(function(mode) {
      $(draw).removeClass(activeStlye);
      $(remove).removeClass(activeStlye);
      $(move).removeClass(activeStlye);
      if (mode == scope.floorplanner.modes.MOVE) {
          $(move).addClass(activeStlye);
      } else if (mode == scope.floorplanner.modes.DRAW) {
          $(draw).addClass(activeStlye);
      } else if (mode == scope.floorplanner.modes.DELETE) {
          $(remove).addClass(activeStlye);
      }

      if (mode == scope.floorplanner.modes.DRAW) {
        $("#draw-walls-hint").show();
        scope.handleWindowResize();
      } else {
        $("#draw-walls-hint").hide();
      }
    });

    $(move).click(function(){
      scope.floorplanner.setMode(scope.floorplanner.modes.MOVE);
    });

    $(draw).click(function(){
      scope.floorplanner.setMode(scope.floorplanner.modes.DRAW);
    });

    $(remove).click(function(){
      scope.floorplanner.setMode(scope.floorplanner.modes.DELETE);
    });
  }

  this.updateFloorplanView = function() {
    scope.floorplanner.reset();
  }

  this.handleWindowResize = function() {
    $(canvasWrapper).height(window.innerHeight - $(canvasWrapper).offset().top);
    scope.floorplanner.resizeView();
  };

  init();
};

var mainControls = function(blueprint3d) {
  var blueprint3d = blueprint3d;

  function newDesign() {
    blueprint3d.model.loadSerialized('{"floorplan":{"corners":{"f90da5e3-9e0e-eba7-173d-eb0b071e838e":{"x":204.85099999999989,"y":289.052},"da026c08-d76a-a944-8e7b-096b752da9ed":{"x":672.2109999999999,"y":289.052},"4e3d65cb-54c0-0681-28bf-bddcc7bdb571":{"x":672.2109999999999,"y":-178.308},"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2":{"x":204.85099999999989,"y":-178.308}},"walls":[{"corner1":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","corner2":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","corner2":"da026c08-d76a-a944-8e7b-096b752da9ed","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"da026c08-d76a-a944-8e7b-096b752da9ed","corner2":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","corner2":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}}],"wallTextures":[],"floorTextures":{},"newFloorTextures":{}},"items":[]}');
  }

  function loadDesign() {
    files = $("#loadFile").get(0).files;
    var reader  = new FileReader();
    reader.onload = function(event) {
        var data = event.target.result;
        blueprint3d.model.loadSerialized(data);
    }
    reader.readAsText(files[0]);
  }

  function saveDesign() {
    var data = blueprint3d.model.exportSerialized();
    var a = window.document.createElement('a');
    var blob = new Blob([data], {type : 'text'});
    a.href = window.URL.createObjectURL(blob);
    a.download = 'design.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function sendConfig() {
    if ( !window.userName || !window.userPhone ) {
      return alert('Please enter details before generating VR model.');
    }
    var data = blueprint3d.model.exportSerialized();
    var parsedData = JSON.parse(data);
    parsedData.metadata = {
      userName: window.userName,
      userPhone: window.userPhone
    };
    return $.ajax({
      url: 'http://10.1.22.72:3000/api/v1/config_infos',
      data: JSON.stringify({'config': parsedData}),
      contentType: 'application/json',
      dataType: "json",
      type: 'POST',
      success: function(resp){
        console.log(resp);
        alert('VR model will be generated shortly and it will be notified to you via SMS. Thank you for using Valkyrie (Housing VR Panel)');
      },
      error: function(resp, errTxt){
        console.log('Some error occured. Please try again. Error: ', errTxt);
      }
    });
  }

  function init() {
    $("#new").click(newDesign);
    $("#loadFile").change(loadDesign);
    $("#saveFile").click(saveDesign);
    $("#sendConfig").click(sendConfig);
  }

  init();
}

/*
 * Enter Details controls
 */

var DetailsController = function(blueprint3d) {

  var canvasWrapper = '#details';

  // buttons
  var save = '#saveDetails';
  var inputName = '#inputName';
  var inputPhone1 = '#inputPhone1';

  var scope = this;

  var $saveEl = $(save);

  var onChange = function() {
    window.userName = $(inputName).val();
    window.userPhone = $(inputPhone1).val();

    if ( !window.userName || !window.userPhone ) {
      $saveEl.attr('disabled', true);
    } else {
      $saveEl.removeAttr('disabled');
    }
  }

  function init() {
    $(inputName).keydown(onChange);
    $(inputPhone1).keydown(onChange);
  }

  init();
};

/*
 * Initialize!
 */

$(document).ready(function() {

  // main setup
  var opts = {
    floorplannerElement: 'floorplanner-canvas',
    threeElement: '#viewer',
    threeCanvasElement: 'three-canvas',
    textureDir: "models/textures/",
    widget: false
  }
  var blueprint3d = new Blueprint3d(opts);

  var modalEffects = new ModalEffects(blueprint3d);
  var detailsController = new DetailsController(blueprint3d);
  var viewerFloorplanner = new ViewerFloorplanner(blueprint3d);
  var contextMenu = new ContextMenu(blueprint3d);
  var sideMenu = new SideMenu(blueprint3d, viewerFloorplanner, modalEffects);
  var textureSelector = new TextureSelector(blueprint3d, sideMenu);
  var cameraButtons = new CameraButtons(blueprint3d);
  mainControls(blueprint3d);

  // This serialization format needs work
  // Load a simple rectangle room
  data = {"floorplan":{"corners":{"56d9ebd1-91b2-875c-799d-54b3785fca1f":{"x":626.4909999999999,"y":-286.51200000000006},"8f4a050d-e102-3c3f-5af9-3d9133555d76":{"x":211.32799999999995,"y":-286.51200000000006},"4e312eca-6c4f-30d1-3d9a-a19a9d1ee359":{"x":211.32799999999995,"y":232.664},"254656bf-8a53-3987-c810-66b349f49b19":{"x":745.7439999999998,"y":232.664},"11d25193-4411-fbbf-78cb-ae7c0283164b":{"x":1121.9179999999994,"y":232.664},"edf0de13-df9f-cd6a-7d11-9bd13c36ce12":{"x":1121.9179999999994,"y":-144.272},"e7db8654-efe1-bda2-099a-70585874d8c0":{"x":745.7439999999998,"y":-144.272}},"walls":[{"corner1":"4e312eca-6c4f-30d1-3d9a-a19a9d1ee359","corner2":"254656bf-8a53-3987-c810-66b349f49b19","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":null},"frontEdge":null,"backEdge":{"planeUuid":"3A396BDD-7610-4260-8806-48F8FE22B2D1","corners":["254656bf-8a53-3987-c810-66b349f49b19","4e312eca-6c4f-30d1-3d9a-a19a9d1ee359"],"vertices":[{"x":740.7439999999998,"y":0,"z":227.664},{"x":216.32799999999995,"y":0,"z":227.664},{"x":216.32799999999995,"y":300,"z":227.664},{"x":740.7439999999998,"y":300,"z":227.664}],"faces":[[0,1,2],[0,2,3]],"faceVertexUvs":[[]],"texture":"rooms/textures/wallmap.png"},"isShared":false},{"corner1":"254656bf-8a53-3987-c810-66b349f49b19","corner2":"e7db8654-efe1-bda2-099a-70585874d8c0","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":null},"frontEdge":{"planeUuid":"33EF7D3C-3309-4BEC-A701-A7F6FBB0547A","corners":["254656bf-8a53-3987-c810-66b349f49b19","e7db8654-efe1-bda2-099a-70585874d8c0"],"vertices":[{"x":750.7439999999998,"y":0,"z":227.664},{"x":750.7439999999998,"y":0,"z":-139.272},{"x":750.7439999999998,"y":300,"z":-139.272},{"x":750.7439999999998,"y":300,"z":227.664}],"faces":[[0,1,2],[0,2,3]],"faceVertexUvs":[[]],"texture":"rooms/textures/wallmap.png"},"backEdge":{"planeUuid":"460AD9B0-B6F8-4D27-9D05-37DCAB7D021D","corners":["e7db8654-efe1-bda2-099a-70585874d8c0","254656bf-8a53-3987-c810-66b349f49b19"],"vertices":[{"x":740.7439999999998,"y":0,"z":-142.45332338879876},{"x":740.7439999999998,"y":0,"z":227.664},{"x":740.7439999999998,"y":300,"z":227.664},{"x":740.7439999999998,"y":300,"z":-142.45332338879876}],"faces":[[0,1,2],[0,2,3]],"faceVertexUvs":[[]],"texture":"rooms/textures/wallmap.png"},"isShared":true},{"corner1":"56d9ebd1-91b2-875c-799d-54b3785fca1f","corner2":"8f4a050d-e102-3c3f-5af9-3d9133555d76","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":null},"frontEdge":null,"backEdge":{"planeUuid":"D4F0681F-3B5B-4AFE-B45D-ECF357F572D2","corners":["8f4a050d-e102-3c3f-5af9-3d9133555d76","56d9ebd1-91b2-875c-799d-54b3785fca1f"],"vertices":[{"x":216.32799999999995,"y":0,"z":-281.51200000000006},{"x":624.1581988054303,"y":0,"z":-281.51200000000006},{"x":624.1581988054303,"y":300,"z":-281.51200000000006},{"x":216.32799999999995,"y":300,"z":-281.51200000000006}],"faces":[[0,1,2],[0,2,3]],"faceVertexUvs":[[]],"texture":"rooms/textures/wallmap.png"},"isShared":false},{"corner1":"8f4a050d-e102-3c3f-5af9-3d9133555d76","corner2":"4e312eca-6c4f-30d1-3d9a-a19a9d1ee359","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":null},"frontEdge":null,"backEdge":{"planeUuid":"78B06608-AADD-424E-97DB-3FDFDE700767","corners":["4e312eca-6c4f-30d1-3d9a-a19a9d1ee359","8f4a050d-e102-3c3f-5af9-3d9133555d76"],"vertices":[{"x":216.32799999999995,"y":0,"z":227.664},{"x":216.32799999999995,"y":0,"z":-281.51200000000006},{"x":216.32799999999995,"y":300,"z":-281.51200000000006},{"x":216.32799999999995,"y":300,"z":227.664}],"faces":[[0,1,2],[0,2,3]],"faceVertexUvs":[[]],"texture":"rooms/textures/wallmap.png"},"isShared":false},{"corner1":"254656bf-8a53-3987-c810-66b349f49b19","corner2":"11d25193-4411-fbbf-78cb-ae7c0283164b","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"frontEdge":null,"backEdge":{"planeUuid":"D4F871D0-F7F5-4B8D-89C5-1BDB006A6133","corners":["11d25193-4411-fbbf-78cb-ae7c0283164b","254656bf-8a53-3987-c810-66b349f49b19"],"vertices":[{"x":1116.9179999999994,"y":0,"z":227.664},{"x":750.7439999999998,"y":0,"z":227.664},{"x":750.7439999999998,"y":300,"z":227.664},{"x":1116.9179999999994,"y":300,"z":227.664}],"faces":[[0,1,2],[0,2,3]],"faceVertexUvs":[[]],"texture":"rooms/textures/wallmap.png"},"isShared":false},{"corner1":"11d25193-4411-fbbf-78cb-ae7c0283164b","corner2":"edf0de13-df9f-cd6a-7d11-9bd13c36ce12","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":null},"frontEdge":null,"backEdge":{"planeUuid":"EF1F8FD4-1557-49AF-95F9-CF0224B403CD","corners":["edf0de13-df9f-cd6a-7d11-9bd13c36ce12","11d25193-4411-fbbf-78cb-ae7c0283164b"],"vertices":[{"x":1116.9179999999994,"y":0,"z":-139.272},{"x":1116.9179999999994,"y":0,"z":227.664},{"x":1116.9179999999994,"y":300,"z":227.664},{"x":1116.9179999999994,"y":300,"z":-139.272}],"faces":[[0,1,2],[0,2,3]],"faceVertexUvs":[[]],"texture":"rooms/textures/floor.png"},"isShared":false},{"corner1":"edf0de13-df9f-cd6a-7d11-9bd13c36ce12","corner2":"e7db8654-efe1-bda2-099a-70585874d8c0","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"frontEdge":null,"backEdge":{"planeUuid":"06A76777-3F08-4812-8BF9-355A8E1493FE","corners":["e7db8654-efe1-bda2-099a-70585874d8c0","edf0de13-df9f-cd6a-7d11-9bd13c36ce12"],"vertices":[{"x":750.7439999999998,"y":0,"z":-139.272},{"x":1116.9179999999994,"y":0,"z":-139.272},{"x":1116.9179999999994,"y":300,"z":-139.272},{"x":750.7439999999998,"y":300,"z":-139.272}],"faces":[[0,1,2],[0,2,3]],"faceVertexUvs":[[]],"texture":"rooms/textures/wallmap.png"},"isShared":false},{"corner1":"e7db8654-efe1-bda2-099a-70585874d8c0","corner2":"56d9ebd1-91b2-875c-799d-54b3785fca1f","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":null},"frontEdge":null,"backEdge":{"planeUuid":"22743231-8824-4EE4-B738-1643EFDC307F","corners":["56d9ebd1-91b2-875c-799d-54b3785fca1f","e7db8654-efe1-bda2-099a-70585874d8c0"],"vertices":[{"x":624.1581988054303,"y":0,"z":-281.51200000000006},{"x":740.7439999999998,"y":0,"z":-142.45332338879876},{"x":740.7439999999998,"y":300,"z":-142.45332338879876},{"x":624.1581988054303,"y":300,"z":-281.51200000000006}],"faces":[[0,1,2],[0,2,3]],"faceVertexUvs":[[]],"texture":"rooms/textures/wallmap.png"},"isShared":false}],"rooms":[{"floorPlane":{"corners":["56d9ebd1-91b2-875c-799d-54b3785fca1f","e7db8654-efe1-bda2-099a-70585874d8c0","254656bf-8a53-3987-c810-66b349f49b19","4e312eca-6c4f-30d1-3d9a-a19a9d1ee359","8f4a050d-e102-3c3f-5af9-3d9133555d76"],"planeUuid":"C0EB5BB5-F6D1-4082-B139-759E0C12BF03","vertices":[{"x":216.32799999999995,"y":-281.51200000000006,"z":0},{"x":216.32799999999995,"y":227.664,"z":0},{"x":740.7439999999998,"y":227.664,"z":0},{"x":740.7439999999998,"y":-142.45332338879876,"z":0},{"x":624.1581988054303,"y":-281.51200000000006,"z":0}],"faces":[[0,4,3],[3,2,1],[1,0,3]],"faceVertexUvs":[[[{"x":216.32799999999995,"y":-281.51200000000006},{"x":624.1581988054303,"y":-281.51200000000006},{"x":740.7439999999998,"y":-142.45332338879876}],[{"x":740.7439999999998,"y":-142.45332338879876},{"x":740.7439999999998,"y":227.664},{"x":216.32799999999995,"y":227.664}],[{"x":216.32799999999995,"y":227.664},{"x":216.32799999999995,"y":-281.51200000000006},{"x":740.7439999999998,"y":-142.45332338879876}]]],"texture":"rooms/textures/floor.png"},"edges":[{"planeUuid":"22743231-8824-4EE4-B738-1643EFDC307F","corners":["56d9ebd1-91b2-875c-799d-54b3785fca1f","e7db8654-efe1-bda2-099a-70585874d8c0"],"vertices":[{"x":624.1581988054303,"y":0,"z":-281.51200000000006},{"x":740.7439999999998,"y":0,"z":-142.45332338879876},{"x":740.7439999999998,"y":300,"z":-142.45332338879876},{"x":624.1581988054303,"y":300,"z":-281.51200000000006}],"faces":[[0,1,2],[0,2,3]],"faceVertexUvs":[[]],"texture":"rooms/textures/wallmap.png"},{"planeUuid":"460AD9B0-B6F8-4D27-9D05-37DCAB7D021D","corners":["e7db8654-efe1-bda2-099a-70585874d8c0","254656bf-8a53-3987-c810-66b349f49b19"],"vertices":[{"x":740.7439999999998,"y":0,"z":-142.45332338879876},{"x":740.7439999999998,"y":0,"z":227.664},{"x":740.7439999999998,"y":300,"z":227.664},{"x":740.7439999999998,"y":300,"z":-142.45332338879876}],"faces":[[0,1,2],[0,2,3]],"faceVertexUvs":[[]],"texture":"rooms/textures/wallmap.png"},{"planeUuid":"3A396BDD-7610-4260-8806-48F8FE22B2D1","corners":["254656bf-8a53-3987-c810-66b349f49b19","4e312eca-6c4f-30d1-3d9a-a19a9d1ee359"],"vertices":[{"x":740.7439999999998,"y":0,"z":227.664},{"x":216.32799999999995,"y":0,"z":227.664},{"x":216.32799999999995,"y":300,"z":227.664},{"x":740.7439999999998,"y":300,"z":227.664}],"faces":[[0,1,2],[0,2,3]],"faceVertexUvs":[[]],"texture":"rooms/textures/wallmap.png"},{"planeUuid":"78B06608-AADD-424E-97DB-3FDFDE700767","corners":["4e312eca-6c4f-30d1-3d9a-a19a9d1ee359","8f4a050d-e102-3c3f-5af9-3d9133555d76"],"vertices":[{"x":216.32799999999995,"y":0,"z":227.664},{"x":216.32799999999995,"y":0,"z":-281.51200000000006},{"x":216.32799999999995,"y":300,"z":-281.51200000000006},{"x":216.32799999999995,"y":300,"z":227.664}],"faces":[[0,1,2],[0,2,3]],"faceVertexUvs":[[]],"texture":"rooms/textures/wallmap.png"},{"planeUuid":"D4F0681F-3B5B-4AFE-B45D-ECF357F572D2","corners":["8f4a050d-e102-3c3f-5af9-3d9133555d76","56d9ebd1-91b2-875c-799d-54b3785fca1f"],"vertices":[{"x":216.32799999999995,"y":0,"z":-281.51200000000006},{"x":624.1581988054303,"y":0,"z":-281.51200000000006},{"x":624.1581988054303,"y":300,"z":-281.51200000000006},{"x":216.32799999999995,"y":300,"z":-281.51200000000006}],"faces":[[0,1,2],[0,2,3]],"faceVertexUvs":[[]],"texture":"rooms/textures/wallmap.png"}]},{"floorPlane":{"corners":["254656bf-8a53-3987-c810-66b349f49b19","e7db8654-efe1-bda2-099a-70585874d8c0","edf0de13-df9f-cd6a-7d11-9bd13c36ce12","11d25193-4411-fbbf-78cb-ae7c0283164b"],"planeUuid":"11AA2473-B26A-4200-B7B6-FBB6502890FC","vertices":[{"x":1116.9179999999994,"y":227.664,"z":0},{"x":1116.9179999999994,"y":-139.272,"z":0},{"x":750.7439999999998,"y":-139.272,"z":0},{"x":750.7439999999998,"y":227.664,"z":0}],"faces":[[0,3,2],[2,1,0]],"faceVertexUvs":[[[{"x":1116.9179999999994,"y":227.664},{"x":750.7439999999998,"y":227.664},{"x":750.7439999999998,"y":-139.272}],[{"x":750.7439999999998,"y":-139.272},{"x":1116.9179999999994,"y":-139.272},{"x":1116.9179999999994,"y":227.664}]]],"texture":"rooms/textures/floor.png"},"edges":[{"planeUuid":"33EF7D3C-3309-4BEC-A701-A7F6FBB0547A","corners":["254656bf-8a53-3987-c810-66b349f49b19","e7db8654-efe1-bda2-099a-70585874d8c0"],"vertices":[{"x":750.7439999999998,"y":0,"z":227.664},{"x":750.7439999999998,"y":0,"z":-139.272},{"x":750.7439999999998,"y":300,"z":-139.272},{"x":750.7439999999998,"y":300,"z":227.664}],"faces":[[0,1,2],[0,2,3]],"faceVertexUvs":[[]],"texture":"rooms/textures/wallmap.png"},{"planeUuid":"06A76777-3F08-4812-8BF9-355A8E1493FE","corners":["e7db8654-efe1-bda2-099a-70585874d8c0","edf0de13-df9f-cd6a-7d11-9bd13c36ce12"],"vertices":[{"x":750.7439999999998,"y":0,"z":-139.272},{"x":1116.9179999999994,"y":0,"z":-139.272},{"x":1116.9179999999994,"y":300,"z":-139.272},{"x":750.7439999999998,"y":300,"z":-139.272}],"faces":[[0,1,2],[0,2,3]],"faceVertexUvs":[[]],"texture":"rooms/textures/wallmap.png"},{"planeUuid":"EF1F8FD4-1557-49AF-95F9-CF0224B403CD","corners":["edf0de13-df9f-cd6a-7d11-9bd13c36ce12","11d25193-4411-fbbf-78cb-ae7c0283164b"],"vertices":[{"x":1116.9179999999994,"y":0,"z":-139.272},{"x":1116.9179999999994,"y":0,"z":227.664},{"x":1116.9179999999994,"y":300,"z":227.664},{"x":1116.9179999999994,"y":300,"z":-139.272}],"faces":[[0,1,2],[0,2,3]],"faceVertexUvs":[[]],"texture":"rooms/textures/floor.png"},{"planeUuid":"D4F871D0-F7F5-4B8D-89C5-1BDB006A6133","corners":["11d25193-4411-fbbf-78cb-ae7c0283164b","254656bf-8a53-3987-c810-66b349f49b19"],"vertices":[{"x":1116.9179999999994,"y":0,"z":227.664},{"x":750.7439999999998,"y":0,"z":227.664},{"x":750.7439999999998,"y":300,"z":227.664},{"x":1116.9179999999994,"y":300,"z":227.664}],"faces":[[0,1,2],[0,2,3]],"faceVertexUvs":[[]],"texture":"rooms/textures/wallmap.png"}]}],"entryPoint":{"position":{"x":471.8573913574219,"y":123.23099517822266,"z":182.16400146484375},"rotation":{"x":3.141592653589793,"y":1.2246468525851679e-16,"z":3.141592653589793}}},"items":[{"item_name":"Lamp","item_type":1,"model_url":"models/js/lamp.js","xpos":252.43922814756309,"ypos":74.97145,"zpos":-254.41416671491947,"rotation":0.9022502995443269,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false,"planeUuid":null},{"item_name":"Open Door","item_type":7,"model_url":"models/js/main_door_open.js","xpos":745.2440185546875,"ypos":123.23099,"zpos":150.74522632463913,"rotation":-1.5707963267948966,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false,"planeUuid":"460AD9B0-B6F8-4D27-9D05-37DCAB7D021D"},{"item_name":"Closed Door","item_type":7,"model_url":"models/js/main_door_close.js","xpos":471.857391100313,"ypos":123.23099500000002,"zpos":232.16400146484378,"rotation":3.141592653589793,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false,"planeUuid":"3A396BDD-7610-4260-8806-48F8FE22B2D1"},{"item_name":"Window","item_type":3,"model_url":"models/js/window4glass.js","xpos":441.83314304743254,"ypos":150.47715,"zpos":-286.0119934082031,"rotation":0,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false,"planeUuid":"D4F0681F-3B5B-4AFE-B45D-ECF357F572D2"},{"item_name":"Media Console - White","item_type":1,"model_url":"models/js/small_tvset.js","xpos":650.2184521523016,"ypos":63.48478999999999,"zpos":-194.75810039066766,"rotation":-0.8858224068890769,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false,"planeUuid":null},{"item_name":"Dining Table","item_type":1,"model_url":"models/js/table.js","xpos":395.99466252408945,"ypos":20.72441,"zpos":-61.78368798651758,"rotation":1.5707963267948966,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false,"planeUuid":null},{"item_name":"Sofa","item_type":1,"model_url":"models/js/sofa.js","xpos":270.92066483741536,"ypos":38.57799,"zpos":-66.17061466422392,"rotation":1.5707963267948966,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false,"planeUuid":null},{"item_name":"Full Bed","item_type":1,"model_url":"models/js/bed.js","xpos":947.9756015399843,"ypos":47.775724999999994,"zpos":-15.5075528610016,"rotation":-1.5707963267948966,"scale_x":1,"scale_y":1,"scale_z":1,"fixed":false,"planeUuid":null}]}

  // data.items = [];
  blueprint3d.model.loadSerialized(JSON.stringify(data));
});
