import * as THREE from './lib/three.module.js';
import { ARButton } from './lib/ARButton.js';

import { GLTFLoader } from './lib/GLTFLoader.js';

const loader = new GLTFLoader();

let container;
let camera, scene, renderer;
let controller;

let reticle;

let hitTestSource = null;
let hitTestSourceRequested = false;



init();
animate();

function init() {

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );

    const light = new THREE.HemisphereLight( 0xffffff, 0xbbbbff, 1 );
    light.position.set( 0.5, 1, 0.25 );
    scene.add( light );

    //

    renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.xr.enabled = true;
    container.appendChild( renderer.domElement );

    //

    document.body.appendChild( ARButton.createButton( renderer, { requiredFeatures: [ 'hit-test' ] } ) );

    //

    let goalScale = {x:0.001, y:0.001, z:0.001};
    let ballScale = {x: 0.2, y: 0.2, z: 0.2};
    // let ballRadius = 1000;

    let goal = new THREE.Object3D();

    loader.load(
        
        './assets/football_goal/scene.gltf',
        
        function ( gltf ) {
            goal = gltf.scene;
        }
    );


    let ball = new THREE.Mesh(new THREE.SphereGeometry(ballRadius,32, 32), new THREE.MeshPhongMaterial({color: 0xff0505}));
    
    let state = true;
    function onSelect() {

        if ( reticle.visible && state) {

            goal.scale.set(goalScale.x,goalScale.y,goalScale.z);
            goal.position.setFromMatrixPosition( reticle.matrix );
            goal.position.z=goal.position.z-10;


            ball.scale.set(ballScale.x,ballScale.y,ballScale.z);
            ball.position.setFromMatrixPosition( reticle.matrix );

            scene.add(ball);
        
            scene.add(goal);

            state=false;

            var selectedObject = scene.getObjectByName("reticle");
            scene.remove( selectedObject );

        }
        else{
            makeGoal();
        }

    }

    controller = renderer.xr.getController( 0 );
    controller.addEventListener( 'select', onSelect );
    scene.add( controller );

    reticle = new THREE.Mesh(
        new THREE.RingGeometry( 0.15, 0.2, 32 ).rotateX( - Math.PI / 2 ),
        new THREE.MeshBasicMaterial()
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    reticle.name = "reticle";
    scene.add( reticle );

    //

    window.addEventListener( 'resize', onWindowResize );

}

function makeGoal() {
    console.log("goal")
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

//

function animate() {

    renderer.setAnimationLoop( render );

}

function render( timestamp, frame ) {

    if ( frame ) {

        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();

        if ( hitTestSourceRequested === false ) {

            session.requestReferenceSpace( 'viewer' ).then( function ( referenceSpace ) {

                session.requestHitTestSource( { space: referenceSpace } ).then( function ( source ) {

                    hitTestSource = source;

                } );

            } );

            session.addEventListener( 'end', function () {

                hitTestSourceRequested = false;
                hitTestSource = null;

            } );

            hitTestSourceRequested = true;

        }

        if ( hitTestSource ) {

            const hitTestResults = frame.getHitTestResults( hitTestSource );

            if ( hitTestResults.length ) {

                const hit = hitTestResults[ 0 ];

                reticle.visible = true;
                reticle.matrix.fromArray( hit.getPose( referenceSpace ).transform.matrix );

            } else {

                reticle.visible = false;

            }

        }

    }

    renderer.render( scene, camera );

}
