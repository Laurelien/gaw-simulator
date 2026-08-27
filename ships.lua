ship_data = {
  count = 25,
  info = {
    [0] = { -- small cargo
      Shield = 10,
      att = 5,
      burden = 5000,
      class = 1,
      def = 400,
      flyxh = 20,
      jztime = 2880,
      kz = {
        [0] = {
          [0] = 10,
          [1] = 5
        }
      },
      kz_count = 1,
      res_demand = {
        [0] = 2000,
        [1] = 2000,
        [2] = 0
      },
      speed = 5000
    },
    [1] = { -- large cargo
      Shield = 25,
      att = 5,
      burden = 25000,
      class = 1,
      def = 1200,
      flyxh = 50,
      jztime = 8640,
      kz = {
        [0] = {
          [0] = 10,
          [1] = 5
        }
      },
      kz_count = 1,
      res_demand = {
        [0] = 6000,
        [1] = 6000,
        [2] = 0
      },
      speed = 7500
    },
    [2] = { -- light fighter
      Shield = 10,
      att = 50,
      burden = 10,
      class = 1,
      def = 400,
      flyxh = 20,
      jztime = 2880,
      kz = {
        [0] = {
          [0] = 10,
          [1] = 5
        }
      },
      kz_count = 1,
      res_demand = {
        [0] = 3000,
        [1] = 1000,
        [2] = 0
      },
      speed = 12500
    },
    [3] = { -- heavy fighter
      Shield = 25,
      att = 150,
      burden = 20,
      class = 1,
      def = 1000,
      flyxh = 75,
      jztime = 7200,
      kz = {
        [0] = {
          [0] = 0,
          [1] = 3
        },
        [1] = {
          [0] = 10,
          [1] = 5
        }
      },
      kz_count = 2,
      res_demand = {
        [0] = 6000,
        [1] = 4000,
        [2] = 0
      },
      speed = 10000
    },
    [4] = { -- cruiser
      Shield = 50,
      att = 400,
      burden = 160,
      class = 1,
      def = 2700,
      flyxh = 300,
      jztime = 19440,
      kz = {
        [0] = {
          [0] = 2,
          [1] = 6
        },
        [1] = {
          [0] = 10,
          [1] = 5
        },
        [2] = {
          [0] = 13,
          [1] = 10
        }
      },
      kz_count = 3,
      res_demand = {
        [0] = 20000,
        [1] = 7000,
        [2] = 2000
      },
      speed = 15000
    },
    [5] = { -- battleship
      Shield = 200,
      att = 1000,
      burden = 300,
      class = 1,
      def = 6000,
      flyxh = 500,
      jztime = 43200,
      kz = {
        [0] = {
          [0] = 10,
          [1] = 5
        },
        [1] = {
          [0] = 13,
          [1] = 2
        }
      },
      kz_count = 2,
      res_demand = {
        [0] = 45000,
        [1] = 15000,
        [2] = 0
      },
      speed = 10000
    },
    [6] = { -- bomber
      Shield = 500,
      att = 1000,
      burden = 100,
      class = 1,
      def = 7500,
      flyxh = 1000,
      jztime = 54000,
      kz = {
        [0] = {
          [0] = 10,
          [1] = 5
        },
        [1] = {
          [0] = 13,
          [1] = 20
        },
        [2] = {
          [0] = 14,
          [1] = 20
        },
        [3] = {
          [0] = 15,
          [1] = 10
        },
        [4] = {
          [0] = 17,
          [1] = 10
        }
      },
      kz_count = 5,
      res_demand = {
        [0] = 50000,
        [1] = 25000,
        [2] = 15000
      },
      speed = 4000
    },
    [7] = { -- dreadnought
      Shield = 400,
      att = 700,
      burden = 150,
      class = 1,
      def = 7000,
      flyxh = 250,
      jztime = 50400,
      kz = {
        [0] = {
          [0] = 0,
          [1] = 3
        },
        [1] = {
          [0] = 1,
          [1] = 3
        },
        [2] = {
          [0] = 3,
          [1] = 4
        },
        [3] = {
          [0] = 4,
          [1] = 4
        },
        [4] = {
          [0] = 5,
          [1] = 7
        },
        [5] = {
          [0] = 10,
          [1] = 5
        }
      },
      kz_count = 6,
      res_demand = {
        [0] = 30000,
        [1] = 40000,
        [2] = 15000
      },
      speed = 10000
    },
    [8] = { -- destroyer
      Shield = 500,
      att = 2000,
      burden = 400,
      class = 1,
      def = 11000,
      flyxh = 1000,
      jztime = 79200,
      kz = {
        [0] = {
          [0] = 7,
          [1] = 2
        },
        [1] = {
          [0] = 10,
          [1] = 5
        },
        [2] = {
          [0] = 14,
          [1] = 10
        }
      },
      kz_count = 3,
      res_demand = {
        [0] = 60000,
        [1] = 50000,
        [2] = 15000
      },
      speed = 5000
    },
    [9] = { -- death star
      Shield = 50000,
      att = 200000,
      burden = 10000000,
      class = 1,
      def = 900000,
      flyxh = 1,
      jztime = 6480000,
      kz = {
        [0] = {
          [0] = 0,
          [1] = 250
        },
        [1] = {
          [0] = 1,
          [1] = 250
        },
        [2] = {
          [0] = 2,
          [1] = 200
        },
        [3] = {
          [0] = 3,
          [1] = 100
        },
        [4] = {
          [0] = 4,
          [1] = 33
        },
        [5] = {
          [0] = 5,
          [1] = 30
        },
        [6] = {
          [0] = 6,
          [1] = 25
        },
        [7] = {
          [0] = 7,
          [1] = 15
        },
        [8] = {
          [0] = 8,
          [1] = 5
        },
        [9] = {
          [0] = 10,
          [1] = 1250
        },
        [10] = {
          [0] = 11,
          [1] = 250
        },
        [11] = {
          [0] = 12,
          [1] = 250
        },
        [12] = {
          [0] = 13,
          [1] = 200
        },
        [13] = {
          [0] = 14,
          [1] = 200
        },
        [14] = {
          [0] = 15,
          [1] = 100
        },
        [15] = {
          [0] = 16,
          [1] = 50
        },
        [16] = {
          [0] = 17,
          [1] = 100
        }
      },
      kz_count = 17,
      res_demand = {
        [0] = 5000000,
        [1] = 4000000,
        [2] = 1000000
      },
      speed = 100
    },
    [10] = { -- spy probe
      Shield = 0,
      att = 0,
      burden = 1,
      class = 1,
      def = 100,
      flyxh = 1,
      jztime = 720,
      kz_count = 0,
      res_demand = {
        [0] = 0,
        [1] = 1000,
        [2] = 0
      },
      speed = 100000000
    },
    [11] = { -- recovery vessel
      Shield = 10,
      att = 1,
      burden = 20000,
      class = 1,
      def = 1600,
      flyxh = 300,
      jztime = 11520,
      kz_count = 0,
      res_demand = {
        [0] = 10000,
        [1] = 6000,
        [2] = 0
      },
      speed = 2000
    },
    [12] = { -- colony ship
      Shield = 100,
      att = 50,
      burden = 7500,
      class = 1,
      def = 3000,
      flyxh = 1000,
      jztime = 21600,
      kz = {
        [0] = {
          [0] = 10,
          [1] = 5
        }
      },
      kz_count = 1,
      res_demand = {
        [0] = 10000,
        [1] = 20000,
        [2] = 10000
      },
      speed = 2500
    },
    [13] = { -- rocket launcher
      Shield = 20,
      att = 80,
      burden = 0,
      class = 1,
      def = 200,
      flyxh = 0,
      jztime = 1440,
      kz_count = 0,
      res_demand = {
        [0] = 2000,
        [1] = 0,
        [2] = 0
      },
      speed = 0
    },
    [14] = { -- light laser
      Shield = 25,
      att = 100,
      burden = 0,
      class = 1,
      def = 200,
      flyxh = 0,
      jztime = 1440,
      kz_count = 0,
      res_demand = {
        [0] = 1500,
        [1] = 500,
        [2] = 0
      },
      speed = 0
    },
    [15] = { -- heavy laser
      Shield = 100,
      att = 250,
      burden = 0,
      class = 1,
      def = 800,
      flyxh = 0,
      jztime = 5760,
      kz_count = 0,
      res_demand = {
        [0] = 6000,
        [1] = 2000,
        [2] = 0
      },
      speed = 0
    },
    [16] = { -- gauss canon
      Shield = 200,
      att = 1100,
      burden = 0,
      class = 1,
      def = 3500,
      flyxh = 0,
      jztime = 25200,
      kz_count = 0,
      res_demand = {
        [0] = 20000,
        [1] = 15000,
        [2] = 2000
      },
      speed = 0
    },
    [17] = { -- ion cannon
      Shield = 500,
      att = 150,
      burden = 0,
      class = 1,
      def = 800,
      flyxh = 0,
      jztime = 5760,
      kz_count = 0,
      res_demand = {
        [0] = 2000,
        [1] = 6000,
        [2] = 0
      },
      speed = 0
    },
    [18] = { -- plasma turret
      Shield = 300,
      att = 3000,
      burden = 0,
      class = 1,
      def = 10000,
      flyxh = 0,
      jztime = 72000,
      kz_count = 0,
      res_demand = {
        [0] = 50000,
        [1] = 50000,
        [2] = 30000
      },
      speed = 0
    },
    [19] = { -- small shield
      Shield = 2000,
      att = 1,
      burden = 0,
      class = 1,
      def = 2000,
      flyxh = 0,
      jztime = 14400,
      kz_count = 0,
      res_demand = {
        [0] = 10000,
        [1] = 10000,
        [2] = 0
      },
      speed = 0
    },
    [20] = { -- large shield
      Shield = 10000,
      att = 1,
      burden = 0,
      class = 1,
      def = 10000,
      flyxh = 0,
      jztime = 72000,
      kz_count = 0,
      res_demand = {
        [0] = 50000,
        [1] = 50000,
        [2] = 0
      },
      speed = 0
    },
    [21] = { -- mining vessel
      Shield = 50,
      att = 25,
      burden = 500,
      class = 0,
      def = 1700,
      flyxh = 40,
      jztime = 0,
      kz_count = 0,
      res_demand = {
        [0] = 10000,
        [1] = 6000,
        [2] = 0
      },
      speed = 6000
    },
    [22] = { -- super frieghter
      Shield = 110,
      att = 40,
      burden = 75000,
      class = 0,
      def = 4800,
      flyxh = 100,
      jztime = 0,
      kz_count = 0,
      res_demand = {
        [0] = 24000,
        [1] = 20000,
        [2] = 0
      },
      speed = 16000
    },
    [23] = { -- large recovery vessel
      Shield = 20,
      att = 15,
      burden = 40000,
      class = 0,
      def = 4200,
      flyxh = 80,
      jztime = 0,
      kz_count = 0,
      res_demand = {
        [0] = 26000,
        [1] = 14000,
        [2] = 0
      },
      speed = 5000
    },
    [24] = { -- missile chaser
      Shield = 1100,
      att = 1900,
      burden = 200,
      class = 0,
      def = 19000,
      flyxh = 800,
      jztime = 0,
      kz = {
        [0] = {
          [0] = 2,
          [1] = 10
        },
        [1] = {
          [0] = 3,
          [1] = 6
        },
        [2] = {
          [0] = 4,
          [1] = 4
        },
        [3] = {
          [0] = 5,
          [1] = 3
        },
        [4] = {
          [0] = 6,
          [1] = 2
        },
        [5] = {
          [0] = 7,
          [1] = 2
        }
      },
      kz_count = 6,
      res_demand = {
        [0] = 140000,
        [1] = 64000,
        [2] = 0
      },
      speed = 5500
    }
  }
}
