/* ==========================================================================
   Crypto Mining Platform - Enterprise Logic Engine (Three.js, GSAP, Chart.js)
   ========================================================================== */

// --- GLOBAL STATE ---
const STATE = {
    // Current user data
    user: {
        isLoggedIn: false,
        name: "Operator-A",
        email: "demo@cryptomin.com",
        role: "user",
        balance: 0.0,
        hashrate: 0.0,
        activeContracts: [],
        transactions: [],
        walletAddress: "",
        referrals: {
            count: 0,
            earnings: 0.0
        }
    },
    // Live cryptocurrency prices
    prices: {
        BTC: { price: 65421.50, change: 2.45 },
        ETH: { price: 3512.40, change: 1.82 },
        USDT: { price: 1.00, change: 0.01 },
        BNB: { price: 582.10, change: -0.42 },
        LTC: { price: 79.85, change: 3.15 }
    },
    activeGalleryIndex: 1
};

// Intercept native fetch to prepend base URL for API requests if running locally
const originalFetch = window.fetch;
window.fetch = function (resource, init) {
    if (typeof resource === 'string' && resource.startsWith('/api/')) {
        const API_BASE_URL = (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '5000')) 
            ? 'http://localhost:5000' 
            : '';
        resource = API_BASE_URL + resource;
    }
    return originalFetch(resource, init);
};

/// --- INITIALIZATION ON DOCUMENT LOAD ---
document.addEventListener("DOMContentLoaded", () => {
    // 1. Hide Loader and initialize systems
    initLoader();

    // 2. Register PWA Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('PWA ServiceWorker registered:', reg.scope))
            .catch(err => console.warn('PWA ServiceWorker registration failed:', err));
    }

    // 3. Emergency startup fallback timer (Max 3 seconds)
    setTimeout(() => {
        const loader = document.getElementById("loader");
        if (loader && loader.style.display !== "none") {
            console.warn("[Startup] Emergency fallback triggered: forcing loader removal after 3 seconds.");
            loader.style.display = "none";
            const landingView = document.getElementById("landing-view");
            const dashboardView = document.getElementById("dashboard-view");
            if (landingView && dashboardView && landingView.classList.contains("hidden") && dashboardView.classList.contains("hidden")) {
                landingView.classList.remove("hidden");
            }
            if (typeof ScrollTrigger !== 'undefined') {
                ScrollTrigger.refresh();
            }
        }
    }, 3000);
});

/// Wrapper to initialize all app systems after loader completes
function initializeAppSystems() {
    console.log("[Initialization] Launching application modules...");
    
    const runModule = (name, fn) => {
        try {
            fn();
            console.log(`[Initialization] Module '${name}' loaded successfully.`);
        } catch (err) {
            console.error(`[Initialization] Module '${name}' failed to load:`, err);
        }
    };

    // 1. Initialize Three.js Scenes (Background, Bitcoin Hologram, and 3D Globe)
    runModule("ThreeJS", initThreeJS);

    // 2. Initialize GSAP animations
    runModule("GSAP", initGSAP);

    // 3. Initialize Crypto Ticker
    runModule("Ticker", () => {
        initTicker();
        if (!window.tickerInterval) {
            window.tickerInterval = setInterval(updateTickerPrices, 2500);
        }
    });

    // 4. Initialize Sliders & ROI Calculator
    runModule("Calculator", initCalculator);

    // 5. Setup Event Listeners (Modals, Nav, Accordions)
    runModule("EventListeners", setupEventListeners);

    // 6. Start dashboard balance growth simulation
    runModule("MiningSimulator", startMiningSimulator);

    // 7. Start transparency live payout logs feed
    runModule("LivePayouts", startLivePayoutsTicker);

    // 8. Initialize Tab Systems
    runModule("Tabs", initTabs);

    // 9. Initialize Proof-of-Work Canvas Wave
    runModule("ProofOfWorkWave", initProofOfWorkWave);

    // 10. Initialize Trust & Infrastructure SCADA Updates
    runModule("TrustInfrastructure", initTrustInfrastructureSection);

    // 11. Check session recovery status
    runModule("AuthCheck", checkAuthMe);
}

async function checkAuthMe() {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
        const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            STATE.user.isLoggedIn = true;
            STATE.user.name = data.user.full_name;
            STATE.user.email = data.user.email;
            STATE.user.role = data.user.role;

            if (data.user.role === "admin") {
                document.getElementById("db-nav-admin").classList.remove("hidden");
            } else {
                document.getElementById("db-nav-admin").classList.add("hidden");
            }

            updateAuthUI();
            showToast("Session Restored", `Welcome back, ${STATE.user.name}! Access restored.`, "success");
        } else {
            localStorage.removeItem("accessToken");
            updateAuthUI();
        }
    } catch (err) {
        console.warn("[AuthCheck] Failed to restore token session:", err);
    }
}

function updateAuthUI() {
    const headerBtn = document.getElementById("header-signup-btn");
    const mobileBtn = document.getElementById("mobile-signup-btn");
    if (STATE.user.isLoggedIn) {
        if (headerBtn) headerBtn.textContent = "Account";
        if (mobileBtn) mobileBtn.textContent = "Account";
    } else {
        if (headerBtn) headerBtn.textContent = "Login";
        if (mobileBtn) mobileBtn.textContent = "Login";
    }
}

function handleStartMiningClick() {
    document.getElementById("landing-view").classList.add("hidden");
    document.getElementById("dashboard-view").classList.remove("hidden");
    initDashboard();
    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
    }
}

/// --- LOADER HANDLING ---
function initLoader() {
    console.log("STEP 1");
    const loader = document.getElementById("loader");
    const bar = document.querySelector(".loader-bar");
    const statusText = document.querySelector(".loader-status");
    
    const statuses = [
        "Initializing Quantum Hash Network...",
        "Connecting Iceland Geothermal Node...",
        "Authenticating ASIC Immersion Pods...",
        "Decrypting SHA-256 Ledger Vaults...",
        "Platform Ready."
    ];

    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 5;
        if (progress > 100) progress = 100;
        
        bar.style.width = `${progress}%`;
        
        // Update status text based on progress
        const statusIdx = Math.min(Math.floor(progress / 25), statuses.length - 1);
        statusText.textContent = statuses[statusIdx];

        if (progress === 100) {
            clearInterval(interval);
            // Pre-initialize systems to build DOM and canvases before loader fades
            console.log("STEP 2");
            try {
                initializeAppSystems();
            } catch (initErr) {
                console.error("[Startup] Critical app systems initialization failed:", initErr);
            }
            
            setTimeout(() => {
                try {
                    if (typeof gsap !== 'undefined') {
                        gsap.to(loader, {
                            opacity: 0,
                            duration: 0.5,
                            onComplete: () => {
                                console.log("STEP 3");
                                loader.style.display = "none";
                                // Force refresh of ScrollTrigger now that layout is completely stable
                                if (typeof ScrollTrigger !== 'undefined') {
                                    ScrollTrigger.refresh();
                                }
                                // Run our startup validation to guarantee visible states
                                try {
                                    runStartupValidation();
                                } catch (valErr) {
                                    console.error("[Startup] Validation failed:", valErr);
                                }
                            }
                        });
                    } else {
                        // Fallback if GSAP fails to load
                        console.log("STEP 3");
                        loader.style.display = "none";
                        try {
                            runStartupValidation();
                        } catch (valErr) {
                            console.error("[Startup] Validation failed:", valErr);
                        }
                    }
                } catch (gsapErr) {
                    console.error("[Startup] GSAP animations failed during loader exit:", gsapErr);
                    console.log("STEP 3");
                    loader.style.display = "none";
                }
            }, 300);
        }
    }, 150);
}

// --- THREE.JS WEBGL RENDERERS ---
let bgScene, bgCamera, bgRenderer, bgParticles;
let coinScene, coinCamera, coinRenderer, coinMesh, coinLight;
let globeScene, globeCamera, globeRenderer, globeGroup;

function initThreeJS() {
    // A. 3D PARTICLE BACKGROUND
    const bgCanvas = document.getElementById("webgl-background");
    if (bgCanvas) {
        bgScene = new THREE.Scene();
        bgCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        bgCamera.position.z = 30;

        bgRenderer = new THREE.WebGLRenderer({ canvas: bgCanvas, alpha: true, antialias: true });
        bgRenderer.setSize(window.innerWidth, window.innerHeight);
        bgRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const particleCount = 400;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        const colorBlue = new THREE.Color(0x00f0ff);
        const colorPurple = new THREE.Color(0x8a2be2);

        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 60;
            positions[i+1] = (Math.random() - 0.5) * 60;
            positions[i+2] = (Math.random() - 0.5) * 60;

            const mixedColor = colorBlue.clone().lerp(colorPurple, Math.random());
            colors[i] = mixedColor.r;
            colors[i+1] = mixedColor.g;
            colors[i+2] = mixedColor.b;
        }

        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.25,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        bgParticles = new THREE.Points(geometry, material);
        bgScene.add(bgParticles);

        window.addEventListener("resize", () => {
            bgCamera.aspect = window.innerWidth / window.innerHeight;
            bgCamera.updateProjectionMatrix();
            bgRenderer.setSize(window.innerWidth, window.innerHeight);
        });

        let mouseX = 0, mouseY = 0;
        window.addEventListener("mousemove", (e) => {
            mouseX = (e.clientX - window.innerWidth / 2) * 0.02;
            mouseY = (e.clientY - window.innerHeight / 2) * 0.02;
        });

        const animateBg = () => {
            requestAnimationFrame(animateBg);
            bgParticles.rotation.y += 0.0006;
            bgParticles.rotation.x += 0.0002;
            bgParticles.position.x += (mouseX - bgParticles.position.x) * 0.05;
            bgParticles.position.y += (-mouseY - bgParticles.position.y) * 0.05;
            bgRenderer.render(bgScene, bgCamera);
        };
        animateBg();
    }

    // B. HERO SECTION 3D BITCOIN HOLOGRAM
    const coinContainer = document.getElementById("three-bitcoin-container");
    if (coinContainer) {
        const width = coinContainer.clientWidth;
        const height = coinContainer.clientHeight || 500;

        coinScene = new THREE.Scene();
        coinCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        coinCamera.position.z = 10;

        coinRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        coinRenderer.setSize(width, height);
        coinRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        coinContainer.appendChild(coinRenderer.domElement);

        const coinGroup = new THREE.Group();
        coinScene.add(coinGroup);

        const cylinderGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.25, 60);
        const goldMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.95,
            roughness: 0.12
        });
        
        const coinBody = new THREE.Mesh(cylinderGeo, goldMaterial);
        coinBody.rotation.x = Math.PI / 2;
        coinGroup.add(coinBody);

        const torusGeo = new THREE.TorusGeometry(2.1, 0.1, 16, 100);
        const ringMaterial = new THREE.MeshStandardMaterial({
            color: 0xffbd3d,
            metalness: 0.9,
            roughness: 0.2
        });
        const innerRing = new THREE.Mesh(torusGeo, ringMaterial);
        innerRing.position.z = 0.13;
        coinGroup.add(innerRing);

        const innerRingBack = innerRing.clone();
        innerRingBack.position.z = -0.13;
        coinGroup.add(innerRingBack);

        const wireframeGeo = new THREE.CylinderGeometry(2.6, 2.6, 0.35, 24);
        const wireMaterial = new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            wireframe: true,
            transparent: true,
            opacity: 0.25,
            blending: THREE.AdditiveBlending
        });
        const wireframeShell = new THREE.Mesh(wireframeGeo, wireMaterial);
        wireframeShell.rotation.x = Math.PI / 2;
        coinGroup.add(wireframeShell);

        const orbitParticlesGeo = new THREE.BufferGeometry();
        const opCount = 80;
        const opPositions = new Float32Array(opCount * 3);
        for (let i = 0; i < opCount; i++) {
            const angle = (i / opCount) * Math.PI * 2;
            const radius = 3.5 + Math.random() * 0.8;
            opPositions[i*3] = Math.cos(angle) * radius;
            opPositions[i*3+1] = Math.sin(angle) * radius;
            opPositions[i*3+2] = (Math.random() - 0.5) * 1.5;
        }
        orbitParticlesGeo.setAttribute("position", new THREE.BufferAttribute(opPositions, 3));
        const opMaterial = new THREE.PointsMaterial({
            color: 0x00f0ff,
            size: 0.08,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        const orbitParticles = new THREE.Points(orbitParticlesGeo, opMaterial);
        coinScene.add(orbitParticles);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        coinScene.add(ambientLight);

        const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight1.position.set(5, 5, 5);
        coinScene.add(dirLight1);

        const dirLight2 = new THREE.DirectionalLight(0x8a2be2, 1.8);
        dirLight2.position.set(-5, -3, 2);
        coinScene.add(dirLight2);

        coinLight = new THREE.PointLight(0x00f0ff, 2.5, 12);
        coinLight.position.set(0, 0, 3);
        coinScene.add(coinLight);

        window.addEventListener("resize", () => {
            const w = coinContainer.clientWidth;
            const h = coinContainer.clientHeight || 500;
            coinCamera.aspect = w / h;
            coinCamera.updateProjectionMatrix();
            coinRenderer.setSize(w, h);
        });

        let targetRotY = 0;
        let targetRotX = 0.2;
        window.addEventListener("mousemove", (e) => {
            if (!STATE.user.isLoggedIn) {
                const rect = coinContainer.getBoundingClientRect();
                const x = e.clientX - rect.left - (rect.width / 2);
                const y = e.clientY - rect.top - (rect.height / 2);
                targetRotY = (x / rect.width) * 1.5;
                targetRotX = (y / rect.height) * 1.5;
            }
        });

        const animateCoin = () => {
            requestAnimationFrame(animateCoin);
            coinGroup.rotation.y += 0.008;
            coinGroup.rotation.y += (targetRotY - coinGroup.rotation.y) * 0.05;
            coinGroup.rotation.x += (targetRotX - coinGroup.rotation.x) * 0.05;

            const time = Date.now() * 0.002;
            coinLight.position.x = Math.sin(time) * 3;
            coinLight.position.y = Math.cos(time * 0.8) * 2;
            orbitParticles.rotation.z -= 0.002;

            coinRenderer.render(coinScene, coinCamera);
        };
        animateCoin();
    }

    // C. 3D INTERACTIVE GLOBAL EARTH GLOBE (Infrastructure showcase)
    const globeContainer = document.getElementById("three-globe-viewport");
    if (globeContainer) {
        const width = globeContainer.clientWidth;
        const height = globeContainer.clientHeight || 520;

        globeScene = new THREE.Scene();
        globeCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        globeCamera.position.z = 10;

        globeRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        globeRenderer.setSize(width, height);
        globeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        globeContainer.appendChild(globeRenderer.domElement);

        globeGroup = new THREE.Group();
        globeScene.add(globeGroup);

        // Procedural Holographic Sphere Earth
        const sphereGeo = new THREE.SphereGeometry(3, 32, 32);
        const globeMat = new THREE.MeshBasicMaterial({
            color: 0x070b19,
            transparent: true,
            opacity: 0.85
        });
        const baseGlobe = new THREE.Mesh(sphereGeo, globeMat);
        globeGroup.add(baseGlobe);

        // Glowing Wireframe grid overlay
        const wireframeGeo = new THREE.SphereGeometry(3.01, 24, 24);
        const wireMat = new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            wireframe: true,
            transparent: true,
            opacity: 0.18
        });
        const gridGlobe = new THREE.Mesh(wireframeGeo, wireMat);
        globeGroup.add(gridGlobe);

        // Convert coordinates to translation helper
        const latLonToVector3 = (lat, lon, radius) => {
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lon + 180) * (Math.PI / 180);

            const x = -(radius * Math.sin(phi) * Math.sin(theta));
            const y = radius * Math.cos(phi);
            const z = radius * Math.sin(phi) * Math.cos(theta);

            return new THREE.Vector3(x, y, z);
        };

        // Coordinates for Server Nodes
        const nodes = {
            iceland: { pos: latLonToVector3(64.9, -18.5, 3), color: 0x00f0ff, id: "iceland" },
            norway: { pos: latLonToVector3(60.4, 8.4, 3), color: 0x8a2be2, id: "norway" },
            texas: { pos: latLonToVector3(31.9, -99.9, 3), color: 0xffbd3d, id: "texas" },
            swiss: { pos: latLonToVector3(46.8, 8.2, 3), color: 0x00e676, id: "swiss" },
            canada: { pos: latLonToVector3(56.1, -106.3, 3), color: 0xff3838, id: "canada" }
        };

        // Plot node spheres on globe
        const nodeGroup = new THREE.Group();
        globeGroup.add(nodeGroup);

        const nodeKeys = Object.keys(nodes);
        nodeKeys.forEach(key => {
            const node = nodes[key];
            const nodeGeo = new THREE.SphereGeometry(0.12, 16, 16);
            const nodeMat = new THREE.MeshBasicMaterial({ color: node.color });
            const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
            nodeMesh.position.copy(node.pos);
            nodeGroup.add(nodeMesh);

            // Add pulsing ring effect around nodes
            const ringGeo = new THREE.RingGeometry(0.15, 0.24, 16);
            const ringMat = new THREE.MeshBasicMaterial({
                color: node.color,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.6
            });
            const ringMesh = new THREE.Mesh(ringGeo, ringMat);
            ringMesh.position.copy(node.pos);
            ringMesh.lookAt(0, 0, 0); // Face outward
            nodeGroup.add(ringMesh);
        });

        // Bezier connections lines (holographic server sync paths)
        const drawConnectionArc = (p1, p2) => {
            const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
            const distance = p1.distanceTo(p2);
            mid.normalize().multiplyScalar(3 + distance * 0.22); // Arc curve height

            const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
            const points = curve.getPoints(32);
            const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
            const lineMat = new THREE.LineBasicMaterial({
                color: 0x00f0ff,
                transparent: true,
                opacity: 0.35
            });
            const line = new THREE.Line(lineGeo, lineMat);
            globeGroup.add(line);
        };

        // Connect nodes to simulate net routes
        drawConnectionArc(nodes.iceland.pos, nodes.norway.pos);
        drawConnectionArc(nodes.iceland.pos, nodes.texas.pos);
        drawConnectionArc(nodes.norway.pos, nodes.swiss.pos);
        drawConnectionArc(nodes.texas.pos, nodes.canada.pos);

        // Simple mouse drag to orbit the Globe manually
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };

        globeContainer.addEventListener("mousedown", (e) => {
            isDragging = true;
        });

        globeContainer.addEventListener("mousemove", (e) => {
            const deltaMove = {
                x: e.offsetX - previousMousePosition.x,
                y: e.offsetY - previousMousePosition.y
            };

            if (isDragging) {
                const deltaRotationQuaternion = new THREE.Quaternion()
                    .setFromEuler(new THREE.Euler(
                        (deltaMove.y * 0.005),
                        (deltaMove.x * 0.005),
                        0,
                        'XYZ'
                    ));
                
                globeGroup.quaternion.multiplyQuaternions(deltaRotationQuaternion, globeGroup.quaternion);
            }

            previousMousePosition = {
                x: e.offsetX,
                y: e.offsetY
            };
        });

        window.addEventListener("mouseup", () => {
            isDragging = false;
        });

        // Handle Touch events for mobile dragging
        globeContainer.addEventListener("touchstart", (e) => {
            isDragging = true;
            const touch = e.touches[0];
            previousMousePosition = { x: touch.clientX, y: touch.clientY };
        });

        globeContainer.addEventListener("touchmove", (e) => {
            if (isDragging && e.touches.length === 1) {
                const touch = e.touches[0];
                const deltaMove = {
                    x: touch.clientX - previousMousePosition.x,
                    y: touch.clientY - previousMousePosition.y
                };

                const deltaRotationQuaternion = new THREE.Quaternion()
                    .setFromEuler(new THREE.Euler(
                        (deltaMove.y * 0.008),
                        (deltaMove.x * 0.008),
                        0,
                        'XYZ'
                    ));
                
                globeGroup.quaternion.multiplyQuaternions(deltaRotationQuaternion, globeGroup.quaternion);

                previousMousePosition = { x: touch.clientX, y: touch.clientY };
            }
        });

        window.addEventListener("touchend", () => isDragging = false);

        // Resize handler
        window.addEventListener("resize", () => {
            const w = globeContainer.clientWidth;
            const h = globeContainer.clientHeight || 520;
            globeCamera.aspect = w / h;
            globeCamera.updateProjectionMatrix();
            globeRenderer.setSize(w, h);
        });

        // Loop rotation and pulse rings
        let activeNodeTimer = 0;
        let activeNodeIndex = 0;

        const animateGlobe = () => {
            requestAnimationFrame(animateGlobe);

            // Slow rotate if user is not dragging
            if (!isDragging) {
                globeGroup.rotation.y += 0.002;
            }

            // Loop node highlighting telemetry details card
            activeNodeTimer += 1;
            if (activeNodeTimer > 240) { // Switch node highlight every 4 seconds
                activeNodeTimer = 0;
                activeNodeIndex = (activeNodeIndex + 1) % 3;
                
                const htmlNodeKeys = ["iceland", "norway", "texas"];
                const telemetryDivs = document.querySelectorAll(".node-tel");
                telemetryDivs.forEach((div, idx) => {
                    if (idx === activeNodeIndex) div.classList.add("active");
                    else div.classList.remove("active");
                });
            }

            globeRenderer.render(globeScene, globeCamera);
        };
        animateGlobe();
    }
}

// --- GSAP SCROLL & TRANSITIONS ---
function initGSAP() {
    gsap.registerPlugin(ScrollTrigger);

    // Fade reveal header elements
    gsap.from("#main-header", { y: -50, duration: 0.8, ease: "power2.out" });

    // Hero content triggers
    gsap.from(".hero-content > *", {
        y: 30,
        stagger: 0.15,
        duration: 0.8,
        ease: "power2.out"
    });

    // Stats count-up on scroll
    const statElements = document.querySelectorAll(".stat-number");
    statElements.forEach(el => {
        const targetVal = parseFloat(el.getAttribute("data-target"));
        const parentCard = el.closest(".stat-card");
        
        ScrollTrigger.create({
            trigger: parentCard,
            start: "top 85%",
            onEnter: () => {
                let obj = { val: 0 };
                gsap.to(obj, {
                    val: targetVal,
                    duration: 2,
                    ease: "power2.out",
                    onUpdate: () => {
                        if (targetVal % 1 === 0) {
                            el.textContent = Math.floor(obj.val).toLocaleString();
                        } else {
                            el.textContent = obj.val.toFixed(2);
                        }
                    }
                });
            }
        });
    });

    // Scroll reveal grids disabled to ensure cards render visible immediately without ScrollTrigger dependency
}

// --- CRYPTO PRICE TICKER ---
function initTicker() {
    const ticker = document.getElementById("crypto-ticker");
    if (!ticker) return;

    let tickerHTML = "";
    const coins = Object.keys(STATE.prices);
    
    for (let loop = 0; loop < 2; loop++) {
        coins.forEach(coin => {
            const info = STATE.prices[coin];
            const changeClass = info.change >= 0 ? "up" : "down";
            const icon = info.change >= 0 ? "fa-caret-up" : "fa-caret-down";
            const fontIcon = coin === "BTC" ? "fa-brands fa-bitcoin text-gold" : 
                             coin === "ETH" ? "fa-brands fa-ethereum text-purple" : "fa-solid fa-coins text-blue";

            tickerHTML += `
                <div class="ticker-item" data-coin="${coin}">
                    <i class="${fontIcon}"></i>
                    <span class="ticker-coin">${coin}/USD</span>
                    <span class="ticker-price">$${info.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    <span class="ticker-change ${changeClass}">
                        <i class="fa-solid ${icon}"></i> ${Math.abs(info.change).toFixed(2)}%
                    </span>
                </div>
            `;
        });
    }
    ticker.innerHTML = tickerHTML;
}

function updateTickerPrices() {
    const coins = Object.keys(STATE.prices);
    coins.forEach(coin => {
        const info = STATE.prices[coin];
        const pctChange = (Math.random() - 0.5) * 0.15;
        info.price = info.price * (1 + pctChange / 100);
        info.change += (Math.random() - 0.5) * 0.05;

        const items = document.querySelectorAll(`.ticker-item[data-coin="${coin}"]`);
        items.forEach(item => {
            const priceEl = item.querySelector(".ticker-price");
            const changeEl = item.querySelector(".ticker-change");

            priceEl.textContent = `$${info.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            
            const changeClass = info.change >= 0 ? "up" : "down";
            const icon = info.change >= 0 ? "fa-caret-up" : "fa-caret-down";
            
            changeEl.className = `ticker-change ${changeClass}`;
            changeEl.innerHTML = `<i class="fa-solid ${icon}"></i> ${Math.abs(info.change).toFixed(2)}%`;
        });
    });

    updateCalculatorResults();
}

// --- MINING CALCULATOR ---
const MINING_PLANS = {
    beginner: { name: "Beginner", price: 100, hashrate: 10, duration: 30, monitor: "24/7 Monitoring", support: "Basic Support", maxPrice: 499, rate: 0.1 },
    starter: { name: "Starter", price: 500, hashrate: 50, duration: 60, monitor: "Real-Time Dashboard", support: "Priority Support", maxPrice: 999, rate: 0.1 },
    professional: { name: "Professional", price: 1000, hashrate: 120, duration: 90, monitor: "Enhanced Monitoring", support: "Dedicated Support", maxPrice: 4999, rate: 0.12 },
    business: { name: "Business", price: 5000, hashrate: 750, duration: 180, monitor: "Premium Dashboard", support: "VIP Support", maxPrice: 9999, rate: 0.15 },
    enterprise: { name: "Enterprise", price: 10000, hashrate: 2000, duration: 365, monitor: "Institutional SCADA", support: "Enterprise Support", maxPrice: 49999, rate: 0.20 },
    ultimate: { name: "Ultimate", price: 50000, hashrate: 10000, duration: 365, monitor: "Dedicated SCADA Node", support: "White-Glove Support", maxPrice: 1000000, rate: 0.20 }
};

let calcChart = null;

function initCalculator() {
    const planSelect = document.getElementById("calc-plan-select");
    const usdSlider = document.getElementById("calc-investment-slider");
    const usdInput = document.getElementById("calc-investment-input");

    if (!planSelect || !usdSlider || !usdInput) return;

    // Set initial configuration
    onPlanSelectChange();
    initCalculatorChart();
    startLiveActivationsTicker();
    initActiveContractsCounter();

    // Event listeners
    planSelect.addEventListener("change", onPlanSelectChange);
    usdSlider.addEventListener("input", onInvestmentSliderChange);
    usdInput.addEventListener("input", onInvestmentInputChange);

    // Initial calculation
    updateCalculatorResults();
}

function onPlanSelectChange() {
    const planSelect = document.getElementById("calc-plan-select");
    if (!planSelect) return;
    const planKey = planSelect.value;
    const plan = MINING_PLANS[planKey];
    
    const usdSlider = document.getElementById("calc-investment-slider");
    const usdInput = document.getElementById("calc-investment-input");
    if (!usdSlider || !usdInput) return;
    
    // Set slider properties based on plan limits
    usdSlider.min = plan.price;
    usdSlider.max = plan.maxPrice;
    usdSlider.value = plan.price;
    usdSlider.step = planKey === 'ultimate' ? 5000 : (planKey === 'enterprise' ? 1000 : (planKey === 'business' ? 500 : 100));
    
    usdInput.value = plan.price;
    
    // Update labels
    const minLabel = document.getElementById("slider-min-mark");
    const maxLabel = document.getElementById("slider-max-mark");
    if (minLabel) minLabel.textContent = `$${plan.price.toLocaleString()}`;
    if (maxLabel) maxLabel.textContent = `$${plan.maxPrice.toLocaleString()}`;

    updateCalculatorResults();
}

function onInvestmentSliderChange(e) {
    const val = parseInt(e.target.value);
    const usdInput = document.getElementById("calc-investment-input");
    if (usdInput) usdInput.value = val;
    updateCalculatorResults();
}

function onInvestmentInputChange(e) {
    const usdSlider = document.getElementById("calc-investment-slider");
    if (!usdSlider) return;
    
    let val = parseInt(e.target.value) || 0;
    
    // Clamp the input values
    const planSelect = document.getElementById("calc-plan-select");
    if (!planSelect) return;
    const planKey = planSelect.value;
    const plan = MINING_PLANS[planKey];
    
    if (val < plan.price) val = plan.price;
    if (val > plan.maxPrice) val = plan.maxPrice;
    
    usdSlider.value = val;
    updateCalculatorResults();
}

function updateCalculatorResults() {
    const planSelect = document.getElementById("calc-plan-select");
    const usdInput = document.getElementById("calc-investment-input");
    if (!planSelect || !usdInput) return;

    const planKey = planSelect.value;
    const plan = MINING_PLANS[planKey];
    const usdVal = parseInt(usdInput.value) || plan.price;
    
    // Calculate hashrate dynamically based on plan rates
    const hashrate = usdVal * plan.rate;
    const hashrateSlider = document.getElementById("calc-hashrate-slider");
    
    if (hashrateSlider) {
        hashrateSlider.min = plan.price * plan.rate;
        hashrateSlider.max = plan.maxPrice * plan.rate;
        hashrateSlider.value = hashrate;
    }
    
    // Formatted Hashrate Output Display
    let hashText = "";
    if (hashrate >= 1000) {
        hashText = `${(hashrate / 1000).toFixed(2)} PH/s`;
    } else {
        hashText = `${hashrate.toFixed(0)} TH/s`;
    }
    const hashValEl = document.getElementById("calc-hash-val");
    if (hashValEl) hashValEl.textContent = hashText;

    // Daily output estimates in BTC (0.00000048 BTC per day per TH/s)
    const dailyBtc = hashrate * 0.00000048;
    const weeklyBtc = dailyBtc * 7;
    const monthlyBtc = dailyBtc * 30;
    const totalBtc = dailyBtc * plan.duration;

    const btcPrice = STATE.prices.BTC.price;
    const dailyUsd = dailyBtc * btcPrice;
    const weeklyUsd = weeklyBtc * btcPrice;
    const monthlyUsd = monthlyBtc * btcPrice;
    const totalUsd = totalBtc * btcPrice;

    // Update UI Elements
    const dVal = document.getElementById("calc-res-daily-val");
    const dUsd = document.getElementById("calc-res-daily-usd");
    const wVal = document.getElementById("calc-res-weekly-val");
    const wUsd = document.getElementById("calc-res-weekly-usd");
    const mVal = document.getElementById("calc-res-monthly-val");
    const mUsd = document.getElementById("calc-res-monthly-usd");
    const tVal = document.getElementById("calc-res-total-val");
    const tTerm = document.getElementById("calc-res-contract");

    if (dVal) dVal.textContent = `~${dailyBtc.toFixed(8)} BTC`;
    if (dUsd) dUsd.textContent = `~$${dailyUsd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD`;
    
    if (wVal) wVal.textContent = `~${weeklyBtc.toFixed(8)} BTC`;
    if (wUsd) wUsd.textContent = `~$${weeklyUsd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD`;
    
    if (mVal) mVal.textContent = `~${monthlyBtc.toFixed(8)} BTC`;
    if (mUsd) mUsd.textContent = `~$${monthlyUsd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD`;
    
    if (tVal) tVal.textContent = `~${totalBtc.toFixed(8)} BTC`;
    if (tTerm) tTerm.textContent = `${plan.duration} Days Contract term (~$${totalUsd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD)`;

    // Update Projection Chart
    updateCalculatorChart(dailyBtc, plan.duration);
}

function initCalculatorChart() {
    const ctx = document.getElementById("calc-projection-chart");
    if (!ctx) return;

    const gradient = ctx.getContext("2d").createLinearGradient(0, 0, 0, 100);
    gradient.addColorStop(0, "rgba(0, 240, 255, 0.25)");
    gradient.addColorStop(1, "rgba(0, 240, 255, 0.0)");

    const gradientRef = ctx.getContext("2d").createLinearGradient(0, 0, 0, 100);
    gradientRef.addColorStop(0, "rgba(138, 43, 226, 0.1)");
    gradientRef.addColorStop(1, "rgba(138, 43, 226, 0.0)");

    if (calcChart) calcChart.destroy();

    calcChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Projected Output (BTC)',
                    data: [],
                    borderColor: '#00f0ff',
                    borderWidth: 2,
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#00f0ff',
                    pointRadius: 2,
                    pointHoverRadius: 4
                },
                {
                    label: 'Network Baseline (BTC)',
                    data: [],
                    borderColor: '#8a2be2',
                    borderWidth: 1.5,
                    borderDash: [4, 4],
                    backgroundColor: gradientRef,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#8a2be2',
                    pointRadius: 0,
                    pointHoverRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#ffffff',
                        font: { family: 'Outfit', size: 9 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(8, 8, 22, 0.95)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    titleFont: { family: 'Space Grotesk' },
                    bodyFont: { family: 'Outfit' }
                }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.03)' },
                    ticks: {
                        color: '#ffffff',
                        font: { family: 'Outfit', size: 8 },
                        callback: function(value) {
                            return value.toFixed(5) + ' BTC';
                        }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#ffffff', font: { family: 'Outfit', size: 8 } }
                }
            }
        }
    });
}

function updateCalculatorChart(dailyBtc, duration) {
    if (!calcChart) return;
    
    const labels = [];
    const data = [];
    const refData = [];
    const steps = 5;
    const stepDays = duration / steps;
    
    for (let i = 0; i <= steps; i++) {
        const d = Math.round(i * stepDays);
        labels.push(`Day ${d}`);
        data.push(dailyBtc * d);
        refData.push(dailyBtc * d * 0.88); // baseline 12% lower
    }
    
    calcChart.data.labels = labels;
    calcChart.data.datasets[0].data = data;
    calcChart.data.datasets[1].data = refData;
    calcChart.update();
}

function startLiveActivationsTicker() {
    const feed = document.getElementById("live-activations-feed");
    if (!feed) return;

    // Clear initial mockup rows to load nicely
    feed.innerHTML = "";

    const nodes = ["NODE-1029", "NODE-4820", "NODE-0812", "NODE-9923", "NODE-7541", "NODE-3329", "NODE-5502", "NODE-2180"];
    const plans = ["BEGINNER", "STARTER", "PROFESSIONAL", "BUSINESS", "ENTERPRISE"];
    const hashrates = {
        "BEGINNER": "10 TH/s",
        "STARTER": "50 TH/s",
        "PROFESSIONAL": "120 TH/s",
        "BUSINESS": "750 TH/s",
        "ENTERPRISE": "2,000 TH/s"
    };

    const addLog = (isInitial = false) => {
        const date = new Date();
        // Adjust minutes/seconds back slightly if initial to simulate chronological logs
        if (isInitial) {
            const offsetSec = Math.floor(Math.random() * 200) + 10;
            date.setSeconds(date.getSeconds() - offsetSec);
        }
        const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
        const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
        const randomPlan = plans[Math.floor(Math.random() * plans.length)];
        const hash = hashrates[randomPlan];
        const txHash = "bc1q" + Math.random().toString(36).substring(2, 6) + "..." + Math.random().toString(36).substring(2, 5);

        const row = document.createElement("div");
        row.className = isInitial ? "console-row" : "console-row new-entry";
        row.innerHTML = `<span>${timeStr}</span> [${randomNode}] Allocated ${hash} (${randomPlan} Contract) - TX: <code class="text-blue">${txHash}</code>`;
        
        feed.appendChild(row);
        
        while (feed.children.length > 8) {
            feed.removeChild(feed.firstChild);
        }

        feed.scrollTop = feed.scrollHeight;
    };

    // Prepopulate with some rows
    for (let i = 0; i < 4; i++) {
        addLog(true);
    }

    // Append new rows every 8 seconds
    setInterval(() => addLog(false), 8000);
}

function initActiveContractsCounter() {
    const el = document.getElementById("active-contracts-counter");
    if (!el) return;
    
    let baseCount = 14892;
    el.textContent = baseCount.toLocaleString();

    setInterval(() => {
        baseCount += Math.floor(Math.random() * 2) + 1;
        el.textContent = baseCount.toLocaleString();
    }, 12000);
}

function buyPlan(planName, price) {
    // Create overlay
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.style.zIndex = "10000";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(3, 3, 8, 0.85)";
    overlay.style.backdropFilter = "blur(8px)";
    overlay.style.opacity = "0";
    overlay.style.transition = "opacity 0.3s ease";

    // Create card
    const card = document.createElement("div");
    card.className = "modal-card";
    card.style.maxWidth = "520px";
    card.style.width = "92%";
    card.style.padding = "35px 30px";
    card.style.textAlign = "center";
    card.style.border = "1px solid rgba(0, 240, 255, 0.25)";
    card.style.boxShadow = "0 0 40px rgba(0, 240, 255, 0.15)";
    card.style.background = "rgba(6, 6, 18, 0.9)";
    card.style.borderRadius = "16px";
    card.style.backdropFilter = "blur(16px)";
    card.style.transform = "scale(0.95)";
    card.style.transition = "transform 0.3s ease, opacity 0.3s ease";
    card.style.boxSizing = "border-box";

    // Add content
    card.innerHTML = `
        <h3 style="font-family: 'Space Grotesk', sans-serif; font-size: 1.6rem; color: #00f0ff; margin-bottom: 20px; letter-spacing: 1px; font-weight: 700; text-shadow: 0 0 10px rgba(0, 240, 255, 0.3);">
            <i class="fa-solid fa-file-contract" style="margin-right: 8px; color: #00f0ff;"></i> Contract Purchase Notice
        </h3>
        <div style="text-align: left; margin-bottom: 24px; font-family: 'Outfit', sans-serif;">
            <p style="color: #ffffff; font-size: 0.98rem; line-height: 1.6; margin-bottom: 14px; font-weight: 600;">
                Thank you for your interest in our mining contracts.
            </p>
            <p style="color: #cbd5e1; font-size: 0.9rem; line-height: 1.6; margin-bottom: 12px;">
                To activate or purchase any contract plan, please contact the CRYPTOMIN Administration Team directly.
            </p>
            <p style="color: #cbd5e1; font-size: 0.9rem; line-height: 1.6; margin-bottom: 12px;">
                All contract allocations, enterprise onboarding, and account approvals are currently handled manually by our operators.
            </p>
            <p style="color: #cbd5e1; font-size: 0.9rem; line-height: 1.6; margin-bottom: 0px;">
                Please reach out to the administration team for pricing confirmation, contract availability, and activation instructions.
            </p>
        </div>
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 16px; margin-bottom: 24px;">
            <p style="color: #94a3b8; font-size: 0.8rem; font-style: italic; font-family: 'Outfit', sans-serif; text-align: center; margin: 0; line-height: 1.4;">
                Administrative approval is required before any contract can be activated.
            </p>
        </div>
        <div style="display: flex; gap: 12px; flex-direction: column; width: 100%;">
            <button class="btn btn-primary" style="width: 100%; font-weight: 700; background: var(--accent-blue) !important; color: #030308 !important;" id="purchase-contact-btn">
                Contact Administration
            </button>
            <button class="btn btn-outline" style="width: 100%; font-weight: 700; border: 1px solid rgba(255, 255, 255, 0.2); color: #ffffff;" id="purchase-close-btn">
                Close
            </button>
        </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Trigger animation
    setTimeout(() => {
        overlay.style.opacity = "1";
        card.style.transform = "scale(1)";
    }, 10);

    const closeModal = () => {
        overlay.style.opacity = "0";
        card.style.transform = "scale(0.95)";
        setTimeout(() => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
        }, 300);
    };

    // Close handler
    card.querySelector("#purchase-close-btn").onclick = closeModal;

    // Contact handler
    card.querySelector("#purchase-contact-btn").onclick = () => {
        closeModal();
        const contactSec = document.getElementById("contact");
        if (contactSec) {
            contactSec.scrollIntoView({ behavior: 'smooth' });
        }
    };
}

function contactSales(planName) {
    buyPlan(planName);
}

// --- MINING FARM GALLERY ---
function switchGallery(index) {
    if (STATE.activeGalleryIndex === index) return;
    
    STATE.activeGalleryIndex = index;
    const mainImg = document.getElementById("gallery-main-img");
    const title = document.getElementById("gallery-title");
    const desc = document.getElementById("gallery-desc");
    const specContainer = document.querySelector(".facility-specs");
    
    const thumbs = document.querySelectorAll(".thumb-item");
    thumbs.forEach((thumb, idx) => {
        if (idx + 1 === index) thumb.classList.add("active");
        else thumb.classList.remove("active");
    });

    const data = {
        1: {
            img: "assets/mining_farm_1.jpg",
            title: "Iceland Node (Nordic Submersion-A)",
            desc: "Our flagship datacenter. Power drawn from local Krafla geothermal fields, running immersion-cooled Antminers with redundant 10Gbps fiber arrays.",
            specs: `
                <span><i class="fa-solid fa-gauge-high"></i> 320 PH/s Capacity</span>
                <span><i class="fa-solid fa-bolt"></i> 12.4 MW Power draw</span>
                <span><i class="fa-solid fa-temperature-arrow-down"></i> -8°C Ambient</span>
            `
        },
        2: {
            img: "assets/mining_rigs_close.jpg",
            title: "Norway Facility (Oslo Fjords-B)",
            desc: "Advanced liquid cooled server farm utilizing cold water channels from deep fjords to maintain optimal ASIC chip temperatures. Clean hydroelectric energy source.",
            specs: `
                <span><i class="fa-solid fa-gauge-high"></i> 165 PH/s Capacity</span>
                <span><i class="fa-solid fa-bolt"></i> 6.8 MW Power draw</span>
                <span><i class="fa-solid fa-temperature-arrow-down"></i> -2°C Ambient</span>
            `
        }
    };

    const target = data[index];

    gsap.to(mainImg, {
        opacity: 0.1,
        duration: 0.3,
        onComplete: () => {
            mainImg.src = target.img;
            title.textContent = target.title;
            desc.textContent = target.desc;
            specContainer.innerHTML = target.specs;
            
            gsap.to(mainImg, { opacity: 1, duration: 0.4 });
        }
    });
}

// --- TRANSPARENCY LIVE REWARDS FEED ---
function startLivePayoutsTicker() {
    const tableBody = document.querySelector("#transparency-payout-table tbody");
    if (!tableBody) return;

    const nodes = ["Iceland Geothermal-A", "Norway Hydro-B", "Zurich Network-C", "Texas Solar-D"];

    // Initialize list with 4 records
    for (let i = 0; i < 4; i++) {
        addNewPayoutRow(tableBody, nodes);
    }

    // Push new payouts every 3.5 seconds
    setInterval(() => {
        addNewPayoutRow(tableBody, nodes);
    }, 3500);
}

function addNewPayoutRow(tableBody, nodes) {
    const txHash = "tx_" + Math.random().toString(36).substring(2, 10) + "..." + Math.random().toString(36).substring(2, 6);
    const nodeSource = nodes[Math.floor(Math.random() * nodes.length)];
    const amount = (0.0001 + Math.random() * 0.00035).toFixed(8);
    const date = new Date();
    const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;

    const newRow = document.createElement("tr");
    newRow.innerHTML = `
        <td><code class="text-blue">${txHash}</code></td>
        <td>${nodeSource}</td>
        <td class="text-green">+${amount} BTC</td>
        <td>${timeStr}</td>
        <td><span class="status-badge status-success">Broadcasted</span></td>
    `;

    // Prepend to body
    tableBody.insertBefore(newRow, tableBody.firstChild);

    // Keep last 6 elements in table
    while (tableBody.children.length > 6) {
        tableBody.lastChild.remove();
    }
}

// --- SETUP EVENT LISTENERS ---
function setupEventListeners() {
    // Theme switching
    const themeBtn = document.getElementById("theme-toggle-btn");
    themeBtn.addEventListener("click", () => {
        const body = document.body;
        body.classList.toggle("light-theme");
        
        const icon = themeBtn.querySelector("i");
        if (body.classList.contains("light-theme")) {
            icon.className = "fa-solid fa-sun";
            showToast("Theme Updated", "Switched to Light Fintech layout mode.", "info");
        } else {
            icon.className = "fa-solid fa-moon";
            showToast("Theme Updated", "Switched to Cyberpunk Dark layout mode.", "info");
        }
    });

    // Mobile menu toggle
    const menuToggle = document.querySelector(".mobile-menu-toggle");
    const navMenu = document.querySelector(".nav-menu");
    if (menuToggle && navMenu) {
        menuToggle.addEventListener("click", () => {
            navMenu.style.display = navMenu.style.display === "block" ? "none" : "block";
            const icon = menuToggle.querySelector("i");
            icon.className = navMenu.style.display === "block" ? "fa-solid fa-xmark" : "fa-solid fa-bars";
        });

        navMenu.querySelectorAll("a:not(.nav-link-dropdown)").forEach(link => {
            link.addEventListener("click", () => {
                if (window.innerWidth <= 1024) {
                    navMenu.style.display = "none";
                    menuToggle.querySelector("i").className = "fa-solid fa-bars";
                }
            });
        });
    }

    // Language Selector
    const langBtn = document.querySelector(".lang-btn");
    const langDrop = document.querySelector(".lang-dropdown");
    if (langBtn && langDrop) {
        langBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            langDrop.classList.toggle("active");
        });

        document.addEventListener("click", () => langDrop.classList.remove("active"));
        
        langDrop.querySelectorAll("li").forEach(item => {
            item.addEventListener("click", () => {
                const code = item.getAttribute("data-lang").toUpperCase();
                langBtn.querySelector("span").textContent = code;
                showToast("Language Selected", `System locale updated to ${item.textContent}.`, "info");
            });
        });
    }

    // FAQ Accordions
    const faqQuestions = document.querySelectorAll(".faq-question");
    faqQuestions.forEach(btn => {
        btn.addEventListener("click", () => {
            const item = btn.parentElement;
            const answer = btn.nextElementSibling;
            
            if (item.classList.contains("active")) {
                item.classList.remove("active");
                answer.style.maxHeight = null;
            } else {
                document.querySelectorAll(".faq-item").forEach(other => {
                    other.classList.remove("active");
                    other.querySelector(".faq-answer").style.maxHeight = null;
                });

                item.classList.add("active");
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });

    // Live Chat Widget
    const chatToggle = document.querySelector(".chat-toggle-btn");
    const chatBox = document.querySelector(".chat-box");
    const chatClose = document.querySelector(".chat-close-btn");
    
    if (chatToggle && chatBox) {
        chatToggle.addEventListener("click", () => {
            chatBox.classList.toggle("hidden");
            const badge = chatToggle.querySelector(".chat-badge-dot");
            if (badge) badge.style.display = "none";
        });

        chatClose.addEventListener("click", () => chatBox.classList.add("hidden"));
    }

    // Dashboard Header Dropdowns
    const dbNotifBtn = document.getElementById("db-notif-btn");
    const dbNotifDrop = document.querySelector(".db-notif-dropdown");
    if (dbNotifBtn && dbNotifDrop) {
        dbNotifBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            dbNotifDrop.classList.toggle("hidden");
            document.querySelector(".db-notif-badge").style.display = "none";
        });
        
        document.addEventListener("click", () => dbNotifDrop.classList.add("hidden"));
        dbNotifDrop.addEventListener("click", (e) => e.stopPropagation());
    }

    const dbProfBtn = document.querySelector(".db-profile-btn");
    const dbProfDrop = document.querySelector(".db-profile-dropdown");
    if (dbProfBtn && dbProfDrop) {
        dbProfBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            dbProfDrop.classList.toggle("active");
        });

        document.addEventListener("click", () => dbProfDrop.classList.remove("active"));
        dbProfDrop.addEventListener("click", (e) => e.stopPropagation());
    }

    // Header Auth Buttons
    const headerSignupBtn = document.getElementById("header-signup-btn");
    if (headerSignupBtn) {
        headerSignupBtn.addEventListener("click", () => {
            if (STATE.user.isLoggedIn) {
                showToast("Account Info", `Logged in as ${STATE.user.name} (${STATE.user.email})`, "info");
            } else {
                openAuthModal("signup");
            }
        });
    }
    
    const mobileSignupBtn = document.getElementById("mobile-signup-btn");
    if (mobileSignupBtn) {
        mobileSignupBtn.addEventListener("click", () => {
            if (STATE.user.isLoggedIn) {
                showToast("Account Info", `Logged in as ${STATE.user.name} (${STATE.user.email})`, "info");
            } else {
                openAuthModal("signup");
            }
            if (window.innerWidth <= 1024 && navMenu) {
                navMenu.style.display = "none";
                menuToggle.querySelector("i").className = "fa-solid fa-bars";
            }
        });
    }

    // Start Mining Buttons
    const headerStartMiningBtn = document.getElementById("header-start-mining-btn");
    if (headerStartMiningBtn) {
        headerStartMiningBtn.addEventListener("click", () => {
            handleStartMiningClick();
        });
    }

    const mobileStartMiningBtn = document.getElementById("mobile-start-mining-btn");
    if (mobileStartMiningBtn) {
        mobileStartMiningBtn.addEventListener("click", () => {
            handleStartMiningClick();
            if (window.innerWidth <= 1024 && navMenu) {
                navMenu.style.display = "none";
                menuToggle.querySelector("i").className = "fa-solid fa-bars";
            }
        });
    }
    
    // Custom Navigation Dropdowns & Mega Menu Behavior
    document.querySelectorAll(".has-dropdown > a").forEach(trigger => {
        trigger.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const parent = trigger.parentElement;
            const isActive = parent.classList.contains("active");
            
            document.querySelectorAll(".has-dropdown").forEach(el => {
                el.classList.remove("active");
            });
            
            if (!isActive) {
                parent.classList.add("active");
            }
        });
    });

    document.querySelectorAll(".has-dropdown").forEach(item => {
        item.addEventListener("mouseleave", () => {
            item.classList.remove("active");
        });
    });

    document.addEventListener("click", (e) => {
        if (!e.target.closest(".has-dropdown")) {
            document.querySelectorAll(".has-dropdown").forEach(item => {
                item.classList.remove("active");
            });
        }
    });

    const authModal = document.getElementById("auth-modal");
    authModal.addEventListener("click", (e) => {
        if (e.target === authModal) closeAuthModal();
    });
}

// --- TOAST NOTIFICATIONS DRAWER ---
function showToast(title, text, type = "success") {
    const container = document.getElementById("notification-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    const icon = type === "success" ? "fa-circle-check" : 
                 type === "info" ? "fa-circle-info" : "fa-triangle-exclamation";

    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <div class="toast-content">
            <h5>${title}</h5>
            <p>${text}</p>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.transform = "translateX(50px)";
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// --- AUTHENTICATION FLOW SIMULATOR ---
function openAuthModal(tab = "signup") {
    const modal = document.getElementById("auth-modal");
    modal.classList.remove("hidden");
    switchAuthTab(tab);
}

function closeAuthModal() {
    const modal = document.getElementById("auth-modal");
    modal.classList.add("hidden");
}

function switchAuthTab(tab) {
    document.querySelectorAll(".auth-tab-content").forEach(el => el.classList.add("hidden"));
    document.getElementById(`auth-${tab}-content`).classList.remove("hidden");
}

function handleAuthSubmit(e, action) {
    e.preventDefault();

    if (action === "forgot") {
        const email = document.getElementById("forgot-email").value;

        fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        })
        .then(res => res.json().then(data => ({ status: res.status, data })))
        .then(({ status, data }) => {
            showToast("Restore Dispatched", data.message || "If the email is active, recovery code dispatched.", "info");
            closeAuthModal();
        })
        .catch(err => {
            showToast("Connection Fail", "Authentication backend unreachable.", "danger");
        });
    } 
    else if (action === "signup") {
        const name = document.getElementById("signup-name").value;
        const email = document.getElementById("signup-email").value;
        const password = document.getElementById("signup-password").value;
        const confirmPassword = document.getElementById("signup-confirm-password").value;
        const invitationKey = document.getElementById("signup-invitation").value;

        if (password !== confirmPassword) {
            showToast("Mismatch Passkey", "Passwords do not match. Verify confirm password.", "danger");
            return;
        }

        fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                full_name: name,
                email: email,
                password: password,
                confirm_password: confirmPassword,
                invitation_key: invitationKey
            })
        })
        .then(res => res.json().then(data => ({ status: res.status, data })))
        .then(({ status, data }) => {
            if (status !== 201) {
                showToast("Staging Failure", data.message || "Registration failed.", "danger");
            } else {
                showToast("Node Staged", data.message || "OTP code dispatched to your email address.", "success");
                window.lastStagedEmail = email;
                switchAuthTab("2fa");
            }
        })
        .catch(err => {
            showToast("Connection Fail", "Authentication backend unreachable.", "danger");
        });
    } 
    else if (action === "2fa") {
        const code = document.getElementById("2fa-code").value;
        const email = window.lastStagedEmail || (STATE.user && STATE.user.email);

        if (!email) {
            showToast("Context Error", "Email context missing.", "danger");
            return;
        }

        fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code })
        })
        .then(res => res.json().then(data => ({ status: res.status, data })))
        .then(({ status, data }) => {
            if (status !== 200) {
                showToast("Activation Rejected", data.message || "Invalid verification code.", "danger");
            } else {
                localStorage.setItem("accessToken", data.accessToken);
                STATE.user.name = data.user.full_name;
                STATE.user.email = data.user.email;
                STATE.user.role = data.user.role;

                if (data.user.role === "admin") {
                    document.getElementById("db-nav-admin").classList.remove("hidden");
                } else {
                    document.getElementById("db-nav-admin").classList.add("hidden");
                }

                closeAuthModal();

                const loader = document.getElementById("loader");
                loader.style.display = "flex";
                loader.style.opacity = "1";
                document.querySelector(".loader-bar").style.width = "0%";
                document.querySelector(".loader-status").textContent = "Establishing security layer tunnel...";

                let progress = 0;
                const progressInterval = setInterval(() => {
                    progress += 20;
                    document.querySelector(".loader-bar").style.width = `${progress}%`;
                    if (progress >= 100) {
                        clearInterval(progressInterval);
                        setTimeout(() => {
                            gsap.to(loader, {
                                opacity: 0,
                                duration: 0.5,
                                onComplete: () => {
                                    loader.style.display = "none";
                                    STATE.user.isLoggedIn = true;
                                    updateAuthUI();
                                    showToast("Session Authorized", `Welcome back, ${STATE.user.name}! Node online.`, "success");
                                }
                            });
                        }, 300);
                    }
                }, 150);
            }
        })
        .catch(err => {
            showToast("Connection Fail", "Authentication backend unreachable.", "danger");
        });
    }
}

function resend2fa() {
    const email = window.lastStagedEmail || (STATE.user && STATE.user.email);
    if (!email) {
        showToast("Context Error", "Email context missing.", "danger");
        return;
    }
    fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    })
    .then(res => res.json().then(data => ({ status: res.status, data })))
    .then(({ status, data }) => {
        if (status !== 200) {
            showToast("Resend Failed", data.message || "Failed to resend OTP.", "danger");
        } else {
            showToast("OTP Code Dispatched", "New security token sent to your email node.", "info");
        }
    });
}

function handleLogout() {
    fetch('/api/auth/logout', {
        method: 'POST'
    })
    .finally(() => {
        localStorage.removeItem("accessToken");
        STATE.user.isLoggedIn = false;
        STATE.user.role = "user";
        updateAuthUI();
        document.getElementById("db-nav-admin").classList.add("hidden");
        document.getElementById("dashboard-view").classList.add("hidden");
        document.getElementById("landing-view").classList.remove("hidden");
        
        if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
        }
        showToast("Session Terminated", "Security passkey revoked. Node disconnected.", "warning");
    });
}

// --- USER DASHBOARD PANEL ENGINE ---let dbChart;
function initDashboard() {
    document.getElementById("db-profile-name").textContent = STATE.user.name;
    document.getElementById("set-name").value = STATE.user.name;
    document.getElementById("set-email").value = STATE.user.email;
    document.getElementById("set-wallet-btc").value = STATE.user.walletAddress || "";
    const walletDepAddr = document.getElementById("wallet-dep-addr");
    if (walletDepAddr) {
        walletDepAddr.value = STATE.user.walletAddress || "";
        walletDepAddr.dispatchEvent(new Event("input"));
    }

    // Real-Time Clock
    if (window.dbClockInterval) clearInterval(window.dbClockInterval);
    window.dbClockInterval = setInterval(() => {
        const timeStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const clock = document.getElementById("db-clock");
        if (clock) clock.textContent = timeStr;
    }, 1000);

    const hasContracts = STATE.user.activeContracts && STATE.user.activeContracts.length > 0;

    // Initial KPI sparklines countups
    setTimeout(() => {
        countUpValue(document.getElementById("db-balance"), STATE.user.balance, hasContracts ? 8 : 0, "", "");
        countUpValue(document.getElementById("db-hashrate"), hasContracts ? STATE.user.hashrate : 50, hasContracts ? 1 : 0, "", "");
        countUpValue(document.getElementById("db-active-contracts"), STATE.user.activeContracts.length, 0, "", "");
        countUpValue(document.getElementById("db-est-output"), hasContracts ? 0.00025720 : 0.0, hasContracts ? 8 : 0, "", "");
    }, 100);

    // Initialize all components
    checkDashboardEmptyStates();
    initDashboardChart();
    renderDashboardContracts();
    renderTxTableUpgraded();
    startLiveActivityFeed();
    startNodeTelemetrySimulation();
    updateBalanceUI();
    startTerminalLogs();

    // Start Bitcoin Explorer animations
    startBitcoinNetworkExplorerAnimation();
}

function checkDashboardEmptyStates() {
    const hasContracts = STATE.user.activeContracts && STATE.user.activeContracts.length > 0;
    
    const chartContainer = document.querySelector(".db-chart-container");
    const explorerContainer = document.getElementById("bitcoin-network-explorer");

    if (hasContracts) {
        if (chartContainer) chartContainer.classList.remove("hidden");
        if (explorerContainer) explorerContainer.classList.add("hidden");
    } else {
        if (chartContainer) chartContainer.classList.add("hidden");
        if (explorerContainer) explorerContainer.classList.remove("hidden");
    }

    // Toggle the hashrate card elements
    const labelEl = document.getElementById("db-hashrate-label");
    const valEl = document.getElementById("db-hashrate");
    const unitEl = document.getElementById("db-hashrate-unit");
    const badgeEl = document.getElementById("hashes-trend-badge");
    const descEl = document.getElementById("db-hashrate-desc");
    const noteEl = document.getElementById("hashrate-free-note");
    const sparklineHashes = document.getElementById("sparkline-hashes");
    
    if (hasContracts) {
        if (labelEl) labelEl.textContent = "Leased Hashes";
        if (valEl) {
            const totalHashrate = STATE.user.activeContracts.reduce((sum, c) => sum + c.hashrate, 0);
            valEl.textContent = totalHashrate.toFixed(1);
        }
        if (unitEl) unitEl.textContent = "TH/s";
        if (badgeEl) {
            badgeEl.className = "trend-badge trend-neutral font-mono";
            badgeEl.innerHTML = `<i class="fa-solid fa-bolt"></i> Peak`;
        }
        if (descEl) descEl.textContent = "Active Allocation";
        if (noteEl) noteEl.classList.add("hidden");
        if (sparklineHashes) sparklineHashes.style.display = "block";
    } else {
        if (labelEl) labelEl.textContent = "FREE STARTER HASHRATE";
        if (valEl) valEl.textContent = "50";
        if (unitEl) unitEl.innerHTML = `MH/s <span style="font-weight: normal; font-size: 0.85em; color: var(--cyan);">(FREE)</span>`;
        if (badgeEl) {
            badgeEl.className = "trend-badge trend-free font-mono";
            badgeEl.innerHTML = `<i class="fa-solid fa-gift"></i> FREE PLAN`;
        }
        if (descEl) descEl.textContent = "Complimentary starter allocation provided by Cryptomin.";
        if (noteEl) noteEl.classList.remove("hidden");
        if (sparklineHashes) sparklineHashes.style.display = "none";
    }
    
    const infraEmpty = document.getElementById("infra-empty-state");
    const infraGrid = document.querySelector(".infra-nodes-grid");
    const infraBadge = document.getElementById("infra-status-badge");
    
    const feedEmpty = document.getElementById("feed-empty-state");
    const feedContainer = document.getElementById("db-activity-feed");
    const feedLiveTag = document.getElementById("feed-live-tag");
    const feedDesc = document.getElementById("feed-desc");

    // Sparklines & Trends inside KPI cards
    const trendBalance = document.getElementById("balance-trend-badge");
    const trendContracts = document.getElementById("contracts-trend-badge");
    const trendOutput = document.getElementById("output-trend-badge");

    const sparkBalance = document.getElementById("sparkline-balance");
    const sparkContracts = document.getElementById("sparkline-contracts");
    const sparkOutput = document.getElementById("sparkline-output");
    
    if (hasContracts) {
        // Show active states
        if (infraEmpty) infraEmpty.classList.add("hidden");
        if (infraGrid) infraGrid.classList.remove("hidden");
        if (infraBadge) {
            infraBadge.innerHTML = `<span class="badge-pulse-dot"></span> Online`;
            infraBadge.className = "badge badge-success font-mono live-pulse-badge";
        }
        
        if (feedEmpty) feedEmpty.classList.add("hidden");
        if (feedContainer) feedContainer.style.display = "flex";
        if (feedLiveTag) feedLiveTag.classList.remove("hidden");
        if (feedDesc) feedDesc.textContent = "Real-time operations log feed.";

        // Show trends & sparklines
        if (trendBalance) { trendBalance.classList.remove("hidden"); trendBalance.innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> +2.4%`; }
        if (trendContracts) { trendContracts.classList.remove("hidden"); trendContracts.innerHTML = `<i class="fa-solid fa-check"></i> Max Uptime`; }
        if (trendOutput) { trendOutput.classList.remove("hidden"); trendOutput.innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> +1.8%`; }

        if (sparkBalance) sparkBalance.style.display = "block";
        if (sparkContracts) sparkContracts.style.display = "block";
        if (sparkOutput) sparkOutput.style.display = "block";
    } else {
        // Show empty states
        if (infraEmpty) infraEmpty.classList.remove("hidden");
        if (infraGrid) infraGrid.style.display = "none";
        if (infraBadge) {
            infraBadge.innerHTML = `<i class="fa-solid fa-circle-info"></i> Inactive`;
            infraBadge.className = "badge badge-warning font-mono live-pulse-badge";
        }
        
        if (feedEmpty) feedEmpty.classList.remove("hidden");
        if (feedContainer) feedContainer.style.display = "none";
        if (feedLiveTag) feedLiveTag.classList.add("hidden");
        if (feedDesc) feedDesc.textContent = "No rewards generated. No payouts available.";

        // Hide trends & sparklines or set to inactive/0
        if (trendBalance) { trendBalance.classList.add("hidden"); }
        if (trendContracts) { trendContracts.classList.add("hidden"); }
        if (trendOutput) { trendOutput.classList.add("hidden"); }

        if (sparkBalance) sparkBalance.style.display = "none";
        if (sparkContracts) sparkContracts.style.display = "none";
        if (sparkOutput) sparkOutput.style.display = "none";
    }
}

// --- UPGRADED CONTROL CENTER MODULES ---

function updateBalanceUI() {
    if (!STATE.user) return;
    const hasContracts = STATE.user.activeContracts && STATE.user.activeContracts.length > 0;
    const balance = STATE.user.balance;
    const btcPrice = STATE.prices.BTC ? STATE.prices.BTC.price : 65421.50;
    const usdVal = balance * btcPrice;

    const formattedBTC = hasContracts ? balance.toFixed(8) : "0";
    const formattedUSD = hasContracts ? `$${usdVal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : "$0";

    // Update main overview balance (if not currently counting up)
    const balanceEl = document.getElementById("db-balance");
    if (balanceEl && !balanceEl.classList.contains("animating")) balanceEl.textContent = formattedBTC;
    const usdEl = document.getElementById("db-balance-usd");
    if (usdEl) usdEl.textContent = formattedUSD;

    // Update header telemetry bar
    const opsBtcPrice = document.getElementById("ops-btc-price");
    if (opsBtcPrice && STATE.prices.BTC) {
        opsBtcPrice.innerHTML = `$${STATE.prices.BTC.price.toLocaleString(undefined, {minimumFractionDigits: 2})} <span class="percent-change text-green">(+${STATE.prices.BTC.change}%)</span>`;
    }
    const opsPortfolioVal = document.getElementById("ops-portfolio-val");
    if (opsPortfolioVal) {
        opsPortfolioVal.textContent = `${formattedBTC} BTC`;
    }

    // Update wallet center balance
    const walletBalEl = document.getElementById("db-wallet-bal");
    if (walletBalEl) walletBalEl.textContent = formattedBTC;
    const walletBalUsdEl = document.getElementById("db-wallet-bal-usd");
    if (walletBalUsdEl) walletBalUsdEl.textContent = `${formattedUSD} USD`;

    // Update withdrawal available balance
    const withAvailEl = document.getElementById("with-avail-bal");
    if (withAvailEl) withAvailEl.textContent = `${formattedBTC} BTC`;
}

function countUpValue(el, target, decimals = 2, prefix = "", suffix = "") {
    if (!el) return;
    el.classList.add("animating");
    const duration = 1500; // ms
    const startTime = performance.now();
    const startVal = parseFloat(el.textContent.replace(/[^0-9.-]/g, "")) || 0;

    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing out quad
        const ease = progress * (2 - progress);
        const currentVal = startVal + (target - startVal) * ease;
        
        el.textContent = prefix + currentVal.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }) + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        } else {
            el.textContent = prefix + target.toLocaleString(undefined, {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            }) + suffix;
            el.classList.remove("animating");
        }
    }
    requestAnimationFrame(updateCounter);
}

let mainChart = null;
function initDashboardChart() {
    const ctx = document.getElementById("mining-chart");
    if (!ctx) return;

    const hasContracts = STATE.user.activeContracts && STATE.user.activeContracts.length > 0;
    if (!hasContracts) {
        if (mainChart) {
            mainChart.destroy();
            mainChart = null;
        }
        return;
    }

    if (mainChart) {
        mainChart.destroy();
    }

    const gradient = ctx.getContext("2d").createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, "rgba(0, 240, 255, 0.2)");
    gradient.addColorStop(1, "rgba(0, 240, 255, 0.0)");

    mainChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['09-06', '10-06', '11-06', '12-06', '13-06', '14-06', '15-06'],
            datasets: [{
                label: 'Cumulative Yield (BTC)',
                data: [0.00358, 0.00384, 0.00410, 0.00435, 0.00461, 0.00487, 0.00512],
                borderColor: '#00f0ff',
                borderWidth: 2,
                backgroundColor: gradient,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#00f0ff',
                pointBorderColor: 'rgba(255, 255, 255, 0.1)',
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(10, 12, 28, 0.95)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: 'rgba(0, 240, 255, 0.2)',
                    borderWidth: 1,
                    titleFont: { family: 'Outfit', size: 12 },
                    bodyFont: { family: 'Outfit', size: 12 },
                    padding: 10
                }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.03)' },
                    ticks: { 
                        color: 'rgba(255, 255, 255, 0.6)', 
                        font: { family: 'Outfit', size: 11 },
                        callback: function(value) { return value.toFixed(5); }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: 'rgba(255, 255, 255, 0.6)', font: { family: 'Outfit', size: 11 } }
                }
            }
        }
    });
}

function switchMainChart(type) {
    document.querySelectorAll(".chart-tab-btn").forEach(btn => {
        if (btn.getAttribute("data-chart") === type) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    const ctx = document.getElementById("mining-chart");
    if (!ctx || !mainChart) return;

    let label = "";
    let data = [];
    let borderColor = "";
    let fillGradient = ctx.getContext("2d").createLinearGradient(0, 0, 0, 280);
    let yFormat = val => val;

    if (type === 'earnings') {
        document.getElementById("main-chart-title").textContent = "BTC Earnings Analytics";
        label = "Cumulative Yield (BTC)";
        data = [0.00358, 0.00384, 0.00410, 0.00435, 0.00461, 0.00487, 0.00512];
        borderColor = '#00f0ff';
        fillGradient.addColorStop(0, "rgba(0, 240, 255, 0.2)");
        fillGradient.addColorStop(1, "rgba(0, 240, 255, 0.0)");
        yFormat = val => val.toFixed(5);
    } else if (type === 'revenue') {
        document.getElementById("main-chart-title").textContent = "Daily Revenue Analytics";
        label = "Daily Revenue (USD)";
        data = [15.82, 16.10, 15.94, 16.42, 16.55, 16.66, 16.72];
        borderColor = '#8a2be2';
        fillGradient.addColorStop(0, "rgba(138, 43, 226, 0.2)");
        fillGradient.addColorStop(1, "rgba(138, 43, 226, 0.0)");
        yFormat = val => '$' + val.toFixed(2);
    } else if (type === 'hashrate') {
        document.getElementById("main-chart-title").textContent = "Hashrate Growth Analytics";
        label = "Active Leased Hashrate (TH/s)";
        data = [50, 50, 50, 75, 75, 75, 75];
        borderColor = '#f0b90b';
        fillGradient.addColorStop(0, "rgba(240, 185, 11, 0.2)");
        fillGradient.addColorStop(1, "rgba(240, 185, 11, 0.0)");
        yFormat = val => val + ' TH/s';
    }

    mainChart.data.datasets[0].label = label;
    mainChart.data.datasets[0].data = data;
    mainChart.data.datasets[0].borderColor = borderColor;
    mainChart.data.datasets[0].backgroundColor = fillGradient;
    mainChart.data.datasets[0].pointBackgroundColor = borderColor;
    mainChart.options.scales.y.ticks.callback = function(value) { return yFormat(value); };

    mainChart.update({
        duration: 400,
        easing: 'easeOutQuad'
    });

    showToast("Chart Updated", `Operations center switched to ${label} visuals.`, "info");
}

function startLiveActivityFeed() {
    const feedContainer = document.getElementById("db-activity-feed");
    if (!feedContainer) return;

    if (window.activityFeedInterval) clearInterval(window.activityFeedInterval);
    feedContainer.innerHTML = "";

    const hasContracts = STATE.user.activeContracts && STATE.user.activeContracts.length > 0;
    if (!hasContracts) return;

    const activities = [
        { text: "SHA-256 Block reward payout credited: +0.00025720 BTC", type: "success" },
        { text: "Geothermal Node Iceland-A handshake: latency 12ms", type: "info" },
        { text: "Dynamic hashrate routing update: AntPool 30%", type: "warning" },
        { text: "Payout ledger entry confirmed (Tx ID: tx_a729...)", type: "success" },
        { text: "Node Norway-B synchronized with BTC pool candidate", type: "info" },
        { text: "Secure payout wallet address verified", type: "success" },
        { text: "SOC-2 Type II session security check passed", type: "info" },
        { text: "Alpine Cooling cluster Switzerland-C temp: 45°C - OK", type: "info" }
    ];

    for (let i = 0; i < 4; i++) {
        addFeedItem(activities[i]);
    }

    if (window.activityFeedInterval) clearInterval(window.activityFeedInterval);
    window.activityFeedInterval = setInterval(() => {
        const randomItem = activities[Math.floor(Math.random() * activities.length)];
        addFeedItem(randomItem);
    }, 4500);

    function addFeedItem(item) {
        const row = document.createElement("div");
        row.className = `feed-item feed-${item.type}`;
        
        const now = new Date();
        const timeStr = `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}:${now.getUTCSeconds().toString().padStart(2, '0')}`;
        
        row.innerHTML = `
            <span class="feed-time">${timeStr}</span>
            <span class="feed-bullet"></span>
            <span class="feed-text">${item.text}</span>
        `;
        
        feedContainer.appendChild(row);
        feedContainer.scrollTop = feedContainer.scrollHeight;
        if (feedContainer.children.length > 15) {
            feedContainer.children[0].remove();
        }
    }
}

function startNodeTelemetrySimulation() {
    if (window.nodeTelemetryInterval) clearInterval(window.nodeTelemetryInterval);

    const hasContracts = STATE.user.activeContracts && STATE.user.activeContracts.length > 0;
    if (!hasContracts) return;

    window.nodeTelemetryInterval = setInterval(() => {
        const tempIceland = document.getElementById("node-temp-iceland");
        const loadIceland = document.getElementById("node-load-iceland");
        const pingIceland = document.getElementById("node-ping-iceland");

        const tempNorway = document.getElementById("node-temp-norway");
        const loadNorway = document.getElementById("node-load-norway");
        const pingNorway = document.getElementById("node-ping-norway");

        const tempSwiss = document.getElementById("node-temp-swiss");
        const loadSwiss = document.getElementById("node-load-swiss");
        const pingSwiss = document.getElementById("node-ping-swiss");

        if (tempIceland) tempIceland.textContent = `${(40 + Math.random() * 4).toFixed(1)}°C`;
        if (loadIceland) loadIceland.textContent = `${(80 + Math.random() * 8).toFixed(0)}%`;
        if (pingIceland) pingIceland.textContent = `${(10 + Math.floor(Math.random() * 4))}ms`;

        if (tempNorway) tempNorway.textContent = `${(37 + Math.random() * 3).toFixed(1)}°C`;
        if (loadNorway) loadNorway.textContent = `${(70 + Math.random() * 6).toFixed(0)}%`;
        if (pingNorway) pingNorway.textContent = `${(14 + Math.floor(Math.random() * 5))}ms`;

        if (tempSwiss) tempSwiss.textContent = `${(43 + Math.random() * 4).toFixed(1)}°C`;
        if (loadSwiss) loadSwiss.textContent = `${(60 + Math.random() * 7).toFixed(0)}%`;
        if (pingSwiss) pingSwiss.textContent = `${(6 + Math.floor(Math.random() * 4))}ms`;
    }, 4000);
}

let txSearchQuery = "";
let txFilterType = "ALL";
let txSortField = "time";
let txSortAsc = false;
let txCurrentPage = 1;
const txPageSize = 5;

function renderTxTableUpgraded() {
    const tbody = document.getElementById("db-tx-history-preview-upgraded");
    if (!tbody) return;

    let list = [...STATE.user.transactions];

    if (txSearchQuery) {
        const query = txSearchQuery.toLowerCase();
        list = list.filter(tx => 
            tx.hash.toLowerCase().includes(query) || 
            tx.type.toLowerCase().includes(query) ||
            tx.status.toLowerCase().includes(query)
        );
    }

    if (txFilterType !== "ALL") {
        list = list.filter(tx => {
            const typeLower = tx.type.toLowerCase();
            if (txFilterType === "REWARD") return typeLower.includes("reward") || typeLower.includes("yield");
            if (txFilterType === "WITHDRAW") return typeLower.includes("withdrawal");
            if (txFilterType === "DEPOSIT") return typeLower.includes("deposit") || typeLower.includes("fund");
            return true;
        });
    }

    list.sort((a, b) => {
        let valA = a[txSortField];
        let valB = b[txSortField];

        if (txSortField === "time") {
            const parseDate = str => {
                const parts = str.split(" ");
                const dateParts = parts[0].split("-");
                const timeParts = parts[1].split(":");
                return new Date(dateParts[2], dateParts[1] - 1, dateParts[0], timeParts[0], timeParts[1]);
            };
            valA = parseDate(a.time);
            valB = parseDate(b.time);
        }

        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();

        if (valA < valB) return txSortAsc ? -1 : 1;
        if (valA > valB) return txSortAsc ? 1 : -1;
        return 0;
    });

    const totalEntries = list.length;
    const totalPages = Math.ceil(totalEntries / txPageSize) || 1;
    if (txCurrentPage > totalPages) txCurrentPage = totalPages;
    if (txCurrentPage < 1) txCurrentPage = 1;

    const startIndex = (txCurrentPage - 1) * txPageSize;
    const endIndex = Math.min(startIndex + txPageSize, totalEntries);
    const paginatedList = list.slice(startIndex, endIndex);

    let html = "";
    if (paginatedList.length === 0) {
        html = `<tr><td colspan="5" class="text-center text-muted py-4">No operations matched criteria.</td></tr>`;
    } else {
        paginatedList.forEach(tx => {
            const isNegative = tx.amount < 0;
            const amountClass = isNegative ? "text-red font-bold" : "text-green font-bold";
            const prefix = isNegative ? "" : "+";
            const statusClass = tx.status.toLowerCase() === "confirmed" ? "status-success" : "status-pending";
            
            html += `
                <tr class="sec-log-row">
                    <td><code class="text-cyan">${tx.hash}</code></td>
                    <td><span class="tx-type-label">${tx.type}</span></td>
                    <td><span class="${amountClass}">${prefix}${tx.amount.toFixed(8)} BTC</span></td>
                    <td class="text-muted">${tx.time}</td>
                    <td><span class="status-badge ${statusClass}">${tx.status}</span></td>
                </tr>
            `;
        });
    }
    tbody.innerHTML = html;

    const infoEl = document.getElementById("tx-pagination-info");
    if (infoEl) {
        if (totalEntries === 0) {
            infoEl.textContent = "Showing 0 of 0 entries";
        } else {
            infoEl.textContent = `Showing ${startIndex + 1}-${endIndex} of ${totalEntries} entries`;
        }
    }

    const btnPrev = document.getElementById("btn-tx-prev");
    const btnNext = document.getElementById("btn-tx-next");
    if (btnPrev) btnPrev.disabled = txCurrentPage === 1;
    if (btnNext) btnNext.disabled = txCurrentPage === totalPages;
}

function handleTxSearch() {
    const input = document.getElementById("tx-search-input");
    if (input) {
        txSearchQuery = input.value;
        txCurrentPage = 1;
        renderTxTableUpgraded();
    }
}

function handleTxFilter() {
    const select = document.getElementById("tx-filter-select");
    if (select) {
        txFilterType = select.value;
        txCurrentPage = 1;
        renderTxTableUpgraded();
    }
}

function handleTxSort(field) {
    if (txSortField === field) {
        txSortAsc = !txSortAsc;
    } else {
        txSortField = field;
        txSortAsc = true;
    }
    
    document.querySelectorAll("#upgraded-tx-table th").forEach(th => {
        const icon = th.querySelector("i");
        if (icon) {
            icon.className = "fa-solid fa-sort sort-icon";
        }
    });
    
    const ths = document.querySelectorAll("#upgraded-tx-table th");
    const fieldMapping = { 'hash': 0, 'type': 1, 'amount': 2, 'time': 3, 'status': 4 };
    const activeTh = ths[fieldMapping[field]];
    if (activeTh) {
        const icon = activeTh.querySelector("i");
        if (icon) {
            icon.className = txSortAsc ? "fa-solid fa-sort-up sort-icon text-cyan" : "fa-solid fa-sort-down sort-icon text-cyan";
        }
    }

    txCurrentPage = 1;
    renderTxTableUpgraded();
}

function handleTxPrevPage() {
    if (txCurrentPage > 1) {
        txCurrentPage--;
        renderTxTableUpgraded();
    }
}

function handleTxNextPage() {
    let list = [...STATE.user.transactions];
    const totalEntries = list.length;
    const totalPages = Math.ceil(totalEntries / txPageSize) || 1;
    if (txCurrentPage < totalPages) {
        txCurrentPage++;
        renderTxTableUpgraded();
    }
}

function exportTxToCSV() {
    let csv = "Transaction Hash,Operation Type,Amount (BTC),Timestamp,Status\n";
    STATE.user.transactions.forEach(tx => {
        csv += `"${tx.hash}","${tx.type}",${tx.amount},"${tx.time}","${tx.status}"\n`;
    });
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "Operations_Ledger_Export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("CSV Export Successful", "Operations ledger downloaded directly to your device.", "success");
}

function openDepositModal() {
    const el = document.getElementById("deposit-modal");
    if (el) {
        el.classList.remove("hidden");
        document.body.style.overflow = "hidden";
    }
}

function closeDepositModal() {
    const el = document.getElementById("deposit-modal");
    if (el) {
        el.classList.add("hidden");
        document.body.style.overflow = "";
    }
}

function openWithdrawModal() {
    const el = document.getElementById("withdraw-modal");
    if (el) el.classList.remove("hidden");
    updateWithdrawalBalanceDisplay();
}

function closeWithdrawModal() {
    const el = document.getElementById("withdraw-modal");
    if (el) el.classList.add("hidden");
}

function updateWithdrawalBalanceDisplay() {
    const select = document.getElementById("with-coin-select");
    const balanceVal = document.getElementById("with-avail-bal");
    if (!select || !balanceVal) return;
    
    if (select.value === "BTC") {
        balanceVal.textContent = `${STATE.user.balance.toFixed(8)} BTC`;
    }
}

function copyDepAddress() {
    const input = document.getElementById("dep-address-input");
    if (input) {
        input.select();
        input.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(input.value)
            .then(() => {
                showToast("Address Copied", "Deposit address copied to clipboard.", "success");
            })
            .catch(() => {
                showToast("Copy Failed", "Failed to copy address.", "danger");
            });
    }
}

function copyWalletAddress() {
    const input = document.getElementById("wallet-dep-addr");
    if (input) {
        input.select();
        input.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(input.value)
            .then(() => {
                showToast("Address Copied", "Wallet address copied to clipboard.", "success");
            })
            .catch(() => {
                showToast("Copy Failed", "Failed to copy address.", "danger");
            });
    }
}

function simulateSuccessfulDeposit() {
    openAuthRequiredModal();
}

function openAuthRequiredModal() {
    const el = document.getElementById("auth-required-modal");
    if (el) {
        el.classList.remove("hidden");
        document.body.style.overflow = "hidden";
    }
}

function closeAuthRequiredModal() {
    const el = document.getElementById("auth-required-modal");
    if (el) el.classList.add("hidden");
    const depModal = document.getElementById("deposit-modal");
    if (!depModal || depModal.classList.contains("hidden")) {
        document.body.style.overflow = "";
    }
}

function handleAuthRequiredLogin() {
    closeAuthRequiredModal();
    closeDepositModal();
    openAuthModal("signup");
}

const COIN_DATA = {
    BTC: {
        address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        warning: "<i class=\"fa-solid fa-triangle-exclamation\"></i> Only deposit BTC to this address. Minimum: 0.0002 BTC.",
        qrColor: "text-orange"
    },
    ETH: {
        address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        warning: "<i class=\"fa-solid fa-triangle-exclamation\"></i> Only deposit ETH to this address. Minimum: 0.005 ETH.",
        qrColor: "text-purple"
    },
    USDT: {
        address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        warning: "<i class=\"fa-solid fa-triangle-exclamation\"></i> Only deposit USDT (TRC-20/ERC-20) to this address. Minimum: 10 USDT.",
        qrColor: "text-green"
    },
    BNB: {
        address: "0xb794f5ea0ba39494ce839613fffba74279579268",
        warning: "<i class=\"fa-solid fa-triangle-exclamation\"></i> Only deposit BNB (BEP-20) to this address. Minimum: 0.05 BNB.",
        qrColor: "text-gold"
    },
    LTC: {
        address: "LNT3xJ5B9K7o2mS6tT7q8mQ9vW1x5z6",
        warning: "<i class=\"fa-solid fa-triangle-exclamation\"></i> Only deposit LTC to this address. Minimum: 0.1 LTC.",
        qrColor: "text-cyan"
    }
};

function initDepositCoinSelector() {
    const opts = document.querySelectorAll("#deposit-modal .coin-opt");
    const addrInput = document.getElementById("dep-address-input");
    const warnEl = document.getElementById("dep-coin-warn");
    const qrIcon = document.querySelector("#deposit-modal .qr-icon");

    opts.forEach(opt => {
        opt.addEventListener("click", () => {
            opts.forEach(o => o.classList.remove("active"));
            opt.classList.add("active");

            const coin = opt.getAttribute("data-coin");
            const data = COIN_DATA[coin];
            if (data) {
                if (addrInput) {
                    addrInput.placeholder = `Enter your ${coin} deposit address`;
                    addrInput.value = "";
                    const copyBtn = document.getElementById("dep-address-copy-btn");
                    if (copyBtn) copyBtn.disabled = true;
                }
                if (warnEl) warnEl.innerHTML = data.warning;
                if (qrIcon) {
                    qrIcon.className = "fa-solid fa-qrcode qr-icon";
                    qrIcon.classList.add(data.qrColor);
                }
            }
        });
    });
}

function handleWithdrawSubmit(e) {
    if (e) e.preventDefault();
    const amountInput = document.getElementById("with-amount");
    const addressInput = document.getElementById("with-address");
    if (!amountInput || !addressInput) return;

    const amount = parseFloat(amountInput.value);
    const address = addressInput.value.trim();

    if (!address || address === "" || address.toLowerCase().includes("example")) {
        showToast("Validation Error", "Please enter a valid wallet address.", "danger");
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        showToast("Invalid Amount", "Please specify a positive withdrawal volume.", "danger");
        return;
    }

    if (amount > STATE.user.balance) {
        showToast("Insufficient Balance", "Your account balance is below the requested payout amount.", "danger");
        return;
    }

    STATE.user.balance -= amount;

    const now = new Date();
    const timeStr = `${now.getUTCDate().toString().padStart(2, '0')}-${(now.getUTCMonth() + 1).toString().padStart(2, '0')}-${now.getUTCFullYear()} ${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}`;
    const txHash = "tx_" + Math.random().toString(16).substring(2, 10);

    const newTx = {
        hash: txHash.substring(0, 11),
        type: "External Withdrawal",
        asset: "BTC",
        amount: -amount,
        time: timeStr,
        status: "Confirmed"
    };

    STATE.user.transactions.unshift(newTx);

    updateBalanceUI();
    renderTxTableUpgraded();
    closeWithdrawModal();

    showToast("Payout Dispatched", `Withdrew -${amount.toFixed(8)} BTC to storage address ${address.substring(0, 6)}...`, "success");
}

function openKnowledgeDrawer(topic) {
    let title = "";
    let body = "";
    if (topic === 'bitcoin') {
        title = "SHA-256 Mining Protocol Guide";
        body = "The SHA-256 (Secure Hash Algorithm 256-bit) protocol is the work validation cycle on the Bitcoin network.";
    } else if (topic === 'cloud') {
        title = "Uptime SLA & Hardware Infrastructure";
        body = "Guaranteed 99.9% uptime SLA running liquid-submersion geothermal computing rigs.";
    } else if (topic === 'risk') {
        title = "Risk Management & Yield Valuation";
        body = "Daily payout adjustments reflecting global hashrate and network difficulty adjustments.";
    } else {
        title = "Documentation Hub";
        body = "Mining guides and FAQs.";
    }
    showToast(title, body, "info");
}

function handleSaveProfile(e) {
    if (e) e.preventDefault();
    const nameInput = document.getElementById("set-name");
    const walletInput = document.getElementById("set-wallet-btc");
    if (!nameInput) return;

    if (walletInput) {
        const address = walletInput.value.trim();
        if (!address || address === "" || address.toLowerCase().includes("example")) {
            showToast("Validation Error", "Please enter a valid wallet address.", "danger");
            return;
        }
        STATE.user.walletAddress = address;
        const walletDepAddr = document.getElementById("wallet-dep-addr");
        if (walletDepAddr) {
            walletDepAddr.value = address;
            walletDepAddr.dispatchEvent(new Event("input"));
        }
    }

    STATE.user.name = nameInput.value;

    const profileNameEl = document.getElementById("db-profile-name");
    if (profileNameEl) profileNameEl.textContent = STATE.user.name;

    showToast("Settings Saved", "Identity profile and payout options updated.", "success");
}

function renderDashboardContracts() {
    const listEl = document.getElementById("db-contracts-list");
    if (!listEl) return;

    let html = "";
    if (STATE.user.activeContracts.length === 0) {
        html = `<div class="text-center text-muted py-4 w-100">No active leases.</div>`;
    } else {
        STATE.user.activeContracts.forEach(contract => {
            const percent = Math.min((contract.elapsed / contract.duration) * 100, 100);
            html += `
                <div class="db-contract-card upgraded-contract-card">
                    <div class="card-glass-glow"></div>
                    <div class="contract-header flex-space mb-2">
                        <span class="contract-title font-bold text-cyan">${contract.plan} Plan Lease</span>
                        <span class="status-badge status-success">Active</span>
                    </div>
                    <div class="contract-metrics-mini font-mono mt-3">
                        <div class="mini-metric">
                            <span class="label">Capacity</span>
                            <span class="value text-white">${contract.hashrate} TH/s</span>
                        </div>
                        <div class="mini-metric">
                            <span class="label">Daily Earn</span>
                            <span class="value text-green">~${(contract.hashrate * 0.00000343).toFixed(8)} BTC</span>
                        </div>
                    </div>
                    <div class="contract-progress mt-3">
                        <div class="flex-space font-mono font-small text-muted mb-1">
                            <span>Time elapsed: ${contract.elapsed} / ${contract.duration} Days</span>
                            <span>${percent.toFixed(0)}%</span>
                        </div>
                        <div class="contract-progress-bar">
                            <div class="contract-progress-fill" style="width: ${percent}%;"></div>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    listEl.innerHTML = html;
}

function startTerminalLogs() {
    console.log("Telemetry logs initiated.");
}

let analyticsChart = null;

function switchDashboardTab(tabName) {
    const navItems = document.querySelectorAll(".sidebar-nav li");
    navItems.forEach(item => {
        const spanText = item.querySelector("span").textContent.toLowerCase();
        if (
            spanText.includes(tabName) ||
            (tabName === "overview" && spanText.includes("overview")) ||
            (tabName === "operations" && spanText.includes("operations")) ||
            (tabName === "analytics" && spanText.includes("analytics")) ||
            (tabName === "contracts" && spanText.includes("contract")) ||
            (tabName === "security" && spanText.includes("security")) ||
            (tabName === "wallet" && spanText.includes("wallet")) ||
            (tabName === "knowledge" && spanText.includes("knowledge")) ||
            (tabName === "settings" && spanText.includes("settings")) ||
            (tabName === "admin" && spanText.includes("invitation"))
        ) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    document.querySelectorAll(".db-panel").forEach(panel => panel.classList.add("hidden"));

    let targetPanel = `db-panel-${tabName}`;
    const panelEl = document.getElementById(targetPanel);
    if (panelEl) {
        panelEl.classList.remove("hidden");
    }

    const titleEl = document.getElementById("db-view-title");
    if (titleEl) {
        if (tabName === "overview") titleEl.textContent = "Executive Overview";
        else if (tabName === "operations") titleEl.textContent = "Operations Center";
        else if (tabName === "analytics") {
            titleEl.textContent = "Hashrate Analytics";
            setTimeout(initAnalyticsChart, 100);
        }
        else if (tabName === "contracts") titleEl.textContent = "Contract Management";
        else if (tabName === "security") titleEl.textContent = "Security Center";
        else if (tabName === "wallet") titleEl.textContent = "Wallet Center";
        else if (tabName === "knowledge") titleEl.textContent = "Knowledge Center";
        else if (tabName === "settings") titleEl.textContent = "System Settings";
        else if (tabName === "admin") {
            titleEl.textContent = "Invitation Keys Management";
            loadInvitationKeys();
            loadInvitationRequests();
        }
    }
    
    // Auto-close sidebar on mobile/tablet after clicking a tab
    const sidebar = document.getElementById("db-sidebar");
    if (sidebar) {
        sidebar.classList.remove("active");
    }
}

function initAnalyticsChart() {
    const ctx = document.getElementById("analytics-interactive-chart");
    if (!ctx) return;

    if (analyticsChart) {
        analyticsChart.destroy();
    }

    const gradient = ctx.getContext("2d").createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, "rgba(0, 240, 255, 0.3)");
    gradient.addColorStop(1, "rgba(0, 240, 255, 0.0)");

    const gradientDiff = ctx.getContext("2d").createLinearGradient(0, 0, 0, 300);
    gradientDiff.addColorStop(0, "rgba(138, 43, 226, 0.15)");
    gradientDiff.addColorStop(1, "rgba(138, 43, 226, 0.0)");

    analyticsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['09-06', '10-06', '11-06', '12-06', '13-06', '14-06', '15-06'],
            datasets: [
                {
                    label: 'Active Hashing Capacity (TH/s)',
                    data: [50, 50, 50, 75, 75, 75, 75],
                    borderColor: '#00f0ff',
                    borderWidth: 2,
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.3,
                    yAxisID: 'y'
                },
                {
                    label: 'Network Difficulty Index (EH/s)',
                    data: [580, 592, 595, 604, 612, 618, 624],
                    borderColor: '#8a2be2',
                    borderWidth: 2,
                    backgroundColor: gradientDiff,
                    fill: true,
                    tension: 0.3,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: { color: '#ffffff', font: { family: 'Outfit' } }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: { color: 'rgba(255, 255, 255, 0.03)' },
                    ticks: { color: '#ffffff', font: { family: 'Outfit' } }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { color: '#ffffff', font: { family: 'Outfit' } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#ffffff', font: { family: 'Outfit' } }
                }
            }
        }
    });
}

function updateAllocationSlider(pool) {
    const val = document.getElementById(`alloc-${pool}`).value;
    document.getElementById(`allocation-${pool}-val`).textContent = `${val}%`;
}

function savePoolAllocation(e) {
    if (e) e.preventDefault();
    showToast("Allocation Routing Applied", "Hashing resources successfully routed to targeted pool clusters.", "success");
}

function setTuningPreset(preset) {
    document.querySelectorAll(".preset-buttons-grid button").forEach(btn => {
        if (btn.textContent.toLowerCase().includes(preset)) {
            btn.classList.add("active-preset");
        } else {
            btn.classList.remove("active-preset");
        }
    });
    
    if (preset === 'balanced') {
        showToast("Balanced Preset Loaded", "Thermodynamic cooling and core voltage sets balanced.", "info");
    } else if (preset === 'overclock') {
        showToast("Geothermal Overclock Active", "MANUAL NOTICE: Voltages stepped up to 0.78V. Hashing rate overclocked (+15%).", "warning");
    } else if (preset === 'eco') {
        showToast("Eco Mode Engaged", "ASIC cores stepped down to 0.62V. Grid load optimized.", "info");
    }
}

function switchAccountNode(nodeId) {
    if (nodeId === 'node-primary') {
        document.getElementById("db-balance").textContent = "0.00512410";
        document.getElementById("db-balance-usd").textContent = "$333.07";
        document.getElementById("db-hashrate").textContent = "75.0";
        document.getElementById("db-active-contracts").textContent = "1";
        document.getElementById("db-contracts-info").textContent = "Professional Plan Running";
        showToast("Switched Node Pool", "Accessing primary node cluster Operator-A.", "info");
    } else if (nodeId === 'node-treasury') {
        document.getElementById("db-balance").textContent = "0.14285700";
        document.getElementById("db-balance-usd").textContent = "$9,285.70";
        document.getElementById("db-hashrate").textContent = "2,000.0";
        document.getElementById("db-active-contracts").textContent = "1";
        document.getElementById("db-contracts-info").textContent = "Enterprise Plan Running";
        showToast("Switched Node Pool", "Accessing Hedge Fund Treasury Node Sub-01.", "info");
    } else if (nodeId === 'node-corp') {
        document.getElementById("db-balance").textContent = "1.84920100";
        document.getElementById("db-balance-usd").textContent = "$120,198.06";
        document.getElementById("db-hashrate").textContent = "10,000.0";
        document.getElementById("db-active-contracts").textContent = "2";
        document.getElementById("db-contracts-info").textContent = "Enterprise + Ultimate Nodes Active";
        showToast("Switched Node Pool", "Accessing Institutional Corporate Node Sub-02.", "info");
    }
    renderDashboardTransactions();
}

function filterAnalytics(range) {
    document.querySelectorAll(".analytics-filters button").forEach(btn => {
        if (btn.id === `analytics-filter-${range}`) {
            btn.classList.add("active-filter-btn");
        } else {
            btn.classList.remove("active-filter-btn");
        }
    });
    
    if (analyticsChart) {
        if (range === '7d') {
            analyticsChart.data.labels = ['09-06', '10-06', '11-06', '12-06', '13-06', '14-06', '15-06'];
            analyticsChart.data.datasets[0].data = [50, 50, 50, 75, 75, 75, 75];
            analyticsChart.data.datasets[1].data = [580, 592, 595, 604, 612, 618, 624];
        } else if (range === '30d') {
            analyticsChart.data.labels = ['W1', 'W2', 'W3', 'W4'];
            analyticsChart.data.datasets[0].data = [50, 50, 75, 75];
            analyticsChart.data.datasets[1].data = [570, 585, 601, 624];
        } else if (range === '90d') {
            analyticsChart.data.labels = ['Month 1', 'Month 2', 'Month 3'];
            analyticsChart.data.datasets[0].data = [10, 50, 75];
            analyticsChart.data.datasets[1].data = [520, 560, 624];
        }
        analyticsChart.update();
        showToast("Analytics Refreshed", `Yield overlays updated for ${range} range.`, "info");
    }
}

function exportOperationsData() {
    showToast("CSV Export Triggered", "Operations log metrics exported to Operations_Log_Report.csv", "success");
}
function exportAnalyticsReport() {
    showToast("Report Generated", "Analytics performance summary exported to Hashrate_Performance_Report.pdf", "success");
}
function exportSecurityAuditTrail() {
    showToast("Audit Trail Exported", "FIDO2 security log event traces downloaded to Security_Audit_Trail.csv", "success");
}

function searchKnowledgeHub(query) {
    const cards = document.querySelectorAll("#knowledge-hub-cards-grid .knowledge-hub-card");
    cards.forEach(card => {
        const text = card.querySelector("h4").textContent.toLowerCase() + card.querySelector("p").textContent.toLowerCase();
        if (text.includes(query.toLowerCase())) {
            card.classList.remove("hidden");
        } else {
            card.classList.add("hidden");
        }
    });
}

// --- INSTITUTIONAL-GRADE HELPER FUNCTIONS ---
function initAnalyticsChart() {
    const ctx = document.getElementById("analytics-interactive-chart");
    if (!ctx) return;

    if (analyticsChart) {
        analyticsChart.destroy();
    }

    const gradient = ctx.getContext("2d").createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, "rgba(0, 240, 255, 0.3)");
    gradient.addColorStop(1, "rgba(0, 240, 255, 0.0)");

    const gradientDiff = ctx.getContext("2d").createLinearGradient(0, 0, 0, 300);
    gradientDiff.addColorStop(0, "rgba(138, 43, 226, 0.15)");
    gradientDiff.addColorStop(1, "rgba(138, 43, 226, 0.0)");

    analyticsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['09-06', '10-06', '11-06', '12-06', '13-06', '14-06', '15-06'],
            datasets: [
                {
                    label: 'Active Hashing Capacity (TH/s)',
                    data: [50, 50, 50, 75, 75, 75, 75],
                    borderColor: '#00f0ff',
                    borderWidth: 2,
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.3,
                    yAxisID: 'y'
                },
                {
                    label: 'Network Difficulty Index (EH/s)',
                    data: [580, 592, 595, 604, 612, 618, 624],
                    borderColor: '#8a2be2',
                    borderWidth: 2,
                    backgroundColor: gradientDiff,
                    fill: true,
                    tension: 0.3,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: { color: '#ffffff', font: { family: 'Outfit' } }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: { color: 'rgba(255, 255, 255, 0.03)' },
                    ticks: { color: '#ffffff', font: { family: 'Outfit' } }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { color: '#ffffff', font: { family: 'Outfit' } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#ffffff', font: { family: 'Outfit' } }
                }
            }
        }
    });
}

function updateAllocationSlider(pool) {
    const val = document.getElementById(`alloc-${pool}`).value;
    document.getElementById(`allocation-${pool}-val`).textContent = `${val}%`;
}

function savePoolAllocation(e) {
    if (e) e.preventDefault();
    showToast("Allocation Routing Applied", "Hashing resources successfully routed to targeted pool clusters.", "success");
}

function setTuningPreset(preset) {
    document.querySelectorAll(".preset-buttons-grid button").forEach(btn => {
        if (btn.textContent.toLowerCase().includes(preset)) {
            btn.classList.add("active-preset");
        } else {
            btn.classList.remove("active-preset");
        }
    });
    
    if (preset === 'balanced') {
        showToast("Balanced Preset Loaded", "Thermodynamic cooling and core voltage sets balanced.", "info");
    } else if (preset === 'overclock') {
        showToast("Geothermal Overclock Active", "MANUAL NOTICE: Voltages stepped up to 0.78V. Hashing rate overclocked (+15%).", "warning");
    } else if (preset === 'eco') {
        showToast("Eco Mode Engaged", "ASIC cores stepped down to 0.62V. Grid load optimized.", "info");
    }
}

function switchAccountNode(nodeId) {
    if (nodeId === 'node-primary') {
        document.getElementById("db-balance").textContent = "0.00512410";
        document.getElementById("db-balance-usd").textContent = "$333.07";
        document.getElementById("db-hashrate").textContent = "75.0";
        document.getElementById("db-active-contracts").textContent = "1";
        document.getElementById("db-contracts-info").textContent = "Professional Plan Running";
        showToast("Switched Node Pool", "Accessing primary node cluster Operator-A.", "info");
    } else if (nodeId === 'node-treasury') {
        document.getElementById("db-balance").textContent = "0.14285700";
        document.getElementById("db-balance-usd").textContent = "$9,285.70";
        document.getElementById("db-hashrate").textContent = "2,000.0";
        document.getElementById("db-active-contracts").textContent = "1";
        document.getElementById("db-contracts-info").textContent = "Enterprise Plan Running";
        showToast("Switched Node Pool", "Accessing Hedge Fund Treasury Node Sub-01.", "info");
    } else if (nodeId === 'node-corp') {
        document.getElementById("db-balance").textContent = "1.84920100";
        document.getElementById("db-balance-usd").textContent = "$120,198.06";
        document.getElementById("db-hashrate").textContent = "10,000.0";
        document.getElementById("db-active-contracts").textContent = "2";
        document.getElementById("db-contracts-info").textContent = "Enterprise + Ultimate Nodes Active";
        showToast("Switched Node Pool", "Accessing Institutional Corporate Node Sub-02.", "info");
    }
    renderDashboardTransactions();
}

function filterAnalytics(range) {
    document.querySelectorAll(".analytics-filters button").forEach(btn => {
        if (btn.id === `analytics-filter-${range}`) {
            btn.classList.add("active-filter-btn");
        } else {
            btn.classList.remove("active-filter-btn");
        }
    });
    
    if (analyticsChart) {
        if (range === '7d') {
            analyticsChart.data.labels = ['09-06', '10-06', '11-06', '12-06', '13-06', '14-06', '15-06'];
            analyticsChart.data.datasets[0].data = [50, 50, 50, 75, 75, 75, 75];
            analyticsChart.data.datasets[1].data = [580, 592, 595, 604, 612, 618, 624];
        } else if (range === '30d') {
            analyticsChart.data.labels = ['W1', 'W2', 'W3', 'W4'];
            analyticsChart.data.datasets[0].data = [50, 50, 75, 75];
            analyticsChart.data.datasets[1].data = [570, 585, 601, 624];
        } else if (range === '90d') {
            analyticsChart.data.labels = ['Month 1', 'Month 2', 'Month 3'];
            analyticsChart.data.datasets[0].data = [10, 50, 75];
            analyticsChart.data.datasets[1].data = [520, 560, 624];
        }
        analyticsChart.update();
        showToast("Analytics Refreshed", `Yield overlays updated for ${range} range.`, "info");
    }
}

function exportOperationsData() {
    showToast("CSV Export Triggered", "Operations log metrics exported to Operations_Log_Report.csv", "success");
}
function exportAnalyticsReport() {
    showToast("Report Generated", "Analytics performance summary exported to Hashrate_Performance_Report.pdf", "success");
}
function exportSecurityAuditTrail() {
    showToast("Audit Trail Exported", "FIDO2 security log event traces downloaded to Security_Audit_Trail.csv", "success");
}

function searchKnowledgeHub(query) {
    const cards = document.querySelectorAll("#knowledge-hub-cards-grid .knowledge-hub-card");
    cards.forEach(card => {
        const text = card.querySelector("h4").textContent.toLowerCase() + card.querySelector("p").textContent.toLowerCase();
        if (text.includes(query.toLowerCase())) {
            card.classList.remove("hidden");
        } else {
            card.classList.add("hidden");
        }
    });
}

// --- BLOCKCHAIN MINING EXPLAINER INTERACTION ---
document.addEventListener("DOMContentLoaded", () => {
    initMiningExplainer();
});

function initMiningExplainer() {
    let powSimulator3DInstance = null;

    // Pure JS SHA-256 Implementation
    function sha256(ascii) {
        function rightRotate(value, amount) {
            return (value >>> amount) | (value << (32 - amount));
        }
        
        var mathPow = Math.pow;
        var maxWord = mathPow(2, 32);
        var lengthProperty = 'length';
        var i, j;

        var result = '';
        var words = [];
        var asciiLength = ascii[lengthProperty];
        
        var hash = sha256.h = sha256.h || [];
        var k = sha256.k = sha256.k || [];
        var primeCounter = k[lengthProperty];

        var isComposite = {};
        for (var candidate = 2; primeCounter < 64; candidate++) {
            if (!isComposite[candidate]) {
                for (i = 0; i < 313; i += candidate) {
                    isComposite[i] = 1;
                }
                hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
                k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
            }
        }
        
        ascii += '\x80';
        while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
        for (i = 0; i < ascii[lengthProperty]; i++) {
            j = ascii.charCodeAt(i);
            if (j >> 8) return; // ASCII only
            words[i >> 2] |= j << (24 - (i % 4) * 8);
        }
        words[words[lengthProperty]] = ((asciiLength / maxWord) | 0);
        words[words[lengthProperty]] = (asciiLength * 8);
        
        for (j = 0; j < words[lengthProperty]; j += 16) {
            var w = words.slice(j, j + 16);
            var oldHash = hash.slice(0);
            
            hash = hash.slice(0);
            for (i = 0; i < 64; i++) {
                var w16 = w[i - 16];
                var w15 = w[i - 15];
                var w7 = w[i - 7];
                var w2 = w[i - 2];
                
                var s0 = i < 16 ? w[i] : (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3));
                var s1 = i < 16 ? w[i] : (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10));
                var wa = i < 16 ? 0 : w16 + s0 + w7 + s1;
                w[i] = wa = (wa | 0);
                
                var a = hash[0], e = hash[4];
                var temp1 = hash[7] + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + ((e & hash[5]) ^ (~e & hash[6])) + k[i] + wa;
                var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
                
                hash = [(temp1 + temp2) | 0].concat(hash);
                hash[4] = (hash[4] + temp1) | 0;
            }
            
            for (i = 0; i < 8; i++) {
                hash[i] = (hash[i] + oldHash[i]) | 0;
            }
        }
        
        for (i = 0; i < 8; i++) {
            var val = hash[i];
            if (val < 0) val += maxWord;
            var str = val.toString(16);
            while (str[lengthProperty] < 8) str = '0' + str;
            result += str;
        }
        return result;
    }

    // Tab switching for Explainer
    const explainerTabs = document.querySelectorAll(".explainer-tab-btn");
    const explainerContents = document.querySelectorAll(".explainer-tab-content");
    
    explainerTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            explainerTabs.forEach(t => t.classList.remove("active"));
            explainerContents.forEach(c => c.classList.remove("active"));
            
            tab.classList.add("active");
            const targetContent = document.getElementById(tab.getAttribute("data-tab"));
            if (targetContent) {
                targetContent.classList.add("active");
                // Trigger canvas resize when tab becomes active
                setTimeout(() => {
                    const canvas = targetContent.querySelector("canvas");
                    if (canvas && activeVisualizers[canvas.id]) {
                        activeVisualizers[canvas.id].resize();
                    }
                }, 50);
            }
        });
    });

    // PoW Simulator DOM elements
    const simBlockData = document.getElementById("sim-block-data");
    const simPrevHash = document.getElementById("sim-prev-hash");
    const simNonce = document.getElementById("sim-nonce");
    const simHashOutput = document.getElementById("sim-hash-output");
    const simStatus = document.getElementById("sim-status");
    const btnIncrement = document.getElementById("sim-btn-increment");
    const btnMine = document.getElementById("sim-btn-mine");

    function calculateSimHash() {
        if (!simBlockData || !simPrevHash || !simNonce || !simHashOutput) return;
        const inputData = simBlockData.value + simPrevHash.value + simNonce.value;
        const hash = sha256(sha256(inputData));
        simHashOutput.textContent = hash;
        
        // Check if hash matches difficulty (starts with "000")
        if (hash.startsWith("000")) {
            simHashOutput.className = "hash-val font-green";
            simStatus.className = "sim-status font-green";
            simStatus.innerHTML = `<i class="fa-solid fa-circle-check"></i> Success! Found a valid hash (Difficulty met).`;
        } else {
            simHashOutput.className = "hash-val font-red";
            simStatus.className = "sim-status text-muted";
            simStatus.textContent = "Hash does not meet difficulty target (needs leading zeros).";
        }
    }

    // Custom Controls Helper for Drag and Scroll Zoom
    function attachCustomControls(canvas, camera, targetRotation, options = {}) {
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });
        
        window.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const deltaMove = {
                x: e.clientX - previousMousePosition.x,
                y: e.clientY - previousMousePosition.y
            };
            
            targetRotation.y += deltaMove.x * 0.008;
            targetRotation.x += deltaMove.y * 0.008;
            
            // Limit vertical rotation to prevent flipping
            targetRotation.x = Math.max(-Math.PI/2.2, Math.min(Math.PI/2.2, targetRotation.x));
            
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });
        
        canvas.addEventListener('wheel', (e) => {
            if (options.noZoom) return;
            e.preventDefault();
            camera.position.z += e.deltaY * 0.008;
            camera.position.z = Math.max(options.minZoom || 4, Math.min(options.maxZoom || 30, camera.position.z));
        }, { passive: false });
    }

    // Shared Observation system for lazy rendering
    const activeVisualizers = {};
    const visibleCanvases = new Set();
    
    const canvasObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const canvasId = entry.target.id;
            if (entry.isIntersecting) {
                if (!visibleCanvases.has(canvasId)) {
                    visibleCanvases.add(canvasId);
                    if (activeVisualizers[canvasId]) {
                        activeVisualizers[canvasId].animate();
                    }
                }
            } else {
                visibleCanvases.delete(canvasId);
            }
        });
    }, { threshold: 0.1 });

    // Handle Window Resizing for all 3D Canvases
    window.addEventListener("resize", () => {
        for (let key in activeVisualizers) {
            activeVisualizers[key].resize();
        }
    });

    // 1. 3D Blockchain Network & Block Explorer
    function initBlockchainNetwork3D() {
        const canvas = document.getElementById("canvas-blockchain-network");
        if (!canvas) return null;
        
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
        camera.position.set(0, 0, 9);
        
        const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        scene.add(new THREE.AmbientLight(0xffffff, 0.4));
        const dirLight = new THREE.DirectionalLight(0x00f0ff, 0.8);
        dirLight.position.set(5, 5, 5);
        scene.add(dirLight);
        
        const pointLight = new THREE.PointLight(0x8a2be2, 1, 15);
        pointLight.position.set(-5, -3, 3);
        scene.add(pointLight);

        const group = new THREE.Group();
        scene.add(group);

        const blockDetails = [
            { height: "#847291", txs: "2,410", time: "2026-06-15 10:45", diff: "84.72 T", prev: "000000000019d6689c..." },
            { height: "#847292", txs: "1,984", time: "2026-06-15 10:55", diff: "84.72 T", prev: "00000000000a34b22c..." },
            { height: "#847293", txs: "3,112", time: "2026-06-15 11:05", diff: "84.72 T", prev: "00000000000021b34e..." },
            { height: "#847294", txs: "2,654", time: "2026-06-15 11:15", diff: "84.72 T", prev: "0000000000000024a1..." }
        ];

        const blocks = [];
        const blockSpacing = 2.3;
        const blockGeo = new THREE.BoxGeometry(1.3, 0.9, 0.9);
        
        blockDetails.forEach((details, i) => {
            const blockGroup = new THREE.Group();
            blockGroup.position.set((i - 1.5) * blockSpacing, Math.sin(i * 1.5) * 0.3, 0);
            
            const mat = new THREE.MeshBasicMaterial({
                color: 0x00f0ff,
                transparent: true,
                opacity: 0.12,
                side: THREE.DoubleSide
            });
            const mesh = new THREE.Mesh(blockGeo, mat);
            blockGroup.add(mesh);
            
            const edges = new THREE.EdgesGeometry(blockGeo);
            const lineMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, linewidth: 2 });
            const line = new THREE.LineSegments(edges, lineMat);
            blockGroup.add(line);
            
            blockGroup.userData = { index: i, details: details, baseColor: 0x00f0ff, mesh: mesh, line: line };
            group.add(blockGroup);
            blocks.push(blockGroup);
        });

        // Connection lines between blocks
        const linkMat = new THREE.LineBasicMaterial({ color: 0x8a2be2, transparent: true, opacity: 0.6 });
        for (let i = 0; i < blocks.length - 1; i++) {
            const points = [blocks[i].position, blocks[i + 1].position];
            const linkGeo = new THREE.BufferGeometry().setFromPoints(points);
            const linkLine = new THREE.Line(linkGeo, linkMat);
            group.add(linkLine);
        }

        // Float network nodes around the chain
        const nodeGeo = new THREE.SphereGeometry(0.06, 8, 8);
        const nodeMat = new THREE.MeshBasicMaterial({ color: 0x00e676 });
        for (let i = 0; i < 15; i++) {
            const node = new THREE.Mesh(nodeGeo, nodeMat);
            const parentBlockIndex = Math.floor(Math.random() * blocks.length);
            const parentBlock = blocks[parentBlockIndex];
            const angle = Math.random() * Math.PI * 2;
            const distance = 0.7 + Math.random() * 0.5;
            node.position.set(
                parentBlock.position.x + Math.cos(angle) * distance,
                parentBlock.position.y + Math.sin(angle) * distance,
                parentBlock.position.z + (Math.random() - 0.5) * 0.6
            );
            group.add(node);
            
            const points = [parentBlock.position, node.position];
            const connGeo = new THREE.BufferGeometry().setFromPoints(points);
            const connLine = new THREE.Line(connGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 }));
            group.add(connLine);
        }

        // Flowing transaction packets
        const packets = [];
        const packetGeo = new THREE.SphereGeometry(0.035, 6, 6);
        const packetMat = new THREE.MeshBasicMaterial({ color: 0xffbd3d });
        
        for (let i = 0; i < 6; i++) {
            const p = new THREE.Mesh(packetGeo, packetMat);
            group.add(p);
            packets.push({
                mesh: p,
                fromBlock: Math.floor(Math.random() * (blocks.length - 1)),
                progress: Math.random(),
                speed: 0.004 + Math.random() * 0.005
            });
        }

        const targetRotation = { x: 0, y: 0 };
        attachCustomControls(canvas, camera, targetRotation);

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        let hoveredBlock = null;

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / canvas.clientHeight) * 2 + 1;
        });

        canvas.addEventListener('click', () => {
            if (hoveredBlock) {
                const details = hoveredBlock.userData.details;
                document.getElementById('holo-height').textContent = details.height;
                document.getElementById('holo-txs').textContent = details.txs;
                document.getElementById('holo-time').textContent = details.time;
                document.getElementById('holo-diff').textContent = details.diff;
                document.getElementById('holo-prev').textContent = details.prev;
                gsap.fromTo(hoveredBlock.scale, { x: 1.25, y: 1.25, z: 1.25 }, { x: 1.05, y: 1.05, z: 1.05, duration: 0.25 });
            }
        });

        function resize() {
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        }

        function animate() {
            if (!visibleCanvases.has("canvas-blockchain-network")) return;
            requestAnimationFrame(animate);

            group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetRotation.y, 0.05);
            group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetRotation.x, 0.05);

            blocks.forEach((b, idx) => {
                if (b !== hoveredBlock) {
                    b.position.y = Math.sin(Date.now() * 0.001 + idx) * 0.2 + Math.sin(idx * 1.5) * 0.3;
                }
            });

            packets.forEach(p => {
                p.progress += p.speed;
                if (p.progress >= 1.0) {
                    p.progress = 0;
                    p.fromBlock = Math.floor(Math.random() * (blocks.length - 1));
                }
                const start = blocks[p.fromBlock].position;
                const end = blocks[p.fromBlock + 1].position;
                p.mesh.position.lerpVectors(start, end, p.progress);
            });

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(blocks.map(b => b.children[0]));

            if (intersects.length > 0) {
                const hit = intersects[0].object.parent;
                if (hoveredBlock !== hit) {
                    if (hoveredBlock) {
                        hoveredBlock.scale.set(1, 1, 1);
                        hoveredBlock.userData.line.material.color.setHex(hoveredBlock.userData.baseColor);
                    }
                    hoveredBlock = hit;
                    hoveredBlock.scale.set(1.05, 1.05, 1.05);
                    hoveredBlock.userData.line.material.color.setHex(0xffbd3d);
                }
            } else {
                if (hoveredBlock) {
                    hoveredBlock.scale.set(1, 1, 1);
                    hoveredBlock.userData.line.material.color.setHex(hoveredBlock.userData.baseColor);
                    hoveredBlock = null;
                }
            }

            renderer.render(scene, camera);
        }

        return { resize, animate, canvasId: "canvas-blockchain-network" };
    }

    // 2. 3D Transaction Flow
    function initTxFlow3D() {
        const canvas = document.getElementById("canvas-tx-flow");
        if (!canvas) return null;
        
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
        camera.position.set(0, 0, 8);
        
        const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const group = new THREE.Group();
        scene.add(group);

        scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        const light = new THREE.DirectionalLight(0x00f0ff, 0.8);
        light.position.set(5, 5, 5);
        scene.add(light);

        // Nodes configuration
        const walletPos = new THREE.Vector3(-4.0, 0, 0);
        const validatorPositions = [
            new THREE.Vector3(-1.0, 1.2, 0),
            new THREE.Vector3(-1.0, 0, 0),
            new THREE.Vector3(-1.0, -1.2, 0)
        ];
        const blockPos = new THREE.Vector3(4.5, 0, 0);

        // Wallet Mesh (Gold Sphere)
        const walletGeo = new THREE.SphereGeometry(0.35, 16, 16);
        const walletMat = new THREE.MeshBasicMaterial({ color: 0xffbd3d, transparent: true, opacity: 0.8 });
        const walletMesh = new THREE.Mesh(walletGeo, walletMat);
        walletMesh.position.copy(walletPos);
        group.add(walletMesh);

        // Ring around wallet
        const ringGeo = new THREE.RingGeometry(0.45, 0.48, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xffbd3d, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
        const walletRing = new THREE.Mesh(ringGeo, ringMat);
        walletRing.position.copy(walletPos);
        group.add(walletRing);

        // Verification Nodes (Purple)
        const valGeo = new THREE.SphereGeometry(0.25, 12, 12);
        const valMat = new THREE.MeshBasicMaterial({ color: 0x8a2be2, transparent: true, opacity: 0.7 });
        const validators = [];
        validatorPositions.forEach(pos => {
            const v = new THREE.Mesh(valGeo, valMat);
            v.position.copy(pos);
            group.add(v);
            validators.push(v);
        });

        // Block Candidate (Cyan Box Container)
        const boxGeo = new THREE.BoxGeometry(1.4, 1.4, 1.4);
        const boxMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.1, side: THREE.DoubleSide });
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.position.copy(blockPos);
        group.add(box);

        const boxEdges = new THREE.EdgesGeometry(boxGeo);
        const boxLine = new THREE.LineSegments(boxEdges, new THREE.LineBasicMaterial({ color: 0x00f0ff, linewidth: 1 }));
        boxLine.position.copy(blockPos);
        group.add(boxLine);

        // Connection Lines
        const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 });
        // Wallet to Validators
        validators.forEach(v => {
            const points = [walletPos, v.position];
            const geo = new THREE.BufferGeometry().setFromPoints(points);
            group.add(new THREE.Line(geo, lineMat));
        });
        
        // Mempool bounding box representation
        const mempoolCenter = new THREE.Vector3(1.8, 0, 0);

        // Connect Validators to Mempool area
        validators.forEach(v => {
            const points = [v.position, mempoolCenter];
            const geo = new THREE.BufferGeometry().setFromPoints(points);
            group.add(new THREE.Line(geo, lineMat));
        });

        // Connect Mempool to Block candidate
        const points = [mempoolCenter, blockPos];
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        group.add(new THREE.Line(geo, lineMat));

        // Mempool Nodes (Cyan spheres)
        const memNodeGeo = new THREE.SphereGeometry(0.07, 8, 8);
        const memNodeMat = new THREE.MeshBasicMaterial({ color: 0x00e676, transparent: true, opacity: 0.6 });
        const mempoolNodes = [];
        for (let i = 0; i < 18; i++) {
            const node = new THREE.Mesh(memNodeGeo, memNodeMat);
            node.position.set(
                mempoolCenter.x + (Math.random() - 0.5) * 1.5,
                mempoolCenter.y + (Math.random() - 0.5) * 1.5,
                mempoolCenter.z + (Math.random() - 0.5) * 1.0
            );
            group.add(node);
            mempoolNodes.push(node);
        }

        // Packets (10 floating transaction nodes)
        const packets = [];
        const packetGeo = new THREE.SphereGeometry(0.045, 8, 8);
        const packetMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        
        for (let i = 0; i < 8; i++) {
            const p = new THREE.Mesh(packetGeo, packetMat);
            group.add(p);
            
            const valIdx = Math.floor(Math.random() * 3);
            const targetMempoolPos = mempoolNodes[Math.floor(Math.random() * mempoolNodes.length)].position;
            
            packets.push({
                mesh: p,
                state: 0, // 0: wallet -> validator, 1: validator -> mempool, 2: mempool wait, 3: mempool -> block
                progress: Math.random(),
                speed: 0.008 + Math.random() * 0.008,
                valIdx: valIdx,
                targetMempoolPos: targetMempoolPos,
                waitTimer: 0,
                maxWait: 50 + Math.random() * 80
            });
        }

        const targetRotation = { x: 0, y: 0 };
        attachCustomControls(canvas, camera, targetRotation);

        function resize() {
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        }

        let totalTxs = 14281;
        let p2pTimer = 0;

        function animate() {
            if (!visibleCanvases.has("canvas-tx-flow")) return;
            requestAnimationFrame(animate);

            group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetRotation.y, 0.05);
            group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetRotation.x, 0.05);

            walletRing.rotation.z += 0.01;
            box.rotation.y += 0.005;
            boxLine.rotation.y += 0.005;

            // Animate mempool nodes wobble
            mempoolNodes.forEach((node, idx) => {
                node.position.y += Math.sin(Date.now() * 0.002 + idx) * 0.0015;
                node.position.x += Math.cos(Date.now() * 0.002 + idx) * 0.0015;
            });

            // Animate transaction packets
            packets.forEach(p => {
                if (p.state === 0) {
                    // Wallet -> Validator
                    p.progress += p.speed;
                    p.mesh.position.lerpVectors(walletPos, validatorPositions[p.valIdx], p.progress);
                    
                    if (p.progress >= 1.0) {
                        p.state = 1;
                        p.progress = 0;
                        validators[p.valIdx].scale.set(1.3, 1.3, 1.3);
                        gsap.to(validators[p.valIdx].scale, { x: 1, y: 1, z: 1, duration: 0.2 });
                    }
                } else if (p.state === 1) {
                    // Validator -> Mempool
                    p.progress += p.speed;
                    p.mesh.position.lerpVectors(validatorPositions[p.valIdx], p.targetMempoolPos, p.progress);
                    
                    if (p.progress >= 1.0) {
                        p.state = 2;
                        p.progress = 0;
                        p.waitTimer = 0;
                    }
                } else if (p.state === 2) {
                    // Wait in mempool (wobble)
                    p.mesh.position.copy(p.targetMempoolPos);
                    p.mesh.position.y += Math.sin(Date.now() * 0.002) * 0.02;
                    p.waitTimer++;
                    
                    if (p.waitTimer >= p.maxWait) {
                        p.state = 3;
                    }
                } else if (p.state === 3) {
                    // Mempool -> Block Candidate
                    p.progress += p.speed * 1.5;
                    p.mesh.position.lerpVectors(p.targetMempoolPos, blockPos, p.progress);
                    
                    if (p.progress >= 1.0) {
                        // Reset
                        p.state = 0;
                        p.progress = 0;
                        p.valIdx = Math.floor(Math.random() * 3);
                        p.targetMempoolPos = mempoolNodes[Math.floor(Math.random() * mempoolNodes.length)].position;
                        p.mesh.position.copy(walletPos);
                        
                        box.scale.set(1.1, 1.1, 1.1);
                        gsap.to(box.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
                    }
                }
            });

            // Simulate changing statistics in hologram panel
            p2pTimer++;
            if (p2pTimer > 120) {
                p2pTimer = 0;
                totalTxs += Math.floor(Math.random() * 5) - 2;
                const mSize = document.getElementById("mempool-size");
                if (mSize) mSize.textContent = totalTxs.toLocaleString();
            }

            renderer.render(scene, camera);
        }

        return { resize, animate, canvasId: "canvas-tx-flow" };
    }

    // 3. 3D Bitcoin Mining Process Cinematic Sequence
    function initMiningProcess3D() {
        const canvas = document.getElementById("canvas-mining-process");
        if (!canvas) return null;
        
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
        camera.position.set(0, 0, 8);
        
        const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const group = new THREE.Group();
        scene.add(group);

        scene.add(new THREE.AmbientLight(0xffffff, 0.4));
        const dirLight = new THREE.DirectionalLight(0x00f0ff, 0.8);
        dirLight.position.set(5, 5, 5);
        scene.add(dirLight);

        // Central Candidate Block (Glass outer box)
        const blockGeo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
        const blockMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
        const blockMesh = new THREE.Mesh(blockGeo, blockMat);
        group.add(blockMesh);

        const blockEdges = new THREE.EdgesGeometry(blockGeo);
        const blockLineMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, linewidth: 2 });
        const blockLine = new THREE.LineSegments(blockEdges, blockLineMat);
        group.add(blockLine);

        // Ring rotating around block
        const ringGeo = new THREE.TorusGeometry(1.5, 0.04, 8, 48);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x8a2be2, transparent: true, opacity: 0.6 });
        const hashingRing = new THREE.Mesh(ringGeo, ringMat);
        hashingRing.rotation.x = Math.PI / 2;
        group.add(hashingRing);

        // Previous chained blocks on left
        const miniChainGroup = new THREE.Group();
        miniChainGroup.position.set(-4.0, -0.6, -1.0);
        group.add(miniChainGroup);

        const miniBlockGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const chainBlocks = [];
        for (let i = 0; i < 2; i++) {
            const cb = new THREE.Mesh(miniBlockGeo, new THREE.MeshBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.4 }));
            cb.position.set(i * 1.2, 0, 0);
            miniChainGroup.add(cb);
            
            const cbe = new THREE.LineSegments(new THREE.EdgesGeometry(miniBlockGeo), new THREE.LineBasicMaterial({ color: 0x777777 }));
            cbe.position.copy(cb.position);
            miniChainGroup.add(cbe);
            chainBlocks.push(cb);
        }
        
        // Chain link connection line
        const chainPoints = [new THREE.Vector3(0,0,0), new THREE.Vector3(1.2, 0,0)];
        const chainLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(chainPoints), new THREE.LineBasicMaterial({ color: 0x444444 }));
        miniChainGroup.add(chainLine);

        // Floating transactions (30 small spheres in space)
        const txParticles = [];
        const txGeo = new THREE.SphereGeometry(0.05, 8, 8);
        const txMat = new THREE.MeshBasicMaterial({ color: 0xffbd3d, transparent: true, opacity: 0.8 });
        
        for (let i = 0; i < 28; i++) {
            const p = new THREE.Mesh(txGeo, txMat);
            const u = Math.random();
            const v = Math.random();
            const theta = u * 2.0 * Math.PI;
            const phi = Math.acos(2.0 * v - 1.0);
            const r = 2.0 + Math.random() * 1.5;
            p.position.set(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            );
            group.add(p);
            
            txParticles.push({
                mesh: p,
                basePos: p.position.clone(),
                orbitSpeed: 0.01 + Math.random()*0.02,
                orbitAxis: new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize(),
                orbitRadius: r
            });
        }

        // Validation shockwave particles (green)
        const validationParticles = [];
        const greenGeo = new THREE.SphereGeometry(0.04, 6, 6);
        const greenMat = new THREE.MeshBasicMaterial({ color: 0x00e676 });
        for (let i = 0; i < 35; i++) {
            const gp = new THREE.Mesh(greenGeo, greenMat);
            gp.visible = false;
            group.add(gp);
            validationParticles.push({
                mesh: gp,
                dir: new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize(),
                speed: 0.05 + Math.random()*0.08
            });
        }

        const targetRotation = { x: 0, y: 0 };
        attachCustomControls(canvas, camera, targetRotation);

        function resize() {
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        }

        let lastPhase = -1;
        const phaseDuration = 2800;

        const phaseNames = ["Transactions", "Block Assembly", "Hash Calculation", "Nonce Search", "Block Validation", "Blockchain Update"];
        const phaseActions = [
            "Gathering pending transactions...",
            "Compiling candidate block...",
            "Computing double SHA-256...",
            "Searching for valid nonce...",
            "Valid block verified by nodes!",
            "Appending block to public ledger..."
        ];
        const phaseHashes = ["0 H/s", "0 H/s", "420 MH/s", "980 MH/s", "0 H/s", "0 H/s"];

        function animate() {
            if (!visibleCanvases.has("canvas-mining-process")) return;
            requestAnimationFrame(animate);

            group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetRotation.y, 0.05);
            group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetRotation.x, 0.05);

            const time = Date.now();
            const currentPhase = Math.floor(time / phaseDuration) % 6;
            const phaseProgress = (time % phaseDuration) / phaseDuration;

            if (currentPhase !== lastPhase) {
                lastPhase = currentPhase;
                const statusEl = document.getElementById("mining-phase-status");
                const actionEl = document.getElementById("mining-phase-action");
                const hashEl = document.getElementById("mining-phase-hash");
                
                if (statusEl) statusEl.textContent = phaseNames[currentPhase];
                if (actionEl) actionEl.textContent = phaseActions[currentPhase];
                if (hashEl) hashEl.textContent = phaseHashes[currentPhase];
            }

            if (currentPhase === 0) {
                blockMesh.visible = false;
                blockLine.visible = false;
                hashingRing.visible = false;
                
                txParticles.forEach(p => {
                    p.mesh.visible = true;
                    p.mesh.position.copy(p.basePos);
                    p.mesh.position.applyAxisAngle(p.orbitAxis, p.orbitSpeed);
                    p.basePos.copy(p.mesh.position);
                });
                
                validationParticles.forEach(p => p.mesh.visible = false);
                blockMesh.position.set(0, 0, 0);
                blockLine.position.set(0, 0, 0);
            } 
            else if (currentPhase === 1) {
                blockMesh.visible = true;
                blockLine.visible = true;
                hashingRing.visible = false;
                
                const scale = Math.min(1.0, phaseProgress * 1.5);
                blockMesh.scale.set(scale, scale, scale);
                blockLine.scale.set(scale, scale, scale);
                
                blockMesh.material.color.setHex(0x00f0ff);
                blockLineMat.color.setHex(0x00f0ff);

                txParticles.forEach(p => {
                    p.mesh.position.lerp(new THREE.Vector3((Math.random() - 0.5) * 1.0, (Math.random() - 0.5) * 1.0, (Math.random() - 0.5) * 1.0), 0.05);
                });
            } 
            else if (currentPhase === 2) {
                blockMesh.visible = true;
                blockLine.visible = true;
                hashingRing.visible = true;
                
                blockMesh.scale.set(1, 1, 1);
                blockLine.scale.set(1, 1, 1);
                blockMesh.rotation.y += 0.06;
                blockLine.rotation.y += 0.06;

                hashingRing.rotation.z -= 0.08;
                hashingRing.scale.set(1 + Math.sin(time * 0.01) * 0.08, 1 + Math.sin(time * 0.01) * 0.08, 1);

                txParticles.forEach(p => {
                    p.mesh.position.y += Math.sin(time * 0.01 + p.mesh.id) * 0.01;
                });
            } 
            else if (currentPhase === 3) {
                blockMesh.visible = true;
                blockLine.visible = true;
                hashingRing.visible = true;
                
                blockMesh.rotation.y += 0.08;
                blockLine.rotation.y += 0.08;
                hashingRing.rotation.z -= 0.1;

                const colors = [0x00f0ff, 0x8a2be2, 0xff0055, 0xffbd3d];
                const cIdx = Math.floor(time / 150) % colors.length;
                blockMesh.material.color.setHex(colors[cIdx]);
                blockLineMat.color.setHex(colors[cIdx]);
            } 
            else if (currentPhase === 4) {
                blockMesh.visible = true;
                blockLine.visible = true;
                hashingRing.visible = false;
                
                blockMesh.material.color.setHex(0x00e676);
                blockLineMat.color.setHex(0x00e676);
                blockMesh.rotation.y += 0.01;
                blockLine.rotation.y += 0.01;

                validationParticles.forEach(p => {
                    p.mesh.visible = true;
                    if (phaseProgress < 0.1) {
                        p.mesh.position.set(0, 0, 0);
                    } else {
                        p.mesh.position.addScaledVector(p.dir, p.speed);
                    }
                });

                txParticles.forEach(p => p.mesh.visible = false);
            } 
            else if (currentPhase === 5) {
                blockMesh.visible = true;
                blockLine.visible = true;
                validationParticles.forEach(p => p.mesh.visible = false);

                const endPos = new THREE.Vector3(-1.6, -0.6, -1.0);
                const lerpedPos = new THREE.Vector3().lerpVectors(new THREE.Vector3(0, 0, 0), endPos, Math.min(1.0, phaseProgress * 1.5));
                blockMesh.position.copy(lerpedPos);
                blockLine.position.copy(lerpedPos);

                const scale = THREE.MathUtils.lerp(1.0, 0.5, Math.min(1.0, phaseProgress * 1.5));
                blockMesh.scale.set(scale, scale, scale);
                blockLine.scale.set(scale, scale, scale);
            }

            renderer.render(scene, camera);
        }

        return { resize, animate, canvasId: "canvas-mining-process" };
    }

    // 4. 3D Proof of Work Simulator Visualizer
    function initPoWSimulator3D() {
        const canvas = document.getElementById("canvas-pow-simulator");
        if (!canvas) return null;
        
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
        camera.position.set(0, 0, 7.5);
        
        const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const group = new THREE.Group();
        scene.add(group);

        scene.add(new THREE.AmbientLight(0xffffff, 0.45));
        const dirLight = new THREE.DirectionalLight(0x00f0ff, 0.85);
        dirLight.position.set(5, 5, 5);
        scene.add(dirLight);

        // Previous Block (Left, Blue/Purple)
        const prevBlockGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
        const prevBlockMat = new THREE.MeshBasicMaterial({ color: 0x8a2be2, transparent: true, opacity: 0.2, side: THREE.DoubleSide });
        const prevBlockMesh = new THREE.Mesh(prevBlockGeo, prevBlockMat);
        prevBlockMesh.position.set(-2.8, 0, 0);
        group.add(prevBlockMesh);

        const prevBlockEdges = new THREE.EdgesGeometry(prevBlockGeo);
        const prevBlockLines = new THREE.LineSegments(prevBlockEdges, new THREE.LineBasicMaterial({ color: 0x8a2be2, linewidth: 2 }));
        prevBlockLines.position.copy(prevBlockMesh.position);
        group.add(prevBlockLines);

        // Processing Chamber (Center)
        const chamberGeo = new THREE.TorusKnotGeometry(0.42, 0.12, 64, 8);
        const chamberMat = new THREE.MeshBasicMaterial({ color: 0xffbd3d, transparent: true, opacity: 0.75 });
        const chamberMesh = new THREE.Mesh(chamberGeo, chamberMat);
        chamberMesh.position.set(0, 0, 0);
        group.add(chamberMesh);

        const chamberOuterGeo = new THREE.SphereGeometry(0.75, 12, 12);
        const chamberOuterLines = new THREE.LineSegments(new THREE.EdgesGeometry(chamberOuterGeo), new THREE.LineBasicMaterial({ color: 0xffbd3d, transparent: true, opacity: 0.15 }));
        group.add(chamberOuterLines);

        // New Block Candidate (Right, Cyan)
        const newBlockGeo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
        const newBlockMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
        const newBlockMesh = new THREE.Mesh(newBlockGeo, newBlockMat);
        newBlockMesh.position.set(2.8, 0, 0);
        group.add(newBlockMesh);

        const newBlockEdges = new THREE.EdgesGeometry(newBlockGeo);
        const newBlockLines = new THREE.LineSegments(newBlockEdges, new THREE.LineBasicMaterial({ color: 0x00f0ff, linewidth: 2 }));
        newBlockLines.position.copy(newBlockMesh.position);
        group.add(newBlockLines);

        // Connections (Pipes)
        const pipeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 });
        const pointsL = [prevBlockMesh.position, chamberMesh.position];
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pointsL), pipeMat));
        const pointsR = [chamberMesh.position, newBlockMesh.position];
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pointsR), pipeMat));

        // Pulses (Moving data particles)
        const pulses = [];
        const pulseGeo = new THREE.SphereGeometry(0.04, 6, 6);
        const pulseMat = new THREE.MeshBasicMaterial({ color: 0x8a2be2 });
        
        let isMining = false;
        let successState = false;
        let successTime = 0;

        function triggerPulse() {
            const p = new THREE.Mesh(pulseGeo, pulseMat);
            p.position.copy(prevBlockMesh.position);
            group.add(p);
            pulses.push({
                mesh: p,
                progress: 0,
                speed: 0.05
            });
            gsap.fromTo(chamberMesh.scale, { x: 1.2, y: 1.2, z: 1.2 }, { x: 1, y: 1, z: 1, duration: 0.3 });
        }

        function setMining(mining) {
            isMining = mining;
            if (isMining) {
                successState = false;
                newBlockMat.color.setHex(0x00f0ff);
                newBlockLines.material.color.setHex(0x00f0ff);
            }
        }

        function triggerSuccess() {
            successState = true;
            successTime = Date.now();
            newBlockMat.color.setHex(0x00e676);
            newBlockLines.material.color.setHex(0x00e676);
            chamberMat.color.setHex(0x00e676);

            for (let i = 0; i < 20; i++) {
                const gp = new THREE.Mesh(pulseGeo, new THREE.MeshBasicMaterial({ color: 0x00e676 }));
                gp.position.copy(chamberMesh.position);
                group.add(gp);
                pulses.push({
                    mesh: gp,
                    progress: 0,
                    speed: 0.03 + Math.random() * 0.03,
                    dir: new THREE.Vector3(1.0 + Math.random()*0.5, (Math.random()-0.5)*1.5, (Math.random()-0.5)*1.5).normalize()
                });
            }
        }

        function resize() {
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        }

        const targetRotation = { x: 0, y: 0 };
        attachCustomControls(canvas, camera, targetRotation);

        function animate() {
            if (!visibleCanvases.has("canvas-pow-simulator")) return;
            requestAnimationFrame(animate);

            group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetRotation.y, 0.05);
            group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetRotation.x, 0.05);

            const cSpeed = isMining ? 0.2 : 0.025;
            chamberMesh.rotation.y += cSpeed;
            chamberMesh.rotation.z += cSpeed * 0.5;
            chamberOuterLines.rotation.y -= 0.005;

            if (isMining) {
                chamberMat.color.setHex(Math.sin(Date.now() * 0.03) > 0 ? 0xff0055 : 0xffbd3d);
                if (Math.random() < 0.3) {
                    triggerPulse();
                }
            } else if (!successState) {
                chamberMat.color.setHex(0xffbd3d);
            }

            for (let i = pulses.length - 1; i >= 0; i--) {
                const p = pulses[i];
                if (p.dir) {
                    p.progress += p.speed;
                    p.mesh.position.addScaledVector(p.dir, p.speed * 4);
                    p.mesh.scale.multiplyScalar(0.96);
                    if (p.progress >= 1.0 || p.mesh.scale.x < 0.05) {
                        group.remove(p.mesh);
                        pulses.splice(i, 1);
                    }
                } else {
                    p.progress += p.speed;
                    p.mesh.position.lerpVectors(prevBlockMesh.position, chamberMesh.position, p.progress);
                    if (p.progress >= 1.0) {
                        group.remove(p.mesh);
                        pulses.splice(i, 1);
                    }
                }
            }

            if (successState) {
                const timeDiff = Date.now() - successTime;
                if (timeDiff < 2000) {
                    const ringScale = 1.0 + (timeDiff / 2000) * 1.5;
                    chamberOuterLines.scale.set(ringScale, ringScale, ringScale);
                } else {
                    successState = false;
                    chamberOuterLines.scale.set(1, 1, 1);
                    chamberMat.color.setHex(0xffbd3d);
                }
            }

            renderer.render(scene, camera);
        }

        return { resize, animate, triggerPulse, setMining, triggerSuccess, canvasId: "canvas-pow-simulator" };
    }

    // 5. 3D Global Network Map (Globe)
    function initGlobe3D() {
        const canvas = document.getElementById("canvas-global-globe");
        if (!canvas) return null;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
        camera.position.set(0, 0, 7);

        const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const globeGroup = new THREE.Group();
        scene.add(globeGroup);

        scene.add(new THREE.AmbientLight(0xffffff, 0.4));
        const dirLight = new THREE.DirectionalLight(0x00f0ff, 0.9);
        dirLight.position.set(5, 5, 5);
        scene.add(dirLight);

        const earthRadius = 1.8;
        
        const innerGeo = new THREE.SphereGeometry(earthRadius - 0.02, 32, 32);
        const innerMat = new THREE.MeshBasicMaterial({ color: 0x050818, transparent: true, opacity: 0.82 });
        globeGroup.add(new THREE.Mesh(innerGeo, innerMat));

        const gridGeo = new THREE.SphereGeometry(earthRadius, 24, 24);
        const gridMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.15 });
        globeGroup.add(new THREE.Mesh(gridGeo, gridMat));

        const ptsGeo = new THREE.SphereGeometry(earthRadius + 0.02, 40, 36);
        const ptsMat = new THREE.PointsMaterial({ color: 0x8a2be2, size: 0.025, transparent: true, opacity: 0.5 });
        globeGroup.add(new THREE.Points(ptsGeo, ptsMat));

        function latLongToVector3(lat, lon, radius) {
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lon + 180) * (Math.PI / 180);
            return new THREE.Vector3(
                -(radius * Math.sin(phi) * Math.sin(theta)),
                radius * Math.cos(phi),
                radius * Math.sin(phi) * Math.cos(theta)
            );
        }

        const nodes = [
            { lat: 40.7, lon: -74.0, label: "USA Node", color: 0x00f0ff },
            { lat: 64.9, lon: -18.5, label: "Iceland DC", color: 0x00e676 },
            { lat: 48.8, lon: 2.3, label: "Europe Node", color: 0x8a2be2 },
            { lat: 35.6, lon: 139.6, label: "Asia Pool", color: 0xffbd3d },
            { lat: -33.8, lon: 151.2, label: "Australia", color: 0x00f0ff },
            { lat: -23.5, lon: -46.6, label: "S. America", color: 0xffbd3d },
            { lat: -26.2, lon: 28.0, label: "Africa DC", color: 0x00e676 }
        ];

        const spikeGeo = new THREE.ConeGeometry(0.04, 0.35, 4);
        spikeGeo.translate(0, 0.175, 0);
        const spikes = [];

        nodes.forEach(n => {
            const pos = latLongToVector3(n.lat, n.lon, earthRadius);
            const spikeMat = new THREE.MeshBasicMaterial({ color: n.color, transparent: true, opacity: 0.8 });
            const spike = new THREE.Mesh(spikeGeo, spikeMat);
            spike.position.copy(pos);
            spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());
            globeGroup.add(spike);
            spikes.push({ mesh: spike, pos: pos, label: n.label });
        });

        const arcs = [];
        const arcMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.3 });
        
        function drawArc(posA, posB) {
            const mid = new THREE.Vector3().addVectors(posA, posB).multiplyScalar(0.5);
            const dist = posA.distanceTo(posB);
            mid.normalize().multiplyScalar(earthRadius + dist * 0.4);
            
            const curve = new THREE.QuadraticBezierCurve3(posA, mid, posB);
            const points = curve.getPoints(32);
            const geo = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geo, arcMat);
            globeGroup.add(line);
            
            arcs.push({ curve: curve, points: points });
        }

        for (let i = 0; i < spikes.length - 1; i++) {
            drawArc(spikes[i].pos, spikes[i+1].pos);
        }
        drawArc(spikes[spikes.length - 1].pos, spikes[0].pos);
        drawArc(spikes[0].pos, spikes[3].pos);

        const flowParticles = [];
        const fpGeo = new THREE.SphereGeometry(0.025, 6, 6);
        const fpMat = new THREE.MeshBasicMaterial({ color: 0xffbd3d });

        for (let i = 0; i < 6; i++) {
            const fp = new THREE.Mesh(fpGeo, fpMat);
            globeGroup.add(fp);
            flowParticles.push({
                mesh: fp,
                arcIdx: Math.floor(Math.random() * arcs.length),
                progress: Math.random(),
                speed: 0.005 + Math.random() * 0.005
            });
        }

        const targetRotation = { x: 0, y: 0 };
        attachCustomControls(canvas, camera, targetRotation);

        function resize() {
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        }

        function animate() {
            if (!visibleCanvases.has("canvas-global-globe")) return;
            requestAnimationFrame(animate);

            globeGroup.rotation.y = THREE.MathUtils.lerp(globeGroup.rotation.y, targetRotation.y, 0.05);
            globeGroup.rotation.x = THREE.MathUtils.lerp(globeGroup.rotation.x, targetRotation.x, 0.05);
            globeGroup.rotation.y += 0.0018;

            spikes.forEach((s, idx) => {
                const sVal = 1.0 + Math.sin(Date.now() * 0.005 + idx) * 0.15;
                s.mesh.scale.set(1, sVal, 1);
            });

            flowParticles.forEach(fp => {
                fp.progress += fp.speed;
                if (fp.progress >= 1.0) {
                    fp.progress = 0;
                    fp.arcIdx = Math.floor(Math.random() * arcs.length);
                }
                const curve = arcs[fp.arcIdx].curve;
                const pos = curve.getPointAt(fp.progress);
                fp.mesh.position.copy(pos);
            });

            renderer.render(scene, camera);
        }

        return { resize, animate, canvasId: "canvas-global-globe" };
    }

    // 6. 3D Mining Hardware Evolution Showcase
    function initHardwareShowcase3D() {
        const canvas = document.getElementById("canvas-hardware-showcase");
        if (!canvas) return null;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
        camera.position.set(0, 0, 7);

        const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        const l1 = new THREE.DirectionalLight(0x00f0ff, 0.8);
        l1.position.set(5, 5, 5);
        scene.add(l1);
        const l2 = new THREE.DirectionalLight(0x8a2be2, 0.6);
        l2.position.set(-5, -5, -3);
        scene.add(l2);

        const showcaseGroup = new THREE.Group();
        scene.add(showcaseGroup);

        // CPU Group
        const cpuGroup = new THREE.Group();
        showcaseGroup.add(cpuGroup);
        
        const boardMat = new THREE.MeshBasicMaterial({ color: 0x0f562f, side: THREE.DoubleSide });
        const cpuBoard = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 2.0), boardMat);
        cpuGroup.add(cpuBoard);
        
        const chipMat = new THREE.MeshBasicMaterial({ color: 0xb0b0b0 });
        const cpuChip = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 1.2), chipMat);
        cpuChip.position.y = 0.08;
        cpuGroup.add(cpuChip);
        
        const circuitLines = new THREE.Group();
        cpuGroup.add(circuitLines);
        for (let i = 0; i < 4; i++) {
            const points = [
                new THREE.Vector3(-0.9, 0.05, -0.9 + i*0.6),
                new THREE.Vector3(-0.5, 0.05, -0.9 + i*0.6),
                new THREE.Vector3(-0.4, 0.05, -0.6 + i*0.4),
                new THREE.Vector3(-0.6, 0.09, -0.6 + i*0.4)
            ];
            const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0x00f0ff }));
            circuitLines.add(line);
        }

        // GPU Group
        const gpuGroup = new THREE.Group();
        showcaseGroup.add(gpuGroup);
        
        const gpuBoard = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.08, 1.4), new THREE.MeshBasicMaterial({ color: 0x111111 }));
        gpuGroup.add(gpuBoard);
        
        const pcie = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 0.1), new THREE.MeshBasicMaterial({ color: 0xffbd3d }));
        pcie.position.set(-0.2, -0.06, -0.7);
        gpuGroup.add(pcie);

        const gpuFans = [];
        const fanGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.1, 16);
        const fanMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
        
        const fanXPositions = [-0.7, 0.7];
        fanXPositions.forEach(xPos => {
            const fanContainer = new THREE.Group();
            fanContainer.position.set(xPos, 0.09, 0);
            gpuGroup.add(fanContainer);
            
            const fanHub = new THREE.Mesh(fanGeo, fanMat);
            fanContainer.add(fanHub);
            
            for (let i = 0; i < 7; i++) {
                const blade = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.08), new THREE.MeshBasicMaterial({ color: 0x222222 }));
                blade.position.x = 0.2;
                blade.rotation.y = 0.2;
                
                const bladePivot = new THREE.Group();
                bladePivot.rotation.y = (i * Math.PI * 2) / 7;
                bladePivot.add(blade);
                fanContainer.add(bladePivot);
            }
            
            gpuFans.push(fanContainer);
        });

        // FPGA Group
        const fpgaGroup = new THREE.Group();
        showcaseGroup.add(fpgaGroup);
        
        const fpgaBoard = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 2.0), new THREE.MeshBasicMaterial({ color: 0x002255 }));
        fpgaGroup.add(fpgaBoard);
        
        const chipGeo = new THREE.BoxGeometry(0.45, 0.12, 0.45);
        const fpgaChips = [];
        const cOffsets = [-0.45, 0.45];
        cOffsets.forEach(x => {
            cOffsets.forEach(z => {
                const chip = new THREE.Mesh(chipGeo, new THREE.MeshBasicMaterial({ color: 0x222222 }));
                chip.position.set(x, 0.08, z);
                fpgaGroup.add(chip);
                fpgaChips.push(chip);
            });
        });

        const railGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-0.45, 0.08, -0.45), new THREE.Vector3(0.45, 0.08, -0.45),
            new THREE.Vector3(0.45, 0.08, -0.45), new THREE.Vector3(0.45, 0.08, 0.45),
            new THREE.Vector3(0.45, 0.08, 0.45), new THREE.Vector3(-0.45, 0.08, 0.45),
            new THREE.Vector3(-0.45, 0.08, 0.45), new THREE.Vector3(-0.45, 0.08, -0.45)
        ]);
        const rails = new THREE.LineSegments(railGeo, new THREE.LineBasicMaterial({ color: 0x00e676, transparent: true, opacity: 0.8 }));
        fpgaGroup.add(rails);

        // ASIC Group
        const asicGroup = new THREE.Group();
        showcaseGroup.add(asicGroup);
        
        const caseMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 1.0), new THREE.MeshBasicMaterial({ color: 0x7e7e7e }));
        asicGroup.add(caseMesh);
        
        const caseOutline = new THREE.LineSegments(new THREE.EdgesGeometry(caseMesh.geometry), new THREE.LineBasicMaterial({ color: 0xbbbbbb }));
        asicGroup.add(caseOutline);

        const ctrlBox = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.25, 0.7), new THREE.MeshBasicMaterial({ color: 0x555555 }));
        ctrlBox.position.set(-0.2, 0.65, 0);
        asicGroup.add(ctrlBox);

        const asicFans = [];
        const asicFanPositions = [-1.22, 1.22];
        asicFanPositions.forEach(x => {
            const fanGroup = new THREE.Group();
            fanGroup.position.set(x, 0, 0);
            fanGroup.rotation.z = Math.PI / 2;
            asicGroup.add(fanGroup);
            
            const frame = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.1, 16), new THREE.MeshBasicMaterial({ color: 0x1a1a1a }));
            fanGroup.add(frame);
            
            const blades = new THREE.Group();
            fanGroup.add(blades);
            for (let i = 0; i < 6; i++) {
                const b = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.02, 0.12), new THREE.MeshBasicMaterial({ color: 0x0b0b0b }));
                b.position.x = 0.18;
                b.rotation.y = 0.35;
                
                const bp = new THREE.Group();
                bp.rotation.y = (i * Math.PI * 2) / 6;
                bp.add(b);
                blades.add(bp);
            }
            asicFans.push(blades);
        });

        cpuGroup.scale.set(1, 1, 1);
        gpuGroup.scale.set(0, 0, 0);
        fpgaGroup.scale.set(0, 0, 0);
        asicGroup.scale.set(0, 0, 0);

        let activeHw = "cpu";
        
        const hwButtons = document.querySelectorAll(".hw-switch-btn");
        hwButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                hwButtons.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                activeHw = btn.getAttribute("data-hw");
            });
        });

        const targetRotation = { x: 0.3, y: 0.6 };
        attachCustomControls(canvas, camera, targetRotation);

        function resize() {
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        }

        function animate() {
            if (!visibleCanvases.has("canvas-hardware-showcase")) return;
            requestAnimationFrame(animate);

            showcaseGroup.rotation.y = THREE.MathUtils.lerp(showcaseGroup.rotation.y, targetRotation.y, 0.05);
            showcaseGroup.rotation.x = THREE.MathUtils.lerp(showcaseGroup.rotation.x, targetRotation.x, 0.05);
            showcaseGroup.rotation.y += 0.005;

            gpuFans.forEach(fan => {
                fan.rotation.y += 0.08;
            });
            asicFans.forEach(blades => {
                blades.rotation.y += 0.12;
            });

            const cpuTarget = activeHw === "cpu" ? 1.0 : 0.0;
            const gpuTarget = activeHw === "gpu" ? 1.0 : 0.0;
            const fpgaTarget = activeHw === "fpga" ? 1.0 : 0.0;
            const asicTarget = activeHw === "asic" ? 1.0 : 0.0;

            cpuGroup.scale.lerp(new THREE.Vector3(cpuTarget, cpuTarget, cpuTarget), 0.12);
            gpuGroup.scale.lerp(new THREE.Vector3(gpuTarget, gpuTarget, gpuTarget), 0.12);
            fpgaGroup.scale.lerp(new THREE.Vector3(fpgaTarget, fpgaTarget, fpgaTarget), 0.12);
            asicGroup.scale.lerp(new THREE.Vector3(asicTarget, asicTarget, asicTarget), 0.12);

            cpuGroup.visible = cpuGroup.scale.x > 0.01;
            gpuGroup.visible = gpuGroup.scale.x > 0.01;
            fpgaGroup.visible = fpgaGroup.scale.x > 0.01;
            asicGroup.visible = asicGroup.scale.x > 0.01;

            renderer.render(scene, camera);
        }

        return { resize, animate, canvasId: "canvas-hardware-showcase" };
    }

    // Register visualizers
    const bChain = initBlockchainNetwork3D();
    if (bChain) {
        activeVisualizers[bChain.canvasId] = bChain;
        canvasObserver.observe(document.getElementById(bChain.canvasId));
    }
    
    const txFlow = initTxFlow3D();
    if (txFlow) {
        activeVisualizers[txFlow.canvasId] = txFlow;
        canvasObserver.observe(document.getElementById(txFlow.canvasId));
    }

    const mProcess = initMiningProcess3D();
    if (mProcess) {
        activeVisualizers[mProcess.canvasId] = mProcess;
        canvasObserver.observe(document.getElementById(mProcess.canvasId));
    }

    const powSimInstance = initPoWSimulator3D();
    if (powSimInstance) {
        activeVisualizers[powSimInstance.canvasId] = powSimInstance;
        powSimulator3DInstance = powSimInstance;
        canvasObserver.observe(document.getElementById(powSimInstance.canvasId));
    }

    const globeMap = initGlobe3D();
    if (globeMap) {
        activeVisualizers[globeMap.canvasId] = globeMap;
        canvasObserver.observe(document.getElementById(globeMap.canvasId));
    }

    const hwShowcase = initHardwareShowcase3D();
    if (hwShowcase) {
        activeVisualizers[hwShowcase.canvasId] = hwShowcase;
        canvasObserver.observe(document.getElementById(hwShowcase.canvasId));
    }

    // Hook DOM action buttons
    if (btnIncrement) {
        btnIncrement.addEventListener("click", () => {
            if (simNonce) {
                simNonce.value = parseInt(simNonce.value) + 1;
                calculateSimHash();
                if (powSimulator3DInstance) powSimulator3DInstance.triggerPulse();
            }
        });
    }

    let miningInterval = null;
    if (btnMine) {
        btnMine.addEventListener("click", () => {
            if (miningInterval) {
                clearInterval(miningInterval);
                miningInterval = null;
                btnMine.innerHTML = `<i class="fa-solid fa-circle-play"></i> Mine Block (Find Zeros)`;
                btnMine.className = "btn btn-primary";
                simStatus.textContent = "Mining paused.";
                if (powSimulator3DInstance) powSimulator3DInstance.setMining(false);
                return;
            }

            btnMine.innerHTML = `<i class="fa-solid fa-circle-stop"></i> Stop Mining`;
            btnMine.className = "btn btn-danger";
            simStatus.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Hashing at 50 hashes/sec... Searching for nonce...`;
            if (powSimulator3DInstance) powSimulator3DInstance.setMining(true);

            miningInterval = setInterval(() => {
                const currentNonce = parseInt(simNonce.value);
                simNonce.value = currentNonce + 1;
                
                const inputData = simBlockData.value + simPrevHash.value + simNonce.value;
                const hash = sha256(sha256(inputData));
                simHashOutput.textContent = hash;

                if (hash.startsWith("000")) {
                    clearInterval(miningInterval);
                    miningInterval = null;
                    btnMine.innerHTML = `<i class="fa-solid fa-circle-play"></i> Mine Block (Find Zeros)`;
                    btnMine.className = "btn btn-primary";
                    simHashOutput.className = "hash-val font-green";
                    simStatus.className = "sim-status font-green";
                    simStatus.innerHTML = `<i class="fa-solid fa-circle-check"></i> Block Mined! Nonce: <strong>${simNonce.value}</strong> has a hash meeting target difficulty!`;
                    
                    if (powSimulator3DInstance) {
                        powSimulator3DInstance.setMining(false);
                        powSimulator3DInstance.triggerSuccess();
                    }
                } else {
                    simHashOutput.className = "hash-val font-red";
                }
            }, 20);
        });
    }

    calculateSimHash();
    if (simBlockData) {
        simBlockData.addEventListener("input", () => {
            calculateSimHash();
            if (powSimulator3DInstance) powSimulator3DInstance.triggerPulse();
        });
    }
}

// --- MISSING SYSTEM FUNCTIONS & TRUST INFRASTRUCTURE ANIMATIONS ---

function initTabs() {
    const tabWrappers = document.querySelectorAll(".tabs-wrapper");
    tabWrappers.forEach(wrapper => {
        const buttons = wrapper.querySelectorAll(".tab-btn");
        const panels = wrapper.querySelectorAll(".tab-content-panel");
        
        buttons.forEach(btn => {
            btn.addEventListener("click", () => {
                const targetId = btn.getAttribute("data-tab");
                
                buttons.forEach(b => b.classList.remove("active"));
                panels.forEach(p => p.classList.remove("active"));
                
                btn.classList.add("active");
                const targetPanel = wrapper.querySelector(`#${targetId}`);
                if (targetPanel) {
                    targetPanel.classList.add("active");
                }
                
                if (targetId === "infra-globe" && activeVisualizers["three-globe-viewport"]) {
                    activeVisualizers["three-globe-viewport"].resize();
                }
            });
        });
    });
}

let miningSimInterval = null;
function startMiningSimulator() {
    if (!STATE.user) return;
    
    if (miningSimInterval) clearInterval(miningSimInterval);
    
    miningSimInterval = setInterval(() => {
        if (STATE.user.isLoggedIn && STATE.user.activeContracts && STATE.user.activeContracts.length > 0) {
            const btcGrowth = 0.000000003;
            STATE.user.balance += btcGrowth;
            updateBalanceUI();
        }
    }, 1000);
}

function initProofOfWorkWave() {
    const canvas = document.getElementById("pow-wave-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const resizeCanvas = () => {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight || 150;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    
    let offset = 0;
    const drawWave = () => {
        requestAnimationFrame(drawWave);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x++) {
            const y = canvas.height / 2 + Math.sin(x * 0.01 + offset) * 25 + Math.cos(x * 0.005 - offset) * 10;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        ctx.strokeStyle = "rgba(138, 43, 226, 0.25)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x++) {
            const y = canvas.height / 2 + Math.sin(x * 0.015 - offset * 1.5) * 15 + Math.cos(x * 0.008 + offset * 0.8) * 15;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        offset += 0.03;
    };
    drawWave();
}

function renderDashboardTransactions() {
    const previewTable = document.getElementById("db-tx-history-preview");
    const walletTable = document.getElementById("db-wallet-tx-history");
    if (!previewTable && !walletTable) return;
    
    let htmlContent = "";
    STATE.user.transactions.forEach(tx => {
        const typeClass = tx.amount >= 0 ? "text-green" : "text-red";
        const prefix = tx.amount >= 0 ? "+" : "";
        const amountText = `${prefix}${tx.amount.toFixed(8)} ${tx.asset}`;
        
        htmlContent += `
            <tr class="sec-log-row">
                <td class="font-mono font-small">${tx.hash}</td>
                <td>${tx.type}</td>
                <td class="font-mono font-small ${typeClass}">${amountText}</td>
                <td class="text-muted font-small">${tx.time}</td>
                <td><span class="badge badge-success font-small"><i class="fa-solid fa-circle-check"></i> ${tx.status}</span></td>
            </tr>
        `;
    });
    
    if (previewTable) previewTable.innerHTML = htmlContent;
    if (walletTable) walletTable.innerHTML = htmlContent;
}

function initTrustInfrastructureSection() {
    const scadaLogs = document.getElementById("trust-section-scada-logs");
    const activeMiners = document.getElementById("live-active-miners-count");
    const blockHeight = document.getElementById("live-block-height");
    if (!scadaLogs) return;

    const templates = [
        "[SYNC] Iceland Geothermal: ASIC pod overclock stable at 0.78V",
        "[INFO] Texas Solar Grid: Peak solar yield routed to storage batteries",
        "[OK] Norway Hydro Node: Coolant viscosity index normal (1.04 PUE)",
        "[BLOCK] Consensus: Merkle tree root generated for block candidate",
        "[SYNC] Zurich GPU: AI workload delegation balance complete",
        "[OK] Security Node: Multi-signature wallet vault handshake validated",
        "[INFO] SCADA Monitor: Dielectric liquid temperature index 52.4°C - nominal",
        "[SYNC] Network Consensus: Share submission accepted from node Operator-A"
    ];

    setInterval(() => {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
        
        const logRow = document.createElement("div");
        logRow.className = "log-row";
        logRow.style.opacity = "0";
        logRow.style.transform = "translateY(10px)";
        logRow.style.transition = "all 0.5s ease";
        logRow.innerHTML = `<span>[${timeStr}]</span> ${randomTemplate}`;
        
        scadaLogs.appendChild(logRow);
        
        logRow.offsetHeight; // force reflow
        logRow.style.opacity = "1";
        logRow.style.transform = "translateY(0)";
        
        if (scadaLogs.children.length > 8) {
            const oldest = scadaLogs.children[0];
            oldest.style.opacity = "0";
            oldest.style.transform = "translateY(-10px)";
            setTimeout(() => oldest.remove(), 500);
        }
    }, 3500);

    let minersCount = 14892;
    setInterval(() => {
        if (activeMiners) {
            minersCount += Math.floor(Math.random() * 5) - 2;
            if (minersCount < 14850) minersCount = 14892;
            if (minersCount > 14950) minersCount = 14892;
            activeMiners.textContent = `${minersCount.toLocaleString()} Nodes`;
        }
    }, 2000);

    let currentHeight = 847294;
    setInterval(() => {
        if (blockHeight) {
            currentHeight += 1;
            blockHeight.innerHTML = `Height: #${currentHeight.toLocaleString()} (Synced)`;
            showToast("Consensus Synced", `New block parsed on the SHA-256 network: #${currentHeight.toLocaleString()}`, "info");
        }
    }, 15000);
}

// --- STARTUP VALIDATION AND RECOVERY ENGINE ---
function runStartupValidation() {
    console.log("[Validation] Running startup validation check...");

    const selectAndVerify = (selector, typeLabel) => {
        const elements = document.querySelectorAll(selector);
        let correctedCount = 0;
        
        elements.forEach(el => {
            // Do not check elements inside the loader
            if (el.closest("#loader") || el.id === "loader") return;

            const style = window.getComputedStyle(el);
            const opacity = parseFloat(style.opacity);
            const visibility = style.visibility;
            const display = style.display;

            let needsFix = false;
            if (isNaN(opacity) || opacity < 0.1) {
                needsFix = true;
            }
            if (visibility === "hidden") {
                needsFix = true;
            }
            
            if (needsFix) {
                el.style.setProperty("opacity", "1", "important");
                el.style.setProperty("visibility", "visible", "important");
                if (display === "none") {
                    if (!el.classList.contains("tab-content-panel") && 
                        !el.classList.contains("hidden") && 
                        !el.closest(".hidden") && 
                        !el.classList.contains("modal-overlay") && 
                        !el.classList.contains("chat-box") && 
                        !el.classList.contains("drawer-backdrop")) {
                        el.style.setProperty("display", "", "important");
                    }
                }
                correctedCount++;
            }
        });

        if (correctedCount > 0) {
            console.warn(`[Validation] Corrected ${correctedCount} elements of type '${typeLabel}' (${selector}) that were hidden or faded.`);
        } else {
            console.log(`[Validation] All '${typeLabel}' elements are fully visible.`);
        }
    };

    // 1. Feature cards
    selectAndVerify(".feature-card, .why-choose-card", "Feature Cards");

    // 2. Pricing cards
    selectAndVerify(".plan-card", "Pricing Cards");

    // 3. Text elements (h1-h6, p, span, li)
    selectAndVerify("h1, h2, h3, h4, h5, h6, p, li, span.section-badge, span.stat-label, span.stat-unit", "Text Elements");

    // 4. Buttons (.btn, button, .learn-more-btn)
    selectAndVerify(".btn, button, .learn-more-btn", "Buttons");

    // Force a ScrollTrigger refresh after forcing visibility to ensure correct layout calculations
    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
    }
}

// Backup window load listener to trigger recalculation and validation
window.addEventListener("load", () => {
    console.log("[Load Event] All assets loaded. Recalculating ScrollTrigger and validating UI...");
    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
    }
    runStartupValidation();
});

// --- ADMIN INVITATION KEY FUNCTIONS ---
async function loadInvitationKeys() {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
        const response = await fetch('/api/admin/invitations', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            renderInvitationKeysTable(data.keys);
        } else {
            showToast("Fetch Error", "Failed to retrieve invitation keys.", "danger");
        }
    } catch (err) {
        showToast("Connection Fail", "Failed to connect to invitation backend.", "danger");
    }
}

function renderInvitationKeysTable(keys) {
    const tbody = document.getElementById("admin-keys-tbody");
    if (!tbody) return;

    tbody.innerHTML = "";
    if (keys.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px;">No invitation keys found. Click 'Generate Key' to create one.</td></tr>`;
        return;
    }

    keys.forEach(k => {
        const tr = document.createElement("tr");

        const statusClass = k.used ? "status-danger" : (k.active ? "status-success" : "status-pending");
        const statusText = k.used ? "Used" : (k.active ? "Active" : "Disabled");
        
        tr.innerHTML = `
            <td style="font-size: 0.75rem; letter-spacing: 0.5px; word-break: break-all;">${k.key}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>${k.used_by || '-'}</td>
            <td>${k.used_at ? new Date(k.used_at).toLocaleString() : '-'}</td>
            <td class="table-actions">
                <button class="btn btn-sm ${k.active ? 'btn-warning' : 'btn-success'}" onclick="toggleKeyActive('${k._id}')" style="min-width: 80px;">
                    ${k.active ? 'Disable' : 'Enable'}
                </button>
                <button class="btn btn-sm btn-outline ml-2" onclick="toggleKeyUsed('${k._id}')" style="min-width: 100px;">
                    ${k.used ? 'Mark Unused' : 'Mark Used'}
                </button>
                <button class="btn btn-sm btn-danger ml-2" onclick="deleteInvitationKey('${k._id}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function generateInvitationKey() {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
        const response = await fetch('/api/admin/invitations/generate', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
            showToast("Key Generated", "New invitation key has been generated.", "success");
            loadInvitationKeys();
        } else {
            showToast("Generation Failure", data.message || "Failed to generate key.", "danger");
        }
    } catch (err) {
        showToast("Connection Fail", "Backend unreachable.", "danger");
    }
}

async function toggleKeyActive(id) {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
        const response = await fetch(`/api/admin/invitations/${id}/toggle-active`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
            showToast("Status Updated", data.message, "success");
            loadInvitationKeys();
        } else {
            showToast("Update Failure", data.message || "Failed to update key status.", "danger");
        }
    } catch (err) {
        showToast("Connection Fail", "Backend unreachable.", "danger");
    }
}

async function toggleKeyUsed(id) {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
        const response = await fetch(`/api/admin/invitations/${id}/toggle-used`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
            showToast("Status Updated", data.message, "success");
            loadInvitationKeys();
        } else {
            showToast("Update Failure", data.message || "Failed to update key status.", "danger");
        }
    } catch (err) {
        showToast("Connection Fail", "Backend unreachable.", "danger");
    }
}

async function deleteInvitationKey(id) {
    if (!confirm("Are you sure you want to delete this invitation key?")) return;

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
        const response = await fetch(`/api/admin/invitations/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
            showToast("Key Deleted", "Invitation key deleted successfully.", "success");
            loadInvitationKeys();
        } else {
            showToast("Delete Failure", data.message || "Failed to delete key.", "danger");
        }
    } catch (err) {
        showToast("Connection Fail", "Backend unreachable.", "danger");
    }
}

// --- INVITATION REQUEST MODAL FUNCTIONS ---
function openInvitationRequestModal(e) {
    if (e) e.preventDefault();
    closeAuthModal();
    
    const formContainer = document.getElementById("invite-request-form-container");
    const successContainer = document.getElementById("invite-request-success-container");
    if (formContainer) formContainer.classList.remove("hidden");
    if (successContainer) successContainer.classList.add("hidden");
    
    const form = document.querySelector("#invite-request-form-container form");
    if (form) form.reset();

    // Reset country dropdown triggers and value
    const selectedText = document.querySelector(".selected-country-text");
    if (selectedText) {
        selectedText.textContent = "Select country...";
        selectedText.style.color = "";
        if (correctedCount > 0) {
            console.warn(`[Validation] Corrected ${correctedCount} elements of type '${typeLabel}' (${selector}) that were hidden or faded.`);
        } else {
            console.log(`[Validation] All '${typeLabel}' elements are fully visible.`);
        }
    };

    // 1. Feature cards
    selectAndVerify(".feature-card, .why-choose-card", "Feature Cards");

    // 2. Pricing cards
    selectAndVerify(".plan-card", "Pricing Cards");

    // 3. Text elements (h1-h6, p, span, li)
    selectAndVerify("h1, h2, h3, h4, h5, h6, p, li, span.section-badge, span.stat-label, span.stat-unit", "Text Elements");

    // 4. Buttons (.btn, button, .learn-more-btn)
    selectAndVerify(".btn, button, .learn-more-btn", "Buttons");

    // Force a ScrollTrigger refresh after forcing visibility to ensure correct layout calculations
    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
    }
}

// Backup window load listener to trigger recalculation and validation
window.addEventListener("load", () => {
    console.log("[Load Event] All assets loaded. Recalculating ScrollTrigger and validating UI...");
    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
    }
    runStartupValidation();
});

// --- ADMIN INVITATION KEY FUNCTIONS ---
async function loadInvitationKeys() {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
        const response = await fetch('/api/admin/invitations', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            renderInvitationKeysTable(data.keys);
        } else {
            showToast("Fetch Error", "Failed to retrieve invitation keys.", "danger");
        }
    } catch (err) {
        showToast("Connection Fail", "Failed to connect to invitation backend.", "danger");
    }
}

function renderInvitationKeysTable(keys) {
    const tbody = document.getElementById("admin-keys-tbody");
    if (!tbody) return;

    tbody.innerHTML = "";
    if (keys.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px;">No invitation keys found. Click 'Generate Key' to create one.</td></tr>`;
        return;
    }

    keys.forEach(k => {
        const tr = document.createElement("tr");

        const statusClass = k.used ? "status-danger" : (k.active ? "status-success" : "status-pending");
        const statusText = k.used ? "Used" : (k.active ? "Active" : "Disabled");
        
        tr.innerHTML = `
            <td style="font-size: 0.75rem; letter-spacing: 0.5px; word-break: break-all;">${k.key}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>${k.used_by || '-'}</td>
            <td>${k.used_at ? new Date(k.used_at).toLocaleString() : '-'}</td>
            <td class="table-actions">
                <button class="btn btn-sm ${k.active ? 'btn-warning' : 'btn-success'}" onclick="toggleKeyActive('${k._id}')" style="min-width: 80px;">
                    ${k.active ? 'Disable' : 'Enable'}
                </button>
                <button class="btn btn-sm btn-outline ml-2" onclick="toggleKeyUsed('${k._id}')" style="min-width: 100px;">
                    ${k.used ? 'Mark Unused' : 'Mark Used'}
                </button>
                <button class="btn btn-sm btn-danger ml-2" onclick="deleteInvitationKey('${k._id}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function generateInvitationKey() {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
        const response = await fetch('/api/admin/invitations/generate', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
            showToast("Key Generated", "New invitation key has been generated.", "success");
            loadInvitationKeys();
        } else {
            showToast("Generation Failure", data.message || "Failed to generate key.", "danger");
        }
    } catch (err) {
        showToast("Connection Fail", "Backend unreachable.", "danger");
    }
}

async function toggleKeyActive(id) {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
        const response = await fetch(`/api/admin/invitations/${id}/toggle-active`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
            showToast("Status Updated", data.message, "success");
            loadInvitationKeys();
        } else {
            showToast("Update Failure", data.message || "Failed to update key status.", "danger");
        }
    } catch (err) {
        showToast("Connection Fail", "Backend unreachable.", "danger");
    }
}

async function toggleKeyUsed(id) {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
        const response = await fetch(`/api/admin/invitations/${id}/toggle-used`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
            showToast("Status Updated", data.message, "success");
            loadInvitationKeys();
        } else {
            showToast("Update Failure", data.message || "Failed to update key status.", "danger");
        }
    } catch (err) {
        showToast("Connection Fail", "Backend unreachable.", "danger");
    }
}

async function deleteInvitationKey(id) {
    if (!confirm("Are you sure you want to delete this invitation key?")) return;

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
        const response = await fetch(`/api/admin/invitations/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
            showToast("Key Deleted", "Invitation key deleted successfully.", "success");
            loadInvitationKeys();
        } else {
            showToast("Delete Failure", data.message || "Failed to delete key.", "danger");
        }
    } catch (err) {
        showToast("Connection Fail", "Backend unreachable.", "danger");
    }
}

// --- INVITATION REQUEST MODAL FUNCTIONS ---
function openInvitationRequestModal(e) {
    if (e) e.preventDefault();
    closeAuthModal();
    
    const formContainer = document.getElementById("invite-request-form-container");
    const successContainer = document.getElementById("invite-request-success-container");
    if (formContainer) formContainer.classList.remove("hidden");
    if (successContainer) successContainer.classList.add("hidden");
    
    const form = document.querySelector("#invite-request-form-container form");
    if (form) form.reset();

    // Reset country dropdown triggers and value
    const selectedText = document.querySelector(".selected-country-text");
    if (selectedText) {
        selectedText.textContent = "Select country...";
        selectedText.style.color = "";
    }
    const hiddenInput = document.getElementById("invite-req-country");
    if (hiddenInput) hiddenInput.value = "";

    const modal = document.getElementById("invitation-request-modal");
    if (modal) modal.classList.remove("hidden");
}

function closeInvitationRequestModal() {
    const modal = document.getElementById("invitation-request-modal");
    if (modal) modal.classList.add("hidden");
}



async function handleInvitationRequestSubmit(e) {
    e.preventDefault();
    showMaintenanceNoticeAlert();
}

// --- ADMIN INVITATION REQUEST MANAGEMENT ---
async function loadInvitationRequests() {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
        const response = await fetch('/api/admin/requests', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            renderInvitationRequestsTable(data.requests);
        } else {
            showToast("Fetch Error", "Failed to retrieve access requests.", "danger");
        }
    } catch (err) {
        showToast("Connection Fail", "Failed to connect to request backend.", "danger");
    }
}

function renderInvitationRequestsTable(requests) {
    const tbody = document.getElementById("admin-requests-tbody");
    if (!tbody) return;

    tbody.innerHTML = "";
    if (requests.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px;">No pending requests found.</td></tr>`;
        return;
    }

    requests.forEach(r => {
        const tr = document.createElement("tr");

        const statusClass = (r.status === "Approved" || r.status === "Invitation Sent") ? "status-success" : (r.status === "Rejected" ? "status-danger" : "status-pending");
        
        tr.innerHTML = `
            <td class="font-blue font-mono" style="font-size: 0.8rem; font-weight: 700;">${r.request_id || '-'}</td>
            <td>${r.full_name}</td>
            <td>${r.email}</td>
            <td>
                <div>${r.country}</div>
                <div style="font-size: 0.75rem; color: #718096;">${r.telegram ? r.telegram : '-'}</div>
            </td>
            <td>
                <div>${r.occupation ? r.occupation : '-'}</div>
                <div style="font-size: 0.75rem; color: #718096;">Exp: ${r.experience_level}</div>
            </td>
            <td style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${r.purpose}">${r.purpose}</td>
            <td><span class="status-badge ${statusClass}">${r.status}</span></td>
            <td class="table-actions">
                ${(r.status === "Pending" || r.status === "Pending Notification") ? `
                    <button class="btn btn-sm btn-success" onclick="approveRequest('${r._id}')">Approve</button>
                    <button class="btn btn-sm btn-danger ml-2" onclick="rejectRequest('${r._id}')">Reject</button>
                ` : `-`}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function approveRequest(id) {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
        const response = await fetch(`/api/admin/requests/${id}/approve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
            showToast("Request Approved", "Invitation key has been generated and emailed.", "success");
            loadInvitationRequests();
            loadInvitationKeys();
        } else {
            showToast("Approval Failure", data.message || "Failed to approve request.", "danger");
        }
    } catch (err) {
        showToast("Connection Fail", "Backend unreachable.", "danger");
    }
}
async function rejectRequest(id) {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
        const response = await fetch(`/api/admin/requests/${id}/reject`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
            showToast("Request Rejected", "The request has been rejected.", "success");
            loadInvitationRequests();
        } else {
            showToast("Rejection Failure", data.message || "Failed to reject request.", "danger");
        }
    } catch (err) {
        showToast("Connection Fail", "Submission failed. Please try again later.", "danger");
    }
}

async function deleteInvitationKey(id) {
    if (!confirm("Are you sure you want to delete this invitation key?")) return;

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
        const response = await fetch(`/api/admin/invitations/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
            showToast("Key Deleted", "Invitation key deleted successfully.", "success");
            loadInvitationKeys();
        } else {
            showToast("Delete Failure", data.message || "Failed to delete key.", "danger");
        }
    } catch (err) {
        showToast("Connection Fail", "Backend unreachable.", "danger");
    }
}

function showMaintenanceNoticeAlert() {
    // Create overlay
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.style.zIndex = "10000";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(3, 3, 8, 0.85)";
    overlay.style.backdropFilter = "blur(8px)";

    // Create card
    const card = document.createElement("div");
    card.className = "modal-card";
    card.style.maxWidth = "480px";
    card.style.padding = "40px";
    card.style.textAlign = "center";
    card.style.border = "1px solid rgba(0, 240, 255, 0.3)";
    card.style.boxShadow = "0 0 30px rgba(0, 240, 255, 0.15)";
    card.style.background = "rgba(8, 8, 22, 0.95)";

    // Add content
    card.innerHTML = `
        <h3 style="font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; color: #ff3838; margin-bottom: 20px; letter-spacing: 1px;">
            <i class="fa-solid fa-circle-exclamation" style="margin-right: 8px;"></i> REQUESTS TEMPORARILY CLOSED
        </h3>
        <p style="color: #ffffff; font-size: 0.95rem; line-height: 1.6; margin-bottom: 15px; font-family: 'Outfit', sans-serif;">
            Thank you for your interest in our platform.
        </p>
        <p style="color: #cbd5e1; font-size: 0.9rem; line-height: 1.6; margin-bottom: 15px; font-family: 'Outfit', sans-serif;">
            At this moment, the administration team has temporarily suspended new client onboarding and invitation requests.
        </p>
        <p style="color: #cbd5e1; font-size: 0.9rem; line-height: 1.6; margin-bottom: 15px; font-family: 'Outfit', sans-serif;">
            Please check back later for future availability.
        </p>
        <p style="color: #cbd5e1; font-size: 0.9rem; line-height: 1.6; margin-bottom: 25px; font-family: 'Outfit', sans-serif;">
            We appreciate your patience and understanding.
        </p>
        <p style="color: #00f0ff; font-size: 0.85rem; font-weight: 600; margin-bottom: 30px; font-family: 'Outfit', sans-serif; letter-spacing: 0.5px;">
            — CRYPTOMIN Administration Team
        </p>
        <button class="btn btn-primary" style="width: 100%; font-weight: 700; background: var(--accent-blue) !important; color: #030308 !important;" id="notice-understood-btn">
            Understood
        </button>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Close handler
    card.querySelector("#notice-understood-btn").onclick = () => {
        document.body.removeChild(overlay);
    };
}

// --- SEARCHABLE COUNTRY DROPDOWN IMPLEMENTATION ---
const countriesList = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", 
    "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", 
    "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", 
    "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", 
    "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", 
    "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", 
    "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", 
    "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", 
    "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", 
    "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", 
    "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", 
    "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", 
    "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", 
    "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", 
    "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", 
    "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", 
    "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", 
    "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", 
    "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", 
    "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

function initCountryDropdown() {
    const trigger = document.querySelector(".country-dropdown-trigger");
    const panel = document.querySelector(".country-dropdown-panel");
    const searchInput = document.querySelector(".country-search-input");
    const optionsList = document.querySelector(".country-options-list");
    const hiddenInput = document.getElementById("invite-req-country");
    const selectedText = document.querySelector(".selected-country-text");
    
    if (!trigger || !panel || !searchInput || !optionsList || !hiddenInput) return;

    let highlightedIndex = -1;
    let filteredCountries = [...countriesList];

    function renderOptions() {
        optionsList.innerHTML = "";
        filteredCountries.forEach((country, index) => {
            const div = document.createElement("div");
            div.className = "country-option";
            if (hiddenInput.value === country) {
                div.classList.add("selected");
            }
            if (index === highlightedIndex) {
                div.classList.add("highlighted");
            }
            div.textContent = country;
            div.onclick = (e) => {
                e.stopPropagation();
                selectCountry(country);
            };
            optionsList.appendChild(div);
        });
    }

    function selectCountry(country) {
        hiddenInput.value = country;
        selectedText.textContent = country;
        selectedText.style.color = "#ffffff";
        panel.classList.add("hidden");
        searchInput.value = "";
        filteredCountries = [...countriesList];
        highlightedIndex = -1;
    }

    // Toggle panel
    trigger.onclick = (e) => {
        e.stopPropagation();
        const isHidden = panel.classList.contains("hidden");
        if (isHidden) {
            panel.classList.remove("hidden");
            searchInput.focus();
            renderOptions();
        } else {
            panel.classList.add("hidden");
        }
    };

    // Filter search
    searchInput.oninput = () => {
        const query = searchInput.value.toLowerCase().trim();
        filteredCountries = countriesList.filter(c => c.toLowerCase().includes(query));
        highlightedIndex = -1;
        renderOptions();
    };

    // Keyboard navigation on trigger
    trigger.onkeydown = (e) => {
        if (panel.classList.contains("hidden")) {
            if (e.key === "Enter" || e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                panel.classList.remove("hidden");
                searchInput.focus();
                renderOptions();
            }
            return;
        }
    };

    // Keyboard navigation inside search/panel
    searchInput.onkeydown = (e) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            highlightedIndex = (highlightedIndex + 1) % filteredCountries.length;
            renderOptions();
            scrollToHighlighted();
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            highlightedIndex = (highlightedIndex - 1 + filteredCountries.length) % filteredCountries.length;
            renderOptions();
            scrollToHighlighted();
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (highlightedIndex >= 0 && highlightedIndex < filteredCountries.length) {
                selectCountry(filteredCountries[highlightedIndex]);
            }
        } else if (e.key === "Escape") {
            e.preventDefault();
            panel.classList.add("hidden");
            trigger.focus();
        }
    };

    function scrollToHighlighted() {
        const options = optionsList.querySelectorAll(".country-option");
        if (options[highlightedIndex]) {
            options[highlightedIndex].scrollIntoView({ block: "nearest" });
        }
    }

    // Click outside to close
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".country-dropdown-container")) {
            panel.classList.add("hidden");
        }
    });
}

// --- BITCOIN NETWORK EXPLORER & SIMULATED CONTRACTS ---
let explorerInterval = null;
let mempoolAnimationId = null;

function startBitcoinNetworkExplorerAnimation() {
    if (explorerInterval) clearInterval(explorerInterval);
    if (mempoolAnimationId) cancelAnimationFrame(mempoolAnimationId);

    const canvas = document.getElementById("mempool-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const heightEl = document.getElementById("exp-block-height");
    const diffEl = document.getElementById("exp-difficulty");
    const globalHashEl = document.getElementById("exp-global-hash");
    const mtxEl = document.getElementById("exp-mempool-tx");
    const mstatusEl = document.getElementById("mempool-status-txt");

    let blockHeight = 848312;
    let difficulty = 83.15;
    let globalHash = 624.84;
    let pendingTxs = 124510;
    let blockFills = 0.34;

    explorerInterval = setInterval(() => {
        const container = document.getElementById("bitcoin-network-explorer");
        if (!container || container.classList.contains("hidden")) return;

        globalHash += (Math.random() - 0.5) * 1.5;
        if (globalHashEl) globalHashEl.textContent = `${globalHash.toFixed(2)} EH/s`;

        pendingTxs += Math.floor((Math.random() - 0.4) * 80);
        if (mtxEl) mtxEl.textContent = `${pendingTxs.toLocaleString()} Tx`;

        const loadPercent = Math.min((pendingTxs / 350000) * 100, 100).toFixed(0);
        if (mstatusEl) mstatusEl.textContent = `Load: Normal (${loadPercent}%)`;
    }, 4000);

    class TxParticle {
        constructor() {
            this.reset();
            this.x = Math.random() * (canvas.width * 0.65);
        }

        reset() {
            this.x = -10;
            this.y = Math.random() * (canvas.height - 20) + 10;
            this.size = Math.random() * 4 + 2;
            this.speed = Math.random() * 0.4 + 0.2;
            this.opacity = Math.random() * 0.5 + 0.3;
            const colors = ['#00f0ff', '#0072ff', '#ffb800', '#ff5e00'];
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.isDeposited = false;
        }

        update() {
            if (!this.isDeposited) {
                this.x += this.speed;
                this.y += Math.sin(this.x * 0.05) * 0.2;

                if (this.x >= canvas.width * 0.7) {
                    this.isDeposited = true;
                    blockFills = Math.min(blockFills + 0.002, 1.0);
                }
            } else {
                const blockCenterX = canvas.width * 0.85;
                const blockCenterY = canvas.height * 0.5;
                
                this.x += (blockCenterX - this.x) * 0.08;
                this.y += (blockCenterY - this.y) * 0.08;
                this.opacity -= 0.02;

                if (this.opacity <= 0) {
                    this.reset();
                }
            }
        }

        draw() {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 4;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    const particles = [];
    const maxParticles = 40;
    for (let i = 0; i < maxParticles; i++) {
        particles.push(new TxParticle());
    }

    let lastMinedTime = Date.now();

    function animate() {
        const container = document.getElementById("bitcoin-network-explorer");
        if (!container || container.classList.contains("hidden")) {
            mempoolAnimationId = requestAnimationFrame(animate);
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(canvas.width * 0.7, 0);
        ctx.lineTo(canvas.width * 0.7, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        const blockX = canvas.width * 0.74;
        const blockY = canvas.height * 0.15;
        const blockW = canvas.width * 0.22;
        const blockH = canvas.height * 0.7;

        ctx.fillStyle = 'rgba(6, 6, 18, 0.6)';
        ctx.fillRect(blockX, blockY, blockW, blockH);

        ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
        ctx.fillRect(blockX, blockY + blockH * (1 - blockFills), blockW, blockH * blockFills);

        const timeSinceMined = Date.now() - lastMinedTime;
        let outlineColor = 'rgba(0, 240, 255, 0.25)';
        let shadowColor = 'rgba(0, 240, 255, 0.15)';
        let shadowBlurVal = 4;

        if (timeSinceMined < 800) {
            outlineColor = `rgba(0, 255, 136, ${1 - timeSinceMined / 800})`;
            shadowColor = `rgba(0, 255, 136, ${0.8 * (1 - timeSinceMined / 800)})`;
            shadowBlurVal = 15;
            
            ctx.fillStyle = '#00ff88';
            ctx.font = 'bold 9px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('BLOCK MINED!', blockX + blockW / 2, blockY + blockH / 2);
        } else {
            const pulse = 0.25 + Math.sin(Date.now() * 0.003) * 0.1;
            outlineColor = `rgba(0, 240, 255, ${pulse})`;
            shadowBlurVal = 4 + Math.sin(Date.now() * 0.003) * 3;
        }

        ctx.save();
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = shadowBlurVal;
        ctx.shadowColor = shadowColor;
        ctx.strokeRect(blockX, blockY, blockW, blockH);
        ctx.restore();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '7px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`SIZE: ${(blockFills * 3.8).toFixed(2)}MB`, blockX + 4, blockY + 12);
        ctx.fillText(`CAP: ${(blockFills * 100).toFixed(0)}%`, blockX + 4, blockY + 22);

        if (timeSinceMined > 15000) {
            lastMinedTime = Date.now();
            blockHeight += 1;
            if (heightEl) heightEl.textContent = blockHeight.toLocaleString();
            
            showToast("Global Block Confirmed", `Block #${blockHeight} successfully assembled and linked to mainchain by mining cooperative.`, "info");
            
            blockFills = 0.1 + Math.random() * 0.15;
            pendingTxs = Math.max(pendingTxs - Math.floor(Math.random() * 2000 + 1500), 10000);
            if (mtxEl) mtxEl.textContent = `${pendingTxs.toLocaleString()} Tx`;
        }

        mempoolAnimationId = requestAnimationFrame(animate);
    }

    animate();
}
function setupAddressAutoClear() {
    const ids = ["wallet-dep-addr", "dep-address-input", "with-address", "set-wallet-btc"];
    ids.forEach(id => {
        const input = document.getElementById(id);
        if (!input) return;
        
        let hasCleared = false;
        const autoClear = () => {
            if (!hasCleared) {
                const val = input.value.trim();
                if (val.toLowerCase().includes("example") || val.includes("bc1qxy2kg3ut") || val.includes("1A1zP1eP")) {
                    input.value = "";
                    input.dispatchEvent(new Event("input"));
                }
                hasCleared = true;
            }
        };
        input.addEventListener("focus", autoClear);
        input.addEventListener("click", autoClear);
    });
}

function setupAddressEventListeners() {
    const depAddrInput = document.getElementById("dep-address-input");
    if (depAddrInput) {
        depAddrInput.addEventListener("input", () => {
            const copyBtn = document.getElementById("dep-address-copy-btn");
            if (copyBtn) {
                copyBtn.disabled = !depAddrInput.value || depAddrInput.value.trim() === "" || depAddrInput.value.toLowerCase().includes("example");
            }
        });
    }

    const walletDepAddrInput = document.getElementById("wallet-dep-addr");
    if (walletDepAddrInput) {
        walletDepAddrInput.addEventListener("input", () => {
            const copyBtn = document.getElementById("wallet-dep-copy-btn");
            const stateEl = document.getElementById("wallet-dep-state");
            const val = walletDepAddrInput.value.trim();
            if (copyBtn) {
                copyBtn.disabled = !val || val === "" || val.toLowerCase().includes("example");
            }
            if (stateEl) {
                if (!val || val === "" || val.toLowerCase().includes("example")) {
                    stateEl.textContent = "No Deposit Address Configured";
                } else {
                    stateEl.textContent = "Deposit Address Active";
                }
            }
        });
    }
}

// Register administrative support notice modal handlers
function handleContactSubmit(e) {
    if (e) e.preventDefault();
    openAdminSupportModal();
}

function openAdminSupportModal() {
    const el = document.getElementById("admin-support-modal");
    if (el) {
        el.classList.remove("hidden");
        document.body.style.overflow = "hidden";
    }
}

function closeAdminSupportModal() {
    const el = document.getElementById("admin-support-modal");
    if (el) {
        el.classList.add("hidden");
        document.body.style.overflow = "";
    }
}

function handleMiranovaChatClick() {
    closeAdminSupportModal();
    const chatBox = document.querySelector(".chat-box");
    if (chatBox) {
        chatBox.classList.remove("hidden");
        const badge = document.querySelector(".chat-toggle-btn .chat-badge-dot");
        if (badge) badge.style.display = "none";
        
        const chatInput = document.getElementById("chat-input");
        if (chatInput) {
            setTimeout(() => {
                chatInput.focus();
            }, 100);
        }
    }
}

// --- MIRANOVA AI FRONTEND HANDLERS ---
function handleSendMessage(e) {
    if (e) e.preventDefault();
    
    const chatInput = document.getElementById("chat-input");
    if (!chatInput) return;
    
    const messageText = chatInput.value.trim();
    if (!messageText) return;
    
    // Clear input
    chatInput.value = "";
    chatInput.style.height = "auto";

    // Hide suggested questions
    const suggestedDiv = document.querySelector(".chat-suggested-questions");
    if (suggestedDiv) suggestedDiv.style.display = "none";
    
    const messagesContainer = document.getElementById("chat-messages-container");
    if (!messagesContainer) return;
    
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Append user message
    const userMsg = document.createElement("div");
    userMsg.className = "msg user";
    userMsg.innerHTML = `
        <p>${escapeHTML(messageText)}</p>
        <span class="msg-time">${timeStr}</span>
    `;
    messagesContainer.appendChild(userMsg);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Local support assistant response
    const supportResponseText = `Hello!

Thank you for contacting CRYPTOMIN Support.

Our live support team is available through our official Telegram Bot.

Please contact us here:

[@cryptomin_official_bot](https://t.me/cryptomin_official_bot)

[https://t.me/cryptomin_official_bot](https://t.me/cryptomin_official_bot)

Click the username above to open Telegram.

Our support team will assist you as soon as possible.

Thank you for choosing CRYPTOMIN.`;

    const formattedResponse = parseMarkdown(supportResponseText);

    // Append bot message instantly
    const botMsg = document.createElement("div");
    botMsg.className = "msg bot";
    botMsg.style.position = "relative";
    botMsg.innerHTML = `
        <p>${formattedResponse}</p>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
            <span class="msg-time">${timeStr}</span>
            <button onclick="copyToClipboard(this)" class="chat-copy-btn" title="Copy response" style="background: transparent; border: none; color: rgba(255, 255, 255, 0.4); font-size: 0.75rem; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; transition: color 0.2s;" onmouseover="this.style.color='#00f0ff'" onmouseout="this.style.color='rgba(255, 255, 255, 0.4)'"><i class="fa-regular fa-copy"></i> Copy</button>
        </div>
    `;
    messagesContainer.appendChild(botMsg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function escapeHTML(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function copyToClipboard(button) {
    const msgElement = button.closest(".msg");
    const textElement = msgElement.querySelector("p");
    if (!textElement) return;
    
    const textToCopy = textElement.innerText;
    
    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            const originalHTML = button.innerHTML;
            button.innerHTML = `<i class="fa-solid fa-check"></i> Copied`;
            button.style.color = "#00e676";
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.style.color = "rgba(255, 255, 255, 0.4)";
            }, 2000);
        })
        .catch(() => {
            showToast("Copy Failed", "Failed to copy content to clipboard.", "danger");
        });
}

function sendSuggestedQuestion(question) {
    const chatInput = document.getElementById("chat-input");
    if (chatInput) {
        chatInput.value = question;
        handleSendMessage(null);
    }
}

function clearMiranovaChat(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    if (!confirm("Clear your conversation history with Miranova AI?")) return;
    
    const messagesContainer = document.getElementById("chat-messages-container");
    if (messagesContainer) {
        while (messagesContainer.children.length > 1) {
            messagesContainer.removeChild(messagesContainer.lastChild);
        }
    }
    
    const suggestedDiv = document.querySelector(".chat-suggested-questions");
    if (suggestedDiv) suggestedDiv.style.display = "flex";
    
    showToast("Chat Cleared", "Miranova session has been reset.", "info");
}

// Client-side markdown parser
function parseMarkdown(text) {
    if (!text) return "";
    
    let html = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Parse Markdown Links: [text](url)
    html = html.replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\)/g, (match, linkText, url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #00f0ff; text-decoration: underline; font-weight: 600; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">${linkText}</a>`;
    });

    // 1. Code blocks: ```code```
    html = html.replace(/```(?:[a-zA-Z0-9]+)?\n([\s\S]*?)\n```/g, (match, code) => {
        return `<pre style="background: rgba(8, 8, 22, 0.95); border: 1px solid rgba(0, 240, 255, 0.2); padding: 12px; border-radius: 8px; overflow-x: auto; margin: 12px 0; font-family: monospace; font-size: 0.85rem; color: #a5f3fc;"><code style="background: transparent; padding: 0; color: inherit;">${code}</code></pre>`;
    });

    // 2. Inline code: `code`
    html = html.replace(/`([^`]+)`/g, '<code style="background: rgba(0, 240, 255, 0.1); border: 1px solid rgba(0, 240, 255, 0.2); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.85rem; color: #00f0ff;">$1</code>');

    // 3. Tables
    const lines = html.split('\n');
    let inTable = false;
    let tableRows = [];
    let processedLines = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('|') && line.endsWith('|')) {
            if (!inTable) {
                inTable = true;
                tableRows = [];
            }
            const cols = line.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
            tableRows.push(cols);
        } else {
            if (inTable) {
                let tableHtml = '<div style="overflow-x: auto; margin: 12px 0;"><table style="width: 100%; border-collapse: collapse; border: 1px solid rgba(255, 255, 255, 0.1); font-family: \'Outfit\', sans-serif; font-size: 0.85rem;">';
                tableRows.forEach((row, rowIdx) => {
                    const isSeparator = row.every(col => col.match(/^-+$/) || col === "");
                    if (isSeparator) return;

                    tableHtml += '<tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.08);">';
                    row.forEach(col => {
                        const cellStyle = 'padding: 8px 12px; text-align: left;';
                        if (rowIdx === 0) {
                            tableHtml += `<th style="${cellStyle} background: rgba(255, 255, 255, 0.03); color: #00f0ff; font-weight: 700;">${col}</th>`;
                        } else {
                            tableHtml += `<td style="${cellStyle} color: #cbd5e1;">${col}</td>`;
                        }
                    });
                    tableHtml += '</tr>';
                });
                tableHtml += '</table></div>';
                processedLines.push(tableHtml);
                inTable = false;
            }
            processedLines.push(lines[i]);
        }
    }
    if (inTable) {
        let tableHtml = '<div style="overflow-x: auto; margin: 12px 0;"><table style="width: 100%; border-collapse: collapse; border: 1px solid rgba(255, 255, 255, 0.1); font-family: \'Outfit\', sans-serif; font-size: 0.85rem;">';
        tableRows.forEach((row, rowIdx) => {
            const isSeparator = row.every(col => col.match(/^-+$/) || col === "");
            if (isSeparator) return;

            tableHtml += '<tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.08);">';
            row.forEach(col => {
                const cellStyle = 'padding: 8px 12px; text-align: left;';
                if (rowIdx === 0) {
                    tableHtml += `<th style="${cellStyle} background: rgba(255, 255, 255, 0.03); color: #00f0ff; font-weight: 700;">${col}</th>`;
                } else {
                    tableHtml += `<td style="${cellStyle} color: #cbd5e1;">${col}</td>`;
                }
            });
            tableHtml += '</tr>';
        });
        tableHtml += '</table></div>';
        processedLines.push(tableHtml);
    }
    html = processedLines.join('\n');

    // 4. Bullet lists
    const listLines = html.split('\n');
    let inList = false;
    let listProcessed = [];
    for (let i = 0; i < listLines.length; i++) {
        const line = listLines[i].trim();
        const listMatch = line.match(/^[\-\*]\s+(.*)$/);
        if (listMatch) {
            if (!inList) {
                inList = true;
                listProcessed.push('<ul style="margin: 8px 0; padding-left: 20px; list-style-type: disc; color: #cbd5e1;">');
            }
            listProcessed.push(`<li style="margin-bottom: 4px; line-height: 1.5;">${listMatch[1]}</li>`);
        } else {
            if (inList) {
                listProcessed.push('</ul>');
                inList = false;
            }
            listProcessed.push(listLines[i]);
        }
    }
    if (inList) {
        listProcessed.push('</ul>');
    }
    html = listProcessed.join('\n');

    // 5. Bold: **text**
    html = html.replace(/\*\*([^\*]+)\*\*/g, '<strong style="color: #ffffff; font-weight: 700;">$1</strong>');

    // 6. Italic: *text*
    html = html.replace(/\*([^\*]+)\*/g, '<em style="color: #cbd5e1;">$1</em>');

    // 7. Paragraphs & Line breaks:
    html = html.replace(/\n/g, '<br>');

    return html;
}

// Register initialization on document ready
document.addEventListener("DOMContentLoaded", () => {
    initCountryDropdown();
    initDepositCoinSelector();
    setupAddressAutoClear();
    setupAddressEventListeners();

    // Register deposit modal click/keydown handlers
    const depModal = document.getElementById("deposit-modal");
    if (depModal) {
        depModal.addEventListener("click", (e) => {
            if (e.target === depModal) {
                closeDepositModal();
            }
        });
    }

    // Register auth required modal click/keydown handlers
    const authReqModal = document.getElementById("auth-required-modal");
    if (authReqModal) {
        authReqModal.addEventListener("click", (e) => {
            if (e.target === authReqModal) {
                closeAuthRequiredModal();
            }
        });
    }

    // Register administrative support notice modal click/keydown handlers
    const adminSupportModal = document.getElementById("admin-support-modal");
    if (adminSupportModal) {
        adminSupportModal.addEventListener("click", (e) => {
            if (e.target === adminSupportModal) {
                closeAdminSupportModal();
            }
        });
    }

    // Textarea Enter sends, Shift+Enter newlines, and dynamically adjusts height
    const chatInput = document.getElementById("chat-input");
    if (chatInput) {
        chatInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                const form = chatInput.closest("form");
                if (form) {
                    form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
                }
            }
        });

        chatInput.addEventListener("input", function() {
            this.style.height = "auto";
            this.style.height = Math.min(this.scrollHeight, 80) + "px";
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            const depModal = document.getElementById("deposit-modal");
            if (depModal && !depModal.classList.contains("hidden")) {
                closeDepositModal();
            }
            const authReqModal = document.getElementById("auth-required-modal");
            if (authReqModal && !authReqModal.classList.contains("hidden")) {
                closeAuthRequiredModal();
            }
            const adminSupportModal = document.getElementById("admin-support-modal");
            if (adminSupportModal && !adminSupportModal.classList.contains("hidden")) {
                closeAdminSupportModal();
            }
        }
    });

    // Dismiss dashboard sidebar on click outside
    document.addEventListener("click", (e) => {
        const sidebar = document.getElementById("db-sidebar");
        const toggleBtn = document.querySelector(".db-sidebar-toggle");
        if (sidebar && sidebar.classList.contains("active")) {
            if (!sidebar.contains(e.target) && (!toggleBtn || !toggleBtn.contains(e.target))) {
                sidebar.classList.remove("active");
            }
        }
    });
});

// Mobile dashboard sidebar toggle function
function toggleDbSidebar() {
    const sidebar = document.getElementById("db-sidebar");
    if (sidebar) {
        sidebar.classList.toggle("active");
    }
}


