// --- LOGIN & SESSION CONTROL ENGINE ---
        function checkAdminSession() {
            const isAuth = localStorage.getItem("CRYPTOMIN_ADMIN_AUTH") === "true" || sessionStorage.getItem("adminLogged") === "true";
            const loginSec = document.getElementById("admin-login-section");
            const dashSec = document.getElementById("admin-dashboard-section");

            if (isAuth) {
                if (loginSec) loginSec.style.display = "none";
                if (dashSec) {
                    dashSec.style.display = "block";
                    dashSec.style.opacity = "1";
                }
                initDashboard();
            } else {
                if (loginSec) loginSec.style.display = "flex";
                if (dashSec) dashSec.style.display = "none";
            }
        }

        function handleLoginSubmit(e) {
            if (e && e.preventDefault) e.preventDefault();
            const usernameInput = document.getElementById("admin-id");
            const passwordInput = document.getElementById("passkey");
            const msgEl = document.getElementById("login-message");

            const username = (usernameInput ? usernameInput.value : "").trim().toLowerCase();
            const password = (passwordInput ? passwordInput.value : "").trim();

            if (msgEl) msgEl.style.display = "none";

            if (username === "somu" && password === "somu") {
                localStorage.setItem("CRYPTOMIN_ADMIN_AUTH", "true");
                sessionStorage.setItem("adminLogged", "true");

                if (msgEl) {
                    msgEl.className = "message-box success";
                    msgEl.textContent = "Authentication Successful";
                    msgEl.style.display = "block";
                }

                setTimeout(() => {
                    const loginSec = document.getElementById("admin-login-section");
                    const dashSec = document.getElementById("admin-dashboard-section");
                    
                    if (loginSec) loginSec.style.display = "none";
                    if (dashSec) {
                        dashSec.style.display = "block";
                        dashSec.style.opacity = "0";
                        if (typeof gsap !== "undefined" && gsap.to) {
                            gsap.to(dashSec, { opacity: 1, duration: 0.5, ease: "power2.out" });
                        } else {
                            dashSec.style.opacity = "1";
                        }
                    }
                    initDashboard();
                }, 800);
                return false;
            } else {
                localStorage.removeItem("CRYPTOMIN_ADMIN_AUTH");
                sessionStorage.removeItem("adminLogged");
                if (msgEl) {
                    msgEl.className = "message-box error";
                    msgEl.textContent = "Invalid Username or Password";
                    msgEl.style.display = "block";
                }
                return false;
            }
        }

        function handleSecureExit() {
            localStorage.removeItem("CRYPTOMIN_ADMIN_AUTH");
            sessionStorage.removeItem("adminLogged");

            const dashSec = document.getElementById("admin-dashboard-section");
            if (dashSec) dashSec.style.display = "none";

            const loginSec = document.getElementById("admin-login-section");
            if (loginSec) loginSec.style.display = "flex";

            const idEl = document.getElementById("admin-id");
            const passEl = document.getElementById("passkey");
            if (idEl) idEl.value = "";
            if (passEl) passEl.value = "";

            const msgEl = document.getElementById("login-message");
            if (msgEl) msgEl.style.display = "none";
        }

        function handleLogoutSubmit() {
            handleSecureExit();
        }

        let isDashboardInitialized = false;

        function initDashboard() {
            populateCountryFilterOptions();
            updateKycCounters();
            applyClientFilters();
            applyTxFilters();
            renderNodeCards();
            initWalletCenterModule();
            initInvitationKeyDatabaseModule();
            
            if (!isDashboardInitialized) {
                initAllDashboardCharts();
                isDashboardInitialized = true;
            } else {
                [dailyRevenueChart, capitalGrowthChart, portfolioPieChart, miningOutputChart, nodeTempChart].forEach(chart => {
                    if (chart) {
                        chart.resize();
                        chart.update();
                    }
                });
            }
        }

        // --- REALTIME DEMO DATA GENERATORS ---
        const intCountries = [
            { name: "United States", code: "us", firstNames: ["Michael", "Emily", "Daniel", "Olivia", "James"], lastNames: ["Johnson", "Carter", "Wilson", "Brown", "Miller"] },
            { name: "Canada", code: "ca", firstNames: ["Ethan", "Sophia", "Lucas", "Charlotte"], lastNames: ["Walker", "Moore", "White", "King"] },
            { name: "United Kingdom", code: "uk", firstNames: ["Oliver", "Harry", "Amelia", "George"], lastNames: ["Harris", "Walker", "Scott", "Taylor"] },
            { name: "Germany", code: "de", firstNames: ["Lukas", "Emma", "Noah"], lastNames: ["Schneider", "Fischer", "Weber"] },
            { name: "France", code: "fr", firstNames: ["Louis", "Camille", "Thomas"], lastNames: ["Martin", "Bernard", "Dubois"] },
            { name: "Norway", code: "no", firstNames: ["Erik", "Lars", "Emma"], lastNames: ["Hansen", "Johansen", "Larsen"] },
            { name: "Sweden", code: "se", firstNames: ["Johan", "Elsa"], lastNames: ["Andersson", "Lindberg"] },
            { name: "Denmark", code: "dk", firstNames: ["Mikkel", "Freja"], lastNames: ["Nielsen", "Rasmussen"] },
            { name: "Netherlands", code: "nl", firstNames: ["Daan", "Eva"], lastNames: ["Visser", "Bakker"] },
            { name: "Switzerland", code: "ch", firstNames: ["Lorenzo", "Marco", "Anna"], lastNames: ["Bieri", "Keller", "Meier"] },
            { name: "Japan", code: "jp", firstNames: ["Haruto", "Yuki", "Ren", "Aoi"], lastNames: ["Sato", "Tanaka", "Nakamura", "Suzuki"] },
            { name: "South Korea", code: "kr", firstNames: ["Min-Jun", "Ji-Hoon", "Seo-Yeon"], lastNames: ["Kim", "Park", "Lee"] },
            { name: "Singapore", code: "sg", firstNames: ["Wei Ming", "Jia Hui"], lastNames: ["Tan", "Lim"] },
            { name: "Malaysia", code: "my", firstNames: ["Muhammad", "Nur"], lastNames: ["Amir", "Aisyah"] },
            { name: "Indonesia", code: "id", firstNames: ["Budi", "Siti"], lastNames: ["Santoso", "Rahma"] },
            { name: "Australia", code: "au", firstNames: ["Liam", "Noah", "Chloe"], lastNames: ["Thompson", "Wilson", "Martin"] },
            { name: "Brazil", code: "br", firstNames: ["Gabriel", "Lucas", "Ana", "Pedro"], lastNames: ["Silva", "Costa", "Souza", "Oliveira"] },
            { name: "United Arab Emirates", code: "ae", firstNames: ["Ahmed", "Omar", "Fatima"], lastNames: ["Al Mansoori", "Al Suwaidi", "Al Nuaimi"] },
            { name: "Saudi Arabia", code: "sa", firstNames: ["Yousef", "Fahad", "Faisal", "Maha"], lastNames: ["Al-Harbi", "Al-Otaibi", "Al-Ghamdi", "Al-Qahtani"] },
            { name: "Qatar", code: "qa", firstNames: ["Khalid", "Jassim", "Hamad", "Noora"], lastNames: ["Al-Thani", "Al-Kuwari", "Al-Marri", "Al-Hajri"] },
            { name: "Kuwait", code: "kw", firstNames: ["Abdullah", "Nasser", "Mubarak", "Dalal"], lastNames: ["Al-Mutairi", "Al-Anzi", "Al-Shammari", "Al-Rasheed"] },
            { name: "Spain", code: "es", firstNames: ["Alejandro", "Daniel", "Mateo", "Lucia", "Sofia"], lastNames: ["Garcia", "Rodriguez", "Gonzalez", "Fernandez"] },
            { name: "Italy", code: "it", firstNames: ["Lorenzo", "Leonardo", "Giulia", "Sofia"], lastNames: ["Rossi", "Russo", "Ferrari", "Esposito"] },
            { name: "Belgium", code: "be", firstNames: ["Arthur", "Noah", "Emma", "Louise"], lastNames: ["Peeters", "Janssens", "Maes", "Jacobs"] },
            { name: "Austria", code: "at", firstNames: ["Maximilian", "Paul", "Marie", "Anna"], lastNames: ["Gruber", "Huber", "Bauer", "Wagner"] },
            { name: "Finland", code: "fi", firstNames: ["Leo", "Elias", "Aino", "Sofia"], lastNames: ["Korhonen", "Virtanen", "Mäkinen", "Nieminen"] },
            { name: "Ireland", code: "ie", firstNames: ["Jack", "Connor", "Grace", "Emily"], lastNames: ["Murphy", "Kelly", "O'Connor", "O'Neill"] },
            { name: "New Zealand", code: "nz", firstNames: ["Oliver", "Jack", "Charlotte", "Amelia"], lastNames: ["Smith", "Jones", "Williams", "Brown"] }
        ];

        const plans = [
            { name: "Beginner", hash: "10 TH/s", investment: 100, duration: 30, algorithm: "SHA-256" },
            { name: "Starter", hash: "50 TH/s", investment: 500, duration: 60, algorithm: "SHA-256" },
            { name: "Professional", hash: "120 TH/s", investment: 1000, duration: 90, algorithm: "SHA-256" },
            { name: "Business", hash: "750 TH/s", investment: 5000, duration: 180, algorithm: "SHA-256" },
            { name: "Enterprise", hash: "2 PH/s", investment: 10000, duration: 365, algorithm: "SHA-256" },
            { name: "Ultimate", hash: "Custom", investment: 50000, duration: 365, algorithm: "SHA-256" }
        ];

        function seededRandom(seed) {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        }

        function generate60CharInvitationKey(existingClientsList) {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let key = '';
            const array = new Uint8Array(60);
            if (window.crypto && window.crypto.getRandomValues) {
                window.crypto.getRandomValues(array);
                for (let i = 0; i < 60; i++) {
                    key += chars[array[i] % chars.length];
                }
            } else {
                for (let i = 0; i < 60; i++) {
                    key += chars[Math.floor(Math.random() * chars.length)];
                }
            }
            const list = existingClientsList || (typeof mockClients !== 'undefined' ? mockClients : []);
            const existingKeys = new Set(list.map(c => c.invitationKey).filter(Boolean));
            if (existingKeys.has(key)) {
                return generate60CharInvitationKey(list);
            }
            return key;
        }

        function generate8CharPasskey(existingClientsList) {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            const forbiddenSequences = ['12345678', '87654321', 'ABCDEFGH', 'HGFEDCBA', '00000000', '11111111', 'AAAAAAAA'];
            let passkey = '';
            
            const array = new Uint8Array(8);
            if (window.crypto && window.crypto.getRandomValues) {
                window.crypto.getRandomValues(array);
                for (let i = 0; i < 8; i++) {
                    passkey += chars[array[i] % chars.length];
                }
            } else {
                for (let i = 0; i < 8; i++) {
                    passkey += chars[Math.floor(Math.random() * chars.length)];
                }
            }

            if (forbiddenSequences.includes(passkey)) {
                return generate8CharPasskey(existingClientsList);
            }

            const list = existingClientsList || (typeof mockClients !== 'undefined' ? mockClients : []);
            const existingPasskeys = new Set(list.map(c => c.passkey).filter(Boolean));
            if (existingPasskeys.has(passkey)) {
                return generate8CharPasskey(list);
            }

            return passkey;
        }

        const mockClients = [];

        for (let i = 1; i <= 500; i++) {
            const seed = i;
            const countryData = intCountries[i % intCountries.length];
            const relIndex = Math.floor(i / intCountries.length);
            
            const fIdx = relIndex % countryData.firstNames.length;
            const lIdx = Math.floor(relIndex / countryData.firstNames.length) % countryData.lastNames.length;
            const mIdx1 = Math.floor(relIndex / (countryData.firstNames.length * countryData.lastNames.length)) % 26;
            const mIdx2 = Math.floor(relIndex / (countryData.firstNames.length * countryData.lastNames.length * 26)) % 26;
            
            const firstName = countryData.firstNames[fIdx];
            const lastName = countryData.lastNames[lIdx];
            const m1 = String.fromCharCode(65 + mIdx1);
            const m2 = String.fromCharCode(65 + mIdx2);
            
            const fullName = `${firstName} ${m1}.${m2}. ${lastName}`;
            const email = `${firstName.toLowerCase().replace(" ", "")}.${m1.toLowerCase()}.${m2.toLowerCase()}.${lastName.toLowerCase().replace(" ", "")}@cryptomin-user.com`;
            const country = countryData.name;

            let planObj;
            const planRatio = i % 100;
            if (planRatio < 65) {
                planObj = plans[0];
            } else if (planRatio < 90) {
                planObj = plans[1];
            } else {
                planObj = plans[2];
            }

            const investment = planObj.investment;
            const hashrate = planObj.hash;
            
            let monthlyBtc;
            if (planObj.name === "Beginner") {
                monthlyBtc = (0.00008 + seededRandom(seed * 12) * 0.00004).toFixed(6);
            } else if (planObj.name === "Starter") {
                monthlyBtc = (0.00045 + seededRandom(seed * 12) * 0.00009).toFixed(6);
            } else {
                monthlyBtc = (0.00120 + seededRandom(seed * 12) * 0.00020).toFixed(6);
            }
            
            const regYear = 2020 + Math.floor(seededRandom(seed * 7) * 6);
            const regMonth = 1 + Math.floor(seededRandom(seed * 8) * 12);
            const regDay = 1 + Math.floor(seededRandom(seed * 9) * 28);
            const regDateStr = `${regYear}-${regMonth.toString().padStart(2, '0')}-${regDay.toString().padStart(2, '0')}`;
            
            const verifySeed = i % 15;
            const isVerified = verifySeed === 0 ? "Pending KYC" : (verifySeed === 1 ? "Under Review" : (verifySeed === 2 ? "Pending Re-upload" : (verifySeed === 3 ? "KYC Rejected" : "KYC Approved")));
            
            const statusSeed = i % 30;
            const status = statusSeed === 0 ? "Suspended" : (statusSeed === 1 ? "Blocked" : (statusSeed === 2 ? "Offline" : "Active"));
            
            const totalMined = (parseFloat(monthlyBtc) * 3).toFixed(6);
            const totalWithdrawn = (parseFloat(monthlyBtc) * 2).toFixed(6);
            const walletBalance = (totalMined - totalWithdrawn).toFixed(6);
            const pendingWithdrawal = seededRandom(seed * 14) > 0.85 ? (parseFloat(walletBalance) * 0.2).toFixed(6) : "0.000000";

            const phone = `+1 (555) 234-${1000 + i}`;
            const citiesList = ["New York", "Toronto", "London", "Berlin", "Paris", "Oslo", "Stockholm", "Copenhagen", "Amsterdam", "Zurich", "Tokyo", "Seoul", "Singapore", "Kuala Lumpur", "Jakarta", "Sydney", "Sao Paulo", "Dubai", "Riyadh", "Doha", "Kuwait City", "Madrid", "Rome", "Brussels", "Vienna", "Helsinki", "Dublin", "Auckland"];
            const city = citiesList[i % citiesList.length];
            const residentialAddress = `${100 + i} Grand Boulevard Suite ${i % 5 + 1}`;
            const postalCode = `${10000 + i}`;
            const nationality = country;
            const dobYear = 1970 + (i % 30);
            const dobMonth = 1 + (i % 12);
            const dobDay = 1 + (i % 28);
            const dob = `${dobYear}-${dobMonth.toString().padStart(2, '0')}-${dobDay.toString().padStart(2, '0')}`;
            const idType = i % 2 === 0 ? "Passport" : "National ID Card";
            const idNumber = `ID-${dobYear}-${5000 + i}`;
            const passportNumber = i % 2 === 0 ? `PP-${dobYear}-${7000 + i}` : "";
            const ipCountry = country;
            const referralCode = `REF-${i.toString().padStart(4, '0')}`;
            const walletAddress = `bc1q${i.toString().padStart(6, '0')}${Math.floor(seededRandom(seed * 15) * 10000000).toString(16).padStart(8, '0')}`;

            const ip = `${Math.floor(seededRandom(seed*21)*150)+50}.${Math.floor(seededRandom(seed*22)*200)+20}.${Math.floor(seededRandom(seed*23)*200)+10}.${Math.floor(seededRandom(seed*24)*240)+10}`;
            const mac = `00:1A:${Math.floor(seededRandom(seed*25)*240).toString(16).toUpperCase().padStart(2,'0')}:${Math.floor(seededRandom(seed*26)*240).toString(16).toUpperCase().padStart(2,'0')}:${Math.floor(seededRandom(seed*27)*240).toString(16).toUpperCase().padStart(2,'0')}:${Math.floor(seededRandom(seed*28)*240).toString(16).toUpperCase().padStart(2,'0')}`;
            const deviceTypes = ["Desktop PC", "Laptop computer", "Mobile Tablet", "Rack Node Server"];
            const deviceType = deviceTypes[i % deviceTypes.length];
            const deviceName = `${deviceType.split(" ")[0]}-Client-${1000 + i}`;
            const osList = ["Windows 11 Pro", "macOS Sequoia", "Ubuntu Linux 24.04", "iOS 17.5", "Android 14"];
            const os = osList[i % osList.length];
            const browserList = ["Chrome 126.0", "Firefox 127.0", "Safari 17.4", "Edge 125.0"];
            const browser = browserList[i % browserList.length];
            const timezone = `UTC+${(i % 12) - 5}`;
            
            const walletTypes = ["BTC", "USDT TRC20", "ETH", "BNB"];
            const walletType = walletTypes[i % walletTypes.length];
            const totalDeposit = (investment * 1.25).toFixed(2);
            const totalWithdrawal = (parseFloat(totalWithdrawn) * 45000 * 0.75).toFixed(2);
            const lastWithdrawalAmount = (parseFloat(monthlyBtc) * 0.35).toFixed(6);
            const lastWithdrawalDate = `${regYear + 1}-${(regMonth % 12 + 1).toString().padStart(2, '0')}-05`;

            const isEligibleClient = (isVerified === "KYC Approved" || isVerified === "Approved") && (status === "Active");
            let initialPass = null;
            let initialPassStat = "NOT_ELIGIBLE";
            let initialPassDate = null;
            let initialInvKey = null;
            let initialInvStat = "NOT_ELIGIBLE";
            let initialInvDate = null;

            if (isEligibleClient) {
                initialPass = generate8CharPasskey(mockClients);
                initialPassStat = "ACTIVE";
                initialPassDate = regDateStr;

                if (i % 3 === 0) {
                    initialInvKey = generate60CharInvitationKey(mockClients);
                    initialInvStat = (i % 9 === 0) ? "REDEEMED" : "GENERATED";
                    initialInvDate = regDateStr;
                } else {
                    initialInvKey = null;
                    initialInvStat = "NOT_GENERATED";
                    initialInvDate = null;
                }
            }

            mockClients.push({
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
                lastLogin: `${regYear + 1}-${((regMonth + 2)%12 + 1).toString().padStart(2, '0')}-${regDay.toString().padStart(2, '0')} 12:34:00`,
                nodeAssignment: `Cluster-${(i % 5) + 1}`,
                phone: phone,
                city: city,
                residentialAddress: residentialAddress,
                postalCode: postalCode,
                nationality: nationality,
                dob: dob,
                idType: idType,
                idNumber: idNumber,
                passportNumber: passportNumber,
                ipCountry: ipCountry,
                referralCode: referralCode,
                walletAddress: walletAddress,
                ip: ip,
                mac: mac,
                deviceType: deviceType,
                deviceName: deviceName,
                os: os,
                browser: browser,
                timezone: timezone,
                walletType: walletType,
                totalDeposit: totalDeposit,
                totalWithdrawal: totalWithdrawal,
                lastWithdrawalAmount: lastWithdrawalAmount,
                lastWithdrawalDate: lastWithdrawalDate,
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

        // --- SHARED CLIENT DATABASE SYNC ---
        try {
            const savedDbStr = localStorage.getItem("CRYPTOMIN_SHARED_CLIENTS_DB_V1");
            if (savedDbStr) {
                const parsedDb = JSON.parse(savedDbStr);
                if (Array.isArray(parsedDb) && parsedDb.length > 0) {
                    mockClients.length = 0;
                    parsedDb.forEach(c => mockClients.push(c));
                } else {
                    localStorage.setItem("CRYPTOMIN_SHARED_CLIENTS_DB_V1", JSON.stringify(mockClients));
                }
            } else {
                localStorage.setItem("CRYPTOMIN_SHARED_CLIENTS_DB_V1", JSON.stringify(mockClients));
            }
        } catch(e) {
            console.error("Shared DB initialization error:", e);
        }

        function saveSharedClientsDB() {
            try {
                localStorage.setItem("CRYPTOMIN_SHARED_CLIENTS_DB_V1", JSON.stringify(mockClients));
            } catch(e) {
                console.error("Shared DB save error:", e);
            }
        }

        const mockTransactions = [];
        for (let i = 0; i < 80; i++) {
            const seed = i + 500;
            const client = mockClients[Math.floor(seededRandom(seed) * mockClients.length)];
            const type = seededRandom(seed * 2) > 0.6 ? "DEPOSIT" : (seededRandom(seed * 2) > 0.35 ? "WITHDRAW" : "REWARD");
            
            let amount, fee;
            if (type === "DEPOSIT") {
                amount = (0.005 + seededRandom(seed * 3) * 0.05).toFixed(6);
                fee = "0.000050";
            } else if (type === "WITHDRAW") {
                amount = (0.001 + seededRandom(seed * 3) * 0.02).toFixed(6);
                fee = "0.000080";
            } else {
                amount = (0.00005 + seededRandom(seed * 3) * 0.0005).toFixed(6);
                fee = "0.000000";
            }

            const chars = "abcdef0123456789";
            let txid = "";
            for (let j = 0; j < 16; j++) {
                txid += chars.charAt(Math.floor(seededRandom(seed + j) * chars.length));
            }

            const confirmCode = Math.floor(seededRandom(seed * 4) * 6);
            const status = type === "WITHDRAW" && seededRandom(seed * 5) > 0.85 ? "Pending" : "Confirmed";

            mockTransactions.push({
                txid: `0x${txid}...`,
                client: client.name,
                type: type,
                amount: amount,
                fee: fee,
                blockchain: "Bitcoin Mainnet",
                date: `2026-07-19 ${10 + Math.floor(seededRandom(seed * 6) * 12)}:${Math.floor(seededRandom(seed * 7) * 59).toString().padStart(2, '0')}:${Math.floor(seededRandom(seed * 8) * 59).toString().padStart(2, '0')}`,
                status: status,
                confirmations: confirmCode >= 3 ? "6+ Config" : `${confirmCode}/6 Sync`,
                wallet: `bc1q${txid.substring(0, 8)}...`
            });
        }

        const mockNodes = [
            { name: "Dubai General HQ", id: "DXB-NODE-01", location: "UAE", status: "online", temp: "48.2°C", efficiency: "16.4 J/TH", power: "0.58 MW", hashrate: "18.00 PH/s", asicCount: 1500, renewable: 85, source: "Solar Array Array-04" },
            { name: "Iceland Hydro-A", id: "ISL-NODE-02", location: "Iceland", status: "online", temp: "42.1°C", efficiency: "16.0 J/TH", power: "0.45 MW", hashrate: "15.00 PH/s", asicCount: 1250, renewable: 100, source: "Geothermal Powerhouse" },
            { name: "Norway Hydro-B", id: "NOR-NODE-03", location: "Norway", status: "online", temp: "39.4°C", efficiency: "17.0 J/TH", power: "0.42 MW", hashrate: "14.00 PH/s", asicCount: 1160, renewable: 100, source: "Glacial Hydro-B" },
            { name: "Canada Fjord-C", id: "CAN-NODE-04", location: "Canada", status: "online", temp: "44.8°C", efficiency: "17.2 J/TH", power: "0.39 MW", hashrate: "13.00 PH/s", asicCount: 1080, renewable: 95, source: "River-Fed Hydro Grid" },
            { name: "Switzerland Hydro-C", id: "SUI-NODE-05", location: "Switzerland", status: "online", temp: "43.5°C", efficiency: "18.0 J/TH", power: "0.33 MW", hashrate: "11.00 PH/s", asicCount: 920, renewable: 100, source: "Alpine Hydro-Electric" },
            { name: "Singapore Quantum Facility", id: "SGP-NODE-06", location: "Singapore", status: "online", temp: "46.5°C", efficiency: "16.8 J/TH", power: "0.35 MW", hashrate: "11.60 PH/s", asicCount: 970, renewable: 70, source: "District Grid + Solar" }
        ];

        // --- GLOBAL UI NAVIGATION CONTROLS ---
        document.querySelectorAll("#admin-sidebar li").forEach(menuItem => {
            menuItem.addEventListener("click", () => {
                document.querySelectorAll("#admin-sidebar li").forEach(li => li.classList.remove("active"));
                document.querySelectorAll(".tab-panel").forEach(panel => panel.classList.remove("active"));

                menuItem.classList.add("active");
                const selectedTab = menuItem.getAttribute("data-tab");
                const panel = document.getElementById(`tab-${selectedTab}`);
                panel.classList.add("active");

                const headerTitle = document.getElementById("panel-title-text");
                const headerDesc = document.getElementById("panel-desc-text");
                
                if (selectedTab === "overview") {
                    headerTitle.textContent = "Executive Performance Console";
                    headerDesc.textContent = "Operational statistics synchronized with the public network.";
                } else if (selectedTab === "clients") {
                    headerTitle.textContent = "Client Management Registry";
                    headerDesc.textContent = "Verify customer identities, manage active pools, and toggle limits.";
                } else if (selectedTab === "invitation-keys") {
                    headerTitle.textContent = "Invitation Key Database";
                    headerDesc.textContent = "Manage client invitation access keys and eligibility.";
                } else if (selectedTab === "investments") {
                    headerTitle.textContent = "Platform Capital Staking Ledger";
                    headerDesc.textContent = "Manage deposits, view plan allocations, and inspect growth indices.";
                } else if (selectedTab === "mining") {
                    headerTitle.textContent = "Cryptographic Mining Fleet Logs";
                    headerDesc.textContent = "Track SHA-256 target difficulty metrics and hardware logs.";
                } else if (selectedTab === "transactions") {
                    headerTitle.textContent = "Blockchain Broadcast Hub";
                    headerDesc.textContent = "Approve withdrawals, confirm ledger states, and review processing fees.";
                } else if (selectedTab === "wallet") {
                    headerTitle.textContent = "Admin Master Treasury Wallet";
                    headerDesc.textContent = "Monitor the platform treasury, mining reserves, client earnings and payout ledger.";
                } else if (selectedTab === "nodes") {
                    headerTitle.textContent = "Data Center Infrastructure Monitor";
                    headerDesc.textContent = "Track PUE, thermodynamics, PPA capacities, and node parameters.";
                }

                // Trigger chart updates on tab change
                if (isDashboardInitialized) {
                    setTimeout(() => {
                        [dailyRevenueChart, capitalGrowthChart, portfolioPieChart, miningOutputChart, nodeTempChart, walletDailyRevenueChart, walletMonthlyRevenueChart, clientEarningsDistChart, treasuryBalanceChart, payoutTrendChart].forEach(chart => {
                            if (chart) {
                                chart.resize();
                                chart.update();
                            }
                        });
                    }, 100);
                }
            });
        });

        // Live system clock updater
        setInterval(() => {
            const clockEl = document.getElementById("live-system-clock");
            if (clockEl) {
                const now = new Date();
                const dateStr = now.toLocaleDateString('en-GB').replace(/\//g, '-');
                const timeStr = now.toLocaleTimeString('en-GB');
                clockEl.textContent = `${dateStr} ${timeStr} UTC`;
            }
        }, 1000);

        // --- DYNAMIC RENDERING ENGINES ---
        let clientSearchQuery = "";
        let clientFilterPlan = "ALL";
        let clientFilterKyc = "ALL";
        let clientFilterStatus = "ALL";
        let clientFilterCountry = "ALL";
        let clientCurrentPage = 1;
        let clientPageSize = 10;
        let clientSortColumn = "id";
        let clientSortDirection = "asc";
        let filteredClientsList = [...mockClients];

        function handleClientSearch() {
            clientSearchQuery = document.getElementById("client-search").value.toLowerCase().trim();
            applyClientFilters();
        }

        function handleClientFilter() {
            clientFilterPlan = document.getElementById("client-filter-plan").value;
            clientFilterKyc = document.getElementById("client-filter-kyc").value;
            clientFilterStatus = document.getElementById("client-filter-status").value;
            const countryEl = document.getElementById("client-filter-country");
            if (countryEl) {
                clientFilterCountry = countryEl.value;
            }
            applyClientFilters();
        }

        function populateCountryFilterOptions() {
            const select = document.getElementById("client-filter-country");
            if (!select) return;
            
            const currentVal = select.value || "ALL";
            const uniqueCountries = [...new Set(mockClients.map(c => c.country))].sort();

            select.innerHTML = '<option value="ALL">All Countries</option>';
            uniqueCountries.forEach(country => {
                const opt = document.createElement("option");
                opt.value = country;
                opt.textContent = country;
                select.appendChild(opt);
            });

            select.value = currentVal;
        }

        function updateKycCounters() {
            let total = mockClients.length;
            let approved = 0;
            let pending = 0;
            let review = 0;
            let rejected = 0;
            let reupload = 0;

            mockClients.forEach(c => {
                if (c.verified === "KYC Approved") approved++;
                else if (c.verified === "Pending KYC") pending++;
                else if (c.verified === "Under Review") review++;
                else if (c.verified === "KYC Rejected") rejected++;
                else if (c.verified === "Pending Re-upload") reupload++;
            });

            const elTotal = document.getElementById("kyc-count-total");
            const elApproved = document.getElementById("kyc-count-approved");
            const elPending = document.getElementById("kyc-count-pending");
            const elReview = document.getElementById("kyc-count-review");
            const elRejected = document.getElementById("kyc-count-rejected");
            const elReupload = document.getElementById("kyc-count-reupload");

            if (elTotal) elTotal.textContent = total.toLocaleString();
            if (elApproved) elApproved.textContent = approved.toLocaleString();
            if (elPending) elPending.textContent = pending.toLocaleString();
            if (elReview) elReview.textContent = review.toLocaleString();
            if (elRejected) elRejected.textContent = rejected.toLocaleString();
            if (elReupload) elReupload.textContent = reupload.toLocaleString();
        }

        function applyClientFilters() {
            filteredClientsList = mockClients.filter(c => {
                const matchesSearch = c.id.toLowerCase().includes(clientSearchQuery) || 
                                      c.name.toLowerCase().includes(clientSearchQuery) || 
                                      c.email.toLowerCase().includes(clientSearchQuery) || 
                                      c.country.toLowerCase().includes(clientSearchQuery) ||
                                      (c.walletAddress && c.walletAddress.toLowerCase().includes(clientSearchQuery));
                const matchesPlan = clientFilterPlan === "ALL" || c.plan === clientFilterPlan;
                const matchesKyc = clientFilterKyc === "ALL" || c.verified === clientFilterKyc;
                const matchesStatus = clientFilterStatus === "ALL" || c.status === clientFilterStatus;
                const matchesCountry = clientFilterCountry === "ALL" || c.country === clientFilterCountry;
                return matchesSearch && matchesPlan && matchesKyc && matchesStatus && matchesCountry;
            });
            clientCurrentPage = 1;
            sortClientData();
            renderClientTable();
        }

        function sortClients(column) {
            if (clientSortColumn === column) {
                clientSortDirection = clientSortDirection === "asc" ? "desc" : "asc";
            } else {
                clientSortColumn = column;
                clientSortDirection = "asc";
            }
            sortClientData();
            renderClientTable();
        }

        function sortClientData() {
            filteredClientsList.sort((a, b) => {
                let valA = a[clientSortColumn];
                let valB = b[clientSortColumn];
                
                if (clientSortColumn === "investment" || clientSortColumn === "balance") {
                    valA = parseFloat(valA);
                    valB = parseFloat(valB);
                }

                if (valA < valB) return clientSortDirection === "asc" ? -1 : 1;
                if (valA > valB) return clientSortDirection === "asc" ? 1 : -1;
                return 0;
            });
        }

        function renderClientTable() {
            const tbody = document.getElementById("clients-table-tbody");
            if (!tbody) return;
            
            tbody.innerHTML = "";
            const startIdx = (clientCurrentPage - 1) * clientPageSize;
            
            const totalVirtualRecords = filteredClientsList.length;
            const pageOffset = (clientCurrentPage - 1) * clientPageSize;
            const virtualShowingEnd = Math.min(pageOffset + clientPageSize, totalVirtualRecords);
            document.getElementById("clients-pagination-info").textContent = 
                totalVirtualRecords === 0
                    ? `Showing 0 to 0 of 0 entries`
                    : `Showing ${pageOffset + 1} to ${virtualShowingEnd} of ${totalVirtualRecords.toLocaleString()} entries`;
            
            document.getElementById("btn-client-prev").disabled = clientCurrentPage === 1;
            const maxVirtualPages = Math.max(1, Math.ceil(totalVirtualRecords / clientPageSize));
            document.getElementById("btn-client-next").disabled = clientCurrentPage >= maxVirtualPages;
            document.getElementById("client-page-num").textContent = `Page ${clientCurrentPage} of ${maxVirtualPages}`;

            const pageList = filteredClientsList.slice(startIdx, startIdx + clientPageSize);
            
            if (pageList.length === 0) {
                tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 20px;">No clients match selected query filters.</td></tr>`;
                return;
            }

            pageList.forEach((c) => {
                const tr = document.createElement("tr");
                tr.onclick = () => openClientDrawer(c);
                
                const planColor = c.plan === "Beginner" ? "var(--text-muted)" : (c.plan === "Starter" ? "var(--accent-blue)" : "var(--accent-gold)");
                let verifyBadge;
                if (c.verified === "KYC Approved") {
                    verifyBadge = `<span class="status-badge-lbl kyc-approved" onclick="startAiIdentityScan('${c.id}'); event.stopPropagation();">Approved</span>`;
                } else if (c.verified === "Under Review") {
                    verifyBadge = `<span class="status-badge-lbl kyc-review" onclick="startAiIdentityScan('${c.id}'); event.stopPropagation();">Under Review</span>`;
                } else if (c.verified === "KYC Rejected") {
                    verifyBadge = `<span class="status-badge-lbl kyc-rejected" onclick="startAiIdentityScan('${c.id}'); event.stopPropagation();">Rejected</span>`;
                } else if (c.verified === "Pending Re-upload") {
                    verifyBadge = `<span class="status-badge-lbl kyc-reupload" onclick="startAiIdentityScan('${c.id}'); event.stopPropagation();">Re-upload</span>`;
                } else {
                    verifyBadge = `<span class="status-badge-lbl kyc-pending" onclick="startAiIdentityScan('${c.id}'); event.stopPropagation();">Pending KYC</span>`;
                }

                let statusBadge;
                if (c.status === "Active" || c.status === "ACTIVE") {
                    statusBadge = `<span class="status-badge-lbl active" onclick="openStatusModal('${c.id}'); event.stopPropagation();">Active</span>`;
                } else if (c.status === "Non Active" || c.status === "NON ACTIVE" || c.status === "Non-Active") {
                    statusBadge = `<span class="status-badge-lbl pending" onclick="openStatusModal('${c.id}'); event.stopPropagation();" style="background: rgba(255, 56, 56, 0.1); color: var(--accent-red); border: 1px solid rgba(255, 56, 56, 0.15);">Non Active</span>`;
                } else if (c.status === "Suspended") {
                    statusBadge = `<span class="status-badge-lbl pending" onclick="openStatusModal('${c.id}'); event.stopPropagation();">Suspended</span>`;
                } else if (c.status === "Offline") {
                    statusBadge = `<span class="status-badge-lbl blocked" onclick="openStatusModal('${c.id}'); event.stopPropagation();" style="opacity: 0.6;">Offline</span>`;
                } else {
                    statusBadge = `<span class="status-badge-lbl blocked" onclick="openStatusModal('${c.id}'); event.stopPropagation();">Blocked</span>`;
                }

                tr.innerHTML = `
                    <td class="blockchain-hash-text">${c.id}</td>
                    <td>
                        <div class="user-cell-meta">
                            <div class="user-cell-avatar">${c.avatar}</div>
                            <div>
                                <div class="user-name-meta">${c.name}</div>
                                <div class="user-sub-email">${c.email}</div>
                            </div>
                        </div>
                    </td>
                    <td>${c.country}</td>
                    <td><strong style="color: ${planColor};">${c.plan}</strong></td>
                    <td class="font-mono">$${c.investment.toLocaleString()}</td>
                    <td class="font-mono">${c.hashrate}</td>
                    <td class="font-mono text-gold">${c.balance} BTC</td>
                    <td>${verifyBadge}</td>
                    <td>${statusBadge}</td>
                `;
                tbody.appendChild(tr);
            });
        }

        function changeClientPage(dir) {
            clientCurrentPage += dir;
            renderClientTable();
        }

        // 2. Transaction Table Pagination and Rendering
        let txSearchQuery = "";
        let txFilterType = "ALL";
        let txFilterStatus = "ALL";
        let txCurrentPage = 1;
        let txPageSize = 10;
        let txSortColumn = "date";
        let txSortDirection = "desc";
        let filteredTxList = [...mockTransactions];

        function handleTxSearch() {
            txSearchQuery = document.getElementById("tx-search").value.toLowerCase().trim();
            applyTxFilters();
        }

        function handleTxFilter() {
            txFilterType = document.getElementById("tx-filter-type").value;
            txFilterStatus = document.getElementById("tx-filter-status").value;
            applyTxFilters();
        }

        function applyTxFilters() {
            filteredTxList = mockTransactions.filter(t => {
                const matchesSearch = t.txid.toLowerCase().includes(txSearchQuery) || 
                                      t.client.toLowerCase().includes(txSearchQuery) || 
                                      t.wallet.toLowerCase().includes(txSearchQuery);
                const matchesType = txFilterType === "ALL" || t.type === txFilterType;
                const matchesStatus = txFilterStatus === "ALL" || t.status === txFilterStatus;
                return matchesSearch && matchesType && matchesStatus;
            });
            txCurrentPage = 1;
            sortTxData();
            renderTxTable();
        }

        function sortTransactions(column) {
            if (txSortColumn === column) {
                txSortDirection = txSortDirection === "asc" ? "desc" : "asc";
            } else {
                txSortColumn = column;
                txSortDirection = "asc";
            }
            sortTxData();
            renderTxTable();
        }

        function sortTxData() {
            filteredTxList.sort((a, b) => {
                let valA = a[txSortColumn];
                let valB = b[txSortColumn];
                
                if (txSortColumn === "amount") {
                    valA = parseFloat(valA);
                    valB = parseFloat(valB);
                }

                if (valA < valB) return txSortDirection === "asc" ? -1 : 1;
                if (valA > valB) return txSortDirection === "asc" ? 1 : -1;
                return 0;
            });
        }

        function renderTxTable() {
            const tbody = document.getElementById("transactions-table-tbody");
            if (!tbody) return;

            tbody.innerHTML = "";
            const startIdx = (txCurrentPage - 1) * txPageSize;

            const totalVirtualTransactions = 2420;
            const pageOffset = (txCurrentPage - 1) * txPageSize;
            const virtualShowingEnd = Math.min(pageOffset + txPageSize, totalVirtualTransactions);
            document.getElementById("tx-pagination-info").textContent = 
                `Showing ${pageOffset + 1} to ${virtualShowingEnd} of ${totalVirtualTransactions.toLocaleString()} entries`;

            document.getElementById("btn-tx-prev").disabled = txCurrentPage === 1;
            const maxVirtualPages = Math.ceil(totalVirtualTransactions / txPageSize);
            document.getElementById("btn-tx-next").disabled = txCurrentPage >= maxVirtualPages;
            document.getElementById("tx-page-num").textContent = `Page ${txCurrentPage} of ${maxVirtualPages}`;

            const pageList = filteredTxList.slice(startIdx % filteredTxList.length, (startIdx % filteredTxList.length) + txPageSize);

            if (pageList.length === 0) {
                tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 20px;">No matching transactions found.</td></tr>`;
                return;
            }

            pageList.forEach(t => {
                const tr = document.createElement("tr");
                const typeClass = t.type === "DEPOSIT" ? "text-green" : (t.type === "WITHDRAW" ? "text-red" : "text-blue");
                const statusBadge = t.status === "Confirmed" ? `<span class="status-badge-lbl verified">Confirmed</span>` : (t.status === "Pending" ? `<span class="status-badge-lbl pending">Pending</span>` : `<span class="status-badge-lbl blocked">Rejected</span>`);
                
                tr.innerHTML = `
                    <td class="blockchain-hash-text">${t.txid}</td>
                    <td class="user-name-meta">${t.client}</td>
                    <td><strong class="${typeClass}">${t.type}</strong></td>
                    <td class="font-mono font-bold">${t.amount} BTC</td>
                    <td class="font-mono text-muted">${t.fee}</td>
                    <td>
                        <div class="user-sub-email">${t.blockchain}</div>
                        <div style="font-size: 0.72rem; color: var(--accent-blue);">${t.confirmations}</div>
                    </td>
                    <td class="font-mono font-small">${t.date}</td>
                    <td>${statusBadge}</td>
                    <td>
                        ${t.status === "Pending" ? `
                            <button class="btn btn-xs btn-primary" onclick="approveWithdrawal(event, '${t.txid}')" style="background: var(--accent-blue) !important; color:#030308 !important;">Approve</button>
                            <button class="btn btn-xs btn-outline ml-1" onclick="rejectWithdrawal(event, '${t.txid}')" style="border-color: var(--accent-red) !important; color: var(--accent-red) !important;">Reject</button>
                        ` : `-`}
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        function changeTxPage(dir) {
            txCurrentPage += dir;
            renderTxTable();
        }

        // 3. Node Cards Renderer
        let selectedNodeName = "";
        let scadaLogInterval = null;

        const defaultNodeStats = {
            "Dubai General HQ": { temp: "48.2°C", power: "0.58 MW", hashrate: "18.00 PH/s", efficiency: "16.4 J/TH" },
            "Iceland Hydro-A": { temp: "42.1°C", power: "0.45 MW", hashrate: "15.00 PH/s", efficiency: "16.0 J/TH" },
            "Norway Hydro-B": { temp: "39.4°C", power: "0.42 MW", hashrate: "14.00 PH/s", efficiency: "17.0 J/TH" },
            "Canada Fjord-C": { temp: "44.8°C", power: "0.39 MW", hashrate: "13.00 PH/s", efficiency: "17.2 J/TH" },
            "Switzerland Hydro-C": { temp: "43.5°C", power: "0.33 MW", hashrate: "11.00 PH/s", efficiency: "18.0 J/TH" },
            "Singapore Quantum Facility": { temp: "46.5°C", power: "0.35 MW", hashrate: "11.60 PH/s", efficiency: "16.8 J/TH" }
        };

        function renderNodeCards() {
            const container = document.getElementById("nodes-container-cards");
            if (!container) return;

            container.innerHTML = "";
            mockNodes.forEach(node => {
                const card = document.createElement("div");
                card.className = "node-farm-card";
                
                const statusBadge = node.status === "online" ? `<span class="node-farm-badge online">Nominal</span>` : `<span class="node-farm-badge overclock">Overclocked</span>`;
                
                card.innerHTML = `
                    <div class="node-farm-header">
                        <div class="node-farm-title"><i class="fa-solid fa-server"></i> ${node.name}</div>
                        ${statusBadge}
                    </div>
                    <div class="node-farm-metrics">
                        <div class="node-metric-box">
                            <div class="node-metric-label">Hashrate Capacity</div>
                            <div class="node-metric-val font-green">${node.hashrate}</div>
                        </div>
                        <div class="node-metric-box">
                            <div class="node-metric-label">Thermo Load</div>
                            <div class="node-metric-val">${node.temp}</div>
                        </div>
                        <div class="node-metric-box">
                            <div class="node-metric-label">ASIC Efficiency</div>
                            <div class="node-metric-val">${node.efficiency}</div>
                        </div>
                        <div class="node-metric-box">
                            <div class="node-metric-label">Grid Load</div>
                            <div class="node-metric-val text-gold">${node.power}</div>
                        </div>
                    </div>
                    <div class="node-farm-controls">
                        <button class="btn btn-outline border-blue text-blue btn-xs" onclick="openOverclockModal('${node.name}')">Optimize Overclock</button>
                        <button class="btn btn-outline btn-xs" onclick="openBalancedModal('${node.name}')" style="border-color: rgba(255, 255, 255, 0.1);">Balanced</button>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        // --- OPTIMIZE OVERCLOCK MODAL LOGIC ---
        function openOverclockModal(nodeName) {
            selectedNodeName = nodeName;
            const node = mockNodes.find(n => n.name === nodeName);
            if (!node) return;

            document.getElementById("oc-val-name").textContent = node.name;
            document.getElementById("oc-val-id").textContent = node.id;
            document.getElementById("oc-val-hashrate").textContent = node.hashrate;
            document.getElementById("oc-val-power").textContent = node.power;
            document.getElementById("oc-val-temp").textContent = node.temp;
            document.getElementById("oc-val-cooling").textContent = "94.2% (Immersion Liquid Cooling)";
            document.getElementById("oc-val-asics").textContent = node.asicCount.toLocaleString() + " SHA-256 Rigs";
            document.getElementById("oc-val-online").textContent = node.asicCount.toLocaleString();
            document.getElementById("oc-val-source").textContent = `${node.source} (${node.renewable}% Renewable)`;
            document.getElementById("oc-val-pool").textContent = "Stratum v2 / pool-slush-eu03.cryptomin.io";
            document.getElementById("oc-val-latency").textContent = "12.8ms / 99.99%";

            document.getElementById("oc-val-extra-revenue").textContent = `+$${(parseFloat(node.hashrate) * 0.15 * 750).toFixed(2)} USD / Day`;
            document.getElementById("oc-val-extra-btc").textContent = `+${(0.97 * (parseFloat(node.hashrate) / 82.60) * 0.15).toFixed(4)} BTC / Day`;
            
            const isOc = node.status === 'overclock';
            document.getElementById("oc-val-status").innerHTML = isOc ? '<span style="color: var(--accent-red);">Overclock Active</span>' : '<span style="color: var(--accent-green);">Balanced Mode Active</span>';
            document.getElementById("oc-val-footer-info").textContent = `Status: ${isOc ? 'Overclock Profile Engaged' : 'Geothermal Balanced Uptime'}`;
            
            const btnApply = document.getElementById("btn-apply-overclock");
            if (isOc) {
                btnApply.textContent = "Overclock Active";
                btnApply.disabled = true;
                btnApply.style.opacity = "0.5";
            } else {
                btnApply.textContent = "Apply Overclock Profile";
                btnApply.disabled = false;
                btnApply.style.opacity = "1";
            }

            document.getElementById("vis-node-label").textContent = `${node.name} (${node.location})`;
            const nodeDot = document.getElementById("vis-node-dot");
            if (nodeDot) {
                nodeDot.setAttribute("fill", isOc ? "#ff3838" : "#ffbd3d");
            }

            startScadaLogStream(node);
            document.getElementById("node-overclock-modal").classList.add("active");
        }

        function closeOverclockModal() {
            clearInterval(scadaLogInterval);
            document.getElementById("node-overclock-modal").classList.remove("active");
        }

        function applyOverclockAction() {
            if (!selectedNodeName) return;
            const node = mockNodes.find(n => n.name === selectedNodeName);
            if (node && node.status !== 'overclock') {
                node.status = 'overclock';
                node.temp = "52.4°C";
                node.power = (parseFloat(node.power) * 1.25).toFixed(2) + " MW";
                node.hashrate = (parseFloat(node.hashrate) * 1.15).toFixed(2) + " PH/s";
                node.efficiency = "14.8 J/TH";
                
                addLogStream(`[NODE CONFIG] Core voltage optimizer applied to ${selectedNodeName}. Tuning hash bounds.`);
                renderNodeCards();
                closeOverclockModal();
                alert(`Data Center Optimization Profile applied successfully to ${selectedNodeName}. Hashrate capacity is now increased.`);
            }
        }

        // --- BALANCED MODAL LOGIC ---
        function openBalancedModal(nodeName) {
            selectedNodeName = nodeName;
            const node = mockNodes.find(n => n.name === nodeName);
            if (!node) return;

            document.getElementById("bm-val-name").textContent = node.name;
            document.getElementById("bm-val-temp").textContent = node.temp;
            document.getElementById("bm-val-efficiency").textContent = node.efficiency;
            
            const defaultStats = defaultNodeStats[node.name];
            const baseHashrate = parseFloat(defaultStats.hashrate);
            document.getElementById("bm-val-revenue").textContent = `$${(baseHashrate * 750).toFixed(2)} USD`;
            document.getElementById("bm-val-btc").textContent = `${(0.97 * (baseHashrate / 82.60)).toFixed(4)} BTC`;

            const btnApply = document.getElementById("btn-apply-balanced");
            if (node.status === 'online') {
                btnApply.textContent = "Balanced Active";
                btnApply.disabled = true;
                btnApply.style.opacity = "0.5";
            } else {
                btnApply.textContent = "Restore Balanced Mode";
                btnApply.disabled = false;
                btnApply.style.opacity = "1";
            }

            document.getElementById("node-balanced-modal").classList.add("active");
        }

        function closeBalancedModal() {
            document.getElementById("node-balanced-modal").classList.remove("active");
        }

        function applyBalancedAction() {
            if (!selectedNodeName) return;
            const node = mockNodes.find(n => n.name === selectedNodeName);
            if (node && node.status !== 'online') {
                const defaults = defaultNodeStats[selectedNodeName];
                node.status = 'online';
                node.temp = defaults.temp;
                node.power = defaults.power;
                node.hashrate = defaults.hashrate;
                node.efficiency = defaults.efficiency;
                
                addLogStream(`[NODE CONFIG] Node ${selectedNodeName} reset to balanced geothermal profile.`);
                renderNodeCards();
                closeBalancedModal();
                alert(`Balanced eco-profile restored successfully for ${selectedNodeName}. Voltage parameters normalized.`);
            }
        }

        function startScadaLogStream(node) {
            const logsContainer = document.getElementById("oc-scada-logs");
            if (!logsContainer) return;
            
            clearInterval(scadaLogInterval);
            logsContainer.textContent = "";
            
            const baseLogs = [
                `[SYSTEM] Establishing SSH tunnel to node ID ${node.id}...`,
                `[SYSTEM] Handshake complete: ECDSA key exchange verified.`,
                `[VPN] Gateway IPSec Tunnel: SECURE.`,
                `[SCADA] Reading metrics from ${node.asicCount} integrated ASICs...`,
                `[SCADA] Hash board health check: 100% nominal.`,
                `[SCADA] Fan speed: 4,200 RPM. Uptime: 99.99%.`,
                `[NODE] Thermal index normal at ${node.temp}.`,
                `[NODE] Grid power draw: ${node.power}. Source: ${node.source}.`,
                `[BLOCKCHAIN] Sync height: 842,912. Status: FULLY_SYNCED.`
            ];
            
            let logIndex = 0;
            function addLog() {
                if (logIndex < baseLogs.length) {
                    logsContainer.textContent += baseLogs[logIndex] + "\n";
                    logsContainer.scrollTop = logsContainer.scrollHeight;
                    logIndex++;
                } else {
                    const ranLogs = [
                        `[DIAG] ASIC Pod #${Math.floor(Math.random() * 20) + 1} temp sensor stable.`,
                        `[SCADA] Voltage ripple: 0.12% RMS [OK].`,
                        `[POOL] Received new block candidate from Stratum.`,
                        `[VPN] Key rotation check: success.`,
                        `[SYSTEM] Network packet latency: ${(12 + Math.random() * 6).toFixed(1)}ms.`,
                        `[SCADA] Cooling pump pressure: 3.2 bar [OK].`
                    ];
                    logsContainer.textContent += ranLogs[Math.floor(Math.random() * ranLogs.length)] + "\n";
                    logsContainer.scrollTop = logsContainer.scrollHeight;
                }
            }
            
            for(let i=0; i<4; i++) {
                addLog();
            }
            scadaLogInterval = setInterval(addLog, 1500);
        }

        // --- ENTERPRISE STATUS DETAILS MODAL LOGIC ---
        let activeStatusClientId = "";

        function openStatusModal(clientId) {
            activeStatusClientId = clientId;
            const client = mockClients.find(c => c.id === clientId);
            if (!client) return;

            const container = document.getElementById("status-modal-body-container");
            const footer = document.getElementById("status-modal-footer-container");
            if (!container || !footer) return;

            const startDateStr = client.regDate;
            const regDate = new Date(client.regDate);
            let durationDays = 30;
            if (client.plan === "Starter") durationDays = 60;
            else if (client.plan === "Professional") durationDays = 90;
            
            const expiryDate = new Date(regDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
            const expiryDateStr = expiryDate.toISOString().split('T')[0];

            container.innerHTML = `
                <div class="kyc-profile-section" style="gap: 15px;">
                    <h4 style="font-family: 'Space Grotesk', sans-serif; font-size: 1.05rem; margin: 0; color: var(--accent-blue);">General Information</h4>
                    <div class="kyc-grid" style="margin-top: 5px;">
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">User ID</div>
                            <div class="kyc-field-val font-code">${client.id}</div>
                        </div>
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">Full Name</div>
                            <div class="kyc-field-val">${client.name}</div>
                        </div>
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">Email Address</div>
                            <div class="kyc-field-val">${client.email}</div>
                        </div>
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">Phone Number</div>
                            <div class="kyc-field-val">${client.phone || '+1 (555) 234-1234'}</div>
                        </div>
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">Country / City</div>
                            <div class="kyc-field-val">${client.country} / ${client.city || 'N/A'}</div>
                        </div>
                        <div class="kyc-field-item" style="grid-column: span 2;">
                            <div class="kyc-field-lbl">Full Residential Address</div>
                            <div class="kyc-field-val">${client.residentialAddress || 'N/A'}</div>
                        </div>
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">Account Created Date</div>
                            <div class="kyc-field-val font-code">${client.regDate}</div>
                        </div>
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">Last Login Time</div>
                            <div class="kyc-field-val font-code">${client.lastLogin}</div>
                        </div>
                        <div class="kyc-field-item" style="grid-column: span 2;">
                            <div class="kyc-field-lbl">Last Activity Time</div>
                            <div class="kyc-field-val font-code">${client.lastLogin}</div>
                        </div>
                    </div>

                    <h4 style="font-family: 'Space Grotesk', sans-serif; font-size: 1.05rem; margin: 15px 0 0 0; color: var(--accent-blue);">Device Information</h4>
                    <div class="kyc-grid" style="margin-top: 5px;">
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">Public IP Address</div>
                            <div class="kyc-field-val font-code">${client.ip || '127.0.0.1'}</div>
                        </div>
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">MAC Address</div>
                            <div class="kyc-field-val font-code">${client.mac || '00:00:00:00:00:00'}</div>
                        </div>
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">Device Name</div>
                            <div class="kyc-field-val">${client.deviceName || 'N/A'}</div>
                        </div>
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">Device Type</div>
                            <div class="kyc-field-val">${client.deviceType || 'N/A'}</div>
                        </div>
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">Operating System</div>
                            <div class="kyc-field-val">${client.os || 'N/A'}</div>
                        </div>
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">Browser</div>
                            <div class="kyc-field-val">${client.browser || 'N/A'}</div>
                        </div>
                        <div class="kyc-field-item" style="grid-column: span 2;">
                            <div class="kyc-field-lbl">Time Zone</div>
                            <div class="kyc-field-val font-code">${client.timezone || 'UTC'}</div>
                        </div>
                    </div>
                </div>

                <div class="kyc-profile-section" style="gap: 15px;">
                    <h4 style="font-family: 'Space Grotesk', sans-serif; font-size: 1.05rem; margin: 0; color: var(--accent-blue);">Wallet Information</h4>
                    <div class="kyc-grid" style="margin-top: 5px;">
                        <div class="kyc-field-item" style="grid-column: span 2;">
                            <div class="kyc-field-lbl">Wallet Address</div>
                            <div class="kyc-field-val font-code text-blue" style="font-size: 0.8rem; word-break: break-all;">${client.walletAddress || 'bc1q...'}</div>
                        </div>
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">Wallet Type</div>
                            <div class="kyc-field-val font-code">${client.walletType || 'BTC'}</div>
                        </div>
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">Total Deposit (USD Equivalent)</div>
                            <div class="kyc-field-val font-code">$${parseFloat(client.totalDeposit || client.investment).toLocaleString()}</div>
                        </div>
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">Total Withdrawal (USD Equiv)</div>
                            <div class="kyc-field-val font-code">$${parseFloat(client.totalWithdrawal || 0).toLocaleString()}</div>
                        </div>
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">Current Balance</div>
                            <div class="kyc-field-val font-code text-gold">${client.balance} BTC</div>
                        </div>
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">Total BTC Earned</div>
                            <div class="kyc-field-val font-code">${client.earned} BTC</div>
                        </div>
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">Last Withdrawal Amount</div>
                            <div class="kyc-field-val font-code">${client.lastWithdrawalAmount || '0.000000'} BTC</div>
                        </div>
                        <div class="kyc-field-item" style="grid-column: span 2;">
                            <div class="kyc-field-lbl">Last Withdrawal Date</div>
                            <div class="kyc-field-val font-code">${client.lastWithdrawalDate || 'N/A'}</div>
                        </div>
                    </div>

                    <h4 style="font-family: 'Space Grotesk', sans-serif; font-size: 1.05rem; margin: 15px 0 0 0; color: var(--accent-blue);">Subscription Details</h4>
                    <div class="kyc-grid" style="margin-top: 5px;">
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">Current Plan</div>
                            <div class="kyc-field-val" style="color: var(--accent-gold); font-weight: bold;">${client.plan}</div>
                        </div>
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">Investment Amount</div>
                            <div class="kyc-field-val font-code">$${client.investment.toLocaleString()}</div>
                        </div>
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">Hashrate</div>
                            <div class="kyc-field-val font-code">${client.hashrate}</div>
                        </div>
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">Estimated Monthly BTC</div>
                            <div class="kyc-field-val font-code text-gold">${client.balance} BTC/mo</div>
                        </div>
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">Contract Start Date</div>
                            <div class="kyc-field-val font-code">${startDateStr}</div>
                        </div>
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">Contract Expiry Date</div>
                            <div class="kyc-field-val font-code">${expiryDateStr}</div>
                        </div>
                    </div>
                </div>
            `;

            const isEligible = client.verified === "KYC Approved";
            
            if (isEligible) {
                const isActive = client.status === "Active" || client.status === "ACTIVE";
                footer.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div style="font-size: 0.9rem; font-weight: bold;">
                            STATUS MANAGEMENT: 
                            <span id="status-modal-current-badge" style="font-family: monospace;">${isActive ? '🟢 ACTIVE' : '🔴 NON ACTIVE'}</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-outline border-blue text-blue btn-sm" onclick="closeStatusModal()">Close</button>
                        <button class="btn btn-sm ${isActive ? 'btn-danger' : 'btn-success'}" id="status-modal-action-btn" onclick="toggleActiveStatus()">
                            ${isActive ? 'Deactivate Account' : 'Reactivate Account'}
                        </button>
                    </div>
                `;
            } else {
                footer.innerHTML = `
                    <div style="background: rgba(255,56,56,0.08); border: 1px solid rgba(255,56,56,0.2); padding: 12px 16px; border-radius: 6px; display: flex; align-items: flex-start; gap: 12px; width: 100%; text-align: left;">
                        <i class="fa-solid fa-triangle-exclamation text-red" style="font-size: 1.25rem; margin-top: 2px;"></i>
                        <div>
                            <div style="font-weight: bold; color: var(--accent-red); font-size: 0.9rem;">⚠ Active Status Unavailable</div>
                            <div style="font-size: 0.8rem; margin-top: 4px; color: var(--text-muted); line-height: 1.4;">
                                This client is not eligible for Active Status management.
                                <br>
                                <strong>Reason:</strong> KYC verification has not been completed or administrative approval is pending. Please complete KYC verification and approve the account before changing Active Status.
                            </div>
                        </div>
                    </div>
                    <div style="margin-left: auto;">
                        <button class="btn btn-outline border-blue text-blue btn-sm" onclick="closeStatusModal()">Close</button>
                    </div>
                `;
            }

            document.getElementById("status-details-modal").classList.add("active");
        }

        function closeStatusModal() {
            document.getElementById("status-details-modal").classList.remove("active");
            activeStatusClientId = "";
        }

        function toggleActiveStatus() {
            if (!activeStatusClientId) return;
            const client = mockClients.find(c => c.id === activeStatusClientId);
            if (!client) return;

            const isActive = client.status === "Active" || client.status === "ACTIVE";
            if (isActive) {
                const confirmDeactivate = confirm("Are you sure you want to deactivate this client?");
                if (confirmDeactivate) {
                    client.status = "Non Active";
                    addLogStream(`[SYSTEM] Client account deactivated: ${client.name} (${client.id})`);
                    document.getElementById("status-modal-current-badge").innerHTML = "🔴 NON ACTIVE";
                    const actBtn = document.getElementById("status-modal-action-btn");
                    if (actBtn) {
                        actBtn.textContent = "Reactivate Account";
                        actBtn.className = "btn btn-sm btn-success";
                    }
                    applyClientFilters();
                }
            } else {
                client.status = "Active";
                alert("Client account successfully reactivated.");
                addLogStream(`[SYSTEM] Client account successfully reactivated: ${client.name} (${client.id})`);
                document.getElementById("status-modal-current-badge").innerHTML = "🟢 ACTIVE";
                const actBtn = document.getElementById("status-modal-action-btn");
                if (actBtn) {
                    actBtn.textContent = "Deactivate Account";
                    actBtn.className = "btn btn-sm btn-danger";
                }
                applyClientFilters();
            }
        }

        // --- ENTERPRISE KYC MANAGEMENT SYSTEM LOGIC ---
        let activeKycClientId = "";

        function getVerificationReportSvg(docType, client) {
            const vStatus = (client.verified || "Pending KYC").trim();
            const aStatus = (client.status || "Active").trim();

            let stateKey = "PENDING";
            if (aStatus.toUpperCase() === "BLOCKED") {
                stateKey = "BLOCKED";
            } else if (aStatus.toUpperCase() === "OFFLINE") {
                stateKey = "OFFLINE";
            } else if (vStatus === "KYC Approved" || vStatus === "Verified" || vStatus === "Approved" || vStatus.toLowerCase().includes("approved") || vStatus.toLowerCase().includes("verified")) {
                stateKey = "APPROVED";
            } else if (vStatus === "Under Review") {
                stateKey = "UNDER_REVIEW";
            } else if (vStatus === "Pending Re-upload" || vStatus.includes("Re-upload")) {
                stateKey = "REUPLOAD";
            } else if (vStatus === "KYC Rejected" || vStatus.includes("Reject")) {
                stateKey = "REJECTED";
            } else {
                stateKey = "PENDING";
            }

            let docTitle = "VERIFICATION REPORT";
            if (docType === "selfie") {
                docTitle = "SELFIE LIVENESS VERIFICATION REPORT";
            } else if (docType === "receipt") {
                docTitle = "MINING CONTRACT PURCHASE RECEIPT REPORT";
            } else if (docType === "robot") {
                docTitle = "HUMAN BOT CHALLENGE VERIFICATION REPORT";
            }

            const regDateStr = client.regDate || new Date().toISOString().split('T')[0];
            const subTime = `${regDateStr} 10:15:00 UTC`;
            const revTime = `${regDateStr} 11:30:25 UTC`;

            let bodyContent = "";

            if (stateKey === "APPROVED") {
                bodyContent = `
                <!-- STATUS BADGE -->
                <rect x="50" y="195" width="280" height="50" rx="8" fill="rgba(0, 230, 118, 0.12)" stroke="#00e676" stroke-width="1.5"/>
                <text x="65" y="215" fill="rgba(255,255,255,0.6)" font-family="sans-serif" font-size="10">DOCUMENT STATUS</text>
                <text x="65" y="234" fill="#00e676" font-family="'Space Grotesk', sans-serif" font-size="15" font-weight="bold">✅ VERIFIED (APPROVED)</text>

                <!-- SCORE & ENGINE -->
                <rect x="350" y="195" width="300" height="50" rx="8" fill="rgba(0, 240, 255, 0.08)" stroke="#00f0ff" stroke-width="1"/>
                <text x="365" y="215" fill="rgba(255,255,255,0.6)" font-family="sans-serif" font-size="10">Verification Score / Engine</text>
                <text x="365" y="234" fill="#00f0ff" font-family="'Space Grotesk', sans-serif" font-size="14" font-weight="bold">100% • AI + Manual Review</text>

                <!-- AUTOMATED CHECKS -->
                <rect x="50" y="255" width="600" height="40" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)"/>
                <text x="65" y="280" fill="#00e676" font-family="monospace" font-size="11">PASS: Forgery | PASS: Liveness | PASS: Robot | PASS: Contract | PASS: Blockchain</text>

                <!-- TIMESTAMPS -->
                <text x="50" y="315" fill="rgba(255,255,255,0.5)" font-family="sans-serif" font-size="11">Submission: <tspan fill="#ffffff">${subTime}</tspan>  |  Review: <tspan fill="#00e676">${revTime}</tspan></text>

                <!-- NOTES -->
                <rect x="50" y="330" width="600" height="85" rx="8" fill="rgba(0, 230, 118, 0.05)" stroke="rgba(0, 230, 118, 0.2)"/>
                <text x="65" y="350" fill="#00e676" font-family="'Space Grotesk', sans-serif" font-size="12" font-weight="bold">VERIFICATION NOTES:</text>
                <text x="65" y="370" fill="rgba(255,255,255,0.8)" font-family="sans-serif" font-size="11">• All submitted verification files passed automated validation. No suspicious activity detected.</text>
                <text x="65" y="388" fill="rgba(255,255,255,0.8)" font-family="sans-serif" font-size="11">• Mining contract & wallet ownership confirmed. Customer eligible for mining activation.</text>
                `;
            } else if (stateKey === "UNDER_REVIEW") {
                bodyContent = `
                <!-- STATUS & PROGRESS -->
                <rect x="50" y="195" width="280" height="50" rx="8" fill="rgba(255, 152, 0, 0.12)" stroke="#ff9800" stroke-width="1.5"/>
                <text x="65" y="215" fill="rgba(255,255,255,0.6)" font-family="sans-serif" font-size="10">STATUS</text>
                <text x="65" y="234" fill="#ff9800" font-family="'Space Grotesk', sans-serif" font-size="15" font-weight="bold">⏳ UNDER REVIEW (72%)</text>

                <rect x="350" y="195" width="300" height="50" rx="8" fill="rgba(255, 152, 0, 0.08)" stroke="rgba(255, 152, 0, 0.3)"/>
                <text x="365" y="215" fill="rgba(255,255,255,0.6)" font-family="sans-serif" font-size="10">Estimated Review Time</text>
                <text x="365" y="234" fill="#ff9800" font-family="'Space Grotesk', sans-serif" font-size="14" font-weight="bold">6 - 24 Hours</text>

                <!-- PROGRESS BAR -->
                <rect x="50" y="255" width="600" height="12" rx="6" fill="rgba(255,255,255,0.08)"/>
                <rect x="50" y="255" width="432" height="12" rx="6" fill="#ff9800"/>

                <!-- CHECKS -->
                <rect x="50" y="280" width="600" height="40" rx="6" fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.08)"/>
                <text x="65" y="305" fill="#ffffff" font-family="monospace" font-size="11">✔ Selfie matched  |  ✔ Contract found  |  ✔ Wallet verified  |  ⏳ Human verification pending</text>

                <!-- REASON -->
                <rect x="50" y="330" width="600" height="85" rx="8" fill="rgba(255, 152, 0, 0.05)" stroke="rgba(255, 152, 0, 0.2)"/>
                <text x="65" y="352" fill="#ff9800" font-family="'Space Grotesk', sans-serif" font-size="12" font-weight="bold">AUDIT STATUS REASON:</text>
                <text x="65" y="372" fill="rgba(255,255,255,0.8)" font-family="sans-serif" font-size="11">• Waiting for manual compliance review.</text>
                <text x="65" y="390" fill="rgba(255,255,255,0.8)" font-family="sans-serif" font-size="11">• Automated system detected information requiring additional verification.</text>
                `;
            } else if (stateKey === "PENDING") {
                bodyContent = `
                <!-- STATUS -->
                <rect x="50" y="195" width="280" height="50" rx="8" fill="rgba(255, 238, 85, 0.12)" stroke="#ffee55" stroke-width="1.5"/>
                <text x="65" y="215" fill="rgba(255,255,255,0.6)" font-family="sans-serif" font-size="10">STATUS</text>
                <text x="65" y="234" fill="#ffee55" font-family="'Space Grotesk', sans-serif" font-size="15" font-weight="bold">⏳ PENDING VERIFICATION</text>

                <rect x="350" y="195" width="300" height="50" rx="8" fill="rgba(255, 238, 85, 0.08)" stroke="rgba(255, 238, 85, 0.3)"/>
                <text x="365" y="215" fill="rgba(255,255,255,0.6)" font-family="sans-serif" font-size="10">Queue Position</text>
                <text x="365" y="234" fill="#ffee55" font-family="'Space Grotesk', sans-serif" font-size="14" font-weight="bold">#42 in Verification Queue</text>

                <!-- REASON -->
                <rect x="50" y="260" width="600" height="155" rx="8" fill="rgba(255, 238, 85, 0.04)" stroke="rgba(255, 238, 85, 0.15)"/>
                <text x="65" y="285" fill="#ffee55" font-family="'Space Grotesk', sans-serif" font-size="13" font-weight="bold">QUEUE REASON & INSTRUCTIONS:</text>
                <text x="65" y="310" fill="rgba(255,255,255,0.85)" font-family="sans-serif" font-size="12">• Verification has not started.</text>
                <text x="65" y="335" fill="rgba(255,255,255,0.85)" font-family="sans-serif" font-size="12">• Submitted successfully. Waiting in review queue.</text>
                <text x="65" y="360" fill="rgba(255,255,255,0.5)" font-family="sans-serif" font-size="11">Submission Timestamp: ${subTime}</text>
                `;
            } else if (stateKey === "REUPLOAD") {
                bodyContent = `
                <!-- STATUS -->
                <rect x="50" y="195" width="280" height="50" rx="8" fill="rgba(186, 104, 200, 0.15)" stroke="#ba68c8" stroke-width="1.5"/>
                <text x="65" y="215" fill="rgba(255,255,255,0.6)" font-family="sans-serif" font-size="10">STATUS</text>
                <text x="65" y="234" fill="#ba68c8" font-family="'Space Grotesk', sans-serif" font-size="15" font-weight="bold">⚠ RE-UPLOAD REQUIRED</text>

                <rect x="350" y="195" width="300" height="50" rx="8" fill="rgba(186, 104, 200, 0.08)" stroke="rgba(186, 104, 200, 0.3)"/>
                <text x="365" y="215" fill="rgba(255,255,255,0.6)" font-family="sans-serif" font-size="10">REQUIRED ACTION</text>
                <text x="365" y="234" fill="#ffffff" font-family="'Space Grotesk', sans-serif" font-size="13" font-weight="bold">Upload clearer files</text>

                <!-- REASON BOX -->
                <rect x="50" y="260" width="600" height="155" rx="8" fill="rgba(186, 104, 200, 0.05)" stroke="rgba(186, 104, 200, 0.2)"/>
                <text x="65" y="285" fill="#ba68c8" font-family="'Space Grotesk', sans-serif" font-size="13" font-weight="bold">REJECTION DETECTED REASONS:</text>
                <text x="65" y="310" fill="rgba(255,255,255,0.85)" font-family="sans-serif" font-size="12">• Image quality too low OR Selfie blur detected.</text>
                <text x="65" y="335" fill="rgba(255,255,255,0.85)" font-family="sans-serif" font-size="12">• Document cropped OR Contract receipt unreadable.</text>
                <text x="65" y="365" fill="#ba68c8" font-family="monospace" font-size="11">ACTION NEEDED: Customer must re-upload high resolution verification scan.</text>
                `;
            } else if (stateKey === "REJECTED") {
                const rejReasons = [
                    "Selfie does not match account.",
                    "Mining contract receipt invalid.",
                    "Wallet ownership failed.",
                    "Robot verification failed.",
                    "Image tampering detected.",
                    "Duplicate submission detected.",
                    "Suspicious blockchain transaction.",
                    "Hash mismatch.",
                    "Contract checksum invalid.",
                    "Verification timeout exceeded.",
                    "High fraud probability.",
                    "Compliance policy violation."
                ];
                const charCode = (client.id || "0").charCodeAt((client.id || "0").length - 1);
                const selectedReason = rejReasons[charCode % rejReasons.length];

                bodyContent = `
                <!-- STATUS -->
                <rect x="50" y="195" width="280" height="50" rx="8" fill="rgba(255, 56, 56, 0.15)" stroke="#ff3838" stroke-width="1.5"/>
                <text x="65" y="215" fill="rgba(255,255,255,0.6)" font-family="sans-serif" font-size="10">DECISION / STATUS</text>
                <text x="65" y="234" fill="#ff3838" font-family="'Space Grotesk', sans-serif" font-size="15" font-weight="bold">❌ REJECTED</text>

                <rect x="350" y="195" width="300" height="50" rx="8" fill="rgba(255, 56, 56, 0.08)" stroke="rgba(255, 56, 56, 0.3)"/>
                <text x="365" y="215" fill="rgba(255,255,255,0.6)" font-family="sans-serif" font-size="10">RISK SCORE</text>
                <text x="365" y="234" fill="#ff3838" font-family="'Space Grotesk', sans-serif" font-size="15" font-weight="bold">HIGH RISK (94.2%)</text>

                <!-- REASON BOX -->
                <rect x="50" y="260" width="600" height="155" rx="8" fill="rgba(255, 56, 56, 0.05)" stroke="rgba(255, 56, 56, 0.2)"/>
                <text x="65" y="285" fill="#ff3838" font-family="'Space Grotesk', sans-serif" font-size="13" font-weight="bold">SPECIFIC REJECTION REASON:</text>
                <text x="65" y="315" fill="#ffffff" font-family="'Space Grotesk', sans-serif" font-size="14" font-weight="bold">⚠ ${selectedReason}</text>
                <text x="65" y="350" fill="rgba(255,255,255,0.7)" font-family="sans-serif" font-size="11">System Compliance Flag: Fraud probability exceeded security threshold.</text>
                <text x="65" y="375" fill="rgba(255,255,255,0.5)" font-family="monospace" font-size="11">Review Timestamp: ${revTime}</text>
                `;
            } else if (stateKey === "BLOCKED") {
                bodyContent = `
                <!-- STATUS -->
                <rect x="50" y="195" width="280" height="50" rx="8" fill="rgba(211, 47, 47, 0.2)" stroke="#d32f2f" stroke-width="2"/>
                <text x="65" y="215" fill="rgba(255,255,255,0.6)" font-family="sans-serif" font-size="10">ACCOUNT LOCKDOWN</text>
                <text x="65" y="234" fill="#ff3838" font-family="'Space Grotesk', sans-serif" font-size="15" font-weight="bold">🚫 ACCOUNT BLOCKED</text>

                <rect x="350" y="195" width="300" height="50" rx="8" fill="rgba(211, 47, 47, 0.1)" stroke="rgba(211, 47, 47, 0.4)"/>
                <text x="365" y="215" fill="rgba(255,255,255,0.6)" font-family="sans-serif" font-size="10">REQUIRED ACTION</text>
                <text x="365" y="234" fill="#ffee55" font-family="'Space Grotesk', sans-serif" font-size="13" font-weight="bold">Contact Compliance Team</text>

                <!-- REASON BOX -->
                <rect x="50" y="260" width="600" height="155" rx="8" fill="rgba(211, 47, 47, 0.08)" stroke="rgba(211, 47, 47, 0.3)"/>
                <text x="65" y="285" fill="#ff3838" font-family="'Space Grotesk', sans-serif" font-size="13" font-weight="bold">SECURITY REASONS:</text>
                <text x="65" y="308" fill="rgba(255,255,255,0.9)" font-family="sans-serif" font-size="11">• Repeated failed verification. Security risk detected.</text>
                <text x="65" y="326" fill="rgba(255,255,255,0.9)" font-family="sans-serif" font-size="11">• Account frozen. Mining suspended. Withdrawals disabled.</text>
                <text x="65" y="355" fill="#ffbd3d" font-family="monospace" font-size="11">SECURITY LOCKOUT APPLIED BY CYBERSECURITY CONTROLLER</text>
                `;
            } else if (stateKey === "OFFLINE") {
                bodyContent = `
                <!-- STATUS -->
                <rect x="50" y="195" width="600" height="50" rx="8" fill="rgba(120, 144, 156, 0.15)" stroke="#78909c" stroke-width="1.5"/>
                <text x="65" y="215" fill="rgba(255,255,255,0.6)" font-family="sans-serif" font-size="10">TELEMETRY DISCONNECTED</text>
                <text x="65" y="234" fill="#78909c" font-family="'Space Grotesk', sans-serif" font-size="15" font-weight="bold">🔌 USER ACCOUNT OFFLINE</text>

                <!-- REASON BOX -->
                <rect x="50" y="260" width="600" height="155" rx="8" fill="rgba(120, 144, 156, 0.05)" stroke="rgba(120, 144, 156, 0.2)"/>
                <text x="65" y="285" fill="#78909c" font-family="'Space Grotesk', sans-serif" font-size="13" font-weight="bold">OFFLINE STATUS DETAILS:</text>
                <text x="65" y="315" fill="rgba(255,255,255,0.85)" font-family="sans-serif" font-size="12">• Verification cannot be loaded.</text>
                <text x="65" y="340" fill="rgba(255,255,255,0.85)" font-family="sans-serif" font-size="12">• User account currently offline. Reconnect required.</text>
                `;
            }

            const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="700" height="460" viewBox="0 0 700 460">
                <rect width="700" height="460" rx="16" fill="#080816" stroke="#00f0ff" stroke-width="2"/>
                
                <!-- Header Banner -->
                <rect x="25" y="25" width="650" height="65" rx="10" fill="#10102b" stroke="rgba(0, 240, 255, 0.3)" stroke-width="1"/>
                <text x="50" y="55" fill="#00f0ff" font-family="'Space Grotesk', sans-serif" font-size="18" font-weight="bold">${docTitle}</text>
                <text x="50" y="75" fill="rgba(255,255,255,0.5)" font-family="sans-serif" font-size="12">Automated AI Security & Compliance Verification System</text>

                <!-- Main Report Box -->
                <rect x="25" y="105" width="650" height="330" rx="10" fill="#0c0c22" stroke="rgba(255,255,255,0.08)"/>

                <!-- Client Info Bar -->
                <text x="50" y="140" fill="rgba(255,255,255,0.4)" font-family="sans-serif" font-size="11">CLIENT FULL NAME</text>
                <text x="50" y="162" fill="#ffffff" font-family="'Space Grotesk', sans-serif" font-size="16" font-weight="bold">${client.name || 'Client User'}</text>

                <text x="350" y="140" fill="rgba(255,255,255,0.4)" font-family="sans-serif" font-size="11">USER ACCOUNT ID</text>
                <text x="350" y="162" fill="#00f0ff" font-family="monospace" font-size="15">${client.id || 'USR-00001'}</text>

                <text x="350" y="425" text-anchor="middle" fill="rgba(0, 240, 255, 0.4)" font-family="monospace" font-size="10">CRYPTOMIN ENTERPRISE SECURITY REPORT • CYBERSECURITY COMPLIANCE AUDIT</text>
            </svg>`;
            return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
        }

        // --- CINEMATIC DEEP MALE MILITARY AI VOICE & AUDIO ENGINE ---
        let activeScanClientId = "";
        let audioCtx = null;
        let isAudioMuted = false;

        function playHolographicChime() {
            if (isAudioMuted || !audioCtx) return;
            try {
                const nowChime = audioCtx.currentTime;
                const cOsc = audioCtx.createOscillator();
                const cGain = audioCtx.createGain();
                cOsc.type = "sine";
                cOsc.frequency.setValueAtTime(2093, nowChime);
                cGain.gain.setValueAtTime(0.04, nowChime);
                cGain.gain.exponentialRampToValueAtTime(0.001, nowChime + 0.25);
                cOsc.connect(cGain);
                cOsc.connect(audioCtx.destination);
                cOsc.start(nowChime);
                cOsc.stop(nowChime + 0.25);
            } catch(e) {}
        }

        function playCinematicAiAudio(client) {
            // Cancel any ongoing speech immediately before starting a new one
            if ('speechSynthesis' in window) {
                try { window.speechSynthesis.cancel(); } catch(e) {}
            }

            if (isAudioMuted) return;

            try {
                if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                if (audioCtx.state === "suspended") audioCtx.resume();
                
                const now = audioCtx.currentTime;

                // Master Volume set to 40% (0.4 max gain)
                const masterGain = audioCtx.createGain();
                masterGain.gain.setValueAtTime(0.4, now);
                masterGain.connect(audioCtx.destination);

                // LAYER 1 (0.00s): Deep Cinematic Sub-Bass AI Wake-Up Pulse
                const subOsc = audioCtx.createOscillator();
                const subGain = audioCtx.createGain();
                subOsc.type = "sine";
                subOsc.frequency.setValueAtTime(140, now);
                subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.35);
                subGain.gain.setValueAtTime(0.35, now);
                subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
                subOsc.connect(subGain);
                subGain.connect(masterGain);
                subOsc.start(now);
                subOsc.stop(now + 0.38);

                // LAYER 2 (0.12s): Digital Quantum Activation & Stereo Sweep
                const qOsc = audioCtx.createOscillator();
                const qGain = audioCtx.createGain();
                qOsc.type = "sawtooth";
                qOsc.frequency.setValueAtTime(400, now + 0.12);
                qOsc.frequency.exponentialRampToValueAtTime(1800, now + 0.25);
                qGain.gain.setValueAtTime(0.08, now + 0.12);
                qGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
                qOsc.connect(qGain);
                qGain.connect(masterGain);
                qOsc.start(now + 0.12);
                qOsc.stop(now + 0.28);

                // LAYER 3 (0.25s): Mechanical Servo Robotics Movement
                const servoOsc = audioCtx.createOscillator();
                const servoGain = audioCtx.createGain();
                servoOsc.type = "triangle";
                servoOsc.frequency.setValueAtTime(600, now + 0.25);
                servoOsc.frequency.linearRampToValueAtTime(1400, now + 0.4);
                servoGain.gain.setValueAtTime(0.1, now + 0.25);
                servoGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
                servoOsc.connect(servoGain);
                servoGain.connect(masterGain);
                servoOsc.start(now + 0.25);
                servoOsc.stop(now + 0.42);

                // LAYER 4 (0.45s): AI Hologram Crystal Shimmer Pulse
                [1046.50, 1318.51, 1567.98].forEach((freq, idx) => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = "sine";
                    osc.frequency.value = freq;
                    gain.gain.setValueAtTime(0.06, now + 0.45 + idx * 0.04);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65 + idx * 0.04);
                    osc.connect(gain);
                    gain.connect(masterGain);
                    osc.start(now + 0.45 + idx * 0.04);
                    osc.stop(now + 0.68 + idx * 0.04);
                });

                // LAYER 5 (0.65s): DEEP MALE AI VOICE ASSISTANT (SpeechSynthesis)
                setTimeout(() => {
                    if (isAudioMuted || !('speechSynthesis' in window)) return;
                    try {
                        window.speechSynthesis.cancel();
                        
                        const vStatus = (client.verified || "Pending KYC").trim();
                        const aStatus = (client.status || "Active").trim();

                        let voiceText = "";

                        if (aStatus.toUpperCase() === "BLOCKED") {
                            voiceText = "Security warning. Client account restricted. Mining operations suspended. Administrative authorization required.";
                        } else if (aStatus.toUpperCase() === "OFFLINE") {
                            voiceText = "Identity verified. Client currently offline. No active mining session detected.";
                        } else if (vStatus === "KYC Approved" || vStatus === "Verified" || vStatus === "Approved") {
                            voiceText = "Identity recognized. KYC verification complete. Mining contract authenticated. Wallet verification successful. Compliance score ninety-nine point eight percent. Client cleared for mining operations.";
                        } else if (vStatus === "Under Review") {
                            voiceText = "Identity recognized. KYC review in progress. Compliance verification pending. Awaiting administrator approval.";
                        } else if (vStatus === "Pending Re-upload" || vStatus.includes("Re-upload")) {
                            voiceText = "Identity recognized. Verification incomplete. Submitted verification files require replacement. Awaiting corrected documents.";
                        } else if (vStatus === "KYC Rejected" || vStatus.includes("Reject")) {
                            voiceText = "Identity recognized. Compliance verification failed. Mining contract validation unsuccessful. Administrator review required.";
                        } else {
                            voiceText = "Identity verified. Mining session active. Blockchain synchronization stable. Mining node operating normally.";
                        }

                        const msg = new SpeechSynthesisUtterance(voiceText);
                        msg.rate = 0.90;
                        msg.pitch = 0.75;
                        msg.volume = 0.65;
                        
                        const voices = window.speechSynthesis.getVoices();
                        const maleVoice = voices.find(v => 
                            (v.name.includes("Male") || v.name.includes("David") || v.name.includes("Mark") || v.name.includes("George") || v.name.includes("Alex") || v.name.includes("Daniel") || v.name.includes("Google US English")) && v.lang.startsWith("en")
                        );
                        if (maleVoice) msg.voice = maleVoice;

                        msg.onend = () => {
                            playHolographicChime();
                        };

                        window.speechSynthesis.speak(msg);
                    } catch(e) {}
                }, 650);

            } catch(e) {}
        }

        function toggleAudioMute() {
            isAudioMuted = !isAudioMuted;
            if (isAudioMuted && 'speechSynthesis' in window) {
                try { window.speechSynthesis.cancel(); } catch(e) {}
            }
            const btn = document.getElementById("ai-scan-mute-btn");
            if (btn) {
                btn.innerHTML = isAudioMuted ? `<i class="fa-solid fa-volume-xmark"></i> Sound Off` : `<i class="fa-solid fa-volume-high"></i> Sound On`;
            }
        }

        function startAiIdentityScan(clientId) {
            activeScanClientId = clientId;
            const client = mockClients.find(c => c.id === clientId);
            if (!client) return;

            // Trigger 6-layer cinematic male AI audio sequence
            playCinematicAiAudio(client);

            // Instantly open matrix window with 0.55s 3D materialization
            showAiFloatingIdCard(client);
        }

        function showAiFloatingIdCard(client) {
            const avatarContainer = document.getElementById("ai-id-avatar-container");
            const gender = client.gender || "Male";
            
            if (gender.toLowerCase() === "female") {
                avatarContainer.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 120 120">
                    <rect width="120" height="120" rx="12" fill="#180b26" stroke="#ba68c8" stroke-width="1.5"/>
                    <path d="M 38 48 C 38 22, 82 22, 82 48 C 82 58, 38 58, 38 48 Z" fill="#2d1445" stroke="#ba68c8" stroke-width="1.5"/>
                    <circle cx="60" cy="45" r="19" fill="#2d1445" stroke="#ba68c8" stroke-width="1.5"/>
                    <path d="M 28 105 C 28 78, 92 78, 92 105 Z" fill="#2d1445" stroke="#ba68c8" stroke-width="1.5"/>
                    <circle cx="60" cy="45" r="9" fill="#ba68c8" opacity="0.3"/>
                    <line x1="20" y1="60" x2="100" y2="60" stroke="rgba(186, 104, 200, 0.4)" stroke-width="1" stroke-dasharray="2,2"/>
                </svg>`;
            } else {
                avatarContainer.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 120 120">
                    <rect width="120" height="120" rx="12" fill="#081026" stroke="#00f0ff" stroke-width="1.5"/>
                    <circle cx="60" cy="45" r="22" fill="#122545" stroke="#00f0ff" stroke-width="1.5"/>
                    <path d="M 25 105 C 25 75, 95 75, 95 105 Z" fill="#122545" stroke="#00f0ff" stroke-width="1.5"/>
                    <circle cx="60" cy="45" r="10" fill="#00f0ff" opacity="0.3"/>
                    <line x1="20" y1="60" x2="100" y2="60" stroke="rgba(0, 240, 255, 0.4)" stroke-width="1" stroke-dasharray="2,2"/>
                </svg>`;
            }

            document.getElementById("ai-id-name").textContent = client.name;
            document.getElementById("ai-id-usrid").textContent = client.id;
            
            const statusBadge = document.getElementById("ai-id-status-badge");
            statusBadge.textContent = client.status;
            statusBadge.className = `status-badge-lbl ${client.status === 'Active' ? 'active' : (client.status === 'Suspended' ? 'pending' : 'blocked')}`;

            document.getElementById("ai-id-gender").textContent = gender;
            
            let age = 34;
            if (client.dob) {
                const birthYear = parseInt(client.dob.split("-")[0]);
                if (!isNaN(birthYear)) age = new Date().getFullYear() - birthYear;
            }
            document.getElementById("ai-id-age").textContent = age + " Years";

            document.getElementById("ai-id-country").textContent = client.country;
            document.getElementById("ai-id-nationality").textContent = client.nationality || client.country;
            document.getElementById("ai-id-regdate").textContent = client.regDate;
            document.getElementById("ai-id-kyc").textContent = client.verified;
            document.getElementById("ai-id-plan").textContent = `${client.plan} Tier`;
            document.getElementById("ai-id-investment").textContent = `$${client.investment.toLocaleString()}`;
            document.getElementById("ai-id-hashrate").textContent = client.hashrate;
            document.getElementById("ai-id-monthlybtc").textContent = `${client.balance} BTC`;
            document.getElementById("ai-id-balance").textContent = `${client.balance} BTC`;
            document.getElementById("ai-id-wallettype").textContent = client.walletType || "BTC";
            document.getElementById("ai-id-walletaddr").textContent = client.walletAddress || "bc1q...";
            document.getElementById("ai-id-refcode").textContent = client.referralCode || "N/A";

            const daysMember = Math.max(1, Math.floor((new Date() - new Date(client.regDate)) / (1000 * 60 * 60 * 24)));
            document.getElementById("ai-id-duration").textContent = `${daysMember} Days Active`;

            document.getElementById("ai-id-lastlogin").textContent = client.lastLogin || `${client.regDate} 12:00:00`;
            document.getElementById("ai-id-ip").textContent = `${client.ip || '192.168.1.105'} (${client.ipCountry || client.country})`;
            document.getElementById("ai-id-device").textContent = `${client.deviceType || 'Desktop PC'} (${client.deviceName || 'Client-PC'})`;
            document.getElementById("ai-id-osbrowser").textContent = `${client.os || 'Windows 11'} / ${client.browser || 'Chrome 126'}`;

            const consoleBadge = document.getElementById("ai-console-badge");
            const stepBadge = document.getElementById("ai-timeline-status-step");

            const vStatus = (client.verified || "Pending KYC").trim();
            const aStatus = (client.status || "Active").trim();

            let statusLabel = vStatus;
            let badgeColor = "#00e676";
            let bgStyle = "rgba(0, 230, 118, 0.15)";

            if (aStatus.toUpperCase() === "BLOCKED") {
                statusLabel = "ACCOUNT BLOCKED";
                badgeColor = "#ff3838";
                bgStyle = "rgba(211, 47, 47, 0.2)";
            } else if (vStatus === "KYC Approved" || vStatus === "Verified" || vStatus === "Approved") {
                statusLabel = "KYC APPROVED";
                badgeColor = "#00e676";
                bgStyle = "rgba(0, 230, 118, 0.15)";
            } else if (vStatus === "Under Review") {
                statusLabel = "UNDER REVIEW";
                badgeColor = "#ff9800";
                bgStyle = "rgba(255, 152, 0, 0.15)";
            } else if (vStatus === "Pending Re-upload" || vStatus.includes("Re-upload")) {
                statusLabel = "RE-UPLOAD REQUIRED";
                badgeColor = "#ba68c8";
                bgStyle = "rgba(186, 104, 200, 0.15)";
            } else if (vStatus === "KYC Rejected" || vStatus.includes("Reject")) {
                statusLabel = "REJECTED";
                badgeColor = "#ff3838";
                bgStyle = "rgba(255, 56, 56, 0.15)";
            } else {
                statusLabel = "PENDING KYC";
                badgeColor = "#ffee55";
                bgStyle = "rgba(255, 238, 85, 0.15)";
            }

            consoleBadge.textContent = `Status: ${statusLabel}`;
            consoleBadge.style.background = bgStyle;
            consoleBadge.style.color = badgeColor;
            consoleBadge.style.border = `1px solid ${badgeColor}`;

            stepBadge.textContent = `7. Status: ${statusLabel}`;
            stepBadge.style.background = bgStyle;
            stepBadge.style.color = badgeColor;
            stepBadge.style.border = `1px solid ${badgeColor}`;

            const modalOverlay = document.getElementById("ai-floating-id-card-modal");
            const cardWindow = document.getElementById("ai-3d-card-window");
            modalOverlay.classList.add("active");

            // Attach 3D Mouse Parallax Tilt Effect
            if (modalOverlay && cardWindow) {
                modalOverlay.onmousemove = (e) => {
                    const rect = cardWindow.getBoundingClientRect();
                    const x = e.clientX - (rect.left + rect.width / 2);
                    const y = e.clientY - (rect.top + rect.height / 2);
                    const rotateX = (-y / rect.height) * 10;
                    const rotateY = (x / rect.width) * 10;
                    cardWindow.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
                };
                modalOverlay.onmouseleave = () => {
                    cardWindow.style.transform = `perspective(1200px) rotateX(0deg) rotateY(0deg)`;
                };
            }
        }

        function closeAiFloatingIdModal() {
            if ('speechSynthesis' in window) {
                try { window.speechSynthesis.cancel(); } catch(e) {}
            }
            document.getElementById("ai-floating-id-card-modal").classList.remove("active");
        }

        function proceedToComplianceProfile() {
            closeAiFloatingIdModal();
            if (activeScanClientId) {
                openKycModal(activeScanClientId);
            }
        }

        function openKycModal(clientId) {
            activeKycClientId = clientId;
            const client = mockClients.find(c => c.id === clientId);
            if (!client) return;

            const container = document.getElementById("kyc-modal-body-container");
            if (!container) return;

            container.innerHTML = `
                <div class="kyc-profile-section">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div class="drawer-avatar" style="width: 60px; height: 60px; font-size: 1.4rem; border: 2px solid var(--accent-blue); box-shadow: var(--accent-glow);">${client.avatar}</div>
                        <div>
                            <h3 class="drawer-name" style="margin: 0; font-size: 1.3rem;">${client.name}</h3>
                            <p class="drawer-meta-sub" style="margin: 4px 0 0 0;">${client.email}</p>
                        </div>
                    </div>
                    
                    <div class="kyc-grid" style="margin-top: 10px;">
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">User Account ID</div>
                            <div class="kyc-field-val font-code">${client.id}</div>
                        </div>
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">Phone Number</div>
                            <div class="kyc-field-val">${client.phone || '+1 (555) 234-1234'}</div>
                        </div>
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">Country / Nationality</div>
                            <div class="kyc-field-val">${client.country} / ${client.nationality || client.country}</div>
                        </div>
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">Registration Date</div>
                            <div class="kyc-field-val font-code">${client.regDate}</div>
                        </div>
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">Last Login / IP Country</div>
                            <div class="kyc-field-val font-code">${client.lastLogin} / ${client.ipCountry || client.country}</div>
                        </div>
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">Subscription Plan</div>
                            <div class="kyc-field-val" style="color: var(--accent-blue); font-weight: bold;">${client.plan} Tier</div>
                        </div>
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">Investment & Hashrate</div>
                            <div class="kyc-field-val font-code">$${client.investment.toLocaleString()} • ${client.hashrate}</div>
                        </div>
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">Current BTC balance</div>
                            <div class="kyc-field-val font-code text-gold">${client.balance} BTC</div>
                        </div>
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">Wallet Address</div>
                            <div class="kyc-field-val font-code text-blue" style="font-size: 0.8rem; word-break: break-all;">${client.walletAddress || 'bc1q...'}</div>
                        </div>
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">Referral Code</div>
                            <div class="kyc-field-val font-code">${client.referralCode || 'N/A'}</div>
                        </div>
                        <div class="kyc-field-item">
                            <div class="kyc-field-lbl">Account Status</div>
                            <div class="kyc-field-val"><span class="status-badge-lbl ${client.status === 'Active' ? 'active' : (client.status === 'Suspended' ? 'pending' : 'blocked')}" style="padding: 2px 8px; font-size: 0.75rem;">${client.status}</span></div>
                        </div>
                    </div>
                </div>

                <div class="kyc-documents-section">
                    <h4 style="font-family: 'Space Grotesk', sans-serif; font-size: 1.1rem; margin: 0 0 10px 0;">Submitted Verification Files</h4>
                    
                    <div class="kyc-doc-card">
                        <div>
                            <div style="font-size: 0.85rem; font-weight: 600;">1. Selfie Liveness Verification</div>
                            <div style="font-size: 0.72rem; color: var(--text-muted);">AI Face Liveness Verification Completed</div>
                        </div>
                        <button class="btn btn-outline border-blue text-blue btn-xs" onclick="previewKycDoc('selfie', '${client.id}')">Preview</button>
                    </div>

                    <div class="kyc-doc-card">
                        <div>
                            <div style="font-size: 0.85rem; font-weight: 600;">2. Mining Contract Purchase Receipt</div>
                            <div style="font-size: 0.72rem; color: var(--text-muted);">Mining Contract Purchase Confirmation</div>
                        </div>
                        <button class="btn btn-outline border-blue text-blue btn-xs" onclick="previewKycDoc('receipt', '${client.id}')">Preview</button>
                    </div>

                    <div class="kyc-doc-card">
                        <div>
                            <div style="font-size: 0.85rem; font-weight: 600;">3. You Are Not A Robot Verification</div>
                            <div style="font-size: 0.72rem; color: var(--text-muted);">Human Verification Challenge Successfully Completed</div>
                        </div>
                        <button class="btn btn-outline border-blue text-blue btn-xs" onclick="previewKycDoc('robot', '${client.id}')">Preview</button>
                    </div>
                </div>
            `;

            document.getElementById("kyc-profile-modal").classList.add("active");
        }

        function closeKycModal() {
            document.getElementById("kyc-profile-modal").classList.remove("active");
            activeKycClientId = "";
        }

        function previewKycDoc(docType, targetId) {
            let client = mockClients.find(c => c.id === targetId || c.name === targetId);
            if (!client && activeKycClientId) {
                client = mockClients.find(c => c.id === activeKycClientId);
            }
            if (!client) {
                client = {
                    id: targetId || "USR-00001",
                    name: "Client User",
                    verified: "KYC Approved",
                    regDate: new Date().toISOString().split('T')[0]
                };
            }

            const srcSvg = getVerificationReportSvg(docType, client);
            document.getElementById("doc-preview-modal-img").src = srcSvg;
            document.getElementById("doc-preview-modal").classList.add("active");
        }

        function closeDocPreview() {
            document.getElementById("doc-preview-modal").classList.remove("active");
        }

        function triggerKycApprove() {
            if (!activeKycClientId) return;
            const client = mockClients.find(c => c.id === activeKycClientId);
            if (!client) return;

            const confirmApprove = confirm(`Approve this customer's identity verification?\n\nClient: ${client.name}\nUser ID: ${client.id}`);
            if (confirmApprove) {
                client.verified = "KYC Approved";
                closeKycModal();
                applyClientFilters();
                addLogStream(`[COMPLIANCE] Admin approved KYC identity verification for ${client.name} (${client.id})`);
            }
        }

        function triggerKycReject() {
            if (!activeKycClientId) return;
            const client = mockClients.find(c => c.id === activeKycClientId);
            if (!client) return;

            const reasons = [
                "Blurred document",
                "Invalid ID",
                "Expired document",
                "Face mismatch",
                "Address mismatch",
                "Duplicate account",
                "Other"
            ];
            
            let reasonPromptText = "Please select a rejection reason index:\n";
            reasons.forEach((r, idx) => {
                reasonPromptText += `${idx + 1}. ${r}\n`;
            });
            
            const selection = prompt(reasonPromptText, "1");
            if (selection === null) return;
            
            const selectedIdx = parseInt(selection) - 1;
            const reason = (selectedIdx >= 0 && selectedIdx < reasons.length) ? reasons[selectedIdx] : "Other";
            
            client.verified = "KYC Rejected";
            closeKycModal();
            applyClientFilters();
            addLogStream(`[COMPLIANCE] Admin rejected KYC for ${client.name} (${client.id}). Reason: ${reason}`);
        }

        function triggerKycReuploadRequest() {
            if (!activeKycClientId) return;
            const client = mockClients.find(c => c.id === activeKycClientId);
            if (!client) return;

            let docListPrompt = "Select documents required for re-upload (comma separated index):\n1. Government ID\n2. Passport\n3. Selfie\n4. Address Proof";
            const response = prompt(docListPrompt, "1,3");
            if (response === null) return;

            const docsMap = { "1": "Government ID", "2": "Passport", "3": "Selfie", "4": "Address Proof" };
            const requestedDocs = response.split(",")
                                          .map(x => x.trim())
                                          .filter(x => docsMap[x])
                                          .map(x => docsMap[x]);

            if (requestedDocs.length === 0) return;

            client.verified = "Pending Re-upload";
            closeKycModal();
            applyClientFilters();
            addLogStream(`[COMPLIANCE] Admin requested document re-upload (${requestedDocs.join(", ")}) for ${client.name} (${client.id})`);
        }

        function triggerKycSuspend() {
            if (!activeKycClientId) return;
            const client = mockClients.find(c => c.id === activeKycClientId);
            if (!client) return;

            const confirmSuspend = confirm(`Suspend user account?\n\nClient: ${client.name}\nUser ID: ${client.id}`);
            if (confirmSuspend) {
                client.status = "Suspended";
                closeKycModal();
                applyClientFilters();
                addLogStream(`[SECURITY] Admin suspended account nodes for client ${client.name} (${client.id})`);
            }
        }

        function triggerKycBlock() {
            if (!activeKycClientId) return;
            const client = mockClients.find(c => c.id === activeKycClientId);
            if (!client) return;

            const confirmBlock = confirm(`Permanently block and ban user account?\n\nClient: ${client.name}\nUser ID: ${client.id}`);
            if (confirmBlock) {
                client.status = "Blocked";
                closeKycModal();
                applyClientFilters();
                addLogStream(`[SECURITY] Admin blocked client account and IP ranges for ${client.name} (${client.id})`);
            }
        }

        // --- CLIENT PROFILE DRAWER LOGIC ---
        let activeProfileClient = null;

        function openClientDrawer(client) {
            activeProfileClient = client;
            const container = document.getElementById("drawer-inner-profile-body");
            if (!container) return;

            const verifyBtn = document.getElementById("btn-drawer-verify");
            const restrictBtn = document.getElementById("btn-drawer-restrict");
            if (verifyBtn) verifyBtn.style.display = client.verified ? "none" : "block";
            if (restrictBtn) {
                restrictBtn.textContent = client.status === "Blocked" ? "Release Restriction" : "Restrict Node";
                restrictBtn.style.borderColor = client.status === "Blocked" ? "var(--accent-green) !important" : "var(--accent-red) !important";
                restrictBtn.style.color = client.status === "Blocked" ? "var(--accent-green) !important" : "var(--accent-red) !important";
            }

            const regDateFormatted = new Date(client.regDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            const expDate = new Date(new Date(client.regDate).getTime() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

            container.innerHTML = `
                <div class="drawer-profile-section">
                    <div class="drawer-avatar">${client.avatar}</div>
                    <h3 class="drawer-name">${client.name}</h3>
                    <p class="drawer-meta-sub">${client.email}</p>
                </div>
                <div class="drawer-details-grid">
                    <div class="drawer-detail-item">
                        <div class="drawer-detail-lbl">User Account ID</div>
                        <div class="drawer-detail-val font-code">${client.id}</div>
                    </div>
                    <div class="drawer-detail-item">
                        <div class="drawer-detail-lbl">Operational Location</div>
                        <div class="drawer-detail-val">${client.country}</div>
                    </div>
                    <div class="drawer-detail-item">
                        <div class="drawer-detail-lbl">Leased Hashing Plan</div>
                        <div class="drawer-detail-val" style="color: var(--accent-blue);">${client.plan} Tier</div>
                    </div>
                    <div class="drawer-detail-item">
                        <div class="drawer-detail-lbl">Staked Investment</div>
                        <div class="drawer-detail-val font-code">$${client.investment.toLocaleString()}</div>
                    </div>
                    <div class="drawer-detail-item">
                        <div class="drawer-detail-lbl">Active Hashrate</div>
                        <div class="drawer-detail-val font-code">${client.hashrate}</div>
                    </div>
                    <div class="drawer-detail-item">
                        <div class="drawer-detail-lbl">Monthly BTC Mined</div>
                        <div class="drawer-detail-val font-code text-gold">${client.balance} BTC</div>
                    </div>
                    <div class="drawer-detail-item">
                        <div class="drawer-detail-lbl">Total BTC Mined</div>
                        <div class="drawer-detail-val font-code">${client.earned} BTC</div>
                    </div>
                    <div class="drawer-detail-item">
                        <div class="drawer-detail-lbl">Total BTC Withdrawn</div>
                        <div class="drawer-detail-val font-code">${client.withdrawn} BTC</div>
                    </div>
                    <div class="drawer-detail-item">
                        <div class="drawer-detail-lbl">Registered On</div>
                        <div class="drawer-detail-val">${regDateFormatted}</div>
                    </div>
                    <div class="drawer-detail-item">
                        <div class="drawer-detail-lbl">Contract Expiry</div>
                        <div class="drawer-detail-val">${expDate}</div>
                    </div>
                </div>
                <div class="panel-card-title" style="margin: 20px 0 10px 0; font-size: 0.95rem;">
                    <i class="fa-solid fa-timeline"></i> Client Terminal Actions timeline
                </div>
                <ul class="timeline-activities-list">
                    <li class="timeline-activity-item">
                        <div class="timeline-activity-time">${client.regDate} 08:30</div>
                        <div class="timeline-activity-desc">Account registration staged successfully.</div>
                    </li>
                    <li class="timeline-activity-item">
                        <div class="timeline-activity-time">${client.regDate} 08:45</div>
                        <div class="timeline-activity-desc">Staged plan contract initialized. Hashing active.</div>
                    </li>
                    <li class="timeline-activity-item">
                        <div class="timeline-activity-time">2026-07-19 04:30</div>
                        <div class="timeline-activity-desc">Hourly rewards allocated successfully from Assigned ${client.nodeAssignment}.</div>
                    </li>
                </ul>
            `;
            toggleProfileDrawer(true);
        }

        function toggleProfileDrawer(open) {
            const drawer = document.getElementById("profile-detail-drawer");
            if (drawer) {
                if (open) drawer.classList.add("open");
                else drawer.classList.remove("open");
            }
        }

        function triggerClientVerification() {
            if (activeProfileClient) {
                activeProfileClient.verified = true;
                addLogStream(`[SECURITY] Manual client verification applied for ID: ${activeProfileClient.id}`);
                renderClientTable();
                openClientDrawer(activeProfileClient);
            }
        }

        // --- TRANSACTION LEDGER APPROVAL ACTION CONTROLS ---
        function approveWithdrawal(e, txid) {
            e.stopPropagation();
            const tx = mockTransactions.find(t => t.txid === txid);
            if (tx) {
                tx.status = "Confirmed";
                tx.confirmations = "6+ Config";
                addLogStream(`[FINANCE] Payout approval granted for TXID ${txid}. Broadcasting to mempool.`);
                renderTxTable();
                
                const cleanAmount = parseFloat(tx.amount);
                addLogStream(`[BLOCKCHAIN] Payout completed: ${cleanAmount} BTC successfully routed.`);
            }
        }

        function rejectWithdrawal(e, txid) {
            e.stopPropagation();
            const tx = mockTransactions.find(t => t.txid === txid);
            if (tx) {
                tx.status = "Rejected";
                addLogStream(`[FINANCE] Withdrawal rejection executed for TXID ${txid}. Refunding ledger.`);
                renderTxTable();
            }
        }

        // --- LIVE ACTIVITY STREAM LOGGER FEED ---
        const logStreamContainer = document.getElementById("logs-terminal-stream");
        const logEventsPool = [
            "New user registered: usr_node_{RAND}@gmail.com (Staged OTP sent)",
            "Deposit confirmed: 0.04820100 BTC routed to Reykjavik immersion pod",
            "Mining reward distributed: +0.00048210 BTC successfully credited to client balances",
            "Withdrawal completed: 0.00514210 BTC broadcasted to Bitcoin node",
            "New contract activated: Professional Plan Tier lease initiated",
            "Enterprise package purchased: $10,000 staked by new corporate client",
            "Blockchain confirmation completed: 6+ confirmations verified on block #847,294",
            "Node cooling diagnostic run completed: Geothermal PUE index nominal at 1.04"
        ];

        function addLogStream(message) {
            if (!logStreamContainer) return;
            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
            
            const logItem = document.createElement("div");
            logItem.className = "log-row-item";
            logItem.innerHTML = `
                <span class="log-row-time">[${timeStr}]</span>
                <span class="log-row-text">${message}</span>
            `;
            
            logStreamContainer.insertBefore(logItem, logStreamContainer.firstChild);
            
            if (logStreamContainer.children.length > 25) {
                logStreamContainer.removeChild(logStreamContainer.lastChild);
            }
        }

        setInterval(() => {
            const randIdx = Math.floor(Math.random() * logEventsPool.length);
            const template = logEventsPool[randIdx];
            const randNum = Math.floor(Math.random() * 899) + 100;
            const message = template.replace("{RAND}", randNum);
            addLogStream(message);
        }, 5000);

        // --- ADD NEW CLIENT REGISTRATION SYSTEM ENGINE ---
        function openAddClientModal() {
            const errBox = document.getElementById("add-client-error-msg");
            if (errBox) errBox.style.display = "none";

            const nextNum = mockClients.length + 1;
            const autoId = `USR-${nextNum.toString().padStart(5, '0')}`;
            const regDateStr = new Date().toISOString().split('T')[0];

            document.getElementById("ac-user-id").value = autoId;
            document.getElementById("ac-reg-date").value = regDateStr;

            const countrySelect = document.getElementById("ac-country");
            if (countrySelect) {
                countrySelect.innerHTML = "";
                intCountries.forEach(c => {
                    const opt = document.createElement("option");
                    opt.value = c.name;
                    opt.textContent = c.name;
                    countrySelect.appendChild(opt);
                });
                countrySelect.value = "United States";
            }

            handlePlanAutoFill();

            document.getElementById("ac-verify-date").value = regDateStr;
            document.getElementById("ac-dev-last-login").value = `${regDateStr} 12:00:00`;
            document.getElementById("ac-dev-ip").value = `192.168.1.${Math.floor(Math.random() * 200) + 10}`;
            document.getElementById("ac-dev-reg-ip").value = document.getElementById("ac-dev-ip").value;

            document.getElementById("add-client-modal").classList.add("active");
        }

        function closeAddClientModal() {
            document.getElementById("add-client-modal").classList.remove("active");
        }

        // Global Modal Controls: Backdrop Click & ESC Key
        document.addEventListener("click", (e) => {
            const addModal = document.getElementById("add-client-modal");
            if (addModal && e.target === addModal) {
                closeAddClientModal();
            }
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                closeAddClientModal();
                if (typeof closeKycModal === "function") closeKycModal();
                if (typeof closeStatusModal === "function") closeStatusModal();
                if (typeof closeOverclockModal === "function") closeOverclockModal();
                if (typeof closeBalancedModal === "function") closeBalancedModal();
                if (typeof closeDocPreview === "function") closeDocPreview();
            }
        });

        function handlePlanAutoFill() {
            const planVal = document.getElementById("ac-plan-select").value;
            const plansMap = {
                "Beginner": { inv: 100, hash: "10 TH/s", btc: "0.000100", duration: 30, algo: "SHA-256" },
                "Starter": { inv: 500, hash: "50 TH/s", btc: "0.000500", duration: 60, algo: "SHA-256" },
                "Professional": { inv: 1000, hash: "120 TH/s", btc: "0.001200", duration: 90, algo: "SHA-256" },
                "Business": { inv: 5000, hash: "750 TH/s", btc: "0.007500", duration: 180, algo: "SHA-256" },
                "Enterprise": { inv: 10000, hash: "2 PH/s", btc: "0.020000", duration: 365, algo: "SHA-256" },
                "Ultimate": { inv: 50000, hash: "Custom", btc: "0.100000", duration: 365, algo: "SHA-256" }
            };

            const data = plansMap[planVal] || plansMap["Starter"];
            document.getElementById("ac-plan-investment").value = data.inv;
            document.getElementById("ac-plan-hashrate").value = data.hash;
            document.getElementById("ac-plan-monthly-btc").value = data.btc;
            document.getElementById("ac-plan-duration").value = data.duration;
            document.getElementById("ac-plan-algorithm").value = data.algo;

            document.getElementById("ac-fin-total-inv").value = data.inv;
            document.getElementById("ac-fin-balance").value = data.btc;
            document.getElementById("ac-fin-total-mined").value = (parseFloat(data.btc) * 3).toFixed(6);
            document.getElementById("ac-fin-today-btc").value = (parseFloat(data.btc) / 30).toFixed(6);
            document.getElementById("ac-fin-today-rev").value = (data.inv * 0.005).toFixed(2);
            document.getElementById("ac-fin-profit").value = (data.inv * 0.3).toFixed(2);
            document.getElementById("ac-fin-roi").value = "30.0%";
            document.getElementById("ac-current-hashrate").value = data.hash;
        }

        function saveNewClient(autoVerify) {
            const errBox = document.getElementById("add-client-error-msg");
            errBox.style.display = "none";

            const name = document.getElementById("ac-name").value.trim();
            const email = document.getElementById("ac-email").value.trim().toLowerCase();
            const walletAddr = document.getElementById("ac-wallet-address").value.trim();
            const country = document.getElementById("ac-country").value;
            const planName = document.getElementById("ac-plan-select").value;
            let kycStatus = document.getElementById("ac-kyc-status").value;
            let status = document.getElementById("ac-status-select").value;
            const userId = document.getElementById("ac-user-id").value.trim();
            const regDate = document.getElementById("ac-reg-date").value.trim();

            if (!email || !email.includes("@")) {
                showAddClientError("Valid Email Address is required.");
                return;
            }
            if (!walletAddr) {
                showAddClientError("Wallet Address is required.");
                return;
            }
            if (!country) {
                showAddClientError("Country selection is required.");
                return;
            }
            if (!planName) {
                showAddClientError("Mining Plan selection is required.");
                return;
            }
            if (!kycStatus) {
                showAddClientError("KYC Status is required.");
                return;
            }

            const duplicateEmail = mockClients.find(c => c.email.toLowerCase() === email);
            if (duplicateEmail) {
                showAddClientError(`Duplicate Email detected: ${email} is already registered.`);
                return;
            }
            const duplicateId = mockClients.find(c => c.id === userId);
            if (duplicateId) {
                showAddClientError(`Duplicate User ID detected: ${userId} already exists.`);
                return;
            }

            if (autoVerify) {
                kycStatus = "KYC Approved";
                status = "Active";
            }

            const phone = document.getElementById("ac-phone").value.trim() || "+1 (555) 234-5678";
            const dob = document.getElementById("ac-dob").value || "1992-06-15";
            const gender = document.getElementById("ac-gender").value;
            const state = document.getElementById("ac-state").value.trim() || "California";
            const city = document.getElementById("ac-city").value.trim() || "San Francisco";
            const zip = document.getElementById("ac-zip").value.trim() || "94105";
            const address = document.getElementById("ac-address").value.trim() || "100 Grand Boulevard";
            const nationality = document.getElementById("ac-nationality").value.trim() || country;
            const occupation = document.getElementById("ac-occupation").value.trim() || "Investor";
            const refCode = document.getElementById("ac-ref-code").value.trim() || "REF-001";
            const notes = document.getElementById("ac-notes").value.trim();

            const username = document.getElementById("ac-username").value.trim() || email.split("@")[0];
            const walletId = document.getElementById("ac-wallet-id").value.trim() || `WID-${userId.replace("USR-", "")}`;
            const refId = document.getElementById("ac-ref-id").value.trim() || "REF-ID-001";
            const accountType = document.getElementById("ac-account-type").value;

            const idType = "Verification Records";
            const idNum = `VERIFIED-${userId.replace("USR-", "")}`;

            const investment = parseFloat(document.getElementById("ac-plan-investment").value) || 500;
            const hashrate = document.getElementById("ac-plan-hashrate").value || "50 TH/s";
            const monthlyBtc = document.getElementById("ac-plan-monthly-btc").value || "0.000500";
            const algorithm = document.getElementById("ac-plan-algorithm").value || "SHA-256";

            const balance = document.getElementById("ac-fin-balance").value.trim() || monthlyBtc;
            const totalMined = document.getElementById("ac-fin-total-mined").value.trim() || (parseFloat(monthlyBtc) * 3).toFixed(6);
            const withdrawn = document.getElementById("ac-fin-withdrawn").value.trim() || "0.000000";
            const pendingWith = document.getElementById("ac-fin-pending-with").value.trim() || "0.000000";

            const walletType = document.getElementById("ac-wallet-type").value;
            const devIp = document.getElementById("ac-dev-ip").value.trim() || "192.168.1.105";
            const devMac = document.getElementById("ac-dev-mac").value.trim() || "00:1A:2C:3B:4D:5E";
            const devType = document.getElementById("ac-dev-type").value;
            const os = document.getElementById("ac-dev-os").value;
            const browser = document.getElementById("ac-dev-browser").value;
            const timezone = document.getElementById("ac-dev-tz").value.trim() || "UTC+00:00";

            const nameParts = (name || "New Client").split(" ");
            const fName = nameParts[0];
            const lName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
            const avatar = (fName[0] || "N") + (lName[0] || "C");

            const newClient = {
                id: userId,
                avatar: avatar.toUpperCase(),
                name: name || `${fName} ${lName}`.trim(),
                email: email,
                country: country,
                regDate: regDate,
                verified: kycStatus,
                plan: planName,
                investment: investment,
                hashrate: hashrate,
                algorithm: algorithm,
                balance: balance,
                earned: totalMined,
                withdrawn: withdrawn,
                pending: pendingWith,
                status: status,
                phone: phone,
                city: city,
                residentialAddress: address,
                postalCode: zip,
                nationality: nationality,
                dob: dob,
                idType: idType,
                idNumber: idNum,
                passportNumber: idType === "Passport" ? idNum : "",
                ipCountry: country,
                referralCode: refCode,
                walletAddress: walletAddr,
                ip: devIp,
                mac: devMac,
                deviceType: devType,
                deviceName: `${devType.split(" ")[0]}-Client-${userId.replace("USR-", "")}`,
                os: os,
                browser: browser,
                timezone: timezone,
                walletType: walletType,
                totalDeposit: (investment * 1.25).toFixed(2),
                totalWithdrawal: (parseFloat(withdrawn) * 45000 * 0.75).toFixed(2),
                lastWithdrawalAmount: (parseFloat(monthlyBtc) * 0.35).toFixed(6),
                lastWithdrawalDate: regDate,
                lastLogin: `${regDate} 12:00:00`,
                activity: []
            };

            mockClients.unshift(newClient);
            populateCountryFilterOptions();
            updateKycCounters();
            applyClientFilters();

            addLogStream(`[REGISTRATION] ${autoVerify ? 'Save & Verified' : 'Registered'} client profile: ${newClient.name} (${newClient.id})`);
            closeAddClientModal();
            alert(`Client ${newClient.name} (${newClient.id}) registered successfully!`);
        }

        function showAddClientError(msg) {
            const errBox = document.getElementById("add-client-error-msg");
            if (errBox) {
                errBox.textContent = `⚠ ${msg}`;
                errBox.style.display = "block";
            }
            const scrollBody = document.getElementById("add-client-modal-scroll-body");
            if (scrollBody) scrollBody.scrollTop = 0;
        }

        // --- DATA EXPORT MODULES ---
        function exportDataToCSV(dataType) {
            let csvContent = "data:text/csv;charset=utf-8,";
            if (dataType === 'clients') {
                csvContent += "User ID,Name,Email,Country,Plan,Investment,Monthly BTC Mined,Status\n";
                mockClients.forEach(c => {
                    csvContent += `${c.id},"${c.name}",${c.email},${c.country},${c.plan},${c.investment},${c.balance},${c.status}\n`;
                });
            } else {
                csvContent += "TXID,Client,Type,Amount,Fee,Blockchain,Status\n";
                mockTransactions.forEach(t => {
                    csvContent += `${t.txid},"${t.client}",${t.type},${t.amount},${t.fee},${t.blockchain},${t.status}\n`;
                });
            }
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `${dataType}_report_${new Date().toLocaleDateString()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            addLogStream(`[SYSTEM] Client report CSV dispatched and downloaded.`);
        }

        function simulateNewUserRegistration() {
            let firstName, lastName, country, email, fullName;
            const countryData = intCountries[Math.floor(Math.random() * intCountries.length)];
            
            const fIdx = Math.floor(Math.random() * countryData.firstNames.length);
            const lIdx = Math.floor(Math.random() * countryData.lastNames.length);
            const m1 = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            const m2 = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            
            firstName = countryData.firstNames[fIdx];
            lastName = countryData.lastNames[lIdx];
            fullName = `${firstName} ${m1}.${m2}. ${lastName}`;
            email = `${firstName.toLowerCase().replace(" ", "")}.${m1.toLowerCase()}.${m2.toLowerCase()}.${lastName.toLowerCase().replace(" ", "")}@cryptomin-user.com`;
            country = countryData.name;

            let planObj;
            const randVal = Math.floor(Math.random() * 100);
            if (randVal < 65) {
                planObj = plans[0];
            } else if (randVal < 90) {
                planObj = plans[1];
            } else {
                planObj = plans[2];
            }

            const investment = planObj.investment;
            const hashrate = planObj.hash;
            
            let monthlyBtc;
            if (planObj.name === "Beginner") {
                monthlyBtc = (0.00008 + Math.random() * 0.00004).toFixed(6);
            } else if (planObj.name === "Starter") {
                monthlyBtc = (0.00045 + Math.random() * 0.00009).toFixed(6);
            } else {
                monthlyBtc = (0.00120 + Math.random() * 0.00020).toFixed(6);
            }

            const nextId = mockClients.length + 1;
            const newClient = {
                id: `USR-${nextId.toString().padStart(5, '0')}`,
                avatar: firstName[0] + lastName[0],
                name: fullName,
                email: email,
                country: country,
                regDate: new Date().toISOString().split('T')[0],
                verified: "Verified",
                plan: planObj.name,
                investment: investment,
                hashrate: hashrate,
                algorithm: planObj.algorithm,
                balance: monthlyBtc,
                earned: (parseFloat(monthlyBtc) * 3).toFixed(6),
                withdrawn: (parseFloat(monthlyBtc) * 2).toFixed(6),
                pending: "0.000000",
                status: "Active"
            };
            mockClients.unshift(newClient);
            applyClientFilters();
            addLogStream(`[AUTH] Simulated new user registration completed: ${fullName} (${newClient.id})`);
        }

        // --- CHART.JS INTERACTIVE DATA DISPLAY SYSTEM ---
        let dailyRevenueChart, capitalGrowthChart, portfolioPieChart, miningOutputChart, nodeTempChart;

        function initAllDashboardCharts() {
            const dailyCtx = document.getElementById("chart-daily-revenue");
            if (dailyCtx) {
                dailyRevenueChart = new Chart(dailyCtx, {
                    type: 'line',
                    data: {
                        labels: ['09-07', '10-07', '11-07', '12-07', '13-07', '14-07', '15-07', '16-07', '17-07', '18-07', '19-07'],
                        datasets: [{
                            label: 'Daily Hashing Yields (USD)',
                            data: [58400, 59100, 60200, 59500, 60800, 61300, 61800, 61500, 62000, 62100, 62240],
                            borderColor: '#00f0ff',
                            borderWidth: 2,
                            fill: true,
                            backgroundColor: 'rgba(0, 240, 255, 0.03)',
                            tension: 0.35
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#718096' } },
                            x: { grid: { display: false }, ticks: { color: '#718096' } }
                        }
                    }
                });
            }

            const capCtx = document.getElementById("chart-capital-growth");
            if (capCtx) {
                capitalGrowthChart = new Chart(capCtx, {
                    type: 'line',
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                        datasets: [{
                            label: 'Total Mining Capital (K USD)',
                            data: [480, 520, 550, 590, 620, 650, 683.7],
                            borderColor: '#ffbd3d',
                            borderWidth: 2,
                            fill: true,
                            backgroundColor: 'rgba(255, 189, 61, 0.03)',
                            tension: 0.2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#718096' } },
                            x: { grid: { display: false }, ticks: { color: '#718096' } }
                        }
                    }
                });
            }

            const pieCtx = document.getElementById("chart-portfolio-pie");
            if (pieCtx) {
                portfolioPieChart = new Chart(pieCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Beginner', 'Starter', 'Professional', 'Business', 'Enterprise', 'Ultimate'],
                        datasets: [{
                            data: [22.4, 43.1, 34.5, 0.0, 0.0, 0.0],
                            backgroundColor: ['#718096', '#00f0ff', '#8a2be2', '#ffbd3d', '#ff3838', '#e2e2e2'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: { color: '#ffffff', font: { family: 'Outfit' } }
                            }
                        }
                    }
                });
            }

            const miningCtx = document.getElementById("chart-mining-output");
            if (miningCtx) {
                miningOutputChart = new Chart(miningCtx, {
                    type: 'bar',
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                        datasets: [{
                            label: 'Monthly BTC Mined',
                            data: [25.8, 26.2, 27.5, 27.1, 28.3, 28.8, 29.1],
                            backgroundColor: 'rgba(0, 240, 255, 0.15)',
                            borderColor: '#00f0ff',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#718096' } },
                            x: { grid: { display: false }, ticks: { color: '#718096' } }
                        }
                    }
                });
            }

            const tempCtx = document.getElementById("chart-node-temperatures");
            if (tempCtx) {
                nodeTempChart = new Chart(tempCtx, {
                    type: 'line',
                    data: {
                        labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
                        datasets: [
                            { label: 'Iceland-A', data: [41, 42, 42.1, 43, 42.5, 41.8, 42], borderColor: '#00f0ff', borderWidth: 1.5, tension: 0.4, fill: false },
                            { label: 'Norway-B', data: [38, 39, 39.4, 40.2, 39.8, 38.5, 39.1], borderColor: '#8a2be2', borderWidth: 1.5, tension: 0.4, fill: false },
                            { label: 'Switzerland-C', data: [35, 35.8, 36.1, 37.0, 36.5, 35.9, 35.5], borderColor: '#ffbd3d', borderWidth: 1.5, tension: 0.4, fill: false }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { labels: { color: '#ffffff' } } },
                        scales: {
                            y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#718096' } },
                            x: { grid: { display: false }, ticks: { color: '#718096' } }
                        }
                    }
                });
            }
        }

        // ==========================================================================
        // --- ADMIN MASTER TREASURY WALLET & CLIENT EARNINGS LEDGER MODULE ---
        // ==========================================================================

        let walletClientsList = [];
        let filteredWalletClients = [];
        let walletCurrentPage = 1;
        let walletPageSize = 10;
        let walletSortColumn = "id";
        let walletSortDirection = "asc";

        let walletDailyRevenueChart = null;
        let walletMonthlyRevenueChart = null;
        let clientEarningsDistChart = null;
        let treasuryBalanceChart = null;
        let payoutTrendChart = null;

        const masterWalletActivities = [
            { txid: "0x7f3a...9a1b", type: "Incoming Mining Rewards", amountBtc: 0.9700, amountUsd: 63458.85, fee: "0.00005 BTC", target: "AntPool Mining Node #04", time: "Just now", status: "6/6 Confirmed" },
            { txid: "0x4b2c...1d8e", type: "Outgoing Client Payouts", amountBtc: -0.3798, amountUsd: -24850.00, fee: "0.00012 BTC", target: "Batch Payout (124 Miners)", time: "14 mins ago", status: "6/6 Confirmed" },
            { txid: "0x9e1f...8c3a", type: "Reserve Transfers", amountBtc: 5.0000, amountUsd: 327107.50, fee: "0.00002 BTC", target: "Geothermal Immersion Vault 02", time: "1 hour ago", status: "6/6 Confirmed" },
            { txid: "0x2d8a...5f4e", type: "Treasury Balance Updates", amountBtc: 12.8500, amountUsd: 840666.28, fee: "0.00000 BTC", target: "Institutional Custody Rebalance", time: "3 hours ago", status: "6/6 Confirmed" },
            { txid: "0x6c9b...0a7f", type: "Platform Revenue", amountBtc: 0.1455, amountUsd: 9518.82, fee: "0.00004 BTC", target: "1.5% SaaS Maintenance Surcharge", time: "5 hours ago", status: "6/6 Confirmed" },
            { txid: "0x1a4e...3b2c", type: "Maintenance Costs", amountBtc: -0.0820, amountUsd: -5364.56, fee: "0.00003 BTC", target: "Iceland Hydro PPA Substation", time: "8 hours ago", status: "6/6 Confirmed" },
            { txid: "0x8f7d...6e5a", type: "Gas Fees & Settlement", amountBtc: -0.0045, amountUsd: -294.40, fee: "0.00450 BTC", target: "Bitcoin Network Mempool Priority", time: "11 hours ago", status: "6/6 Confirmed" },
            { txid: "0x3c2b...9f8e", type: "Incoming Mining Rewards", amountBtc: 0.9820, amountUsd: 64243.91, fee: "0.00005 BTC", target: "Foundry USA Pool Node #01", time: "1 day ago", status: "6/6 Confirmed" },
            { txid: "0x5d4a...7c1b", type: "Outgoing Client Payouts", amountBtc: -0.3650, amountUsd: -23878.85, fee: "0.00011 BTC", target: "Batch Payout (118 Miners)", time: "1 day ago", status: "6/6 Confirmed" },
            { txid: "0x0e9f...4a2d", type: "Platform Revenue", amountBtc: 0.1473, amountUsd: 9636.59, fee: "0.00004 BTC", target: "Hashrate Lease Fee Settlement", time: "2 days ago", status: "6/6 Confirmed" }
        ];

        function generateWalletClientsData() {
            if (walletClientsList.length > 0) return;

            const plansList = [
                { name: "Starter ASIC Node", baseHash: 45, unit: "TH/s" },
                { name: "Advanced Rig Cluster", baseHash: 120, unit: "TH/s" },
                { name: "Institutional Vault", baseHash: 1.5, unit: "PH/s" },
                { name: "Quantum Hydro-Pod", baseHash: 3.2, unit: "PH/s" }
            ];

            const statusesList = ["Active Payout", "Active Payout", "Active Payout", "Pending Approval", "Processing", "Paused"];

            for (let i = 1; i <= 2357; i++) {
                const seed = i * 17;
                const countryData = intCountries[i % intCountries.length];
                const relIndex = Math.floor(i / intCountries.length);

                const fIdx = relIndex % countryData.firstNames.length;
                const lIdx = Math.floor(relIndex / countryData.firstNames.length) % countryData.lastNames.length;
                const firstName = countryData.firstNames[fIdx];
                const lastName = countryData.lastNames[lIdx];
                const fullName = `${firstName} ${lastName}`;
                const clientId = `CLI-${String(i).padStart(4, '0')}`;

                const planObj = plansList[i % plansList.length];
                const hashrateVal = (planObj.baseHash * (0.9 + seededRandom(seed) * 0.3)).toFixed(2);
                const hashrate = `${hashrateVal} ${planObj.unit}`;

                // Calculate consistent earnings
                const mult = planObj.unit === "PH/s" ? 1000 : 1;
                const todayBtcNum = 0.000015 * (hashrateVal * mult / 45);
                const monthlyBtcNum = todayBtcNum * 30;
                const totalBtcNum = monthlyBtcNum * (3 + seededRandom(seed * 3) * 12);

                const todayBtc = todayBtcNum.toFixed(6);
                const monthlyBtc = monthlyBtcNum.toFixed(6);
                const totalBtc = totalBtcNum.toFixed(6);
                const usdValue = (totalBtcNum * 65421.50).toFixed(2);

                // Wallet address generator
                const hexChars = "0123456789ABCDEF";
                let addr = "0x";
                for (let h = 0; h < 40; h++) {
                    addr += hexChars.charAt(Math.floor(seededRandom(seed + h) * 16));
                }

                const payoutStatus = statusesList[i % statusesList.length];
                const lastMining = (i % 3 === 0) ? "1 min ago" : (i % 3 === 1) ? "3 mins ago" : "Just now";

                const dailyUsd = (todayBtcNum * 65421.50).toFixed(2);
                const monthlyUsd = (monthlyBtcNum * 65421.50).toFixed(2);
                const totalPayoutNum = totalBtcNum * 0.82;
                const currBalanceNum = totalBtcNum - totalPayoutNum;
                const platformFeeNum = totalBtcNum * 0.015;
                const netEarningsNum = totalBtcNum - platformFeeNum;

                walletClientsList.push({
                    id: clientId,
                    name: fullName,
                    country: countryData.name,
                    plan: planObj.name,
                    hashrate,
                    todayBtc,
                    monthlyBtc,
                    totalBtc,
                    usdValue,
                    lastMining,
                    walletAddress: addr,
                    status: payoutStatus,
                    // Detailed metrics
                    dailyUsd,
                    monthlyUsd,
                    totalPayoutBtc: totalPayoutNum.toFixed(6),
                    currBalanceBtc: currBalanceNum.toFixed(6),
                    lastWithdrawal: `${(totalPayoutNum * 0.25).toFixed(6)} BTC (2026-07-28)`,
                    pendingWithdrawal: (i % 17 === 0) ? "0.012500 BTC" : "0.000000 BTC",
                    platformFeeBtc: platformFeeNum.toFixed(6),
                    netEarningsBtc: netEarningsNum.toFixed(6),
                    miningStatus: "Active - Block #849,104"
                });
            }
            filteredWalletClients = [...walletClientsList];
        }

        function populateWalletCountryFilterOptions() {
            const select = document.getElementById("wallet-filter-country");
            if (!select) return;

            const currentVal = select.value || "ALL";
            const uniqueCountries = [...new Set(walletClientsList.map(c => c.country))].sort();

            select.innerHTML = '<option value="ALL">All Countries</option>';
            uniqueCountries.forEach(country => {
                const opt = document.createElement("option");
                opt.value = country;
                opt.textContent = country;
                select.appendChild(opt);
            });
            select.value = currentVal;
        }

        function initWalletCenterModule() {
            generateWalletClientsData();
            populateWalletCountryFilterOptions();
            renderWalletClientsTable();
            renderMasterWalletActivityTable();

            if (!walletDailyRevenueChart) {
                initWalletCenterCharts();
            }
        }

        function filterWalletClientsTable() {
            const query = (document.getElementById("wallet-client-search")?.value || "").toLowerCase().trim();
            const plan = document.getElementById("wallet-filter-plan")?.value || "ALL";
            const country = document.getElementById("wallet-filter-country")?.value || "ALL";
            const status = document.getElementById("wallet-filter-status")?.value || "ALL";

            filteredWalletClients = walletClientsList.filter(client => {
                const matchesQuery = !query || 
                    client.name.toLowerCase().includes(query) ||
                    client.id.toLowerCase().includes(query) ||
                    client.country.toLowerCase().includes(query) ||
                    client.walletAddress.toLowerCase().includes(query) ||
                    client.plan.toLowerCase().includes(query);

                const matchesPlan = (plan === "ALL" || client.plan === plan);
                const matchesCountry = (country === "ALL" || client.country === country);
                const matchesStatus = (status === "ALL" || client.status === status);

                return matchesQuery && matchesPlan && matchesCountry && matchesStatus;
            });

            walletCurrentPage = 1;
            renderWalletClientsTable();
        }

        function sortWalletClients(col) {
            if (walletSortColumn === col) {
                walletSortDirection = (walletSortDirection === "asc") ? "desc" : "asc";
            } else {
                walletSortColumn = col;
                walletSortDirection = "asc";
            }

            filteredWalletClients.sort((a, b) => {
                let valA = a[col];
                let valB = b[col];

                if (col === 'todayBtc' || col === 'monthlyBtc' || col === 'totalBtc' || col === 'usdValue') {
                    valA = parseFloat(valA);
                    valB = parseFloat(valB);
                }

                if (valA < valB) return walletSortDirection === "asc" ? -1 : 1;
                if (valA > valB) return walletSortDirection === "asc" ? 1 : -1;
                return 0;
            });

            renderWalletClientsTable();
        }

        function changeWalletPage(dir) {
            const maxPages = Math.ceil(filteredWalletClients.length / walletPageSize) || 1;
            walletCurrentPage += dir;
            if (walletCurrentPage < 1) walletCurrentPage = 1;
            if (walletCurrentPage > maxPages) walletCurrentPage = maxPages;
            renderWalletClientsTable();
        }

        function renderWalletClientsTable() {
            const tbody = document.getElementById("wallet-clients-tbody");
            const pageInfo = document.getElementById("wallet-pagination-info");
            const pageNum = document.getElementById("wallet-page-num");

            if (!tbody) return;

            const total = filteredWalletClients.length;
            const startIdx = (walletCurrentPage - 1) * walletPageSize;
            const endIdx = Math.min(startIdx + walletPageSize, total);
            const pageClients = filteredWalletClients.slice(startIdx, endIdx);

            if (pageClients.length === 0) {
                tbody.innerHTML = `<tr><td colspan="12" style="text-align: center; color: var(--text-muted); padding: 24px;">No mining clients found matching search criteria.</td></tr>`;
            } else {
                tbody.innerHTML = pageClients.map(c => `
                    <tr style="cursor: pointer;" onclick="openClientWalletDetailModal('${c.id}')" title="Click to view detailed wallet & revenue ledger">
                        <td class="font-mono text-blue" style="font-weight: 700;">${c.id}</td>
                        <td style="font-weight: 600; color: #ffffff;">${c.name}</td>
                        <td>${c.country}</td>
                        <td><span style="font-size: 0.8rem; padding: 2px 8px; border-radius: 4px; background: rgba(0,240,255,0.06); border: 1px solid rgba(0,240,255,0.15); color: var(--accent-blue);">${c.plan}</span></td>
                        <td class="font-mono text-green">${c.hashrate}</td>
                        <td class="font-mono text-green">+${c.todayBtc} BTC</td>
                        <td class="font-mono text-gold">${c.monthlyBtc} BTC</td>
                        <td class="font-mono text-purple" style="font-weight: 700;">${c.totalBtc} BTC</td>
                        <td class="font-mono text-gold">$${Number(c.usdValue).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                        <td style="font-size: 0.8rem; color: var(--text-muted);"><i class="fa-solid fa-bolt text-green"></i> ${c.lastMining}</td>
                        <td class="font-mono" style="font-size: 0.75rem; color: #cbd5e1;">${c.walletAddress.substring(0,6)}...${c.walletAddress.substring(34)}</td>
                        <td><span class="status-badge ${c.status === 'Active Payout' ? 'status-confirmed' : c.status === 'Pending Approval' ? 'status-pending' : 'status-rejected'}">${c.status}</span></td>
                    </tr>
                `).join('');
            }

            if (pageInfo) pageInfo.textContent = `Showing ${total === 0 ? 0 : startIdx + 1} to ${endIdx} of ${total.toLocaleString()} entries`;
            if (pageNum) pageNum.textContent = `Page ${walletCurrentPage}`;
        }

        function renderMasterWalletActivityTable() {
            const tbody = document.getElementById("master-activity-tbody");
            if (!tbody) return;

            tbody.innerHTML = masterWalletActivities.map(act => {
                const isIncoming = act.amountBtc > 0;
                return `
                    <tr>
                        <td class="font-mono text-blue">${act.txid}</td>
                        <td style="font-weight: 600; color: #ffffff;">
                            <i class="fa-solid ${isIncoming ? 'fa-arrow-down-left-and-arrow-up-right-to-inside text-green' : 'fa-paper-plane text-cyan'}" style="margin-right: 6px;"></i>
                            ${act.type}
                        </td>
                        <td class="font-mono ${isIncoming ? 'text-green' : 'text-red'}" style="font-weight: 700;">
                            ${isIncoming ? '+' : ''}${act.amountBtc.toFixed(4)} BTC 
                            <span style="font-size: 0.75rem; color: var(--text-muted);">($${Math.abs(act.amountUsd).toLocaleString('en-US', {minimumFractionDigits: 2})})</span>
                        </td>
                        <td class="font-mono" style="font-size: 0.8rem; color: var(--text-muted);">${act.fee}</td>
                        <td style="font-size: 0.85rem; color: #cbd5e1;">${act.target}</td>
                        <td style="font-size: 0.8rem; color: var(--text-muted);">${act.time}</td>
                        <td><span class="status-badge status-confirmed"><i class="fa-solid fa-check-double"></i> ${act.status}</span></td>
                    </tr>
                `;
            }).join('');
        }

        function openClientWalletDetailModal(clientId) {
            const client = walletClientsList.find(c => c.id === clientId);
            if (!client) return;

            document.getElementById("wd-client-name").textContent = client.name;
            document.getElementById("wd-client-id-badge").textContent = `ID: ${client.id} | Country: ${client.country}`;
            document.getElementById("wd-wallet-addr").textContent = client.walletAddress;
            document.getElementById("wd-mining-contract").textContent = client.plan;
            document.getElementById("wd-mining-status").textContent = client.miningStatus;
            document.getElementById("wd-payout-status").textContent = client.status;

            document.getElementById("wd-hashrate").textContent = client.hashrate;
            document.getElementById("wd-daily-rev").textContent = `${client.todayBtc} BTC`;
            document.getElementById("wd-daily-usd").textContent = `$${client.dailyUsd} USD`;
            document.getElementById("wd-monthly-rev").textContent = `${client.monthlyBtc} BTC`;
            document.getElementById("wd-monthly-usd").textContent = `$${client.monthlyUsd} USD`;
            document.getElementById("wd-lifetime-rev").textContent = `${client.totalBtc} BTC`;
            document.getElementById("wd-lifetime-usd").textContent = `$${Number(client.usdValue).toLocaleString()} USD`;

            document.getElementById("wd-curr-balance").textContent = `${client.currBalanceBtc} BTC`;
            document.getElementById("wd-total-payout").textContent = `${client.totalPayoutBtc} BTC`;
            document.getElementById("wd-last-withdrawal").textContent = client.lastWithdrawal;
            document.getElementById("wd-pending-withdrawal").textContent = client.pendingWithdrawal;
            document.getElementById("wd-platform-fee").textContent = `${client.platformFeeBtc} BTC`;
            document.getElementById("wd-net-earnings").textContent = `${client.netEarningsBtc} BTC`;

            document.getElementById("client-wallet-detail-modal").classList.add("active");
        }

        function closeClientWalletDetailModal() {
            document.getElementById("client-wallet-detail-modal").classList.remove("active");
        }

        function copyMasterWalletAddress() {
            const addr = "0xA91F7C89D2E4F5B18C3D6E91FA6B27D8C901ABF7";
            navigator.clipboard.writeText(addr).then(() => {
                alert("Master Treasury Wallet Address copied to clipboard:\n" + addr);
            }).catch(() => {
                alert("Master Treasury Wallet: " + addr);
            });
        }

        function triggerClientBatchPayout() {
            alert("Batch payout dispatch initiated.\nTarget: Client Mining Wallet.\nStatus: Broadcast queued to Bitcoin Mempool.");
        }

        function exportWalletLedgerCSV() {
            let csv = "Client ID,Client Name,Country,Mining Plan,Hashrate,Today BTC,Monthly BTC,Total Lifetime BTC,Est USD Value,Last Mining Time,Wallet Address,Payout Status\n";
            filteredWalletClients.forEach(c => {
                csv += `"${c.id}","${c.name}","${c.country}","${c.plan}","${c.hashrate}","${c.todayBtc}","${c.monthlyBtc}","${c.totalBtc}","${c.usdValue}","${c.lastMining}","${c.walletAddress}","${c.status}"\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `CRYPTOMIN_Wallet_Ledger_${new Date().toISOString().slice(0,10)}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        }

        function initWalletCenterCharts() {
            const dCtx = document.getElementById("walletDailyRevenueChart");
            if (dCtx) {
                walletDailyRevenueChart = new Chart(dCtx, {
                    type: 'line',
                    data: {
                        labels: ['23 Jul', '24 Jul', '25 Jul', '26 Jul', '27 Jul', '28 Jul', '29 Jul'],
                        datasets: [{
                            label: 'Daily Revenue (BTC)',
                            data: [0.91, 0.94, 0.92, 0.95, 0.98, 0.96, 0.97],
                            borderColor: '#00f0ff',
                            borderWidth: 2,
                            fill: true,
                            backgroundColor: 'rgba(0, 240, 255, 0.05)',
                            tension: 0.3
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#718096' } },
                            x: { grid: { display: false }, ticks: { color: '#718096' } }
                        }
                    }
                });
            }

            const mCtx = document.getElementById("walletMonthlyRevenueChart");
            if (mCtx) {
                walletMonthlyRevenueChart = new Chart(mCtx, {
                    type: 'bar',
                    data: {
                        labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                        datasets: [{
                            label: 'Monthly Mining BTC',
                            data: [24.5, 26.2, 27.8, 28.4, 29.1, 28.8, 29.5, 30.1, 29.8, 30.5, 30.2, 30.07],
                            backgroundColor: 'rgba(0, 230, 118, 0.4)',
                            borderColor: '#00e676',
                            borderWidth: 1,
                            borderRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#718096' } },
                            x: { grid: { display: false }, ticks: { color: '#718096' } }
                        }
                    }
                });
            }

            const distCtx = document.getElementById("clientEarningsDistChart");
            if (distCtx) {
                clientEarningsDistChart = new Chart(distCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Starter ASIC', 'Advanced Cluster', 'Institutional Vault', 'Quantum Hydro-Pod'],
                        datasets: [{
                            data: [42, 32, 18, 8],
                            backgroundColor: ['#00f0ff', '#8a2be2', '#ffbd3d', '#00e676'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { labels: { color: '#ffffff', font: { size: 10 } } } }
                    }
                });
            }

            const tCtx = document.getElementById("treasuryBalanceChart");
            if (tCtx) {
                treasuryBalanceChart = new Chart(tCtx, {
                    type: 'line',
                    data: {
                        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                        datasets: [{
                            label: 'Master Treasury (BTC)',
                            data: [132.4, 136.2, 139.8, 142.85],
                            borderColor: '#ffbd3d',
                            borderWidth: 2,
                            fill: true,
                            backgroundColor: 'rgba(255, 189, 61, 0.05)',
                            tension: 0.2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#718096' } },
                            x: { grid: { display: false }, ticks: { color: '#718096' } }
                        }
                    }
                });
            }

            const pCtx = document.getElementById("payoutTrendChart");
            if (pCtx) {
                payoutTrendChart = new Chart(pCtx, {
                    type: 'line',
                    data: {
                        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                        datasets: [
                            {
                                label: 'Payout USD ($k)',
                                data: [23.2, 24.1, 23.8, 24.5, 25.1, 24.2, 24.85],
                                borderColor: '#00f0ff',
                                borderWidth: 2,
                                tension: 0.3
                            },
                            {
                                label: 'Reserve BTC',
                                data: [65.0, 65.1, 65.2, 65.3, 65.4, 65.4, 65.5],
                                borderColor: '#00e676',
                                borderWidth: 2,
                                borderDash: [4, 4],
                                tension: 0.3
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { labels: { color: '#ffffff', font: { size: 10 } } } },
                        scales: {
                            y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#718096' } },
                            x: { grid: { display: false }, ticks: { color: '#718096' } }
                        }
                    }
                });
            }
        }

        // --- INVITATION KEY DATABASE MODULE ---
        let currentIKPage = 1;
        const ikRowsPerPage = 15;

        function isClientEligibleForInvitationKey(client) {
            if (!client) return false;
            const isKycApproved = (client.verified === "KYC Approved" || client.verified === "Approved");
            const isActive = (client.status === "Active");
            return isKycApproved && isActive;
        }

        function initInvitationKeyDatabaseModule() {
            mockClients.forEach(client => {
                client.isEligible = isClientEligibleForInvitationKey(client);
                if (!client.isEligible) {
                    if (client.invitationKey && client.invitationStatus !== "DISABLED") {
                        client.invitationStatus = "DISABLED";
                    }
                    if (client.passkey && client.passkeyStatus !== "DISABLED") {
                        client.passkeyStatus = "DISABLED";
                    }
                }
            });
            renderInvitationKeyDatabase();
        }

        function applyInvitationKeyFilters() {
            currentIKPage = 1;
            renderInvitationKeyDatabase();
        }

        function renderInvitationKeyDatabase() {
            const tbody = document.getElementById("invitation-keys-tbody");
            if (!tbody) return;

            // Live sync eligibility
            let stateChanged = false;
            mockClients.forEach(c => {
                const wasElig = c.isEligible;
                c.isEligible = isClientEligibleForInvitationKey(c);
                if (!c.isEligible && c.invitationKey && c.invitationStatus !== "DISABLED") {
                    c.invitationStatus = "DISABLED";
                    stateChanged = true;
                }
            });

            if (stateChanged) saveSharedClientsDB();

            const searchVal = (document.getElementById("ik-search-input") ? document.getElementById("ik-search-input").value : "").toLowerCase().trim();
            const eligFilter = document.getElementById("ik-filter-eligibility") ? document.getElementById("ik-filter-eligibility").value : "ALL";
            const statusFilter = document.getElementById("ik-filter-status") ? document.getElementById("ik-filter-status").value : "ALL";
            const passkeyFilter = document.getElementById("ik-filter-passkey-status") ? document.getElementById("ik-filter-passkey-status").value : "ALL";

            let filtered = mockClients.filter(c => {
                const matchSearch = !searchVal || 
                    (c.id && c.id.toLowerCase().includes(searchVal)) ||
                    (c.name && c.name.toLowerCase().includes(searchVal)) ||
                    (c.email && c.email.toLowerCase().includes(searchVal)) ||
                    (c.country && c.country.toLowerCase().includes(searchVal)) ||
                    (c.invitationKey && c.invitationKey.toLowerCase().includes(searchVal)) ||
                    (c.passkey && c.passkey.toLowerCase().includes(searchVal));

                let matchElig = true;
                if (eligFilter === "ELIGIBLE") matchElig = c.isEligible;
                if (eligFilter === "NOT_ELIGIBLE") matchElig = !c.isEligible;

                let matchStatus = true;
                if (statusFilter !== "ALL") {
                    if (statusFilter === "NOT_GENERATED") {
                        matchStatus = (!c.invitationKey || c.invitationStatus === "NOT_GENERATED") && c.isEligible;
                    } else {
                        matchStatus = (c.invitationStatus === statusFilter);
                    }
                }

                let matchPasskey = true;
                if (passkeyFilter !== "ALL") {
                    if (passkeyFilter === "NOT_GENERATED") {
                        matchPasskey = (!c.passkey || c.passkeyStatus === "NOT_GENERATED") && c.isEligible;
                    } else {
                        matchPasskey = (c.passkeyStatus === passkeyFilter);
                    }
                }

                return matchSearch && matchElig && matchStatus && matchPasskey;
            });

            // Update KPI Stats
            const eligibleCount = mockClients.filter(c => c.isEligible).length;
            const generatedCount = mockClients.filter(c => c.isEligible && c.invitationKey && c.invitationStatus === "GENERATED").length;
            const redeemedCount = mockClients.filter(c => c.isEligible && c.invitationStatus === "REDEEMED").length;
            const pendingCount = mockClients.filter(c => c.isEligible && (!c.invitationKey || c.invitationStatus === "NOT_GENERATED")).length;
            const disabledCount = mockClients.filter(c => c.invitationStatus === "DISABLED").length;

            const elElig = document.getElementById("ik-stat-eligible");
            const elGen = document.getElementById("ik-stat-generated");
            const elRed = document.getElementById("ik-stat-redeemed");
            const elPen = document.getElementById("ik-stat-pending");
            const elDis = document.getElementById("ik-stat-disabled");

            if (elElig) elElig.textContent = eligibleCount;
            if (elGen) elGen.textContent = generatedCount;
            if (elRed) elRed.textContent = redeemedCount;
            if (elPen) elPen.textContent = pendingCount;
            if (elDis) elDis.textContent = disabledCount;

            const totalPages = Math.ceil(filtered.length / ikRowsPerPage) || 1;
            if (currentIKPage > totalPages) currentIKPage = totalPages;
            const startIdx = (currentIKPage - 1) * ikRowsPerPage;
            const pageItems = filtered.slice(startIdx, startIdx + ikRowsPerPage);

            tbody.innerHTML = "";
            if (pageItems.length === 0) {
                tbody.innerHTML = `<tr><td colspan="12" style="text-align: center; padding: 30px; color: #94a3b8;"><i class="fa-solid fa-key" style="font-size: 1.8rem; margin-bottom: 8px; display: block;"></i> No matching client invitation records found.</td></tr>`;
            } else {
                pageItems.forEach(client => {
                    const tr = document.createElement("tr");
                    tr.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
                    tr.style.transition = "background 0.2s";
                    tr.onmouseenter = () => tr.style.background = "rgba(255,255,255,0.02)";
                    tr.onmouseleave = () => tr.style.background = "transparent";

                    const eligBadge = client.isEligible ? 
                        `<span class="badge badge-success font-mono" style="background: rgba(0, 255, 157, 0.15); border: 1px solid var(--accent-green); color: var(--accent-green); padding: 3px 8px; border-radius: 6px; font-size: 0.72rem;"><i class="fa-solid fa-check"></i> ELIGIBLE</span>` : 
                        `<span class="badge badge-muted font-mono" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.15); color: #94a3b8; padding: 3px 8px; border-radius: 6px; font-size: 0.72rem;"><i class="fa-solid fa-ban"></i> NOT ELIGIBLE</span>`;

                    let keyCol = "";
                    let passkeyCol = "";
                    let statusCol = "";
                    let passkeyStatusCol = "";
                    let actionCol = "";

                    if (!client.isEligible) {
                        keyCol = `<span style="color: #64748b; font-family: monospace; font-size: 0.78rem;">NOT ELIGIBLE</span>`;
                        passkeyCol = `<span style="color: #64748b; font-family: monospace; font-size: 0.78rem;">NOT ELIGIBLE</span>`;
                        statusCol = `<span class="badge font-mono" style="background: rgba(255,56,56,0.1); color: var(--accent-red); border: 1px solid rgba(255,56,56,0.2); font-size: 0.7rem;">INELIGIBLE</span>`;
                        passkeyStatusCol = `<span class="badge font-mono" style="background: rgba(255,56,56,0.1); color: var(--accent-red); border: 1px solid rgba(255,56,56,0.2); font-size: 0.7rem;">INELIGIBLE</span>`;
                        actionCol = `<span style="color: #64748b; font-size: 0.75rem;">No Actions Available</span>`;
                    } else {
                        // Invitation Key Column
                        if (!client.invitationKey || client.invitationStatus === "NOT_GENERATED") {
                            keyCol = `<span style="color: #94a3b8; font-style: italic; font-size: 0.78rem;">No key generated</span>`;
                            statusCol = `<span class="badge font-mono" style="background: rgba(255,184,0,0.1); color: var(--accent-gold); border: 1px solid rgba(255,184,0,0.3); font-size: 0.7rem;">NOT GENERATED</span>`;
                        } else {
                            const truncatedKey = client.invitationKey.substring(0, 8) + '...' + client.invitationKey.substring(52);
                            keyCol = `<div style="display: flex; align-items: center; gap: 4px;" title="${client.invitationKey}">
                                <code style="background: rgba(0,240,255,0.08); border: 1px solid rgba(0,240,255,0.2); color: var(--accent-cyan); padding: 3px 6px; border-radius: 4px; font-family: monospace; font-size: 0.75rem;">${truncatedKey}</code>
                                <button class="btn btn-sm" style="padding: 2px 5px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #fff;" onclick="copyClientInvitationKey('${client.invitationKey}')" title="Copy 60-char Key"><i class="fa-solid fa-copy"></i></button>
                            </div>`;

                            if (client.invitationStatus === "GENERATED") {
                                statusCol = `<span class="badge font-mono" style="background: rgba(0,240,255,0.15); color: var(--accent-cyan); border: 1px solid var(--accent-cyan); font-size: 0.7rem;"><i class="fa-solid fa-check-circle"></i> GENERATED</span>`;
                            } else if (client.invitationStatus === "REDEEMED") {
                                statusCol = `<span class="badge font-mono" style="background: rgba(0,255,157,0.15); color: var(--accent-green); border: 1px solid var(--accent-green); font-size: 0.7rem;"><i class="fa-solid fa-gift"></i> REDEEMED</span>`;
                            } else if (client.invitationStatus === "DISABLED") {
                                statusCol = `<span class="badge font-mono" style="background: rgba(255,56,56,0.15); color: var(--accent-red); border: 1px solid var(--accent-red); font-size: 0.7rem;"><i class="fa-solid fa-ban"></i> DISABLED</span>`;
                            } else {
                                statusCol = `<span class="badge font-mono" style="background: rgba(148,163,184,0.15); color: #94a3b8; border: 1px solid #94a3b8; font-size: 0.7rem;">${client.invitationStatus}</span>`;
                            }
                        }

                        // Client Passkey Column
                        if (!client.passkey || client.passkeyStatus === "NOT_GENERATED") {
                            passkeyCol = `<span style="color: #94a3b8; font-style: italic; font-size: 0.78rem;">No passkey</span>`;
                            passkeyStatusCol = `<span class="badge font-mono" style="background: rgba(255,184,0,0.1); color: var(--accent-gold); border: 1px solid rgba(255,184,0,0.3); font-size: 0.7rem;">NOT GENERATED</span>`;
                        } else {
                            passkeyCol = `<div style="display: flex; align-items: center; gap: 4px;" title="${client.passkey}">
                                <code style="background: rgba(0,255,157,0.08); border: 1px solid rgba(0,255,157,0.2); color: var(--accent-green); padding: 3px 6px; border-radius: 4px; font-family: monospace; font-size: 0.78rem; font-weight: bold;">${client.passkey}</code>
                                <button class="btn btn-sm" style="padding: 2px 5px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #fff;" onclick="copyClientPasskey('${client.passkey}')" title="Copy Passkey"><i class="fa-solid fa-copy"></i></button>
                            </div>`;

                            if (client.passkeyStatus === "ACTIVE" || client.passkeyStatus === "GENERATED") {
                                passkeyStatusCol = `<span class="badge font-mono" style="background: rgba(0,255,157,0.15); color: var(--accent-green); border: 1px solid var(--accent-green); font-size: 0.7rem;"><i class="fa-solid fa-shield-check"></i> ${client.passkeyStatus}</span>`;
                            } else if (client.passkeyStatus === "DISABLED") {
                                passkeyStatusCol = `<span class="badge font-mono" style="background: rgba(255,56,56,0.15); color: var(--accent-red); border: 1px solid var(--accent-red); font-size: 0.7rem;"><i class="fa-solid fa-lock"></i> DISABLED</span>`;
                            } else {
                                passkeyStatusCol = `<span class="badge font-mono" style="background: rgba(148,163,184,0.15); color: #94a3b8; border: 1px solid #94a3b8; font-size: 0.7rem;">${client.passkeyStatus}</span>`;
                            }
                        }

                        // Combined Action Column
                        let ikBtns = "";
                        if (!client.invitationKey || client.invitationStatus === "NOT_GENERATED") {
                            ikBtns = `<button class="btn btn-primary btn-sm" style="font-size: 0.7rem; padding: 3px 8px; background: linear-gradient(135deg, rgba(0,240,255,0.3) 0%, rgba(0,180,255,0.4) 100%) !important; border: 1px solid var(--accent-blue) !important;" onclick="generateClientInvitationKey('${client.id}')" title="Generate Key"><i class="fa-solid fa-key icon-left"></i> Key</button>`;
                        } else {
                            ikBtns = `
                                <button class="btn btn-sm" style="padding: 2px 6px; font-size: 0.68rem; background: rgba(0,240,255,0.1); border: 1px solid var(--accent-blue); color: var(--accent-blue);" onclick="copyClientInvitationKey('${client.invitationKey}')" title="Copy Key"><i class="fa-solid fa-copy"></i></button>
                                <button class="btn btn-sm" style="padding: 2px 6px; font-size: 0.68rem; background: rgba(255,184,0,0.1); border: 1px solid var(--accent-gold); color: var(--accent-gold);" onclick="regenerateClientInvitationKey('${client.id}')" title="Regen Key"><i class="fa-solid fa-arrows-rotate"></i></button>
                                <button class="btn btn-sm" style="padding: 2px 6px; font-size: 0.68rem; background: rgba(255,56,56,0.1); border: 1px solid var(--accent-red); color: var(--accent-red);" onclick="disableClientInvitationKey('${client.id}')" title="Disable Key"><i class="fa-solid fa-ban"></i></button>
                                <button class="btn btn-sm" style="padding: 2px 6px; font-size: 0.68rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #94a3b8;" onclick="deleteClientInvitationKey('${client.id}')" title="Delete Key"><i class="fa-solid fa-trash"></i></button>
                            `;
                        }

                        let passBtns = "";
                        if (!client.passkey || client.passkeyStatus === "NOT_GENERATED") {
                            passBtns = `<button class="btn btn-outline border-blue text-blue btn-sm" style="font-size: 0.7rem; padding: 3px 8px;" onclick="generateClientPasskey('${client.id}')" title="Generate Passkey"><i class="fa-solid fa-lock icon-left"></i> Passkey</button>`;
                        } else {
                            passBtns = `
                                <button class="btn btn-sm" style="padding: 2px 6px; font-size: 0.68rem; background: rgba(0,255,157,0.1); border: 1px solid var(--accent-green); color: var(--accent-green);" onclick="copyClientPasskey('${client.passkey}')" title="Copy Passkey"><i class="fa-solid fa-copy"></i></button>
                                <button class="btn btn-sm" style="padding: 2px 6px; font-size: 0.68rem; background: rgba(255,184,0,0.1); border: 1px solid var(--accent-gold); color: var(--accent-gold);" onclick="regenerateClientPasskey('${client.id}')" title="Regen Passkey"><i class="fa-solid fa-arrows-rotate"></i></button>
                                <button class="btn btn-sm" style="padding: 2px 6px; font-size: 0.68rem; background: rgba(255,56,56,0.1); border: 1px solid var(--accent-red); color: var(--accent-red);" onclick="disableClientPasskey('${client.id}')" title="Disable Passkey"><i class="fa-solid fa-lock"></i></button>
                                <button class="btn btn-sm" style="padding: 2px 6px; font-size: 0.68rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #94a3b8;" onclick="deleteClientPasskey('${client.id}')" title="Delete Passkey"><i class="fa-solid fa-trash"></i></button>
                            `;
                        }

                        actionCol = `<div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-end;">
                            <div style="display: flex; gap: 3px; align-items: center;">${ikBtns}</div>
                            <div style="display: flex; gap: 3px; align-items: center;">${passBtns}</div>
                        </div>`;
                    }

                    tr.innerHTML = `
                        <td style="padding: 10px; font-family: monospace; color: var(--accent-cyan); font-weight: bold;">${client.id}</td>
                        <td style="padding: 10px; color: #fff; font-weight: 600;">${client.name}</td>
                        <td style="padding: 10px; color: #cbd5e1;">${client.email}</td>
                        <td style="padding: 10px; color: #cbd5e1;">${client.country}</td>
                        <td style="padding: 10px; color: #cbd5e1;">${client.plan || 'Beginner'}</td>
                        <td style="padding: 10px;">${client.verified === "KYC Approved" ? '<span style="color: var(--accent-green);"><i class="fa-solid fa-circle-check"></i> Approved</span>' : '<span style="color: var(--accent-gold);">' + client.verified + '</span>'}</td>
                        <td style="padding: 10px;">${client.status === "Active" ? '<span style="color: var(--accent-green);">Active</span>' : '<span style="color: var(--accent-red);">' + client.status + '</span>'}</td>
                        <td style="padding: 10px;">${eligBadge}</td>
                        <td style="padding: 10px;">${keyCol}</td>
                        <td style="padding: 10px;">${passkeyCol}</td>
                        <td style="padding: 10px;">${statusCol}</td>
                        <td style="padding: 10px;">${passkeyStatusCol}</td>
                        <td style="padding: 10px; font-family: monospace; color: #94a3b8;">${client.invitationKeyCreated || '--'}</td>
                        <td style="padding: 10px; text-align: right;">${actionCol}</td>
                    `;
                    tbody.appendChild(tr);
                });
            }

            const tableInfo = document.getElementById("ik-table-info");
            if (tableInfo) {
                tableInfo.textContent = `Showing ${filtered.length === 0 ? 0 : startIdx + 1} to ${Math.min(startIdx + ikRowsPerPage, filtered.length)} of ${filtered.length} entries (${mockClients.length} total clients)`;
            }

            const pageNumEl = document.getElementById("ik-page-num");
            if (pageNumEl) pageNumEl.textContent = `Page ${currentIKPage} of ${totalPages}`;

            const btnPrev = document.getElementById("ik-prev-page");
            const btnNext = document.getElementById("ik-next-page");
            if (btnPrev) btnPrev.disabled = (currentIKPage <= 1);
            if (btnNext) btnNext.disabled = (currentIKPage >= totalPages);
        }

        function changeIKPage(delta) {
            currentIKPage += delta;
            renderInvitationKeyDatabase();
        }

        function generateClientInvitationKey(clientId) {
            const client = mockClients.find(c => c.id === clientId);
            if (!client) return;

            if (!isClientEligibleForInvitationKey(client)) {
                if (typeof showToast === 'function') {
                    showToast("Ineligible Client", "This client is not eligible for an Invitation Key.", "danger");
                }
                return;
            }

            client.invitationKey = generate60CharInvitationKey();
            client.invitationStatus = "GENERATED";
            client.invitationKeyCreated = new Date().toISOString().substring(0, 10);

            saveSharedClientsDB();
            renderInvitationKeyDatabase();
            if (typeof showToast === 'function') {
                showToast("Key Generated", `Unique 60-character Invitation Key created for ${client.name}.`, "success");
            }
        }

        function copyClientInvitationKey(key) {
            if (!key) return;
            navigator.clipboard.writeText(key).then(() => {
                if (typeof showToast === 'function') {
                    showToast("Copied Successfully", "60-character Invitation Key copied to clipboard.", "success");
                }
            }).catch(err => {
                const textarea = document.createElement("textarea");
                textarea.value = key;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand("copy");
                document.body.removeChild(textarea);
                if (typeof showToast === 'function') {
                    showToast("Copied Successfully", "60-character Invitation Key copied to clipboard.", "success");
                }
            });
        }

        function regenerateClientInvitationKey(clientId) {
            const client = mockClients.find(c => c.id === clientId);
            if (!client || !client.isEligible) return;

            if (confirm(`Are you sure you want to regenerate the Invitation Key for ${client.name}? The previous key will be rendered invalid forever.`)) {
                client.invitationKey = generate60CharInvitationKey();
                client.invitationStatus = "GENERATED";
                client.invitationKeyCreated = new Date().toISOString().substring(0, 10);

                saveSharedClientsDB();
                renderInvitationKeyDatabase();
                if (typeof showToast === 'function') {
                    showToast("Key Regenerated", `New unique 60-character Invitation Key assigned to ${client.name}.`, "info");
                }
            }
        }

        function disableClientInvitationKey(clientId) {
            const client = mockClients.find(c => c.id === clientId);
            if (!client) return;

            client.invitationStatus = "DISABLED";
            saveSharedClientsDB();
            renderInvitationKeyDatabase();
            if (typeof showToast === 'function') {
                showToast("Key Disabled", `Invitation Key for ${client.name} has been revoked.`, "warning");
            }
        }

        function deleteClientInvitationKey(clientId) {
            const client = mockClients.find(c => c.id === clientId);
            if (!client) return;

            client.invitationKey = null;
            client.invitationStatus = "NOT_GENERATED";
            client.invitationKeyCreated = null;
            saveSharedClientsDB();
            renderInvitationKeyDatabase();
            if (typeof showToast === 'function') {
                showToast("Key Deleted", `Invitation Key for ${client.name} removed.`, "danger");
            }
        }

        function batchGenerateAllEligibleKeys() {
            let generatedCount = 0;
            mockClients.forEach(c => {
                if (isClientEligibleForInvitationKey(c) && (!c.invitationKey || c.invitationStatus === "NOT_GENERATED")) {
                    c.invitationKey = generate60CharInvitationKey();
                    c.invitationStatus = "GENERATED";
                    c.invitationKeyCreated = new Date().toISOString().substring(0, 10);
                    generatedCount++;
                }
            });

            saveSharedClientsDB();
            renderInvitationKeyDatabase();
            if (typeof showToast === 'function') {
                showToast("Batch Generation Complete", `Generated 60-character keys for ${generatedCount} eligible clients.`, "success");
            }
        }

        // --- CLIENT PASSKEY MANAGEMENT ACTIONS ---
        function generateClientPasskey(clientId) {
            const client = mockClients.find(c => c.id === clientId);
            if (!client) return;

            if (!isClientEligibleForInvitationKey(client)) {
                if (typeof showToast === 'function') {
                    showToast("Ineligible Client", "This client is not eligible for a Passkey.", "danger");
                }
                return;
            }

            client.passkey = generate8CharPasskey();
            client.passkeyStatus = "ACTIVE";

            saveSharedClientsDB();
            renderInvitationKeyDatabase();
            if (typeof showToast === 'function') {
                showToast("Passkey Generated", `Unique 8-character Passkey created for ${client.name}.`, "success");
            }
        }

        function copyClientPasskey(passkey) {
            if (!passkey) return;
            navigator.clipboard.writeText(passkey).then(() => {
                if (typeof showToast === 'function') {
                    showToast("Passkey Copied Successfully", "8-character Passkey copied to clipboard.", "success");
                }
            }).catch(err => {
                const textarea = document.createElement("textarea");
                textarea.value = passkey;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand("copy");
                document.body.removeChild(textarea);
                if (typeof showToast === 'function') {
                    showToast("Passkey Copied Successfully", "8-character Passkey copied to clipboard.", "success");
                }
            });
        }

        function regenerateClientPasskey(clientId) {
            const client = mockClients.find(c => c.id === clientId);
            if (!client || !client.isEligible) return;

            if (confirm(`Are you sure you want to regenerate the Passkey for ${client.name}? The previous passkey will be rendered invalid forever.`)) {
                client.passkey = generate8CharPasskey();
                client.passkeyStatus = "ACTIVE";

                saveSharedClientsDB();
                renderInvitationKeyDatabase();
                if (typeof showToast === 'function') {
                    showToast("Passkey Regenerated", `New unique 8-character Passkey assigned to ${client.name}.`, "info");
                }
            }
        }

        function disableClientPasskey(clientId) {
            const client = mockClients.find(c => c.id === clientId);
            if (!client) return;

            client.passkeyStatus = "DISABLED";
            saveSharedClientsDB();
            renderInvitationKeyDatabase();
            if (typeof showToast === 'function') {
                showToast("Passkey Disabled", `Passkey for ${client.name} has been revoked.`, "warning");
            }
        }

        function deleteClientPasskey(clientId) {
            const client = mockClients.find(c => c.id === clientId);
            if (!client) return;

            client.passkey = null;
            client.passkeyStatus = "NOT_GENERATED";
            saveSharedClientsDB();
            renderInvitationKeyDatabase();
            if (typeof showToast === 'function') {
                showToast("Passkey Deleted", `Passkey for ${client.name} removed permanently.`, "danger");
            }
        }

        // Bootstrapping on DOM Ready
        document.addEventListener("DOMContentLoaded", () => {
            const loginForm = document.getElementById("admin-login-form");
            if (loginForm) {
                loginForm.addEventListener("submit", handleLoginSubmit);
            }
            checkAdminSession();
            
            addLogStream("[SYSTEM] Enterprise Core initialized. Checking connections...");
            addLogStream("[SYNC] Global Node Pool operational loops Synced.");
            addLogStream("[SECURITY] FIDO2 WebAuthn module stage: PROTECTED.");
        });