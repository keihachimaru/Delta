
const shuffle = (seq) => {
    for (let i = seq.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [seq[i], seq[j]] = [seq[j], seq[i]];
    }
    return seq;
};

const levenshtein = (a, b) => {
    let tmp;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    if (a.length > b.length) {
        tmp = a;
        a = b;
        b = tmp;
    }

    let row = Array(a.length + 1).fill(0).map((_, i) => i);

    for (let i = 1; i <= b.length; i++) {
        let prev = i;
        for (let j = 1; j <= a.length; j++) {
            let val = b[i - 1] === a[j - 1] ? row[j - 1] : Math.min(row[j - 1], prev, row[j]) + 1;
            row[j - 1] = prev;
            prev = val;
        }
        row[a.length] = prev;
    }
    return row[a.length];
}

class Node {
    constructor(name) {
        this.id = Math.floor(Math.random() * 100000) 
        this.name = name
        this.vertices = {
            out : [],
            in : []
        };
        this.ancestors = []
        this.descendants = []
        this.isSet = false
        this.alias = [this.id]
    }
    toString(graph) {
        let ancestors = this.ancestors.map(a=>graph.nodesMap[a].name).join('.')
        return ancestors.length?ancestors+'.'+this.name:this.name
    }
    similarity(a) {
        let commonVerticesInA = (a.vertices.in.filter(v=>this.vertices.in.includes(v)).length + 1)*3
        let commonVerticesOutA = (a.vertices.out.filter(v=>this.vertices.out.includes(v)).length + 1)*3

        let commonVerticesInOutA = (a.vertices.in.filter(v=>this.vertices.out.includes(v)).length + 1)
        let commonVerticesOutInA = (a.vertices.out.filter(v=>this.vertices.in.includes(v)).length + 1)

        let commonAncestorsA = a.ancestors.filter(v=>this.ancestors.includes(v)).length*10
        let maxLenA = a.name.length>this.name.length?a.name.length:this.name.length
        let regexSimilarityA = 1 - (levenshtein(a.name, this.name) / maxLenA)

        let isAlias = this.alias.includes(a.id) || a.alias.includes(this.id) ? 10000 : 0
        let score = isAlias+commonAncestorsA+commonVerticesInA+commonVerticesOutA+commonVerticesInOutA+commonVerticesOutInA+regexSimilarityA
        if(a.name==this.name) score=-10000

        return score
    }
    similar(nodePool) {
        let ourNodePool = nodePool.filter(n=>!this.ancestors.includes(n.id))
        let similar = ourNodePool.sort((a, b)=>{
            let aScore = this.similarity(a)
            let bScore = this.similarity(b)

            return bScore-aScore

        })
        return similar
    }
    add(contents, graph) {
        let context = this.descendants.map(d=>graph.nodesMap[d])
        for (let i = 0; i < contents.length; i++) {
            let node = graph.addNode(contents[i], context)
            node.ancestors = this.ancestors.concat([this.id])
            this.descendants.push(node.id) 
        }
    }
    serialize() {
        return {
            id : this.id,
            name: this.name,
            vertices : this.vertices,
            ancestors : this.ancestors,
            descendants : this.descendants,
            alias : this.alias,
            isSet : this.isSet,
        }
    }
    load(data) {
        this.id = data.id
        this.name = data.name
        this.vertices = data.vertices
        this.ancestors = data.ancestors
        this.descendants = data.descendants
        this.alias = data.alias
        this.isSet = data.isSet

        return this
    }
}

class Relation {
    constructor(name, obj, sub) {
        this.obj = obj?obj.id:0
        this.sub = sub?sub.id:0
        this.attrs = []
        this.id = Math.floor(Math.random() * 100000) 
        this.name = name
        this.directed = true
        this.order = 0
    }
    toString() {
        return [this.obj, this.sub, this.name]
    }
    serialize() {
        return {
            obj : this.obj,
            sub : this.sub,
            attrs : this.attrs,
            id : this.id,
            name : this.name,
            directed : this.directed,
            order: this.order
        }
    }
    load(data) {
        this.obj = data.obj
        this.sub = data.sub
        this.attrs = data.attrs
        this.id = data.id
        this.name = data.name
        this.order = data.order
        this.directed = data.directed
        return this
    }
}

class Graph {
    constructor() {
        this.nodes = [] 
        this.vertices = [] 
        this.nodesMap = {}
        this.verticesMap = {}

        this.sequences = []
    }
    //ALIAS
    detectBracket(str) {
        const regex = /\[([^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)*)\]/g;;
        let matches = [];
        let match;
    
        while ((match = regex.exec(str)) !== null) {
            matches.push(match[1].trim());
        }
    
        if (matches.length > 0) {
            return matches;
        }
        return []
    }
    splitByStrings(str, delimiters) {
        const regex = new RegExp(delimiters.map(d => `(${d})`).join('|'), 'g');
        
        return str.split(regex).filter(Boolean);
    }
    process(line, result) {
        const match = line.match(/^(\t*)/)
        let newTab = match ? match[0].length : 0

        const regex = /(:s:|:d:|:l:|::|:[^:]+:)/g
        let sections = line.split(regex).filter(Boolean)
        for(let i=0;i<sections.length; i++) {
            let piece = sections[i]
            let brackets = this.detectBracket(piece)
            if(brackets.length) {
                let others = this.splitByStrings(piece, brackets).filter(o=>!brackets.includes(o))
                others[0] = others[0].slice(0,-1).trim()
                for(let i=1;i<others.length-1;i++) {
                    others[i] = others[i].slice(1,-1).trim()
                }
                others[others.length-1] = others[0].slice(1).trim()

                let valid = []
                for(let i=0;i<others.length;i++) {
                    let str = others[i].split(i).slice(0,-1)
                    valid.push(str.join(', '))
                }
                brackets.forEach((bracket)=> {
                    this.process('\t'.repeat(newTab+1)+bracket, result)
                })
            }
            else {
                result.push(piece)
            }
        }
        return result
    }
    preprocess(lines) {
        let processed = []
        for(let i=0;i<lines.length; i++) {
            let result = []
            this.process(lines[i], result)
            result = result.map(r=>r.startsWith('\t')?'\n'+r:r)
            processed.push('\n'+result.join(''))
        }
        return processed.join('').trim()
    }
    update(content) {
        this.reset()
        let lines = content.toLowerCase().split('\n')
        lines = this.preprocess(lines).split('\n')
        let lastLine = ""
        let order = 0
        let tab = []
        let lastNodes = null
        let lastRel = null

        for(let i=0;i<lines.length; i++) {
            const match = lines[i].match(/^(\t*)/)
            let newTab = match ? match[0].length : 0
            if(tab.length<newTab) {
                tab.push([lastNodes, lastRel])
            }
            else if(tab.length>newTab) {
                order = 0
                tab.pop()
            }

            lastNodes = null
            lastRel = null

            if(tab.length) {
                lastNodes = tab[tab.length-1][0]
                lastRel = tab[tab.length-1][1]
            }

            let line = lines[i]
            const regex = /(:s:|:d:|:l:|::|:[^:]+:)/g
            line = line.split(regex).filter(Boolean)

            for(let j=0;j<line.length; j++) {
                let rel = regex.test(line[j])
                if(rel) {
                    lastRel = line[j]
                }
                else {
                    let nodesStr = line[j].split(',').map(n=>n.trim())
                    let currNodes = nodesStr.map(n=>this.addNode(n))
                    if(lastRel) {
                        let name = lastRel.replace(/:/g, '')
                        if(name=='s') {
                            lastNodes.forEach((n)=>{
                                n.isSet = true
                                n.add(nodesStr, this)
                            })
                        }
                        else if(name=='l') {
                            lastNodes.forEach((n)=>{
                                currNodes.forEach((c)=>{
                                    this.addVertex(n.id, c.id, name, order)
                                    order ++
                                })
                            })
                        }
                        else if(name=='d') {
                            lastNodes.forEach((n)=>{
                                n.alias = n.alias.concat(currNodes.map(n=>n.id))
                                currNodes.forEach((c)=>{
                                    c.alias.push(n.id)
                                })
                            })
                        }
                        else {
                            lastNodes.forEach((n)=>{
                                currNodes.forEach((c)=>{
                                    this.addVertex(n.id, c.id, name)
                                })
                            })
                        }
                    }
                    lastNodes = currNodes
                }
            }
        }
    }
    getNode(name, context) {
        return context.find(n=>n.name==name)
    }
    addNode(name) {
        name = name.split('.')
        let prev = null
        let context = this.nodes
        for(let i=0;i<name.length-1;i++) {
            let node = this.getNode(name[i], context)
            if(!node) {
                let ancestors = !prev?[]:prev.ancestors.concat([prev.id])
                node = new Node(name[i])
                this.nodes.push(node)
                node.ancestors = ancestors
                node.isSet = true
                if(prev) prev.descendants.push(node.id)
                this.nodesMap[node.id] = node
            }
            prev = node
        }

        let last = name[name.length-1]
        let node = this.getNode(last, context)
        if(!node) {
            let ancestors = !prev?[]:prev.ancestors.concat([prev.id])
            node = new Node(last)
            this.nodes.push(node)
            node.ancestors = ancestors
            if(prev) prev.descendants.push(node.id)
            this.nodesMap[node.id] = node
        }
        else {
        }
        
        return node
    }
    getLeafs(node) {
        let leaves = [];
        if (!node.descendants || node.descendants.length === 0) {
            leaves.push(node);
        } else {
            for (let child of node.descendants) {
                let node = this.nodes.find(n=>n.id==child)
                leaves.push(...this.getLeafs(node));
            }
        }
    
        return leaves;
    }
    addVertex(objStr, subStr, name, order=0) {
        let vertices = []

        objStr = typeof objStr === 'number' ? this.nodesMap[objStr].toString(this):objStr
        subStr = typeof subStr === 'number' ? this.nodesMap[subStr].toString(this):subStr

        let obj = [this.addNode(objStr)]
        if(obj[0].descendants.length) {
            obj = this.getLeafs(obj[0]).flat()
        }

        let sub = [this.addNode(subStr)]
        if(sub[0].descendants.length) {
            sub = this.getLeafs(sub[0]).flat()
        }

        for(let i=0;i<obj.length;i++) {
            for(let j=0;j<sub.length;j++) {
                let objNode = obj[i]
                let subNode = sub[j]

                let vertex = new Relation(name, objNode, subNode);
                vertex.order = order
                this.verticesMap[vertex.id] = vertex
                this.vertices.push(vertex)
                
                if(vertex.directed) {
                    objNode.vertices.out.push(vertex.id)
                    subNode.vertices.in.push(vertex.id)
                }
                else {
                    objNode.vertices.out.push(vertex.id)
                    subNode.vertices.in.push(vertex.id)

                    objNode.vertices.in.push(vertex.id)
                    subNode.vertices.out.push(vertex.id)
                }

            } 
        }

        return vertices
    }
    getNodesData() {
        return this.nodes.map(n => n.toString(this))
    }
    getVerticesData() {
        return this.vertices.map(v => v.toString())
    }
    reset() {
        this.nodes = [] 
        this.vertices = [] 
        this.nodesMap = {}
        this.verticesMap = {}
    }
    addSequence(length) {
        let sequence = new Sequence(length)
        this.sequences.push(sequence)
    }
    generateSequence(previous, len) {
        if(!previous) {
            return new Sequence(len)
        }
        return previous.generateFromPrev(previous, this)
    }
    serialize() {
        return {
            nodes : this.nodes.map(n=>n!=null?n.serialize():n),
            vertices : this.vertices.map(v=>v.serialize()),
            sequences : this.sequences.map(s=>s.serialize())
        }
    }
    load(data) {
        data = data.graph
        this.nodes = data.nodes.map(n=>new Node(n.id).load(n))
        this.vertices = data.vertices.map(v=>new Relation(v.id).load(v))
        this.sequences = data.sequences.map(s=>new Sequence(s.id).load(s))
    }
    locateNode(deepness, index, direction='vertical') {
        if(direction=='vertical') {
            let node = Array.from(this.nodes.filter(n=>n.ancestors.length==deepness))
            return node[index]
        }
        else if(direction=='horizontal') {
            let nodes = Array.from(this.nodes.filter(n=>n.vertices.in.length==0))
            while(deepness>0) {
                let pool = nodes.map(n=>this.verticesMap[n].sub)
                nodes = pool.map(p=>this.nodesMap[p])
                deepness--
            }
            return nodes[index]
        }
    }
    getOrigin() {
        return this.locateNode(0, 0, 'vertical')
    }
}

//:$ Orden
//:$ Siguiente
//#  Pertenece
//#  Es este el set
//:  True/False

class Sequence {

}

class Exam {
    constructor(content, graph) {
        this.content = content 
        this.questions = []
        this.graph = graph
        this.curr = Math.floor(Math.random()*this.content.split('\n').length)
        this.errors = []
        this.aparitions = []
    }
    shuffle(seq) {
        for (let i = seq.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [seq[i], seq[j]] = [seq[j], seq[i]];
        }
        return seq;
    }
    detectBracket(str) {
        const regex = /\[([^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)*)\]/g;;
        let matches = [];
        let match;
    
        while ((match = regex.exec(str)) !== null) {
            matches.push(match[1].trim());
        }
    
        if (matches.length > 0) {
            return matches;
        }
        return [str]
    }
    count(arr, num) {
        return arr.reduce((count, val) => count + (val === num ? 1 : 0), 0);
    }
    priority(node) {
        let errors = this.count(this.errors, node.id)
        let aparitions = this.count(this.aparitions,node.id)

        for(let i=0;i<node.descendants.length; i++) {
            errors += this.count(this.errors, node.descendants[i])
            aparitions += this.count(this.errors, node.descendants[i])
        }

        return errors-aparitions
    }
    getSimilar(node) {
        let similars = shuffle([...node.similar(this.graph.nodes).filter(s=>s.name.trim()!=node.name.trim()).slice(0, 5)])

        similars = similars.sort((a, b)=>{
            let scoreA = this.priority(a)
            let scoreB = this.priority(b)

            return scoreB - scoreA
        })

        return similars[0]
    }
    shuffleSequence(seq, level) {
        let indices = Array.from({length: seq.length}, (item, index) => index)
        let shuffledIndices = shuffle(indices)

        let shuffled = [...seq]

        for(let i=0; i<level; i++) {
            let index = shuffledIndices[i]
            let node = this.graph.nodes.find(n=>n.id==shuffled[index])
            shuffled[index] = this.getSimilar(node)
        }

        return shuffled.map(n=>n.name?n.name:this.graph.nodes.find(g=>g.id==n).name)
    }
    parseLine() {
        let line = this.content.split('\n')[this.curr].toLowerCase()
        let optionsNum = 4

        const regex = /(:s:|:d:|:l:|::|:[^:]+:)/g
        let sections = line.split(regex).filter(Boolean).filter(s=>!s.includes(':'))

        let nodePool = []
        for(let i=0; i<sections.length; i++) {
            let brackets = this.detectBracket(sections[i])
            let nodeStrngs = brackets.map(b=>b.split(',')).flat()
            nodePool = nodePool.concat(nodeStrngs)
        }
        nodePool = nodePool.map(n=>this.graph.addNode(n).id)
        let original = nodePool.map(n=>this.graph.nodes.find(g=>g.id==n).name)

        let options = [original]
        let level = 1//nodePool.length
        for(let i=0; i<optionsNum; i++) {
            options.push(this.shuffleSequence(nodePool, level))
        }
        let affectedNodes = [...new Set(options.flat().map(n=>this.graph.nodes.find(g=>g.name==n.trim()).id))]
        let formattedOptions = []
        for(let i=0;i<options.length;i++) {
            let option = options[i]
            let formatted =  line
            for(let j=0;j<option.length;j++) {
                formatted = formatted.replace(original[j].trim(), option[j].trim())
            }
            formattedOptions.push(formatted)
        }
        let correct = formattedOptions[0]
        formattedOptions = shuffle([...formattedOptions])
        let question =  {
            question : 'Elija la correcta',
            options : formattedOptions,
            correct : [formattedOptions.indexOf(correct)],
            answer : null,
            nodes: affectedNodes,
        }
        this.questions.push(question)
        return question
    }
    load(exam) {
        this.content = exam.content
        this.questions = exam.questions
        this.curr = exam.curr
        this.errors = exam.errors
        this.aparitions = exam.aparitions
    }
    serialize() {
        return {
            content : this.content,
            questions : this.questions,
            curr : this.curr,
            errors : this.errors,
            aparitions : this.aparitions,
        }
    }
    getStats() {
        let nodes = {}
        for(let i=0;i<this.aparitions.length; i++) {
            let id=this.aparitions[i]
            if(nodes.hasOwnProperty(id)) {
                nodes[id].aparitions += 1
            }
            else {
                nodes[id] = {
                    aparitions : 1,
                    errors: 0,
                    name: this.graph.nodes.find(n=>n.id==id).name
                }
            }
        }
        for(let i=0;i<this.errors.length; i++) {
            let id=this.aparitions[i]
            nodes[id].errors += 1
        }
        return nodes
    }
    answer(newData) {
        this.questions[this.questions.length-1].answer = newData
        let newErrors = this.questions[this.questions.length-1].nodes
        let question = this.questions[this.questions.length-1]
        if(newData[0]!=question.correct[0]) {
            this.errors = this.errors.concat(newErrors)
        }
        this.aparitions = this.aparitions.concat(newErrors)
    }
}

module.exports = {
    Node,
    Set,
    Relation,
    Sequence,
    Graph, 
    Exam
};