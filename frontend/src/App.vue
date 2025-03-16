<template>
  <div id="main">
    <div class="toolbar">
      <button @click="changeView()">{{ view=='exam' ? 'graph' : 'exam'}}</button>
    </div>
    <div class="left pane" v-if="view=='graph'">
      <div id="mynetwork"></div>
    </div>
    <div class="right pane" v-if="view=='graph'">
      <kEditor
      :text="text"
      @update="updateContent"/>
    </div>
    <div class="pane exam" v-else>
      <div class="card">
        <div class="card-title">
          {{ question.question }}
        </div>
        <div class="card-options">
          <div class="card-option" v-for="(option, i) in question.options" :key="i" @click="selectOption(i)">
            <span 
              :class="['select-option',selected.includes(i)?'selected':'']"
              v-if="!confirmAnswer"
              >
            </span>
            <span 
                :class="['select-option',selected.includes(i)?'selected':'',question.correct.includes(i)?'correct':'incorrect']"
                v-else
                >
            </span>
            {{ 'ABCDE'[i]+'. '+option }}
          </div>
        </div>
        <div class="card-actions">
          <button class="next-question" @click="generateExam()">
            <svg-icon type="mdi" :path="mdi.mdiCheckAll" :size="24" v-if="confirmAnswer"></svg-icon>
            <svg-icon type="mdi" :path="mdi.mdiSkipNext" :size="24" v-else></svg-icon>
          </button>
        </div>
      </div>
      <div class="card">
        {{ stats }}
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable */
import SvgIcon from '@jamescoyle/vue-icon';
import { mdiOrbitVariant, mdiSkipNext, mdiMenu, mdiCheckAll, mdiRestore, mdiCheck } from '@mdi/js';
import axios from "axios";
import { Network } from "vis-network";
import kEditor from './components/kEditor.vue';

export default {
  name: 'App',
  data() {
    return {
      mdi: {
        mdiOrbitVariant : mdiOrbitVariant,
        mdiSkipNext : mdiSkipNext,
        mdiMenu : mdiMenu,
        mdiCheckAll : mdiCheckAll,
        mdiRestore : mdiRestore,
        mdiCheck : mdiCheck,
      },
      graph : {
        nodes : [],
        vertices : [],
        sequences : [],
        currentSequence : null
      },
      text : '',
      question : "?",
      network : null,
      dict: {
        'd' : 'es igual',
        's' : 'incluye',
        'l' : 'pertenece'
      },
      view: 'graph',
      selected: [],
      confirmAnswer: true,
      stats: null
    }
  },
  methods: {
    selectOption(i) {
      if(this.selected.includes(i)) {
        this.selected = this.selected.filter(a=>a!=i)
      }
      else {
        this.selected.push(i)
      }
    },
    changeView() {
      if(this.view=='exam') {
        this.view = 'graph'
        this.$nextTick(()=>{
          this.renderGraph()
        })
      }
      else {
        this.view = 'exam'
      }
    },
    async generateExam() {
      if(!this.confirmAnswer) {
        try {
          this.confirmAnswer = true
          const response = await axios.post("http://localhost:5000/graph/answer", {'content': this.selected});
          this.stats = response.data["data"]
        }
        catch (error) {
          console.error("Error fetching data:", error);
        }
      }
      else {
        try {
          this.confirmAnswer = false
          this.selected = []
          const response = await axios.post("http://localhost:5000/graph/exam", {'content': this.text});
          this.question = response.data["data"]
        }
        catch (error) {
          console.error("Error fetching data:", error);
        }
      }
    },
    formalize() {
      let nodes = []
      let edges = []

      this.graph.nodes.forEach(node => {
          nodes.push({
            id: node.id,
            label: node.name,
            color: node.descendants.length?"#000":"#f00"
          })
          node.descendants.forEach(d => {
            edges.push({
              from: node.id,
              to: d,
              label: 'incluye',
              arrows: "to",
              color : "#000"
            })
          })
          node.alias.forEach(a => {
            if(a!=node.id) {
              edges.push({
                from: node.id,
                to: a,
                label: 'es igual',
                arrows: "to",
                color : "#0f0"
              })
            }
          })
      })

      this.graph.vertices.forEach(vertex => {
          edges.push({
            from: vertex.obj,
            label: vertex.order.toString(),
            to: vertex.sub,
            arrows: "to",
              color : "#f00"
          });
      });

      return { nodes, edges };

    },
    async updateContent(content) {
      try {
          const response = await axios.post("http://localhost:5000/graph/update", {'content':content});
          this.graph = response.data["data"];
          this.renderGraph()
          
      } catch (error) {
          console.error("Error fetching data:", error);
      }
    },
    async loadData() {
      try {
          const response = await axios.get("http://localhost:5000/graph")
          this.graph = response.data.graph
          this.text = response.data.text
      } catch (error) {
          console.error("Error fetching data:", error)
      }
    },
    renderGraph() {
      const { nodes, edges } = this.formalize();

      const container = document.getElementById("mynetwork");
      const data = { nodes, edges };
      if(!container) return
      const options = {
        nodes: {
          shape: "dot",
          size: 10,
        },
        edges: {
          arrows: "to",
        },
        physics: {
          stabilization: true,
        },
      };

      if (this.network) {
        this.network.destroy();
      }

      this.network = new Network(container, data, options);
    }
  },
  mounted() {
    this.loadData().then(() => {
      this.renderGraph();
    });
  },
  components: {
    kEditor,
    SvgIcon
  }
}
</script>

<style>
#mynetwork {
  width: 100%;
  height: 100%;
  display: inline;
}

body, html {
  padding: 0;
  margin: 0;
  width: 100%;
  height: 100vh;
  background: #222;
}
.exam.pane {
  top: 50px;
  left: 10px;
  bottom: 10px;
  right: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
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
  position: relative;
  padding: 10px;
  box-sizing: border-box;
}

.pane {
  position: absolute;
  top: 0;
  bottom: 0;
}
.toolbar {
  height: 150px;
  width: 100%;
  display: inline;
  background: var(--background-alt);
}
.graph-container {
  height: 100%;
  width: 100%;
}
.pane.left {
  left: 10px;
  right: 50%;
  display: flex;
  position: absolute;
  top: 50px;
  bottom: 10px;
}
.pane.right {
  left: 50%;
  right: 10px;
  display: flex;
  position: absolute;
  top: 50px;
  bottom: 10px;
}

.create-sequence-btn {
  height: 24px;
  width: 24px;
  color: var(--primary);
}
.sequence-btn {
  height: 20px;
  width: 20px;
  border-radius: 0%;
  border: 2px solid white;
  box-sizing: border-box;
  cursor: pointer;
}
.sequences-bar {
  width: 100%;
  height: 40px;
  display: flex;
  padding: 10px;
  box-sizing: border-box;
  align-items: center;
  gap: 10px;
  position: relative;
  background: var(--error);
}
.sequences-bar::after {
  content: '';
  position: absolute;
  bottom: 0px;
  left: 20px;
  right: 20px;
  background: var(--primary-light);
  height: 1px;
}

.custom-btn .active {
  color: var(--secondary);
}
.custom-btn {
  height: 25px;
  width: 25px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 0%;
  color: var(--primary);
  border: 1px solid var(--primary-light);
  cursor: pointer;;
}
.custom-btn:active {
  color: var(--alert) !important;
  border-color: var(--alert) !important;
}
.toolbar {
  height: 30px;
  display: flex;
  gap: 10px;
  align-items: center;
  padding-left: 5px;
}
.card-title {
    height: 60px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 20px;
    width: 100%;
 }
 .card-options {
    height: calc(100% - 110px);
    padding-top: 10px;
    padding-bottom: 10px;
    width: 90%;
    margin-left: 5%;
    border-top: 1px solid var(--text-alt);
    border-bottom: 1px solid var(--text-alt);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-evenly;
 }
 .card-option {
    width: 80%;
    display: flex;
    gap: 10px;
    align-items: center;
    cursor: pointer;
 }
 .card-option:hover {
    background: var(--background-alt);
 }
 .card {
    aspect-ratio: 9/12;
    height: 80%;
    display: block;
    box-shadow: 1px 1px 3px var(--text);
 }
 .next-question {
    height: 24px;
    width: 24px;
    border: none;
    background: none;
    color: var(--primary);
    padding: 0px;
 }
 .card-actions {
    height: 50px;
    width: 100%;
    display: flex;
    justify-content: flex-end;
    box-sizing: border-box;
    padding: 20px;
    align-items: center;
 }
 .select-option {
    height: 12px;
    width: 12px;
    border-radius: 50%;
    border: 1px solid var(--text);
    outline: 2px solid var(--background);
    cursor: pointer;
 }
 .selected {
    outline: 1px solid var(--primary);
    border: 2px solid var(--background);
    background: var(--primary);
 }
 .selected.correct {
    outline: 1px solid var(--success);
    border: 2px solid var(--background);
    background: var(--primary);
 }
 .correct:not(.selected) {
    outline: 1px solid var(--success);
    border: 2px solid var(--background);
    background: var(--success);
 }
 .selected.incorrect {
    outline: 1px solid var(--secondary);
    border: 2px solid var(--background);
    background: var(--primary);
 }
</style>
