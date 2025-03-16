const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const { readData, writeData } = require('./utils/utils.js')
const { Graph, Exam } = require('./models/models.js')

// Route to get data
app.get("/graph", (req, res) => {
    const data = readData();
    res.json(data);
});

// Route to add new data
app.post("/graph/update", (req, res) => {
    const newData = req.body.content;
    const data = readData();
    let graph = new Graph()
    graph.load(data)
    graph.update(newData)
    writeData({graph: graph, text: newData, exam: data.exam})
    res.status(201).json({ message: "update", data: graph.serialize() });
});


app.post("/graph/exam", (req, res) => {
    const newData = req.body.content;
    const data = readData();
    const graph = new Graph()
    graph.load(data)
    let exam = new Exam('', graph)
    exam.load(data.exam)
    exam.content = data.text
    let question = exam.parseLine()
    writeData({graph: graph.serialize(), text: data.text, exam: exam.serialize()})
    res.status(201).json({ message: "update", data: question });
})

app.post("/graph/answer", (req, res) => {
    const newData = req.body.content;
    const data = readData();
    const graph = new Graph()
    graph.load(data)
    let exam = new Exam(data.text, graph)
    exam.load(data.exam)
    exam.answer(newData)
    writeData({graph: graph.serialize(), text: data.text, exam: exam.serialize()})
    res.status(201).json({ message: "update", data: exam.getStats() });
})

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

/*
.
:
#
=
\t
,
*/
//ALIAS AFECTEN A ALIAS