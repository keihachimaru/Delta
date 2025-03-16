const fs = require("fs");
const path = require("path");
const DATA_FILE = path.join(__dirname, "data.json");

const { Graph, Exam } = require('../models/models.js')

// Function to read data from JSON file
const readData = () => {
    try {
        const data = fs.readFileSync(DATA_FILE, "utf8");
        return JSON.parse(data);
    } catch (error) {
        const data = defaultData()
        writeData(data)
        return data;
    }
};

// Function to write data to JSON file
const writeData = (data) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    } catch (error) {
        console.error("Error writing JSON file:", error);
    }
};

const defaultData = () => {
    let graph = new Graph()
    let exam = new Exam('', graph)
    let data = {graph:graph.serialize(), text:'', exam:exam}
    return data
}

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


module.exports = {readData, writeData, shuffle}