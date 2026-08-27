<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { FleetEditorUpdate, Side } from '../types';
import { useBattleStore } from '../state/battle';
import FleetEditor from '../ui/FleetEditor.vue';

const router = useRouter();
const battle = useBattleStore();
const activeSide = ref<Side>('attacker');

const currentFleet = computed(() =>
  activeSide.value === 'attacker' ? battle.fleetA : battle.fleetB,
);
const currentTechs = computed(() =>
  activeSide.value === 'attacker' ? battle.techA : battle.techB,
);
const otherFleet = computed(() =>
  activeSide.value === 'attacker' ? battle.fleetB : battle.fleetA,
);
const otherTechs = computed(() =>
  activeSide.value === 'attacker' ? battle.techB : battle.techA,
);

function onFleetUpdate(side: Side, payload: FleetEditorUpdate) {
  if (payload.fleet) battle.setFleet(side, payload.fleet);
  if (payload.techs) battle.setTechs(side, payload.techs);
  if (payload.planetSkin !== undefined) battle.setSkin(payload.planetSkin);
}

function startSimulation() {
  // Démarre le run dans le store (status → 'loading'), puis bascule sur /result.
  void battle.simulate();
  router.push('/result');
}
</script>

<template>
  <div class="mx-auto max-w-md px-3 py-4 pb-12 lg:max-w-6xl">
    <header class="mb-4">
      <h1 class="text-2xl font-bold">GAW Battle Simulator</h1>
      <p class="text-sm text-base-content/60">Mobile-first combat simulator</p>
    </header>

    <!-- Onglets : mobile uniquement -->
    <div class="tabs tabs-boxed mb-4 lg:hidden">
      <button
        class="tab"
        :class="{ 'tab-active': activeSide === 'attacker' }"
        @click="activeSide = 'attacker'"
      >
        Attacker
      </button>
      <button
        class="tab"
        :class="{ 'tab-active': activeSide === 'defender' }"
        @click="activeSide = 'defender'"
      >
        Defender
      </button>
    </div>

    <!-- Éditeurs : 1 sur mobile, 2 côte à côte sur desktop -->
    <div class="lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
      <div class="lg:hidden">
        <FleetEditor
          :side="activeSide"
          :fleet="currentFleet"
          :techs="currentTechs"
          :planet-skin="battle.planetSkin"
          :other-fleet="otherFleet"
          :other-techs="otherTechs"
          @update="onFleetUpdate(activeSide, $event)"
        />
      </div>

      <div class="hidden lg:block">
        <FleetEditor
          side="attacker"
          :fleet="battle.fleetA"
          :techs="battle.techA"
          :planet-skin="battle.planetSkin"
          :other-fleet="battle.fleetB"
          :other-techs="battle.techB"
          @update="onFleetUpdate('attacker', $event)"
        />
      </div>

      <div class="hidden lg:block">
        <FleetEditor
          side="defender"
          :fleet="battle.fleetB"
          :techs="battle.techB"
          :planet-skin="battle.planetSkin"
          :other-fleet="battle.fleetA"
          :other-techs="battle.techA"
          @update="onFleetUpdate('defender', $event)"
        />
      </div>
    </div>

    <!-- Barre d'action sticky : Simulate accessible sans scroller -->
    <div class="sticky bottom-0 z-10 -mx-3 mt-5 border-t border-base-300 bg-base-100 px-3 py-3">
      <!-- Options de simulation -->
      <div class="flex flex-wrap items-center gap-2 text-sm">
        <span class="text-base-content/70">Mode</span>
        <div class="join">
          <button
            class="btn btn-sm join-item"
            :class="battle.mode === 'single' ? 'btn-primary' : 'btn-ghost'"
            @click="battle.setMode('single')"
          >
            Single
          </button>
          <button
            class="btn btn-sm join-item"
            :class="battle.mode === 'monte-carlo' ? 'btn-primary' : 'btn-ghost'"
            @click="battle.setMode('monte-carlo')"
          >
            Monte Carlo
          </button>
        </div>

        <template v-if="battle.mode === 'monte-carlo'">
          <span class="ml-2 text-base-content/70">Runs</span>
          <select
            class="select select-bordered select-sm"
            :value="battle.runs"
            @change="battle.setRuns(Number(($event.target as HTMLSelectElement).value))"
          >
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
            <option :value="250">250</option>
            <option :value="500">500</option>
          </select>
        </template>

        <span class="ml-2 text-base-content/70">Seed</span>
        <span class="badge badge-ghost tabular-nums">{{ battle.seed }}</span>
        <button class="btn btn-ghost btn-xs" title="New seed" @click="battle.rerollSeed()">🎲</button>
      </div>

      <button
        class="btn btn-primary btn-block mt-3"
        :disabled="!battle.canSimulate"
        @click="startSimulation"
      >
        <span v-if="battle.status === 'loading'" class="loading loading-spinner loading-sm"></span>
        {{ battle.status === 'loading' ? 'Simulating…' : 'Simulate' }}
      </button>

      <p v-if="battle.status === 'error'" class="mt-2 text-center text-sm text-error">
        Simulation failed. Please try again.
      </p>
    </div>
  </div>
</template>
