const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const backgroundCanvas =
    document.getElementById("backgroundCanvas");

const bgCtx =
    backgroundCanvas.getContext("2d");

/* =========================================================
UI
========================================================= */

const startScreen =
    document.getElementById("startScreen");

const countdownScreen =
    document.getElementById("countdownScreen");

const countdownNumber =
    document.getElementById("countdownNumber");

const gameOverScreen =
    document.getElementById("gameOverScreen");

const sectionFlash =
    document.getElementById("sectionFlash");

const sectionFlashText =
    document.getElementById("sectionFlashText");

const distanceEl =
    document.getElementById("distance");

const scoreEl =
    document.getElementById("score");

const bestEl =
    document.getElementById("best");

const livesEl =
    document.getElementById("lives");

const sectionNameEl =
    document.getElementById("sectionName");

const finalDistanceEl =
    document.getElementById("finalDistance");

const finalScoreEl =
    document.getElementById("finalScore");

const finalBestEl =
    document.getElementById("finalBest");

/* =========================================================
CANVAS
========================================================= */

let width = window.innerWidth;
let height = window.innerHeight;

function resize() {

    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    backgroundCanvas.width = width;
    backgroundCanvas.height = height;

    player.y =
        getGroundY() - player.height;
}

window.addEventListener(
    "resize",
    resize
);

/* =========================================================
GAME STATE
========================================================= */

let gameRunning = false;
let countdownActive = false;

let selectedDifficulty = 1;

let score = 0;
let distance = 0;

let best =
    Number(
        localStorage.getItem("neonRunnerBest")
    ) || 0;

let lives = 3;

let gameTime = 0;

let speed = 2;

let spawnTimer = 0;

let lastTime = 0;

let particles = [];

let obstacles = [];

let buildings = [];

let clouds = [];

let screenShake = 0;

let dashFlash = 0;

let currentSection = "CITY STREETS";

/* =========================================================
DIFFICULTY
========================================================= */

const difficulties = {

    1: {
        name: "EASY",

        speed: 2.0,

        jumpPower: -15.5,

        gravity: 0.55,

        spawnRate: 1900
    },

    2: {
        name: "MEDIUM",

        speed: 2.7,

        jumpPower: -15.8,

        gravity: 0.58,

        spawnRate: 1650
    },

    3: {
        name: "HARD",

        speed: 3.4,

        jumpPower: -16.2,

        gravity: 0.60,

        spawnRate: 1450
    },

    4: {
        name: "INSANE",

        speed: 4.0,

        jumpPower: -16.5,

        gravity: 0.62,

        spawnRate: 1300
    }

};

/* =========================================================
PLAYER
========================================================= */

const player = {

    x: 185,

    y: 0,

    width: 38,

    height: 72,

    velocityY: 0,

    grounded: true,

    sliding: false,

    dashing: false,

    dashTimer: 0,

    dashCooldown: 0,

    jumpPhase: 0,

    runPhase: 0
};

/* =========================================================
WORLD
========================================================= */

function getGroundY() {

    return height - 105;
}

/* =========================================================
SECTION SYSTEM
========================================================= */

const sections = [

    {
        name: "CITY STREETS",
        start: 0
    },

    {
        name: "ROOFTOPS",
        start: 500
    },

    {
        name: "BRIDGE DISTRICT",
        start: 1100
    },

    {
        name: "INDUSTRIAL ZONE",
        start: 1800
    },

    {
        name: "SKYLINE",
        start: 2700
    },

    {
        name: "ROUGH TERRAIN",
        start: 3900
    }

];

function getCurrentSection() {

    let section = sections[0];

    for (
        const item of sections
    ) {

        if (
            distance >= item.start
        ) {

            section = item;

        }

    }

    return section;
}

function checkSection() {

    const section =
        getCurrentSection();

    if (
        section.name !==
        currentSection
    ) {

        currentSection =
            section.name;

        sectionNameEl.textContent =
            currentSection;

        showSectionFlash(
            currentSection
        );
    }
}

function showSectionFlash(name) {

    sectionFlashText.textContent =
        name;

    sectionFlash.classList.remove(
        "hidden"
    );

    sectionFlashText.style.animation =
        "none";

    void sectionFlashText.offsetWidth;

    sectionFlashText.style.animation =
        "sectionReveal 1.8s ease forwards";

    setTimeout(() => {

        sectionFlash.classList.add(
            "hidden"
        );

    }, 1800);
}

/* =========================================================
INPUT
========================================================= */

document.addEventListener(
    "keydown",
    function(event) {

        const key =
            event.key.toLowerCase();

        if (
            key === " " ||
            key === "arrowup" ||
            key === "arrowdown" ||
            key === "shift"
        ) {

            event.preventDefault();

        }

        /* Difficulty */

        if (
            !gameRunning &&
            !countdownActive &&
            !startScreen.classList.contains("hidden")
        ) {

            if (
                ["1", "2", "3", "4"].includes(event.key)
            ) {

                selectDifficulty(
                    Number(event.key)
                );

                return;
            }

            if (
                key === "enter"
            ) {

                startGame();

                return;
            }
        }

        if (countdownActive) {
            return;
        }

        /* Game over */

        if (!gameRunning) {

            if (
                key === " "
            ) {

                startGame();

                return;
            }

            if (
                key === "escape"
            ) {

                returnToMenu();

                return;
            }

            return;
        }

        /* Jump */

        if (
            key === " " ||
            key === "w" ||
            key === "arrowup"
        ) {

            jump();

            return;
        }

        /* Slide */

        if (
            key === "s" ||
            key === "arrowdown"
        ) {

            player.sliding = true;

            return;
        }

        /* Dash */

        if (
            key === "shift"
        ) {

            dash();

            return;
        }

        /* Escape */

        if (
            key === "escape"
        ) {

            returnToMenu();

        }

    }
);

document.addEventListener(
    "keyup",
    function(event) {

        const key =
            event.key.toLowerCase();

        if (
            key === "s" ||
            key === "arrowdown"
        ) {

            player.sliding = false;

        }

    }
);

/* =========================================================
DIFFICULTY BUTTONS
========================================================= */

document
    .querySelectorAll(
        ".difficulty-item"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            function() {

                selectDifficulty(
                    Number(
                        this.dataset.difficulty
                    )
                );

            }
        );

    });

function selectDifficulty(level) {

    if (
        !difficulties[level]
    ) {

        return;

    }

    selectedDifficulty =
        level;

    document
        .querySelectorAll(
            ".difficulty-item"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                Number(
                    button.dataset.difficulty
                ) === level
            );

        });
}

/* =========================================================
START
========================================================= */

function startGame() {

    if (gameRunning) {
        return;
    }

    startScreen.classList.add(
        "hidden"
    );

    gameOverScreen.classList.add(
        "hidden"
    );

    countdownActive = true;

    countdownScreen.classList.remove(
        "hidden"
    );

    let count = 3;

    countdownNumber.textContent =
        count;

    const timer =
        setInterval(() => {

            count--;

            if (
                count > 0
            ) {

                countdownNumber.textContent =
                    count;

            } else {

                clearInterval(timer);

                countdownNumber.textContent =
                    "GO";

                setTimeout(() => {

                    countdownScreen.classList.add(
                        "hidden"
                    );

                    countdownActive = false;

                    resetGame();

                    gameRunning = true;

                    lastTime =
                        performance.now();

                    requestAnimationFrame(
                        gameLoop
                    );

                }, 600);

            }

        }, 800);
}

/* =========================================================
RESET
========================================================= */

function resetGame() {

    score = 0;

    distance = 0;

    lives = 3;

    gameTime = 0;

    speed =
        difficulties[
            selectedDifficulty
        ].speed;

    spawnTimer = 0;

    particles = [];

    obstacles = [];

    screenShake = 0;

    dashFlash = 0;

    currentSection =
        "CITY STREETS";

    sectionNameEl.textContent =
        currentSection;

    player.x = 185;

    player.y =
        getGroundY() -
        player.height;

    player.velocityY = 0;

    player.grounded = true;

    player.sliding = false;

    player.dashing = false;

    player.dashTimer = 0;

    player.dashCooldown = 0;

    player.jumpPhase = 0;

    player.runPhase = 0;

    createBuildings();

    createClouds();

    updateHUD();
}

/* =========================================================
JUMP
========================================================= */

function jump() {

    if (
        !player.grounded
    ) {

        return;

    }

    player.velocityY =
        difficulties[
            selectedDifficulty
        ].jumpPower;

    player.grounded = false;

    player.sliding = false;

    player.jumpPhase = 0;

    createBurst(
        player.x,
        getGroundY(),
        "#5defff",
        10
    );
}

/* =========================================================
SLIDE
========================================================= */

function updateSlide() {

    if (
        player.sliding &&
        player.grounded
    ) {

        player.height = 42;

    } else {

        player.height = 72;

    }
}

/* =========================================================
DASH
========================================================= */

function dash() {

    if (
        player.dashing ||
        player.dashCooldown > 0
    ) {

        return;

    }

    player.dashing = true;

    player.dashTimer = 420;

    player.dashCooldown = 1100;

    dashFlash = 420;

    createBurst(
        player.x,
        player.y + 35,
        "#9d7cff",
        22
    );
}

/* =========================================================
PLAYER PHYSICS
========================================================= */

function updatePlayer(delta) {

    const physics =
        difficulties[
            selectedDifficulty
        ];

    const frame =
        delta / 16.67;

    /* Gravity */

    player.velocityY +=
        physics.gravity *
        frame;

    player.y +=
        player.velocityY *
        frame;

    /* Ground */

    const floor =
        getGroundY() -
        player.height;

    if (
        player.y >= floor
    ) {

        player.y = floor;

        player.velocityY = 0;

        player.grounded = true;

    } else {

        player.grounded = false;

    }

    updateSlide();

    /* Animation */

    player.runPhase +=
        delta *
        0.014 *
        speed;

    if (
        !player.grounded
    ) {

        player.jumpPhase +=
            delta *
            0.006;

    }

    /* Dash */

    if (
        player.dashing
    ) {

        player.dashTimer -=
            delta;

        if (
            player.dashTimer <= 0
        ) {

            player.dashing = false;

        }

    }

    if (
        player.dashCooldown > 0
    ) {

        player.dashCooldown -=
            delta;

    }
}

/* =========================================================
TERRAIN SPAWN
========================================================= */

function spawnTerrain() {

    const section =
        getCurrentSection().name;

    const difficulty =
        selectedDifficulty;

    let type = "barrier";

    const random =
        Math.random();

    /*
        Important:
        Gaps are deliberately kept
        within the player's jump capability.
    */

    if (
        section === "CITY STREETS"
    ) {

        if (
            random < 0.18
        ) {

            type = "gap";

        } else {

            type = "barrier";

        }

    } else if (
        section === "ROOFTOPS"
    ) {

        if (
            random < 0.38
        ) {

            type = "gap";

        } else {

            type = "barrier";

        }

    } else if (
        section === "BRIDGE DISTRICT"
    ) {

        if (
            random < 0.50
        ) {

            type = "gap";

        } else {

            type = "barrier";

        }

    } else if (
        section === "INDUSTRIAL ZONE"
    ) {

        if (
            random < 0.42
        ) {

            type = "gap";

        } else {

            type = "barrier";

        }

    } else {

        if (
            random < 0.55
        ) {

            type = "gap";

        } else {

            type = "barrier";

        }

    }

    /*
        Easy gets smaller gaps.
        Harder levels gradually get wider.
    */

    if (
        type === "gap"
    ) {

        const gapSize =
            difficulty === 1
                ? 42 + Math.random() * 14
                : difficulty === 2
                    ? 48 + Math.random() * 18
                    : difficulty === 3
                        ? 55 + Math.random() * 20
                        : 62 + Math.random() * 22;

        obstacles.push({

            x:
                width + 100,

            type: "gap",

            width:
                gapSize,

            passed: false

        });

    } else {

        const barrierHeight =
            42 +
            Math.random() *
            20;

        obstacles.push({

            x:
                width + 100,

            type: "barrier",

            width:
                40 +
                Math.random() * 10,

            height:
                barrierHeight,

            passed: false

        });

    }
}

/* =========================================================
UPDATE TERRAIN
========================================================= */

function updateTerrain(delta) {

    /*
        World movement.

        Dash temporarily makes the
        world move faster, giving the
        player a strong burst.
    */

    let worldSpeed =
        speed *
        0.12;

    if (
        player.dashing
    ) {

        worldSpeed *= 1.8;

    }

    const movement =
        worldSpeed *
        delta;

    for (
        let i =
            obstacles.length - 1;
        i >= 0;
        i--
    ) {

        const object =
            obstacles[i];

        object.x -=
            movement;

        if (
            !object.passed &&
            object.x <
            player.x
        ) {

            object.passed = true;

            score +=
                100;

        }

        if (
            object.x <
            -250
        ) {

            obstacles.splice(
                i,
                1
            );

        }

    }

    spawnTimer +=
        delta;

    const difficulty =
        difficulties[
            selectedDifficulty
        ];

    /*
        Slightly more breathing room
        between terrain pieces.
    */

    const spawnRate =
        difficulty.spawnRate;

    if (
        spawnTimer >=
        spawnRate
    ) {

        spawnTimer = 0;

        spawnTerrain();

    }
}

/* =========================================================
COLLISION
========================================================= */

function checkCollisions() {

    for (
        const object of obstacles
    ) {

        /*
            Dashing gives temporary
            protection.
        */

        if (
            player.dashing
        ) {

            continue;

        }

        const playerLeft =
            player.x -
            player.width / 2;

        const playerRight =
            player.x +
            player.width / 2;

        const playerBottom =
            player.y +
            player.height;

        /* Barrier */

        if (
            object.type ===
            "barrier"
        ) {

            const left =
                object.x -
                object.width / 2;

            const right =
                object.x +
                object.width / 2;

            const top =
                getGroundY() -
                object.height;

            /*
                Sliding lowers the
                player's collision box.
            */

            if (
                playerRight > left &&
                playerLeft < right &&
                playerBottom > top &&
                player.y < getGroundY()
            ) {

                /*
                    If sliding, low barriers
                    are allowed.
                */

                if (
                    player.sliding &&
                    object.height < 55
                ) {

                    continue;

                }

                failRun();

                return;

            }

        }

        /* Gap */

        if (
            object.type ===
            "gap"
        ) {

            const left =
                object.x -
                object.width / 2;

            const right =
                object.x +
                object.width / 2;

            /*
                A gap only kills the player
                while grounded.

                This gives the jump a real
                physical purpose.
            */

            if (
                player.x >
                left &&
                player.x <
                right &&
                player.grounded
            ) {

                failRun();

                return;

            }

        }

    }
}

/* =========================================================
FAIL
========================================================= */

function failRun() {

    if (
        !gameRunning
    ) {

        return;

    }

    lives--;

    screenShake = 18;

    createBurst(
        player.x,
        player.y + 30,
        "#ff4fc4",
        28
    );

    if (
        lives <= 0
    ) {

        gameRunning = false;

        setTimeout(
            endGame,
            450
        );

        return;

    }

    /*
        Respawn slightly after
        the failed section.
    */

    obstacles = [];

    player.x = 185;

    player.y =
        getGroundY() -
        player.height;

    player.velocityY = 0;

    player.grounded = true;

    player.sliding = false;

    player.dashing = false;

    updateHUD();
}

/* =========================================================
UPDATE
========================================================= */

function update(delta) {

    gameTime +=
        delta;

    speed =
        difficulties[
            selectedDifficulty
        ].speed;

    /*
        Distance.
    */

    distance +=
        speed *
        delta *
        0.008;

    updatePlayer(
        delta
    );

    updateTerrain(
        delta
    );

    checkCollisions();

    updateParticles(
        delta
    );

    updateBuildings(
        delta
    );

    checkSection();

    if (
        screenShake > 0
    ) {

        screenShake *=
            Math.pow(
                0.85,
                delta / 16
            );

        if (
            screenShake < 0.2
        ) {

            screenShake = 0;

        }

    }

    if (
        dashFlash > 0
    ) {

        dashFlash -=
            delta;

    }

    updateHUD();
}

/* =========================================================
BUILDINGS
========================================================= */

function createBuildings() {

    buildings = [];

    for (
        let i = 0;
        i < 20;
        i++
    ) {

        buildings.push({

            x:
                i *
                110,

            width:
                70 +
                Math.random() * 60,

            height:
                100 +
                Math.random() * 220,

            layer:
                0.3 +
                Math.random() * 0.5

        });

    }
}

function updateBuildings(delta) {

    for (
        const building of buildings
    ) {

        building.x -=
            speed *
            delta *
            0.012 *
            building.layer;

        if (
            building.x <
            -building.width -
            100
        ) {

            building.x =
                width +
                Math.random() *
                200;

            building.height =
                100 +
                Math.random() *
                220;

        }

    }
}

/* =========================================================
CLOUDS
========================================================= */

function createClouds() {

    clouds = [];

    for (
        let i = 0;
        i < 10;
        i++
    ) {

        clouds.push({

            x:
                Math.random() *
                width,

            y:
                70 +
                Math.random() *
                200,

            width:
                100 +
                Math.random() *
                180,

            alpha:
                0.025 +
                Math.random() *
                0.04

        });

    }
}

/* =========================================================
PARTICLES
========================================================= */

function createBurst(
    x,
    y,
    color,
    amount
) {

    for (
        let i = 0;
        i < amount;
        i++
    ) {

        const angle =
            Math.random() *
            Math.PI *
            2;

        const force =
            Math.random() *
            4 +
            1;

        particles.push({

            x: x,

            y: y,

            vx:
                Math.cos(angle) *
                force,

            vy:
                Math.sin(angle) *
                force,

            life: 1,

            size:
                Math.random() *
                3 +
                1,

            color: color

        });

    }
}

function updateParticles(delta) {

    for (
        let i =
            particles.length - 1;
        i >= 0;
        i--
    ) {

        const particle =
            particles[i];

        particle.x +=
            particle.vx *
            delta *
            0.06;

        particle.y +=
            particle.vy *
            delta *
            0.06;

        particle.vy +=
            0.025 *
            delta;

        particle.life -=
            delta *
            0.0022;

        if (
            particle.life <= 0
        ) {

            particles.splice(
                i,
                1
            );

        }

    }
}

/* =========================================================
BACKGROUND
========================================================= */

function drawBackground() {

    const gradient =
        bgCtx.createLinearGradient(
            0,
            0,
            0,
            height
        );

    gradient.addColorStop(
        0,
        "#02040b"
    );

    gradient.addColorStop(
        0.5,
        "#071326"
    );

    gradient.addColorStop(
        1,
        "#02050b"
    );

    bgCtx.fillStyle =
        gradient;

    bgCtx.fillRect(
        0,
        0,
        width,
        height
    );

    /* Moon */

    bgCtx.fillStyle =
        "rgba(80,225,255,0.09)";

    bgCtx.shadowColor =
        "#00eaff";

    bgCtx.shadowBlur = 40;

    bgCtx.beginPath();

    bgCtx.arc(
        width * 0.78,
        height * 0.22,
        65,
        0,
        Math.PI * 2
    );

    bgCtx.fill();

    bgCtx.shadowBlur = 0;

    /* Clouds */

    for (
        const cloud of clouds
    ) {

        bgCtx.fillStyle =
            `rgba(100,180,220,${cloud.alpha})`;

        bgCtx.beginPath();

        bgCtx.ellipse(
            cloud.x,
            cloud.y,
            cloud.width,
            25,
            0,
            0,
            Math.PI * 2
        );

        bgCtx.fill();

    }

    /* Buildings */

    for (
        const building of buildings
    ) {

        const floor =
            getGroundY();

        bgCtx.fillStyle =
            "rgba(3,10,23,0.92)";

        bgCtx.fillRect(
            building.x,
            floor -
            building.height,
            building.width,
            building.height
        );

        /*
            Windows.
        */

        const columns =
            Math.max(
                2,
                Math.floor(
                    building.width /
                    22
                )
            );

        const rows =
            Math.max(
                3,
                Math.floor(
                    building.height /
                    32
                )
            );

        for (
            let col = 0;
            col < columns;
            col++
        ) {

            for (
                let row = 0;
                row < rows;
                row++
            ) {

                if (
                    (
                        col * 7 +
                        row * 11 +
                        Math.floor(
                            building.x
                        )
                    ) % 5 !== 0
                ) {

                    bgCtx.fillStyle =
                        "rgba(50,210,255,0.12)";

                    bgCtx.fillRect(

                        building.x +
                        9 +
                        col * 20,

                        floor -
                        building.height +
                        15 +
                        row * 28,

                        4,
                        7
                    );

                }

            }

        }

    }
}

/* =========================================================
GROUND
========================================================= */

function drawGround() {

    const floor =
        getGroundY();

    /*
        Base ground.
    */

    ctx.fillStyle =
        "#030811";

    ctx.fillRect(
        0,
        floor,
        width,
        height -
        floor
    );

    /*
        Neon horizon line.
    */

    ctx.strokeStyle =
        "rgba(65,230,255,0.7)";

    ctx.shadowColor =
        "#00eaff";

    ctx.shadowBlur = 12;

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(
        0,
        floor
    );

    ctx.lineTo(
        width,
        floor
    );

    ctx.stroke();

    ctx.shadowBlur = 0;

    /*
        Ground perspective lines.
    */

    for (
        let i = 0;
        i < 18;
        i++
    ) {

        const offset =
            (
                i * 120 -
                distance * 3
            ) % 120;

        ctx.strokeStyle =
            "rgba(50,215,255,0.07)";

        ctx.lineWidth = 1;

        ctx.beginPath();

        ctx.moveTo(
            offset,
            floor + 5
        );

        ctx.lineTo(
            offset + 90,
            height
        );

        ctx.stroke();

    }
}

/* =========================================================
TERRAIN
========================================================= */

function drawTerrain() {

    const floor =
        getGroundY();

    for (
        const object of obstacles
    ) {

        if (
            object.type ===
            "barrier"
        ) {

            const x =
                object.x;

            const w =
                object.width;

            const h =
                object.height;

            ctx.save();

            /*
                Main barrier.
            */

            ctx.fillStyle =
                "#071323";

            ctx.strokeStyle =
                "#ff4fc4";

            ctx.shadowColor =
                "#ff4fc4";

            ctx.shadowBlur = 18;

            ctx.lineWidth = 2;

            ctx.beginPath();

            ctx.roundRect(
                x - w / 2,
                floor - h,
                w,
                h,
                5
            );

            ctx.fill();

            ctx.stroke();

            /*
                Warning stripe.
            */

            ctx.fillStyle =
                "#ff4fc4";

            ctx.fillRect(
                x - w / 2 + 5,
                floor - h + 8,
                w - 10,
                4
            );

            ctx.restore();

        }

        if (
            object.type ===
            "gap"
        ) {

            const left =
                object.x -
                object.width / 2;

            const right =
                object.x +
                object.width / 2;

            /*
                Dark opening.
            */

            ctx.fillStyle =
                "#010208";

            ctx.fillRect(
                left,
                floor,
                object.width,
                height -
                floor
            );

            /*
                Glowing edges.
            */

            ctx.strokeStyle =
                "#00eaff";

            ctx.shadowColor =
                "#00eaff";

            ctx.shadowBlur = 12;

            ctx.lineWidth = 2;

            ctx.beginPath();

            ctx.moveTo(
                left,
                floor
            );

            ctx.lineTo(
                left,
                floor + 35
            );

            ctx.moveTo(
                right,
                floor
            );

            ctx.lineTo(
                right,
                floor + 35
            );

            ctx.stroke();

            ctx.shadowBlur = 0;

        }

    }
}

/* =========================================================
PLAYER DRAWING
========================================================= */

function drawPlayer() {

    const x =
        player.x;

    const y =
        player.y;

    /*
        Dash trail.
    */

    if (
        player.dashing
    ) {

        for (
            let i = 0;
            i < 7;
            i++
        ) {

            ctx.save();

            ctx.globalAlpha =
                0.16 -
                i * 0.018;

            ctx.strokeStyle =
                "#70efff";

            ctx.lineWidth =
                5 - i * 0.4;

            ctx.shadowColor =
                "#00eaff";

            ctx.shadowBlur = 18;

            ctx.beginPath();

            ctx.moveTo(
                x - 25 - i * 14,
                y + 30
            );

            ctx.lineTo(
                x - 75 - i * 18,
                y + 30
            );

            ctx.stroke();

            ctx.restore();

        }

    }

    ctx.save();

    ctx.translate(
        x,
        y
    );

    /*
        SLIDE POSE
    */

    if (
        player.sliding &&
        player.grounded
    ) {

        drawSlidingRunner();

        ctx.restore();

        return;

    }

    /*
        JUMP POSE
    */

    if (
        !player.grounded
    ) {

        drawJumpingRunner();

        ctx.restore();

        return;

    }

    /*
        RUNNING POSE
    */

    drawRunningRunner();

    ctx.restore();
}

/* =========================================================
RUNNING RUNNER
========================================================= */

function drawRunningRunner() {

    const phase =
        Math.sin(
            player.runPhase
        );

    const opposite =
        Math.sin(
            player.runPhase +
            Math.PI
        );

    ctx.strokeStyle =
        "#65efff";

    ctx.fillStyle =
        "#05080d";

    ctx.shadowColor =
        "#2de8ff";

    ctx.shadowBlur = 14;

    ctx.lineWidth = 3;

    /*
        Head.
    */

    ctx.beginPath();

    ctx.arc(
        0,
        -57,
        8,
        0,
        Math.PI * 2
    );

    ctx.fill();
    ctx.stroke();

    /*
        Torso.
    */

    ctx.beginPath();

    ctx.moveTo(
        -7,
        -48
    );

    ctx.lineTo(
        7,
        -48
    );

    ctx.lineTo(
        9,
        -17
    );

    ctx.lineTo(
        -8,
        -17
    );

    ctx.closePath();

    ctx.fill();
    ctx.stroke();

    /*
        Back arm.
    */

    ctx.beginPath();

    ctx.moveTo(
        -5,
        -43
    );

    ctx.lineTo(
        -15 - opposite * 8,
        -25
    );

    ctx.lineTo(
        -21 - opposite * 12,
        -10
    );

    ctx.stroke();

    /*
        Front arm.
    */

    ctx.beginPath();

    ctx.moveTo(
        5,
        -43
    );

    ctx.lineTo(
        15 + opposite * 8,
        -25
    );

    ctx.lineTo(
        21 + opposite * 12,
        -10
    );

    ctx.stroke();

    /*
        Back leg.
    */

    ctx.beginPath();

    ctx.moveTo(
        -4,
        -17
    );

    ctx.lineTo(
        -10 - phase * 8,
        6
    );

    ctx.lineTo(
        -19 - phase * 13,
        30
    );

    ctx.stroke();

    /*
        Front leg.
    */

    ctx.beginPath();

    ctx.moveTo(
        4,
        -17
    );

    ctx.lineTo(
        10 + opposite * 8,
        6
    );

    ctx.lineTo(
        19 + opposite * 13,
        30
    );

    ctx.stroke();

    /*
        Small cyan runner accent.
    */

    ctx.strokeStyle =
        "rgba(255,255,255,0.8)";

    ctx.lineWidth = 1;

    ctx.beginPath();

    ctx.moveTo(
        -3,
        -48
    );

    ctx.lineTo(
        4,
        -48
    );

    ctx.stroke();
}

/* =========================================================
JUMPING RUNNER
========================================================= */

function drawJumpingRunner() {

    ctx.strokeStyle =
        "#65efff";

    ctx.fillStyle =
        "#05080d";

    ctx.shadowColor =
        "#2de8ff";

    ctx.shadowBlur = 16;

    ctx.lineWidth = 3;

    /*
        Head.
    */

    ctx.beginPath();

    ctx.arc(
        0,
        -57,
        8,
        0,
        Math.PI * 2
    );

    ctx.fill();
    ctx.stroke();

    /*
        Body leaning forward.
    */

    ctx.beginPath();

    ctx.moveTo(
        -7,
        -48
    );

    ctx.lineTo(
        8,
        -48
    );

    ctx.lineTo(
        12,
        -17
    );

    ctx.lineTo(
        -6,
        -17
    );

    ctx.closePath();

    ctx.fill();
    ctx.stroke();

    /*
        Arms extended for balance.
    */

    ctx.beginPath();

    ctx.moveTo(
        -4,
        -43
    );

    ctx.lineTo(
        -20,
        -26
    );

    ctx.lineTo(
        -31,
        -31
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(
        5,
        -43
    );

    ctx.lineTo(
        19,
        -27
    );

    ctx.lineTo(
        31,
        -22
    );

    ctx.stroke();

    /*
        Legs extended.
    */

    ctx.beginPath();

    ctx.moveTo(
        -4,
        -17
    );

    ctx.lineTo(
        -18,
        2
    );

    ctx.lineTo(
        -29,
        9
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(
        5,
        -17
    );

    ctx.lineTo(
        17,
        2
    );

    ctx.lineTo(
        28,
        -4
    );

    ctx.stroke();
}

/* =========================================================
SLIDING RUNNER
========================================================= */

function drawSlidingRunner() {

    ctx.strokeStyle =
        "#65efff";

    ctx.fillStyle =
        "#05080d";

    ctx.shadowColor =
        "#2de8ff";

    ctx.shadowBlur = 16;

    ctx.lineWidth = 3;

    /*
        Head.
    */

    ctx.beginPath();

    ctx.arc(
        -2,
        -25,
        8,
        0,
        Math.PI * 2
    );

    ctx.fill();
    ctx.stroke();

    /*
        Body horizontal.
    */

    ctx.beginPath();

    ctx.moveTo(
        -8,
        -17
    );

    ctx.lineTo(
        15,
        -10
    );

    ctx.lineTo(
        9,
        3
    );

    ctx.lineTo(
        -15,
        -6
    );

    ctx.closePath();

    ctx.fill();
    ctx.stroke();

    /*
        Rear arm.
    */

    ctx.beginPath();

    ctx.moveTo(
        -4,
        -13
    );

    ctx.lineTo(
        -22,
        -2
    );

    ctx.stroke();

    /*
        Front arm.
    */

    ctx.beginPath();

    ctx.moveTo(
        11,
        -11
    );

    ctx.lineTo(
        30,
        -1
    );

    ctx.stroke();

    /*
        Extended legs.
    */

    ctx.beginPath();

    ctx.moveTo(
        3,
        0
    );

    ctx.lineTo(
        25,
        10
    );

    ctx.lineTo(
        39,
        8
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(
        -3,
        0
    );

    ctx.lineTo(
        13,
        15
    );

    ctx.lineTo(
        29,
        18
    );

    ctx.stroke();

    /*
        Sliding sparks.
    */

    for (
        let i = 0;
        i < 4;
        i++
    ) {

        ctx.globalAlpha =
            0.3 -
            i * 0.06;

        ctx.strokeStyle =
            "#ff5fd1";

        ctx.beginPath();

        ctx.moveTo(
            -15 - i * 8,
            18 + i * 2
        );

        ctx.lineTo(
            -35 - i * 10,
            18 + i * 2
        );

        ctx.stroke();

    }

    ctx.globalAlpha = 1;
}

/* =========================================================
PARTICLES DRAW
========================================================= */

function drawParticles() {

    for (
        const particle of particles
    ) {

        ctx.save();

        ctx.globalAlpha =
            particle.life;

        ctx.fillStyle =
            particle.color;

        ctx.shadowColor =
            particle.color;

        ctx.shadowBlur = 10;

        ctx.beginPath();

        ctx.arc(
            particle.x,
            particle.y,
            particle.size,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();

    }
}

/* =========================================================
DRAW
========================================================= */

function draw() {

    drawBackground();

    ctx.clearRect(
        0,
        0,
        width,
        height
    );

    ctx.save();

    if (
        screenShake > 0
    ) {

        ctx.translate(
            (Math.random() - 0.5) *
            screenShake,

            (Math.random() - 0.5) *
            screenShake
        );

    }

    drawGround();

    drawTerrain();

    drawPlayer();

    drawParticles();

    ctx.restore();

    /*
        Dash overlay.
    */

    if (
        dashFlash > 0
    ) {

        ctx.fillStyle =
            `rgba(70,230,255,${
                Math.min(
                    0.08,
                    dashFlash / 5000
                )
            })`;

        ctx.fillRect(
            0,
            0,
            width,
            height
        );

    }
}

/* =========================================================
HUD
========================================================= */

function updateHUD() {

    distanceEl.textContent =
        Math.floor(distance)
            .toString()
            .padStart(4, "0");

    scoreEl.textContent =
        Math.floor(score)
            .toString()
            .padStart(6, "0");

    bestEl.textContent =
        Math.floor(best)
            .toString()
            .padStart(6, "0");

    let hearts = "";

    for (
        let i = 0;
        i < 3;
        i++
    ) {

        hearts +=
            i < lives
                ? "♥ "
                : "♡ ";

    }

    livesEl.textContent =
        hearts;
}

/* =========================================================
END GAME
========================================================= */

function endGame() {

    gameRunning = false;

    if (
        score > best
    ) {

        best =
            Math.floor(score);

        localStorage.setItem(
            "neonRunnerBest",
            best
        );

    }

    finalDistanceEl.textContent =
        Math.floor(distance)
            .toString()
            .padStart(4, "0");

    finalScoreEl.textContent =
        Math.floor(score)
            .toString()
            .padStart(6, "0");

    finalBestEl.textContent =
        Math.floor(best)
            .toString()
            .padStart(6, "0");

    gameOverScreen.classList.remove(
        "hidden"
    );
}

/* =========================================================
MENU
========================================================= */

function returnToMenu() {

    gameRunning = false;

    countdownActive = false;

    startScreen.classList.remove(
        "hidden"
    );

    gameOverScreen.classList.add(
        "hidden"
    );

    countdownScreen.classList.add(
        "hidden"
    );
}

/* =========================================================
GAME LOOP
========================================================= */

function gameLoop(timestamp) {

    if (
        !gameRunning
    ) {

        draw();

        return;

    }

    let delta =
        timestamp -
        lastTime;

    lastTime =
        timestamp;

    delta =
        Math.min(
            delta,
            40
        );

    update(delta);

    draw();

    requestAnimationFrame(
        gameLoop
    );
}

/* =========================================================
INITIALIZE
========================================================= */
//ovr//
resize();

createBuildings();

createClouds();

bestEl.textContent =
    Math.floor(best)
        .toString()
        .padStart(6, "0");

updateHUD();

draw();