<template>
  <div id="main">
    <kGraph :graph="graph"/>
    <kEditor @update="updateContent"/>
  </div>
</template>

<script>
import kGraph from './components/kGraph.vue';
import kEditor from './components/kEditor.vue';

export default {
  name: 'App',
  data() {
    return {
      graph: {
        vertices: [],
        nodes: []
      }
    }
  },
  methods: {
    updateContent(content) {
      let nodes = content[0]
      let vertices = content[1]

      this.graph.nodes=nodes
      this.graph.vertices=vertices
    }
  },
  components: {
    kGraph,
    kEditor
  }
}
</script>

<style>
body, html {
  padding: 0;
  margin: 0;
  width: 100%;
  height: 100vh;
  background: #222;
}

:root {
  /* Primary */
  --primary: #4285F4;
  --primary-light: #82B1FF;
  --primary-dark: #0D47A1;

  /* Secondary */
  --secondary: #DB4437;
  --secondary-light: #FF7961;
  --secondary-dark: #B71C1C;

  /* Background */
  --background: #FFFFFF;
  --background-alt: #EEEEEE;

  /* Text */
  --text: #202124;
  --text-alt: #b6b6b6;

  /* Success */
  --success: #0F9D58;
  --success-light: #66BB6A;
  --success-dark: #1B5E20;

  /* Alert */
  --alert: #F4B400;
  --alert-light: #FFD54F;
  --alert-dark: #FF8F00;
}

#main {
  font-family: 'Helvetica';
  display: flex;
  width: 100%;
  aspect-ratio: 16/9;
  max-height: 100vh;
  background: var(--background);
}

</style>
