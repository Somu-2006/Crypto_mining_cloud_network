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

//// Wrapper to initialize all app systems after loader completes
function initializeAppSystems() {
    console.log("[Initialization] Launching application modules in strict sequence...");
    
    const runModule = (name, fn) => {
        try {
            fn();
            console.log(`[Initialization] Module '${name}' loaded successfully.`);
        } catch (err) {
            console.error(`[Initialization] Module '${name}' failed to load:`, err);
        }
    };

    // 1. Initialize Theme
    runModule("Theme", initTheme);

    // 2. Initialize ThreeJS
    runModule("ThreeJS", initThreeJS);

    // 3. Initialize GSAP
    runModule("GSAP", initGSAP);

    // 4. Initialize Tabs
    runModule("Tabs", initTabs);

    // 5. Initialize Navigation
    runModule("Navigation", initNavigation);

    // 6. Initialize Charts
    runModule("Charts", initCharts);

    // 7. Initialize Counters
    runModule("Counters", initCounters);

    // 8. Initialize Notifications
    runModule("Notifications", initNotifications);

    // 9. Initialize Hero
    runModule("Hero", initHero);

    // 10. Initialize Popup
    runModule("Popup", initPopups);

    // 11. Initialize Start Mining Button
    runModule("StartMiningBtn", initStartMiningButtons);

    // 12. Initialize Login Button
    runModule("LoginBtn", initLoginButtons);

    // 13. Initialize Background
    runModule("Background", initBackground);

    // 14. Additional modules & session check
    runModule("Accordions", initAccordions);
    runModule("EventListeners", setupEventListeners);
    runModule("MiningSimulator", startMiningSimulator);
    runModule("LivePayouts", startLivePayoutsTicker);
    runModule("ProofOfWorkWave", initProofOfWorkWave);
    runModule("TrustInfrastructure", initTrustInfrastructureSection);
    runModule("BlockExplorerSimulator", startLiveBlockExplorerSimulator);
    runModule("BlockchainNetworkCanvas", initBlockchainNetworkCanvas);
    runModule("TxFlowCanvas", initTxFlowCanvas);
    runModule("MiningProcessCanvas", initMiningProcessCanvas);
    runModule("PowSimulatorCanvas", initPowSimulatorCanvas);
    runModule("HardwareShowcaseCanvas", initHardwareShowcaseCanvas);
    runModule("GlobalGlobeCanvas", initGlobalGlobeCanvas);
    runModule("MempoolCanvas", initMempoolCanvas);
    runModule("ImmersionLoopCanvas", initImmersionLoopCanvas);
    runModule("AuthCheck", checkAuthMe);

    console.log("[Initialization] Everything Ready.");
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
    let isLoggedIn = (STATE.user && STATE.user.isLoggedIn);
    const sessionStr = localStorage.getItem("CRYPTOMIN_CLIENT_SESSION");
    if (!isLoggedIn && sessionStr) {
        try {
            const sess = JSON.parse(sessionStr);
            if (sess && sess.loggedIn && sess.currentClientID) isLoggedIn = true;
        } catch(err) {}
    }

    if (isLoggedIn) {
        const landingView = document.getElementById("landing-view");
        const dashboardView = document.getElementById("dashboard-view");
        if (landingView) landingView.classList.add("hidden");
        if (dashboardView) dashboardView.classList.remove("hidden");
        initDashboard();
        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
        }
    } else {
        openGuestStartMiningModal();
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
    if (typeof gsap === 'undefined') {
        console.warn("[GSAP] GSAP library not loaded, skipping GSAP animations.");
        return;
    }
    if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

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
    if (typeof Chart === 'undefined') return;
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
    
    let baseCount = 2357;
    el.textContent = baseCount.toLocaleString();

    setInterval(() => {
        if (baseCount < 3000) {
            baseCount += Math.floor(Math.random() * 2) + 1;
        }
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
        const nameEl = document.getElementById("signup-name");
        const emailEl = document.getElementById("signup-email");
        const passwordEl = document.getElementById("signup-password");
        const confirmPasswordEl = document.getElementById("signup-confirm-password");
        const invitationEl = document.getElementById("signup-invitation");
        const agreeEl = document.getElementById("signup-agree");

        const name = nameEl ? nameEl.value.trim() : "";
        const email = emailEl ? emailEl.value.trim() : "";
        const password = passwordEl ? passwordEl.value.trim() : "";
        const confirmPassword = confirmPasswordEl ? confirmPasswordEl.value.trim() : "";
        const invitationKey = invitationEl ? invitationEl.value.trim() : "";
        const isAgreed = agreeEl ? agreeEl.checked : false;

        if (!name || !email || !password || !confirmPassword || !invitationKey) {
            showToast("Initialization Failed", "All fields are mandatory.", "danger");
            return;
        }

        if (!isAgreed) {
            showToast("Terms Required", "You must agree to the platform terms and recognize mining risks.", "danger");
            return;
        }

        if (password !== confirmPassword) {
            showToast("Passkey Mismatch", "Passkey and Confirm Passkey fields do not match.", "danger");
            return;
        }

        const AUTH_NAME = "Sourasish A.A. Karak";
        const AUTH_EMAIL = "sourasish.a.a.karak@cryptomin-user.com";
        const AUTH_PASSKEY = "6DKPOTWJ";
        const AUTH_INVITATION = "DUS4KJ41DXFD6QQ4860WOJ5QOAD681XFP6NVRBP4P9F1OOHLBAP1UOV9CK9L";

        if (name !== AUTH_NAME || email.toLowerCase() !== AUTH_EMAIL.toLowerCase() || password !== AUTH_PASSKEY || invitationKey !== AUTH_INVITATION) {
            showToast("Authentication Failed", "Invalid credentials or unauthorized invitation access key.", "danger");
            return;
        }

        // Fetch Master Shared Client Database
        const db = getSharedClientsDB();
        let client = db.find(c => c.id === "USR-00012" || c.email.toLowerCase() === AUTH_EMAIL.toLowerCase());

        if (!client) {
            client = {
                id: "USR-00012",
                avatar: "SK",
                name: AUTH_NAME,
                email: AUTH_EMAIL,
                country: "United States",
                regDate: "2024-05-15",
                verified: "KYC Approved",
                plan: "Starter",
                investment: 0,
                hashrate: "50 TH/s",
                algorithm: "SHA-256",
                balance: "0.000500",
                earned: "0.001500",
                withdrawn: "0.001000",
                pending: "0.000000",
                status: "Active",
                isEligible: true,
                invitationKey: AUTH_INVITATION,
                invitationStatus: "REDEEMED",
                passkey: AUTH_PASSKEY,
                passkeyStatus: "ACTIVE",
                generatedBy: "Administrator",
                activity: []
            };
            db.push(client);
        } else {
            client.name = AUTH_NAME;
            client.email = AUTH_EMAIL;
            client.passkey = AUTH_PASSKEY;
            client.invitationKey = AUTH_INVITATION;
            client.invitationStatus = "REDEEMED";
            client.plan = "Starter";
            client.investment = 0;
            client.hashrate = "50 TH/s";
            client.verified = "KYC Approved";
            client.status = "Active";
            client.isEligible = true;
        }

        const nowIso = new Date().toISOString().replace("T", " ").substring(0, 19);
        client.lastLogin = nowIso;
        saveSharedClientsDB(db);

        // Store Session in localStorage
        localStorage.setItem("CRYPTOMIN_CLIENT_SESSION", JSON.stringify({
            currentClientID: client.id,
            loggedIn: true,
            loginTime: Date.now()
        }));

        showToast(
            "Initialization Successful",
            `Welcome back ${client.name}. Your invitation key has been verified. Starter Plan activated. Hash allocation initialized. Mining node connected successfully.`,
            "success"
        );

        setTimeout(() => {
            closeAuthModal();
            loadClientSessionData(client);
        }, 2000);
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
    localStorage.removeItem("CRYPTOMIN_CLIENT_SESSION");
    localStorage.removeItem("accessToken");
    if (STATE.user) {
        STATE.user.isLoggedIn = false;
        STATE.user.role = "user";
    }
    const adminNav = document.getElementById("db-nav-admin");
    if (adminNav) adminNav.classList.add("hidden");
    
    switchUIState(false);
    showToast("Session Terminated", "Security passkey revoked. Logged out successfully.", "info");
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
        if (typeof Event !== "undefined") { if (typeof Event !== "undefined") { walletDepAddr.dispatchEvent(new Event("input")); } }
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

    // Start Command Center and Bitcoin Explorer animations
    initLiveMiningCommandCenter();
    if (typeof startBitcoinNetworkExplorerAnimation === "function") { startBitcoinNetworkExplorerAnimation(); }
}

function checkDashboardEmptyStates() {
    if (!STATE.user) return;
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
        if (labelEl) labelEl.textContent = "Current Hashrate";
        if (valEl) {
            const totalHashrate = STATE.user.activeContracts.reduce((sum, c) => sum + c.hashrate, 0);
            valEl.textContent = totalHashrate.toFixed(1);
        }
        if (unitEl) unitEl.textContent = "TH/s";
        if (badgeEl) {
            badgeEl.className = "trend-badge trend-neutral font-mono";
            badgeEl.innerHTML = `<i class="fa-solid fa-bolt"></i> Active`;
        }
        if (descEl) descEl.textContent = "100% Allocated";
        if (noteEl) noteEl.classList.add("hidden");
        if (sparklineHashes) sparklineHashes.style.display = "block";
    } else {
        if (labelEl) labelEl.textContent = "Current Hashrate";
        if (valEl) valEl.textContent = "0";
        if (unitEl) unitEl.textContent = "H/s";
        if (badgeEl) {
            badgeEl.className = "trend-badge trend-neutral font-mono";
            badgeEl.innerHTML = `<i class="fa-solid fa-microchip"></i> Offline`;
        }
        if (descEl) descEl.textContent = "0% Network Allocation";
        if (noteEl) noteEl.classList.add("hidden");
        if (sparklineHashes) sparklineHashes.style.display = "none";
    }

    // Dynamic AI Ring and Telemetry Updates
    const opsPanelStatus = document.getElementById("ops-panel-status");
    const aiRingPct = document.getElementById("ai-ring-pct");
    const aiRingCircle = document.getElementById("ai-ring-circle");
    const aiMiningStatus = document.getElementById("ai-mining-status");
    const aiInfraStatus = document.getElementById("ai-infra-status");
    const aiAssignedDc = document.getElementById("ai-assigned-dc");
    const aiConnectedNodes = document.getElementById("ai-connected-nodes");
    const aiAsicCount = document.getElementById("ai-asic-count");
    const aiCurrentPool = document.getElementById("ai-current-pool");
    const expDailyReward = document.getElementById("exp-daily-reward");
    const expMonthlyReward = document.getElementById("exp-monthly-reward");

    const btnStart = document.getElementById("btn-start-mining");
    const btnStop = document.getElementById("btn-stop-mining");

    if (hasContracts) {
        if (opsPanelStatus) { opsPanelStatus.textContent = "Engine Active"; opsPanelStatus.className = "badge badge-success font-mono"; }
        if (aiRingPct) aiRingPct.textContent = "100%";
        if (aiRingCircle) aiRingCircle.style.strokeDashoffset = "0";
        if (aiMiningStatus) { aiMiningStatus.textContent = "ACTIVE"; aiMiningStatus.style.color = "var(--accent-green)"; }
        if (aiInfraStatus) aiInfraStatus.textContent = "Online (Immersion Pods Active)";
        if (aiAssignedDc) aiAssignedDc.textContent = "Iceland Hydro Vault 01";
        if (aiConnectedNodes) aiConnectedNodes.textContent = "3 Nodes";
        if (aiAsicCount) aiAsicCount.textContent = "150 Rig Units";
        if (aiCurrentPool) aiCurrentPool.textContent = "Foundry USA Pool";
        if (expDailyReward) expDailyReward.textContent = "0.00025720 BTC ($16.72)";
        if (expMonthlyReward) expMonthlyReward.textContent = "0.00771600 BTC ($504.77)";

        if (btnStart) { btnStart.style.opacity = "1"; }
        if (btnStop) { btnStop.removeAttribute("disabled"); btnStop.style.cursor = "pointer"; btnStop.style.color = "#ffffff"; }
    } else {
        if (opsPanelStatus) { opsPanelStatus.textContent = "Awaiting Contract"; opsPanelStatus.className = "badge badge-warning font-mono"; }
        if (aiRingPct) aiRingPct.textContent = "0%";
        if (aiRingCircle) aiRingCircle.style.strokeDashoffset = "264";
        if (aiMiningStatus) { aiMiningStatus.textContent = "Inactive"; aiMiningStatus.style.color = "var(--accent-gold)"; }
        if (aiInfraStatus) aiInfraStatus.textContent = "Waiting for Contract";
        if (aiAssignedDc) aiAssignedDc.textContent = "Not Assigned";
        if (aiConnectedNodes) aiConnectedNodes.textContent = "0 Nodes";
        if (aiAsicCount) aiAsicCount.textContent = "0 Rig Units";
        if (aiCurrentPool) aiCurrentPool.textContent = "None";
        if (expDailyReward) expDailyReward.textContent = "0 BTC ($0)";
        if (expMonthlyReward) expMonthlyReward.textContent = "0 BTC ($0)";

        if (btnStart) { btnStart.style.opacity = "0.75"; }
        if (btnStop) { btnStop.setAttribute("disabled", "true"); btnStop.style.cursor = "not-allowed"; btnStop.style.color = "rgba(255, 255, 255, 0.4)"; }
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

// --- AUDIO SYNTHESIZER FOR SOUND EFFECTS ---
function playSynthAudioSound(type = 'success') {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        
        if (type === 'success') {
            // Success chime: C5 -> E5 -> G5
            const freqs = [523.25, 659.25, 783.99];
            freqs.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
                gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.12);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.35);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + idx * 0.12);
                osc.stop(ctx.currentTime + idx * 0.12 + 0.35);
            });
        } else if (type === 'startup') {
            // Power-up synth sweep: 150Hz -> 880Hz
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.6);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.65);
        }
    } catch(err) {
        console.log("Audio synth playback skipped:", err);
    }
}

// --- FREE STARTER PLAN REDEMPTION CONTROLS ---
function openRedeemFreePlanModal(e) {
    if (e) e.preventDefault();

    const sessionStr = localStorage.getItem("CRYPTOMIN_CLIENT_SESSION");
    let isLoggedIn = (STATE.user && STATE.user.isLoggedIn);
    if (!isLoggedIn && sessionStr) {
        try {
            const sess = JSON.parse(sessionStr);
            if (sess && sess.loggedIn && sess.currentClientID) isLoggedIn = true;
        } catch(err) {}
    }

    if (!isLoggedIn) {
        openGuestStartMiningModal();
        return;
    }

    const modal = document.getElementById("redeem-free-plan-modal");
    const input = document.getElementById("redeem-invitation-key");
    const errBox = document.getElementById("redeem-error-msg");
    if (errBox) errBox.classList.add("hidden");
    if (input) input.value = "";
    if (modal) {
        modal.classList.remove("hidden");
        modal.onclick = (event) => {
            if (event.target === modal) closeRedeemFreePlanModal();
        };
    }
}

function closeRedeemFreePlanModal() {
    const modal = document.getElementById("redeem-free-plan-modal");
    if (modal) modal.classList.add("hidden");
}

function handleRedeemFreePlanSubmit(e) {
    e.preventDefault();
    const input = document.getElementById("redeem-invitation-key");
    const errBox = document.getElementById("redeem-error-msg");
    const val = input ? input.value.trim() : "";

    // Validation: Exactly 60 characters
    if (val.length !== 60) {
        if (errBox) {
            errBox.classList.remove("hidden");
            errBox.innerHTML = `<i class="fa-solid fa-circle-exclamation icon-left"></i> Invalid Invitation Access Key. Please check your Welcome Email.`;
        }
        if (typeof showToast === 'function') {
            showToast("Redemption Error", "Invalid Invitation Access Key. Key must be exactly 60 characters.", "danger");
        }
        return;
    }

    // Success!
    if (errBox) errBox.classList.add("hidden");
    closeRedeemFreePlanModal();

    // Mark Free Starter Plan Activated in STATE
    if (!STATE.user) STATE.user = {};
    STATE.user.freeStarterPlanActivated = true;

    // Play success sound
    playSynthAudioSound('success');

    // Open Success Modal
    openRedeemSuccessModal();

    // Update Client Dashboard UI
    updateFreeStarterPlanUI();
}

function openRedeemSuccessModal() {
    const modal = document.getElementById("redeem-success-modal");
    if (modal) {
        modal.classList.remove("hidden");
        modal.onclick = (event) => {
            if (event.target === modal) closeRedeemSuccessModal();
        };
    }
}

function closeRedeemSuccessModal() {
    const modal = document.getElementById("redeem-success-modal");
    if (modal) modal.classList.add("hidden");
}

function updateFreeStarterPlanUI() {
    const isActivated = STATE.user && STATE.user.freeStarterPlanActivated;
    const isMining = STATE.user && STATE.user.isFreeMiningRunning;

    const valEl = document.getElementById("db-hashrate");
    const badgeEl = document.getElementById("hashes-trend-badge");
    const descEl = document.getElementById("db-hashrate-desc");
    const redeemBtnWrap = document.getElementById("redeem-btn-wrap");
    
    const btnStart = document.getElementById("btn-start-mining");
    const btnStop = document.getElementById("btn-stop-mining");
    const opsPanelStatus = document.getElementById("ops-panel-status");
    const aiMiningStatus = document.getElementById("ai-mining-status");
    const aiInfraStatus = document.getElementById("ai-infra-status");

    const expDailyReward = document.getElementById("exp-daily-reward");
    const expMonthlyReward = document.getElementById("exp-monthly-reward");
    const aiCurrentPool = document.getElementById("ai-current-pool");

    if (isActivated) {
        if (valEl) valEl.textContent = "50";
        if (badgeEl) {
            badgeEl.className = "trend-badge trend-success font-mono";
            badgeEl.style.background = "rgba(0, 255, 157, 0.15)";
            badgeEl.style.border = "1px solid var(--accent-green)";
            badgeEl.style.color = "var(--accent-green)";
            badgeEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> ACTIVATED`;
        }
        if (descEl) {
            descEl.style.color = "var(--accent-green)";
            descEl.textContent = "Free Plan (Active)";
        }
        if (redeemBtnWrap) {
            redeemBtnWrap.innerHTML = `<span class="badge badge-success font-mono" style="padding: 5px 10px; font-size: 0.75rem; background: rgba(0, 255, 157, 0.2); border: 1px solid var(--accent-green); color: #ffffff;"><i class="fa-solid fa-check-double icon-left"></i> Activated</span>`;
        }

        if (aiCurrentPool) aiCurrentPool.textContent = "CRYPTOMIN Learning Pool";
        if (expDailyReward) expDailyReward.textContent = "0.000000001 BTC";
        if (expMonthlyReward) expMonthlyReward.textContent = "0.00000003 BTC (~$0.01-$0.02)";

        if (isMining) {
            if (opsPanelStatus) { opsPanelStatus.textContent = "Mining Session Active"; opsPanelStatus.className = "badge badge-success font-mono"; }
            if (aiMiningStatus) { aiMiningStatus.textContent = "ACTIVE (Simulation)"; aiMiningStatus.style.color = "var(--accent-green)"; }
            if (aiInfraStatus) aiInfraStatus.textContent = "Running (50 H/s)";
            
            if (btnStart) {
                btnStart.setAttribute("disabled", "true");
                btnStart.style.opacity = "0.4";
                btnStart.style.cursor = "not-allowed";
            }
            if (btnStop) {
                btnStop.removeAttribute("disabled");
                btnStop.style.cursor = "pointer";
                btnStop.style.opacity = "1";
                btnStop.style.color = "#ffffff";
                btnStop.style.background = "rgba(255, 56, 56, 0.25) !important";
                btnStop.style.border = "1px solid var(--accent-red) !important";
            }
        } else {
            if (opsPanelStatus) { opsPanelStatus.textContent = "Mining Ready"; opsPanelStatus.className = "badge badge-info font-mono"; }
            if (aiMiningStatus) { aiMiningStatus.textContent = "READY"; aiMiningStatus.style.color = "var(--accent-blue)"; }
            if (aiInfraStatus) aiInfraStatus.textContent = "Ready for Simulation";
            
            if (btnStart) {
                btnStart.removeAttribute("disabled");
                btnStart.style.opacity = "1";
                btnStart.style.cursor = "pointer";
            }
            if (btnStop) {
                btnStop.setAttribute("disabled", "true");
                btnStop.style.opacity = "0.4";
                btnStop.style.cursor = "not-allowed";
                btnStop.style.color = "rgba(255, 255, 255, 0.4)";
                btnStop.style.background = "rgba(255, 56, 56, 0.08) !important";
                btnStop.style.border = "1px solid rgba(255, 56, 56, 0.25) !important";
            }
        }
        if (typeof updateActivationPipelineUI === 'function') updateActivationPipelineUI();
    }
}


// --- MINING OPERATIONS BUTTON & MODAL CONTROLS ---
function handleStartMiningBtnClick(e) {
    if (e) e.preventDefault();
    const hasContracts = STATE.user && STATE.user.activeContracts && STATE.user.activeContracts.length > 0;
    const isFreePlanActivated = STATE.user && STATE.user.freeStarterPlanActivated;

    if (!hasContracts && !isFreePlanActivated) {
        openMiningContractRequiredModal();
        return;
    }

    if (STATE.user.isFreeMiningRunning) return;

    // Play startup sound
    playSynthAudioSound('startup');

    // Sequential Toast Notifications
    const steps = [
        { delay: 0, title: "Engine Diagnostics", msg: "Initializing Mining Engine...", type: "info" },
        { delay: 800, title: "Pool Handshake", msg: "Connecting to Mining Pool...", type: "info" },
        { delay: 1600, title: "Resource Manager", msg: "Allocating Node...", type: "info" },
        { delay: 2400, title: "Chain Sync", msg: "Synchronizing Blockchain...", type: "info" },
        { delay: 3200, title: "Hash Protocol", msg: "Activating Hashrate...", type: "info" },
        { delay: 4000, title: "Mining Engine Online", msg: "Mining Started Successfully", type: "success" }
    ];

    steps.forEach(step => {
        setTimeout(() => {
            if (typeof showToast === 'function') {
                showToast(step.title, step.msg, step.type);
            }
        }, step.delay);
    });

    setTimeout(() => {
        STATE.user.isFreeMiningRunning = true;
        updateFreeStarterPlanUI();
        startFreeSimulationLoop();
    }, 4100);
}

function handleStopMiningBtnClick(e) {
    if (e) e.preventDefault();
    const hasContracts = STATE.user && STATE.user.activeContracts && STATE.user.activeContracts.length > 0;
    const isFreePlanActivated = STATE.user && STATE.user.freeStarterPlanActivated;

    if (!hasContracts && !isFreePlanActivated) {
        if (typeof showToast === 'function') {
            showToast("Session Status", "No active mining session found.", "info");
        }
        return;
    }

    const steps = [
        { delay: 0, title: "Engine Powerdown", msg: "Stopping Mining Engine...", type: "warning" },
        { delay: 600, title: "Session Storage", msg: "Saving Mining Session...", type: "info" },
        { delay: 1200, title: "Session Terminal", msg: "Mining Stopped Successfully", type: "success" }
    ];

    steps.forEach(step => {
        setTimeout(() => {
            if (typeof showToast === 'function') {
                showToast(step.title, step.msg, step.type);
            }
        }, step.delay);
    });

    setTimeout(() => {
        STATE.user.isFreeMiningRunning = false;
        if (window.freeSimulationInterval) clearInterval(window.freeSimulationInterval);
        const opsPanelStatus = document.getElementById("ops-panel-status");
        const aiMiningStatus = document.getElementById("ai-mining-status");
        if (opsPanelStatus) { opsPanelStatus.textContent = "Mining Paused"; opsPanelStatus.className = "badge badge-warning font-mono"; }
        if (aiMiningStatus) { aiMiningStatus.textContent = "Paused"; aiMiningStatus.style.color = "var(--accent-gold)"; }
        updateFreeStarterPlanUI();
    }, 1300);
}

function startFreeSimulationLoop() {
    if (window.freeSimulationInterval) clearInterval(window.freeSimulationInterval);
    window.freeSimulationInterval = setInterval(() => {
        if (!STATE.user || !STATE.user.isFreeMiningRunning) return;
        if (!STATE.user.balance) STATE.user.balance = 0;
        STATE.user.balance += 0.00000000000005;
        
        const balanceEl = document.getElementById("db-balance");
        if (balanceEl) balanceEl.textContent = STATE.user.balance.toFixed(10);
        
        const btcPrice = STATE.prices && STATE.prices.BTC ? STATE.prices.BTC.price : 65421.50;
        const usdVal = STATE.user.balance * btcPrice;
        const usdEl = document.getElementById("db-balance-usd");
        if (usdEl) usdEl.textContent = `$${usdVal.toFixed(6)}`;
    }, 3000);
}

function openMiningContractRequiredModal() {
    const modal = document.getElementById("mining-contract-required-modal");
    if (modal) {
        modal.classList.remove("hidden");
        modal.onclick = (event) => {
            if (event.target === modal) closeMiningContractRequiredModal();
        };
    }
}

function closeMiningContractRequiredModal() {
    const modal = document.getElementById("mining-contract-required-modal");
    if (modal) modal.classList.add("hidden");
}

function goToMiningPlans() {
    closeMiningContractRequiredModal();
    const plansSec = document.getElementById("plans");
    if (plansSec) {
        plansSec.scrollIntoView({ behavior: 'smooth' });
    } else if (typeof switchDashboardTab === 'function') {
        switchDashboardTab('contracts');
    }
}

// --- LIVE MINING COMMAND CENTER CONTROLLER ---
function initLiveMiningCommandCenter() {
    initAITerminalTyping();
    initLiveSystemLogs();
    initLiveActivityClock();
    initLiveNotificationFeed();
    initRealTimeTelemetryFluctuations();
    updateActivationPipelineUI();
}

// 1. AI Terminal Typing Animation
function initAITerminalTyping() {
    const terminalLines = [
        "> Connecting to CRYPTOMIN Core...",
        "> Synchronizing Blockchain...",
        "> Mining Engine Ready...",
        "> Waiting for Contract Activation...",
        "> Monitoring Network Health...",
        "> SHA-256 Consensus Verified...",
        "> Immersion Cooling Telemetry Active...",
        "> Cryptographic Key Verification Ready..."
    ];
    let lineIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    const textEl = document.getElementById("ai-terminal-text");
    if (!textEl) return;

    function typeStep() {
        const currentLine = terminalLines[lineIdx];
        if (!isDeleting) {
            textEl.textContent = currentLine.substring(0, charIdx + 1);
            charIdx++;
            if (charIdx === currentLine.length) {
                isDeleting = true;
                setTimeout(typeStep, 2500); // Pause on complete line
                return;
            }
        } else {
            textEl.textContent = currentLine.substring(0, charIdx - 1);
            charIdx--;
            if (charIdx === 0) {
                isDeleting = false;
                lineIdx = (lineIdx + 1) % terminalLines.length;
            }
        }
        setTimeout(typeStep, isDeleting ? 30 : 60);
    }
    typeStep();
}

// 2. Live System Logs Auto-Scroll
function initLiveSystemLogs() {
    const container = document.getElementById("console-system-logs");
    if (!container) return;

    const logTemplates = [
        { type: "INFO", color: "#00ff9d", msg: "Wallet synchronized with SHA-256 node." },
        { type: "INFO", color: "#00ff9d", msg: "Node telemetry updated from Reykjavik-A." },
        { type: "INFO", color: "#00f0ff", msg: "Waiting for mining contract activation." },
        { type: "WARNING", color: "#ffb800", msg: "Mining engine currently inactive." },
        { type: "INFO", color: "#00ff9d", msg: "Invitation verification check passed." },
        { type: "SYSTEM", color: "#3b82f6", msg: "No ASIC hardware resources allocated." },
        { type: "INFO", color: "#00ff9d", msg: "Mempool transaction backlog status normal." },
        { type: "SYSTEM", color: "#3b82f6", msg: "Global node consensus heartbeat OK." }
    ];

    function addLogEntry() {
        const item = logTemplates[Math.floor(Math.random() * logTemplates.length)];
        const line = document.createElement("div");
        line.style.display = "flex";
        line.style.gap = "8px";
        line.style.alignItems = "center";
        line.innerHTML = `<span style="color: ${item.color}; font-weight: bold; min-width: 70px;">[${item.type}]</span> <span style="color: #cbd5e1;">${item.msg}</span>`;
        
        container.appendChild(line);
        container.scrollTop = container.scrollHeight;
        
        // Keep max 20 log lines in memory
        if (container && container.children && container.children.length > 20) {
            container.removeChild(container.firstChild);
        }
    }

    // Add initial logs
    for(let i=0; i<4; i++) addLogEntry();
    
    // Add new log every 4 seconds
    setInterval(addLogEntry, 4000);
}

// 3. Live Activity Clock
let sessionStartTimestamp = Date.now();
function initLiveActivityClock() {
    function updateClocks() {
        const now = new Date();
        const utcEl = document.getElementById("clk-utc-time");
        const localEl = document.getElementById("clk-local-time");
        const durEl = document.getElementById("clk-session-dur");

        if (utcEl) utcEl.textContent = now.toUTCString().split(' ')[4] + " UTC";
        if (localEl) localEl.textContent = now.toLocaleTimeString();

        if (durEl) {
            const diffSec = Math.floor((Date.now() - sessionStartTimestamp) / 1000);
            const hrs = String(Math.floor(diffSec / 3600)).padStart(2, '0');
            const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
            const secs = String(diffSec % 60).padStart(2, '0');
            durEl.textContent = `${hrs}h ${mins}m ${secs}s`;
        }
    }
    updateClocks();
    setInterval(updateClocks, 1000);
}

// 4. Real-Time Telemetry Fluctuations
function initRealTimeTelemetryFluctuations() {
    setInterval(() => {
        const cpuEl = document.getElementById("tel-cpu-load");
        const memEl = document.getElementById("tel-mem-usage");
        const latEl = document.getElementById("tel-net-latency");

        if (cpuEl) {
            const cpu = 10 + Math.floor(Math.random() * 6);
            cpuEl.textContent = `${cpu}%`;
        }
        if (memEl) {
            const mem = 32 + Math.floor(Math.random() * 5);
            memEl.textContent = `${mem}%`;
        }
        if (latEl) {
            const lat = 15 + Math.floor(Math.random() * 6);
            latEl.textContent = `${lat} ms`;
        }
    }, 2500);
}

// 5. Floating Live Notification Feed
function initLiveNotificationFeed() {
    const notifications = [
        "Global Block Confirmed",
        "Network Difficulty Updated",
        "Mining Pool Healthy",
        "Wallet Successfully Synced",
        "Consensus Verified",
        "Telemetry Updated",
        "Waiting For Contract Activation"
    ];

    setInterval(() => {
        const msg = notifications[Math.floor(Math.random() * notifications.length)];
        if (typeof showToast === 'function') {
            showToast("System Broadcast", msg, "info");
        }
    }, 10000);
}

// 6. Pipeline Progression Updater
function updateActivationPipelineUI() {
    const isFreeActivated = STATE.user && STATE.user.freeStarterPlanActivated;
    const isMiningRunning = STATE.user && STATE.user.isFreeMiningRunning;
    const hasContracts = STATE.user && STATE.user.activeContracts && STATE.user.activeContracts.length > 0;

    const s3 = document.getElementById("pipe-stage-3");
    const s4 = document.getElementById("pipe-stage-4");
    const s5 = document.getElementById("pipe-stage-5");
    const s6 = document.getElementById("pipe-stage-6");

    const gridEngine = document.getElementById("grid-engine-status");
    const gridPool = document.getElementById("grid-pool-status");
    const gridContract = document.getElementById("grid-contract-status");
    const gridNode = document.getElementById("grid-node-status");
    const telAiPred = document.getElementById("tel-ai-pred");

    if (isFreeActivated || hasContracts) {
        if (s3) {
            s3.style.background = "rgba(0, 255, 157, 0.1)";
            s3.style.border = "1px solid var(--accent-green)";
            s3.style.color = "var(--accent-green)";
            s3.innerHTML = `<i class="fa-solid fa-circle-check icon-left"></i> Free Plan Activated`;
        }
        if (s4) {
            s4.style.background = "rgba(0, 240, 255, 0.1)";
            s4.style.border = "1px solid var(--accent-blue)";
            s4.style.color = "var(--accent-blue)";
            s4.innerHTML = `<i class="fa-solid fa-circle-check icon-left"></i> Mining Engine Ready`;
        }
        if (gridContract) {
            gridContract.textContent = isFreeActivated ? "Free Plan Active" : "Contract Active";
            gridContract.style.color = "var(--accent-green)";
        }
        if (gridNode) {
            gridNode.textContent = "Assigned";
            gridNode.style.color = "var(--accent-green)";
        }
        if (telAiPred) {
            telAiPred.textContent = "Optimized";
            telAiPred.style.color = "var(--accent-green)";
        }
    }

    if (isMiningRunning) {
        if (s5) {
            s5.style.background = "rgba(0, 255, 157, 0.1)";
            s5.style.border = "1px solid var(--accent-green)";
            s5.style.color = "var(--accent-green)";
            s5.innerHTML = `<i class="fa-solid fa-circle-check icon-left"></i> Hashrate Assigned`;
        }
        if (s6) {
            s6.style.background = "rgba(0, 255, 157, 0.15)";
            s6.style.border = "1px solid var(--accent-green)";
            s6.style.color = "var(--accent-green)";
            s6.innerHTML = `<i class="fa-solid fa-circle-play icon-left"></i> Mining Started`;
        }
        if (gridEngine) {
            gridEngine.textContent = "ACTIVE";
            gridEngine.style.color = "var(--accent-green)";
        }
        if (gridPool) {
            gridPool.textContent = "CONNECTED";
            gridPool.style.color = "var(--accent-green)";
        }
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
    if (typeof Chart === 'undefined') return;
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
            if (typeof Event !== "undefined") { walletDepAddr.dispatchEvent(new Event("input")); }
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
    if (typeof Chart === 'undefined') return;
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

function handleGuestLoginClick() {
    closeGuestStartMiningModal();
    openAuthModal("signup");
}

function playGuestNoticeSound() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        if (ctx.state === "suspended") ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
        console.log("Audio notice playback:", e);
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

// --- MODULE INITIALIZERS FOR STRICT SEQUENCE ---
function initTheme() {
    const themeBtn = document.getElementById("theme-toggle-btn");
    if (themeBtn) {
        const isLight = document.body.classList.contains("light-theme");
        const icon = themeBtn.querySelector("i");
        if (icon) {
            icon.className = isLight ? "fa-solid fa-sun" : "fa-solid fa-moon";
        }
    }
}

function initNavigation() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", function(e) {
            const targetId = this.getAttribute("href");
            if (targetId && targetId !== "#") {
                const targetEl = document.querySelector(targetId);
                if (targetEl) {
                    e.preventDefault();
                    targetEl.scrollIntoView({ behavior: "smooth" });
                }
            }
        });
    });
}

function initCharts() {
    if (typeof initCalculatorChart === "function") initCalculatorChart();
}

function initCounters() {
    if (typeof initActiveContractsCounter === "function") initActiveContractsCounter();
}

function initNotifications() {
    // Toast notification container setup
}

function initHero() {
    if (typeof initTicker === "function") initTicker();
    if (!window.tickerInterval && typeof updateTickerPrices === "function") {
        window.tickerInterval = setInterval(updateTickerPrices, 2500);
    }
}

function initPopups() {
    // Popup initialization
}

function initStartMiningButtons() {
    const btnHeader = document.getElementById("header-start-mining-btn");
    if (btnHeader) btnHeader.onclick = handleStartMiningClick;

    const btnMobile = document.getElementById("mobile-start-mining-btn");
    if (btnMobile) btnMobile.onclick = handleStartMiningClick;

    const btnHero = document.getElementById("hero-start-mining-btn");
    if (btnHero) btnHero.onclick = handleStartMiningClick;

    document.querySelectorAll(".btn-start-mining").forEach(btn => {
        btn.onclick = handleStartMiningClick;
    });
}

function initLoginButtons() {
    const headerBtn = document.getElementById("header-signup-btn");
    if (headerBtn) {
        headerBtn.onclick = () => {
            if (STATE.user && STATE.user.isLoggedIn) {
                showToast("Account Info", `Logged in as ${STATE.user.name} (${STATE.user.email})`, "info");
            } else {
                openAuthModal("signup");
            }
        };
    }
    const mobileBtn = document.getElementById("mobile-signup-btn");
    if (mobileBtn) {
        mobileBtn.onclick = () => {
            if (STATE.user && STATE.user.isLoggedIn) {
                showToast("Account Info", `Logged in as ${STATE.user.name} (${STATE.user.email})`, "info");
            } else {
                openAuthModal("signup");
            }
        };
    }
}

function initBackground() {
    // Background render verification
}

function initTabs() {
    const allTabBtns = document.querySelectorAll("[data-tab]");
    allTabBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            const targetId = btn.getAttribute("data-tab");
            if (!targetId) return;

            const parentWrapper = btn.closest(".tabs-wrapper, .explainer-tabs, .section-tabs, .infra-tabs-wrapper, .sec-tabs-wrapper, .trans-tabs-wrapper, .inv-tabs-wrapper, .about-tabs-wrapper, .tab-nav, .nav-tabs") || btn.parentElement;

            if (parentWrapper) {
                parentWrapper.querySelectorAll("[data-tab]").forEach(b => b.classList.remove("active"));
            }
            btn.classList.add("active");

            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                const container = targetEl.parentElement;
                if (container) {
                    Array.from(container.children).forEach(panel => {
                        if (panel.classList.contains("tab-content-panel") || 
                            panel.classList.contains("explainer-tab-content") || 
                            panel.classList.contains("tab-panel") || 
                            panel.classList.contains("infra-panel") || 
                            panel.classList.contains("sec-panel") || 
                            panel.classList.contains("trans-panel") || 
                            panel.classList.contains("inv-panel") || 
                            panel.classList.contains("about-panel")) {
                            panel.classList.remove("active");
                            panel.classList.add("hidden");
                            panel.style.display = "none";
                        }
                    });
                }
                targetEl.classList.add("active");
                targetEl.classList.remove("hidden");
                targetEl.style.display = "block";

                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                    
                    if (targetId === "trans-proof") initProofOfWorkWave();
                    if (targetId === "exp-blockchain") initBlockchainNetworkCanvas();
                    if (targetId === "exp-tx-flow") initTxFlowCanvas();
                    if (targetId === "exp-mining-mechanics") initMiningProcessCanvas();
                    if (targetId === "exp-pow-simulator") initPowSimulatorCanvas();
                    if (targetId === "exp-security") initHardwareShowcaseCanvas();
                    if (targetId === "exp-global-network") initGlobalGlobeCanvas();
                    if (targetId === "infra-telemetry") initTrustInfrastructureSection();
                    if (targetId === "infra-globe") {
                        if (typeof initThreeJS === "function") initThreeJS();
                    }

                    if (typeof ScrollTrigger !== 'undefined') {
                        ScrollTrigger.refresh();
                    }
                }, 30);
            }
        });
    });
}

const WORLD_COUNTRIES = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
    "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
    "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
    "Denmark", "Djibouti", "Dominica", "Dominican Republic",
    "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
    "Fiji", "Finland", "France",
    "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
    "Haiti", "Honduras", "Hungary",
    "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast",
    "Jamaica", "Japan", "Jordan",
    "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan",
    "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
    "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
    "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
    "Oman",
    "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar",
    "Romania", "Russia", "Rwanda",
    "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
    "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
    "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
    "Yemen",
    "Zambia", "Zimbabwe"
];

function initCountryDropdown() {
    const container = document.querySelector(".country-dropdown-container");
    if (!container) return;

    const trigger = container.querySelector(".country-dropdown-trigger");
    const panel = container.querySelector(".country-dropdown-panel");
    const searchInput = container.querySelector(".country-search-input");
    const optionsList = container.querySelector(".country-options-list");
    const hiddenInput = document.getElementById("invite-req-country");
    const selectedText = container.querySelector(".selected-country-text");

    if (!trigger || !panel || !optionsList || !hiddenInput || !selectedText) return;

    let highlightedIndex = -1;

    function renderOptions(filter = "") {
        optionsList.innerHTML = "";
        const lowerFilter = filter.toLowerCase().trim();
        const filtered = WORLD_COUNTRIES.filter(c => c.toLowerCase().includes(lowerFilter));

        if (filtered.length === 0) {
            optionsList.innerHTML = `<div class="country-option disabled" style="color: var(--text-muted); cursor: default;">No matching country</div>`;
            return;
        }

        filtered.forEach((country) => {
            const item = document.createElement("div");
            item.className = "country-option" + (hiddenInput.value === country ? " selected" : "");
            item.textContent = country;
            item.setAttribute("data-value", country);

            item.addEventListener("click", () => {
                selectCountry(country);
            });

            optionsList.appendChild(item);
        });
    }

    function selectCountry(country) {
        hiddenInput.value = country;
        selectedText.textContent = country;
        selectedText.style.color = "#ffffff";
        panel.classList.add("hidden");
        trigger.classList.remove("active");
        
        trigger.style.borderColor = "";
        const group = container.closest(".form-group") || container.parentElement;
        if (group) {
            const errorEl = group.querySelector(".field-error-msg");
            if (errorEl) errorEl.remove();
        }
    }

    function openDropdown() {
        panel.classList.remove("hidden");
        trigger.classList.add("active");
        renderOptions(searchInput ? searchInput.value : "");
        if (searchInput) {
            setTimeout(() => searchInput.focus(), 50);
        }
    }

    function closeDropdown() {
        panel.classList.add("hidden");
        trigger.classList.remove("active");
    }

    trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        if (panel.classList.contains("hidden")) {
            openDropdown();
        } else {
            closeDropdown();
        }
    });

    if (searchInput) {
        searchInput.addEventListener("click", (e) => e.stopPropagation());
        searchInput.addEventListener("input", (e) => {
            renderOptions(e.target.value);
        });
    }

    document.addEventListener("click", (e) => {
        if (!container.contains(e.target)) {
            closeDropdown();
        }
    });

    trigger.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
            e.preventDefault();
            openDropdown();
        }
    });

    panel.addEventListener("keydown", (e) => {
        const options = optionsList.querySelectorAll(".country-option:not(.disabled)");
        if (!options.length) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            highlightedIndex = (highlightedIndex + 1) % options.length;
            options.forEach((opt, idx) => opt.classList.toggle("highlighted", idx === highlightedIndex));
            if (options[highlightedIndex]) options[highlightedIndex].scrollIntoView({ block: "nearest" });
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            highlightedIndex = (highlightedIndex - 1 + options.length) % options.length;
            options.forEach((opt, idx) => opt.classList.toggle("highlighted", idx === highlightedIndex));
            if (options[highlightedIndex]) options[highlightedIndex].scrollIntoView({ block: "nearest" });
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (highlightedIndex >= 0 && options[highlightedIndex]) {
                selectCountry(options[highlightedIndex].getAttribute("data-value"));
            }
        } else if (e.key === "Escape") {
            e.preventDefault();
            closeDropdown();
            trigger.focus();
        }
    });

    renderOptions();
}

function validateInvitationRequestForm() {
    let isValid = true;

    function setError(inputEl, msg) {
        isValid = false;
        const group = inputEl.closest(".form-group") || inputEl.parentElement;
        inputEl.style.borderColor = "#ff4d4d";
        
        let errorEl = group.querySelector(".field-error-msg");
        if (!errorEl) {
            errorEl = document.createElement("div");
            errorEl.className = "field-error-msg";
            errorEl.style.color = "#ff4d4d";
            errorEl.style.fontSize = "0.78rem";
            errorEl.style.marginTop = "4px";
            group.appendChild(errorEl);
        }
        errorEl.textContent = msg;
    }

    function clearError(inputEl) {
        inputEl.style.borderColor = "";
        const group = inputEl.closest(".form-group") || inputEl.parentElement;
        const errorEl = group.querySelector(".field-error-msg");
        if (errorEl) errorEl.remove();
    }

    // 1. Full Name
    const nameEl = document.getElementById("invite-req-name");
    if (nameEl) {
        clearError(nameEl);
        if (!nameEl.value.trim()) {
            setError(nameEl, "Full Name is required.");
        } else if (nameEl.value.trim().length < 2) {
            setError(nameEl, "Please enter at least 2 characters.");
        }
    }

    // 2. Email Address
    const emailEl = document.getElementById("invite-req-email");
    if (emailEl) {
        clearError(emailEl);
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailEl.value.trim()) {
            setError(emailEl, "Email Address is required.");
        } else if (!emailRegex.test(emailEl.value.trim())) {
            setError(emailEl, "Please enter a valid email address (e.g. operator@domain.com).");
        }
    }

    // 3. Country
    const countryEl = document.getElementById("invite-req-country");
    const countryTrigger = document.querySelector(".country-dropdown-trigger");
    if (countryEl && countryTrigger) {
        const group = countryTrigger.closest(".form-group") || countryTrigger.parentElement;
        countryTrigger.style.borderColor = "";
        const err = group.querySelector(".field-error-msg");
        if (err) err.remove();

        if (!countryEl.value.trim()) {
            isValid = false;
            countryTrigger.style.borderColor = "#ff4d4d";
            const errorEl = document.createElement("div");
            errorEl.className = "field-error-msg";
            errorEl.style.color = "#ff4d4d";
            errorEl.style.fontSize = "0.78rem";
            errorEl.style.marginTop = "4px";
            errorEl.textContent = "Country selection is required.";
            group.appendChild(errorEl);
        }
    }

    // 4. Experience Level
    const expEl = document.getElementById("invite-req-experience");
    if (expEl) {
        clearError(expEl);
        if (!expEl.value) {
            setError(expEl, "Blockchain Experience Level is required.");
        }
    }

    // 5. Purpose of Joining
    const purposeEl = document.getElementById("invite-req-purpose");
    if (purposeEl) {
        clearError(purposeEl);
        if (!purposeEl.value.trim()) {
            setError(purposeEl, "Purpose of Joining is required.");
        } else if (purposeEl.value.trim().length < 10) {
            setError(purposeEl, "Please enter at least 10 characters explaining your purpose.");
        }
    }

    // 6. Agreement Checkbox
    const agreeEl = document.getElementById("invite-req-agree");
    if (agreeEl) {
        const group = agreeEl.closest(".form-check") || agreeEl.parentElement;
        const err = group.querySelector(".field-error-msg");
        if (err) err.remove();

        if (!agreeEl.checked) {
            isValid = false;
            const errorEl = document.createElement("div");
            errorEl.className = "field-error-msg";
            errorEl.style.color = "#ff4d4d";
            errorEl.style.fontSize = "0.78rem";
            errorEl.style.marginTop = "4px";
            errorEl.textContent = "You must agree to the platform access policies.";
            group.appendChild(errorEl);
        }
    }

    return isValid;
}

function setupAddressAutoClear() {
    const inputs = document.querySelectorAll("#dep-address-input, #wallet-dep-addr, #with-address");
    inputs.forEach(input => {
        input.addEventListener("focus", function() {
            if (this.value.includes("example") || this.value.includes("0x0000")) {
                this.value = "";
            }
        });
    });
}

function setupAddressEventListeners() {
    const addrInput = document.getElementById("dep-address-input");
    if (addrInput) {
        addrInput.addEventListener("input", function() {
            const copyBtn = document.getElementById("dep-address-copy-btn");
            if (copyBtn) {
                copyBtn.disabled = !this.value.trim();
            }
        });
    }
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove("hidden");
        modal.style.display = "flex";
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add("hidden");
        modal.style.display = "none";
    }
}

function openForgotPasskeyModal(e) {
    if (e) e.preventDefault();
    openModal("forgot-passkey-modal");
}

function closeForgotPasskeyModal() {
    closeModal("forgot-passkey-modal");
}

function contactAdminPasskeyRecovery() {
    closeForgotPasskeyModal();
    handleMiranovaChatClick();
    showToast("Passkey Recovery", "Connecting to administrator support channel...", "info");
}

function openForgotInvitationKeyModal(e) {
    if (e) e.preventDefault();
    openModal("forgot-invitation-key-modal");
}

function closeForgotInvitationKeyModal() {
    closeModal("forgot-invitation-key-modal");
}

function contactAdminInvitationKeyRecovery() {
    closeForgotInvitationKeyModal();
    handleMiranovaChatClick();
    showToast("Key Recovery", "Connecting to administrator invitation key recovery channel...", "info");
}

function openInvitationRequestModal(e) {
    if (e) e.preventDefault();
    const formContainer = document.getElementById("invite-request-form-container");
    const successContainer = document.getElementById("invite-request-success-container");
    if (formContainer) formContainer.classList.remove("hidden");
    if (successContainer) successContainer.classList.add("hidden");

    const form = document.querySelector("#invitation-request-modal form");
    if (form) {
        form.reset();
        form.querySelectorAll(".field-error-msg").forEach(el => el.remove());
        form.querySelectorAll("input, select, textarea, .country-dropdown-trigger").forEach(el => el.style.borderColor = "");
    }
    const countryText = document.querySelector(".selected-country-text");
    if (countryText) {
        countryText.textContent = "Select country...";
        countryText.style.color = "";
    }
    const countryHidden = document.getElementById("invite-req-country");
    if (countryHidden) countryHidden.value = "";

    openModal("invitation-request-modal");
}

function closeInvitationRequestModal() {
    closeModal("invitation-request-modal");
}

function handleInvitationRequestSubmit(e) {
    if (e) e.preventDefault();
    
    const isValid = validateInvitationRequestForm();
    if (!isValid) return;

    const form = document.querySelector("#invitation-request-modal form");
    const submitBtn = form ? form.querySelector("button[type='submit']") : null;
    const originalBtnText = submitBtn ? submitBtn.innerHTML : "Submit Request";

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin icon-left"></i> Submitting Request...`;
    }

    setTimeout(() => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }

        const formContainer = document.getElementById("invite-request-form-container");
        const successContainer = document.getElementById("invite-request-success-container");
        if (formContainer) formContainer.classList.add("hidden");
        if (successContainer) successContainer.classList.remove("hidden");

        showToast("Application Received", "Your invitation application has been submitted for manual operator review.", "info");
    }, 1500);
}

function handleReturnHome() {
    closeInvitationRequestModal();
    const landingView = document.getElementById("landing-view");
    const dashboardView = document.getElementById("dashboard-view");
    if (landingView) landingView.classList.remove("hidden");
    if (dashboardView) dashboardView.classList.add("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// Knowledge drawer control provided by topic-aware openKnowledgeDrawer(topic)

function closeKnowledgeDrawer() {
    const drawer = document.getElementById("knowledge-drawer");
    if (drawer) drawer.classList.add("hidden");
}

function handleContactSubmit(e) {
    if (e) e.preventDefault();
    showToast("Message Sent", "Thank you for reaching out. An enterprise advisor will respond within 24 hours.", "success");
}

function handleNewsletter(e) {
    if (e) e.preventDefault();
    showToast("Subscribed", "You have successfully subscribed to CRYPTOMIN Hashrate Intelligence updates.", "success");
}

function closeDemoBanner() {
    const banner = document.getElementById("demo-banner");
    if (banner) banner.style.display = "none";
}

function toggleDbSidebar() {
    const sidebar = document.getElementById("db-sidebar");
    if (sidebar) {
        sidebar.classList.toggle("active");
    }
}

function generateInvitationKey() {
    if (typeof renderInvitationKeysTable === "function") {
        renderInvitationKeysTable();
    }
    showToast("Key Generated", "New 60-character cryptographic invitation key generated.", "success");
}

function closeAdminSupportModal() {
    closeModal("admin-support-modal");
}

function openGuestStartMiningModal() {
    openModal("guest-start-mining-modal");
    if (typeof playGuestNoticeSound === "function") playGuestNoticeSound();
}

function closeGuestStartMiningModal() {
    closeModal("guest-start-mining-modal");
}

function handleContinueDemoClick() {
    closeGuestStartMiningModal();
    const landingView = document.getElementById("landing-view");
    const dashboardView = document.getElementById("dashboard-view");
    if (landingView) landingView.classList.add("hidden");
    if (dashboardView) dashboardView.classList.remove("hidden");
    initDashboard();
    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
    }
}

function runStartupValidation() {
    const loader = document.getElementById("loader");
    if (loader) loader.style.display = "none";
    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
}

function renderDashboardTransactions() {
    if (typeof renderTxTableUpgraded === "function") renderTxTableUpgraded();
}

function startBitcoinNetworkExplorerAnimation() {
    console.log("Bitcoin explorer animation active.");
}

function loadInvitationKeys() {
    if (typeof renderInvitationKeysTable === "function") renderInvitationKeysTable();
}

function loadInvitationRequests() {
    if (typeof renderInvitationRequestsTable === "function") renderInvitationRequestsTable();
}

function initAccordions() {
    const faqButtons = document.querySelectorAll(".faq-question, .exp-faq-card, .accordion-trigger, [data-accordion-trigger]");

    faqButtons.forEach((btn, index) => {
        const item = btn.closest(".faq-item, .exp-faq-card, .accordion-item") || btn.parentElement;
        if (!item) return;

        const answer = item.querySelector(".faq-answer, .exp-faq-answer, .accordion-content") || btn.nextElementSibling;
        const answerId = answer ? (answer.id || `faq-answer-${index}`) : `faq-answer-${index}`;
        
        if (answer && !answer.id) answer.id = answerId;
        
        btn.setAttribute("aria-expanded", item.classList.contains("active") ? "true" : "false");
        if (answer) btn.setAttribute("aria-controls", answerId);

        function toggleItem(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }

            const isActive = item.classList.contains("active");
            const container = item.closest(".faq-accordion, .explainer-faq-grid, .accordion-wrapper") || item.parentElement;

            if (container) {
                const siblings = container.querySelectorAll(".faq-item, .exp-faq-card, .accordion-item");
                siblings.forEach(sib => {
                    if (sib !== item) {
                        sib.classList.remove("active");
                        const sibBtn = sib.querySelector(".faq-question, .accordion-trigger") || sib.firstElementChild;
                        if (sibBtn) sibBtn.setAttribute("aria-expanded", "false");

                        const sibAns = sib.querySelector(".faq-answer, .exp-faq-answer, .accordion-content");
                        if (sibAns) {
                            if (typeof gsap !== 'undefined') {
                                gsap.to(sibAns, { maxHeight: 0, opacity: 0, duration: 0.35, ease: "power2.inOut" });
                            } else {
                                sibAns.style.maxHeight = null;
                                sibAns.style.opacity = "0";
                            }
                        }
                    }
                });
            }

            if (isActive) {
                item.classList.remove("active");
                btn.setAttribute("aria-expanded", "false");
                if (answer) {
                    if (typeof gsap !== 'undefined') {
                        gsap.to(answer, { maxHeight: 0, opacity: 0, duration: 0.35, ease: "power2.inOut" });
                    } else {
                        answer.style.maxHeight = null;
                        answer.style.opacity = "0";
                    }
                }
            } else {
                item.classList.add("active");
                btn.setAttribute("aria-expanded", "true");
                if (answer) {
                    const targetHeight = answer.scrollHeight + 30;
                    if (typeof gsap !== 'undefined') {
                        gsap.fromTo(answer, 
                            { maxHeight: 0, opacity: 0 }, 
                            { maxHeight: targetHeight, opacity: 1, duration: 0.35, ease: "power2.out" }
                        );
                    } else {
                        answer.style.maxHeight = targetHeight + "px";
                        answer.style.opacity = "1";
                    }
                }
            }
        }

        if (btn._faqHandler) btn.removeEventListener("click", btn._faqHandler);
        btn._faqHandler = toggleItem;
        btn.addEventListener("click", toggleItem);

        if (btn._faqKeyHandler) btn.removeEventListener("keydown", btn._faqKeyHandler);
        btn._faqKeyHandler = (e) => {
            if (e.key === "Enter" || e.key === " ") {
                toggleItem(e);
            }
        };
        btn.addEventListener("keydown", btn._faqKeyHandler);
    });
}

function initProofOfWorkWave() {
    const canvas = document.getElementById("pow-wave-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let step = 0;
    function resizeCanvas() {
        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.clientWidth || 400;
            canvas.height = 180;
        }
    }

    resizeCanvas();
    window.removeEventListener("resize", resizeCanvas);
    window.addEventListener("resize", resizeCanvas);

    if (window.powWaveFrameId) cancelAnimationFrame(window.powWaveFrameId);

    function drawWave() {
        step += 0.04;
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        // Draw grid lines
        ctx.strokeStyle = "rgba(0, 240, 255, 0.05)";
        ctx.lineWidth = 1;
        for (let y = 0; y < height; y += 30) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Draw primary cyan wave
        ctx.beginPath();
        ctx.strokeStyle = "#00f0ff";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 10;

        for (let x = 0; x < width; x++) {
            const y = height / 2 + 
                Math.sin(x * 0.02 + step) * 25 + 
                Math.cos(x * 0.01 - step * 0.5) * 15 +
                Math.sin(x * 0.05 + step * 2) * 5;
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw secondary gold wave
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 215, 0, 0.6)";
        ctx.lineWidth = 1.5;

        for (let x = 0; x < width; x++) {
            const y = height / 2 + 
                Math.cos(x * 0.025 - step * 1.2) * 20 + 
                Math.sin(x * 0.015 + step * 0.8) * 10;
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();

        // Draw pulsating hash node
        const nodeX = (step * 80) % width;
        const nodeY = height / 2 + Math.sin(nodeX * 0.02 + step) * 25 + Math.cos(nodeX * 0.01 - step * 0.5) * 15 + Math.sin(nodeX * 0.05 + step * 2) * 5;
        
        ctx.beginPath();
        ctx.arc(nodeX, nodeY, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;

        window.powWaveFrameId = requestAnimationFrame(drawWave);
    }

    drawWave();
}

let currentSimBlockHeight = 884729;

function startLiveBlockExplorerSimulator() {
    if (window.blockExpInterval) clearInterval(window.blockExpInterval);

    function updateHoloBlock() {
        const heightEl = document.getElementById("holo-height");
        const txsEl = document.getElementById("holo-txs");
        const timeEl = document.getElementById("holo-time");
        const diffEl = document.getElementById("holo-diff");
        const prevEl = document.getElementById("holo-prev");

        currentSimBlockHeight += 1;
        const txs = Math.floor(1800 + Math.random() * 1200);
        const timeStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
        const diff = (84.5 + Math.random() * 2.5).toFixed(2) + " T";
        const pseudoPrev = "000000000000000000" + Math.floor(Math.random() * 16777215).toString(16) + "...";

        if (heightEl) heightEl.textContent = `#${currentSimBlockHeight}`;
        if (txsEl) txsEl.textContent = txs.toLocaleString();
        if (timeEl) timeEl.textContent = timeStr;
        if (diffEl) diffEl.textContent = diff;
        if (prevEl) prevEl.textContent = pseudoPrev;
    }

    updateHoloBlock();
    window.blockExpInterval = setInterval(updateHoloBlock, 8000);
}

const SCADA_LOG_TEMPLATES = [
    "[SYS_INFO] Array-{RACK} coolant flow rate: 42.8 L/min (Normal)",
    "[TELEMETRY] Node-{NODE} chip core temp: {TEMP}°C - Optimal efficiency",
    "[POWER] Substation-{SUB} grid load: {POWER} MW - Stable 60Hz frequency",
    "[SECURITY] SHA-256 hash verified for block #{BLOCK} (Difficulty: {DIFF} T)",
    "[COOLING] Viscosity check: 1.04 cSt @ 40°C - Immersion tank #{TANK} nominal",
    "[ASIC] Hashboard #{HB} fan speed: 6400 RPM - Automatic PWM loop active",
    "[SCADA] Network latency: 14.2ms | Packet loss: 0.00% | Uptime: 99.999%",
    "[POOL] Stratum v2 share accepted by pool server (Difficulty: {DIFF_SHARE})"
];

function streamScadaLogs() {
    const scadaConsole = document.getElementById("scada-telemetry-console");
    const trustLogs = document.getElementById("trust-section-scada-logs");

    function generateLogLine() {
        const template = SCADA_LOG_TEMPLATES[Math.floor(Math.random() * SCADA_LOG_TEMPLATES.length)];
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const rack = Math.floor(10 + Math.random() * 90);
        const node = Math.floor(100 + Math.random() * 900);
        const temp = (36 + Math.random() * 8).toFixed(1);
        const power = (12 + Math.random() * 4).toFixed(2);
        const block = Math.floor(880000 + Math.random() * 5000);
        const diff = (84.5 + Math.random() * 5).toFixed(2);
        const tank = Math.floor(1 + Math.random() * 12);
        const hb = Math.floor(1 + Math.random() * 24);
        const sub = Math.floor(1 + Math.random() * 4);
        const diffShare = Math.floor(128 + Math.random() * 512);

        const text = template
            .replace("{RACK}", rack)
            .replace("{NODE}", node)
            .replace("{TEMP}", temp)
            .replace("{POWER}", power)
            .replace("{BLOCK}", block)
            .replace("{DIFF}", diff)
            .replace("{TANK}", tank)
            .replace("{HB}", hb)
            .replace("{SUB}", sub)
            .replace("{DIFF_SHARE}", diffShare);

        return `<div class="console-line" style="padding: 2px 0; border-bottom: 1px dashed rgba(255,255,255,0.05); font-family: monospace; font-size: 0.8rem;"><span style="color: var(--accent-gold);">[${timestamp}]</span> <span style="color: #cbd5e1;">${text}</span></div>`;
    }

    [scadaConsole, trustLogs].forEach(consoleEl => {
        if (consoleEl) {
            const line = generateLogLine();
            consoleEl.innerHTML += line;
            if (consoleEl.children.length > 20) {
                consoleEl.removeChild(consoleEl.firstElementChild);
            }
            consoleEl.scrollTop = consoleEl.scrollHeight;
        }
    });
}

function initTrustInfrastructureSection() {
    console.log("[TrustInfrastructure] SCADA telemetry monitoring initialized.");
    const scadaTemp = document.getElementById("infra-scada-temp");
    const scadaPower = document.getElementById("infra-scada-power");
    const scadaHash = document.getElementById("infra-scada-hash");

    if (window.trustInfraInterval) clearInterval(window.trustInfraInterval);

    for (let i = 0; i < 4; i++) streamScadaLogs();

    window.trustInfraInterval = setInterval(() => {
        if (scadaTemp) {
            const temp = (38.5 + Math.random() * 2.5).toFixed(1);
            scadaTemp.textContent = `${temp} °C`;
        }
        if (scadaPower) {
            const power = (14.2 + Math.random() * 0.4).toFixed(2);
            scadaPower.textContent = `${power} MW`;
        }
        if (scadaHash) {
            const hash = (8450 + Math.floor(Math.random() * 120)).toLocaleString();
            scadaHash.textContent = `${hash} TH/s`;
        }
        streamScadaLogs();
    }, 3000);
}

function initBlockchainNetworkCanvas() {
    const canvas = document.getElementById("canvas-blockchain-network");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resizeBcNetCanvas() {
        const p = canvas.parentElement;
        if (p) {
            canvas.width = p.clientWidth || 600;
            canvas.height = Math.max(p.clientHeight || 300, 250);
        }
    }
    resizeBcNetCanvas();
    if (window._resizeBcNetCanvas) window.removeEventListener("resize", window._resizeBcNetCanvas); window._resizeBcNetCanvas = resizeBcNetCanvas;
    window.addEventListener("resize", resizeBcNetCanvas);

    if (window.bcNetAnimId) cancelAnimationFrame(window.bcNetAnimId);

    const nodes = [];
    const nodeCount = 18;
    for (let i = 0; i < nodeCount; i++) {
        nodes.push({
            x: Math.random() * (canvas.width || 600),
            y: Math.random() * (canvas.height || 300),
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
            radius: 3 + Math.random() * 3,
            pulse: Math.random() * Math.PI * 2
        });
    }

    function renderBlockchainNetworkCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        nodes.forEach(n => {
            n.x += n.vx;
            n.y += n.vy;
            n.pulse += 0.03;

            if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
            if (n.y < 0 || n.y > canvas.height) n.vy *= -1;

            const r = n.radius + Math.sin(n.pulse) * 1.5;
            ctx.beginPath();
            ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
            ctx.fillStyle = "#00f0ff";
            ctx.shadowColor = "#00f0ff";
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 130) {
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.strokeStyle = `rgba(0, 240, 255, ${0.35 * (1 - dist / 130)})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }

        window.bcNetAnimId = requestAnimationFrame(renderBlockchainNetworkCanvas);
    }
    renderBlockchainNetworkCanvas();
}

function initTxFlowCanvas() {
    const canvas = document.getElementById("canvas-tx-flow");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resizeTxFlowCanvas() {
        const p = canvas.parentElement;
        if (p) {
            canvas.width = p.clientWidth || 600;
            canvas.height = Math.max(p.clientHeight || 300, 250);
        }
    }
    resizeTxFlowCanvas();
    if (window._resizeTxFlowCanvas) window.removeEventListener("resize", window._resizeTxFlowCanvas); window._resizeTxFlowCanvas = resizeTxFlowCanvas;
    window.addEventListener("resize", resizeTxFlowCanvas);

    if (window.txFlowAnimId) cancelAnimationFrame(window.txFlowAnimId);

    const particles = [];
    for (let i = 0; i < 25; i++) {
        particles.push({
            x: Math.random() * (canvas.width || 600),
            y: (canvas.height || 300) / 2 + (Math.random() - 0.5) * 100,
            speed: 1.5 + Math.random() * 2,
            size: 4 + Math.random() * 4,
            label: "0x" + Math.floor(Math.random() * 16777215).toString(16)
        });
    }

    function renderTxFlowCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const midY = canvas.height / 2;
        ctx.strokeStyle = "rgba(0, 240, 255, 0.15)";
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(0, midY);
        ctx.lineTo(canvas.width, midY);
        ctx.stroke();
        ctx.setLineDash([]);

        particles.forEach(p => {
            p.x += p.speed;
            if (p.x > canvas.width + 40) p.x = -40;

            ctx.fillStyle = "rgba(8, 8, 22, 0.9)";
            ctx.strokeStyle = "#00f0ff";
            ctx.lineWidth = 1.5;
            ctx.shadowColor = "#00f0ff";
            ctx.shadowBlur = 8;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(p.x - 25, p.y - 12, 50, 24, 4);
            else ctx.rect(p.x - 25, p.y - 12, 50, 24);
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.fillStyle = "#ffffff";
            ctx.font = "9px monospace";
            ctx.textAlign = "center";
            ctx.fillText(p.label.substring(0, 6), p.x, p.y + 3);
        });

        window.txFlowAnimId = requestAnimationFrame(renderTxFlowCanvas);
    }
    renderTxFlowCanvas();
}

function initMiningProcessCanvas() {
    const canvas = document.getElementById("canvas-mining-process");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resizeMiningProcCanvas() {
        const p = canvas.parentElement;
        if (p) {
            canvas.width = p.clientWidth || 600;
            canvas.height = Math.max(p.clientHeight || 300, 250);
        }
    }
    resizeMiningProcCanvas();
    if (window._resizeMiningProcCanvas) window.removeEventListener("resize", window._resizeMiningProcCanvas); window._resizeMiningProcCanvas = resizeMiningProcCanvas;
    window.addEventListener("resize", resizeMiningProcCanvas);

    if (window.miningProcAnimId) cancelAnimationFrame(window.miningProcAnimId);

    let angle = 0;

    function renderMiningProcessCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        angle += 0.02;

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const radius = Math.min(cx, cy) - 30;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
        ctx.lineWidth = 3;
        ctx.setLineDash([15, 10, 5, 10]);
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-angle * 1.5);

        ctx.strokeStyle = "rgba(255, 215, 0, 0.4)";
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 15]);
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(radius - 20, 10), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = "rgba(0, 240, 255, 0.1)";
        ctx.strokeStyle = "#00f0ff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "11px monospace";
        ctx.textAlign = "center";
        ctx.fillText("SHA-256", cx, cy - 5);
        ctx.fillStyle = "var(--accent-gold)";
        ctx.fillText("ASIC CORE", cx, cy + 12);

        window.miningProcAnimId = requestAnimationFrame(renderMiningProcessCanvas);
    }
    renderMiningProcessCanvas();
}

function initPowSimulatorCanvas() {
    const canvas = document.getElementById("canvas-pow-simulator");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resizePowSimCanvas() {
        const p = canvas.parentElement;
        if (p) {
            canvas.width = p.clientWidth || 600;
            canvas.height = Math.max(p.clientHeight || 300, 250);
        }
    }
    resizePowSimCanvas();
    if (window._resizePowSimCanvas) window.removeEventListener("resize", window._resizePowSimCanvas); window._resizePowSimCanvas = resizePowSimCanvas;
    window.addEventListener("resize", resizePowSimCanvas);

    if (window.powSimAnimId) cancelAnimationFrame(window.powSimAnimId);

    let nonce = Math.floor(Math.random() * 1000000);
    let hashBarOffset = 0;

    function renderPowSimulatorCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        nonce += 137;
        hashBarOffset = (hashBarOffset + 2) % canvas.width;

        const w = canvas.width;
        const h = canvas.height;

        const targetY = h * 0.35;
        ctx.strokeStyle = "rgba(255, 77, 77, 0.6)";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(0, targetY);
        ctx.lineTo(w, targetY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#ff4d4d";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "right";
        ctx.fillText("DIFFICULTY TARGET THRESHOLD", w - 10, targetY - 6);

        ctx.beginPath();
        ctx.strokeStyle = "#00f0ff";
        ctx.lineWidth = 2;

        for (let x = 0; x < w; x += 10) {
            const val = Math.sin((x + hashBarOffset) * 0.05) * 40 + Math.cos((x - hashBarOffset) * 0.03) * 30 + h * 0.6;
            if (x === 0) ctx.moveTo(x, val);
            else ctx.lineTo(x, val);
        }
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "12px monospace";
        ctx.textAlign = "left";
        ctx.fillText(`NONCE: ${nonce}`, 15, h - 35);

        const pseudoHash = "0000000000000000000" + Math.floor(Math.sin(nonce) * 10000000).toString(16).substring(0, 12);
        ctx.fillStyle = "var(--accent-green)";
        ctx.fillText(`HASH: ${pseudoHash}`, 15, h - 15);

        window.powSimAnimId = requestAnimationFrame(renderPowSimulatorCanvas);
    }
    renderPowSimulatorCanvas();
}

function initHardwareShowcaseCanvas() {
    const canvas = document.getElementById("canvas-hardware-showcase");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resizeHwShowcaseCanvas() {
        const p = canvas.parentElement;
        if (p) {
            canvas.width = p.clientWidth || 600;
            canvas.height = Math.max(p.clientHeight || 300, 250);
        }
    }
    resizeHwShowcaseCanvas();
    if (window._resizeHwShowcaseCanvas) window.removeEventListener("resize", window._resizeHwShowcaseCanvas); window._resizeHwShowcaseCanvas = resizeHwShowcaseCanvas;
    window.addEventListener("resize", resizeHwShowcaseCanvas);

    if (window.hwShowcaseAnimId) cancelAnimationFrame(window.hwShowcaseAnimId);

    const bubbles = [];
    for (let i = 0; i < 30; i++) {
        bubbles.push({
            x: Math.random() * (canvas.width || 600),
            y: Math.random() * (canvas.height || 300),
            r: 2 + Math.random() * 4,
            vy: 0.5 + Math.random() * 1.2
        });
    }

    function renderHardwareShowcaseCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, "rgba(0, 240, 255, 0.08)");
        grad.addColorStop(1, "rgba(0, 100, 255, 0.2)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        bubbles.forEach(b => {
            b.y -= b.vy;
            if (b.y < -10) {
                b.y = canvas.height + 10;
                b.x = Math.random() * canvas.width;
            }

            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(0, 240, 255, 0.5)";
            ctx.fill();
        });

        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        ctx.strokeStyle = "rgba(0, 240, 255, 0.3)";
        ctx.lineWidth = 1.5;
        const rw = 140;
        const rh = 160;
        const rx = (canvas.width - rw) / 2;
        const ry = (canvas.height - rh) / 2;
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeRect(rx, ry, rw, rh);

        const time = Date.now() * 0.005;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(rx + 20, ry + 30 + i * 35, 4, 0, Math.PI * 2);
            ctx.fillStyle = Math.sin(time + i) > 0 ? "#00ff66" : "#00f0ff";
            ctx.fill();
        }

        window.hwShowcaseAnimId = requestAnimationFrame(renderHardwareShowcaseCanvas);
    }
    renderHardwareShowcaseCanvas();
}

function initGlobalGlobeCanvas() {
    const canvas = document.getElementById("canvas-global-globe");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resizeGlobalGlobeCanvas() {
        const p = canvas.parentElement;
        if (p) {
            canvas.width = p.clientWidth || 600;
            canvas.height = Math.max(p.clientHeight || 300, 250);
        }
    }
    resizeGlobalGlobeCanvas();
    if (window._resizeGlobalGlobeCanvas) window.removeEventListener("resize", window._resizeGlobalGlobeCanvas); window._resizeGlobalGlobeCanvas = resizeGlobalGlobeCanvas;
    window.addEventListener("resize", resizeGlobalGlobeCanvas);

    if (window.globalGlobeAnimId) cancelAnimationFrame(window.globalGlobeAnimId);

    const locations = [
        { name: "Iceland Geothermal Node", x: 0.42, y: 0.30 },
        { name: "Norway Hydro Substation", x: 0.48, y: 0.32 },
        { name: "Texas Wind Facility", x: 0.22, y: 0.45 },
        { name: "UAE Solar Cluster", x: 0.62, y: 0.48 },
        { name: "Singapore Data Node", x: 0.78, y: 0.60 }
    ];

    let pulse = 0;

    function renderGlobalGlobeCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pulse += 0.04;

        const w = canvas.width;
        const h = canvas.height;

        ctx.strokeStyle = "rgba(0, 240, 255, 0.08)";
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        locations.forEach(loc => {
            const nx = loc.x * w;
            const ny = loc.y * h;

            const r = 8 + Math.sin(pulse + loc.x * 10) * 4;
            ctx.beginPath();
            ctx.arc(nx, ny, r, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(0, 240, 255, 0.6)";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(nx, ny, 4, 0, Math.PI * 2);
            ctx.fillStyle = "var(--accent-gold)";
            ctx.fill();

            ctx.fillStyle = "#ffffff";
            ctx.font = "10px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(loc.name, nx, ny + 20);
        });

        window.globalGlobeAnimId = requestAnimationFrame(renderGlobalGlobeCanvas);
    }
    renderGlobalGlobeCanvas();
}

function initImmersionLoopCanvas() {
    const canvas = document.getElementById("canvas-immersion-loop");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const tooltip = document.getElementById("immersion-tooltip");

    function resizeImmersionCanvas() {
        const p = canvas.parentElement;
        const w = (p && p.clientWidth > 0) ? p.clientWidth : 600;
        const h = (p && p.clientHeight > 0) ? p.clientHeight : 220;
        canvas.width = w;
        canvas.height = h;
    }
    resizeImmersionCanvas();

    if (window._resizeImmersionCanvas) window.removeEventListener("resize", window._resizeImmersionCanvas); window._resizeImmersionCanvas = resizeImmersionCanvas;
    window.addEventListener("resize", resizeImmersionCanvas);

    if (window.ResizeObserver && canvas.parentElement) {
        if (window.immersionResizeObserver) window.immersionResizeObserver.disconnect();
        window.immersionResizeObserver = new ResizeObserver(() => resizeImmersionCanvas());
        window.immersionResizeObserver.observe(canvas.parentElement);
    }

    if (window.immersionLoopAnimId) cancelAnimationFrame(window.immersionLoopAnimId);

    if (window.immersionTelemetryInterval) clearInterval(window.immersionTelemetryInterval);
    window.immersionTelemetryInterval = setInterval(() => {
        const asicTempEl = document.getElementById("immersion-asic-temp");
        const oilTempEl = document.getElementById("immersion-oil-temp");
        const flowRateEl = document.getElementById("immersion-flow-rate");
        const pumpRpmEl = document.getElementById("immersion-pump-rpm");
        const powerDrawEl = document.getElementById("immersion-power-draw");
        const efficiencyEl = document.getElementById("immersion-efficiency");

        if (asicTempEl) {
            const temp = (66.0 + Math.random() * 3.2).toFixed(1);
            asicTempEl.textContent = `${temp} °C`;
        }
        if (oilTempEl) {
            const temp = (42.0 + Math.random() * 2.5).toFixed(1);
            oilTempEl.textContent = `${temp} °C`;
        }
        if (flowRateEl) {
            const flow = (8.0 + Math.random() * 0.3).toFixed(1);
            flowRateEl.textContent = `${flow} L/s`;
        }
        if (pumpRpmEl) {
            const rpm = Math.floor(1648 + Math.random() * 7);
            pumpRpmEl.textContent = `${rpm.toLocaleString()} RPM`;
        }
        if (powerDrawEl) {
            const pwr = (12.8 + Math.random() * 0.2).toFixed(1);
            powerDrawEl.textContent = `${pwr} MW`;
        }
        if (efficiencyEl) {
            const eff = (98.4 + Math.random() * 0.2).toFixed(1);
            efficiencyEl.textContent = `${eff}%`;
        }
    }, 2500);

    const particles = [];
    const particleCount = 45;
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            progress: Math.random(),
            baseSpeed: 0.003 + Math.random() * 0.002,
            size: 2.5 + Math.random() * 2.5
        });
    }

    let hoveredNode = null;
    let mousePos = { x: -100, y: -100 };
    let impellerAngle = 0;
    let pulseStep = 0;

    function getNodePositions() {
        const w = canvas.width;
        const h = canvas.height;
        return {
            asic: { x: w * 0.20, y: h * 0.5, r: 38, label: "ASIC Pod #04", color: "#ff4d4d" },
            heatExch: { x: w * 0.80, y: h * 0.5, r: 38, label: "Heat Exchanger", color: "#8a2be2" },
            pump: { x: w * 0.50, y: h * 0.80, r: 26, label: "Pump (1650 RPM)", color: "#00f0ff" },
            reservoir: { x: w * 0.50, y: h * 0.20, r: 22, label: "Oil Tank", color: "#f0b90b" }
        };
    }

    function getLoopPoint(progress) {
        const nodes = getNodePositions();
        const p1 = nodes.asic;
        const p2 = nodes.heatExch;
        const p3 = nodes.pump;

        if (progress < 0.4) {
            const t = progress / 0.4;
            return {
                x: p1.x + (p2.x - p1.x) * t,
                y: p1.y - 25 + Math.sin(t * Math.PI) * -12,
                color: "#ff4d4d"
            };
        } else if (progress < 0.7) {
            const t = (progress - 0.4) / 0.3;
            return {
                x: p2.x + (p3.x - p2.x) * t,
                y: p2.y + (p3.y - p2.y) * t,
                color: "#8a2be2"
            };
        } else {
            const t = (progress - 0.7) / 0.3;
            return {
                x: p3.x + (p1.x - p3.x) * t,
                y: p3.y + (p1.y - p3.y) * t,
                color: "#00f0ff"
            };
        }
    }

    function renderImmersionLoopCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pulseStep += 0.04;

        const asicTempEl = document.getElementById("immersion-asic-temp");
        const flowRateEl = document.getElementById("immersion-flow-rate");
        const pumpRpmEl = document.getElementById("immersion-pump-rpm");

        const curTemp = asicTempEl ? (parseFloat(asicTempEl.textContent) || 67.4) : 67.4;
        const curFlow = flowRateEl ? (parseFloat(flowRateEl.textContent) || 8.1) : 8.1;
        const curRpm = pumpRpmEl ? (parseInt(pumpRpmEl.textContent.replace(',', '')) || 1650) : 1650;

        const speedMult = curFlow / 8.0;
        const heatGlowInt = Math.min(Math.max((curTemp - 60) / 15, 0), 1.0);
        impellerAngle += 0.05 * (curRpm / 1600);

        const w = canvas.width;
        const h = canvas.height;
        const nodes = getNodePositions();

        ctx.lineWidth = 8;

        ctx.beginPath();
        ctx.moveTo(nodes.asic.x, nodes.asic.y - 25);
        ctx.lineTo(nodes.heatExch.x, nodes.heatExch.y - 25);
        ctx.strokeStyle = `rgba(255, 77, 77, ${0.35 + heatGlowInt * 0.25})`;
        ctx.shadowColor = "#ff4d4d";
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.moveTo(nodes.heatExch.x, nodes.heatExch.y);
        ctx.lineTo(nodes.pump.x, nodes.pump.y);
        ctx.lineTo(nodes.asic.x, nodes.asic.y);
        ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;

        particles.forEach(p => {
            p.progress = (p.progress + p.baseSpeed * speedMult) % 1.0;
            const pt = getLoopPoint(p.progress);

            ctx.beginPath();
            ctx.arc(pt.x, pt.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = pt.color;
            ctx.shadowColor = pt.color;
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        Object.keys(nodes).forEach(key => {
            const n = nodes[key];

            const extraGlow = (key === "asic") ? (heatGlowInt * 6) : 0;
            const auraR = n.r + Math.sin(pulseStep + n.x) * 4 + extraGlow;
            
            ctx.beginPath();
            ctx.arc(n.x, n.y, auraR, 0, Math.PI * 2);
            ctx.strokeStyle = n.color;
            ctx.lineWidth = hoveredNode === key ? 3 : 1.5;
            ctx.globalAlpha = hoveredNode === key ? 0.9 : 0.4;
            ctx.shadowColor = n.color;
            ctx.shadowBlur = 12;
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1.0;

            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(8, 8, 22, 0.95)";
            ctx.strokeStyle = n.color;
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();

            if (key === "pump") {
                ctx.save();
                ctx.translate(n.x, n.y);
                ctx.rotate(impellerAngle);
                ctx.strokeStyle = "#00f0ff";
                ctx.lineWidth = 2;
                for (let b = 0; b < 3; b++) {
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(b * (Math.PI * 2 / 3)) * 14, Math.sin(b * (Math.PI * 2 / 3)) * 14);
                    ctx.stroke();
                }
                ctx.restore();
            }

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 10px monospace";
            ctx.textAlign = "center";
            ctx.fillText(n.label, n.x, n.y + (key === "pump" ? 22 : 4));
        });

        window.immersionLoopAnimId = requestAnimationFrame(renderImmersionLoopCanvas);
    }
    renderImmersionLoopCanvas();

    canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        mousePos.x = e.clientX - rect.left;
        mousePos.y = e.clientY - rect.top;

        const nodes = getNodePositions();
        let found = null;

        Object.keys(nodes).forEach(key => {
            const n = nodes[key];
            const dx = mousePos.x - n.x;
            const dy = mousePos.y - n.y;
            if (Math.sqrt(dx * dx + dy * dy) <= n.r + 10) {
                found = key;
            }
        });

        hoveredNode = found;

        if (tooltip) {
            if (found === "asic") {
                tooltip.classList.remove("hidden");
                tooltip.style.left = Math.min(mousePos.x + 15, canvas.width - 180) + "px";
                tooltip.style.top = Math.max(mousePos.y - 15, 10) + "px";
                const asicTemp = document.getElementById("immersion-asic-temp") ? document.getElementById("immersion-asic-temp").textContent : "67.4 °C";
                tooltip.innerHTML = `<i class="fa-solid fa-microchip" style="color: #ff4d4d;"></i> <strong>ASIC Pod #04</strong><br>Core Temp: ${asicTemp}<br>Status: Submerged Overclock active`;
            } else if (found === "heatExch") {
                tooltip.classList.remove("hidden");
                tooltip.style.left = Math.min(mousePos.x + 15, canvas.width - 180) + "px";
                tooltip.style.top = Math.max(mousePos.y - 15, 10) + "px";
                const oilTemp = document.getElementById("immersion-oil-temp") ? document.getElementById("immersion-oil-temp").textContent : "42.8 °C";
                tooltip.innerHTML = `<i class="fa-solid fa-water" style="color: #8a2be2;"></i> <strong>Heat Exchanger</strong><br>Fluid Temp: ${oilTemp}<br>Transfer Rate: 99.6% heat removed`;
            } else if (found === "pump") {
                tooltip.classList.remove("hidden");
                tooltip.style.left = Math.min(mousePos.x + 15, canvas.width - 180) + "px";
                tooltip.style.top = Math.max(mousePos.y - 15, 10) + "px";
                const rpm = document.getElementById("immersion-pump-rpm") ? document.getElementById("immersion-pump-rpm").textContent : "1,650 RPM";
                tooltip.innerHTML = `<i class="fa-solid fa-gauge-high" style="color: #00f0ff;"></i> <strong>Circulation Pump</strong><br>Speed: ${rpm}<br>Pressure: 2.4 bar nominal`;
            } else if (found === "reservoir") {
                tooltip.classList.remove("hidden");
                tooltip.style.left = Math.min(mousePos.x + 15, canvas.width - 180) + "px";
                tooltip.style.top = Math.max(mousePos.y - 15, 10) + "px";
                tooltip.innerHTML = `<i class="fa-solid fa-oil-can" style="color: #f0b90b;"></i> <strong>Oil Reservoir</strong><br>Dielectric Fluid Level: 98%<br>Viscosity: 1.04 cSt`;
            } else {
                tooltip.classList.add("hidden");
            }
        }
    });

    canvas.addEventListener("mouseleave", () => {
        hoveredNode = null;
        if (tooltip) tooltip.classList.add("hidden");
    });

    canvas.addEventListener("click", () => {
        if (hoveredNode === "asic") {
            showToast("ASIC Immersion Pod #04", "120x Antminer S21 Hydro Rigs Submerged | Core Temp: 67.4°C | Overclock Rate: +22% | Zero Fan Noise", "info");
        } else if (hoveredNode === "heatExch") {
            showToast("Sub-Arctic Heat Exchanger", "Heat Recovery: 99.6% | Output: Sub-Arctic Municipal Heating Loop | Ambient Fluid Return: 42.8°C", "success");
        } else if (hoveredNode === "pump") {
            showToast("Immersion Circulation Pump", "Variable Speed Impeller: 1,650 RPM | Pressure: 2.4 bar | Flow: 8.1 L/s", "info");
        } else if (hoveredNode === "reservoir") {
            showToast("Dielectric Oil Reservoir", "Synthetic Dielectric Fluid Tank | Viscosity: 1.04 cSt @ 40°C | Capacity: 4,200 Liters", "info");
        }
    });
}

function initMempoolCanvas() {
    const canvas = document.getElementById("mempool-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resizeMempoolCanvas() {
        const p = canvas.parentElement;
        if (p) {
            canvas.width = p.clientWidth || 300;
            canvas.height = Math.max(p.clientHeight || 150, 150);
        }
    }
    resizeMempoolCanvas();
    if (window._resizeMempoolCanvas) window.removeEventListener("resize", window._resizeMempoolCanvas); window._resizeMempoolCanvas = resizeMempoolCanvas;
    window.addEventListener("resize", resizeMempoolCanvas);

    if (window.mempoolAnimId) cancelAnimationFrame(window.mempoolAnimId);

    const mempoolItems = [];
    for (let i = 0; i < 15; i++) {
        mempoolItems.push({
            x: Math.random() * (canvas.width || 300),
            y: Math.random() * (canvas.height || 150),
            vx: (Math.random() - 0.5) * 0.6,
            vy: (Math.random() - 0.5) * 0.6,
            size: 3 + Math.random() * 4,
            fee: (10 + Math.random() * 50).toFixed(1) + " sat/vB"
        });
    }

    function renderMempoolCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        mempoolItems.forEach(item => {
            item.x += item.vx;
            item.y += item.vy;

            if (item.x < 0 || item.x > canvas.width) item.vx *= -1;
            if (item.y < 0 || item.y > canvas.height) item.vy *= -1;

            ctx.beginPath();
            ctx.arc(item.x, item.y, item.size, 0, Math.PI * 2);
            ctx.fillStyle = "#00f0ff";
            ctx.shadowColor = "#00f0ff";
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        window.mempoolAnimId = requestAnimationFrame(renderMempoolCanvas);
    }
    renderMempoolCanvas();
}

document.addEventListener("DOMContentLoaded", () => {
    initCountryDropdown();
    initDepositCoinSelector();
    setupAddressAutoClear();
    setupAddressEventListeners();

    const depModal = document.getElementById("deposit-modal");
    if (depModal) {
        depModal.addEventListener("click", (e) => {
            if (e.target === depModal) {
                closeDepositModal();
            }
        });
    }

    const authReqModal = document.getElementById("auth-required-modal");
    if (authReqModal) {
        authReqModal.addEventListener("click", (e) => {
            if (e.target === authReqModal) {
                closeAuthRequiredModal();
            }
        });
    }

    const adminSupportModal = document.getElementById("admin-support-modal");
    if (adminSupportModal) {
        adminSupportModal.addEventListener("click", (e) => {
            if (e.target === adminSupportModal) {
                closeAdminSupportModal();
            }
        });
    }

    const guestMiningModal = document.getElementById("guest-start-mining-modal");
    if (guestMiningModal) {
        guestMiningModal.addEventListener("click", (e) => {
            if (e.target === guestMiningModal) {
                closeGuestStartMiningModal();
            }
        });
    }

    const chatInput = document.getElementById("chat-input");
    if (chatInput) {
        chatInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                const form = chatInput.closest("form");
                if (form) {
                    if (typeof Event !== "undefined") { form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true })); }
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
            const guestMiningModal = document.getElementById("guest-start-mining-modal");
            if (guestMiningModal && !guestMiningModal.classList.contains("hidden")) {
                closeGuestStartMiningModal();
            }
        }
    });

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

// --- SHARED CLIENT DATABASE AUTHENTICATION ENGINE ---
function generateInitialSharedClientsDB() {
    function createSeededRandom(seed) {
        let s = seed % 2147483647;
        if (s <= 0) s += 2147483646;
        return function() {
            s = (s * 16807) % 2147483647;
            return (s - 1) / 2147483646;
        };
    }

    function genPass(seed) {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let pass = "";
        for (let i = 0; i < 8; i++) {
            pass += chars.charAt(Math.floor(((seed * (i + 1) * 31) % 1000) / 1000 * chars.length));
        }
        return pass;
    }

    function genInv(seed) {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let key = "CM-";
        for (let i = 0; i < 57; i++) {
            key += chars.charAt(Math.floor(((seed * (i + 1) * 17) % 1000) / 1000 * chars.length));
        }
        return key;
    }

    const intCountries = [
        { name: "United States", code: "US", firstNames: ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles", "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen"], lastNames: ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"] },
        { name: "United Kingdom", code: "GB", firstNames: ["Oliver", "George", "Harry", "Noah", "Jack", "Leo", "Arthur", "Muhammad", "Oscar", "Charlie", "Olivia", "Amelia", "Isla", "Ava", "Mia", "Ivy", "Lily", "Freya", "Florence", "Rosie"], lastNames: ["Smith", "Jones", "Taylor", "Brown", "Williams", "Wilson", "Johnson", "Davies", "Robinson", "Wright", "Thompson", "Evans", "Walker", "White", "Roberts", "Green", "Hall", "Wood", "Jackson", "Clarke"] },
        { name: "Germany", code: "DE", firstNames: ["Maximilian", "Alexander", "Paul", "Leon", "Louis", "Ben", "Jonas", "Elias", "Luca", "Felix", "Emma", "Mia", "Hannah", "Sophia", "Emilia", "Lina", "Anna", "Marie", "Mila", "Ella"], lastNames: ["Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann", "Schäfer", "Koch", "Bauer", "Richter", "Klein", "Wolf", "Schröder", "Neumann", "Schwarz", "Zimmermann"] },
        { name: "Japan", code: "JP", firstNames: ["Ren", "Haruto", "Minato", "Yuma", "Itsuki", "Hiroto", "Sota", "Toma", "Asahi", "Riku", "Himari", "Hina", "Yua", "Anna", "Tsumugi", "Ichika", "Mei", "Aoi", "Rio", "Rin"], lastNames: ["Sato", "Suzuki", "Takahashi", "Tanaka", "Watanabe", "Ito", "Yamamoto", "Nakamura", "Kobayashi", "Kato", "Yoshida", "Yamada", "Sasaki", "Yamaguchi", "Saito", "Matsumoto", "Inoue", "Kimura", "Hayashi", "Shimizu"] },
        { name: "Canada", code: "CA", firstNames: ["Liam", "Jackson", "Noah", "Lucas", "Oliver", "Benjamin", "Leo", "Ethan", "William", "Owen", "Olivia", "Emma", "Charlotte", "Amelia", "Sophia", "Ava", "Chloe", "Isla", "Mila", "Maya"], lastNames: ["Smith", "Brown", "Tremblay", "Martin", "Roy", "Wilson", "MacDonald", "Gagnon", "Johnson", "Taylor", "Campbell", "Lavoie", "Anderson", "Leblanc", "Lee", "Jones", "White", "Williams", "Côté", "Miller"] }
    ];

    const plans = [
        { name: "Beginner", investment: 250, hash: "50 TH/s", btcPerMonth: 0.0035, algorithm: "SHA-256 (ASIC)" },
        { name: "Advanced", investment: 1200, hash: "280 TH/s", btcPerMonth: 0.0185, algorithm: "SHA-256 (Immersion)" },
        { name: "Pro Trader", investment: 5000, hash: "1,250 TH/s", btcPerMonth: 0.0820, algorithm: "SHA-256 (Quantum AI)" }
    ];

    const clients = [];
    for (let i = 1; i <= 500; i++) {
        const seed = i;
        const seededRandom = createSeededRandom(seed);
        const countryData = intCountries[i % intCountries.length];
        const relIndex = Math.floor(i / intCountries.length);
        
        const fIdx = relIndex % countryData.firstNames.length;
        const lIdx = Math.floor(relIndex / countryData.firstNames.length) % countryData.lastNames.length;
        const m1 = String.fromCharCode(65 + (relIndex % 26));
        const m2 = String.fromCharCode(65 + (Math.floor(relIndex / 26) % 26));
        
        const firstName = countryData.firstNames[fIdx];
        const lastName = countryData.lastNames[lIdx];
        const fullName = `${firstName} ${m1}.${m2}. ${lastName}`;
        const email = `${firstName.toLowerCase()}.${m1.toLowerCase()}.${m2.toLowerCase()}.${lastName.toLowerCase()}@cryptomin-user.com`;
        const country = countryData.name;

        const planRatio = i % 100;
        const planObj = planRatio < 65 ? plans[0] : (planRatio < 90 ? plans[1] : plans[2]);
        const investment = planObj.investment;
        const hashrate = planObj.hash;
        const monthlyBtc = (planObj.btcPerMonth * (0.9 + seededRandom() * 0.2)).toFixed(8);
        const totalMined = (parseFloat(monthlyBtc) * (6 + seededRandom() * 18)).toFixed(8);
        const totalWithdrawn = (parseFloat(totalMined) * (0.4 + seededRandom() * 0.4)).toFixed(8);
        const pendingWithdrawal = (parseFloat(totalMined) - parseFloat(totalWithdrawn)).toFixed(8);

        const isVerified = (i % 7 === 0) ? "Pending KYC" : ((i % 19 === 0) ? "Rejected" : "KYC Approved");
        const status = (i % 11 === 0) ? "Suspended" : ((i % 23 === 0) ? "Inactive" : "Active");

        const regYear = 2022 + (i % 3);
        const regMonth = 1 + (i % 12);
        const regDay = 1 + (i % 28);
        const regDateStr = `${regYear}-${regMonth.toString().padStart(2, '0')}-${regDay.toString().padStart(2, '0')}`;

        const isEligibleClient = (isVerified === "KYC Approved" || isVerified === "Approved") && (status === "Active");
        let initialPass = null;
        let initialPassStat = "NOT_ELIGIBLE";
        let initialPassDate = null;
        let initialInvKey = null;
        let initialInvStat = "NOT_ELIGIBLE";
        let initialInvDate = null;

        if (isEligibleClient) {
            initialPass = genPass(seed);
            initialPassStat = "ACTIVE";
            initialPassDate = regDateStr;

            if (i % 3 === 0) {
                initialInvKey = genInv(seed);
                initialInvStat = (i % 9 === 0) ? "REDEEMED" : "GENERATED";
                initialInvDate = regDateStr;
            } else {
                initialInvKey = null;
                initialInvStat = "NOT_GENERATED";
                initialInvDate = null;
            }
        }

        if (i === 12) {
            clients.push({
                id: "USR-00012",
                avatar: "SK",
                name: "Sourasish A.A. Karak",
                email: "sourasish.a.a.karak@cryptomin-user.com",
                country: "United States",
                regDate: "2024-05-15",
                verified: "KYC Approved",
                plan: "Starter",
                investment: 0,
                hashrate: "50 TH/s",
                algorithm: "SHA-256",
                balance: "0.000500",
                earned: "0.001500",
                withdrawn: "0.001000",
                pending: "0.000000",
                status: "Active",
                isEligible: true,
                invitationKey: "DUS4KJ41DXFD6QQ4860WOJ5QOAD681XFP6NVRBP4P9F1OOHLBAP1UOV9CK9L",
                invitationStatus: "GENERATED",
                invitationKeyCreated: "2024-05-15",
                passkey: "6DKPOTWJ",
                passkeyStatus: "ACTIVE",
                passkeyCreated: "2024-05-15",
                generatedBy: "Administrator",
                activity: []
            });
            continue;
        }

        clients.push({
            id: `USR-${i.toString().padStart(5, '0')}`,
            avatar: firstName[0] + lastName[0],
            name: fullName,
            email: email,
            country: country,
            regDate: regDateStr,
            verified: isVerified,
            plan: planObj.name,
            investment: investment,
            hashrate: hashrate,
            algorithm: planObj.algorithm,
            balance: monthlyBtc,
            earned: totalMined,
            withdrawn: totalWithdrawn,
            pending: pendingWithdrawal,
            status: status,
            isEligible: isEligibleClient,
            invitationKey: initialInvKey,
            invitationStatus: initialInvStat,
            invitationKeyCreated: initialInvDate,
            passkey: initialPass,
            passkeyStatus: initialPassStat,
            passkeyCreated: initialPassDate,
            generatedBy: "Administrator",
            activity: []
        });
    }
    return clients;
}


function getSharedClientsDB() {
    try {
        const stored = localStorage.getItem("CRYPTOMIN_SHARED_CLIENTS_DB_V1");
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (e) {
        console.error("Error reading shared clients DB:", e);
    }
    // Auto-initialize shared database single source of truth
    const initialDb = generateInitialSharedClientsDB();
    saveSharedClientsDB(initialDb);
    return initialDb;
}

function saveSharedClientsDB(db) {
    try {
        localStorage.setItem("CRYPTOMIN_SHARED_CLIENTS_DB_V1", JSON.stringify(db));
    } catch (e) {
        console.error("Error saving shared clients DB:", e);
    }
}

function loadClientSessionData(clientRecord) {
    let client = clientRecord;
    const db = getSharedClientsDB();

    if (!client) {
        try {
            const sessionStr = localStorage.getItem("CRYPTOMIN_CLIENT_SESSION");
            if (sessionStr) {
                const session = JSON.parse(sessionStr);
                if (session && session.currentClientID && session.loggedIn) {
                    client = db.find(c => c.id === session.currentClientID);
                }
            }
        } catch(e) {
            console.error("Error loading client session:", e);
        }
    }

    if (!client) return false;

    // Live validation against Single Source of Truth Shared Client Database
    const kycVal = client.verified ? client.verified.trim() : "";
    const isKycApproved = (kycVal === "KYC Approved" || kycVal === "Approved");
    const accStatus = client.status ? client.status.trim() : "";
    const isActive = (accStatus === "Active");
    const isEligible = isKycApproved && isActive;

    const invStatus = client.invitationStatus ? client.invitationStatus.trim().toUpperCase() : "";
    const isKeyValid = (invStatus === "GENERATED" || invStatus === "REDEEMED");

    const passStatus = client.passkeyStatus ? client.passkeyStatus.trim().toUpperCase() : "ACTIVE";
    const isPassValid = (passStatus === "ACTIVE" || passStatus === "GENERATED");

    if (!isEligible || !isKeyValid || !isPassValid || invStatus === "DISABLED" || invStatus === "EXPIRED" || passStatus === "DISABLED") {
        // Access Denied: Revoke session
        localStorage.removeItem("CRYPTOMIN_CLIENT_SESSION");
        if (typeof showToast === 'function') {
            showToast("Access Denied", "Account status altered by Administrator, passkey disabled, or Invitation Key revoked.", "danger");
        }
        return false;
    }

    // Overwrite STATE.user completely with this SPECIFIC client's stored record ONLY
    STATE.user = {
        isLoggedIn: true,
        id: client.id,
        name: client.name,
        email: client.email,
        country: client.country || "United States",
        nationality: client.nationality || client.country || "United States",
        phone: client.phone || "+1 (555) 234-1001",
        city: client.city || "New York",
        residentialAddress: client.residentialAddress || "100 Grand Boulevard",
        postalCode: client.postalCode || "10001",
        walletAddress: client.walletAddress || "",
        regDate: client.regDate || "2022-04-15",
        referralCode: client.referralCode || `REF-${client.id.replace('USR-', '')}`,
        verified: client.verified,
        status: client.status,
        plan: client.plan || "Beginner",
        hashrate: client.hashrate || (client.freeStarterPlanActivated ? "50 H/s" : "0 H/s"),
        balance: parseFloat(client.balance) || 0,
        earned: parseFloat(client.earned) || 0,
        withdrawn: parseFloat(client.withdrawn) || 0,
        pending: parseFloat(client.pending) || 0,
        investment: parseFloat(client.investment) || 0,
        freeStarterPlanActivated: (invStatus === "REDEEMED" || client.freeStarterPlanActivated || false),
        activeContracts: client.activeContracts || [],
        transactions: client.activity || [],
        referrals: {
            count: client.referralCount || 0,
            earnings: client.referralEarnings || 0.0
        }
    };

    // Update Profile & Dashboard UI elements dynamically for THIS client
    const elProfName = document.getElementById("db-profile-name");
    const elSetName = document.getElementById("set-name");
    const elSetEmail = document.getElementById("set-email");
    const elSetWallet = document.getElementById("set-wallet-btc");
    const walletDepAddr = document.getElementById("wallet-dep-addr");

    if (elProfName) elProfName.textContent = client.name;
    if (elSetName) elSetName.value = client.name;
    if (elSetEmail) elSetEmail.value = client.email;
    if (elSetWallet) elSetWallet.value = client.walletAddress || "";
    if (walletDepAddr) {
        walletDepAddr.value = client.walletAddress || "";
        if (typeof Event !== "undefined") { walletDepAddr.dispatchEvent(new Event("input")); }
    }

    const elProfId = document.getElementById("prof-client-id");
    const elProfCountry = document.getElementById("prof-country");
    const elProfPhone = document.getElementById("prof-phone");
    const elProfRegDate = document.getElementById("prof-reg-date");
    const elProfRefCode = document.getElementById("prof-ref-code");
    const elProfKyc = document.getElementById("prof-kyc-status");
    const elProfAccStatus = document.getElementById("prof-account-status");
    const elProfPlan = document.getElementById("prof-plan-name");
    const elProfHash = document.getElementById("prof-hashrate");

    if (elProfId) elProfId.textContent = client.id;
    if (elProfCountry) elProfCountry.textContent = client.country || "United States";
    if (elProfPhone) elProfPhone.textContent = client.phone || "+1 (555) 234-1001";
    if (elProfRegDate) elProfRegDate.textContent = client.regDate || "2022-04-15";
    if (elProfRefCode) elProfRefCode.textContent = client.referralCode || `REF-${client.id.replace('USR-', '')}`;
    if (elProfKyc) elProfKyc.textContent = client.verified;
    if (elProfAccStatus) elProfAccStatus.textContent = client.status;
    if (elProfPlan) elProfPlan.textContent = client.plan || "Beginner";
    if (elProfHash) elProfHash.textContent = client.hashrate || "50 H/s";

    const dbBal = document.getElementById("db-balance");
    const dbBalUsd = document.getElementById("db-balance-usd");
    const dbHash = document.getElementById("db-hashrate");

    const bal = parseFloat(client.balance) || 0;
    if (dbBal) dbBal.textContent = bal.toFixed(8) + " BTC";
    if (dbBalUsd) dbBalUsd.textContent = "$" + (bal * 65421.50).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (dbHash) dbHash.textContent = client.hashrate || "50 H/s";

    // Synchronize UI view & navbar state
    switchUIState(true, client);

    return true;
}

// Master UI State Switcher (Client Mode vs Guest Mode)
function switchUIState(isLoggedIn, clientRecord = null) {
    const landingView = document.getElementById("landing-view") || document.getElementById("public-landing-view");
    const dashboardView = document.getElementById("dashboard-view") || document.getElementById("client-dashboard-view");

    const headerSignupBtn = document.getElementById("header-signup-btn");
    const mobileSignupBtn = document.getElementById("mobile-signup-btn");
    const headerStartBtn = document.getElementById("header-start-mining-btn");
    const mobileStartBtn = document.getElementById("mobile-start-mining-btn");
    const navClientProfile = document.getElementById("nav-client-profile");

    if (isLoggedIn && clientRecord) {
        // --- CLIENT MODE ---
        if (landingView) landingView.classList.add("hidden");
        if (dashboardView) dashboardView.classList.remove("hidden");

        // Navbar Auth Buttons Update
        if (headerSignupBtn) headerSignupBtn.classList.add("hidden");
        if (mobileSignupBtn) mobileSignupBtn.classList.add("hidden");
        if (headerStartBtn) headerStartBtn.classList.add("hidden");
        if (mobileStartBtn) mobileStartBtn.classList.add("hidden");

        if (navClientProfile) {
            navClientProfile.classList.remove("hidden");

            // Generate initials (e.g., "LM" for Louis Mercier)
            const parts = (clientRecord.name || "Operator").trim().split(" ");
            const initials = parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();

            const avatarInitials = document.getElementById("nav-avatar-initials");
            const navName = document.getElementById("nav-client-name");
            const navId = document.getElementById("nav-client-id");
            const navBal = document.getElementById("nav-client-balance");

            if (avatarInitials) avatarInitials.textContent = initials;
            if (navName) navName.textContent = clientRecord.name;
            if (navId) navId.textContent = clientRecord.id;
            if (navBal) navBal.textContent = (parseFloat(clientRecord.balance) || 0).toFixed(8) + " BTC";
        }

        // Start Mining button state
        const invStatus = clientRecord.invitationStatus ? clientRecord.invitationStatus.trim().toUpperCase() : "";
        const isKeyRedeemed = (invStatus === "REDEEMED" || clientRecord.freeStarterPlanActivated === true);
        const kycVal = clientRecord.verified ? clientRecord.verified.trim() : "";
        const isKycApproved = (kycVal === "KYC Approved" || kycVal === "Approved");
        const accStatus = clientRecord.status ? clientRecord.status.trim() : "";
        const isEligible = (clientRecord.isEligible === true && isKycApproved && accStatus === "Active");

        const btnStartMining = document.getElementById("btn-start-mining");
        if (btnStartMining) {
            if (isKeyRedeemed && isEligible) {
                btnStartMining.removeAttribute("disabled");
                btnStartMining.style.opacity = "1";
                btnStartMining.style.cursor = "pointer";
            } else {
                btnStartMining.setAttribute("disabled", "true");
                btnStartMining.style.opacity = "0.6";
                btnStartMining.style.cursor = "not-allowed";
            }
        }

        initDashboard();
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    } else {
        // --- GUEST MODE ---
        if (landingView) landingView.classList.remove("hidden");
        if (dashboardView) dashboardView.classList.add("hidden");

        if (headerSignupBtn) headerSignupBtn.classList.remove("hidden");
        if (mobileSignupBtn) mobileSignupBtn.classList.remove("hidden");
        if (headerStartBtn) headerStartBtn.classList.remove("hidden");
        if (mobileStartBtn) mobileStartBtn.classList.remove("hidden");

        if (navClientProfile) navClientProfile.classList.add("hidden");

        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    }
}

// Auto-restore active session on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
    const hasSession = loadClientSessionData();
    if (!hasSession) {
        switchUIState(false);
    }
});



