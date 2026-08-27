// Généré par scripts/generate-ships.mjs — NE PAS ÉDITER À LA MAIN.
export default {
  "count": 25,
  "names": [
    "small_cargo",
    "large_cargo",
    "light_fighter",
    "heavy_fighter",
    "cruiser",
    "battleship",
    "bomber",
    "dreadnought",
    "destroyer",
    "death_star",
    "spy_probe",
    "recovery_vessel",
    "colony_ship",
    "rocket_launcher",
    "light_laser",
    "heavy_laser",
    "gauss_cannon",
    "ion_cannon",
    "plasma_turret",
    "small_shield",
    "large_shield",
    "mining_vessel",
    "super_freighter",
    "large_recovery_vessel",
    "missile_chaser"
  ],
  "ships": [
    {
      "id": 0,
      "name": "small_cargo",
      "att": 5,
      "shield": 10,
      "hull": 400,
      "rapidFire": {
        "spy_probe": 5
      },
      "metal": 2000,
      "crystal": 2000,
      "gas": 0
    },
    {
      "id": 1,
      "name": "large_cargo",
      "att": 5,
      "shield": 25,
      "hull": 1200,
      "rapidFire": {
        "spy_probe": 5
      },
      "metal": 6000,
      "crystal": 6000,
      "gas": 0
    },
    {
      "id": 2,
      "name": "light_fighter",
      "att": 50,
      "shield": 10,
      "hull": 400,
      "rapidFire": {
        "spy_probe": 5
      },
      "metal": 3000,
      "crystal": 1000,
      "gas": 0
    },
    {
      "id": 3,
      "name": "heavy_fighter",
      "att": 150,
      "shield": 25,
      "hull": 1000,
      "rapidFire": {
        "small_cargo": 3,
        "spy_probe": 5
      },
      "metal": 6000,
      "crystal": 4000,
      "gas": 0
    },
    {
      "id": 4,
      "name": "cruiser",
      "att": 400,
      "shield": 50,
      "hull": 2700,
      "rapidFire": {
        "light_fighter": 6,
        "spy_probe": 5,
        "rocket_launcher": 10
      },
      "metal": 20000,
      "crystal": 7000,
      "gas": 2000
    },
    {
      "id": 5,
      "name": "battleship",
      "att": 1000,
      "shield": 200,
      "hull": 6000,
      "rapidFire": {
        "spy_probe": 5,
        "rocket_launcher": 2
      },
      "metal": 45000,
      "crystal": 15000,
      "gas": 0
    },
    {
      "id": 6,
      "name": "bomber",
      "att": 1000,
      "shield": 500,
      "hull": 7500,
      "rapidFire": {
        "spy_probe": 5,
        "rocket_launcher": 20,
        "light_laser": 20,
        "heavy_laser": 10,
        "ion_cannon": 10
      },
      "metal": 50000,
      "crystal": 25000,
      "gas": 15000
    },
    {
      "id": 7,
      "name": "dreadnought",
      "att": 700,
      "shield": 400,
      "hull": 7000,
      "rapidFire": {
        "small_cargo": 3,
        "large_cargo": 3,
        "heavy_fighter": 4,
        "cruiser": 4,
        "battleship": 7,
        "spy_probe": 5
      },
      "metal": 30000,
      "crystal": 40000,
      "gas": 15000
    },
    {
      "id": 8,
      "name": "destroyer",
      "att": 2000,
      "shield": 500,
      "hull": 11000,
      "rapidFire": {
        "dreadnought": 2,
        "spy_probe": 5,
        "light_laser": 10
      },
      "metal": 60000,
      "crystal": 50000,
      "gas": 15000
    },
    {
      "id": 9,
      "name": "death_star",
      "att": 200000,
      "shield": 50000,
      "hull": 900000,
      "rapidFire": {
        "small_cargo": 250,
        "large_cargo": 250,
        "light_fighter": 200,
        "heavy_fighter": 100,
        "cruiser": 33,
        "battleship": 30,
        "bomber": 25,
        "dreadnought": 15,
        "destroyer": 5,
        "spy_probe": 1250,
        "recovery_vessel": 250,
        "colony_ship": 250,
        "rocket_launcher": 200,
        "light_laser": 200,
        "heavy_laser": 100,
        "gauss_cannon": 50,
        "ion_cannon": 100
      },
      "metal": 5000000,
      "crystal": 4000000,
      "gas": 1000000
    },
    {
      "id": 10,
      "name": "spy_probe",
      "att": 0,
      "shield": 0,
      "hull": 100,
      "rapidFire": {},
      "metal": 0,
      "crystal": 1000,
      "gas": 0
    },
    {
      "id": 11,
      "name": "recovery_vessel",
      "att": 1,
      "shield": 10,
      "hull": 1600,
      "rapidFire": {},
      "metal": 10000,
      "crystal": 6000,
      "gas": 0
    },
    {
      "id": 12,
      "name": "colony_ship",
      "att": 50,
      "shield": 100,
      "hull": 3000,
      "rapidFire": {
        "spy_probe": 5
      },
      "metal": 10000,
      "crystal": 20000,
      "gas": 10000
    },
    {
      "id": 13,
      "name": "rocket_launcher",
      "att": 80,
      "shield": 20,
      "hull": 200,
      "rapidFire": {},
      "metal": 2000,
      "crystal": 0,
      "gas": 0
    },
    {
      "id": 14,
      "name": "light_laser",
      "att": 100,
      "shield": 25,
      "hull": 200,
      "rapidFire": {},
      "metal": 1500,
      "crystal": 500,
      "gas": 0
    },
    {
      "id": 15,
      "name": "heavy_laser",
      "att": 250,
      "shield": 100,
      "hull": 800,
      "rapidFire": {},
      "metal": 6000,
      "crystal": 2000,
      "gas": 0
    },
    {
      "id": 16,
      "name": "gauss_cannon",
      "att": 1100,
      "shield": 200,
      "hull": 3500,
      "rapidFire": {},
      "metal": 20000,
      "crystal": 15000,
      "gas": 2000
    },
    {
      "id": 17,
      "name": "ion_cannon",
      "att": 150,
      "shield": 500,
      "hull": 800,
      "rapidFire": {},
      "metal": 2000,
      "crystal": 6000,
      "gas": 0
    },
    {
      "id": 18,
      "name": "plasma_turret",
      "att": 3000,
      "shield": 300,
      "hull": 10000,
      "rapidFire": {},
      "metal": 50000,
      "crystal": 50000,
      "gas": 30000
    },
    {
      "id": 19,
      "name": "small_shield",
      "att": 1,
      "shield": 2000,
      "hull": 2000,
      "rapidFire": {},
      "metal": 10000,
      "crystal": 10000,
      "gas": 0
    },
    {
      "id": 20,
      "name": "large_shield",
      "att": 1,
      "shield": 10000,
      "hull": 10000,
      "rapidFire": {},
      "metal": 50000,
      "crystal": 50000,
      "gas": 0
    },
    {
      "id": 21,
      "name": "mining_vessel",
      "att": 25,
      "shield": 50,
      "hull": 1700,
      "rapidFire": {},
      "metal": 10000,
      "crystal": 6000,
      "gas": 0
    },
    {
      "id": 22,
      "name": "super_freighter",
      "att": 40,
      "shield": 110,
      "hull": 4800,
      "rapidFire": {},
      "metal": 24000,
      "crystal": 20000,
      "gas": 0
    },
    {
      "id": 23,
      "name": "large_recovery_vessel",
      "att": 15,
      "shield": 20,
      "hull": 4200,
      "rapidFire": {},
      "metal": 26000,
      "crystal": 14000,
      "gas": 0
    },
    {
      "id": 24,
      "name": "missile_chaser",
      "att": 1900,
      "shield": 1100,
      "hull": 19000,
      "rapidFire": {
        "light_fighter": 10,
        "heavy_fighter": 6,
        "cruiser": 4,
        "battleship": 3,
        "bomber": 2,
        "dreadnought": 2
      },
      "metal": 140000,
      "crystal": 64000,
      "gas": 0
    }
  ]
}
