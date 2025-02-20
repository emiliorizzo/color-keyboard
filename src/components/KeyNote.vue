<template lang="pug">
.key-note(
  :class="['key-note', { active: isActive }]"
  :style="{'background-color': isActive ? note.color : (isBlack ? 'black' : 'white'), 'border-color': note.color}"
  @mousedown="handleMouseDown"
  @mouseup="handleMouseUp"
)
  .note-name {{ note.name }}
  .note-key(v-if="note.key") {{ note.key }}
</template>

<script>
import { defineComponent, toRefs } from 'vue'

export default defineComponent({
  props: {
    note: Object,
    isActive: Boolean,
    isBlack: Boolean,
  },
  setup(props, { emit }) {
    const { note, isActive } = toRefs(props)

    const handleMouseDown = (event) => {
      if (event.button === 0) {
        // Check if the left mouse button is pressed
        playNote()
      }
    }

    const handleMouseUp = (event) => {
      if (event.button === 0) {
        // Check if the left mouse button is released
        stopNote()
      }
    }

    const playNote = () => {
      emit('note-on', note.value.name)
    }

    const stopNote = () => {
      emit('note-off', note.value.name)
    }

    return {
      note,
      isActive,
      handleMouseDown,
      handleMouseUp,
    }
  },
})
</script>

<style lang="stylus">
.key-note
  width 40px
  height 120px
  border 1px solid black
  margin 2px
  padding 0
  text-align center
  background-color white
  color black
  cursor pointer
  display flex
  justify-content center
  align-items flex-end
  color gray
  border-radius 0 0 5px 5px
  flex-direction row wrap
  border-style solid
  border-width 1px  1px 5px 1px

.key-note.black
  box-shadow 1px 1px 5px 0 rgba(0, 0, 0, 0.5)

.note-name, .note-key
  width 100%
.note-name
  font-size .8em
  margin-bottom 1em
.note-key
  font-size .8em
  margin-bottom 1em
</style>
