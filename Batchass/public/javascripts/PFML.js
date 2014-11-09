﻿var container, camera, scene, renderer, stats;

var gem, gui;

var tv1 = new THREE.Vector3();
var tv2 = new THREE.Vector3();
var repelerMeshes = [];
var repelersHidden = true;

var cubeMapRendered = false;


var cubeMapSpheres = [];
var REPELERS = [];

// TODO: make into loader
var loaded = 0;
var neededToLoad = 2;


var loader = new Loader();

var clock = new THREE.Clock();

var audioController = new AudioController();

var audio = new Audio(),
  // stream_url
    url = 'http://api.soundcloud.com/tracks/117339064/stream' +
        '?client_id=1225e9878c2b6aaaf6ced9df8d10d4aa';

audio.src = url;

var source = audioController.ctx.createMediaElementSource(audio);
source.connect(audioController.gain);


var shaders = new ShaderLoader('shaders');

shaders.load('ss-weird1' , 'weird1' , 'simulation');

shaders.load('vs-cube' , 'cube' , 'vertex');
shaders.load('fs-cube' , 'cube' , 'fragment');
shaders.load('vs-crystal' , 'crystal' , 'vertex');
shaders.load('fs-crystal' , 'crystal' , 'fragment');

shaders.shaderSetLoaded = function () {
    onLoad();
}


var modifier = new THREE.SubdivisionModifier(2);
var loadedMeshes = {}

var objLoader = new THREE.OBJLoader();

objLoader.load('models/batchass.obj' , function (obj) {
    
    loadedMeshes['skull1'] = obj.children[0];
    
    loadedMeshes['skull1'].scale.multiplyScalar(2);
    loadedMeshes['skull1'].position.z = -200;
    loadedMeshes['skull1'].position.y = -400;
    loadedMeshes['skull1'].position.x = -70;
    loadedMeshes['skull1'].updateMatrix();
    
    var smooth = loadedMeshes['skull1'].geometry;
    
    smooth.mergeVertices();
    smooth.computeFaceNormals();
    smooth.computeVertexNormals();
    
    modifier.modify(smooth);
    
    onLoad();

});


var G_UNIFORMS = {
    
    dT      : { type: "f" , value: 0 },
    time    : { type: "f" , value: 0 },
    t_audio : { type: "t" , value: audioController.texture },
}


function init() {
    
    
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera( 
        50 ,
      window.innerWidth / window.innerHeight,
      10,
      10000
    );
    
    // placing our camera position so it can see everything
    camera.position.z = 2000;
    camera.lookAt(new THREE.Vector3());
    
    cubeCamera = new THREE.CubeCamera(20, 100000, 1024);
    cubeCamera.renderTarget.minFilter = THREE.LinearMipMapLinearFilter;
    scene.add(cubeCamera);
    
    // Getting the container in the right location
    container = document.createElement('div');
    container.id = 'container';
    
    document.body.appendChild(container);
    
    // Getting the stats in the right position
    stats = new Stats();
    stats.domElement.id = 'stats';
    document.body.appendChild(stats.domElement);
    
    
    // Setting up our Renderer
    renderer = new THREE.WebGLRenderer({ alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    renderer.domElement.style.background = "#000";
    
    controls = new THREE.TrackballControls(camera , renderer.domElement);
    
    controls.minDistance = 1;
    controls.maxDistance = 2500;
    
    // Making sure our renderer is always the right size
    window.addEventListener('resize', onWindowResize , false);
    window.addEventListener('mousemove', onMouseMove , false);
    
    
    
    var w = window.innerWidth;
    var h = window.innerHeight;
    
    
    var g = new THREE.IcosahedronGeometry(1 , 1);
    var m = new THREE.MeshNormalMaterial();
    
    for (var i = 0; i < 25; i++) {
        
        var mesh = new THREE.Mesh(g , m);
        
        var t = Math.random() * 2 * Math.PI;
        var p = Math.random() * 2 * Math.PI;
        
        mesh.target = new THREE.Vector3();//toCart( 12 , t , p );
        mesh.velocity = new THREE.Vector3();
        mesh.power = new THREE.Vector3();
        
        //mesh.position.copy( mesh.target );
        REPELERS.push(mesh);

      //scene.add( mesh );

    }
    
    // Arrangements.plane( 20 , 'z' , -20 );
    Arrangements.randomSphere();
    
    
    var path = "img/cubemap/skybox/";
    var format = '.jpg';
    var urls = [
        path + 'px' + format, path + 'nx' + format,
        path + 'py' + format, path + 'ny' + format,
        path + 'pz' + format, path + 'nz' + format
    ];
    
    cubeCamera = new THREE.CubeCamera(10, 10000, 256); // parameters: near, far, resolution
    cubeCamera.renderTarget.minFilter = THREE.LinearMipMapLinearFilter; // mipmap filter
    cubeCamera.position.set(0, 0, 0);
    scene.add(cubeCamera);
    
    var reflectionCube = THREE.ImageUtils.loadTextureCube(urls);
    reflectionCube.format = THREE.RGBFormat;
    
    var refractionCube = new THREE.CubeTexture(reflectionCube.image, new THREE.CubeRefractionMapping());
    refractionCube.format = THREE.RGBFormat;
    
    var shader = THREE.ShaderLib[ "cube" ];
    shader.uniforms[ "tCube" ].value = reflectionCube;
    
    var material = new THREE.ShaderMaterial({
        
        fragmentShader: shader.fragmentShader,
        vertexShader: shader.vertexShader,
        uniforms: shader.uniforms,
        depthWrite: false,
        side: THREE.BackSide
    }),

        mesh = new THREE.Mesh(new THREE.BoxGeometry(5000, 5000, 5000), material);
    //scene.add( mesh );
    /*var t = new Text('VEERTJE', 3 );
    t.scale.multiplyScalar( 1 );
    t.updateMatrix();
    
    gem = new CurlMesh('text' , t , {

      soul:{

        noiseSize: { type:"f" , value: .1 , constraints:[.01 , 1.] },
        returnPower:        { type:"f" , value: .8  , constraints:[ .0 ,1. ] },
        noisePower:         { type:"f" , value: 1   , constraints:[0 , 10.] },

      }
      
    });*/

    // var g = new THREE.Mesh( new THREE.CubeGeometry( 3 , 3 , 3 , 20 , 20 , 20 ) );
    var g = new THREE.Mesh(new THREE.IcosahedronGeometry(3 , 4));
    gem = new CurlMesh('Batchass - PFML' , loadedMeshes.skull1 , {
        
        vs: shaders.vertexShaders.cube,
        fs: shaders.fragmentShaders.cube,
        
        soul: {
            
            noiseSize: { type: "f" , value: .001 , constraints: [.00001 , .01] },
            noisePower: { type: "f" , value: 100   , constraints: [0 , 300.] },
            returnPower: { type: "f" , value: 1.   , constraints: [.0 , 2.] },
        },
        
        body: {
            t_refl: { type: "t" , value: cubeCamera.renderTarget },
            t_refr: { type: "t" , value: cubeCamera.renderTarget },
            custom1: { type: "f" , value: .9 , constraints: [.8 , 1] },
            custom2: { type: "f" , value: .5 , constraints: [0 , 1] },
            custom3: { type: "f" , value: 3 , constraints: [0 , 5] },
            audioDisplacement: { type: "f" , value : 0.0 , constraints: [0 , 200] },
        }
    });
    
    gem.soul.reset(gem.t_og.value);
    gem.toggle();
    
    //gem.body.material.blending = THREE.AdditiveBlending;
    //gem.body.material.transparent = true;
    //gem.body.material.depthWrite = false;
    
    //gem.body.materialNeedsUpdate = true;
    
    
    var g = new THREE.TetrahedronGeometry(100 , 1);
    var m = new THREE.ShaderMaterial({
        
        uniforms: {
            t_audio: G_UNIFORMS.t_audio,
            camPos: { type: "v3" , value: camera.position }
        },
        vertexShader: shaders.vertexShaders.crystal,
        fragmentShader: shaders.fragmentShaders.crystal,
        
        transparent: true,
        //blending:THREE.AdditiveBlending,
        depthWrite: false,
        shading: THREE.FlatShading
    });
    
    var geo = new THREE.Geometry();
    for (var i = 0; i < 1000; i++) {
        
        var me = new THREE.Mesh(g);
        
        var x = Math.random() < .5 ? 1 : -1;
        var y = Math.random() < .5 ? 1 : -1;
        var z = Math.random() < .5 ? 1 : -1;
        me.position.x = (x + (Math.random() - .5)) * 1000;
        me.position.y = (y + (Math.random() - .5)) * 1000;
        me.position.z = (z + (Math.random() - .5)) * 1000;
        
        me.rotation.x = Math.random();
        me.rotation.y = Math.random();
        me.rotation.z = Math.random();
        me.scale.multiplyScalar(Math.random() * Math.random() * Math.random() * 3. + .5)
        
        
        me.updateMatrix();
        
        
        var t = Math.random() * 2 * Math.PI;
        var p = Math.random() * 2 * Math.PI;
        me.position.copy(toCart(3000 , t , p));
        
        //cubeMapSpheres.push( me );
        
        me.updateMatrix();
        
        geo.merge(g , me.matrix);

     // scene.add( me );
    }
    
    geo.computeFaceNormals();
    geo.computeVertexNormals();
    var mesh = new THREE.Mesh(geo , m);
    
    scene.add(mesh);
    
    source.mediaElement.play();
    
    loader.liftCurtain();
  
}


function animate() {
    
    
    
    audioController.update();
    
    G_UNIFORMS.dT.value = clock.getDelta();
    G_UNIFORMS.time.value += G_UNIFORMS.dT.value;
    
    gem.update();
    //gem1.update();
    
    /* gem.soul.debugScene.position.copy( camera.position );

    tv1.set( 0 , 0, -30 );
    tv1.applyQuaternion( camera.quaternion );
    gem.soul.debugScene.position.add( tv1 );
    gem.soul.debugScene.lookAt( camera.position );*/


    stats.update();
    
    controls.update();
    
    for (var i = 0; i < REPELERS.length; i++) {
        
        //console.log( REPELERS[i].target );
        tv1.copy(REPELERS[i].target);
        tv1.sub(REPELERS[i].position);
        
        tv1.multiplyScalar(.1);
        
        //console.log( tv1.x );
        REPELERS[i].position.add(tv1);
        
        var ind = i / (2 * REPELERS.length);
        var fI = Math.floor(ind * audioController.analyzer.array.length);
        var p = audioController.analyzer.array[ fI ];
        
        //console.log( p );
        REPELERS[i].power.x = p / 256;
      
    }
    
    
    if (!cubeMapRendered) {
        
        gem.body.visible = false; // *cough*
        
        cubeCamera.updateCubeMap(renderer, scene);
        
        gem.body.visible = true;
      //  var reflectionCube = THREE.ImageUtils.loadTextureCube( urls );
      //reflectionCube.format = THREE.RGBFormat;

  
     // cubeMapRendered = true;

     /* for( var i = 0; i < cubeMapSpheres.length; i++ ){

        scene.remove( cubeMapSpheres[i] );


      }*/

    }
    
    renderer.render(scene , camera);
    
    requestAnimationFrame(animate);

}


function onMouseMove(e) {

 
}

// Resets the renderer to be the proper size
function onWindowResize() {
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    var dpr = devicePixelRatio || 1;

    //camUniforms.SS.value.x = window.innerWidth * dpr;
    //camUniforms.SS.value.y = window.innerHeight * dpr;


}


function onLoad() {
    
    
    loaded++;
    
    console.log(loaded);
    if (loaded === neededToLoad) {
        
        init();
        animate();
      
   
      /*if( stream ){
      
        stream.play();

      }*/

    }

}

function toCart(r , t , p) {
    
    var x = r * (Math.sin(t)) * (Math.cos(p));
    var y = r * (Math.sin(t)) * (Math.sin(p));
    var z = r * (Math.cos(t));
    
    return new THREE.Vector3(x, y, z);

}
