const mongoose = require('mongoose');

// Middleware setup (no need for Express server with Vercel)
const cors = require('cors');

// MongoDB Atlas URIs and Schemas remain the same as in your original server.js
const articleSchema = new mongoose.Schema({
    article_number: String,
    title: String,
    content: String,
});

// Schemas
let ExecutiveArticle, JudiciaryArticle, LegislatureArticle;

// MongoDB Atlas URIs
const atlasUris = {
    Executive: 'mongodb+srv://Kaviya:Kaviya1234@cluster0.jyx09.mongodb.net/Executive?retryWrites=true&w=majority&appName=Cluster0',
    Judiciary: 'mongodb+srv://Kaviya:Kaviya1234@cluster0.jyx09.mongodb.net/Judiciary?retryWrites=true&w=majority&appName=Cluster0',
    Legislature: 'mongodb+srv://Kaviya:Kaviya1234@cluster0.jyx09.mongodb.net/Legislature?retryWrites=true&w=majority&appName=Cluster0',
};

let cachedConnections = {}; // Cache to avoid reconnecting multiple times

async function connectToDatabase(dbName) {
    if (cachedConnections[dbName]) return cachedConnections[dbName]; // Use cached connection if available
    
    try {
        const uri = atlasUris[dbName];
        const connection = await mongoose.createConnection(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`${dbName} database connected`);
        
        if (dbName === 'Executive') ExecutiveArticle = connection.model('articles', articleSchema);
        if (dbName === 'Judiciary') JudiciaryArticle = connection.model('articles', articleSchema);
        if (dbName === 'Legislature') LegislatureArticle = connection.model('articles', articleSchema);

        cachedConnections[dbName] = connection; // Cache the connection
        return connection;
    } catch (error) {
        console.error('Database connection error:', error.message);
        throw new Error('Failed to connect to the database');
    }
}

// Main API handler
module.exports = async (req, res) => {
    if (req.method === 'POST') {
        const { database, action } = req.body;
        
        if (action === 'connect') {
            try {
                await connectToDatabase(database);
                return res.status(200).json({ message: `${database} database connected` });
            } catch (error) {
                return res.status(500).json({ message: error.message });
            }
        }
    } else if (req.method === 'GET') {
        const { database } = req.query;
        
        try {
            if (database === 'Executive') {
                if (!ExecutiveArticle) await connectToDatabase('Executive');
                const articles = await ExecutiveArticle.find();
                return res.status(200).json(articles);
            }
            if (database === 'Judiciary') {
                if (!JudiciaryArticle) await connectToDatabase('Judiciary');
                const articles = await JudiciaryArticle.find();
                return res.status(200).json(articles);
            }
            if (database === 'Legislature') {
                if (!LegislatureArticle) await connectToDatabase('Legislature');
                const articles = await LegislatureArticle.find();
                return res.status(200).json(articles);
            }
        } catch (error) {
            return res.status(500).json({ message: 'Error fetching articles', error: error.message });
        }
    } else {
        return res.status(405).json({ message: 'Method not allowed' });
    }
};
