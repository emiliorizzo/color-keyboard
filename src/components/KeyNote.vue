<template lang="pug">
.key-note(:class="['key', { active: isActive }]" @mousedown="handleMouseDown" @mouseup="handleMouseUp")
  .note-name {{ note }}
</template>

<script>
import { defineComponent, toRefs } from 'vue'

export default defineComponent({
  props: {
    note: String,
    isActive: Boolean,
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
      emit('note-on', note.value)
    }

    const stopNote = () => {
      emit('note-off', note.value)
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



.note-name
  font-size .8em
  margin-bottom 1em

.key-note.active
  background-color yellow
</style>
