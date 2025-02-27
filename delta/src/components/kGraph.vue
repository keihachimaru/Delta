<template>
  <div id="graph">
    <div id="graph-contents" class="graph-contents" :style="{cursor: !drag?'default':'grab'}">
      <div class="sequences-bar">
        <div @click="createSequence()" class="create-sequence-btn custom-btn">
          <svg-icon type="mdi" :path="mdi.mdiPlus" :size="20"></svg-icon>
        </div>
        <span
          class="sequence-btn"
          v-for="(sequence,i) in sequences" :key="i"
          :style="{
            background: sequence.id,
            borderColor: currentsequence==sequence?'var(--secondary)':'var(--background-alt)'
          }"
          @click="setCurrentSequence(sequence)"
        >
        </span>
      </div>
      <input v-model="xDist" id="xdist-editor" type="number">
      <input v-model="yDist" id="ydist-editor" type="number">
      <div 
        id="play-sequence" 
        class="custom-btn" 
        @click="playSequence()"
        v-if="currentsequence||play"
        :style="{
          borderColor: currentsequence?currentsequence.id:'var(--primary)',
          color: currentsequence?currentsequence.id:'var(--primary)',
        }"
        >
        <svg-icon type="mdi" :path="mdi.mdiPlay" :size="20"></svg-icon>
      </div>
      <div 
        class="sequence-container" 
        id="sequence-container"
        :style="{
          borderColor: currentsequence?currentsequence.id:'var(--primary)'
        }"
        v-if="play">
        <kTest :nodes="nodes" :vertices="displayVertices" :sequence="currentsequence"/>
      </div>
      <div 
        class="node-container" 
        id="node-container" 
        v-else>
        <span 
          class="node" 
          v-for="(node, i) in nodes" 
          :key="i"
          :style="{
            top: (node.y*scale/100+origin[1])+'px', 
            left: (node.x*scale/100+origin[0])+'px',
            display: node.visible?'flex':'none',
            background: getNodeBColor(node),
            borderColor: getNodeLColor(node),
            color: getNodeLColor(node),
            transform: `translate(${(-0.4*0.5*100)}px, ${(-0.4*0.5*100)}px) scale(${scale}%)`,
          }"
          @click.right="focusedNode=node;showData=true"
          >
          <span
            :style="{
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }"
          >
            {{ node.id }}
          </span>
          <div class="node-contents" v-if="!showData">
            <img id="node-image" :src="node.text" v-if="node.text.startsWith('blob:http')">
            <span 
              style="height: calc(100% - 20px); width: calc(100% - 20px)"
              v-else>
              {{ node.text }}
            </span>
          </div>
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" ref="svg" id="svg">
          <line 
            v-for="(vertex, i) in displayVertices" 
            :key="'line'+i"
            :x1=vertex.obj.x*scale/100+origin[0]
            :y1=vertex.obj.y*scale/100+origin[1]
            :x2=vertex.sub.x*scale/100+origin[0]
            :y2=vertex.sub.y*scale/100+origin[1]
            :stroke="getLineColor(vertex)"
            :stroke-width="Math.floor(scale/80)+1"
            @click.right="focusedNode=vertex;showData=true"
            @dblclick="addVertexSequence(vertex)"
            />
          <rect
            v-for="(vertex, i) in displayVertices" 
            :key="'text'+i"
            :x=(vertex.obj.x+vertex.sub.x)/2*scale/100+origin[0]-vertex.id.length*3-1
            :y=(vertex.obj.y+vertex.sub.y)/2*scale/100+origin[1]-6
            height="12"
            :width="vertex.id.length*6+3"
            @click.right="focusedNode=vertex;showData=true"
            @dblclick="addVertexSequence(vertex)"
            fill="white"
            >
          </rect>
          <text
            v-for="(vertex, i) in displayVertices" 
            :key="'text'+i"
            :x=(vertex.obj.x+vertex.sub.x)/2*scale/100+origin[0]-vertex.id.length*3
            :y=(vertex.obj.y+vertex.sub.y)/2*scale/100+origin[1]+4
            stroke-width="1"
            :fill="getLineColor(vertex)"
            :text-length="vertex.id.length*6"
            @click.right="focusedNode=vertex;showData=true"
            @dblclick="addVertexSequence(vertex)"
            style="cursor: pointer; user-select: none;"
            :font-size="Math.max(scale/8, 5)"
            >
            {{ vertex.id }}
          </text>
        </svg>
      </div>
    </div>
    <div class="graph-data">
      <div 
        @click="showData=!showData" 
        id="showData"
        :class="showData?'show-data':'hide-data'"
        >
        <svg-icon type="mdi" :path="mdi.mdiTriangle" :size="14"></svg-icon>
      </div>
      <div class="graph-data-container" v-if="showData && focusedNode">
        <div 
          @click="mode='image'" 
          :class="['custom-btn', mode=='image'?'active':'']" 
          style="top: 5px; left: 5px; position: absolute;">
          <svg-icon type="mdi" :path="mdi.mdiImageArea" :size="18"></svg-icon>
        </div>
        <div 
          @click="mode='text'" 
          :class="['custom-btn', mode=='text'?'active':'']" 
          style="top: 35px; left: 5px; position: absolute;">
          <svg-icon type="mdi" :path="mdi.mdiTextAccount" :size="18"></svg-icon>
        </div>
        <div class="graph-data-contents">
          <textarea v-if="mode=='text'" autofocus="true" v-model="focusedNode.text">
          </textarea>
          <div v-if="mode=='image'" class="graph-data-image-container">
            <label for="upload">
              <span class="glyphicon glyphicon-folder-open" aria-hidden="true"></span>
              <input type="file" id="upload" accept="image/*" v-on:change="updateNodeImage($event.target)" style="display:none">
            </label>
            <img id="node-image" :src="focusedNode.text">
          </div>
        </div>
        <div class="graph-data-stats" v-if="focusedNode.text">
          <span><strong>ID</strong> : {{ focusedNode.id }}</span>
          <span><strong>Parent</strong> : {{ focusedNode.parent }}</span>
          <span><strong>Ancestors</strong> : {{ focusedNode.ancestors.length }}</span>
          <span><strong>Descenders</strong> : {{ focusedNode.descenders.length }}</span>
        </div>
        <div class="graph-data-stats" v-else>
          <span><strong>ID</strong> : {{ focusedNode.id }}</span>
          <span><strong>PK</strong> : {{ focusedNode.pk }}</span>
          <span><strong>Object</strong> : {{ focusedNode.obj.id }}</span>
          <span><strong>Subject</strong> : {{ focusedNode.sub.id }}</span>
        </div>
      </div>
      <div style="height:20px; width: 10px;" v-else>
      </div>
    </div>
  </div>
</template>

<script>
import kTest from './kTest.vue'
import SvgIcon from '@jamescoyle/vue-icon';
import { mdiTable, mdiPlus, mdiHelp, mdiPlay, mdiTriangle, mdiImageArea, mdiTextAccount, mdiSkipNext  } from '@mdi/js';

class Node {
  constructor(x, y, id) {
    this.id = id
    this.x = x
    this.y = y
    this.vertices = []
    this.visible = false
    this.text = id
    this.parent = null
    this.ancestors = []
    this.descenders = []
    
    this.boundingH = 0
  }
}
class Vertex {
  constructor(node1, node2, id) {
    this.id = id
    this.pk = Math.floor(Math.random()*10000)
    this.obj = node1
    this.sub = node2
  }
}

export default {
  name: 'kGraph',
  props: {
    graph: {
      type: Object,
      required: true,
    },
  },
  components: {
    SvgIcon,
    kTest
  },
  data() {
    return {
      mdi: {
        mdiPlus: mdiPlus,
        mdiPlay : mdiPlay,
        mdiTriangle : mdiTriangle,
        mdiImageArea : mdiImageArea,
        mdiTextAccount : mdiTextAccount,
        mdiSkipNext : mdiSkipNext,
        mdiHelp: mdiHelp,
        mdiTable: mdiTable,
      },
      focusedNode: null,
      nodes : {},
      vertices: [],
      displayVertices: [],
      origin: [0, 0],
      xDist: 100,
      yDist: 40,
      scale: 100,
      sequences: [],
      currentsequence: null,
      drag: false,
      mode: 'text',
      play: false,
      showData: false,
    }
  },
  methods: {
    playSequence() {
      this.play = !this.play
      if (!this.play) {
        this.$nextTick(()=>{
          this.setupNodeContainer()
        })
      }
      else {
        this.showData = false
      }
    },
    updateNodeImage(target) {
      if (target.files.length) {
        this.focusedNode.text = URL.createObjectURL(target.files[0])
      }
    },
    addVertexSequence(vertex) {
      if(this.currentsequence) {
        if(!this.currentsequence.vertices.includes(vertex.pk)) {
          this.currentsequence.vertices.push(vertex.pk)
        }
        if(!this.currentsequence.nodes.includes(vertex.obj.id)) {
          this.currentsequence.nodes.push(vertex.obj.id)
        }
        if(!this.currentsequence.nodes.includes(vertex.sub.id)) {
          this.currentsequence.nodes.push(vertex.sub.id)
        }
      }
    },
    setCurrentSequence(sequence) {
      if (sequence==this.currentsequence) {
        this.playSequence()
        this.currentsequence = null
      }
      else {
        this.currentsequence = sequence
      }
    },
    createSequence() {
      let r = Math.floor(Math.random()*255).toString(16)
      let g = Math.floor(Math.random()*255).toString(16)
      let b = Math.floor(Math.random()*255).toString(16)
      let sequence = {
        id: "#"+r+g+b,
        vertices: [],
        nodes: [],
      }
      if(!this.play) {
        this.currentsequence = sequence
      }
      this.sequences.push(sequence)
    },
    getNodeBColor(node) {
      if (this.currentsequence && this.currentsequence.nodes.includes(node.id)) {
        return this.currentsequence.id
      }
      else {
        return window.getComputedStyle(document.body).getPropertyValue('--background-alt')
      }
    },
    getNodeLColor(node) {
      if (this.focusedNode==node) {
        return window.getComputedStyle(document.body).getPropertyValue('--secondary')
      }
    },
    getLineColor(vertex) {
      if (!vertex.obj.visible||!vertex.sub.visible) {
        return 'white'
      }
      else if (this.currentsequence && this.currentsequence.vertices.includes(vertex.pk)) {
        return this.currentsequence.id
      }
      else if (this.focusedNode==vertex) {
        return window.getComputedStyle(document.body).getPropertyValue('--secondary')
      }
      else {
        return window.getComputedStyle(document.body).getPropertyValue('--text-alt')
      }
    },
    generateChilds(node, vertices) {
      let siblings = []

      for(let i=0;i<vertices.length;i++) {
        let childID = vertices[i]
        let childVertices = this.graph.vertices.filter((e)=>Array.from(e).includes(childID)&&!this.vertices.includes(e))
        this.vertices += childVertices
        let newNode = new Node(node.x+this.xDist, node.y+this.yDist*i, childID)
        newNode.parent = node.id
        newNode.ancestors = node.ancestors.concat([node.id])
        newNode.vertices = childVertices.map((e)=>e[0]==childID?e[1]:e[0])
        this.nodes[childID] = newNode
        siblings.push(newNode)

        if (childVertices.length) {
          this.displayVertices = this.displayVertices.concat(childVertices)
          this.generateChilds(newNode, childVertices.map((e)=>e[0]==childID?e[1]:e[0]))
        }
      }
    },
    calcBoundingH(node, box) {
      if(box==0) {
        for(let i=0;i<node.vertices.length;i++) {
          this.calcBoundingH(this.nodes[node.vertices[i]], 0)
        }
        if(node.vertices.length==0) {
          node.boundingH = 1
          this.calcBoundingH(this.nodes[node.parent], 1)
        }
      }
      else {
        node.boundingH += 1
        if(node.parent) {
          this.calcBoundingH(this.nodes[node.parent], 1)
        }
      }
    },
    spaceNodes(node) {
      let last = 0
      for(let i=0;i<node.vertices.length;i++) {
        let target = this.nodes[node.vertices[i]]
        target.y = node.y+this.yDist*last
        last += target.boundingH
        this.spaceNodes(target)
      }
    },
    generateGraph() {
      let remaining = this.graph.nodes.filter((n)=>!Object.keys(this.nodes).includes(n))
      let origins = []
      while (remaining.length) {
        let nodeID = remaining[0]
        if(nodeID) {
          origins.push(nodeID)
          let vertices = this.graph.vertices.filter((e)=>Array.from(e).includes(nodeID)&&!this.vertices.includes(e))
          this.displayVertices = this.displayVertices.concat(vertices)
          this.vertices += vertices
          let newNode = new Node(0, 0, nodeID)
          newNode.vertices = vertices.map((e)=>e[0]==nodeID?e[1]:e[0])
          this.nodes[nodeID] = newNode
          this.generateChilds(newNode, vertices.map((e)=>e[0]==nodeID?e[1]:e[0]))
        }
        remaining = this.graph.nodes.filter((n)=>!Object.keys(this.nodes).includes(n))
      }

      let lastBox = 0
      for(let i=0;i<origins.length; i++) {
        let origin = origins[i]
        this.nodes[origin].y += lastBox
        this.calcBoundingH(this.nodes[origin], 0)
        this.spaceNodes(this.nodes[origin])
        lastBox = this.nodes[origin].boundingH*this.yDist
      }

      for(let i in this.displayVertices) {
        let vertex = new Vertex(
          this.nodes[this.displayVertices[i][0]], 
          this.nodes[this.displayVertices[i][1]],
          this.displayVertices[i][2]
        )

        this.displayVertices[i] = vertex
      }
    },
    setVisible(node, num) {
      node.visible = true
      let vertices = node.vertices
      if (vertices.length) {
        for(let i=0; i<vertices.length; i++) {
          let child = vertices[i]+""
          this.setVisible(this.nodes[child], num)
        }
      }
    },
    updateGraph() {
      let graphContents = document.getElementById("node-container")

      let bounds = graphContents.getBoundingClientRect()
      this.origin[0] = bounds.width/2
      this.origin[1] = (bounds.height)/2

      let oldNodes = this.nodes
      this.nodes = {}
      this.displayVertices = []
      this.vertices = []

      this.generateGraph()

      let tempNodeKeys = Object.keys(this.nodes)
      let num = 0

      while(tempNodeKeys.length!=num) {
        this.nodes[tempNodeKeys[num]].visible = true
        if (oldNodes[tempNodeKeys[num]]) {
          this.nodes[tempNodeKeys[num]].text = oldNodes[tempNodeKeys[num]].text
        }
        num++
      }
    },
    centerCanvas() {
      if (this.focusedNode) {
        if (this.focusedNode.obj) {
          let graphContents = document.getElementById("node-container")

          let bounds = graphContents.getBoundingClientRect()
          this.origin[0] = bounds.width/2 - (this.focusedNode.obj.x+this.focusedNode.sub.x)/2
          this.origin[1] = (bounds.height)/2 - (this.focusedNode.obj.y+this.focusedNode.sub.y)/2
        }
        else {
          let graphContents = document.getElementById("node-container")

          let bounds = graphContents.getBoundingClientRect()
          this.origin[0] = bounds.width/2 - this.focusedNode.x
          this.origin[1] = (bounds.height)/2 -this.focusedNode.y
        }
      }
    },
    setupNodeContainer() {
      let graphContents = document.getElementById("node-container")

      let x = 0
      let y = 0

      graphContents.addEventListener('mousedown', (e)=>{
        if (e.button == 0) {
          if (e.target==this.$refs.svg) {
            e.preventDefault()
            x = e.x
            y = e.y
            this.drag = true
          }
        }
      })

      graphContents.addEventListener('mouseup', (e)=>{
        if (this.drag) {
          e.preventDefault()
          this.drag = false
        }
        else {
          this.focusedNode = null
          this.showData = false
        }
      })
      
      graphContents.addEventListener('contextmenu', (e)=>{e.preventDefault()})

      graphContents.addEventListener('mousemove', (e)=> {
        if (this.drag) {
          let dx = x-e.x
          let dy = y-e.y
          x = e.x
          y = e.y
          this.origin[0]-=dx
          this.origin[1]-=dy
        }
      })
    },
    dist(a, b) {
      return ((a[0]-b[0])**2+(a[1]-b[1])**2)**0.5
    }
  },
  mounted() {
    this.updateGraph()
    this.setupNodeContainer()

    window.addEventListener('keydown', (e)=>{
      if (e.key == ' '&&!this.focusedNode&&Object.keys(this.nodes).length && document.activeElement==document.body) {
        let graphContents = document.getElementById("node-container")
        let bounds = graphContents.getBoundingClientRect()
        let x = (bounds.width/2)-this.origin[0]
        let y = (bounds.height/2)-this.origin[1]
        
        let nearest = Object.keys(this.nodes).sort((a, b)=>{
          return this.dist([x,y],[this.nodes[a].x,this.nodes[a].y]) - this.dist([x,y],[this.nodes[b].x,this.nodes[b].y])
        })[0]
        this.focusedNode = this.nodes[nearest]
        this.centerCanvas()
        this.$nextTick(()=>{
          this.centerCanvas()
        })
      }
      else if (this.focusedNode && document.activeElement==document.body) {
        if (e.key == ' ') {
          this.centerCanvas()
        }
        if ((e.key == 'ArrowRight' || e.key.toLowerCase() == 'd')) {
          if (this.focusedNode.vertices && this.focusedNode.vertices.length) {
            let nextChild = this.focusedNode.vertices[Math.floor(this.focusedNode.vertices.length/2)]
            this.focusedNode = this.nodes[nextChild]
            this.centerCanvas()
          }
          else if (this.focusedNode.sub) {
            this.focusedNode = this.focusedNode.sub
            this.centerCanvas()
          }
        }
        if ((e.key == 'ArrowLeft' || e.key.toLowerCase() == 'a')) {
          if(this.focusedNode.parent) {
            this.focusedNode = this.nodes[this.focusedNode.parent]
            this.centerCanvas()
          }
          else if (this.focusedNode.obj) {
            this.focusedNode = this.focusedNode.obj
            this.centerCanvas()
          }
        }
        if ((e.key == 'ArrowUp' || e.key.toLowerCase() == 'w') && this.focusedNode.parent) {
          let siblings = this.nodes[this.focusedNode.parent].vertices
          if (siblings.length) {
            let index = siblings.indexOf(this.focusedNode.id)
            if (index>0) {
              this.focusedNode = this.nodes[siblings[index-1]]
              this.centerCanvas()
            }
          }
        }
        if ((e.key == 'ArrowDown' || e.key.toLowerCase() == 's') && this.focusedNode.parent) {
          let siblings = this.nodes[this.focusedNode.parent].vertices
          if (siblings.length) {
            let index = siblings.indexOf(this.focusedNode.id)
            if (index<siblings.length-1) {
              this.focusedNode = this.nodes[siblings[index+1]]
              this.centerCanvas()
            }
          }
        }
      }
    })
    window.addEventListener('contextmenu', (e)=>{
      e.preventDefault()
    })
    window.addEventListener('wheel', (e) => {
      this.scale = Math.max(Math.min((this.scale-e.deltaY/33), 1000), 30)
    })
  },
  watch: {
    graph: {
      handler() {
        this.updateGraph()
      },
      deep: true
    },
    xDist: {
      handler() {
        this.updateGraph()
      },
      deep: true
    },
    yDist: {
      handler() {
        this.updateGraph()
      },
      deep: true
    },
    focusedNode: {
      handler() {
        this.$nextTick(()=>{
          this.centerCanvas()
        })
      }
    }
  }
}
</script>

<style scoped>
#xdist-editor {
  position: absolute;
  top: 50px;
  left: 10px;
  width: 50px;
  border: 1px solid var(--secondary);
  color: var(--secondary);
  border-radius: 0px;
  outline: none;
}
#ydist-editor {
  position: absolute;
  top: 50px;
  left: 70px;
  width: 50px;
  border: 1px solid var(--alert);
  color: var(--alert);
  border-radius: 0px;
  outline: none;
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
#play-sequence {
  position: absolute;
  top: 50px;
  right: 10px;
  width: 24px;
  height: 24px;
}
input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button  {
  background: var(--primary);
  width: 1em;
  border-right: 1px solid var(--primary);
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  cursor: pointer;
}

.create-sequence-btn {
  height: 24px;
  width: 24px;
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
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 40px;
  display: flex;
  padding: 10px;
  box-sizing: border-box;
  align-items: center;
  gap: 10px;
  background: var(--background);
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
#svg {
  height: 100%;
  width: 100%;
}
#graph {
  height: calc(100%-16px);
  width: calc(50% - 8px);
  margin: 8px;
  margin-right: 4px;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  flex-direction: column;
}
.graph-contents {
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
}
.node-container {
  height: calc(100% - 80px);
  margin-top: 80px;
  position: relative;
  width: calc(100% - 20px);
  overflow: hidden;
  border: 2px solid var(--primary-light);
  border-radius: 0px;
}
.sequence-container {
  height: calc(100% - 80px);
  margin-top: 80px;
  position: relative;
  width: calc(100% - 20px);
  overflow: hidden;
  border: 1px solid var(--alert);
  border-radius: 0px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.card {
  height: 90%;
  aspect-ratio: 9/12;
  box-shadow: 1px 1px 3px var(--text);
  display: flex;
  flex-direction: column;
  border-radius: 0px;
}
.card-title {
  height: 50px;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  text-transform: capitalize;
  font-weight: bold;
  font-size: 18px;
}
.card-options {
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  padding: 15px;
  padding-bottom: 0px;
}
.card-option {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 30px;
  gap: 10px;
}
.select-option {
  height: 14px;
  width: 14px;
  outline: 1px solid var(--background);
  border: 1px solid var(--primary);
  border-radius: 0%;
  cursor: pointer;
  transform: translateY(1px);
}
.selected {
  height: 14px;
  width: 14px;
  outline: 1px solid var(--primary);
  border: 1px solid var(--background);
  background: var(--primary);
  border-radius: 0%;
  cursor: pointer;
  transform: translateY(1px);
}
.card-option:not(:nth-child(1)) {
  border-top: 1px solid var(--text-alt);
}
.card-action {
  height: 40px;
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  box-sizing: border-box;
  padding: 5px;
}
.next-btn {
  height: 25px;
  width: 25px;
  background: var(--primary);
  border: 1px solid var(--background);
  border-radius: 0px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.next-btn:hover {
  color: var(--primary);
  background: var(--background);
  border: 1px solid var(--primary);
}
.next-btn:active {
  color: var(--alert);
  background: var(--background);
  border: 1px solid var(--alert);
}

.graph-data {
  height: fit-content !important;
  min-height: fit-content;
  box-sizing: border-box;
  margin-top: 5px;
  width: 100%;
  box-sizing: border-box;
  position: relative;
  user-select: none;
  background: var(--background);
}
.graph-data-container {
  height: 180px;
  width: 100%;
  display: flex;
}
#showData {
  color: var(--primary);
  position: absolute;
  bottom: 0px;
  left: 15px;
  cursor: pointer;
  transition: .3s;
}
.hide-data {
  transform: rotate(90deg);
}
.show-data {
  transform: rotate(0deg);
}
.graph-data-image-container {
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  background: white;
}
.graph-data-image-container label {
  height: 20px;
  width: 20px;
  background: transparent;
  position: absolute;
  top: 5px;
  left: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}
.graph-data-image-container img {
  max-width: 100%;
  max-height: 100%;
}
.graph-data-contents {
  height: calc(100%);
  width: calc(50%);
  margin-left: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}
.graph-data-stats {
  height: calc(100%);
  width: calc(50% - 50px);
  border-left: 1px solid var(--primary-light);
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding-left: 5px;
}
.graph-data-contents textarea {
  height: 100%;
  width: 100%;
  border: none;
  outline: none;
}
.node {
  height: 40px;
  width: 40px;
  border-radius: 0%;
  position: absolute;
  border: 2px solid white;
  box-sizing: border-box;
  justify-content: center;
  align-items: center;
  user-select: none;
  font-size: small;
  transform-origin: 50%;
}
.node:hover {
  border-color: var(--primary);
  cursor: pointer;
  z-index: 100 !important;
}
.node:hover .node-contents{
  opacity: 1;
  pointer-events: all;
}
.node-contents {
  height: 100px;
  aspect-ratio: 9/12;
  bottom: 20px;
  right: 20px;
  transform: translate(100%, 100%);
  position: absolute;
  display: none;
  box-shadow: 1px 1px 3px var(--text);
  background: var(--background);
  display: flex;
  opacity: 0;
  justify-content: center;
  align-items: center;
  border-radius: 0px;
  pointer-events: none;
  transition: all .3s ease-in-out;
  z-index: 100 !important;
}
.node-contents img {
  max-width: 100%;
  max-height: 100%;
}
</style>
