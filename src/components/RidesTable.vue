<script lang="ts" setup>
import type { ShiftRide } from '../types';

const { shiftRides } = defineProps<{ shiftRides: ShiftRide[] }>()

</script>

<template>
    <div class="container">
        <div v-for="(shiftRide) in shiftRides">
            <div class="shiftContainer">
                <span class="day">{{ shiftRide.day }}</span>
                <div class="ridesContainer">
                    <div v-for="(morningRide, morningIndex) in shiftRide.morning">
                        <div class="rideContainer">
                            <div class="daySplitter">
                                <span class="index">{{ "Svoz " + (morningIndex + 1) }}</span>
                                <div class="trackContainer">
                                    <span class="time">{{ morningRide.startTime }}</span>
                                    <span class="track" contenteditable="true" spellcheck="false">{{ morningRide.track.join(" -> ") }}</span>
                                    <span class="amount">{{ "celkem lidí " +
                                        morningRide.people.length }}</span>
                                </div>
                                <div class="people" v-for="(employee) in morningRide.people">
                                    {{ employee.name }} - {{ employee.town }} - {{ employee.shiftBranch }}
                                </div>
                                <div class="notes">{{ morningRide.notes }}</div>
                            </div>
                            <div class="daySplitter">
                                <div class="trackContainer">
                                    <span class="time">{{ morningRide.endTime }}</span>
                                    <span class="track">{{ morningRide.reversedTrack.join(" -> ") }}</span>
                                    <span class="amount">{{ "celkem lidí " +
                                        morningRide.reversePeople.length }}</span>
                                </div>
                                <div class="people" v-for="(employee) in morningRide.reversePeople">
                                    {{ employee.name }} - {{ employee.town }} - {{ employee.shiftBranch }}
                                </div>
                                <div class="notes">{{ morningRide.reverseNotes }}</div>
                            </div>
                        </div>
                    </div>
                    <div v-for="(afternoonRide, afternoonIndex) in shiftRide.afternoon">
                        <div class="rideContainer">
                            <div class="daySplitter">


                                <span class="index">{{ "Svoz " + (afternoonIndex + shiftRide.morning.length + 1)
                                }}</span>
                                <div class="trackContainer">
                                    <span class="time">{{ afternoonRide.startTime }}</span>
                                    <span class="track">{{ afternoonRide.track.join(" -> ") }}</span>
                                    <span class="amount">{{ "celkem lidí " +
                                        afternoonRide.people.length }}</span>
                                </div>
                                <div class="people" v-for="(employee) in afternoonRide.people">
                                    {{ employee.name }} - {{ employee.town }} - {{ employee.shiftBranch }}
                                </div>
                                <div class="notes">{{ afternoonRide.notes }}</div>
                            </div>
                            <div class="daySplitter">

                                <div class="trackContainer">
                                    <span class="time">{{ afternoonRide.endTime }}</span>
                                    <span class="track">{{ afternoonRide.reversedTrack.join(" -> ") }}</span>
                                    <span class="amount">{{ "celkem lidí " +
                                        afternoonRide.reversePeople.length }}</span>
                                </div>
                                <div class="people" v-for="(employee) in afternoonRide.reversePeople">
                                    {{ employee.name }} - {{ employee.town }} - {{ employee.shiftBranch }}
                                </div>
                                <div class="notes">{{ afternoonRide.reverseNotes }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="postcss" scoped>
.container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 1em;
}

.day {
    font-size: 1.2em;
    font-weight: bold;
    margin-block: 0.25rem;
}

.shiftContainer {
    display: flex;
    flex-direction: column;
    border: 1px solid #3d3d3d;
    border-radius: 10px;
}

.ridesContainer {
    display: flex;
    flex-direction: column;
    padding: 10px;
    gap: 0.5em;
}

.rideContainer {
    display: flex;
    flex-direction: column;
    background-color: #3d3d3d;
    gap: 0.3em;
    border-radius: 10px;
    padding: 0.3em;
}

.trackContainer {
    display: flex;
    flex-direction: row;
    gap: 10px;
    justify-content: space-between;
}

.daySplitter {
    background-color: #1c1c1c;
    border-radius: 5px;
    padding-inline: 0.5em;
    padding-block: 0.3em;
}

.index {
    font-size: 0.9em;
    align-self: flex-start;
    margin-left: 0.2em;
}
</style>
