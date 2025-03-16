<template>
  <div id="editor">
    <textarea 
      id="editor-text" 
      autofocus 
      v-model="content"
      @keydown="tabContent"
      @keydown.enter="updateContent"
      ref="textarea">
    </textarea>
    <button id="update-btn" @click="updateContent()">
      Update
    </button>
  </div>
</template>

<script>


export default {
  name: 'kEditor',
  props: {
    text: String,
  },
  data() {
    return {
      content: '',
    }
  },
  methods: {
    updateContent(e) {
      if(!e) {
        this.$emit('update', this.content)
        return
      }
      e.preventDefault()
      this.$emit('update', this.content)
      let lastLine = this.$refs.textarea.value.split('\n').at(-1)
      let tabCount = lastLine.length - lastLine.replace('\t','').length
      tabCount = lastLine.trim()!=''?tabCount:0
      var start = this.$refs.textarea.selectionStart;
      var end = this.$refs.textarea.selectionEnd;

      // set textarea value to: text before caret + tab + text after caret
      this.$refs.textarea.value = this.$refs.textarea.value.substring(0, start) +
        "\n"+"\t".repeat(tabCount) + this.$refs.textarea.value.substring(end);

      // put caret at right position again
      this.$refs.textarea.selectionStart =
      this.$refs.textarea.selectionEnd = start + 1 + tabCount;
    },
    tabContent(e) {
      if (e.key == 'Tab') {
        e.preventDefault();
        var start = e.target.selectionStart;
        var end = e.target.selectionEnd;

        // set textarea value to: text before caret + tab + text after caret
        e.target.value = e.target.value.substring(0, start) +
          "\t" + e.target.value.substring(end);

        // put caret at right position again
        e.target.selectionStart =
        e.target.selectionEnd = start + 1;
      }
    }
  },
  mounted() {
    this.content = this.text
  },
  watch: {
    text: {
      handler() {
        this.content = this.text
      },
      deep: true
    },
  }

}
</script>

<style scoped>
#editor {
  height: calc(100%);
  width: calc(100%);
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}
#editor-text {
  height: calc(100%);
  width: calc(100%);
  outline: none;
}
#update-btn {
  height: 30px;
  width: 100px;
  border: 1px solid black;
  position: absolute;
  bottom: 10px;
  right: 10px;
  cursor: pointer;
}
#update-btn:hover {
  border-color: red;
}
</style>
