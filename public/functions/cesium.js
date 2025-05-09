

Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwOTMwZjFiMS01ZmE3LTQyZWUtYTFiZS03OGI4M2E3NDA1N2UiLCJpZCI6Mjk5NDc3LCJpYXQiOjE3NDYzOTc2MjR9.c9q7kSWbKbK0mUa35bGED-1-wjE_uJHJxjbgT6FShmA';

const viewer = new Cesium.Viewer('cesiumContainer');
viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.WHEEL);
viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
viewer.scene.screenSpaceCameraController.enableZoom = false;

const cesiumContainer = document.getElementById('cesiumContainer');
const googleMapsButton = document.getElementById('googleMaps');


let lastLat = 0;
let lastLon = 0;
let lastAlt = 0;
let preciseLat = 0;
let preciseLon = 0;
let preciseAlt = 0;
const orbitPathEntities = [];
var issDatas;
const ISSRefreshRate = 12000; // 6 secondi
const fps = 60; // Calcola il frame rate in millisecondi
const LIGHTING_THRESHOLD = 7500000; // Soglia in metri (10.000 km)
let orbitpathTime;
let popupUpdateHandle = null; // Variabile per gestire il ciclo di aggiornamento del popup

googleMapsButton.addEventListener("click", function () {
    const userLang = navigator.language || navigator.userLanguage; // Ottieni la lingua dell'utente
    const langCode = userLang.split('-')[0]; // Estrai il codice della lingua (es. 'it', 'uk', 'ru')
    const url = `https://www.google.com/maps/@${preciseLat},${preciseLon},15z?hl=${langCode}`;
    window.open(url, "_blank");
    console.log("Google Maps button clicked with language:", langCode);
});

viewer.screenSpaceEventHandler.setInputAction(function (movement) {
    const pickedObject = viewer.scene.pick(movement.position);
    // Controlla se l'oggetto cliccato è la ISS
    if (pickedObject && pickedObject.id && pickedObject.id._id === 'issEntity') {
        console.log("ISS clicked:", pickedObject.id);

        // Ottieni la posizione della ISS in coordinate WGS84
        const position = pickedObject.id.position.getValue(Cesium.JulianDate.now());
        if (!position) {
            console.error("Position is undefined for the picked object.");
            return;
        }

        // Converti la posizione in coordinate dello schermo
        const screenPosition = viewer.scene.cartesianToCanvasCoordinates(position);
        const popupWidth = $('#popup').width();
        const popupCenterPosition = {
            x: screenPosition.x - popupWidth / 2,
            y: screenPosition.y + 100// Offset per centrare il popup
        };
        console.log("Popup width:", popupWidth);
        if (!screenPosition) {
            console.error("Screen position could not be calculated.");
            return;
        }

        // Mostra il popup
    const popup = document.getElementById('popup');
    const popupVelocity = document.getElementById('velocity');
    const popupVisibility = document.getElementById('visibility');
    const popupAltitude = document.getElementById('altitude');
    const popupLatitude = document.getElementById('latitude');
    const popupLongitude = document.getElementById('longitude');
    const popupTime = document.getElementById('time');
    const cartographic = Cesium.Cartographic.fromCartesian(position);
    const latitude = Cesium.Math.toDegrees(cartographic.latitude).toFixed(4);
    const longitude = Cesium.Math.toDegrees(cartographic.longitude).toFixed(4);
    const altitude = (cartographic.height / 1000).toFixed(3); // Altitudine in km
    const velocity = Number(issDatas.velocity.toFixed(0)).toLocaleString('it-IT'); // Velocità in km/h
    const time = Math.floor(Date.now() / 1000); // Tempo in secondi
    const userTimeZoneOffset = new Date().getTimezoneOffset() * 60; // Offset in seconds
    const userTime = time - userTimeZoneOffset; // Adjust time to user's timezone
    const userHours = Math.floor(userTime / 3600) % 24; // Ore
    const userMinutes = Math.floor((userTime % 3600) / 60); // Minuti
    const userSeconds = userTime % 60; // Secondi
    const formattedUserTime = `${String(userHours).padStart(2, '0')}:${String(userMinutes).padStart(2, '0')}:${String(userSeconds).padStart(2, '0')}`;
    const visibility = issDatas.visibility; // Visibilità in km
    popupTime.innerHTML = `${formattedUserTime}`;
    popupLatitude.innerHTML = `${latitude}°`;
    popupLongitude.innerHTML = `${longitude}°`;
    popupAltitude.innerHTML = `${altitude} km`;
    popupVelocity.innerHTML = `${velocity} km/h`;
    popupVisibility.innerHTML = `${visibility}`;

        popup.style.left = `${popupCenterPosition.x}px`;
        popup.style.top = `${popupCenterPosition.y}px`;
        popup.style.display = 'flex';
        startPopupUpdate(); // Avvia l'aggiornamento della posizione del popup
    } else {
        stopPopupUpdate(); // Ferma l'aggiornamento e nascondi il popup
    }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

function updateInfoContainer(data, firstStart, countryData) {
    const infoTime = document.getElementById('info-time');
    const infoVelocity = document.getElementById('info-velocity');
    const infoVisibility = document.getElementById('info-visibility');
    const infoCountry = document.getElementById('info-country');
    const infoVelocityValue =  Number(data.velocity.toFixed(0)).toLocaleString('it-IT'); // Velocità in km/h
    const infoVisibilityValue = data.visibility;
    
    var infoCountryValue;
    if (countryData === "??") {
        infoCountryValue = "Sea"; // Paese
    } else {
        infoCountryValue = countryData; // Paese
    }
    infoVelocity.innerHTML = `${infoVelocityValue} km/h`;
    infoVisibility.innerHTML = `${infoVisibilityValue}`;
    infoCountry.innerHTML = `${infoCountryValue}`; // Paese
if (firstStart) {
    const infoLatitude = document.getElementById('info-latitude');
    const infoLongitude = document.getElementById('info-longitude');
    const infoAltitude = document.getElementById('info-altitude');
    const infoLatitudeValue = data.latitude.toFixed(4);
    const infoLongitudeValue = data.longitude.toFixed(4);
    const infoAltitudeValue = data.altitude.toFixed(3); // Converti in km
    infoLatitude.innerHTML = `${infoLatitudeValue}°`;
    infoLongitude.innerHTML = `${infoLongitudeValue}°`;
    infoAltitude.innerHTML = `${infoAltitudeValue} km`;
}
}

function updateInfoContainerPosition(data){
    const infoLatitude = document.getElementById('info-latitude');
    const infoLongitude = document.getElementById('info-longitude');
    const infoAltitude = document.getElementById('info-altitude');
    const infoLatitudeValue = data.latitude.toFixed(8);
    const infoLongitudeValue = data.longitude.toFixed(8);
    const infoAltitudeValue = data.altitude.toFixed(3); // Converti in km
    infoLatitude.innerHTML = `${infoLatitudeValue}°`;
    infoLongitude.innerHTML = `${infoLongitudeValue}°`;
    infoAltitude.innerHTML = `${infoAltitudeValue} km`;
}


cesiumContainer.addEventListener('wheel', function (event) {
    event.preventDefault(); // Previeni il comportamento predefinito del browser

    // Calcola la direzione dello zoom
    const zoomDirection = event.deltaY > 0 ? 1 : -1;

    // Calcola la quantità di zoom personalizzata
    const zoomAmount = zoomDirection * viewer.scene.camera.positionCartographic.height / 20;

    console.log("Zoom direction:", zoomDirection);
    console.log("Zoom amount:", zoomAmount);

    // Applica lo zoom
    if (zoomDirection > 0) {
        viewer.scene.camera.zoomIn(-zoomAmount);
    } else {
        viewer.scene.camera.zoomOut(zoomAmount);
    }
});


let traveling = false; // Variabile per tenere traccia dello stato del viaggio
document.getElementsByClassName("view-button")[0].addEventListener("click", function () {
    viewer.scene.screenSpaceCameraController.enableRotate = false; // Disabilita la rotazione
    if (traveling) {
        return;
    }
    traveling = true; // Imposta lo stato del viaggio a vero
    if (viewer.trackedEntity) {
        
        viewer.trackedEntity = null; // Disabilita il tracciamento dell'entità
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(preciseLon, preciseLat, preciseAlt * 1000 + 10000000),
            duration: 2,
            complete: function() {
                console.log("Camera fly to earth completed.");
                viewer.scene.screenSpaceCameraController.enableRotate = true; // Riabilita la rotazione
                traveling = false; // Ripristina lo stato del viaggio
                document.getElementsByClassName("view-button")[0].innerHTML = "🌍"; // Cambia il testo del pulsante
            }
            
        });
    } else {
        const issEntity = viewer.entities.getById('issEntity');
        if (issEntity) {
            viewer.trackedEntity = issEntity; // Abilita il tracciamento dell'entità
            viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(preciseLon, preciseLat, preciseAlt * 1000 + 1000000),
                duration: 2,
                complete: function() {
                    console.log("Camera fly to ISS completed.");
                    
                }
                
            });
            setTimeout(() => {
                viewer.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(preciseLon, preciseLat, preciseAlt * 1000 + 1000000),
                    duration: 0,
                    complete: function() {
                        console.log("Camera fix completed.");
                        traveling = false; // Ripristina lo stato del viaggio
                        document.getElementsByClassName("view-button")[0].innerHTML = "🛰️"; // Cambia il testo del pulsante
                    }
                });
            viewer.scene.screenSpaceCameraController.enableRotate = true; // Riabilita la rotazione
            viewer.scene.screenSpaceCameraController.minimumZoomDistance = 500000; // Distanza minima
            viewer.scene.screenSpaceCameraController.maximumZoomDistance = 2000000; // Distanza massima
            viewer.scene.screenSpaceCameraController.minimumPitch = Cesium.Math.toRadians(-90.0); // Inclinazione minima
            viewer.scene.screenSpaceCameraController.maximumPitch = Cesium.Math.toRadians(-90.0); // Inclinazione massima
            viewer.scene.screenSpaceCameraController.enableTilt = false; // Disabilita l'inclinazione
            viewer.scene.screenSpaceCameraController.enableLook = false; // Disabilita la rotazione
            viewer.scene.screenSpaceCameraController.enableTranslate = false; // Disabilita la traslazione
            viewer.scene.screenSpaceCameraController.enableCollisionDetection = false; // Disabilita la collisione
            console.log("Camera fly to ISS completed.");
            }, 2000); // Aspetta 2 secondi prima di riabilitare la rotazione
        }
    }
});



function updateLightingBasedOnCameraDistance() {
    const cameraHeight = viewer.camera.positionCartographic.height;

    if (cameraHeight > LIGHTING_THRESHOLD) {
        // Abilita l'illuminazione globale se la fotocamera è lontana
        if (!viewer.scene.globe.enableLighting) {
            viewer.scene.globe.enableLighting = true;
            console.log("Illuminazione globale abilitata.");
        }
    } else {
        // Disabilita l'illuminazione globale se la fotocamera è vicina
        if (viewer.scene.globe.enableLighting) {
            viewer.scene.globe.enableLighting = false;
            console.log("Illuminazione globale disabilitata.");
        }
    }
}

// Monitora la distanza della fotocamera ogni frame
viewer.scene.postRender.addEventListener(updateLightingBasedOnCameraDistance);

function orientateCameraToISS(lon, lat, alt) {
    const currentPosition = Cesium.Cartesian3.fromDegrees(lon, lat, alt * 1000);
    const previousPosition = Cesium.Cartesian3.fromDegrees(lastLon, lastLat, lastAlt * 1000);

    // Calcola il vettore velocità
    const velocity = Cesium.Cartesian3.subtract(currentPosition, previousPosition, new Cesium.Cartesian3());
    Cesium.Cartesian3.normalize(velocity, velocity);

    // Calcola la matrice di rotazione
    const rotationMatrix = Cesium.Transforms.rotationMatrixFromPositionVelocity(currentPosition, velocity);

    // Imposta la fotocamera
    viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, alt * 1000 + 1000000),
        orientation: {
            heading: Cesium.Math.toRadians(0.0),
            pitch: Cesium.Math.toRadians(-90.0),
            roll: 0.0
        }
    });

    // Imposta l'orientamento basato sul quaternione
    viewer.camera.lookAtTransform(Cesium.Matrix4.fromRotationTranslation(rotationMatrix, currentPosition));
}

async function getISSDataFromServer() {
    try {
        const response = await fetch("https://api.wheretheiss.at/v1/satellites/25544");
        const issData = await response.json();
        console.log("Dati ISS ricevuti dal server:", issData);
        const countryResponse = await fetch(`https://api.wheretheiss.at/v1/coordinates/${issData.latitude},${issData.longitude}`); // Ottieni i dati del paese
        const countryData = await countryResponse.json();
        issDatas = issData; // Salva i dati in una variabile globale
        if ($("#info-longitude").html() === "0.00000000°") {
        updateInfoContainer(issData, true, countryData.country_code); // Aggiorna l'info container
        } else {
        updateInfoContainer(issData, false, countryData.country_code); // Aggiorna l'info container
        }
        console.log("Dati ISS ricevuti dal server:", issData);
        console.log("Dati paese ricevuti dal server:", countryData.country_code);
        return {
            lat: issData.latitude,
            lon: issData.longitude,
            alt: issData.altitude,
            velocity: issData.velocity,
            visibility: issData.visibility,
        };
    } catch (error) {
        console.error("Errore durante il fetch dei dati dal server:", error);
        return null;
    }
}

// Usa i dati per aggiornare la posizione della ISS
async function updateISSPositionOnServer() {
    const issData = await getISSDataFromServer();
    if (!issData) return;

    const { lat, lon, alt } = issData;

    // Aggiorna la posizione della ISS su Cesium
    const issEntity = viewer.entities.getById('issEntity');
    if (issEntity) {
        issEntity.position = Cesium.Cartesian3.fromDegrees(lon, lat, alt * 1000);
    }

    console.log("Posizione ISS aggiornata:", lat, lon, alt);
}

// Chiama la funzione quando la pagina viene caricata
updateISSPositionOnServer();

function updatePopupPosition() {
    const issEntity = viewer.entities.getById('issEntity');
    if (!issEntity) return;

    // Ottieni la posizione della ISS in coordinate WGS84
    const position = issEntity.position.getValue(Cesium.JulianDate.now());
    if (!position) return;

    // Converti la posizione in coordinate dello schermo
    const screenPosition = viewer.scene.cartesianToCanvasCoordinates(position);
    const popupWidth = $('#popup').width();
        const popupCenterPosition = {
            x: screenPosition.x - popupWidth / 2,
            y: screenPosition.y + 100// Offset per centrare il popup
        };
    if (!screenPosition) return;

    // Aggiorna la posizione del popup
    const popup = document.getElementById('popup');
    const popupVelocity = document.getElementById('velocity');
    const popupVisibility = document.getElementById('visibility');
    const popupAltitude = document.getElementById('altitude');
    const popupLatitude = document.getElementById('latitude');
    const popupLongitude = document.getElementById('longitude');
    const popupTime = document.getElementById('time');
    const cartographic = Cesium.Cartographic.fromCartesian(position);
    const latitude = Cesium.Math.toDegrees(cartographic.latitude).toFixed(4);
    const longitude = Cesium.Math.toDegrees(cartographic.longitude).toFixed(4);
    const altitude = (cartographic.height / 1000).toFixed(3); // Altitudine in km
    const velocity = Number(issDatas.velocity.toFixed(0)).toLocaleString('it-IT'); // Velocità in km/h
    const time = Math.floor(Date.now() / 1000); // Tempo in secondi
    const userTimeZoneOffset = new Date().getTimezoneOffset() * 60; // Offset in seconds
    const userTime = time - userTimeZoneOffset; // Adjust time to user's timezone
    const userHours = Math.floor(userTime / 3600) % 24; // Ore
    const userMinutes = Math.floor((userTime % 3600) / 60); // Minuti
    const userSeconds = userTime % 60; // Secondi
    const formattedUserTime = `${String(userHours).padStart(2, '0')}:${String(userMinutes).padStart(2, '0')}:${String(userSeconds).padStart(2, '0')}`;
    const visibility = issDatas.visibility; // Visibilità in km
    popupTime.innerHTML = `${formattedUserTime}`;
    popupLatitude.innerHTML = `${latitude}°`;
    popupLongitude.innerHTML = `${longitude}°`;
    popupAltitude.innerHTML = `${altitude} km`;
    popupVelocity.innerHTML = `${velocity} km/h`;
    popupVisibility.innerHTML = `${visibility}`;
    // Imposta la posizione del popup
    popup.style.left = `${popupCenterPosition.x}px`;
    popup.style.top = `${popupCenterPosition.y}px`;

    // Aggiorna il contenuto del popup
    
    popup.style.display = 'flex';
}


// Avvia un ciclo di aggiornamento continuo
function startPopupUpdate() {
    function update() {
        updatePopupPosition();
        popupUpdateHandle = requestAnimationFrame(update); // Salva il riferimento al ciclo
    }
    update();
}

function stopPopupUpdate() {
    if (popupUpdateHandle) {
        cancelAnimationFrame(popupUpdateHandle); // Ferma il ciclo di aggiornamento
        popupUpdateHandle = null; // Resetta il riferimento
    }

    // Nascondi il popup
    const popup = document.getElementById('popup');
    popup.style.display = 'none';
}

async function getFullOrbitPath() {
    if (orbitPathEntities.length > 0) {
        orbitPathEntities.forEach(entity => {
            viewer.entities.remove(entity);
        });
        orbitPathEntities.length = 0; // Pulisci l'array
    }

    const now = Math.floor(Date.now() / 1000); // Timestamp attuale
    orbitpathTime = now;
    console.log(now);
    const timestamps1 = [];
    const timestamps2 = [];

for (let i = -5400/2; i < 0; i += 150) {  // 5400 secondi = 90 minuti (orbita completa)
    timestamps1.push(now + i);
    timestamps2.push(now + i + 5400/2); // Aggiungi 90 minuti per la seconda metà dell'orbita
}

const url1 = `https://api.wheretheiss.at/v1/satellites/25544/positions?timestamps=${timestamps1.join(",")}`;
const url2 = `https://api.wheretheiss.at/v1/satellites/25544/positions?timestamps=${timestamps2.join(",")}`;

    const response1 = await fetch(url1);
    const response2 = await fetch(url2);
    const data1 = await response1.json();
    const data2 = await response2.json();
    console.log(data1);
    if (lastLat === 0 && lastLon === 0 && lastAlt === 0) {
    const timestamps3 = now - ISSRefreshRate/1000;
    const url3 = `https://api.wheretheiss.at/v1/satellites/25544/positions?timestamps=${timestamps3}`;
    const response3 = await fetch(url3);
    const data3 = await response3.json();
    lastLat = data3[0].latitude;
    lastLon = data3[0].longitude;
    lastAlt = data3[0].altitude;
    }
    const data = [...data1, ...data2]; // Unisci i dati delle due metà dell'orbita
    console.log(data);

    const positions = data.map(pos => Cesium.Cartesian3.fromDegrees(pos.longitude, pos.latitude, pos.altitude * 1000 - 40000));
    console.log(positions);

    for (let i = 0; i < positions.length; i++) {
        const startPosition = positions[i];
        const endPosition = positions[i + 1];
        console.log(startPosition, endPosition);
        const orbEntity = viewer.entities.add({
            name: "Purple straight arrow at height",
            polyline: {
                positions: startPosition && endPosition ? [startPosition, endPosition] : [],
                width: 8,
                material: new Cesium.PolylineArrowMaterialProperty(Cesium.Color.TOMATO),
                clampToGround: false,  
            },
          });
        orbitPathEntities.push(orbEntity);
    }
}

function orientateISS(issEntity, issBigPing, issPing, lon, lat, alt) {
    const currentPosition = Cesium.Cartesian3.fromDegrees(lon, lat, alt * 1000);
        const previousPosition = Cesium.Cartesian3.fromDegrees(lastLon, lastLat, lastAlt * 1000);
        issEntity.position = currentPosition;
        issPing.position = Cesium.Cartesian3.fromDegrees(lon, lat, 0);
        issBigPing.position = Cesium.Cartesian3.fromDegrees(lon, lat, 0);
        const velocity = Cesium.Cartesian3.subtract(currentPosition, previousPosition, new Cesium.Cartesian3());
            Cesium.Cartesian3.normalize(velocity, velocity);

            // Calcola la matrice di rotazione basata sulla posizione e velocità
            const rotationMatrix = Cesium.Transforms.rotationMatrixFromPositionVelocity(currentPosition, velocity);

            // Converti la matrice di rotazione in un quaternione
            const orientation = Cesium.Quaternion.fromRotationMatrix(rotationMatrix);
        // Aggiorna la posizione dell'entità
            issEntity.orientation = new Cesium.ConstantProperty(orientation);
            issPing.orientation = new Cesium.ConstantProperty(orientation);
            issBigPing.orientation = new Cesium.ConstantProperty(orientation);
}

// Creare entità ISS
async function updateISSPosition() {
    const { lat, lon, alt } = await getISSDataFromServer();
    // Creare entità ISS
    const issEntity = viewer.entities.add({
        id: 'issEntity',
        name: 'ISS',
        description: 'International Space Station',
        show: true,
        allowPicking: true,
        position: Cesium.Cartesian3.fromDegrees(lon, lat, alt*1000),
        model: {
            uri: "./models/ISS_stationary.glb",
            minimumPixelSize: 20000,
            maximumScale: 4000,
            scale: 1,
        },
    });

    const issPing = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
        allowPicking: false,
        model: {
            uri: "./models/map_ping.glb",
            minimumPixelSize: 500,
            maximumScale: 200000,
            scale: 0.1,
            allowPicking: false,
        },
    });

    const issBigPing = viewer.entities.add({
        id: 'issBigPing',
        name: 'ISS Big Ping',
        position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
        allowPicking: false,
        model: {
            uri: "./models/map_ping.glb",
            minimumPixelSize: 1000,
            maximumScale: 1000000,
            scale: 0.1,
            allowPicking: false,
        },
    });
    
    issEntity.model.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(100000.0, alt*1000 + 10000000);
    issBigPing.model.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(alt*1000 + 10500000, alt*1000000);
    orientateISS(issEntity, issBigPing, issPing, lon, lat, alt);
    lastLat = lat;
    lastLon = lon;
    lastAlt = alt;
    preciseLat = lat;
    preciseLon = lon;
    preciseAlt = alt;


    // Aggiorna la posizione ogni 10 secondi
    setInterval(async () => {
        const { lat, lon, alt } = await getISSDataFromServer();
        
        orientateISS(issEntity, issBigPing, issPing, lon, lat, alt);

        // Calcola l'orientamento verso le coordinate precedenti
        if (lastLat !== 0 && lastLon !== 0 && lastAlt !== 0) {
                var lonDiff = (lon - lastLon);
                var latDiff = (lat - lastLat);
                var altDiff = (alt - lastAlt);
                var lonStep = lonDiff / (ISSRefreshRate / fps);
                var latStep = latDiff / (ISSRefreshRate / fps);
                var altStep = altDiff / (ISSRefreshRate / fps);
                var pos = 1;
            for (let i = 0; i < ISSRefreshRate - fps; i += 1000/fps) {
                
                setTimeout(() => {
                var newLon = lastLon + lonStep * (i / fps);
                var newLat = lastLat + latStep * (i / fps);
                var newAlt = lastAlt + altStep * (i / fps);
                issEntity.position = Cesium.Cartesian3.fromDegrees(newLon, newLat, newAlt * 1000);
                issPing.position = Cesium.Cartesian3.fromDegrees(newLon, newLat, 0);
                issBigPing.position = Cesium.Cartesian3.fromDegrees(newLon, newLat, 0);
                updateInfoContainerPosition({latitude: newLat, longitude: newLon, altitude: newAlt});
                // console.log("issEntity position: ", issEntity.position._value);
                preciseLat = newLat;
                preciseLon = newLon;
                preciseAlt = newAlt;
                pos++;

                }, i);

                

            // Calcola il vettore direzionale (velocità)

                
            }

            // Calcola il vettore direzionale (velocità)
            

            // Imposta l'orientamento dell'entità
            

            // Aggiungi una linea tratteggiata tra la posizione attuale e quella precedente
        }

        // Aggiorna le coordinate precedenti
        lastLat = lat;
        lastLon = lon;
        lastAlt = alt;
        const currentTime = Math.floor(Date.now() / 1000); // Timestamp attuale
        const timeDiff = currentTime - orbitpathTime; // Differenza di tempo in secondi
        const updateRate = 2700; // 45 minuti in secondi
        console.log(`time left before the path update: ${(Math.abs(timeDiff - updateRate))}`);
        if (timeDiff-updateRate >= 0) {
            getFullOrbitPath();   
            console.log("Orbit path updated.");
        }
        
    }, ISSRefreshRate);

    
    const tm3 = setTimeout(() => {
        
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(lon, lat, alt*1000 + 10000000),
            duration: 2,
            complete: function() {
                console.log("Camera fly 2 completed.");
            }
            
        });
    }, 2500);

    // viewer.trackedEntity = issEntity;
}


viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(0, 0, 100000000),
    orientation: {
        heading: Cesium.Math.toRadians(0.0),
        pitch: Cesium.Math.toRadians(-90.0),
        roll: 0.0
    }
});
await getFullOrbitPath();
updateISSPosition();
viewer.scene.light = new Cesium.DirectionalLight({
    direction: new Cesium.Cartesian3(-1.0, -1.0, -1.0), // Direzione della luce
    color: Cesium.Color.WHITE, // Colore della luce
    intensity: 2.0 // Intensità della luce
});
viewer.scene.debugShowFramesPerSecond = true; // Mostra i frame per secondo
viewer.scene.fog.enabled = false; // Disabilita la nebbia
