<template>
    <div id="test">
        <button  
            class="open-menu" 
            @click="currentMode=null" 
            :style="{
                color: sequence.id
            }"
            v-if="currentMode"
            >
            <svg-icon type="mdi" :path="mdi.mdiMenu " :size="24"></svg-icon> 
        </button>
        <div class="select-modes" v-if="!currentMode">
            <button 
                class="select-mode" 
                :style="{
                    borderColor: sequence.id
                }"
                v-for="(mode, i) in modes"
                :key="i"
                @click="currentMode=mode">
                {{ mode }}
            </button>
        </div>
        <div class="anki" v-if="currentMode=='Anki'">
            <div class="card">
                <div
                    v-for="(place,i) in anki.currentQuestion"
                    :key="i" 
                    class="placeHolder"
                    :style="{
                        color: i!=anki.blank||anki.show?'var(--text)':'var(--background)',
                        borderBottom: i==anki.blank?'1px solid var(--text)':''
                    }">
                        {{ anki.currentQuestion[i] }}
                </div>
                <button class="flip-anki" @click="anki.show=!anki.show">
                    <svg-icon type="mdi" :path="mdi.mdiOrbitVariant " :size="24"></svg-icon>
                </button>
                <button class="skip-next" @click="generateAnki()">
                    <svg-icon type="mdi" :path="mdi.mdiSkipNext " :size="24"></svg-icon>
                </button>
            </div>
        </div>
        <div class="options" v-if="currentMode=='Options'">
            <div class="card" v-if="options.i<options.questions.length">
                <div class="card-title">
                    {{ options.questions[options.i].title }}
                </div>
                <div class="card-options">
                    <div
                        v-for="(option, i) in options.questions[options.i].options" 
                        class="card-option"
                        :key="i">
                        <span 
                            :class="['select-option',options.questions[options.i].selectedOption==option?'selected':'']"
                            @click="selectOption(option)"
                            >
                        </span>
                        <span>
                            {{ option }}
                        </span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="next-question" @click="nextQuestion()" v-if="this.options.questions[this.options.i].selectedOption">
                        <svg-icon type="mdi" :path="mdi.mdiCheckAll" :size="24" v-if="this.options.i==(this.options.questions.length-1)"></svg-icon>
                        <svg-icon type="mdi" :path="mdi.mdiSkipNext" :size="24" v-else></svg-icon>
                    </button>
                </div>
            </div>
            <div class="card" v-else>
                <div class="card-title">
                    {{ options.points }} / {{ options.questions.length }}
                </div>
                <div class="card-options">
                    <div
                        v-for="(question, i) in options.questions" 
                        class="card-option"
                        :key="i">
                        <strong
                            :style="{
                                color:question.correct?'var(--success)':'var(--secondary)'
                            }"    
                        >
                            {{ i }}.
                        </strong>
                        <span>
                            {{ question.title+' '+question.selectedOption }}
                        </span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="next-question" @click="nextQuestion()">
                        <svg-icon type="mdi" :path="mdi.mdiRestore" :size="24"></svg-icon>
                    </button>
                </div>
            </div>
        </div>
        <div class="combo" v-if="currentMode=='Combos'">
            {{ combos.currentQuestion }}
        </div>
    </div>
</template>

<script>
import SvgIcon from '@jamescoyle/vue-icon';
import { mdiOrbitVariant, mdiSkipNext, mdiMenu, mdiCheckAll, mdiRestore } from '@mdi/js';

export default {
    name: 'kTest',
    components: {
        SvgIcon,
    },
    props: {
        sequence: Object,
        vertices: Object,
        nodes: Object
    },
    data() {
        return {
            mdi: {
                mdiOrbitVariant : mdiOrbitVariant,
                mdiSkipNext : mdiSkipNext,
                mdiMenu : mdiMenu,
                mdiCheckAll : mdiCheckAll,
                mdiRestore : mdiRestore,
            },
            modes: ["Anki", "Options", "Combos"],
            currentMode: null,
            anki: {
                currentQuestion: null,
                show: true,
                questions: [],
                blank: 0,
            },
            options: {
                questions: [],
                points: 0,
                i: 0,
            },
            combos: {
                currentQuestion: null,
                combos: [],
                correct: 0,
            }
        }
    },
    methods: {
        shuffle(arr) {
            for(let i=arr.length-1; i>=0; i--) {
                let j = Math.floor(Math.random()*(i+1))
                let temp = arr[i]
                arr[i] = arr[j]
                arr[j] = temp
            }
            return arr
        },
        getVertexByID(id) {
            return this.vertices.filter((v)=>v.pk==id)[0]
        },
        buildSeq() {
            let nodeKeys = Object.keys(this.nodes)
            let randomNode = nodeKeys[Math.floor(Math.random()*nodeKeys.length)]
            this.combos.currentQuestion = randomNode

            let sequence = [randomNode]
            while(this.nodes[sequence[0]].parent) {
                sequence.unshift(this.nodes[sequence[0]].parent)
            }
            while(this.nodes[sequence[sequence.length-1]].vertices.length) {
                let vertices = this.nodes[sequence[sequence.length-1]].vertices
                let randomChild = vertices[Math.floor(Math.random()*vertices.length)]
                sequence.push(randomChild)
            }

            return sequence
        },
        randomNode() {
            let nodeKeys = Object.keys(this.nodes)
            let randomNode = nodeKeys[Math.floor(Math.random()*nodeKeys.length)]
            return this.nodes[randomNode]
        },
        generateAnki() {
            if(this.sequence) {
                if(this.sequence.vertices.length) {
                    if(this.anki.show) {
                        this.anki.show = false
                        let i = Math.floor(Math.random()*this.sequence.vertices.length)
                        this.anki.currentQuestion = [
                            this.getVertexByID(this.sequence.vertices[i]).obj.id,
                            this.getVertexByID(this.sequence.vertices[i]).id,
                            this.getVertexByID(this.sequence.vertices[i]).sub.id,
                        ]
                        this.anki.blank = Math.floor(Math.random()*3)
                    }
                    else {
                        this.anki.show = true
                    }
                }
            }
            else {
                if(this.anki.show) {
                    this.anki.show = false
                    let i = Math.floor(Math.random()*this.vertices.length)
                    this.anki.currentQuestion = [
                        this.vertices[i].obj.id,
                        this.vertices[i].id,
                        this.vertices[i].sub.id,
                    ]
                    this.anki.blank = Math.floor(Math.random()*3)
                }
                else {
                    this.anki.show = true
                }
            }
        },
        resetAnki() {
            this.anki = {
                currentQuestion: null,
                show: true,
                questions: [],
                blank: 0,
            }
        },
        selectOption(option) {
            let currentOption = this.options.questions[this.options.i].selectedOption
            if(currentOption==option) {
                this.options.questions[this.options.i].selectedOption = null
            }
            else {
                this.options.questions[this.options.i].selectedOption = option
            }
        },
        nextQuestion() {
            let i = this.options.i
            if(i==this.options.questions.length) {
                this.generateOptions()
            }
            else {
                let vertex = this.getVertexByID(this.sequence.vertices[i])
                let correct = this.options.questions[i].selectedOption==vertex.sub.id
                this.options.questions[i].correct = correct
                if(correct) {
                    this.options.points++
                }
                this.options.i += 1
            }
        },
        calcOptions(option) {
            let nodes = Object.keys(this.nodes)
            let similar = nodes.filter((n)=>n.includes(option)||option.includes(n))
            let siblings = this.nodes[option].parent.vertices
            return Array.from(new Set(similar.concat(siblings))).filter(e=>e!=option&&e)
        },
        generateOptions() {
            this.options =  {
                questions: [],
                points: 0,
                i: 0,
            }
            for(let i=0;i<this.sequence.vertices.length;i++) {
                let vertex = this.getVertexByID(this.sequence.vertices[i])
                let fillerOptions = this.calcOptions(vertex.sub.id)
                let question = {
                    title: vertex.obj.id+' '+vertex.id,
                    options: this.shuffle([vertex.sub.id].concat(fillerOptions)),
                    selectedOption: null,
                    correct: false,
                }
                this.options.questions.push(question)
            }
        },
        scrambleProposition(proposition) {
            let operations = [
                Math.floor(Math.random()*2),
                Math.floor(Math.random()*2),
                Math.floor(Math.random()*2),
                Math.floor(Math.random()*2)
            ]
            let scrambled = proposition
            let isTrue = true
            if(operations[0]) {
                let node = scrambled.obj
                while(node.id==scrambled.sub.parent) {
                    node = this.randomNode()
                }
                scrambled.obj = node
                isTrue = false
            }
            if(operations[1]) {
                let node = scrambled.sub
                while(scrambled.obj.vertices.includes(node.id)) {
                    node = this.randomNode()
                }
                scrambled.sub = node
                isTrue = false
            }
            return isTrue
        },
        generateCombos(grade) {
            if(this.vertices.length<grade) return

            let propositions = []
            while(propositions.length<grade) {
                let proposition = this.vertices[Math.floor(Math.random()*this.vertices.length)]
                if(!propositions.includes(proposition)) {
                    propositions.push(proposition)
                }
            }
            
            this.scrambleProposition()
        },
    },
    watch: {
        currentMode() {
            if(this.currentMode=='Anki') {
                this.generateAnki()
            }
            else if(this.currentMode=='Options') {
                this.generateOptions()
            }
            else if(this.currentMode=='Combos') {
                this.generateCombos(2)
            }
        },
        sequence() {
            this.currentMode = null
        }
    }
}
</script>
  
<style>
 #test {
    height: 100%;
    width: 100%;
 }
 .select-modes {
    display: flex;
    justify-content: center;
    gap: 20px;
    align-items: center;
    flex-direction: column;
    height: 100%; 
    width: 100%;
 }
 .select-mode {
    height: 30px;
    width: 100px;
    border: 2px double var(--primary);
    background: var(--background);
 }
 .select-mode:hover {
    background: var(--background-alt);
 }
 .open-menu {
    z-index: 5;
 }

 .anki, .options {
    height: 100%; 
    width: 100%;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
 }
 .card {
    height: 50%;
    aspect-ratio: 12/9;
    box-shadow: 1px 1px 3px var(--text);
    position: relative;
    display: flex;
    justify-content: center;
    gap: 10px;
    align-items: center;
 }
 .placeHolder {
    font-size: 20px;
    border: 1px solid var(--background);
 }
 .flip-anki, .skip-next, .open-menu {
    position: absolute;
    height: 24px;
    width: 24px;
    top: 5px;
    right: 5px;
    border: none;
    background: none;
    color: var(--primary);
    padding: 0px;
 }
 .skip-next {
    top: unset;
    bottom: 10px;
 }

 .options .card {
    aspect-ratio: 9/12;
    height: 80%;
    display: block;
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
 .card-actions {
    height: 50px;
    width: 100%;
    display: flex;
    justify-content: flex-end;
    box-sizing: border-box;
    padding: 20px;
    align-items: center;
 }
 .next-question {
    height: 24px;
    width: 24px;
    border: none;
    background: none;
    color: var(--primary);
    padding: 0px;
 }
</style>
  