-- ============================================================================
-- zhanSimulation.lua
-- Simulateur de combat GAW autonome (sans require)
-- Extrait de : ZhanDouLiuCheng (ZJFighterSimulator_decompiled.lua:1320-1737)
--             + ship_data (GameShipInfo_decompiled.lua)
-- Usage  : lua zhanSimulation.lua
-- ============================================================================

-- ============================================================================
-- SHIP DATA (25 vaisseaux, uniquement les champs de combat)
-- ============================================================================
ship_data = {
  count = 25,
  info = {
    -- 0: Small Cargo
    [0]  = { att = 5,     Shield = 10,    def = 400,   kz = {{10, 5}},                         kz_count = 1  },
    -- 1: Large Cargo
    [1]  = { att = 5,     Shield = 25,    def = 1200,  kz = {{10, 5}},                         kz_count = 1  },
    -- 2: Light Fighter
    [2]  = { att = 50,    Shield = 10,    def = 400,   kz = {{10, 5}},                         kz_count = 1  },
    -- 3: Heavy Fighter
    [3]  = { att = 150,   Shield = 25,    def = 1000,  kz = {{0, 3}, {10, 5}},                 kz_count = 2  },
    -- 4: Cruiser
    [4]  = { att = 400,   Shield = 50,    def = 2700,  kz = {{2, 6}, {10, 5}, {13, 10}},       kz_count = 3  },
    -- 5: Battleship
    [5]  = { att = 1000,  Shield = 200,   def = 6000,  kz = {{10, 5}, {13, 2}},                kz_count = 2  },
    -- 6: Bomber
    [6]  = { att = 1000,  Shield = 500,   def = 7500,  kz = {{10, 5}, {13, 20}, {14, 20}, {15, 10}, {17, 10}}, kz_count = 5 },
    -- 7: Dreadnought
    [7]  = { att = 700,   Shield = 400,   def = 7000,  kz = {{0, 3}, {1, 3}, {3, 4}, {4, 4}, {5, 7}, {10, 5}}, kz_count = 6 },
    -- 8: Destroyer
    [8]  = { att = 2000,  Shield = 500,   def = 11000, kz = {{7, 2}, {10, 5}, {14, 10}},       kz_count = 3  },
    -- 9: Death Star
    [9]  = { att = 200000,Shield = 50000, def = 900000,kz = {{0,250},{1,250},{2,200},{3,100},{4,33},{5,30},{6,25},{7,15},{8,5},{10,1250},{11,250},{12,250},{13,200},{14,200},{15,100},{16,50},{17,100}}, kz_count = 17 },
    -- 10: Spy Probe
    [10] = { att = 0,     Shield = 0,     def = 100,   kz = {},                                kz_count = 0  },
    -- 11: Recovery Vessel
    [11] = { att = 1,     Shield = 10,    def = 1600,  kz = {},                                kz_count = 0  },
    -- 12: Colony Ship
    [12] = { att = 50,    Shield = 100,   def = 3000,  kz = {{10, 5}},                         kz_count = 1  },
    -- 13: Rocket Launcher
    [13] = { att = 80,    Shield = 20,    def = 200,   kz = {},                                kz_count = 0  },
    -- 14: Light Laser
    [14] = { att = 100,   Shield = 25,    def = 200,   kz = {},                                kz_count = 0  },
    -- 15: Heavy Laser
    [15] = { att = 250,   Shield = 100,   def = 800,   kz = {},                                kz_count = 0  },
    -- 16: Gauss Cannon
    [16] = { att = 1100,  Shield = 200,   def = 3500,  kz = {},                                kz_count = 0  },
    -- 17: Ion Cannon
    [17] = { att = 150,   Shield = 500,   def = 800,   kz = {},                                kz_count = 0  },
    -- 18: Plasma Turret
    [18] = { att = 3000,  Shield = 300,   def = 10000, kz = {},                                kz_count = 0  },
    -- 19: Small Shield Dome
    [19] = { att = 1,     Shield = 2000,  def = 2000,  kz = {},                                kz_count = 0  },
    -- 20: Large Shield Dome
    [20] = { att = 1,     Shield = 10000, def = 10000, kz = {},                                kz_count = 0  },
    -- 21: (classe 0, non nomme en anglais)
    [21] = { att = 25,    Shield = 50,    def = 1700,  kz = {},                                kz_count = 0  },
    -- 22: Super Freighter
    [22] = { att = 40,    Shield = 110,   def = 4800,  kz = {},                                kz_count = 0  },
    -- 23: Large Recovery Vessel
    [23] = { att = 15,    Shield = 20,    def = 4200,  kz = {},                                kz_count = 0  },
    -- 24: Missile Chaser
    [24] = { att = 1900,  Shield = 1100,  def = 19000, kz = {{2,10},{3,6},{4,4},{5,3},{6,2},{7,2}}, kz_count = 6 },
  }
}

-- ============================================================================
-- UTILS
-- ============================================================================

-- Deep copy d'une table (equivalent de th_table_dup)
function th_table_dup(ori_tab)
  if type(ori_tab) ~= "table" then
    return nil
  end
  local new_tab = {}
  for i, v in pairs(ori_tab) do
    local vtyp = type(v)
    if vtyp == "table" then
      new_tab[i] = th_table_dup(v)
    elseif vtyp == "thread" then
      new_tab[i] = v
    elseif vtyp == "userdata" then
      new_tab[i] = v
    else
      new_tab[i] = v
    end
  end
  return new_tab
end

-- ============================================================================
-- SIMULATION DE COMBAT : ZhanDouLiuCheng
-- ============================================================================

--[[
  Simule un combat complet (6 rounds max).

  Parametres :
    aAtkShip  : table[1..25] = nombre de vaisseaux attaquant par type (index Lua 1-25)
    aDefShip  : table[1..25] = nombre de vaisseaux defenseur par type
    aAtkSkill : table[1..3] = technologies attaquant {weapon, shield, armor}
    aDefSkill : table[1..3] = technologies defenseur {weapon, shield, armor}

  Retourne :
    tWin      : table[1..3] = {att_win, def_win, draw} (1 = true)
    tAtkShip  : table[1..25] = vaisseaux attaquant survivants
    tDefShip  : table[1..25] = vaisseaux defenseur survivants
--]]
function ZhanDouLiuCheng(aAtkShip, aDefShip, aAtkSkill, aDefSkill)
  local tAtkShip = th_table_dup(aAtkShip)
  local tDefShip = th_table_dup(aDefShip)
  local tAtkSkill = {
    aAtkSkill[1],
    aAtkSkill[2],
    aAtkSkill[3]
  }
  local tDefSkill = {
    aDefSkill[1],
    aDefSkill[2],
    aDefSkill[3]
  }
  local tAtkShipLen = #aAtkShip
  local tDefShipLen = #aDefShip
  local tAtkShipData = {}
  local tDefShipData = {}
  local tAtkAliveShipData = {}
  local tDefAliveShipData = {}

  -- Initialisation des groupes de vaisseaux
  for i = 1, ship_data.count do
    if 0 < tAtkShip[i] then
      local tData = {
        mId = i,
        mIsDead = false,
        mDeadCount = 0,
        mDeadIndex = 1,
        mCount = tAtkShip[i],
        mAtk = ship_data.info[i - 1].att * (1 + tAtkSkill[1] * 0.1),
        mShield = ship_data.info[i - 1].Shield * (1 + tAtkSkill[2] * 0.1),
        mDef = ship_data.info[i - 1].def * (1 + tAtkSkill[3] * 0.1)
      }
      tData.mData = {}
      for n = 1, tData.mCount do
        tData.mData[n] = {
          mShield = tData.mShield,
          mDef = tData.mDef
        }
      end
      table.insert(tAtkShipData, tData)
    end
    if 0 < tDefShip[i] then
      local tData = {
        mId = i,
        mIsDead = false,
        mDeadCount = 0,
        mDeadIndex = 1,
        mCount = tDefShip[i],
        mAtk = ship_data.info[i - 1].att * (1 + tDefSkill[1] * 0.1),
        mShield = ship_data.info[i - 1].Shield * (1 + tDefSkill[2] * 0.1),
        mDef = ship_data.info[i - 1].def * (1 + tDefSkill[3] * 0.1)
      }
      tData.mData = {}
      for n = 1, tData.mCount do
        tData.mData[n] = {
          mShield = tData.mShield,
          mDef = tData.mDef
        }
      end
      table.insert(tDefShipData, tData)
    end
  end

  local tAtkTurnOver = false
  local tDefTurnOver = false

  -- 6 rounds de combat
  for i = 1, 6 do
    -- Regeneration des boucliers + liste des groupes vivants
    tAtkAliveShipData = {}
    tDefAliveShipData = {}
    for k1, v1 in ipairs(tAtkShipData) do
      if not v1.mIsDead then
        for k11, v11 in ipairs(v1.mData) do
          tAtkShipData[k1].mData[k11].mShield = v1.mShield
          tAtkShipData[k1].mData[k11].mDef = v1.mDef
        end
        table.insert(tAtkAliveShipData, k1)
      end
    end
    for k2, v2 in ipairs(tDefShipData) do
      if not v2.mIsDead then
        for k21, v21 in ipairs(v2.mData) do
          tDefShipData[k2].mData[k21].mShield = v2.mShield
          tDefShipData[k2].mData[k21].mDef = v2.mDef
        end
        table.insert(tDefAliveShipData, k2)
      end
    end

    local tAtkAliveLen = #tAtkAliveShipData
    local tDefAliveLen = #tDefAliveShipData
    local tTarget = 0

    -- Verification: un camp est-il deja mort ?
    if tAtkAliveLen <= 0 or tDefAliveLen <= 0 then
      if tAtkAliveLen <= 0 then
        tDefTurnOver = true
      end
      if tDefAliveLen <= 0 then
        tAtkTurnOver = true
      end
      break
    else
      -- ================================================================
      -- PHASE 1 : ATTAQUANT TIRE
      -- ================================================================
      for tk, tv in ipairs(tAtkShipData) do
        local tk_i = 1
        local tk_atk = tv.mAtk
        while tk_i <= tv.mCount do
          tTarget = math.floor(math.random(tDefAliveLen))
          local tAtk = tk_atk
          local tHitCount = math.floor(tAtk / (tDefShipData[tTarget].mShield + tDefShipData[tTarget].mDef))
          local tHitMod = tAtk % (tDefShipData[tTarget].mShield + tDefShipData[tTarget].mDef)
          local tIndex = tDefShipData[tTarget].mDeadIndex
          local tIsLive = true

          -- Kill total du groupe defenseur ?
          if tHitCount + tDefShipData[tTarget].mDeadIndex > tDefShipData[tTarget].mCount then
            tDefShipData[tTarget].mIsDead = true
            tDefShipData[tTarget].mDeadCount = tDefShipData[tTarget].mCount
            tDefShipData[tTarget].mDeadIndex = tDefShipData[tTarget].mCount
            table.remove(tDefAliveShipData, tTarget)
            tDefAliveLen = #tDefAliveShipData
            if 0 < tDefAliveLen then
              -- Rapid fire
              for j = 1, ship_data.info[tv.mId].kz_count do
                if ship_data.info[tv.mId].kz[j][1] == tDefShipData[tTarget].mId then
                  local tR = math.random()
                  if tR < 1 - 1 / ship_data.info[tv.mId].kz[j][2] then
                    tTarget = math.floor(math.random(tDefAliveLen))
                    tk_atk = tv.mAtk
                  end
                end
              end
            else
              tAtkTurnOver = true
            end
            tIsLive = false
          end

          -- Explosion (70% seuil)
          if tIsLive and tHitCount >= (tDefShipData[tTarget].mCount - tDefShipData[tTarget].mDeadCount) * 70 / 100 then
            local tDead = math.random()
            local tGL = (tDefShipData[tTarget].mShield + tDefShipData[tTarget].mDef) * (tDefShipData[tTarget].mCount - tDefShipData[tTarget].mDeadCount - tHitCount) / ((tDefShipData[tTarget].mShield + tDefShipData[tTarget].mDef) * tDefShipData[tTarget].mCount)
            if tDead <= tGL then
              tDefShipData[tTarget].mIsDead = true
              tDefShipData[tTarget].mDeadCount = tDefShipData[tTarget].mCount
              tDefShipData[tTarget].mDeadIndex = tDefShipData[tTarget].mCount
              table.remove(tDefAliveShipData, tTarget)
              if 0 < tDefAliveLen then
                for j = 1, ship_data.info[tv.mId].kz_count do
                  if ship_data.info[tv.mId].kz[j][1] == tDefShipData[tTarget].mId then
                    local tR = math.random()
                    if tR < 1 - 1 / ship_data.info[tv.mId].kz[j][2] then
                      tTarget = math.floor(math.random(tDefAliveLen))
                      tk_atk = tv.mAtk
                    end
                  end
                end
              else
                tAtkTurnOver = true
              end
              tIsLive = false
            end
          end

          -- Application des degats normaux
          if tIsLive then
            if tDefShipData[tTarget].mData[tIndex].mShield == tDefShipData[tTarget].mShield then
              -- Bouclier intact
              tIndex = tIndex + tHitCount
              if tIndex > tDefShipData[tTarget].mCount then
                tDefShipData[tTarget].mDeadCount = tDefShipData[tTarget].mCount
                tDefShipData[tTarget].mDeadIndex = tDefShipData[tTarget].mCount
                tDefShipData[tTarget].mIsDead = true
                tAtkTurnOver = true
              elseif tHitMod > tDefShipData[tTarget].mData[tIndex].mShield then
                tAtk = tHitMod - tDefShipData[tTarget].mData[tIndex].mShield
                tDefShipData[tTarget].mData[tIndex].mShield = 0
                if tAtk < tDefShipData[tTarget].mData[tIndex].mDef then
                  tDefShipData[tTarget].mData[tIndex].mDef = tDefShipData[tTarget].mData[tIndex].mDef - tAtk
                  tk_i = tk_i + 1
                  tDefShipData[tTarget].mDeadCount = tDefShipData[tTarget].mDeadCount + tHitCount
                  tDefShipData[tTarget].mDeadIndex = tDefShipData[tTarget].mDeadIndex + tHitCount
                else
                  tk_atk = tAtk - tDefShipData[tTarget].mData[tIndex].mDef
                  tDefShipData[tTarget].mData[tIndex].mDef = 0
                  tIndex = tIndex + 1
                  if tIndex > tDefShipData[tTarget].mCount then
                    tDefShipData[tTarget].mDeadCount = tDefShipData[tTarget].mCount
                    tDefShipData[tTarget].mDeadIndex = tDefShipData[tTarget].mCount
                    tDefShipData[tTarget].mIsDead = true
                    tAtkTurnOver = true
                  end
                end
              else
                tk_i = tk_i + 1
                tDefShipData[tTarget].mData[tIndex].mShield = math.floor(math.floor(tAtk * 100 / tDefShipData[tTarget].mShield) * tDefShipData[tTarget].mShield / 100) - tDefShipData[tTarget].mShield
                tDefShipData[tTarget].mDeadCount = tDefShipData[tTarget].mDeadCount + tHitCount
                tDefShipData[tTarget].mDeadIndex = tDefShipData[tTarget].mDeadIndex + tHitCount
              end
            else
              -- Bouclier deja partiellement endommage
              local tThp = tDefShipData[tTarget].mData[tIndex].mShield + tDefShipData[tTarget].mData[tIndex].mDef
              if tAtk > tDefShipData[tTarget].mData[tIndex].mShield then
                tDefShipData[tTarget].mData[tIndex].mShield = 0
                tAtk = tAtk - tDefShipData[tTarget].mData[tIndex].mShield
                if tAtk > tDefShipData[tTarget].mData[tIndex].mDef then
                  tDefShipData[tTarget].mData[tIndex].mDef = 0
                  tAtk = tAtk - tDefShipData[tTarget].mData[tIndex].mDef
                  tIndex = tIndex + 1
                  tHitCount = math.floor(tAtk / (tDefShipData[tTarget].mShield + tDefShipData[tTarget].mDef))
                  tHitMod = tAtk % (tDefShipData[tTarget].mShield + tDefShipData[tTarget].mDef)
                  if tIndex > tDefShipData[tTarget].mCount then
                    tDefShipData[tTarget].mDeadCount = tDefShipData[tTarget].mCount
                    tDefShipData[tTarget].mDeadIndex = tDefShipData[tTarget].mCount
                    tDefShipData[tTarget].mIsDead = true
                    tAtkTurnOver = true
                  elseif tHitMod > tDefShipData[tTarget].mData[tIndex].mShield then
                    tAtk = tHitMod - tDefShipData[tTarget].mShield
                    tDefShipData[tTarget].mData[tIndex].mShield = 0
                    tDefShipData[tTarget].mData[tIndex].mDef = tDefShipData[tTarget].mShield - tAtk
                    if tAtk < tDefShipData[tTarget].mData[tIndex].mDef then
                      tDefShipData[tTarget].mData[tIndex].mDef = tDefShipData[tTarget].mData[tIndex].mDef - tAtk
                      tk_i = tk_i + 1
                      tDefShipData[tTarget].mDeadCount = tDefShipData[tTarget].mDeadCount + tHitCount + 1
                      tDefShipData[tTarget].mDeadIndex = tIndex + tHitCount
                    else
                      tk_atk = tAtk - tDefShipData[tTarget].mData[tIndex].mDef
                      tDefShipData[tTarget].mData[tIndex].mDef = 0
                      tIndex = tIndex + 1
                      if tIndex > tDefShipData[tTarget].mCount then
                        tDefShipData[tTarget].mDeadCount = tDefShipData[tTarget].mCount
                        tDefShipData[tTarget].mDeadIndex = tDefShipData[tTarget].mCount
                        tDefShipData[tTarget].mIsDead = true
                        tAtkTurnOver = true
                      end
                    end
                  else
                    tDefShipData[tTarget].mData[tIndex].mShield = math.floor(math.floor(tAtk * 100 / tDefShipData[tTarget].mShield) * tDefShipData[tTarget].mShield / 100) - tDefShipData[tTarget].mShield
                    tk_i = tk_i + 1
                    tDefShipData[tTarget].mDeadCount = tDefShipData[tTarget].mDeadCount + tHitCount + 1
                    tDefShipData[tTarget].mDeadIndex = tIndex + tHitCount
                  end
                else
                  tDefShipData[tTarget].mData[tIndex].mDef = tDefShipData[tTarget].mData[tIndex].mDef - tAtk
                  tDefShipData[tTarget].mDeadCount = tDefShipData[tTarget].mDeadCount
                  tDefShipData[tTarget].mDeadIndex = tIndex
                  tk_i = tk_i + 1
                end
              else
                tDefShipData[tTarget].mData[tIndex].mShield = math.floor(math.floor(tAtk * 100 / tDefShipData[tTarget].mShield) * tDefShipData[tTarget].mShield / 100) - tDefShipData[tTarget].mShield
                tk_i = tk_i + 1
              end
            end
          end
          if tAtkTurnOver then
            break
          end
        end
        if tAtkTurnOver then
          break
        end
      end

      -- ================================================================
      -- PHASE 2 : DEFENSEUR TIRE
      -- ================================================================
      for tk, tv in ipairs(tDefShipData) do
        local tk_i = 1
        local tk_atk = tv.mAtk
        while tk_i <= tv.mCount do
          tTarget = math.floor(math.random(tAtkAliveLen))
          local tAtk = tk_atk
          local tHitCount = math.floor(tAtk / (tAtkShipData[tTarget].mShield + tAtkShipData[tTarget].mDef))
          local tHitMod = tAtk % (tAtkShipData[tTarget].mShield + tAtkShipData[tTarget].mDef)
          local tIndex = tAtkShipData[tTarget].mDeadIndex
          local tIsLive = true

          if tHitCount + tAtkShipData[tTarget].mDeadIndex > tAtkShipData[tTarget].mCount then
            tAtkShipData[tTarget].mIsDead = true
            tAtkShipData[tTarget].mDeadCount = tAtkShipData[tTarget].mCount
            tAtkShipData[tTarget].mDeadIndex = tAtkShipData[tTarget].mCount
            table.remove(tAtkAliveShipData, tTarget)
            tAtkAliveLen = #tAtkAliveShipData
            if 0 < tAtkAliveLen then
              for j = 1, ship_data.info[tv.mId].kz_count do
                if ship_data.info[tv.mId].kz[j][1] == tAtkShipData[tTarget].mId then
                  local tR = math.random()
                  if tR < 1 - 1 / ship_data.info[tv.mId].kz[j][2] then
                    tTarget = math.floor(math.random(tAtkAliveLen))
                    tk_atk = tv.mAtk
                  end
                end
              end
            else
              tDefTurnOver = true
            end
            tIsLive = false
          end

          if tIsLive and tHitCount >= (tAtkShipData[tTarget].mCount - tAtkShipData[tTarget].mDeadCount) * 70 / 100 then
            local tDead = math.random()
            local tGL = (tAtkShipData[tTarget].mShield + tAtkShipData[tTarget].mDef) * (tAtkShipData[tTarget].mCount - tAtkShipData[tTarget].mDeadCount - tHitCount) / ((tAtkShipData[tTarget].mShield + tAtkShipData[tTarget].mDef) * tAtkShipData[tTarget].mCount)
            if tDead <= tGL then
              tAtkShipData[tTarget].mIsDead = true
              tAtkShipData[tTarget].mDeadCount = tAtkShipData[tTarget].mCount
              tAtkShipData[tTarget].mDeadIndex = tAtkShipData[tTarget].mCount
              table.remove(tAtkAliveShipData, tTarget)
              if 0 < tAtkAliveLen then
                for j = 1, ship_data.info[tv.mId].kz_count do
                  if ship_data.info[tv.mId].kz[j][1] == tAtkShipData[tTarget].mId then
                    local tR = math.random()
                    if tR < 1 - 1 / ship_data.info[tv.mId].kz[j][2] then
                      tTarget = math.floor(math.random(tAtkAliveLen))
                      tk_atk = tv.mAtk
                    end
                  end
                end
              else
                tDefTurnOver = true
              end
              tIsLive = false
            end
          end

          if tIsLive then
            if tAtkShipData[tTarget].mData[tIndex].mShield == tAtkShipData[tTarget].mShield then
              tIndex = tIndex + tHitCount
              if tIndex > tAtkShipData[tTarget].mCount then
                tAtkShipData[tTarget].mDeadCount = tAtkShipData[tTarget].mCount
                tAtkShipData[tTarget].mDeadIndex = tAtkShipData[tTarget].mCount
                tAtkShipData[tTarget].mIsDead = true
                tDefTurnOver = true
              elseif tHitMod > tAtkShipData[tTarget].mData[tIndex].mShield then
                tAtk = tHitMod - tAtkShipData[tTarget].mData[tIndex].mShield
                tAtkShipData[tTarget].mData[tIndex].mShield = 0
                if tAtk < tAtkShipData[tTarget].mData[tIndex].mDef then
                  tAtkShipData[tTarget].mData[tIndex].mDef = tAtkShipData[tTarget].mData[tIndex].mDef - tAtk
                  tk_i = tk_i + 1
                  tAtkShipData[tTarget].mDeadCount = tAtkShipData[tTarget].mDeadCount + tHitCount
                  tAtkShipData[tTarget].mDeadIndex = tAtkShipData[tTarget].mDeadIndex + tHitCount
                else
                  tk_atk = tAtk - tAtkShipData[tTarget].mData[tIndex].mDef
                  tAtkShipData[tTarget].mData[tIndex].mDef = 0
                  tIndex = tIndex + 1
                  if tIndex > tAtkShipData[tTarget].mCount then
                    tAtkShipData[tTarget].mDeadCount = tAtkShipData[tTarget].mCount
                    tAtkShipData[tTarget].mDeadIndex = tAtkShipData[tTarget].mCount
                    tAtkShipData[tTarget].mIsDead = true
                    tDefTurnOver = true
                  end
                end
              else
                tk_i = tk_i + 1
                tAtkShipData[tTarget].mData[tIndex].mShield = math.floor(math.floor(tAtk * 100 / tAtkShipData[tTarget].mShield) * tAtkShipData[tTarget].mShield / 100) - tAtkShipData[tTarget].mShield
                tAtkShipData[tTarget].mDeadCount = tAtkShipData[tTarget].mDeadCount + tHitCount
                tAtkShipData[tTarget].mDeadIndex = tAtkShipData[tTarget].mDeadIndex + tHitCount
              end
            else
              local tThp = tAtkShipData[tTarget].mData[tIndex].mShield + tAtkShipData[tTarget].mData[tIndex].mDef
              if tAtk > tAtkShipData[tTarget].mData[tIndex].mShield then
                tAtkShipData[tTarget].mData[tIndex].mShield = 0
                tAtk = tAtk - tAtkShipData[tTarget].mData[tIndex].mShield
                if tAtk > tAtkShipData[tTarget].mData[tIndex].mDef then
                  tAtkShipData[tTarget].mData[tIndex].mDef = 0
                  tAtk = tAtk - tAtkShipData[tTarget].mData[tIndex].mDef
                  tIndex = tIndex + 1
                  tHitCount = math.floor(tAtk / (tAtkShipData[tTarget].mShield + tAtkShipData[tTarget].mDef))
                  tHitMod = tAtk % (tAtkShipData[tTarget].mShield + tAtkShipData[tTarget].mDef)
                  if tIndex > tAtkShipData[tTarget].mCount then
                    tAtkShipData[tTarget].mDeadCount = tAtkShipData[tTarget].mCount
                    tAtkShipData[tTarget].mDeadIndex = tAtkShipData[tTarget].mCount
                    tAtkShipData[tTarget].mIsDead = true
                    tDefTurnOver = true
                  elseif tHitMod > tAtkShipData[tTarget].mData[tIndex].mShield then
                    tAtk = tHitMod - tAtkShipData[tTarget].mShield
                    tAtkShipData[tTarget].mData[tIndex].mShield = 0
                    tAtkShipData[tTarget].mData[tIndex].mDef = tAtkShipData[tTarget].mShield - tAtk
                    if tAtk < tAtkShipData[tTarget].mData[tIndex].mDef then
                      tAtkShipData[tTarget].mData[tIndex].mDef = tAtkShipData[tTarget].mData[tIndex].mDef - tAtk
                      tk_i = tk_i + 1
                      tAtkShipData[tTarget].mDeadCount = tAtkShipData[tTarget].mDeadCount + tHitCount + 1
                      tAtkShipData[tTarget].mDeadIndex = tIndex + tHitCount
                    else
                      tk_atk = tAtk - tAtkShipData[tTarget].mData[tIndex].mDef
                      tAtkShipData[tTarget].mData[tIndex].mDef = 0
                      tIndex = tIndex + 1
                      if tIndex > tAtkShipData[tTarget].mCount then
                        tAtkShipData[tTarget].mDeadCount = tAtkShipData[tTarget].mCount
                        tAtkShipData[tTarget].mDeadIndex = tAtkShipData[tTarget].mCount
                        tAtkShipData[tTarget].mIsDead = true
                        tDefTurnOver = true
                      end
                    end
                  else
                    tAtkShipData[tTarget].mData[tIndex].mShield = math.floor(math.floor(tAtk * 100 / tAtkShipData[tTarget].mShield) * tAtkShipData[tTarget].mShield / 100) - tAtkShipData[tTarget].mShield
                    tk_i = tk_i + 1
                    tAtkShipData[tTarget].mDeadCount = tAtkShipData[tTarget].mDeadCount + tHitCount + 1
                    tAtkShipData[tTarget].mDeadIndex = tIndex + tHitCount
                  end
                else
                  tAtkShipData[tTarget].mData[tIndex].mDef = tAtkShipData[tTarget].mData[tIndex].mDef - tAtk
                  tAtkShipData[tTarget].mDeadCount = tAtkShipData[tTarget].mDeadCount
                  tAtkShipData[tTarget].mDeadIndex = tIndex
                  tk_i = tk_i + 1
                end
              else
                tAtkShipData[tTarget].mData[tIndex].mShield = math.floor(math.floor(tAtk * 100 / tAtkShipData[tTarget].mShield) * tAtkShipData[tTarget].mShield / 100) - tAtkShipData[tTarget].mShield
                tk_i = tk_i + 1
              end
            end
          end
          if tDefTurnOver then
            break
          end
        end
        if tDefTurnOver then
          break
        end
      end
    end
  end

  -- Determination du vainqueur
  tAtkAliveLen = #tAtkAliveShipData
  tDefAliveLen = #tDefAliveShipData
  local tWin = { 0, 0, 0 }
  if 0 >= tAtkAliveLen then
    tWin[3] = 1   -- defenseur gagne
  elseif 0 < tDefAliveLen then
    tWin[2] = 1   -- egalite (round max atteint)
  else
    tWin[1] = 1   -- attaquant gagne
  end

  -- Vaisseaux survivants
  for k1, v1 in ipairs(tAtkShipData) do
    tAtkShip[v1.mId] = v1.mIsDead and 0 or v1.mCount - v1.mDeadCount
  end
  for k2, v2 in ipairs(tDefShipData) do
    tDefShip[v2.mId] = v2.mIsDead and 0 or v2.mCount - v2.mDeadCount
  end
  return tWin, tAtkShip, tDefShip
end

-- ============================================================================
-- TEST / DEMO
-- ============================================================================

-- Initialisation seed aleatoire
math.randomseed(os.time())

-- Noms des vaisseaux pour affichage
local SHIP_NAMES = {
  "Small Cargo", "Large Cargo", "Light Fighter", "Heavy Fighter", "Cruiser",
  "Battleship", "Bomber", "Dreadnought", "Destroyer", "Death Star",
  "Spy Probe", "Recovery Vessel", "Colony Ship", "Rocket Launcher", "Light Laser",
  "Heavy Laser", "Gauss Cannon", "Ion Cannon", "Plasma Turret", "Small Shield Dome",
  "Large Shield Dome", "Ship 21", "Super Freighter", "Large Recov. Vessel", "Missile Chaser"
}

print("========================================")
print("  GAW Battle Simulator - ZhanDouLiuCheng")
print("========================================\n")

-- Test 1 : 1000 Light Fighters vs 200 Battleships
print("--- Test 1: 1000 LF vs 200 BS ---")
local atk1, def1 = {}, {}
for i = 1, 25 do atk1[i] = 0; def1[i] = 0 end
atk1[3] = 1000   -- LF = index 3 (ship id 2 + 1)
def1[6] = 200    -- BS = index 6 (ship id 5 + 1)

local tWin, tAtk, tDef = ZhanDouLiuCheng(atk1, def1, {0,0,0}, {0,0,0})
print(string.format("Resultat: Atk=%d Def=%d Draw=%d", tWin[1], tWin[3], tWin[2]))
for i = 1, 25 do
  if atk1[i] > 0 then print(string.format("  %s: %d", SHIP_NAMES[i], tAtk[i])) end
end
for i = 1, 25 do
  if def1[i] > 0 then print(string.format("  %s: %d", SHIP_NAMES[i], tDef[i])) end
end

-- Test 2 : Monte Carlo 10 simulations
print("\n--- Test 2: Monte Carlo x10 ---")
local wins, losses, draws = 0, 0, 0
local atkSum, defSum = {}, {}
for i = 1, 25 do atkSum[i] = 0; defSum[i] = 0 end

local start = os.clock()
for n = 1, 10 do
  local w, a, d = ZhanDouLiuCheng(atk1, def1, {0,0,0}, {0,0,0})
  if w[1] == 1 then wins = wins + 1
  elseif w[3] == 1 then losses = losses + 1
  else draws = draws + 1 end
  for i = 1, 25 do atkSum[i] = atkSum[i] + a[i]; defSum[i] = defSum[i] + d[i] end
end
local elapsed = os.clock() - start

print(string.format("Wins: %d | Losses: %d | Draws: %d | Temps: %.3fs (%.1fms/sim)",
  wins, losses, draws, elapsed, elapsed / 10 * 1000))
print("Moy. Attaquant restant:")
for i = 1, 25 do if atk1[i] > 0 then print(string.format("  %s: %d", SHIP_NAMES[i], math.floor(atkSum[i]/10))) end end
print("Moy. Defenseur restant:")
for i = 1, 25 do if def1[i] > 0 then print(string.format("  %s: %d", SHIP_NAMES[i], math.floor(defSum[i]/10))) end end

-- Test 3 : Death Star vs swarm
print("\n--- Test 3: 1 Death Star vs 2000 Light Fighters ---")
local atk3, def3 = {}, {}
for i = 1, 25 do atk3[i] = 0; def3[i] = 0 end
atk3[10] = 1     -- DS = index 10
def3[3] = 2000   -- LF = index 3

local w3, a3, d3 = ZhanDouLiuCheng(atk3, def3, {10,10,10}, {0,0,0})
print(string.format("Resultat: Atk=%d Def=%d Draw=%d", w3[1], w3[3], w3[2]))
for i = 1, 25 do if atk3[i] > 0 or a3[i] > 0 then print(string.format("  %s: %d -> %d", SHIP_NAMES[i], atk3[i], a3[i])) end end
for i = 1, 25 do if def3[i] > 0 or d3[i] > 0 then print(string.format("  %s: %d -> %d", SHIP_NAMES[i], def3[i], d3[i])) end end

print("\n=== FAIT ===")
