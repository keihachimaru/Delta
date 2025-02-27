<template>
  <div id="editor">
    <textarea id="editor-text" autofocus v-model="content" @keydown.enter="updateContent()">
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
  },
  data() {
    return {
      content: `A es B, C, D.
B es B1, B2.
C es C1, C2.
D es D1, D2.
D1 es D1.1, D1.2, D.1.3.
D2 es D2.2.
K es X.`,
    }
  },
  methods: {
    updateContent() {
      let sentences = (this.content.split('\n').join(' ')+' ').toLowerCase().split('. ')
      let nodes = []
      let vertices = []

      for(let sentence in sentences) {
        sentence = sentences[sentence]
        let words = sentence.split(' ')
        let node1 = words[0]
        let vertx = words[1]

        if (words.length == 3) {
          let node2 = words[2]
          if (!nodes.includes(node1) && node1) {
            nodes.push(node1)
          }
          if (!nodes.includes(node2) && node2) {
            nodes.push(node2)
          }
          if (!vertices.includes([node1,node2,vertx]) && node1 && node2 && vertx) {
            vertices.push([node1,node2,vertx])
          }
        }
        else {
          for (let i=2; i<words.length; i++) {
            let node2 = words[i].replace(',', '')
            if (!nodes.includes(node1) && node1) {
              nodes.push(node1)
            }
            if (!nodes.includes(node2) && node2) {
              nodes.push(node2)
            }
            if (!vertices.includes([node1,node2,vertx]) && node1 && node2 && vertx) {
              vertices.push([node1,node2,vertx])
            }
          }
        }
      }
      this.$emit('update', [nodes, vertices])
    }
  },
  mounted() {
    this.updateContent()
  }
}
</script>

<style scoped>
#editor {
  height: calc(100%-16px);
  width: calc(50% - 8px);
  margin: 8px;
  margin-left: 4px;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}
#editor-text {
  height: calc(100% - 40px);
  width: calc(100% - 40px);
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
